#!/bin/bash
set -eux

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Detected Windows OS. Skipping Linux-specific commands."
fi

# Install Python dependencies
pip install -r requirements.txt
