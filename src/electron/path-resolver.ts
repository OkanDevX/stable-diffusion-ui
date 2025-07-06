import path from "node:path";

import { app } from "electron";
import { isDev } from "./utils.js";

/**
 * This function returns the file path of the Electron application's preload script.
 * The preload script acts as a secure bridge between the main process and renderer process.
 *
 * In development mode, the preload file is in the project root directory
 * In production mode, it is packaged with the application
 */
export function getPreloadPath() {
  return path.join(app.getAppPath(), "dist-electron", "preload.cjs");
}

/**
 * Returns the path to the configuration directory.
 * This function is used to get the path to the configuration directory.
 */
export function getConfigPath() {
  if (isDev()) {
    // Development mode: Use config directory
    return path.join(app.getAppPath(), "config");
  } else {
    // Production mode: Use config directory
    return path.join(process.resourcesPath, "config");
  }
}

/**
 * Returns the path to the application icon based on platform and environment.
 * This function is used to get the correct icon path for the window.
 */
export function getIconPath() {
  let iconFileName: string;

  // Choose icon format based on platform
  switch (process.platform) {
    case "win32":
      iconFileName = "icon.ico";
      break;
    case "darwin":
      iconFileName = "icon.icns";
      break;
    default:
      iconFileName = "icon.png";
      break;
  }

  if (isDev()) {
    // Development mode: Use assets directory
    return path.join(app.getAppPath(), "assets", iconFileName);
  } else {
    // Production mode: Use assets directory
    return path.join(process.resourcesPath, "assets", iconFileName);
  }
}
