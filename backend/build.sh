#!/bin/bash
set -eux

# ✅ Set CHROME_BINARY to the default Chromium location on Render
echo "export CHROME_BINARY=/usr/bin/chromium-browser" >> ~/.bashrc
source ~/.bashrc

# ✅ Install Python dependencies
pip install -r requirements.txt
