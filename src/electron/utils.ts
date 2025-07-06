import fs from "node:fs";
import path from "node:path";

import { app } from "electron";

import type { AppConfig, ModelsConfig } from "../../types/config.d.ts";
import { getConfigPath } from "./path-resolver.js";

export function isDev() {
  return process.env.NODE_ENV === "development" || !app.isPackaged;
}

export function getImageAsBase64(filePath: string) {
  const imageBuffer = fs.readFileSync(filePath);
  const extension = path.extname(filePath).slice(1); // .png -> png

  const base64 = imageBuffer.toString("base64");

  return `data:image/${extension};base64,${base64}`;
}

export function loadAppConfig(): AppConfig | null {
  try {
    let appConfigFilePath: string;

    if (isDev()) {
      // Development mode: Load from resources directory
      appConfigFilePath = path.join(getConfigPath(), "app.json");
    } else {
      // Production mode: Load from resources
      appConfigFilePath = path.join(
        process.resourcesPath,
        "config",
        "app.json"
      );
    }

    console.log("[Utils] Loading app config from:", appConfigFilePath);
    return JSON.parse(fs.readFileSync(appConfigFilePath, "utf8"));
  } catch (error) {
    console.error("Failed to load app configuration:", error);
    return null;
  }
}

export function loadModelsConfig(): ModelsConfig | null {
  try {
    let modelsConfigFilePath: string;

    if (isDev()) {
      // Development mode: Load from resources directory
      modelsConfigFilePath = path.join(getConfigPath(), "models.json");
    } else {
      // Production mode: Load from resources
      modelsConfigFilePath = path.join(
        process.resourcesPath,
        "config",
        "models.json"
      );
    }

    console.log("[Utils] Loading models config from:", modelsConfigFilePath);
    return JSON.parse(fs.readFileSync(modelsConfigFilePath, "utf8"));
  } catch (error) {
    console.error("Failed to load models configuration:", error);
    return null;
  }
}

export function absoluteBackendUrl(pathString: string) {
  try {
    const appConfig = loadAppConfig();

    if (!appConfig) {
      throw new Error("App configuration not found");
    }

    const baseUrl = `http://${appConfig.api.host}:${appConfig.api.port}`;
    console.log("[Utils] Backend URL base:", baseUrl);

    return `${baseUrl}${pathString}`;
  } catch (error) {
    console.error(
      "[Utils] Failed to load app config, using fallback URL:",
      error
    );
    // Fallback to default values
    return `http://localhost:5000${pathString}`;
  }
}
