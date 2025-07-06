// Models Config Types
export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  group: string;
  huggingface_id: string;
  pipeline_class: string;
  recommended_params: {
    guidance_scale: number;
    num_inference_steps: number;
    width: number;
    height: number;
  };
  suggested_negative_prompt: string;
}

export interface ModelsConfig {
  supported_resolutions: Array<{
    width: number;
    height: number;
    label: string;
    aspect_ratio: string;
  }>;
  models: Record<string, ModelConfig>;
}

// App Config Types
export interface AppConfig {
  app: {
    name: string;
    description: string;
  };
  api: {
    port: number;
    host: string;
    debug: boolean;
  };
  defaults: {
    model: string;
  };
  ui: {
    features: {
      save_last_settings: boolean;
      auto_suggest_negative_prompt: boolean;
      enable_fast_preview: boolean;
    };
    limits: {
      max_prompt_length: number;
      max_negative_prompt_length: number;
      min_image_size: number;
      max_image_size: number;
    };
  };
}
