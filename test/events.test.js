const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEvent, fromCodexNotify } = require('../src/events');

test('Codex completion becomes a concise notification', () => {
  const result = fromCodexNotify({ type:'agent-turn-complete', 'turn-id':'abc', 'last-assistant-message':'  Terminé\nla tarea.  ' });
  assert.equal(result.source, 'codex-cli');
  assert.equal(result.id, 'abc');
  assert.equal(result.body, 'Terminé la tarea.');
});
test('unsupported events and sources are ignored', () => {
  assert.equal(fromCodexNotify({type:'approval-requested'}), null);
  assert.equal(normalizeEvent({source:'unknown'}), null);
});
test('notification text is bounded and whitespace is normalized', () => {
  const result = normalizeEvent({source:'chatgpt', body:'  hola\n\n mundo  '});
  assert.equal(result.body, 'hola mundo');
  assert.ok(normalizeEvent({source:'test', body:'x'.repeat(999)}).body.length <= 220);
});
test('Claude Code notifications are accepted', () => {
  const event = normalizeEvent({ source: 'claude', title: 'Demo · listo' });
  assert.equal(event.source, 'claude');
  assert.equal(event.title, 'Demo · listo');
});
