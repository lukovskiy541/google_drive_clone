const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Improve HiDPI support and Wayland behavior, especially on Hyprland
app.commandLine.appendSwitch('high-dpi-support', '1');

// Optional scaling override: export ELECTRON_SCALE_FACTOR=1.25 (or 1.0, 1.5, etc.)
const forcedScale = process.env.ELECTRON_SCALE_FACTOR || process.env.DESKTOP_SCALE;
if (forcedScale) {
  app.commandLine.appendSwitch('force-device-scale-factor', String(forcedScale));
}

// Prefer Wayland when available to avoid XWayland scaling artifacts
const isWayland = process.env.XDG_SESSION_TYPE === 'wayland'
  || !!process.env.WAYLAND_DISPLAY
  || (process.env.XDG_CURRENT_DESKTOP || '').toLowerCase().includes('hyprland');
if (isWayland) {
  // Let Chromium pick Wayland if available; also enable server-side decorations
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
  app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,WaylandWindowDecorations');
  app.commandLine.appendSwitch('enable-wayland-ime');
}

/** @type {BrowserWindow | null} */
let mainWindow = null;

const targetUrl = (() => {
  const explicit = process.env.DESKTOP_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) {
    return explicit;
  }

  if (app.isPackaged) {
    throw new Error('DESKTOP_APP_URL is not set. Provide the deployment URL for the desktop shell.');
  }

  return 'http://localhost:3000';
})();

function createWindow(baseUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      // Keep the renderer sandboxed and secure by default
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(baseUrl);

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  // On macOS it's common to keep the app open until the user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(async () => {
  try {
    createWindow(targetUrl);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(targetUrl);
      }
    });
  } catch (err) {
    console.error('Failed to launch desktop window:', err);
    app.quit();
  }
});
