#!/bin/bash
set -eux

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Detected Windows OS. Skipping Linux-specific commands."
else
    # Install Google Chrome on Linux (Skip on Windows)
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
    echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | tee /etc/apt/sources.list.d/google-chrome.list
    apt-get update
    apt-get install -y google-chrome-stable
fi

# Install Python dependencies
pip install -r requirements.txt
