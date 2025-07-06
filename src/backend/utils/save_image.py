import os
from pathlib import Path
from typing import Optional
from .generate_unique_filename import generate_unique_filename

def save_image(image, filename: Optional[str] = None, output_dir: str = None) -> str:
    """Save the generated image and return the filename."""
    if output_dir is None:
        output_dir = "outputs"
        
    if filename is None:
        filename = generate_unique_filename()
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    path = os.path.join(output_dir, filename)
    image.save(path)

    return filename