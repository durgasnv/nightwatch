#!/usr/bin/env bash
echo "========================================================"
echo "  Starting Desktop AI Pet Companion..."
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules/electron" ]; then
    echo "[INFO] Installing dependencies..."
    npm install
fi

echo "[INFO] Launching Desktop Pet..."
npm start
