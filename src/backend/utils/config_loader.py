"""
Configuration loader utility for reading shared JSON configuration files.
This allows both backend and frontend to use the same configuration data.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

class ConfigLoader:
    """Utility class for loading shared configuration files."""
    
    def __init__(self):
        # Detect if we're running in production (bundled) or development
        self.is_production = self._is_production_environment()
        
        if self.is_production:
            # Production: Config files are in /config/
            # Backend is in resources/backend/, so go up one level to resources/
            self.config_dir = Path(__file__).resolve().parent.parent.parent / "config"
        else:
            # Development: Config files are in /config/
            # Get the project root directory (assuming this file is in src/backend/utils/)
            self.project_root = Path(__file__).resolve().parent.parent.parent.parent
            self.config_dir = self.project_root / "config"
        
        print(f"[ConfigLoader] Environment: {'production' if self.is_production else 'development'}")
        print(f"[ConfigLoader] Config directory: {self.config_dir}")
        
        # Cache for loaded configurations
        self._cache = {}
    
    def _is_production_environment(self) -> bool:
        """Detect if we're running in production environment."""
        # Check if we're running from a bundled Electron app
        # In production, the path will contain 'resources/backend'
        current_path = str(Path(__file__).resolve())
        
        # Check if we're in the resources directory structure
        if 'resources' in current_path and 'backend' in current_path:
            return True
        
        # Alternative check: If we're not in the src directory
        if 'src' not in current_path:
            return True
            
        return False
    
    def _load_json_file(self, file_path: Path) -> Dict[str, Any]:
        """Load a JSON file and return its contents."""
        try:
            print(f"[ConfigLoader] Loading config file: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"[ConfigLoader] ERROR: Configuration file not found: {file_path}")
            raise FileNotFoundError(f"Configuration file not found: {file_path}")
        except json.JSONDecodeError as e:
            print(f"[ConfigLoader] ERROR: Invalid JSON in configuration file {file_path}: {e}")
            raise ValueError(f"Invalid JSON in configuration file {file_path}: {e}")
    
    def load_models_config(self) -> Dict[str, Any]:
        """Load the models configuration."""
        if 'models' not in self._cache:
            models_file = self.config_dir / "models.json"
            self._cache['models'] = self._load_json_file(models_file)
        return self._cache['models']
    
    def load_app_config(self) -> Dict[str, Any]:
        """Load the app configuration."""
        if 'app' not in self._cache:
            app_file = self.config_dir / "app.json"
            self._cache['app'] = self._load_json_file(app_file)
        return self._cache['app']
    
    def get_model_config_by_id(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific model."""
        models_config = self.load_models_config()
        return models_config.get('models', {}).get(model_id)
    
    def get_api_config(self) -> Dict[str, Any]:
        """Get API configuration."""
        app_config = self.load_app_config()
        return app_config.get('api', {})

# Global instance
config_loader = ConfigLoader()
