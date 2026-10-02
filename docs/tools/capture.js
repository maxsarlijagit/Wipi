const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

app.commandLine.appendSwitch('force-device-scale-factor', '2');
app.on('window-all-closed', () => {});
const root = path.resolve(__dirname, '..', '..');
const output = path.join(root, 'docs', 'images');
fs.mkdirSync(output, { recursive: true });

async function capture(name, width, height, expand, theme = 'graphite') {
  const page = path.join(root, 'src', 'ui', 'index.html');
  if (!fs.existsSync(page)) throw new Error(`Falta ${page}`);
  const win = new BrowserWindow({
    x:-10000, y:-10000, width, height, frame:false, transparent:true, show:false, resizable:false,
    webPreferences:{ preload:path.join(__dirname,'mock-preload.js'), contextIsolation:true, sandbox:true }
  });
  await win.loadURL(pathToFileURL(page).href);
  win.showInactive();
  await new Promise(resolve => setTimeout(resolve, 550));
  if (theme !== 'graphite') await win.webContents.executeJavaScript(`{
    const selected = ${JSON.stringify(theme)};
    document.body.dataset.theme = selected;
    document.querySelectorAll('.swatch').forEach(button => button.classList.toggle('selected', button.dataset.theme === selected));
  }`);
  if (expand) {
    await win.webContents.executeJavaScript("document.getElementById('toggle').click()");
    await new Promise(resolve => setTimeout(resolve, 450));
  }
  fs.writeFileSync(path.join(output, name), (await win.capturePage()).toPNG());
  win.destroy();
}

app.whenReady().then(async () => {
  try {
    await capture('wipi-bar.png', 438, 92, false);
    await capture('wipi-panel.png', 460, 548, true);
    await capture('wipi-pearl.png', 460, 548, true, 'pearl');
    console.log(`Capturas creadas en ${output}`);
  } catch (error) { console.error(error); process.exitCode = 1; }
  app.quit();
});
