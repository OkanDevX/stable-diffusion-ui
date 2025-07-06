from pathlib import Path
from utils.config_loader import config_loader

# Directory configuration
BASE_DIR = Path(__file__).resolve().parent

# API configuration
API_CONFIG = config_loader.get_api_config()

API_PORT = API_CONFIG.get("port", 5000)
DEBUG = API_CONFIG.get("debug", False)
API_HOST = API_CONFIG.get("host", "0.0.0.0")

# Model default parameters
DEFAULT_MODEL_PARAMS = {
    "height": 512,
    "width": 512,
    "guidance_scale": 7.5,
    "num_inference_steps": 20,
    "negative_prompt": "",
    "output_dir": "",
}
