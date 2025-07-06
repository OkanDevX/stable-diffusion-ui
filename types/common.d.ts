interface Window {
  electron: {
    selectDirectory: () => Promise<string>;
    getImageAsBase64: (filePath: string) => Promise<string>;
    getBackendLog: (callback: (log: string) => void) => void;
    onSetupProgress: (callback: (message: string) => void) => void;
    onSetupLog: (callback: (log: string) => void) => void;
    onSetupError: (callback: (message: string) => void) => void;
    onSetupProgressPercentage: (callback: (percentage: number) => void) => void;
    onBackendStatus: (
      callback: (status: { ready: boolean; modelsLoaded?: number }) => void
    ) => void;
    removeBackendStatusListener: () => void;
    getAppConfig: () => Promise<AppConfig | null>;
    getModelsConfig: () => Promise<ModelsConfig | null>;
    openModelDownloadTerminal: (
      modelId: string
    ) => Promise<{ success: boolean }>;
  };
}
