#!/bin/bash
set -eux

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Detected Windows OS. Skipping Linux-specific commands."
else
    # Install Chrome using a direct .deb package
    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    apt-get update
    apt-get install -y ./google-chrome-stable_current_amd64.deb
fi

# Install Python dependencies
pip install -r requirements.txt
