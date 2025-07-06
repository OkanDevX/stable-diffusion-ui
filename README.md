![Stable Diffusion UI Cover2-min](https://github.com/user-attachments/assets/bcb5e226-14a1-4bb6-96fe-751aba542f7d)

# Stable Diffusion UI

A cross-platform desktop application for generating images using Stable Diffusion models. Built with React, Python Flask, and Electron.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Building for Production](#building-for-production)
- [Project Architecture](#project-architecture)
- [Configuration](#configuration)
- [Model Management](#model-management)
- [API Reference](#api-reference)
- [License](#license)

## Overview

This application provides a desktop interface for Stable Diffusion image generation. The architecture consists of:

- **Frontend**: React-based UI running in Electron
- **Backend**: Python Flask API handling model operations
- **Desktop Integration**: Electron wrapper for cross-platform compatibility

The application manages Stable Diffusion models through Hugging Face's `diffusers` library and provides a graphical interface for parameter configuration and image generation.

## Features

![2aeca94d87314c](https://github.com/user-attachments/assets/98923c18-f776-4980-a3fc-e68b8841b5c8)

### Core Functionality

- **Image Generation**: Generate images using various Stable Diffusion models
- **Model Management**: Automatic download and local caching of models
- **Parameter Control**: Adjustable generation parameters (steps, guidance scale, dimensions)
- **Real-time Feedback**: Terminal integration showing download progress and generation status

### Technical Features

- **Cross-platform Support**: Windows, macOS, and Linux compatibility
- **Model Caching**: Intelligent cache detection to avoid unnecessary downloads
- **Backend Health Monitoring**: Continuous monitoring of Python backend status
- **IPC Communication**: Inter-process communication between frontend and backend

## Tech Stack

### Frontend Layer

- **React 19**: Component-based UI framework
- **TypeScript**: Static type checking
- **Vite**: Build tool and development server
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn UI**: Pre-built component library
- **React Query**: Server state management and caching
- **React Router v7**: Client-side routing

### Backend Layer

- **Python 3.8+**: Runtime environment
- **Flask**: Web framework for REST API
- **PyTorch**: Deep learning framework
- **Diffusers**: Hugging Face library for diffusion models
- **Transformers**: Model loading and tokenization
- **Flask-CORS**: Cross-origin request handling

### Desktop Integration

- **Electron**: Native desktop application framework
- **Node.js**: JavaScript runtime for desktop features
- **IPC**: Inter-process communication system

### Development Tools

- **pnpm**: Package manager
- **Electron Builder**: Application packaging
- **Concurrently**: Parallel process execution
- **ESLint**: Code linting
- **TypeScript Compiler**: Type checking

## Prerequisites

### System Requirements

- **Node.js**: Version 18 or higher
- **Python**: Version 3.8 or higher with pip
- **pnpm**: Package manager (or npm as alternative)
- **Git**: Version control system

### Hardware Requirements

- **RAM**: Minimum 8GB (16GB recommended for larger models)
- **Storage**: 20GB+ free space for model files
- **GPU**: NVIDIA GPU with CUDA support (optional, improves generation speed)

### Platform-Specific Requirements

#### Windows

- **OS**: Windows 10/11 64-bit
- **Python**: Ensure Python is added to system PATH
- **PowerShell**: For terminal operations

#### macOS

- **OS**: macOS 10.15 (Catalina) or later
- **Xcode Command Line Tools**: `xcode-select --install`

#### Linux

- **Distribution**: Ubuntu 18.04+ or equivalent
- **Build Tools**: `sudo apt-get install build-essential`

## Installation

### 1. Repository Setup

```bash
git clone https://github.com/yourusername/stable-diffusion-ui.git
cd stable-diffusion-ui
```

### 2. Frontend Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Alternative with npm
npm install
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd src/backend

# Create isolated Python environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 4. Configuration Files

The application requires configuration files in the `config/` directory:

```bash
# Create config directory
mkdir config

# Configuration files are already present in the repository:
# - config/app.json (application settings)
# - config/models.json (model definitions)
```

## Development Setup

### Starting Development Environment

**Full Development Stack:**

```bash
pnpm run dev
```

This command executes:

- React development server on `http://localhost:5123`
- Electron application launch
- Python Flask backend startup
- Hot reload for frontend changes

**Individual Components:**

```bash
# Frontend only (React + Vite)
pnpm run dev:react

# Electron only (requires built React app)
pnpm run dev:electron
```

### Development Workflow

#### Frontend Development

- **Location**: `src/ui/`
- **Entry Point**: `src/ui/main.tsx`
- **Components**: `src/ui/components/`
- **Hooks**: `src/ui/hooks/`
- **API Layer**: `src/ui/lib/api/`

Key files:

- `src/ui/components/ImageGenerator.tsx`: Main image generation interface
- `src/ui/hooks/use-models.ts`: Model management hook
- `src/ui/lib/api/index.ts`: API communication layer

#### Backend Development

- **Location**: `src/backend/`
- **Entry Point**: `src/backend/app.py`
- **Models**: `src/backend/models.py`
- **Configuration**: `src/backend/config.py`
- **Utilities**: `src/backend/utils/`

Key components:

- Flask API endpoints for image generation
- Model loading and caching system
- Configuration management
- Image processing utilities

#### Electron Development

- **Location**: `src/electron/`
- **Main Process**: `src/electron/main.ts`
- **Backend Management**: `src/electron/backend.ts`
- **IPC Handlers**: Communication between frontend and backend
- **Window Management**: `src/electron/ui/`

## Building for Production

### Build Process

```bash
# Build React application
pnpm run build:react

# Compile TypeScript for Electron
pnpm run transpile:electron

# Create distribution packages
pnpm run dist:win    # Windows installer
pnpm run dist:mac    # macOS disk image
pnpm run dist:linux  # Linux AppImage
```

### Output Files

Distribution files are created in the `dist/` directory:

- **Windows**: `.exe` installer (NSIS)
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` portable application

### Build Configuration

The `electron-builder.json` file controls:

- Application metadata (name, version, description)
- File inclusion/exclusion patterns
- Platform-specific settings
- Icon files and resources

## Project Architecture

### Directory Structure

```
stable-diffusion-ui/
├── src/
│   ├── backend/                 # Python Flask backend
│   │   ├── app.py              # Main Flask application
│   │   ├── models.py           # Model management and loading
│   │   ├── config.py           # Configuration handling
│   │   └── utils/              # Utility functions
│   │       ├── config_loader.py
│   │       ├── get_device.py
│   │       └── save_image.py
│   ├── electron/               # Electron main process
│   │   ├── main.ts            # Application entry point
│   │   ├── backend.ts         # Python backend management
│   │   ├── preload.cts        # Preload script for renderer
│   │   └── ui/                # Window management
│   └── ui/                    # React frontend
│       ├── components/        # UI components
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utilities and API client
│       └── screens/          # Application screens
├── config/                    # Configuration files
│   ├── app.json              # Application settings
│   └── models.json           # Model definitions
├── public/                   # Static assets
├── types/                    # TypeScript type definitions
└── dist/                     # Built applications
```

### Data Flow Architecture

1. **User Interface Layer**: React components handle user interactions
2. **IPC Layer**: Electron IPC facilitates communication between processes
3. **Backend Process**: Electron manages Python Flask backend subprocess
4. **API Layer**: Frontend communicates with Flask backend via HTTP
5. **Model Processing**: Backend loads and executes Stable Diffusion models
6. **Response Chain**: Results flow back through the architecture layers

### Key System Components

#### Frontend (React)

- **ImageGenerator**: Primary image generation interface
- **TerminalOutput**: Real-time backend log display
- **Model Management**: Model selection and parameter configuration
- **API Client**: HTTP communication with Flask backend

#### Backend (Python)

- **Flask Application**: RESTful API server
- **Model Manager**: Hugging Face model loading and caching
- **Image Processing**: Stable Diffusion pipeline execution
- **Configuration System**: JSON-based configuration management

#### Electron Integration

- **Main Process**: Application lifecycle and window management
- **IPC System**: Inter-process communication handlers
- **Backend Subprocess**: Python process management
- **File System**: Directory selection and image handling

## Configuration

### Application Configuration (`config/app.json`)

```json
{
  "api": {
    "host": "localhost",
    "port": 5000,
    "debug": false
  },
  "defaults": {
    "model": "dreamshaper_8"
  }
}
```

**Configuration Options:**

- `api.host`: Flask backend host address
- `api.port`: Flask backend port number
- `api.debug`: Enable Flask debug mode
- `defaults.model`: Default model selection
- `ui.features.save_last_settings`: Persist user parameters
- `ui.features.auto_open_terminal`: Automatically open terminal for downloads

### Model Configuration (`config/models.json`)

```json
{
  "models": {
    "dreamshaper_8": {
      "name": "DreamShaper 8",
      "huggingface_id": "Lykon/dreamshaper-8",
      "description": "General purpose Stable Diffusion model",
      "group": "standard",
      "pipeline_class": "StableDiffusionPipeline",
      "recommended_params": {
        "guidance_scale": 7.5,
        "num_inference_steps": 20,
        "width": 512,
        "height": 512
      },
      "suggested_negative_prompt": "low quality, blurry, distorted"
    }
  }
}
```

**Model Parameters:**

- `name`: Display name in UI
- `huggingface_id`: Hugging Face model repository ID
- `description`: Model description text
- `group`: Model category (`standard`, `sdxl`)
- `pipeline_class`: Diffusers pipeline class name
- `recommended_params`: Default generation parameters
- `suggested_negative_prompt`: Recommended negative prompt

## Model Management

### Model Loading System

The application uses a dynamic model loading system:

1. **Configuration Reading**: Models are defined in `config/models.json`
2. **Cache Detection**: System checks if models are already downloaded
3. **Download Process**: Missing models trigger download with terminal output
4. **Pipeline Creation**: Models are loaded using appropriate Diffusers pipeline
5. **Memory Management**: Models are cached in memory for subsequent use

### Adding New Models

#### Step 1: Update Configuration

Add model definition to `config/models.json`:

```json
{
  "your_model_id": {
    "name": "Your Model Name",
    "huggingface_id": "huggingface/repository-name",
    "description": "Model description",
    "group": "standard",
    "pipeline_class": "StableDiffusionPipeline",
    "recommended_params": {
      "guidance_scale": 7.5,
      "num_inference_steps": 20,
      "width": 512,
      "height": 512
    },
    "suggested_negative_prompt": "low quality, blurry"
  }
}
```

#### Step 2: Model Groups

- `standard`: Stable Diffusion 1.5-based models (512x512 resolution)
- `sdxl`: Stable Diffusion XL models (1024x1024 resolution)

#### Step 3: Pipeline Classes

- `StableDiffusionPipeline`: For SD 1.5 models
- `StableDiffusionXLPipeline`: For SDXL models

### Cache Management System

**Cache Location:**

- **Windows**: `%USERPROFILE%\.cache\huggingface\hub`
- **macOS**: `~/.cache/huggingface/hub`
- **Linux**: `~/.cache/huggingface/hub`

**Cache Detection Process:**

1. Check if model files exist in cache directory
2. Attempt to load model pipeline with `local_files_only=True`
3. If successful, model is considered cached
4. If failed, trigger download process

**Terminal Integration:**

- Downloads open separate terminal window
- Real-time progress display
- ASCII-compatible output for Windows compatibility
- Warning messages about not closing during download

## API Reference

### Endpoints

#### Generate Image

```http
POST /generate
Content-Type: application/json

{
  "prompt": "A landscape painting",
  "model": "dreamshaper_8",
  "width": 512,
  "height": 512,
  "guidance_scale": 7.5,
  "num_inference_steps": 20,
  "negative_prompt": "low quality",
  "output_dir": "/path/to/output"
}
```

**Response:**

```json
{
  "filename": "generated_image_20240315_143022.png",
  "model_used": "dreamshaper_8",
  "model_name": "DreamShaper 8",
  "params_used": {
    "prompt": "A landscape painting",
    "width": 512,
    "height": 512,
    "guidance_scale": 7.5,
    "num_inference_steps": 20,
    "negative_prompt": "low quality"
  }
}
```

#### Get Available Models

```http
GET /models
```

**Response:**

```json
{
  "models": [
    {
      "id": "dreamshaper_8",
      "name": "DreamShaper 8",
      "description": "General purpose Stable Diffusion model",
      "group": "standard",
      "recommended_params": {
        "guidance_scale": 7.5,
        "num_inference_steps": 20,
        "width": 512,
        "height": 512
      },
      "suggested_negative_prompt": "low quality, blurry, distorted"
    }
  ],
  "total": 1
}
```

#### Check Model Cache Status

```http
GET /api/models/{model_id}/cache-status
```

**Response:**

```json
{
  "model_id": "dreamshaper_8",
  "is_cached": true,
  "cache_status": "cached"
}
```

#### Backend Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "models_loaded": 3
}
```

#### Get Supported Resolutions

```http
GET /resolutions
```

**Response:**

```json
[
  { "name": "Square 512x512", "width": 512, "height": 512 },
  { "name": "Portrait 512x768", "width": 512, "height": 768 },
  { "name": "Landscape 768x512", "width": 768, "height": 512 }
]
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Hugging Face](https://huggingface.co/) for the Diffusers library
- [Stability AI](https://stability.ai/) for Stable Diffusion models
- [Electron](https://www.electronjs.org/) for the desktop framework
- [React](https://react.dev/) for the UI framework
- [Flask](https://flask.palletsprojects.com/) for the backend framework
