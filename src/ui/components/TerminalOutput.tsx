import { useEffect, useRef, useState } from "react";
import { Copy, Trash2, Terminal, Activity } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TerminalOutput = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.electron.getBackendLog((log: string) => {
      setLogs((prevLogs) => [...prevLogs, log]);
    });
  }, []);

  useEffect(() => {
    // Auto scroll to bottom of terminal container only
    if (terminalContainerRef.current) {
      const container = terminalContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join("\n"));
  };

  const handleClear = () => {
    setLogs([]);
  };

  return (
    <Card className="w-full h-[500px] flex flex-col overflow-hidden relative p-0">
      {/* Terminal Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border-b border-slate-600/50 backdrop-blur-sm">
          <CardTitle className="text-lg font-semibold text-emerald-300 font-mono flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span>System Console</span>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <Activity className="h-3 w-3 animate-pulse" />
                <span>Live Backend Logs</span>
              </div>
            </div>
          </CardTitle>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              title="Copy all logs"
              className="h-8 w-8 p-0 hover:bg-white/10 text-emerald-300 hover:text-emerald-200"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              title="Clear logs"
              className="h-8 w-8 p-0 hover:bg-white/10 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Terminal Content */}
        <CardContent
          ref={terminalContainerRef}
          className="flex-1 overflow-y-auto font-mono text-sm p-0 bg-gradient-to-b from-slate-900/95 to-black/95"
        >
          <div className="p-4 h-full">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center space-y-2">
                  <Terminal className="h-12 w-12 mx-auto opacity-50" />
                  <p className="text-sm">Waiting for system logs...</p>
                  <p className="text-xs opacity-70">
                    Backend activity will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="whitespace-pre-wrap break-all text-emerald-300 hover:bg-white/5 px-2 py-1 rounded transition-colors duration-150"
                  >
                    <span className="text-slate-400 mr-2 text-xs">
                      [{new Date().toLocaleTimeString()}]
                    </span>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer Status */}
        <div className="px-4 py-2 bg-gradient-to-r from-slate-800/90 to-slate-700/90 border-t border-slate-600/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Connected to backend</span>
            </div>
            <div className="text-slate-400">
              {logs.length} log{logs.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TerminalOutput;
