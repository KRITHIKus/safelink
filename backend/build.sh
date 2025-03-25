#!/bin/bash
set -eux

# ✅ Get the latest stable Chrome version
LATEST_VERSION=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json | jq -r '.channels.Stable.version')

# ✅ Construct correct URLs
LATEST_CHROME="https://storage.googleapis.com/chrome-for-testing-public/$LATEST_VERSION/linux64/chrome-linux64.zip"
LATEST_DRIVER="https://storage.googleapis.com/chrome-for-testing-public/$LATEST_VERSION/linux64/chromedriver-linux64.zip"

# ✅ Check if URLs are valid
if [[ "$LATEST_CHROME" == "null" || "$LATEST_DRIVER" == "null" ]]; then
  echo "❌ Failed to fetch Chrome or ChromeDriver URLs. Exiting..."
  exit 1
fi

# ✅ Create directory for Chrome & ChromeDriver
mkdir -p /opt/render/chrome
cd /opt/render/chrome

# ✅ Download Chrome
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_CHROME" -O chrome.zip
if [ ! -s chrome.zip ]; then
  echo "❌ Chrome download failed!"
  exit 1
fi
unzip chrome.zip
mv chrome-linux64 chrome

# ✅ Download ChromeDriver
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_DRIVER" -O chromedriver.zip
if [ ! -s chromedriver.zip ]; then
  echo "❌ ChromeDriver download failed!"
  exit 1
fi
unzip chromedriver.zip
mv chromedriver-linux64 chromedriver
chmod +x chromedriver

# ✅ Set environment variables
echo "export CHROME_BINARY=/opt/render/chrome/chrome/chrome" >> ~/.bashrc
echo "export CHROMEDRIVER_BINARY=/opt/render/chrome/chromedriver" >> ~/.bashrc
source ~/.bashrc

# ✅ Install Python dependencies
pip install -r requirements.txt
