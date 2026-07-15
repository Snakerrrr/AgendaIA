import { app, BrowserWindow, Tray, Menu, nativeImage, dialog, globalShortcut, ipcMain, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initDatabase, closeDatabase, generateDailyHabits, getSetting, setSetting } from './database';
import { registerIpcHandlers } from './ipc-handlers';
import { startReminderService, stopReminderService, setDoNotDisturb } from './notifications';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

if (started) { app.quit(); }

let mainWindow: BrowserWindow | null = null;
let widgetWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    frame: false, titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#080808', symbolColor: '#8b8b8b', height: 40 },
    backgroundColor: '#080808', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
  mainWindow.on('close', (event) => { if (tray) { event.preventDefault(); mainWindow?.hide(); } });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createWidget(): void {
  if (widgetWindow) {
    if (widgetWindow.isVisible()) { widgetWindow.hide(); } else { positionWidget(); widgetWindow.show(); }
    return;
  }

  widgetWindow = new BrowserWindow({
    width: 340, height: 480,
    frame: false, transparent: false, resizable: false,
    skipTaskbar: true, alwaysOnTop: true,
    backgroundColor: '#080808',
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });

  const widgetUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL
    ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}#widget`
    : undefined;

  if (widgetUrl) {
    widgetWindow.loadURL(widgetUrl);
  } else {
    widgetWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: 'widget' }
    );
  }

  widgetWindow.once('ready-to-show', () => { positionWidget(); widgetWindow?.show(); });
  widgetWindow.on('blur', () => { widgetWindow?.hide(); });
  widgetWindow.on('closed', () => { widgetWindow = null; });
}

function positionWidget(): void {
  if (!widgetWindow) return;
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const [ww, wh] = widgetWindow.getSize();
  widgetWindow.setPosition(width - ww - 16, height - wh - 16);
}

function createTrayIcon(): Electron.NativeImage {
  const size = 16;
  return nativeImage.createFromBuffer(createTrayIconBuffer(size), { width: size, height: size });
}

function createTrayIconBuffer(size: number): Buffer {
  const channels = 4;
  const buf = Buffer.alloc(size * size * channels);
  const center = size / 2, radius = size / 2 - 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * channels;
      if (Math.sqrt((x - center) ** 2 + (y - center) ** 2) <= radius) {
        buf[idx] = 59; buf[idx + 1] = 130; buf[idx + 2] = 246; buf[idx + 3] = 255;
      }
    }
  }
  return buf;
}

function createTray(): void {
  try {
    tray = new Tray(createTrayIcon());
    tray.setToolTip('AgendaIA');
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Abrir AgendaIA', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } else { createWindow(); } } },
      { label: 'Mini Widget', click: () => createWidget() },
      { type: 'separator' },
      { label: 'Salir', click: () => { tray?.destroy(); tray = null; app.quit(); } },
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('click', () => createWidget());
    tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } else { createWindow(); } });
  } catch (err) {
    console.error('Failed to create tray:', err);
  }
}

app.whenReady().then(async () => {
  try { await initDatabase(); } catch (err) {
    dialog.showErrorBox('Error al iniciar AgendaIA', `No se pudo inicializar la base de datos:\n${err instanceof Error ? err.message : String(err)}`);
    app.quit(); return;
  }
  registerIpcHandlers();
  createWindow();
  createTray();
  startReminderService();
  generateDailyHabits();
  startDayChangeDetector();
  registerGlobalShortcut();
  setupAutoStart();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin' && !tray) app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('before-quit', () => { stopReminderService(); closeDatabase(); tray?.destroy(); tray = null; });

function registerGlobalShortcut(): void {
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.send('quick-add'); }
    else { createWindow(); }
  });
  globalShortcut.register('CommandOrControl+K', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); mainWindow.webContents.send('open-search'); }
  });
}

function setupAutoStart(): void {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({ openAtLogin: getSetting('autostart') !== 'false', openAsHidden: true });
}

ipcMain.handle('app:getAutoStart', () => getSetting('autostart') !== 'false');
ipcMain.handle('app:setAutoStart', (_e, enabled: boolean) => {
  setSetting('autostart', enabled ? 'true' : 'false');
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: true });
});
ipcMain.handle('app:getDnd', () => getSetting('dnd') === 'true');
ipcMain.handle('app:setDnd', (_e, enabled: boolean) => { setSetting('dnd', enabled ? 'true' : 'false'); setDoNotDisturb(enabled); });
ipcMain.handle('app:openMain', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } else { createWindow(); } widgetWindow?.hide(); });

let lastCheckedDate = new Date().toISOString().split('T')[0];
function startDayChangeDetector(): void {
  setInterval(() => {
    const today = new Date().toISOString().split('T')[0];
    if (today !== lastCheckedDate) {
      lastCheckedDate = today;
      generateDailyHabits();
    }
  }, 60_000);
}

process.on('uncaughtException', (err) => { dialog.showErrorBox('Error inesperado', err.message); });
