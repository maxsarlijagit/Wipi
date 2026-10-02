chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  if (message?.type !== 'chatgpt-complete' && message?.type !== 'test') return;
  chrome.storage.local.get('token').then(async ({ token }) => {
    if (!token) { reply({ ok: false, error: 'Falta el token de Wipi.' }); return; }
    try {
      const response = await fetch('http://127.0.0.1:47823/notify', {
        method: 'POST', headers: { 'Content-Type':'application/json', 'X-Wipi-Token':token },
        body: JSON.stringify({ source: 'chatgpt', title: message.type === 'test' ? 'ChatGPT conectado' : 'ChatGPT terminó', body: message.type === 'test' ? 'El enlace con Wipi funciona.' : 'Tu respuesta está lista para revisar.' })
      });
      reply({ ok: response.ok, error: response.ok ? '' : `Error ${response.status}` });
    } catch { reply({ ok: false, error: 'Wipi no está abierto.' }); }
  });
  return true;
});
