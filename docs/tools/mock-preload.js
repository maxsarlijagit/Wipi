const { contextBridge } = require('electron');

const now = Date.now();
const activities = [
  { id:'demo-1', project:'Aurora App', cwd:'C:\\Work\\Aurora App', source:'codex', stage:'Edición de archivos', quiet:false, startedAt:now - 8*60000, updatedAt:now - 12000 },
  { id:'demo-2', project:'Studio API', cwd:'C:\\Work\\Studio API', source:'codex-cli', stage:'Análisis', quiet:false, startedAt:now - 3*60000, updatedAt:now - 8000 },
];
const history = [
  { source:'codex', title:'Portfolio · listo', body:'La tarea terminó y está lista para revisar.', time:now - 12*60000 },
  { source:'chatgpt', title:'ChatGPT terminó', body:'Tu respuesta está lista para revisar.', time:now - 24*60000 },
];

contextBridge.exposeInMainWorld('wipi', {
  bootstrap: async () => ({ theme:'graphite', activities, history }),
  on: () => {}, theme: () => {}, expand: () => {}, test: () => {}, hide: () => {},
});
