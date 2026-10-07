const app = document.getElementById('app');
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const source = document.getElementById('source');
const events = document.getElementById('events');
const activityList = document.getElementById('activities');
const badge = document.getElementById('active-badge');
const runningLabel = document.getElementById('running-label');
const swatches = document.getElementById('swatches');
const themes = { graphite:'#e5af90', pearl:'#e5c2af', violet:'#c6a3e2', mint:'#8bdec1', sunset:'#f5a78c' };
let activities = [];
let expanded = false;
let notificationTimer;
let showingNotification = false;

function setTheme(theme) {
  if (!(theme in themes)) return;
  document.body.dataset.theme = theme;
  [...swatches.children].forEach(button => button.classList.toggle('selected', button.dataset.theme === theme));
}
function elapsedText(startedAt) {
  const minutes = Math.max(0, Math.floor((Date.now() - startedAt) / 60000));
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
function renderSummary() {
  if (showingNotification) return;
  const running = activities.filter(item => !item.quiet);
  app.classList.toggle('has-active', running.length > 0);
  badge.classList.toggle('visible', running.length > 0);
  badge.textContent = String(running.length);
  if (running.length) {
    source.textContent = `WIPI · ${running.length} EN CURSO`;
    title.textContent = running.length === 1 ? running[0].project : `${running.length} proyectos en marcha`;
    subtitle.textContent = running.length === 1 ? `Último paso: ${running[0].stage}` : `${running[0].project} · ${running[0].stage}`;
  } else if (activities.length) {
    source.textContent = 'WIPI · EN PAUSA';
    title.textContent = 'Sin actividad reciente';
    subtitle.textContent = 'Abrí el panel para ver las sesiones.';
  } else {
    source.textContent = 'WIPI · LOFI FOCUS';
    title.textContent = 'Tu espacio está listo';
    subtitle.textContent = 'Arrastrá esta barra a tu lugar favorito.';
  }
}
function renderActivities(next) {
  activities = next;
  const running = next.filter(item => !item.quiet);
  runningLabel.textContent = `${running.length} ${running.length === 1 ? 'tarea' : 'tareas'}`;
  activityList.replaceChildren();
  if (!next.length) {
    const empty = document.createElement('div'); empty.className = 'empty-activity';
    const icon = document.createElement('div'); icon.className = 'empty-cup'; icon.textContent = '☕';
    const copy = document.createElement('div');
    const strong = document.createElement('strong'); strong.textContent = 'Un momento de calma';
    const detail = document.createElement('span'); detail.textContent = 'Las tareas de Codex y Claude Code aparecerán aquí.';
    copy.append(strong, detail); empty.append(icon, copy); activityList.append(empty);
  } else for (const item of next) {
    const row = document.createElement('div'); row.className = `activity${item.quiet ? ' quiet' : ''}`;
    row.title = item.cwd || item.project;
    const top = document.createElement('div'); top.className = 'activity-top';
    const orb = document.createElement('div'); orb.className = 'activity-orb'; orb.textContent = item.quiet ? '◌' : item.source === 'claude' ? '✦' : '⌘';
    const name = document.createElement('div'); name.className = 'activity-name'; name.textContent = item.project;
    const src = document.createElement('div'); src.className = 'activity-source'; src.textContent = item.source === 'claude' ? 'CLAUDE' : item.source === 'codex-cli' ? 'CLI' : 'CODEX';
    top.append(orb, name, src);
    const bottom = document.createElement('div'); bottom.className = 'activity-bottom';
    const dot = document.createElement('span'); dot.className = 'status-dot';
    const stage = document.createElement('span'); stage.textContent = item.quiet ? item.stage : `Último paso: ${item.stage}`;
    const elapsed = document.createElement('span'); elapsed.className = 'elapsed'; elapsed.textContent = elapsedText(item.startedAt);
    bottom.append(dot, stage, elapsed); row.append(top, bottom); activityList.append(row);
  }
  renderSummary();
}
function renderHistory(history) {
  events.replaceChildren();
  if (!history.length) {
    const empty = document.createElement('div'); empty.className = 'empty-events';
    empty.textContent = 'Todavía no hay avisos. Cuando algo termine, aparecerá aquí.';
    events.append(empty); return;
  }
  for (const item of history.slice(0, 12)) {
    const row = document.createElement('div'); row.className = 'event';
    const icon = document.createElement('div'); icon.className = 'event-icon';
    icon.textContent = item.source === 'chatgpt' ? '✦' : item.source === 'test' ? '☕' : '✓';
    const copy = document.createElement('div'); copy.className = 'event-copy';
    const t = document.createElement('div'); t.className = 'event-title'; t.textContent = item.title;
    const b = document.createElement('div'); b.className = 'event-body'; b.textContent = item.body;
    const time = document.createElement('div'); time.className = 'event-time';
    time.textContent = new Date(item.time).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
    copy.append(t,b); row.append(icon,copy,time); events.append(row);
  }
}
function setExpanded(value) {
  expanded = value;
  app.classList.toggle('expanded', value);
  window.wipi.expand(value);
}
document.getElementById('toggle').addEventListener('click', () => setExpanded(!expanded));
document.getElementById('close').addEventListener('click', () => setExpanded(false));
document.getElementById('test').addEventListener('click', () => window.wipi.test());
for (const [theme, color] of Object.entries(themes)) {
  const button = document.createElement('button'); button.className = 'swatch'; button.dataset.theme = theme;
  button.style.setProperty('--swatch', color); button.title = theme; button.setAttribute('aria-label', `Tema ${theme}`);
  button.addEventListener('click', () => window.wipi.theme(theme)); swatches.append(button);
}
window.wipi.on('event', item => {
  showingNotification = true;
  source.textContent = ({'codex-cli':'CODEX CLI',codex:'CODEX',claude:'CLAUDE CODE',chatgpt:'CHATGPT',test:'WIPI'}[item.source] || 'WIPI') + (item.title.includes('interrumpido') ? ' · AVISO' : ' · LISTO');
  title.textContent = item.title; subtitle.textContent = item.body;
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => { showingNotification = false; renderSummary(); }, 6800);
});
window.wipi.on('history', renderHistory);
window.wipi.on('activities', renderActivities);
window.wipi.on('theme', setTheme);
window.wipi.bootstrap().then(data => {
  setTheme(data.theme); renderHistory(data.history); renderActivities(data.activities || []);
});
setInterval(() => {
  document.querySelectorAll('.activity .elapsed').forEach((element, index) => {
    if (activities[index]) element.textContent = elapsedText(activities[index].startedAt);
  });
}, 30000);
