/**
 * Configuration loader for frontend
 * Loads the same JSON configuration files used by the backend
 */

import type { ModelsConfig, AppConfig } from "types/config";

// Configuration cache
let modelsConfig: ModelsConfig | null = null;
let appConfig: AppConfig | null = null;

/**
 * Load models configuration
 */
export async function loadModelsConfig(): Promise<ModelsConfig | null> {
  if (modelsConfig) return modelsConfig;

  const result = await window.electron.getModelsConfig();
  modelsConfig = result;
  return modelsConfig;
}

/**
 * Load app configuration
 */
export async function loadAppConfig(): Promise<AppConfig | null> {
  if (appConfig) return appConfig;

  const result = await window.electron.getAppConfig();
  appConfig = result;
  return appConfig;
}
