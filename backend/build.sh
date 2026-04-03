
set -eux  

echo "🚀 Starting Build Script..."


INSTALL_DIR="/opt/render/project/src/chrome"
mkdir -p "$INSTALL_DIR"


LATEST_VERSION=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json | jq -r '.channels.Stable.version')


LATEST_CHROME="https://storage.googleapis.com/chrome-for-testing-public/$LATEST_VERSION/linux64/chrome-linux64.zip"
LATEST_DRIVER="https://storage.googleapis.com/chrome-for-testing-public/$LATEST_VERSION/linux64/chromedriver-linux64.zip"


if [[ -z "$LATEST_VERSION" || "$LATEST_VERSION" == "null" ]]; then
  echo "❌ ERROR: Failed to fetch the latest Chrome version. Exiting..."
  exit 1
fi

echo "✅ Chrome Version: $LATEST_VERSION"


cd "$INSTALL_DIR"


echo "🧹 Cleaning up old Chrome & ChromeDriver..."
rm -rf chrome chromedriver chrome.zip chromedriver.zip


wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_CHROME" -O chrome.zip
unzip -qo chrome.zip && rm -f chrome.zip
mv -f chrome-linux64 chrome  


wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_DRIVER" -O chromedriver.zip
unzip -qo chromedriver.zip && rm -f chromedriver.zip
mv -f chromedriver-linux64 chromedriver  
chmod +x chromedriver/chromedriver  


chmod +x chrome/chrome


echo "⚠️ Skipping apt-get package installation (Read-only filesystem). Assuming required libraries are pre-installed."


export CHROME_BINARY="$INSTALL_DIR/chrome/chrome"
export CHROMEDRIVER_BINARY="$INSTALL_DIR/chromedriver/chromedriver"
echo "✅ Chrome Binary: $CHROME_BINARY"
echo "✅ ChromeDriver Binary: $CHROMEDRIVER_BINARY"


cd /opt/render/project/src/backend
pip install --no-cache-dir -r requirements.txt

echo "🎉 Build completed successfully!"
