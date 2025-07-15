#!/bin/bash

# Create MongoDB data directory
mkdir -p /data/db

# Create log directory
mkdir -p /var/log/supervisor

# Start supervisor with our configuration
supervisord -c /app/scripts/supervisord.conf