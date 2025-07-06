import Logo from "@/components/ui/logo";
import { useEffect, useState } from "react";

const LoadingScreen: React.FC = () => {
  const [status, setStatus] = useState("Requirements are being loaded...");
  const [logs, setLogs] = useState("");
  const [progress, setProgress] = useState(0);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    // IPC event listeners
    if (window.electron) {
      // Setup progress listener
      window.electron.onSetupProgress((message: string) => {
        setStatus(message);
      });

      // Setup logs listener
      window.electron.onSetupLog((log: string) => {
        setLogs((prev) => prev + log);
        setShowLogs(true);
      });

      // Setup error listener
      window.electron.onSetupError((message: string) => {
        setStatus(`Error: ${message}`);
      });

      // Setup progress percentage listener
      window.electron.onSetupProgressPercentage((percentage: number) => {
        setProgress(Number((percentage || 0).toFixed(2)));
      });
    }
  }, []);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 flex items-center justify-center p-3 overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-8 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-8 w-24 h-24 bg-blue-300/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-300/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl w-full max-w-md mx-auto overflow-hidden border border-white/20 max-h-full flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-2 px-4 py-4 text-center bg-gradient-to-r from-white/50 to-indigo-50/50 backdrop-blur-sm flex-shrink-0">
          <Logo />
          <h1 className="text-xl font-bold gradient-text mb-1">
            Stable Diffusion UI
          </h1>
          <p className="text-xs text-gray-600">AI-powered image generation</p>
        </div>

        {/* Content Section - Scrollable */}
        <div className="px-4 py-3 space-y-4 flex-1 overflow-y-auto">
          {/* Status Section */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-sm font-medium text-gray-700 px-1 leading-tight">
              {status}
            </h3>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">
                Setting up AI environment...
              </span>
              <span className="text-xs font-bold text-indigo-600">
                {progress}%
              </span>
            </div>
          </div>

          {/* Logs Section */}
          {logs && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Setup Logs
                </h4>
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-2 py-1 rounded text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {showLogs ? "Hide" : "Show"}
                </button>
              </div>

              {showLogs && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-600/50 max-h-24 overflow-y-auto">
                  <pre className="text-xs text-emerald-300 p-2 font-mono leading-tight whitespace-pre-wrap break-words">
                    {logs}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-indigo-50/50 text-center border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
              <div
                className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <span>Preparing your creative workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
