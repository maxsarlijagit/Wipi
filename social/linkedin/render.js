const { app, BrowserWindow } = require('electron');
const path = require('node:path');

app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ x: -10000, y: -10000, width: 1200, height: 1500, show: false, frame: false, resizable: false });
  try {
    await win.loadFile(path.join(__dirname, 'wipi-open-source.html'));
    await win.webContents.executeJavaScript('document.fonts.ready.then(() => true)');
    win.showInactive();
    await new Promise(resolve => setTimeout(resolve, 200));
    const image = await win.capturePage();
    const output = path.join(__dirname, 'wipi-open-source-1200x1500.png');
    require('node:fs').writeFileSync(output, image.toPNG());
    console.log(output);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    win.destroy();
    app.quit();
  }
});
