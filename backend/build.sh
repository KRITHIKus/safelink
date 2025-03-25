#!/bin/bash
set -eux

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Detected Windows OS. Skipping Linux-specific commands."
else
    # Download Chrome (Portable Version)
    wget -q -O chrome-linux.zip https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

    # Install dependencies
    apt-get update && apt-get install -y unzip libx11-xcb1 libasound2

    # Extract Chrome
    dpkg -x google-chrome-stable_current_amd64.deb $HOME/chrome
    mv $HOME/chrome/opt/google/chrome/ $HOME/chrome-bin
    chmod +x $HOME/chrome-bin/google-chrome

    # Set CHROME_BINARY environment variable
    echo "export CHROME_BINARY=$HOME/chrome-bin/google-chrome" >> ~/.bashrc
    source ~/.bashrc
fi

# Install Python dependencies
pip install -r requirements.txt
