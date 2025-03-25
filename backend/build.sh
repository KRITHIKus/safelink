#!/bin/bash
set -eux

# ✅ Install Chromium and ChromeDriver
apt-get update && apt-get install -y chromium chromium-driver

# ✅ Set environment variables for Chromium and ChromeDriver
echo "export CHROME_BINARY=/usr/bin/chromium" >> ~/.bashrc
echo "export CHROMEDRIVER_BINARY=/usr/bin/chromedriver" >> ~/.bashrc
source ~/.bashrc

# ✅ Manually create a symlink for ChromeDriver to prevent path issues
ln -sf /usr/bin/chromedriver /usr/local/bin/chromedriver

# ✅ Install Python dependencies
pip install -r requirements.txt
