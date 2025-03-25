#!/bin/bash
set -eux

# ✅ Install Chromium and ChromeDriver
apt-get update && apt-get install -y chromium chromium-driver

# ✅ Set environment variables for Chromium and ChromeDriver
echo "export CHROME_BINARY=/usr/bin/chromium" >> ~/.bashrc
echo "export CHROMEDRIVER_BINARY=/usr/bin/chromedriver" >> ~/.bashrc
source ~/.bashrc

# ✅ Install Python dependencies
pip install -r requirements.txt
