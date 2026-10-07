# Instalación y uso

## Requisitos comprobados

- Windows, probado en Windows 11.
- Para ejecutar desde el código o compilar: Node.js 24 y npm 11, las versiones usadas durante el desarrollo.
- Codex instalado localmente para ver sus sesiones. No hace falta una clave de API de OpenAI.

Wipi también puede ejecutarse sin Codex ni Claude Code: la barra, los temas y la notificación de prueba funcionan igual.

## Opción 1: ejecutable

Una release de GitHub puede incluir:

- `Wipi Setup <versión>.exe`: instalador para Windows.
- `Wipi <versión>.exe`: versión portable.

Abrí **un solo ejecutable**. Wipi aparece como barra flotante y deja un icono en la bandeja del sistema. Los ejecutables de desarrollo no tienen firma de código. La carpeta `dist/` generada localmente está ignorada por Git y debe subirse a una GitHub Release para distribuirla.

## Opción 2: desde el repositorio

Abrí PowerShell en la raíz del proyecto:

```powershell
npm.cmd ci
npm.cmd start
```

La primera ejecución puede descargar Electron. Si `npm.cmd` no encuentra `node` en un proceso hijo aunque Node esté instalado, abrí una terminal nueva tras instalar Node o añadí su carpeta al PATH de esa terminal. La ruta depende de tu instalación.

## Controles

| Acción | Cómo hacerlo |
| --- | --- |
| Mover Wipi | Arrastrá la taza o el texto de la barra. |
| Abrir el panel | Pulsá la flecha a la derecha. |
| Ver procesos | Leé las tarjetas de **En curso**; cada una muestra proyecto, fuente, último paso y tiempo. |
| Cambiar tema | Usá los puntos de color al pie del panel o el menú del icono de la bandeja. |
| Recuperar la posición inicial | En la bandeja, elegí **Volver arriba al centro**. |
| Probar un aviso | En el panel o en la bandeja, elegí **Probar**. |
| Iniciar con Windows | Activá esa opción en la bandeja en una versión empaquetada. |
| Cerrar Wipi | En la bandeja, elegí **Salir**. Cerrar la ventana la oculta. |

La posición elegida y el tema se guardan en `%APPDATA%\wipi\settings.json`. Los avisos recientes se guardan solo en memoria y desaparecen al salir.

## Codex CLI: puente `notify` opcional

Wipi intenta seguir las sesiones locales de Codex CLI sin configuración adicional. Para recibir también el texto breve del último mensaje al terminar un turno, configurá el hook desde una copia estable del repositorio:

```powershell
node scripts\install-codex-hook.js
```

El script conserva el `notify` previo, si existe, y guarda una copia del archivo de configuración del usuario en `config.toml.wipi-backup`. Reiniciá Codex CLI después. El hook guarda una **ruta absoluta** al script de este repositorio; si movés la carpeta, volvé a configurarlo con cuidado.

Para retirar Wipi del hook, editá la línea `notify` de `%USERPROFILE%\.codex\config.toml`. Si tenías un comando anterior, está guardado en `%APPDATA%\wipi\previous-notify.json`. El respaldo completo `config.toml.wipi-backup` sirve como referencia, pero no reemplaces el archivo actual con él si hiciste otros cambios desde la instalación.

## Claude Code CLI y Claude Desktop Code

1. Abrí Wipi y hacé clic derecho en el icono de la bandeja.
2. Elegí **Conectar Claude Code**.
3. Reiniciá Claude Code CLI o iniciá una sesión nueva con entorno **Local** en la pestaña **Code** de Claude Desktop.
4. Enviá una tarea de prueba. La tarjeta debería aparecer en **En curso** y convertirse en un aviso al terminar.

Wipi agrega hooks de usuario en `%USERPROFILE%\.claude\settings.json`. Conserva otros ajustes y hooks; antes del primer cambio crea `settings.json.wipi-backup`. Elegir **Conectar Claude Code** de nuevo actualiza el enlace a la instalación actual de Wipi sin duplicar los hooks. Si movés o reinstalás Wipi, volvé a conectar. Para quitar la integración, eliminá únicamente las entradas que ejecutan `wipi-claude-hook.ps1` de ese archivo, conservando los demás hooks.

Esta integración cubre Claude Code CLI y la pestaña Code de Claude Desktop en sesiones locales. Chat, Cowork y sesiones Code remotas no envían eventos a este receptor local. El hook no transmite el texto de prompts o respuestas a Wipi.

## ChatGPT web: extensión opcional

1. Abrí `chrome://extensions` o `edge://extensions`.
2. Activá **Modo de desarrollador** y pulsá **Cargar descomprimida**.
3. Seleccioná `chatgpt-extension/`.
4. En la bandeja de Windows, abrí **Abrir carpeta de configuración** y copiá el valor `token` de `settings.json`.
5. Pegalo en el popup de la extensión, pulsá **Guardar** y luego **Probar**.

Si la prueba funciona, ChatGPT web avisa al terminar una respuesta. El conector no cubre ChatGPT Desktop ni muestra respuestas en curso.

## Si algo no aparece

1. En la bandeja, elegí **Mostrar Wipi** y **Volver arriba al centro**.
2. Usá **Probar notificación**. Si aparece, la interfaz y el puente local funcionan.
3. Si Codex no aparece, confirmá que guarda sesiones en `%USERPROFILE%\.codex\sessions` o en la carpeta indicada por `CODEX_HOME`.
4. Si ChatGPT web no avisa, comprobá que la extensión esté activa en `chatgpt.com`, que el token coincida y que Wipi esté abierto.
5. Si el puerto `127.0.0.1:47823` está ocupado, cerrá la otra aplicación que lo use o la instancia duplicada de Wipi.

Consultá [integraciones y estados](integrations.md) para entender qué señales puede detectar cada fuente.
