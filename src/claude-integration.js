const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const EVENTS = ['UserPromptSubmit', 'PreToolUse', 'Stop', 'StopFailure', 'SessionEnd'];
const SCRIPT_NAME = 'wipi-claude-hook.ps1';

function isWipiHook(handler) {
  return handler?.type === 'command' && Array.isArray(handler.args) &&
    handler.args.some(arg => typeof arg === 'string' && path.basename(arg).toLowerCase() === SCRIPT_NAME);
}

function installClaudeHooks(settingsFile, scriptFile) {
  const settings = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile, 'utf8')) : {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Claude settings.json inválido');
  if (settings.hooks != null && (typeof settings.hooks !== 'object' || Array.isArray(settings.hooks))) throw new Error('Claude hooks inválidos');
  settings.hooks ||= {};
  for (const event of EVENTS) {
    const groups = settings.hooks[event] || [];
    if (!Array.isArray(groups)) throw new Error(`Claude hooks.${event} inválido`);
    const preserved = groups.flatMap(group => {
      if (!group || !Array.isArray(group.hooks)) return [group];
      const hooks = group.hooks.filter(handler => !isWipiHook(handler));
      return hooks.length ? [{ ...group, hooks }] : [];
    });
    preserved.push({ hooks: [{
      type: 'command', command: 'powershell.exe',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFile],
    }] });
    settings.hooks[event] = preserved;
  }
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  if (fs.existsSync(settingsFile) && !fs.existsSync(`${settingsFile}.wipi-backup`)) fs.copyFileSync(settingsFile, `${settingsFile}.wipi-backup`);
  const temporary = `${settingsFile}.wipi-tmp-${process.pid}`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(settings, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(temporary, settingsFile);
  } catch (error) {
    try { fs.unlinkSync(temporary); } catch { /* Nothing to remove. */ }
    throw error;
  }
  return settingsFile;
}

function defaultClaudeSettingsPath() { return path.join(os.homedir(), '.claude', 'settings.json'); }

module.exports = { installClaudeHooks, defaultClaudeSettingsPath, EVENTS };
