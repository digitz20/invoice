// In your Electron main process file
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { nodeIntegration: true }
  });

  win.loadFile('index.html');

  // Open a decoy PDF invoice
  const pdfPath = path.join(__dirname, '../assets/invoice.pdf');
  console.log('Decoy PDF full path:', pdfPath);shell.openPath(pdfPath).then((err) => {
  if (err) {
    console.error('Failed to open decoy PDF:', err);
  } else {
    console.log('PDF invoice opened');
  }
});
  shell.openPath(pdfPath).then(() => {
    console.log('[safe-demo] PDF invoice opened safely');
  });
}

app.whenReady().then(createWindow);dist/invoice-win32-x64/resources/app/assets/invoice.pdf