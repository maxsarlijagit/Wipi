# Privacidad y seguridad local

Wipi está pensado para funcionar en el equipo del usuario. El código de la aplicación no envía telemetría ni conversaciones a un servidor externo.

| Fuente | Datos que procesa | Destino |
| --- | --- | --- |
| Sesiones de Codex | Lee archivos JSONL locales que pueden contener conversaciones; extrae carpeta de trabajo, fuente, identificadores, tipos de evento y tiempos. | Solo memoria local para el panel. No muestra ni envía el texto de las conversaciones. |
| Hook de Codex CLI | Recibe el evento `agent-turn-complete`, que puede incluir el último mensaje del asistente. | Envía el aviso al servidor local de Wipi; el texto visible se limita a 220 caracteres. |
| Extensión ChatGPT web | Detecta que una respuesta terminó. | Envía una frase fija al servidor local. No envía el texto del chat. |
| Ajustes | Tema, posición de la ventana, opción de inicio con Windows y token aleatorio. | `%APPDATA%\wipi\settings.json`. |

## Servidor local

El receptor HTTP escucha solo en `127.0.0.1:47823` y exige un token aleatorio en `X-Wipi-Token`. La extensión guarda una copia del token en el almacenamiento local del navegador. No pegues el token en issues, capturas públicas o conversaciones.

Wipi conserva como máximo 30 avisos en memoria. Al cerrar la aplicación se pierden. La configuración y el token sí permanecen en disco para la siguiente ejecución.

## Archivos creados por el instalador del hook

`scripts/install-codex-hook.js` cambia la línea `notify` del `config.toml` de Codex a nivel usuario. Guarda una copia anterior en `config.toml.wipi-backup`. Si existía un comando `notify`, conserva sus argumentos en `%APPDATA%\wipi\previous-notify.json` para ejecutarlo también.

No publiques esos archivos: pueden contener rutas personales y argumentos de comandos. Para deshacer el cambio, seguí [la guía de instalación](installation.md#codex-cli-puente-notify-opcional).

## Dependencias y descargas

`npm.cmd ci` descarga dependencias de npm y Electron durante el desarrollo. La aplicación ya empaquetada no necesita conectarse a esos servicios para mostrar la barra o procesar avisos locales. La extensión se comunica con `chatgpt.com` porque se ejecuta en esa página y con el receptor local de Wipi para enviar el aviso.
