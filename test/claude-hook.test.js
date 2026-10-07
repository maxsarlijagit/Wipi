const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

test('PowerShell hook forwards lifecycle metadata without conversation text', { skip: process.platform !== 'win32' }, async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wipi-hook-'));
  const settingsDir = path.join(dir, 'wipi');
  fs.mkdirSync(settingsDir);
  fs.writeFileSync(path.join(settingsDir, 'settings.json'), JSON.stringify({ token: 'test-token' }));
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      server.received = { url: req.url, token: req.headers['x-wipi-token'], body: JSON.parse(Buffer.concat(chunks).toString()) };
      res.writeHead(204); res.end();
    });
  });
  try {
    try { await new Promise((resolve, reject) => server.once('error', reject).listen(47823, '127.0.0.1', resolve)); }
    catch (error) {
      if (error.code === 'EADDRINUSE') { t.skip('Wipi is already using its local port'); return; }
      throw error;
    }
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, '..', 'scripts', 'wipi-claude-hook.ps1')], {
      env: { ...process.env, APPDATA: dir }, stdio: ['pipe', 'ignore', 'pipe'],
    });
    const input = {
      session_id: 'session-1', prompt_id: 'prompt-1', cwd: 'G:\\Demo', hook_event_name: 'PreToolUse',
      tool_name: 'Edit', prompt: 'private prompt', tool_input: { secret: 'private code' }, last_assistant_message: 'private answer',
    };
    child.stdin.end(JSON.stringify(input));
    const exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
    assert.equal(exitCode, 0);
    assert.equal(server.received.url, '/claude-hook');
    assert.equal(server.received.token, 'test-token');
    assert.deepEqual(Object.keys(server.received.body).sort(), ['cwd', 'hook_event_name', 'prompt_id', 'session_id', 'tool_name']);
    assert.equal(server.received.body.tool_name, 'Edit');
  } finally {
    if (server.listening) server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
