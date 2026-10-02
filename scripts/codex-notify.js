// This is called by the user-level Codex `notify` setting with one JSON argument.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const payload = process.argv[2];
if (!payload) process.exit(0);
const userData = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'wipi');
try {
  const previous = JSON.parse(fs.readFileSync(path.join(userData, 'previous-notify.json'), 'utf8'));
  if (Array.isArray(previous) && previous.length) {
    const child = spawn(previous[0], [...previous.slice(1), payload], { detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', () => {});
    child.unref();
  }
} catch { /* No previous hook to preserve. */ }
try {
  const { token } = JSON.parse(fs.readFileSync(path.join(userData, 'settings.json'), 'utf8'));
  const req = http.request({ hostname: '127.0.0.1', port: 47823, path: '/notify', method: 'POST', timeout: 1500,
    headers: { 'Content-Type': 'application/json', 'X-Wipi-Token': token } }, res => res.resume());
  req.on('error', () => {});
  req.on('timeout', () => req.destroy());
  req.end(payload);
} catch { /* Wipi is not running. */ }
