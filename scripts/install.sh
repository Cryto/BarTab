#!/bin/bash

# Install Python dependencies
cd /app/backend
pip install -r requirements.txt

# Install Node.js dependencies
cd /app/frontend
yarn install

# Make start script executable
chmod +x /app/scripts/start.sh

echo "Installation complete!"