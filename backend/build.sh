#!/bin/bash
set -eux

# ✅ Create directory for Chrome & ChromeDriver
mkdir -p /opt/render/chrome
cd /opt/render/chrome

# ✅ Download Chromium (Prebuilt for Linux)
curl -sS -o chrome.zip https://storage.googleapis.com/chrome-for-testing-public/120.0.6099.224/linux64/chrome-linux64.zip
unzip chrome.zip
mv chrome-linux64 chrome

# ✅ Download ChromeDriver (Matching Version)
curl -sS -o chromedriver.zip https://storage.googleapis.com/chrome-for-testing-public/120.0.6099.224/linux64/chromedriver-linux64.zip
unzip chromedriver.zip
mv chromedriver-linux64 chromedriver
chmod +x chromedriver

# ✅ Set environment variables for Chromium and ChromeDriver (Use ~/.bashrc instead of /etc/environment)
echo "export CHROME_BINARY=/opt/render/chrome/chrome/chrome" >> ~/.bashrc
echo "export CHROMEDRIVER_BINARY=/opt/render/chrome/chromedriver" >> ~/.bashrc
source ~/.bashrc

# ✅ Install Python dependencies
pip install -r requirements.txt
