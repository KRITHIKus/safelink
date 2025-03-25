#!/bin/bash
set -eux  # Exit on error, show execution steps

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

# ✅ Create installation directory for Chrome & ChromeDriver
INSTALL_DIR="/opt/render/chrome"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# ✅ Remove old Chrome and ChromeDriver (if they exist)
echo "🧹 Cleaning up old Chrome & ChromeDriver installations..."
rm -rf chrome chromedriver chrome.zip chromedriver.zip

# ✅ Download Chrome
echo "⬇️ Downloading Chrome..."
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_CHROME" -O chrome.zip
if [[ ! -s chrome.zip ]]; then
  echo "❌ ERROR: Chrome download failed!"
  exit 1
fi

# ✅ Extract Chrome **WITHOUT PROMPTS**
unzip -qo chrome.zip
mv -T chrome-linux64 chrome || true  # Avoid failure if it already exists

# ✅ Download ChromeDriver
echo "⬇️ Downloading ChromeDriver..."
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_DRIVER" -O chromedriver.zip
if [[ ! -s chromedriver.zip ]]; then
  echo "❌ ERROR: ChromeDriver download failed!"
  exit 1
fi

# ✅ Extract ChromeDriver **WITHOUT PROMPTS**
unzip -qo chromedriver.zip
mv -T chromedriver-linux64 chromedriver || true
chmod +x chromedriver

# ✅ Set environment variables
echo "🌍 Setting Environment Variables..."
echo "export CHROME_BINARY=$INSTALL_DIR/chrome/chrome" >> /etc/environment
echo "export CHROMEDRIVER_BINARY=$INSTALL_DIR/chromedriver" >> /etc/environment
export CHROME_BINARY="$INSTALL_DIR/chrome/chrome"
export CHROMEDRIVER_BINARY="$INSTALL_DIR/chromedriver"

# ✅ Move to the backend directory before installing dependencies
BACKEND_DIR="$(dirname "$0")/backend"

echo "📂 Navigating to backend directory: $BACKEND_DIR"
if [[ ! -d "$BACKEND_DIR" ]]; then
    echo "❌ ERROR: Backend directory not found! Exiting..."
    exit 1
fi
cd "$BACKEND_DIR"

# ✅ Debugging: Check directory contents before installing requirements
echo "📂 Verifying backend directory contents..."
ls -lah

# ✅ Install Python dependencies safely
REQ_FILE="requirements.txt"

if [[ -f "$REQ_FILE" ]]; then
    echo "✅ Found $REQ_FILE, installing dependencies..."
    pip install --no-cache-dir -r "$REQ_FILE"
else
    echo "❌ ERROR: $REQ_FILE not found in $(pwd)!"
    exit 1
fi

echo "🎉 Build completed successfully!"
