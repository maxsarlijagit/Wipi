const VALID_SOURCES = new Set(['codex-cli', 'codex', 'claude', 'chatgpt', 'test']);

function cleanText(value, max = 160) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeEvent(input) {
  if (!input || typeof input !== 'object') return null;
  const source = VALID_SOURCES.has(input.source) ? input.source : null;
  if (!source) return null;
  return {
    source,
    id: cleanText(input.id, 80),
    title: cleanText(input.title, 72) || ({'codex-cli':'Codex CLI', codex:'Codex', claude:'Claude Code', chatgpt:'ChatGPT', test:'Wipi'}[source]),
    body: cleanText(input.body, 220) || 'Listo para revisar',
    time: Date.now(),
  };
}

function fromCodexNotify(payload) {
  if (!payload || payload.type !== 'agent-turn-complete') return null;
  return normalizeEvent({
    source: 'codex-cli',
    id: payload['turn-id'],
    title: 'Codex CLI terminó',
    body: payload['last-assistant-message'] || 'Tu tarea está lista',
  });
}

module.exports = { normalizeEvent, fromCodexNotify };
