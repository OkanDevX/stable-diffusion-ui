import { spawn, exec, ChildProcess } from "node:child_process";
import path from "node:path";
import * as fs from "node:fs";
import { promisify } from "node:util";

import { app, dialog } from "electron";
import axios from "axios";

import { MainWindow } from "./ui/main-window.js";
import { LoadingWindow } from "./ui/loading-window.js";
import { absoluteBackendUrl } from "./utils.js";

export class Backend {
  private loadingWindow: LoadingWindow | null = null;
  private backendProcess: ChildProcess | null = null;
  private isDev: boolean = !app.isPackaged;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isBackendReady: boolean = false;
  private healthCheckStarted: boolean = false;
  private modelDownloadTerminals: Map<string, ChildProcess> = new Map();

  constructor(private mainWindow: MainWindow) {
    this.loadingWindow = new LoadingWindow();
    this.loadingWindow.load();

    this.startBackend = this.startBackend.bind(this);
    this.stopBackend = this.stopBackend.bind(this);
    this.checkBackendHealth = this.checkBackendHealth.bind(this);
    this.openModelDownloadTerminal = this.openModelDownloadTerminal.bind(this);
  }

  // ----------------------------
  // Public Methods
  // ----------------------------
  public async startBackend(): Promise<void> {
    try {
      const resourcesPath = this.isDev
        ? path.join(app.getAppPath(), "src", "backend")
        : path.join(process.resourcesPath, "backend");

      console.log("[Backend] Resources path:", resourcesPath);

      const pythonPath = await this.setupBackend(resourcesPath);
      const appPyPath = path.join(resourcesPath, "app.py");

      // Start python backend process
      this.backendProcess = spawn(pythonPath, [appPyPath], {
        cwd: resourcesPath,
        stdio: "pipe",
        env: {
          ...process.env,
        },
      });

      // Catch results from the backend process
      this.backendProcess?.stdout?.on("data", (data) => {
        const text = data.toString();

        console.log(`[Backend] ${text}`);

        this.mainWindow.sendBackendLogToTerminal(text);

        // Check if Flask has started - check multiple possible formats
        if (
          text.includes("Running on") ||
          text.includes("* Running") ||
          text.includes("Serving Flask app") ||
          text.includes("Development server is running") ||
          text.includes("http://")
        ) {
          console.log(
            "[Backend] Flask server started (from stdout), beginning health checks..."
          );
          this.startHealthCheck();
        }
      });

      // Catch errors from the backend process
      this.backendProcess?.stderr?.on("data", (data) => {
        const text = data.toString();

        console.error(`[Backend] ${text}`);

        this.mainWindow.sendBackendLogToTerminal(text);
      });

      // Process exited
      this.backendProcess.on("close", (code: number) => {
        console.log(`[Backend] Process exited with code ${code}`);

        // Stop health checks
        this.stopHealthCheck();
        this.isBackendReady = false;

        // Notify frontend that backend is no longer available
        this.mainWindow.updateBackendStatus({ ready: false });

        // If the process exited unexpectedly
        if (code !== 0) {
          console.error("[Backend] Process terminated unexpectedly");
        }
      });

      // Process error
      this.backendProcess.on("error", (err: any) => {
        const text = err.toString();

        console.error("[Backend] Process error:", text);

        dialog.showErrorBox("[Backend] Process error: ", text);
      });
    } catch (error: any) {
      console.error("[Backend] Setup failed: " + error);
      dialog.showErrorBox("[Backend] Setup failed", error?.toString());
    }
  }

  public async openModelDownloadTerminal(modelId: string): Promise<void> {
    const backendDir = this.isDev
      ? path.join(app.getAppPath(), "src", "backend")
      : path.join(process.resourcesPath, "backend");

    const scriptPath = path.join(backendDir, `download_script_${modelId}.py`);
    const scriptContent = this.createModelDownloadScript(modelId);

    // Write script file
    await promisify(fs.writeFile)(scriptPath, scriptContent, "utf8");

    // Open terminal with enhanced Python execution
    const command = `chcp 65001 && cd /d "${backendDir}" && python -u -X dev  download_script_${modelId}.py`;

    // Use cmd.exe directly for better output handling
    spawn(
      "cmd.exe",
      ["/c", `start "Model Download - ${modelId}" cmd.exe /k "${command}"`],
      {
        stdio: "inherit",
        shell: true,
        windowsVerbatimArguments: true,
      }
    );

    console.log(`Model download terminal opened for ${modelId}`);
  }

  private createModelDownloadScript(modelId: string): string {
    return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Model Download Script for ${modelId}
This script will download and cache the model for future use.
"""
import sys
import os
import time
from pathlib import Path

print("\\n" + "=" * 80)
print("*** MODEL DOWNLOAD TERMINAL ***")
print("=" * 80)
print("WARNING: DO NOT CLOSE this terminal until download is complete!")
print("WARNING: Model download involves large files (5-20GB)")
print("WARNING: If download is interrupted, you may need to restart from beginning")
print("=" * 80)
print("This terminal will show:")
print("   - Model information and download status")
print("   - Real-time download progress bars")
print("   - Download speed and remaining time")
print("   - Detailed error information if issues occur")
print("=" * 80)
print("Starting download process...")
print("=" * 80)
print("")

print("=== PYTHON SCRIPT STARTED ===")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")

# Force all output to be unbuffered and visible
sys.stdout.reconfigure(line_buffering=True, encoding='utf-8')
sys.stderr.reconfigure(line_buffering=True, encoding='utf-8')

# Set environment variables for maximum output visibility
os.environ['PYTHONUNBUFFERED'] = '1'
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['HF_HUB_VERBOSITY'] = 'info'
os.environ['TRANSFORMERS_VERBOSITY'] = 'info'
os.environ['DIFFUSERS_VERBOSITY'] = 'info'
os.environ['TQDM_DISABLE'] = '0'
os.environ['HF_HUB_ENABLE_HF_TRANSFER'] = '0'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['FORCE_COLOR'] = '1'

# Add the backend directory to Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
print(f"Added to Python path: {script_dir}")

def print_flush(message):
    """Print with immediate flush"""
    print(message, flush=True)

try:
    print_flush("\\n" + "=" * 60)
    print_flush(f"    Model Download: ${modelId}")
    print_flush("=" * 60)
    print_flush("Initializing download process...")
    print_flush("")
    
    # Test import first
    print_flush("[1/5] Testing imports...")
    try:
        import torch
        print_flush(f"[OK] PyTorch version: {torch.__version__}")
        
        import transformers
        print_flush(f"[OK] Transformers version: {transformers.__version__}")
        
        import diffusers
        print_flush(f"[OK] Diffusers version: {diffusers.__version__}")
        
        # Configure tqdm for better progress visibility
        import tqdm
        print_flush(f"[OK] TQDM version: {tqdm.__version__}")
        
        # Configure tqdm to show progress bars properly in terminal
        from tqdm import tqdm as tqdm_original
        tqdm_original.monitor_interval = 0.1
        tqdm_original.miniters = 1
        
        # Configure huggingface_hub for progress tracking
        from huggingface_hub import hf_hub_download
        print_flush("[OK] Progress tracking configured")
        
    except ImportError as e:
        print_flush(f"[ERROR] Import error: {e}")
        raise
    
    # Import project modules
    print_flush("[2/5] Loading project modules...")
    from models import get_model
    from utils.config_loader import config_loader
    print_flush("[OK] Project modules loaded successfully")
    
    print_flush("[3/5] Loading configuration...")
    
    # Get model info
    models_config = config_loader.load_models_config()
    model_config = models_config.get('models', {}).get('${modelId}')
    
    if not model_config:
        print_flush(f"[ERROR] Model '${modelId}' not found in configuration!")
        print_flush("Available models:")
        for available_model in models_config.get('models', {}).keys():
            print_flush(f"  - {available_model}")
        input("Press Enter to close...")
        sys.exit(1)
    
    print_flush(f"[4/5] Model Information:")
    print_flush(f"    Name: {model_config.get('name', '${modelId}')}")
    print_flush(f"    Description: {model_config.get('description', 'N/A')}")
    print_flush(f"    Hugging Face ID: {model_config.get('huggingface_id', 'N/A')}")
    print_flush(f"    Pipeline Class: {model_config.get('pipeline_class', 'N/A')}")
    print_flush("-" * 60)
    
    hf_id = model_config.get('huggingface_id')
    print_flush(f"[5/5] Starting download for {hf_id}...")
    print_flush("Note: Large models can be 5-20GB in size")
    print_flush("")
    print_flush("Starting model download...")
    print_flush("Progress bars should appear below:")
    print_flush("")
    
    # Download the model
    start_time = time.time()
    
    # Direct model loading - this should show progress bars
    model = get_model('${modelId}')
    
    elapsed_time = time.time() - start_time
    print_flush("")
    print_flush("=" * 60)
    print_flush("[SUCCESS] Model download completed!")
    print_flush(f"[SUCCESS] Model '${modelId}' is now ready for image generation.")
    print_flush(f"[SUCCESS] Download completed in {elapsed_time:.1f} seconds")
    print_flush("[SUCCESS] You can close this window and try generating images.")
    print_flush("=" * 60)
        
except Exception as e:
    print_flush(f"\\n[ERROR] {str(e)}")
    print_flush("")
    print_flush("Error details:")
    import traceback
    traceback.print_exc()
    print_flush("")
    input("Press Enter to close...")
    sys.exit(1)

# Keep window open
print_flush("")
print_flush("[SUCCESS] Download completed! You can now close this terminal.")
print_flush("Press Enter to close this window...")
input()
`;
  }

  public stopBackend(): void {
    this.stopHealthCheck();

    if (this.backendProcess) {
      this.backendProcess.kill();
      this.backendProcess = null;
    }

    // Close all model download terminals
    this.modelDownloadTerminals.forEach((terminal, modelId) => {
      try {
        terminal.kill();
      } catch (err) {
        console.error(`[Backend] Failed to kill terminal for ${modelId}:`, err);
      }
    });
    this.modelDownloadTerminals.clear();

    this.isBackendReady = false;
    this.healthCheckStarted = false;
  }

  // Public method to close loading window when backend is ready
  public closeLoadingWindow(): void {
    if (this.loadingWindow && !this.loadingWindow.isDestroyed()) {
      this.loadingWindow.close();
      this.loadingWindow = null;
    }
  }

  // ----------------------------
  // Private Methods
  // ----------------------------
  private async setupBackend(resourcesPath: string) {
    let totalSteps = 0;
    let currentStep = 0;

    const pythonExe = await this.findSystemPython();

    if (!pythonExe) {
      this.loadingWindow?.sendStatusText(
        "Python interpreter not found. Please install Python 3.10 or higher."
      );

      throw new Error("Python interpreter not found");
    }

    this.loadingWindow?.sendStatusText(
      "Python interpreter found: " + pythonExe
    );

    // Check pip exists
    await this.checkPip(pythonExe);
    this.loadingWindow?.sendPercentage(10);

    // Install requirements
    const requirementsPath = path.join(resourcesPath, "requirements.txt");
    const requirements = fs.readFileSync(requirementsPath, "utf8").split("\n");
    const notInstalledRequirements: string[] = [];

    totalSteps = requirements.filter((req) => req.trim().length > 0).length;

    for (const requirement of requirements) {
      const moduleName = requirement
        .split("==")[0]
        .split(">=")[0]
        .split("<=")[0]
        .trim();

      if (!moduleName) continue;

      const moduleExists = await this.checkModule(
        pythonExe,
        moduleName,
        resourcesPath
      );

      const requirementName = requirement.trim();

      if (!moduleExists && requirementName.length > 0) {
        this.loadingWindow?.sendStatusText(
          `"${moduleName}" module is not installed, it will be installed automatically`
        );
        notInstalledRequirements.push(requirementName);
      } else {
        this.loadingWindow?.sendStatusText(`"${moduleName}" module is ready`);
      }

      currentStep++;
      this.loadingWindow?.sendPercentage(10 + (currentStep / totalSteps) * 60);
    }

    if (notInstalledRequirements.length > 0) {
      this.loadingWindow?.sendStatusText(
        "Preparing to install requirements..."
      );

      const installArgs = ["-m", "pip", "install", "--prefer-binary"];

      if (
        notInstalledRequirements.some(
          (item) =>
            item.startsWith("torch") ||
            item.startsWith("torchvision") ||
            item.startsWith("torchaudio")
        )
      ) {
        installArgs.push(
          "--extra-index-url",
          "https://download.pytorch.org/whl/cu121"
        );
      }

      installArgs.push(...notInstalledRequirements);

      this.loadingWindow?.sendStatusText("Installing requirements...");

      this.loadingWindow?.sendPercentage(70);

      await this.runCommand(pythonExe, installArgs, resourcesPath, (output) => {
        if (this.loadingWindow) {
          this.loadingWindow.webContents.send("setup-log", output);
        }
      });

      this.loadingWindow?.sendPercentage(85);
    } else {
      this.loadingWindow?.sendStatusText(
        "Requirements already installed, continuing..."
      );
      this.loadingWindow?.sendPercentage(85);
    }

    this.loadingWindow?.sendStatusText(
      "Backend setup complete - Starting Flask server..."
    );

    // this.loadingWindow?.sendPercentage(100);

    // Don't close loading window immediately, wait for backend health check
    return pythonExe;
  }

  private startHealthCheck(): void {
    this.loadingWindow?.sendPercentage(90);

    // Prevent multiple health check intervals
    if (this.healthCheckStarted) {
      console.log("[Backend] Health check already started, skipping...");
      return;
    }

    this.healthCheckStarted = true;

    console.log("[Backend] Starting health check interval...");

    // Wait a bit before starting health checks
    setTimeout(() => {
      this.healthCheckInterval = setInterval(this.checkBackendHealth, 2000); // Check every 2 seconds
    }, 1000);
  }

  private async checkBackendHealth(): Promise<void> {
    try {
      const healthUrl = absoluteBackendUrl("/health");

      console.log("[Backend] Checking health at:", healthUrl);

      const response = await axios.get(healthUrl, {
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });

      console.log("[Backend] Health check response:", response.data);

      if (response.data?.status === "healthy" && !this.isBackendReady) {
        console.log("[Backend] Health check passed - Backend is ready!");
        this.isBackendReady = true;

        // Stop health checking once backend is ready
        this.stopHealthCheck();

        // Notify frontend that backend is ready
        this.mainWindow.updateBackendStatus({
          ready: true,
          modelsLoaded: response.data.models_loaded || 0,
        });

        console.log(
          `[Backend] ${response.data.models_loaded || 0} models loaded`
        );

        this.loadingWindow?.sendPercentage(100);

        // Close loading window and show main window
        setTimeout(() => {
          this.closeLoadingWindow();
          this.mainWindow.showAndFocus();
        }, 1000);
      }
    } catch (error: any) {
      console.log("[Backend] Health check failed:", error.message || error);

      if (this.isBackendReady) {
        console.log(
          "[Backend] Health check failed - Backend is no longer available"
        );
        this.isBackendReady = false;
        this.mainWindow.updateBackendStatus({ ready: false });
      }
      // Don't log every failed attempt to reduce noise for expected connection errors
    }
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.healthCheckStarted = false;
  }

  private async runCommand(
    command: string,
    args: string[],
    cwd: string,
    onOutput?: (data: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { cwd, stdio: "pipe" });

      process.stdout.on("data", (data) => {
        onOutput?.(data.toString());
      });

      process.stderr.on("data", (data) => {
        onOutput?.(data.toString());
      });

      let errorOutput = "";

      process.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`Command failed with exit code ${code}: ${errorOutput}`)
          );
        }
      });
    });
  }

  private checkModule(
    pythonPath: string,
    moduleName: string,
    cwd: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const check = spawn(pythonPath, ["-c", `import ${moduleName}`], { cwd });

      check.on("close", (code) => {
        resolve(code === 0);
      });
    });
  }

  private async findSystemPython(): Promise<string> {
    const pythonCommands =
      process.platform === "win32"
        ? ["python", "python3", "py"]
        : ["python3", "python"];

    for (const pythonCmd of pythonCommands) {
      const pythonPath = await this.tryFindPython(pythonCmd);
      if (pythonPath) {
        return pythonPath;
      }
    }

    return "";
  }

  private async tryFindPython(command: string): Promise<string> {
    return new Promise((resolve) => {
      let which: ChildProcess;

      if (process.platform === "win32") {
        // Windows
        which = spawn("where", [command]);
      } else {
        // Linux/MacOS
        which = spawn("which", [command]);
      }

      let pathData = "";

      which.stdout?.on("data", (data) => {
        pathData += data.toString();
      });

      which.on("close", (code) => {
        if (code === 0 && pathData) {
          const firstPath = pathData.trim().split("\n")[0].trim();
          resolve(firstPath);
        } else {
          resolve("");
        }
      });
    });
  }

  // Check pip exists
  private checkPip(pythonExe: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(`${pythonExe} -m pip --version`, (err) => {
        if (err) {
          this.loadingWindow?.sendStatusText(
            "pip is not installed, installing..."
          );

          exec(`${pythonExe} -m ensurepip --upgrade`, (err2) => {
            if (err2) {
              this.loadingWindow?.sendStatusText(
                "Error: pip could not be installed"
              );
              reject(new Error("pip installation failed"));
            } else {
              this.loadingWindow?.sendStatusText("pip successfully installed");
              resolve();
            }
          });
        } else {
          this.loadingWindow?.sendStatusText("pip is already installed");
          resolve();
        }
      });
    });
  }
}
