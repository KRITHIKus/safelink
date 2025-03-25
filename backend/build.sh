#!/bin/bash
set -eux

# ✅ Define URLs (Stable Chrome-for-Testing link)
CHROME_URL="https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/120.0.6099.224/linux64/chrome-linux64.zip"
CHROMEDRIVER_URL="https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/120.0.6099.224/linux64/chromedriver-linux64.zip"

# ✅ Create directory for Chrome & ChromeDriver
mkdir -p /opt/render/chrome
cd /opt/render/chrome

# ✅ Download Chromium with retry
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force $CHROME_URL -O chrome.zip

# ✅ Check if Chrome file is valid
if [ ! -s chrome.zip ]; then
  echo "❌ Chrome download failed or file is empty!"
  exit 1
fi

unzip chrome.zip || { echo "❌ Failed to unzip chrome.zip"; exit 1; }
mv chrome-linux64 chrome

# ✅ Download ChromeDriver with retry
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force $CHROMEDRIVER_URL -O chromedriver.zip

# ✅ Check if ChromeDriver file is valid
if [ ! -s chromedriver.zip ]; then
  echo "❌ ChromeDriver download failed or file is empty!"
  exit 1
fi

unzip chromedriver.zip || { echo "❌ Failed to unzip chromedriver.zip"; exit 1; }
mv chromedriver-linux64 chromedriver
chmod +x chromedriver

# ✅ Set environment variables
echo "export CHROME_BINARY=/opt/render/chrome/chrome/chrome" >> ~/.bashrc
echo "export CHROMEDRIVER_BINARY=/opt/render/chrome/chromedriver" >> ~/.bashrc
source ~/.bashrc

# ✅ Install Python dependencies
pip install -r requirements.txt
