const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { installClaudeHooks, EVENTS } = require('../src/claude-integration');

test('Claude hook installer preserves existing settings and is idempotent', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wipi-claude-'));
  try {
    const file = path.join(dir, 'settings.json');
    const original = { model: 'sonnet', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'my-existing-hook' }] }] } };
    fs.writeFileSync(file, JSON.stringify(original));
    installClaudeHooks(file, 'C:\\Program Files\\Wipi\\wipi-claude-hook.ps1');
    installClaudeHooks(file, 'C:\\Program Files\\Wipi\\wipi-claude-hook.ps1');
    const result = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(result.model, 'sonnet');
    for (const event of EVENTS) assert.equal(result.hooks[event].length, event === 'Stop' ? 2 : 1);
    assert.equal(result.hooks.Stop[0].hooks[0].command, 'my-existing-hook');
    assert.deepEqual(JSON.parse(fs.readFileSync(`${file}.wipi-backup`, 'utf8')), original);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
