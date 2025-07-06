import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";

/**
 * Base Window Class
 *
 * Provides common properties and methods for all Electron windows.
 * Extends BrowserWindow, so it is already a BrowserWindow itself.
 */
export class BaseWindow extends BrowserWindow {
  constructor(options: BrowserWindowConstructorOptions = {}) {
    super(options);
  }

  /**
   * Shows window and focuses on it
   */
  public showAndFocus(): void {
    this.show();
    this.focus();
  }

  /**
   * Close window safely
   */
  public safeClose(): void {
    if (!this.isDestroyed()) {
      this.close();
    }
  }
}
