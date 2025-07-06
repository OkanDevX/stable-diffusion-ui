import torch

def get_device() -> str:
    """Determine the device to use (CUDA or CPU)."""
    return "cuda" if torch.cuda.is_available() else "cpu"