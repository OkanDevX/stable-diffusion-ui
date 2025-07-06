import path from "node:path";

import { type BrowserWindowConstructorOptions, app } from "electron";

import { getPreloadPath } from "../path-resolver.js";
import { BaseWindow } from "./base-window.js";
import { isDev } from "../utils.js";

/**
 * Loading Window Class
 *
 * Manages the loading screen shown during backend setup.
 * Extends BaseWindow, with custom loading window settings.
 */
export class LoadingWindow extends BaseWindow {
  constructor(options: BrowserWindowConstructorOptions = {}) {
    // Set default options for loading window
    const defaultOptions: BrowserWindowConstructorOptions = {
      width: 500,
      height: 450,
      minWidth: 350,
      minHeight: 400,
      maxWidth: 600,
      maxHeight: 500,
      frame: false,
      resizable: false,
      webPreferences: {
        preload: getPreloadPath(),
        nodeIntegration: false,
        contextIsolation: true,
      },
    };

    // Merge user options with default options
    const mergedOptions = { ...defaultOptions, ...options };

    // Call BaseWindow constructor (which calls BrowserWindow constructor)
    super(mergedOptions);
  }

  /**
   * Loads loading page
   */
  public load(): void {
    if (isDev()) {
      // Development mode: Load from Vite dev server with loading route
      this.loadURL("http://localhost:5123/#/loading");
    } else {
      // Production mode: Load built React app with loading route
      const appPath = app.getAppPath();
      const indexPath = path.join(appPath, "dist-react", "index.html");

      console.log("[LoadingWindow] Loading from:", indexPath);

      this.loadFile(indexPath, {
        hash: "#/loading",
      });
    }
  }

  /**
   * Sends loading progress percentage
   */
  public sendPercentage(percentage: number): void {
    if (!this.isDestroyed()) {
      this.webContents.send("setup-progress-percentage", percentage);
    }
  }

  /**
   * Sends loading status text
   */
  public sendStatusText(text: string): void {
    if (!this.isDestroyed()) {
      this.webContents.send("setup-progress", text);
    }
  }

  /**
   * Sends log message
   */
  public sendLog(log: string): void {
    if (!this.isDestroyed()) {
      this.webContents.send("setup-log", log);
    }
  }
}
