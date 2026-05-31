import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, dialog, shell } from 'electron';
import path from 'path';
import log from 'electron-log';
import Store from 'electron-store';
import { initDatabase, getDatabase } from './database.js';
import { setupIpcHandlers } from './ipc-handlers.js';

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');

// Configure logging
log.transports.file.level = 'info';
log.transports.file.maxSize = 10 * 1024 * 1024;
log.info('Application starting...');

// Initialize store
const store = new Store({
  encryptionKey: 'enterprise-pos-secret-key-2024',
  defaults: {
    windowBounds: { width: 1400, height: 900 },
    theme: 'light',
    language: 'en',
    autoBackup: true,
    backupInterval: 24,
    lastBackup: null,
    deviceId: null,
    branchId: null,
    terminalId: null,
    loggedInUser: null,
    rememberLogin: false
  }
});

let mainWindow = null;
let splashWindow = null;
let tray = null;

// Global exception handler
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  const message = error?.message || error?.toString() || 'Unknown error';
  try {
    dialog.showErrorBox('Critical Error', message);
  } catch (e) {
    log.error('Could not show error dialog:', e);
  }
  app.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Rejection:', reason);
  const message = reason?.message || reason?.toString() || 'Unknown rejection';
  try {
    dialog.showErrorBox('Unhandled Error', message);
  } catch (e) {
    log.error('Could not show error dialog:', e);
  }
});

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, '../../splash.html'));
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createMainWindow() {
  const { width, height } = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 1200,
    minHeight: 700,
    frame: true,
    show: false,
    backgroundColor: '#f8fafc',
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      spellcheck: true,
      webSecurity: false,
      backgroundThrottling: false
    }
  });

  // Load the app
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      log.error('Failed to load dev server:', err);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).catch(err => {
      log.error('Failed to load renderer:', err);
    });
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
    log.info('Main window displayed');
  });

  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log.error('Renderer process gone:', details);
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log.error('Failed to load URL:', errorCode, errorDescription, validatedURL);
    setTimeout(() => {
      if (mainWindow && !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
      } else if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
      }
    }, 1000);
  });

  // Create application menu
  createApplicationMenu();
  
  // Create system tray
  createSystemTray();

  log.info('Main window created successfully');
  return mainWindow;
}

function createApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Sale', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu-action', 'new-sale') },
        { label: 'New Purchase', accelerator: 'CmdOrCtrl+Shift+N', click: () => mainWindow?.webContents.send('menu-action', 'new-purchase') },
        { type: 'separator' },
        { label: 'Backup Data', accelerator: 'CmdOrCtrl+B', click: () => mainWindow?.webContents.send('menu-action', 'backup') },
        { label: 'Restore Data', click: () => mainWindow?.webContents.send('menu-action', 'restore') },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => mainWindow?.webContents.send('menu-action', 'settings') },
        { type: 'separator' },
        { label: 'Exit', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Sales',
      submenu: [
        { label: 'POS', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('navigate', '/pos') },
        { label: 'Sales List', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('navigate', '/sales') },
        { label: 'Returns', click: () => mainWindow?.webContents.send('navigate', '/returns') }
      ]
    },
    {
      label: 'Inventory',
      submenu: [
        { label: 'Products', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('navigate', '/products') },
        { label: 'Categories', click: () => mainWindow?.webContents.send('navigate', '/categories') },
        { label: 'Brands', click: () => mainWindow?.webContents.send('navigate', '/brands') },
        { label: 'Stock', click: () => mainWindow?.webContents.send('navigate', '/inventory') },
        { label: 'Stock Transfer', click: () => mainWindow?.webContents.send('navigate', '/transfers') }
      ]
    },
    {
      label: 'Purchases',
      submenu: [
        { label: 'Purchase Orders', click: () => mainWindow?.webContents.send('navigate', '/purchases') },
        { label: 'Suppliers', click: () => mainWindow?.webContents.send('navigate', '/suppliers') }
      ]
    },
    {
      label: 'People',
      submenu: [
        { label: 'Customers', click: () => mainWindow?.webContents.send('navigate', '/customers') },
        { label: 'Employees', click: () => mainWindow?.webContents.send('navigate', '/employees') }
      ]
    },
    {
      label: 'Finance',
      submenu: [
        { label: 'Accounts', click: () => mainWindow?.webContents.send('navigate', '/accounts') },
        { label: 'Expenses', click: () => mainWindow?.webContents.send('navigate', '/expenses') },
        { label: 'Reports', click: () => mainWindow?.webContents.send('navigate', '/reports') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => mainWindow?.webContents.send('navigate', '/settings') },
        { type: 'separator' },
        { label: 'About Enterprise POS', click: () => mainWindow?.webContents.send('menu-action', 'about') }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createSystemTray() {
  const iconPath = path.join(__dirname, '../../build/icon.png');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGUSURBVFiF7Zc9TsNAEIW/WUfCQEFBQUFJQYFSUnAcgJOC4ggOQEFBQUlJQYFSUlBQgoLCLxZjK7P7OXGCEKTILmt3ftmd2Z0dDAYDhmEYhmEYhmEYhvG7cAV8AT7xX+AD+AK+gbQxZxdwBXwBX8A38AM4N+3cNV3dN67dAFdt2x7a/8A7Q7qum7P/C7gAbrpuu+m/AhfALXA5xHq0bfsI/AC/gTfgx9Z9A+6BW+ACuDHt2jR8ALfANXAJfJp2vYB74Nq0c9POh3wD3AM3wAVwZdq5aNgBcGvauWnnwA1wC1wBF8CFaeeiYQCuTTs37dw0/AU3wA1wAZybdi4aNqadm3Y+5Bu4A26Ac+DctHPRsMO+nZt2bqP5C7gGLoFz085FwwZ8mHZu2rkN8x9wA1wB56adi4YNsDbt3LRzG+Y/4Bo4B85NOxcNG2Ddp52bdi6E/gLXwDlgA5ybdi4aNuDOtHPTzoXQO3ANXADnpp2Lhg24Mu3ctHMh9Ba4As6Bc9PORcMGXAI2wLlp50LoGrgALoBz085Fwwacm3Zu2rkQugIugQvg3LRz0bABZ6adm3YuhC6BS+ACODftXDRswLlJuyqE3oBL4AI4N+1cNGyAJWnngJ0LQh+AS+ACODftXDRswJlJuyqE3gMXwAVwbtr5b8MA8A8m8xQj7a5LJQAAAABJRU5ErkJggg==') : trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Enterprise POS', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Quick Sale', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', '/pos'); } },
    { label: 'Dashboard', click: () => { mainWindow?.show(); mainWindow?.webContents.send('navigate', '/'); } },
    { type: 'separator' },
    { label: 'Settings', click: () => { mainWindow?.show(); mainWindow?.webContents.send('menu-action', 'settings'); } },
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() }
  ]);

  tray.setToolTip('Enterprise POS ERP');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

app.whenReady().then(async () => {
  log.info('App is ready, initializing...');
  
  try {
    // Initialize database
    await initDatabase();
    log.info('Database initialized successfully');
    
    // Create windows
    createSplashWindow();
    const win = createMainWindow();

    // Setup IPC handlers with window reference
    setupIpcHandlers(ipcMain, store, win);
    log.info('IPC handlers setup complete');
    
  } catch (error) {
    log.error('Initialization error:', error);
    const message = error?.message || error?.toString() || 'Unknown initialization error';
    try {
      dialog.showErrorBox('Initialization Error', message);
    } catch (e) {
      log.error('Could not show error dialog:', e);
    }
    app.exit(1);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  log.info('Application quitting...');
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
  }
});

export { mainWindow, store };