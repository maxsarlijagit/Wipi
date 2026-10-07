const path = require('node:path');

const QUIET_MS = 10 * 60 * 1000;
const KEEP_MS = 60 * 60 * 1000;

function stageForClaudeTool(name) {
  if (/^(Bash|PowerShell)$/i.test(name)) return 'Comandos';
  if (/^(Edit|Write|NotebookEdit)$/i.test(name)) return 'Edición de archivos';
  if (/^(Read|Glob|Grep)$/i.test(name)) return 'Lectura de archivos';
  if (/^(WebSearch|WebFetch)$/i.test(name)) return 'Búsqueda';
  return 'Herramientas';
}

class ClaudeActivityTracker {
  constructor(onComplete, onState = () => {}, now = () => Date.now()) {
    this.onComplete = onComplete;
    this.onState = onState;
    this.now = now;
    this.sessions = new Map();
    this.lastSnapshot = '';
  }

  consume(input) {
    if (!input || typeof input !== 'object') return false;
    const id = input.session_id;
    if (typeof id !== 'string' || !id || id.length > 128) return false;
    const event = input.hook_event_name;
    if (!['UserPromptSubmit', 'PreToolUse', 'Stop', 'StopFailure', 'SessionEnd'].includes(event)) return false;
    const now = this.now();
    let session = this.sessions.get(id);
    if (event === 'SessionEnd') {
      this.sessions.delete(id);
      this.emitState();
      return true;
    }
    if (event === 'UserPromptSubmit') {
      const cwd = typeof input.cwd === 'string' ? input.cwd.slice(0, 1024) : '';
      session = {
        id, cwd, project: path.basename(cwd) || 'Proyecto',
        promptId: typeof input.prompt_id === 'string' ? input.prompt_id.slice(0, 80) : '',
        startedAt: now, updatedAt: now, stage: 'Analizando', running: true,
      };
      this.sessions.set(id, session);
    } else if (!session?.running) {
      return true;
    } else if (event === 'PreToolUse') {
      session.stage = stageForClaudeTool(input.tool_name);
      session.updatedAt = now;
    } else {
      session.running = false;
      session.updatedAt = now;
      this.onComplete({
        source: 'claude', id: `claude:${id}:${session.promptId || session.startedAt}`,
        title: `${session.project} · ${event === 'Stop' ? 'listo' : 'interrumpido'}`,
        body: event === 'Stop' ? 'Claude terminó la respuesta. Lista para revisar.' : 'Claude no pudo completar la respuesta.',
      });
    }
    this.emitState();
    return true;
  }

  snapshot() {
    const now = this.now();
    for (const [id, session] of this.sessions) if (now - session.updatedAt > KEEP_MS) this.sessions.delete(id);
    return [...this.sessions.values()]
      .filter(session => session.running)
      .map(session => ({
        id: `claude:${session.id}`, project: session.project, cwd: session.cwd,
        source: 'claude', stage: now - session.updatedAt > QUIET_MS ? 'Sin actividad reciente' : session.stage,
        quiet: now - session.updatedAt > QUIET_MS,
        startedAt: session.startedAt, updatedAt: session.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 12);
  }

  emitState() {
    const snapshot = this.snapshot();
    const serialized = JSON.stringify(snapshot);
    if (serialized !== this.lastSnapshot) {
      this.lastSnapshot = serialized;
      this.onState(snapshot);
    }
  }
}

module.exports = { ClaudeActivityTracker, stageForClaudeTool };
