const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const configPath = path.join(home, 'config.toml');
const userData = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'wipi');
const script = path.resolve(__dirname, 'codex-notify.js');
if (!fs.existsSync(configPath)) { console.error(`No existe ${configPath}`); process.exit(1); }
const contents = fs.readFileSync(configPath, 'utf8');
const line = /^notify\s*=\s*(\[[^\r\n]*\])\s*$/m;
const match = contents.match(line);
let previous = null;
if (match) {
  try { previous = JSON.parse(match[1]); } catch { console.error('El notify actual usa un formato que Wipi no puede preservar automáticamente.'); process.exit(1); }
  if (!Array.isArray(previous)) process.exit(1);
  if (previous[1] === script) { console.log('Wipi ya está conectado a Codex.'); process.exit(0); }
}
fs.mkdirSync(userData, { recursive: true });
if (previous) fs.writeFileSync(path.join(userData, 'previous-notify.json'), JSON.stringify(previous, null, 2));
const replacement = `notify = ${JSON.stringify([process.execPath, script])}`;
const next = match ? contents.replace(line, replacement) : `${replacement}\n${contents}`;
const backup = configPath + '.wipi-backup';
if (!fs.existsSync(backup)) fs.copyFileSync(configPath, backup);
fs.writeFileSync(configPath, next);
console.log(`Codex CLI conectado. Respaldo: ${backup}`);
