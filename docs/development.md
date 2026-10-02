# Desarrollo

## Estructura

```text
src/main.js             Ventana, bandeja, temas y servidor local
src/codex-watcher.js    Lectura de sesiones y estados de Codex
src/events.js           Validación y recorte de avisos
src/preload.js          Puente limitado entre Electron y la interfaz
src/ui/                 Barra, panel y estilos
chatgpt-extension/      Conector opcional para ChatGPT web
scripts/                Hook de Codex CLI y generación del icono
test/                   Pruebas de eventos y seguimiento de sesiones
docs/images/            Capturas públicas con datos ficticios
docs/tools/             Generador de esas capturas
```

## Comandos

Ejecutar desde la raíz del repositorio en PowerShell:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
npm.cmd run dist
```

`dist/` contiene los ejecutables y está ignorado por Git. El empaquetado incluye `src/`, los dos scripts del hook y la extensión en `resources/`.

## Capturas para la documentación

Las capturas usan datos ficticios definidos en `docs/tools/mock-preload.js`. Para regenerarlas:

```powershell
.\node_modules\.bin\electron.cmd docs\tools\capture.js
```

El script genera `docs/images/wipi-bar.png`, `wipi-panel.png` y `wipi-pearl.png` a escala 2×. Después de cambiar la interfaz, abrí las tres imágenes y comprobá que no haya cortes, texto ilegible ni nombres de proyectos reales.

## Pruebas relevantes

`npm.cmd test` verifica el formato de los avisos, una sesión corta que comienza y termina entre dos sondeos, y la transición de una tarea activa a terminada. Además, conviene comprobar manualmente:

1. Que la barra se pueda arrastrar y recuerde la posición al reiniciar.
2. Que la flecha abra el panel y que cambiar de tema no cierre la aplicación.
3. Que una tarea real de Codex aparezca en **En curso** y luego genere un aviso al finalizar.
4. Que la notificación de prueba funcione en el ejecutable empaquetado.

Las pruebas automáticas no confirman que la interfaz actual de ChatGPT web siga usando los mismos elementos; verificá la extensión en una sesión real antes de anunciar compatibilidad completa con una versión nueva de ChatGPT.

## Preparar una GitHub Release

1. Actualizá la versión en `package.json` y `package-lock.json`.
2. Actualizá [CHANGELOG.md](../CHANGELOG.md) y regenerá las capturas si cambió la interfaz.
3. Ejecutá las pruebas y compilá con `npm.cmd run dist`.
4. Probá el ejecutable empaquetado y comprobá qué integraciones se verificaron realmente.
5. Subí el instalador y la versión portable de `dist/` como archivos de la release. No agregues `dist/`, `node_modules/`, `settings.json`, tokens ni sesiones personales al repositorio.

Los ejecutables de desarrollo están sin firma digital. Si se distribuye Wipi de forma pública, el proceso de firma y distribución debe revisarse por separado.
