#!/bin/bash
set -eux

# ✅ Install jq (Required for parsing JSON)
apt-get update && apt-get install -y jq

# ✅ Fetch latest available Chrome & ChromeDriver
LATEST_CHROME=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/latest-versions-per-milestone.json | jq -r '.milestones["120"].downloads.chrome.Linux64[0].url')
LATEST_DRIVER=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/latest-versions-per-milestone.json | jq -r '.milestones["120"].downloads.chromedriver.Linux64[0].url')

# ✅ Create directory for Chrome & ChromeDriver
mkdir -p /opt/render/chrome
cd /opt/render/chrome

# ✅ Download Chrome (Latest Stable)
wget --retry-connrefused --waitretry=5 --tries=3 --progress=bar:force "$LATEST_CHROME" -O chrome.zip
if [ ! -s chrome.zip ]; then
  echo "❌ Chrome download failed!"
  exit 1
fi
unzip chrome.zip
mv chrome-linux64 chrome

# ✅ Download ChromeDriver (Matching Version)
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
