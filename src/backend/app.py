import sys
import os

# Make sure current directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any

from config import DEFAULT_MODEL_PARAMS, API_PORT, DEBUG, API_HOST
from models import get_model, get_available_models, get_model_info, get_supported_resolutions, is_model_cached
from utils import save_image, validate_image_params, config_loader

app = Flask(__name__)

# Add CORS support - allow requests from all origins
CORS(app, origins=["http://localhost:5123", "http://127.0.0.1:5123", "*"])

def process_request_params(data: Dict[str, Any], model_id: str = None) -> Dict[str, Any]:
    """Processes request parameters and combines them with default values."""
    params = DEFAULT_MODEL_PARAMS.copy()
    
    # If model is specified, get its recommended parameters
    if model_id:
        model_info = get_model_info(model_id)
        if model_info and 'recommended_params' in model_info:
            recommended_params = model_info['recommended_params']
            # Only update default values, user input takes priority
            for key, value in recommended_params.items():
                if key in params and key not in data:
                    params[key] = value
    
    # Update with user input
    params.update({
        "prompt": data.get("prompt"),
        "height": int(data.get("height", params["height"])),
        "width": int(data.get("width", params["width"])),
        "guidance_scale": float(data.get("guidance_scale", params["guidance_scale"])),
        "num_inference_steps": int(data.get("num_inference_steps", params["num_inference_steps"])),
        "negative_prompt": data.get("negative_prompt", params["negative_prompt"]),
        "output_dir": data.get("output_dir", params["output_dir"]),
    })
    return params

@app.route("/generate", methods=["POST"])
def generate_image():
    """Image generation endpoint."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "JSON data required"}), 400
        
        if not data.get("prompt"):
            return jsonify({"error": "Prompt required"}), 400

        # Model selection (from default config)
        app_config = config_loader.load_app_config()
        default_model = app_config.get('defaults', {}).get('model', 'dreamshaper_8')
        model_id = data.get("model", default_model)
        
        # Prepare parameters
        params = process_request_params(data, model_id)
        
        # Parameter validation
        is_valid, error_message = validate_image_params(params)
        if not is_valid:
            return jsonify({"error": error_message}), 400

        # Load model
        try:
            model = get_model(model_id)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
        # Use model's suggested negative prompt (if user hasn't specified one)
        if not params.get("negative_prompt") and hasattr(model, 'get_suggested_negative_prompt'):
            suggested_negative = model.get_suggested_negative_prompt()
            if suggested_negative:
                params["negative_prompt"] = suggested_negative

        params_without_output_dir = params.copy()
        params_without_output_dir.pop("output_dir")

        # Generate image
        image = model.generate(**params_without_output_dir)

        filename = save_image(image=image, output_dir=params["output_dir"])

        # Return model information as well
        model_info = get_model_info(model_id)
        response_data = {
            "filename": filename,
            "model_used": model_id,
            "model_name": model_info.get('name', model_id) if model_info else model_id,
            "params_used": params_without_output_dir
        }

        return jsonify(response_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/models", methods=["GET"])
def get_models():
    """Returns all available models."""
    try:
        models = get_available_models()
        
        # Prepare cleaner format for frontend
        models_list = []
        for model_id, model_config in models.items():
            models_list.append({
                "id": model_id,
                "name": model_config.get('name', model_id),
                "description": model_config.get('description', ''),
                "group": model_config.get('group', 'standard'),
                "recommended_params": model_config.get('recommended_params', {}),
                "suggested_negative_prompt": model_config.get('suggested_negative_prompt', '')
            })
        
        return jsonify({
            "models": models_list,
            "total": len(models_list),
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/resolutions", methods=["GET"])
def get_resolutions():
    """Returns all available resolutions."""
    try:
        supported_resolutions = get_supported_resolutions()
        
        
        return jsonify(supported_resolutions)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Application health check."""
    try:
        models_count = len(get_available_models())
        return jsonify({
            "status": "healthy",
            "models_loaded": models_count
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@app.route('/api/models/<model_id>/cache-status', methods=['GET'])
def check_model_cache_status(model_id):
    """Check if model is cached/downloaded"""
    try:
        print(f"[API] Checking cache status for model: {model_id}")
        
        # Check if model exists in config
        available_models = get_available_models()
        if model_id not in available_models:
            return jsonify({'error': f'Model {model_id} not found'}), 404
        
        # Check cache status
        is_cached = is_model_cached(model_id)
        
        print(f"[API] Model {model_id} cache status: {'cached' if is_cached else 'not cached'}")
        
        return jsonify({
            'model_id': model_id,
            'is_cached': is_cached,
            'cache_status': 'cached' if is_cached else 'not_cached'
        })
        
    except Exception as e:
        print(f"[API] Error checking cache status for {model_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

def init_app():
    """Application startup configuration."""
    return app

if __name__ == "__main__":
    server = init_app()
    server.run(host=API_HOST, port=API_PORT, debug=DEBUG)
