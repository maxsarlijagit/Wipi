const input = document.getElementById('token');
const status = document.getElementById('status');
chrome.storage.local.get('token').then(({token}) => { input.value = token || ''; });
document.getElementById('save').onclick = async () => { await chrome.storage.local.set({token:input.value.trim()}); status.textContent = 'Guardado.'; };
document.getElementById('test').onclick = async () => { const result = await chrome.runtime.sendMessage({type:'test'}); status.textContent = result?.ok ? 'Conectado con Wipi.' : (result?.error || 'No se pudo conectar.'); };
