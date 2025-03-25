#!/bin/bash
set -eux  # Stop on error, print all commands

echo "🚀 Starting Build Script..."

# ✅ Use persistent directory for Render deployment
INSTALL_DIR="/opt/render/project/src/chrome"
mkdir -p "$INSTALL_DIR"

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
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_CHROME" -O chrome.zip
unzip -qo chrome.zip && rm -f chrome.zip
mv -f chrome-linux64 chrome  # ✅ Ensure correct path

# ✅ Download & Extract ChromeDriver
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_DRIVER" -O chromedriver.zip
unzip -qo chromedriver.zip && rm -f chromedriver.zip
mv -f chromedriver-linux64 chromedriver  # ✅ Corrected Path
chmod +x chromedriver/chromedriver  # ✅ Ensure ChromeDriver is executable

# ✅ Apply Permissions to Chrome
chmod +x chrome/chrome

# ✅ Install Required Libraries (Added retries for stability)
apt-get update && apt-get install -y --no-install-recommends \
    unzip \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libgbm1 libasound2 libx11-xcb1 libxcomposite1 libxrandr2 \
    libxdamage1 libxfixes3 libxkbcommon0 libpango-1.0-0 libpangocairo-1.0-0 \
    libgtk-3-0 libxshmfence1 libglu1-mesa || {
        echo "❌ ERROR: Failed to install dependencies. Retrying..."
        apt-get install -y --no-install-recommends unzip \
            libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
            libgbm1 libasound2 libx11-xcb1 libxcomposite1 libxrandr2 \
            libxdamage1 libxfixes3 libxkbcommon0 libpango-1.0-0 libpangocairo-1.0-0 \
            libgtk-3-0 libxshmfence1 libglu1-mesa
    }

# ✅ Set Environment Variables (Updated Paths)
export CHROME_BINARY="$INSTALL_DIR/chrome/chrome"
export CHROMEDRIVER_BINARY="$INSTALL_DIR/chromedriver/chromedriver"
echo "✅ Chrome Binary: $CHROME_BINARY"
echo "✅ ChromeDriver Binary: $CHROMEDRIVER_BINARY"

# ✅ Switch to Backend Directory
cd /opt/render/project/src/backend
pip install --no-cache-dir -r requirements.txt

echo "🎉 Build completed successfully!"
