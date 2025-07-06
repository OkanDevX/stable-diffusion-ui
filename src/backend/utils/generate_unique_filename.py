import uuid

def generate_unique_filename(extension: str = "png") -> str:
    """Create a unique filename."""
    return f"{uuid.uuid4().hex}.{extension}"