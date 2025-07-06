import path from "node:path";

import { type BrowserWindowConstructorOptions, app } from "electron";

import { getPreloadPath, getIconPath } from "../path-resolver.js";
import { BaseWindow } from "./base-window.js";
import { isDev } from "../utils.js";

/**
 * Main Window Class
 *
 * Manages the main application window.
 * Extends BaseWindow with main window specific settings.
 */
export class MainWindow extends BaseWindow {
  constructor(options: BrowserWindowConstructorOptions = {}) {
    // Set default options for main window
    const defaultOptions: BrowserWindowConstructorOptions = {
      webPreferences: {
        // Load preload script
        preload: getPreloadPath(),
        // Enable Node.js integration
        nodeIntegration: true,
        // Isolate renderer process from main process
        contextIsolation: true,
      },
      width: 1366, // Set default window width
      height: 768, // Set default window height
      icon: getIconPath(), // Set window icon
    };

    // Merge user options with default options
    const mergedOptions = { ...defaultOptions, ...options };

    // Call BaseWindow constructor ONLY ONCE (which calls BrowserWindow constructor)
    super(mergedOptions);
  }

  /**
   * Loads main application page
   */
  public load(): void {
    if (isDev()) {
      // Development mode: Load from Vite dev server
      this.loadURL("http://localhost:5123/#/");
    } else {
      // Production mode: Hide menu bar and load built file
      this.setMenuBarVisibility(false);

      // Production mode: Use app.getAppPath() to get correct path
      const appPath = app.getAppPath();
      const indexPath = path.join(appPath, "dist-react", "index.html");

      console.log("[MainWindow] Loading from:", indexPath);
      console.log("[MainWindow] App path:", appPath);

      this.loadFile(indexPath);
    }
  }

  /**
   * Sends backend log to terminal in frontend
   */
  public sendBackendLogToTerminal(log: string): void {
    if (!this.isDestroyed()) {
      this.webContents.send("backend-log", log);
    }
  }

  /**
   * Updates backend status in frontend
   */
  public updateBackendStatus(status: {
    ready: boolean;
    modelsLoaded?: number;
  }): void {
    if (!this.isDestroyed()) {
      this.webContents.send("backend-status", status);
    }
  }
}
