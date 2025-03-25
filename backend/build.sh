#!/bin/bash
set -eux  # Stop on error, print all commands

echo "🚀 Starting Build Script..."

# ✅ Ensure Required Directories Exist
INSTALL_DIR="/opt/render/chrome"
mkdir -p "$INSTALL_DIR"

# ✅ Install Required System Dependencies
echo "📦 Installing system dependencies..."
apt-get update && apt-get install -y unzip wget curl jq chromium python3-pip python3-venv

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

# ✅ Move to Install Directory
cd "$INSTALL_DIR"

# ✅ Remove old installations to avoid conflicts
echo "🧹 Cleaning up old Chrome & ChromeDriver..."
rm -rf chrome chromedriver chrome.zip chromedriver.zip

# ✅ Download & Extract Chrome
echo "⬇️ Downloading Chrome..."
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_CHROME" -O chrome.zip
if [[ ! -s chrome.zip ]]; then
  echo "❌ ERROR: Chrome download failed!"
  exit 1
fi
unzip -qo chrome.zip
rm -f chrome.zip  # Cleanup zip file
mv -f chrome-linux64 chrome  # Ensure clean move

# ✅ Download & Extract ChromeDriver
echo "⬇️ Downloading ChromeDriver..."
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_DRIVER" -O chromedriver.zip
if [[ ! -s chromedriver.zip ]]; then
  echo "❌ ERROR: ChromeDriver download failed!"
  exit 1
fi
unzip -qo chromedriver.zip
rm -f chromedriver.zip  # Cleanup zip file
mv -f chromedriver-linux64 chromedriver
chmod +x chromedriver

# ✅ Set Environment Variables (Critical Fix)
export CHROME_BINARY="$INSTALL_DIR/chrome/chrome"
export CHROMEDRIVER_BINARY="$INSTALL_DIR/chromedriver"

# ✅ Ensure Python & WebDriver Dependencies Are Installed
echo "🐍 Installing Python dependencies..."
pip install --no-cache-dir -r /opt/render/project/src/backend/requirements.txt
pip install --no-cache-dir webdriver-manager selenium  

echo "🎉 Build completed successfully!"
