import { useState, useEffect } from "react";

interface BackendStatus {
  ready: boolean;
  modelsLoaded?: number;
}

export function useBackendStatus() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    ready: false,
    modelsLoaded: 0,
  });

  useEffect(() => {
    // Listen for backend status updates
    const handleBackendStatus = (status: BackendStatus) => {
      console.log("[Frontend] Backend status updated:", status);
      setBackendStatus(status);
    };

    // Check if electron is available
    if (typeof window !== "undefined" && window.electron) {
      window.electron.onBackendStatus(handleBackendStatus);

      // Cleanup listener on unmount
      return () => {
        window.electron.removeBackendStatusListener();
      };
    }

    // If not in electron environment, assume backend is ready (for dev)
    if (typeof window !== "undefined" && !window.electron) {
      setBackendStatus({ ready: true, modelsLoaded: 0 });
    }
  }, []);

  return backendStatus;
}
