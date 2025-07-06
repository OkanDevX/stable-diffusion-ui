/**
 * This file creates a secure communication bridge between the main process and renderer process
 * in an Electron application. Using Electron's contextBridge API, it exposes secure functions
 * from the main process to the renderer process.
 */

const electron = require("electron");

/**
 * Using contextBridge.exposeInMainWorld method, we create a global object named "electron".
 * This object provides secure access to functions in the main process.
 */
electron.contextBridge.exposeInMainWorld("electron", {
  selectDirectory: () => electron.ipcRenderer.invoke("select-directory"),
  getImageAsBase64: (filePath: string) =>
    electron.ipcRenderer.invoke("get-image-as-base64", filePath),
  getBackendLog: (callback: (log: string) => void) => {
    electron.ipcRenderer.on("backend-log", (event: any, log: string) =>
      callback(log)
    );
  },
  onSetupProgress: (callback: (message: string) => void) => {
    electron.ipcRenderer.on("setup-progress", (event: any, message: string) =>
      callback(message)
    );
  },
  onSetupLog: (callback: (log: string) => void) => {
    electron.ipcRenderer.on("setup-log", (event: any, log: string) =>
      callback(log)
    );
  },
  onSetupError: (callback: (message: string) => void) => {
    electron.ipcRenderer.on("setup-error", (event: any, message: string) =>
      callback(message)
    );
  },
  onSetupProgressPercentage: (callback: (percentage: number) => void) => {
    electron.ipcRenderer.on(
      "setup-progress-percentage",
      (event: any, percentage: number) => callback(percentage)
    );
  },
  onBackendStatus: (
    callback: (status: { ready: boolean; modelsLoaded?: number }) => void
  ) => {
    electron.ipcRenderer.on(
      "backend-status",
      (event: any, status: { ready: boolean; modelsLoaded?: number }) =>
        callback(status)
    );
  },
  removeBackendStatusListener: () => {
    electron.ipcRenderer.removeAllListeners("backend-status");
  },
  getAppConfig: () => electron.ipcRenderer.invoke("get-app-config"),
  getModelsConfig: () => electron.ipcRenderer.invoke("get-models-config"),
  openModelDownloadTerminal: (modelId: string) =>
    electron.ipcRenderer.invoke("open-model-download-terminal", modelId),
} satisfies Window["electron"]);
