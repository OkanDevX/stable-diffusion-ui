import { app, ipcMain, dialog } from "electron";

import { getImageAsBase64, loadAppConfig, loadModelsConfig } from "./utils.js";
import { Backend } from "./backend.js";
import { MainWindow } from "./ui/main-window.js";

let backend: Backend;
let mainWindow: MainWindow;

// When the Electron app is ready this event will be triggered
app.on("ready", async () => {
  // Create main window (initially hidden)
  mainWindow = new MainWindow({
    show: false,
  });

  // Load the main window content
  mainWindow.load();

  // Initialize Python backend
  backend = new Backend(mainWindow);
  await backend.startBackend();

  // Show window after everything is loaded
  mainWindow.showAndFocus();
});

// Cleanup when app is closing
app.on("before-quit", () => {
  if (backend) {
    backend.stopBackend();
  }
});

// ----------------------------------------------------------------
// Electron IPC Handlers
// ----------------------------------------------------------------

// Get app config handler
ipcMain.handle("get-app-config", async () => {
  return loadAppConfig();
});

// Get models config handler
ipcMain.handle("get-models-config", async () => {
  return loadModelsConfig();
});

// Select directory handler
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.filePaths.length > 0) {
    return result.filePaths[0];
  }

  return null;
});

// Model download terminal handler
ipcMain.handle(
  "open-model-download-terminal",
  async (event: any, modelId: string) => {
    try {
      if (backend) {
        await backend.openModelDownloadTerminal(modelId);
        return { success: true };
      } else {
        throw new Error("Backend not initialized");
      }
    } catch (error) {
      console.error("Model Download Terminal Error:", error);
      throw error;
    }
  }
);

ipcMain.handle("get-image-as-base64", async (event, filePath: string) => {
  return getImageAsBase64(filePath);
});
