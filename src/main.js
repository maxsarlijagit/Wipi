const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const { normalizeEvent, fromCodexNotify } = require('./events');
const { CodexWatcher } = require('./codex-watcher');
const { ClaudeActivityTracker } = require('./claude-activity');
const { installClaudeHooks, defaultClaudeSettingsPath } = require('./claude-integration');

const PORT = 47823;
const THEMES = ['graphite', 'pearl', 'violet', 'mint', 'sunset'];
let win, tray, server, watcher, claudeTracker, activityTimer, settings, token;
let history = [];
let activities = [];
let codexActivities = [];
let lastActivities = '';
const seenIds = new Set();
let dismissTimer;
let quitting = false;
let expanded = false;
let changingBounds = false;
let moveTimer;
const SIZES = { compact: { width: 438, height: 92 }, expanded: { width: 460, height: 548 } };

function settingsPath() { return path.join(app.getPath('userData'), 'settings.json'); }
function loadSettings() {
  try { settings = JSON.parse(fs.readFileSync(settingsPath(), 'utf8')); } catch { settings = {}; }
  if (!THEMES.includes(settings.theme)) settings.theme = 'graphite';
  if (typeof settings.startWithWindows !== 'boolean') settings.startWithWindows = false;
  token = settings.token || crypto.randomBytes(24).toString('hex');
  settings.token = token;
  saveSettings();
}
function saveSettings() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), { mode: 0o600 });
}
function currentAnchor() {
  if (Number.isFinite(settings.position?.x) && Number.isFinite(settings.position?.y)) return settings.position;
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { x, y, width } = display.workArea;
  return { x: Math.round(x + (width - SIZES.compact.width) / 2), y: y + 12 };
}
function placeWindow() {
  const size = expanded ? SIZES.expanded : SIZES.compact;
  const anchor = currentAnchor();
  const display = screen.getDisplayNearestPoint(anchor);
  const area = display.workArea;
  const x = Math.min(Math.max(anchor.x, area.x), area.x + area.width - size.width);
  const y = Math.min(Math.max(anchor.y, area.y), area.y + area.height - size.height);
  changingBounds = true;
  win.setBounds({ x, y, ...size });
  setTimeout(() => { changingBounds = false; }, 150);
}
function refreshActivities() {
  activities = [...codexActivities, ...(claudeTracker?.snapshot() || [])]
    .sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 12);
  const serialized = JSON.stringify(activities);
  if (serialized === lastActivities) return;
  lastActivities = serialized;
  win?.webContents.send('activities', activities);
}
function updateCodexActivities(snapshot) {
  codexActivities = snapshot;
  refreshActivities();
}
function connectClaudeCode() {
  try {
    const script = path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '..'), 'scripts', 'wipi-claude-hook.ps1');
    if (!fs.existsSync(script)) throw new Error('No se encontró el hook incluido en Wipi.');
    installClaudeHooks(defaultClaudeSettingsPath(), script);
    publish({ source: 'test', title: 'Claude Code conectado', body: 'Reiniciá Claude Code CLI o abrí una nueva sesión local en Desktop Code.' });
  } catch (error) {
    publish({ source: 'test', title: 'No se pudo conectar Claude', body: error.message });
  }
}
function publish(event) {
  const item = normalizeEvent(event);
  if (!item) return;
  if (item.id && seenIds.has(item.id)) return;
  if (item.id) { seenIds.add(item.id); if (seenIds.size > 100) seenIds.delete(seenIds.values().next().value); }
  history.unshift(item);
  history = history.slice(0, 30);
  if (win) {
    win.webContents.send('event', item);
    win.webContents.send('history', history);
    win.showInactive();
  }
  clearTimeout(dismissTimer);
  dismissTimer = setTimeout(() => win?.webContents.send('idle'), 6800);
}
function createWindow() {
  win = new BrowserWindow({
    width: SIZES.compact.width, height: SIZES.compact.height, frame: false, transparent: true, resizable: false,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: false, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.setAlwaysOnTop(true, 'pop-up-menu');
  win.setVisibleOnAllWorkspaces(true);
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
  win.once('ready-to-show', () => { placeWindow(); win.showInactive(); });
  win.on('moved', () => {
    if (changingBounds) return;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      const [x, y] = win.getPosition();
      settings.position = { x, y };
      saveSettings();
    }, 350);
  });
  win.on('close', e => { if (!quitting) { e.preventDefault(); win.hide(); } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}
function trayIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="9" fill="#2c2430"/><path d="M8 11h14v9a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z" fill="#e9ac90"/><path d="M22 13h2a4 4 0 0 1 0 8h-2" fill="none" stroke="#e9ac90" stroke-width="2"/><path d="M12 5c-2 2 2 3 0 5m6-5c-2 2 2 3 0 5" fill="none" stroke="#f3e4d9" stroke-linecap="round"/></svg>`;
  return nativeImage.createFromDataURL('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
}
function updateTray() {
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mostrar Wipi', click: () => { win.showInactive(); placeWindow(); } },
    { label: 'Volver arriba al centro', click: () => { delete settings.position; saveSettings(); placeWindow(); } },
    { label: 'Probar notificación', click: () => publish({source:'test', title:'Todo en su lugar', body:'Wipi está listo para acompañarte.'}) },
    { type: 'separator' },
    { label: 'Tema', submenu: THEMES.map(theme => ({ label: theme[0].toUpperCase()+theme.slice(1), type: 'radio', checked: settings.theme === theme, click: () => setTheme(theme) })) },
    { label: 'Conectar Claude Code', click: connectClaudeCode },
    { label: 'Abrir carpeta de configuración', click: () => shell.openPath(app.getPath('userData')) },
    { label: 'Iniciar con Windows', type: 'checkbox', checked: settings.startWithWindows, click: item => {
      settings.startWithWindows = item.checked; saveSettings();
      if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: item.checked });
      updateTray();
    } },
    { type: 'separator' },
    { label: 'Salir', click: () => { quitting = true; app.quit(); } }
  ]));
}
function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  settings.theme = theme; saveSettings();
  win.webContents.send('theme', theme);
  updateTray();
}
function startServer() {
  server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    if (origin && /^chrome-extension:\/\//.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Wipi-Token');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST' || !['/notify', '/claude-hook'].includes(req.url)) { res.writeHead(404); res.end(); return; }
    if (req.headers['x-wipi-token'] !== token) { res.writeHead(401); res.end(); return; }
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 16384) req.destroy(); });
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { res.writeHead(400); res.end(); return; }
      if (req.url === '/claude-hook') {
        if (!claudeTracker.consume(data)) { res.writeHead(400); res.end(); return; }
        res.writeHead(204); res.end(); return;
      }
      const event = data.type === 'agent-turn-complete' ? fromCodexNotify(data) : normalizeEvent(data);
      if (!event) { res.writeHead(400); res.end(); return; }
      publish(event); res.writeHead(204); res.end();
    });
  });
  server.on('error', err => publish({ source:'test', title:'Puerto ocupado', body: `No se pudo abrir 127.0.0.1:${PORT}: ${err.code}` }));
  server.listen(PORT, '127.0.0.1');
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { win?.showInactive(); });
  app.whenReady().then(() => {
    loadSettings(); createWindow();
    tray = new Tray(trayIcon()); tray.setToolTip('Wipi'); tray.on('double-click', () => win.showInactive()); updateTray();
    claudeTracker = new ClaudeActivityTracker(publish, refreshActivities);
    startServer();
    watcher = new CodexWatcher(publish, updateCodexActivities); watcher.start();
    activityTimer = setInterval(refreshActivities, 2500);
    screen.on('display-metrics-changed', placeWindow);
  });
}
ipcMain.handle('bootstrap', () => ({ theme: settings.theme, history, activities, token, port: PORT }));
ipcMain.on('theme', (_, theme) => setTheme(theme));
ipcMain.on('expand', (_, value) => { expanded = Boolean(value); placeWindow(); });
ipcMain.on('test', () => publish({ source:'test', title:'Una pausa agradable', body:'Tu espacio de trabajo está al día.' }));
ipcMain.on('hide', () => win.hide());
app.on('before-quit', () => { quitting = true; watcher?.stop(); clearInterval(activityTimer); server?.close(); });
