from diffusers import StableDiffusionPipeline, StableDiffusionXLPipeline
import torch
import os
import sys
from typing import Any, Dict, Type, Callable, Optional
from utils import get_device
from utils.config_loader import config_loader
import logging
from transformers import logging as transformers_logging

# Configure logging for better visibility
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set transformers verbosity for progress tracking
transformers_logging.set_verbosity_info()

# Set environment variables for better progress visibility
os.environ['TRANSFORMERS_VERBOSITY'] = 'info'
os.environ['HF_HUB_VERBOSITY'] = 'info'
os.environ['TQDM_DISABLE'] = '0'  # Enable tqdm progress bars

# Global progress callback function
_progress_callback: Optional[Callable[[str, float], None]] = None

# Global cache for models
_model_cache = {}

def set_progress_callback(callback: Callable[[str, float], None]):
    """Set the global progress callback function"""
    global _progress_callback
    _progress_callback = callback

def emit_progress(message: str, progress: float = None):
    """Emit progress message if callback is set"""
    print(f"[Progress] {message}" + (f" ({progress}%)" if progress else ""))
    sys.stdout.flush()
    if _progress_callback:
        _progress_callback(message, progress)

def is_model_cached(model_id: str) -> bool:
    """Check if model is already cached/downloaded and loadable"""
    global _model_cache
    
    # Check if model is in memory cache
    if model_id in _model_cache:
        return True
    
    # Check if model can actually be loaded (not just files exist)
    try:
        print(f"[INFO] Testing if model {model_id} can be loaded...")
        
        # Get model configuration
        models_config = config_loader.load_models_config()
        model_config = models_config.get('models', {}).get(model_id)
        
        if not model_config:
            print(f"[INFO] Model {model_id} not found in config")
            return False
            
        huggingface_id = model_config.get('huggingface_id')
        if not huggingface_id:
            print(f"[INFO] No huggingface_id for model {model_id}")
            return False
        
        # Try to load model pipeline class
        pipeline_class_name = model_config.get('pipeline_class', 'StableDiffusionPipeline')
        if pipeline_class_name == 'StableDiffusionPipeline':
            from diffusers import StableDiffusionPipeline
            pipeline_class = StableDiffusionPipeline
        elif pipeline_class_name == 'StableDiffusionXLPipeline':
            from diffusers import StableDiffusionXLPipeline
            pipeline_class = StableDiffusionXLPipeline
        else:
            print(f"[INFO] Unknown pipeline class: {pipeline_class_name}")
            return False
        
        # Test if model can be loaded (this is the key test!)
        # We try to load with local_files_only=True to avoid downloading
        print(f"[INFO] Testing model loading for {huggingface_id}...")
        
        # First try with local_files_only to see if it's fully cached
        test_pipe = pipeline_class.from_pretrained(
            huggingface_id,
            torch_dtype=torch.float16,
            local_files_only=True,  # Only use local files, don't download
            low_cpu_mem_usage=True,  # Don't actually load to GPU
            device_map=None,  # Don't move to device
        )
        
        # If we got here, model is fully cached and loadable
        print(f"[INFO] Model {model_id} is fully cached and loadable")
        del test_pipe  # Clean up
        return True
        
    except Exception as e:
        # If any error occurs, model is not properly cached
        print(f"[INFO] Model {model_id} is not properly cached: {str(e)}")
        return False

class BaseModel:
    def __init__(self):
        self.device = get_device()
        self.pipe = None
        self.model_config = None

    def _load_model(self, model_id: str, model_class: Type[Any] = StableDiffusionPipeline, **kwargs) -> None:
        """Model loading operation with fallback for variant issues"""
        print(f"\n{'='*60}")
        print(f"Loading model: {model_id}")
        print(f"{'='*60}")
        
        try:
            emit_progress(f"Downloading model {model_id}...")
            emit_progress("This may take several minutes for the first time...", 10)
            
            print(f"Attempting to download from: {model_id}")
            print("Progress will be shown below...")
            sys.stdout.flush()
            
            # Try loading with provided kwargs first
            self.pipe = model_class.from_pretrained(
                model_id,
                torch_dtype=torch.float16,
                **kwargs
            ).to(self.device)
            
            emit_progress(f"Model {model_id} loaded successfully", 80)
            print(f"[OK] Model {model_id} loaded successfully!")
            
        except Exception as e:
            print(f"[ERROR] First attempt failed: {str(e)}")
            emit_progress(f"First attempt failed: {str(e)}")
            emit_progress(f"Trying fallback method for {model_id}...", 40)
            
            # Fallback: try loading without variant and safetensors
            fallback_kwargs = kwargs.copy()
            fallback_kwargs.pop('variant', None)
            fallback_kwargs.pop('use_safetensors', None)
            
            print(f"Trying fallback method for {model_id}...")
            emit_progress(f"Downloading model {model_id} with fallback method...")
            
            try:
                self.pipe = model_class.from_pretrained(
                    model_id,
                    torch_dtype=torch.float16,
                    **fallback_kwargs
                ).to(self.device)
                emit_progress(f"Model {model_id} loaded successfully with fallback method", 80)
                print(f"[OK] Model {model_id} loaded successfully with fallback method!")
            except Exception as fallback_error:
                print(f"[ERROR] Fallback loading also failed: {fallback_error}")
                emit_progress(f"Fallback loading also failed: {fallback_error}")
                raise fallback_error
                
        print("Optimizing model for inference...")
        emit_progress("Optimizing model for inference...", 85)
        self.pipe.enable_attention_slicing()
        emit_progress("Model optimization complete", 90)
        print("[OK] Model optimization complete")
        print(f"{'='*60}\\n")

    def generate(self, prompt: str, **kwargs) -> Any:
        if self.pipe is None:
            raise ValueError("Model can't be generated")
        return self.pipe(prompt, **kwargs).images[0]

    def get_recommended_params(self) -> Dict[str, Any]:
        """Returns recommended parameters for the model"""
        if self.model_config and 'recommended_params' in self.model_config:
            return self.model_config['recommended_params']
        return {}

    def get_supported_resolutions(self) -> list:
        """Returns supported resolutions for the model"""
        if self.model_config and 'supported_resolutions' in self.model_config:
            return self.model_config['supported_resolutions']
        return []

    def get_suggested_negative_prompt(self) -> str:
        """Returns suggested negative prompt for the model"""
        if self.model_config and 'suggested_negative_prompt' in self.model_config:
            return self.model_config['suggested_negative_prompt']
        return ""

class DynamicModel(BaseModel):
    """Model class loaded dynamically from config"""
    
    def __init__(self, model_config: Dict[str, Any]):
        super().__init__()
        global _model_cache
        
        self.model_config = model_config
        model_id = model_config.get('id')
        
        # Check if model is already in cache
        if model_id and model_id in _model_cache:
            print(f"[INFO] Using cached model: {model_id}")
            self.pipe = _model_cache[model_id]
            return
        
        # Determine pipeline class
        pipeline_class = self._get_pipeline_class(model_config.get('pipeline_class', 'StableDiffusionPipeline'))
        
        # Get Hugging Face model ID
        huggingface_id = model_config.get('huggingface_id')
        if not huggingface_id:
            raise ValueError(f"huggingface_id not found in model config: {model_config.get('id', 'unknown')}")
        
        # Prepare model loading parameters
        load_kwargs = self._prepare_load_kwargs(model_config)
        
        # Load model
        self._load_model(huggingface_id, pipeline_class, **load_kwargs)
        
        # Cache the model
        if model_id:
            _model_cache[model_id] = self.pipe
            print(f"[INFO] Model {model_id} cached for future use")

    def _get_pipeline_class(self, pipeline_class_name: str) -> Type[Any]:
        """Returns actual class from pipeline class name"""
        pipeline_classes = {
            'StableDiffusionPipeline': StableDiffusionPipeline,
            'StableDiffusionXLPipeline': StableDiffusionXLPipeline,
        }
        
        if pipeline_class_name not in pipeline_classes:
            raise ValueError(f"Unsupported pipeline class: {pipeline_class_name}")
        
        return pipeline_classes[pipeline_class_name]

    def _prepare_load_kwargs(self, model_config: Dict[str, Any]) -> Dict[str, Any]:
        """Prepares necessary kwargs for model loading"""
        kwargs = {}
        model_id = model_config.get('id')
        
        # Special settings for SDXL models
        if model_config.get('pipeline_class') == 'StableDiffusionXLPipeline':
            # Some models don't have fp16 variant, so we'll try it first but fallback gracefully
            kwargs.update({
                'variant': 'fp16',
                'use_safetensors': True
            })
            
            # Special cases for specific models that don't support fp16 variant
            problematic_models = [
                'animagine_xl',  # Known to have issues with fp16 variant
                'pixel_art_xl',  # May not have fp16 variant
            ]
            
            if model_id in problematic_models:
                print(f"Model {model_id} is known to have variant issues, will try fallback if needed")
        
        return kwargs

# Model factory - Now loaded dynamically from config
class ModelFactory:
    @staticmethod
    def get_available_models() -> Dict[str, Dict[str, Any]]:
        """Returns available models from config"""
        try:
            models_config = config_loader.load_models_config()
            return models_config.get('models', {})
        except Exception as e:
            print(f"Error loading model config: {e}")
            return {}

    @staticmethod
    def get_supported_resolutions() -> Dict[str, Any]:
        """Returns supported resolutions from config"""
        try:
            models_config = config_loader.load_models_config()
            return models_config.get('supported_resolutions', [])
        except Exception as e:
            print(f"Error loading model config: {e}")
            return []

    @staticmethod
    def create_model(model_id: str) -> BaseModel:
        """Creates model dynamically"""
        available_models = ModelFactory.get_available_models()
        
        if model_id not in available_models:
            available_model_ids = list(available_models.keys())
            raise ValueError(f"Unknown model: {model_id}. Available models: {available_model_ids}")
        
        model_config = available_models[model_id]
        return DynamicModel(model_config)

    @staticmethod
    def get_model_info(model_id: str) -> Dict[str, Any]:
        """Returns model information"""
        available_models = ModelFactory.get_available_models()
        if model_id not in available_models:
            return {}
        return available_models[model_id]

    @staticmethod
    def get_models_by_group(group: str = None) -> Dict[str, Dict[str, Any]]:
        """Filters models by specific group"""
        available_models = ModelFactory.get_available_models()
        
        if group is None:
            return available_models
        
        filtered_models = {
            model_id: model_config
            for model_id, model_config in available_models.items()
            if model_config.get('group') == group
        }
        
        return filtered_models

# Helper functions for easy access
def get_model(model_id: str) -> BaseModel:
    """Creates model based on specified model ID"""
    return ModelFactory.create_model(model_id)

def get_available_models() -> Dict[str, Dict[str, Any]]:
    """Returns all available models"""
    return ModelFactory.get_available_models()

def get_model_info(model_id: str) -> Dict[str, Any]:
    """Returns model information"""
    return ModelFactory.get_model_info(model_id)

def get_models_by_group(group: str = None) -> Dict[str, Dict[str, Any]]:
    """Filters models by group"""
    return ModelFactory.get_models_by_group(group)

def get_supported_resolutions() -> Dict[str, Any]:
    """Returns supported resolutions"""
    return ModelFactory.get_supported_resolutions()

# Export progress callback functions
__all__ = [
    'get_model', 
    'get_available_models', 
    'get_model_info', 
    'get_models_by_group', 
    'get_supported_resolutions',
    'set_progress_callback',
    'emit_progress',
    'is_model_cached'
]