declare global {
  interface Window {
    /**
     * Indicates that the pixels.js script has loaded and is ready.
     * Set by pixels.js after initializing event listeners.
     */
    pixelsScriptReady?: boolean;
  }
}

export {};
