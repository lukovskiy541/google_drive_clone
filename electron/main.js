const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const next = require('next');

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

// Choose a random available port by letting the OS assign one (port 0)
async function createNextServer(port = 0) {
  const dev = !app.isPackaged;
  // Resolve project root (where next.config.* and .next live)
  const projectRoot = path.resolve(__dirname, '..');

  const nextApp = next({ dev, dir: projectRoot });
  const handle = nextApp.getRequestHandler();

  await nextApp.prepare();

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => handle(req, res));
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      resolve({ server, port: actualPort });
    });
  });
}

/** @type {BrowserWindow | null} */
let mainWindow = null;

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

let httpServerRef = null;

app.whenReady().then(async () => {
  try {
    const { server, port } = await createNextServer(0);
    httpServerRef = server;
    const baseUrl = `http://localhost:${port}`;
    createWindow(baseUrl);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow(baseUrl);
      }
    });
  } catch (err) {
    console.error('Failed to start Next server inside Electron:', err);
    app.quit();
  }
});

app.on('before-quit', () => {
  if (httpServerRef) {
    try {
      httpServerRef.close();
    } catch (e) {
      // ignore
    }
  }
});
