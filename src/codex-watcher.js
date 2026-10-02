const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const QUIET_MS = 10 * 60 * 1000;
const KEEP_MS = 60 * 60 * 1000;
const MAX_TAIL = 16 * 1024 * 1024;

function stageFor(itemType) {
  return {
    Reasoning: 'Análisis',
    CommandExecution: 'Comandos',
    McpToolCall: 'Herramientas',
    FileChange: 'Edición de archivos',
    AgentMessage: 'Respuesta',
    WebSearch: 'Búsqueda',
  }[itemType] || null;
}

class CodexWatcher {
  constructor(onComplete, onState = () => {}, home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')) {
    this.onComplete = onComplete;
    this.onState = onState;
    this.root = path.join(home, 'sessions');
    this.positions = new Map();
    this.sessions = new Map();
    this.timer = null;
    this.lastSnapshot = '';
  }

  start() {
    this.scan(true);
    this.timer = setInterval(() => this.scan(false), 2500);
  }

  stop() { if (this.timer) clearInterval(this.timer); }

  recentFiles() {
    const now = new Date();
    const dates = [now, new Date(now.getTime() - 86400000)];
    const files = [];
    for (const date of dates) {
      const dir = path.join(this.root, String(date.getFullYear()), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0'));
      try {
        for (const name of fs.readdirSync(dir)) if (name.endsWith('.jsonl')) files.push(path.join(dir, name));
      } catch { /* No sessions for that day. */ }
    }
    return files;
  }

  metadata(file) {
    const fd = fs.openSync(file, 'r');
    // Codex's session_meta row can include long instructions before the first newline.
    const buffer = Buffer.alloc(256 * 1024);
    let count;
    try { count = fs.readSync(fd, buffer, 0, buffer.length, 0); } finally { fs.closeSync(fd); }
    try { return JSON.parse(buffer.subarray(0, count).toString('utf8').split('\n')[0]).payload || {}; }
    catch { return {}; }
  }

  ensureSession(file) {
    if (this.sessions.has(file)) return this.sessions.get(file);
    const meta = this.metadata(file);
    const cwd = typeof meta.cwd === 'string' ? meta.cwd : '';
    const origin = String(meta.originator || '').toLowerCase();
    const session = {
      file, cwd, project: path.basename(cwd) || 'Proyecto',
      source: origin.includes('desktop') ? 'codex' : 'codex-cli',
      turnId: '', stage: 'Iniciando', startedAt: 0, updatedAt: 0, running: false,
    };
    this.sessions.set(file, session);
    return session;
  }

  consume(session, row, notify) {
    const payload = row?.payload || {};
    if (row.type === 'turn_context' && typeof payload.cwd === 'string') {
      session.cwd = payload.cwd;
      session.project = path.basename(payload.cwd) || 'Proyecto';
    }
    if (row.type !== 'event_msg') return;
    if (payload.type === 'task_started') {
      session.turnId = payload.turn_id || '';
      session.startedAt = Number(payload.started_at) * 1000 || Date.now();
      session.updatedAt = session.startedAt;
      session.stage = 'Iniciando';
      session.running = true;
    } else if (payload.type === 'item_completed' && session.running && payload.turn_id === session.turnId) {
      const stage = stageFor(payload.item?.type);
      if (stage) session.stage = stage;
      session.updatedAt = Number(payload.completed_at_ms) || Date.now();
    } else if (payload.type === 'task_complete' && session.running && payload.turn_id === session.turnId) {
      session.running = false;
      session.updatedAt = Number(payload.completed_at) * 1000 || Date.now();
      if (notify) this.onComplete({
        source: session.source, id: session.turnId,
        title: `${session.project} · listo`,
        body: 'La tarea terminó y está lista para revisar.',
      });
    }
  }

  readNew(file, initial) {
    const size = fs.statSync(file).size;
    const session = this.ensureSession(file);
    let old = this.positions.get(file) ?? 0;
    if (size < old) old = 0;
    if (size === old) return;
    const start = Math.max(old, size - MAX_TAIL);
    const length = size - start;
    const fd = fs.openSync(file, 'r');
    const bytes = Buffer.alloc(length);
    try { fs.readSync(fd, bytes, 0, length, start); } finally { fs.closeSync(fd); }
    const lines = bytes.toString('utf8').split('\n');
    if (start > old) lines.shift();
    for (const line of lines.slice(0, -1)) {
      let row;
      try { row = JSON.parse(line); } catch { continue; }
      this.consume(session, row, !initial);
    }
    const lastNewline = bytes.lastIndexOf(10);
    this.positions.set(file, lastNewline < 0 ? old : start + lastNewline + 1);
  }

  snapshot() {
    const now = Date.now();
    return [...this.sessions.values()]
      .filter(s => s.running && now - s.updatedAt < KEEP_MS)
      .map(s => ({
        id: s.turnId, project: s.project, cwd: s.cwd, source: s.source,
        stage: now - s.updatedAt > QUIET_MS ? 'Sin actividad reciente' : s.stage,
        quiet: now - s.updatedAt > QUIET_MS,
        startedAt: s.startedAt, updatedAt: s.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 12);
  }

  scan(initial = false) {
    for (const file of this.recentFiles()) {
      try { this.readNew(file, initial); } catch { /* File may rotate during a scan. */ }
    }
    for (const file of this.positions.keys()) if (!fs.existsSync(file)) {
      this.positions.delete(file);
      this.sessions.delete(file);
    }
    const snapshot = this.snapshot();
    const serialized = JSON.stringify(snapshot);
    if (serialized !== this.lastSnapshot) {
      this.lastSnapshot = serialized;
      this.onState(snapshot);
    }
  }
}

module.exports = { CodexWatcher, stageFor };
