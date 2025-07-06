from typing import Optional

def validate_image_params(params: dict) -> tuple[bool, Optional[str]]:
    """Validate the image generation parameters."""
    if not params.get("prompt"):
        return False, "Prompt cannot be empty."
    
    try:
        height = int(params.get("height", 512))
        width = int(params.get("width", 512))
        if height < 128 or width < 128 or height > 1024 or width > 1024:
            return False, "Height and width must be between 128 and 1024."
    except ValueError:
        return False, "Invalid height or width value."
    
    return True, None 