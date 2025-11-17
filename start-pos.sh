#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Start MongoDB if not running
sudo systemctl start mongod

# Start Next.js server in background
npm run start &
NEXTJS_PID=$!

# Wait for Next.js to start
sleep 3

# Start Tauri app
pos-system

# Clean up: kill Next.js when Tauri closes
kill $NEXTJS_PID
