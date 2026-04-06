#!/bin/bash

# Build script for Vercel deployment
# Installs frontend dependencies and builds the Vite app

set -e

cd frontend

echo "Installing frontend dependencies..."
npm ci

echo "Checking for vite..."
if [ ! -f "./node_modules/vite/bin/vite.js" ]; then
  echo "ERROR: vite not found in node_modules after npm ci!"
  ls -la ./node_modules/ | head -20
  exit 1
fi

echo "Building frontend..."
# Use node to execute the vite CLI entry point
node ./node_modules/vite/bin/vite.js build

echo "Build complete!"
