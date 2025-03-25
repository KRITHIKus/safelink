#!/bin/bash
set -eux

# ✅ Create a directory for Chromium
mkdir -p $HOME/chrome
cd $HOME/chrome

# ✅ Download Prebuilt Chromium Binary (Google's Official Testing Version)
wget -q -O chromium.zip https://storage.googleapis.com/chrome-for-testing-public/120.0.6099.224/linux64/chrome-linux64.zip

# ✅ Extract Chromium
unzip -q chromium.zip

# ✅ Set CHROME_BINARY environment variable
echo "export CHROME_BINARY=$HOME/chrome/chrome-linux64/chrome" >> ~/.bashrc
source ~/.bashrc

# ✅ Install Python dependencies
pip install -r requirements.txt
