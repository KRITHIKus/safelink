#!/bin/bash
set -eux  # Stop on error, print all commands

echo "🚀 Starting Build Script..."

# ✅ Get the latest stable Chrome version
LATEST_VERSION=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json | jq -r '.channels.Stable.version')

# ✅ Construct correct URLs
LATEST_CHROME="https://storage.googleapis.com/chrome-for-testing-public/$LATEST_VERSION/linux64/chrome-linux64.zip"
LATEST_DRIVER="https://storage.googleapis.com/chrome-for-testing-public/$LATEST_VERSION/linux64/chromedriver-linux64.zip"

# ✅ Validate URLs
if [[ -z "$LATEST_VERSION" || "$LATEST_VERSION" == "null" ]]; then
  echo "❌ ERROR: Failed to fetch the latest Chrome version. Exiting..."
  exit 1
fi

echo "✅ Chrome Version: $LATEST_VERSION"

# ✅ Set correct install path
INSTALL_DIR="/opt/render/chrome"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# ✅ Remove old installations to avoid conflicts
echo "🧹 Cleaning up old Chrome & ChromeDriver..."
rm -rf chrome chromedriver chrome.zip chromedriver.zip

# ✅ Download Chrome
echo "⬇️ Downloading Chrome..."
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_CHROME" -O chrome.zip
if [[ ! -s chrome.zip ]]; then
  echo "❌ ERROR: Chrome download failed!"
  exit 1
fi

# ✅ Extract Chrome (No Prompts)
unzip -qo chrome.zip
rm -f chrome.zip  # Cleanup zip file
mv -f chrome-linux64 chrome  # Ensure clean move

# ✅ Download ChromeDriver
echo "⬇️ Downloading ChromeDriver..."
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_DRIVER" -O chromedriver.zip
if [[ ! -s chromedriver.zip ]]; then
  echo "❌ ERROR: ChromeDriver download failed!"
  exit 1
fi

# ✅ Extract ChromeDriver (No Prompts)
unzip -qo chromedriver.zip
rm -f chromedriver.zip  # Cleanup zip file
mv -f chromedriver-linux64 chromedriver
chmod +x chromedriver

# ✅ Set Environment Variables
export CHROME_BINARY="$INSTALL_DIR/chrome/chrome"
export CHROMEDRIVER_BINARY="$INSTALL_DIR/chromedriver"
echo "✅ Chrome & ChromeDriver Installed Successfully"

# ✅ Navigate to Backend Directory (FIXED!)
echo "📂 Current directory before fix: $(pwd)"

# Ensure we are in the correct directory where `requirements.txt` exists
if [[ ! -f "requirements.txt" ]]; then
    echo "📂 Switching to backend directory..."
    cd /opt/render/project/src/backend || { echo "❌ ERROR: Failed to change directory!"; exit 1; }
fi

echo "📂 Switched to backend directory: $(pwd)"

# ✅ Verify `requirements.txt`
REQ_FILE="requirements.txt"
if [[ -f "$REQ_FILE" ]]; then
    echo "✅ Found $REQ_FILE, installing dependencies..."
    pip install --no-cache-dir -r "$REQ_FILE"
else
    echo "❌ ERROR: $REQ_FILE not found in $(pwd)!"
    exit 1
fi

echo "🎉 Build completed successfully!"
