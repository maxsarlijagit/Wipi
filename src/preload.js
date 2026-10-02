const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('wipi', {
  bootstrap: () => ipcRenderer.invoke('bootstrap'),
  theme: value => ipcRenderer.send('theme', value),
  expand: value => ipcRenderer.send('expand', value),
  test: () => ipcRenderer.send('test'),
  hide: () => ipcRenderer.send('hide'),
  on: (channel, callback) => {
    if (!['event', 'history', 'activities', 'theme', 'idle'].includes(channel)) return;
    ipcRenderer.on(channel, (_, value) => callback(value));
  }
});
