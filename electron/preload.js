// Minimal preload to keep the renderer sandboxed and allow future IPC if needed.
// For now, we don't expose any Node APIs to the renderer.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  // Reserved for future APIs
});

