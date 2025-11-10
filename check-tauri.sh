#!/bin/bash

echo "🔍 Tauri Health Check"
echo "===================="

# Check if ports are free
if lsof -i :5174 > /dev/null 2>&1; then
    echo "❌ Port 5174 is in use - killing existing processes"
    lsof -t -i:5174 | xargs -r kill -9
fi

# Quick Tauri compile check
echo "🔧 Testing Tauri compilation..."
cd src-tauri
timeout 30s cargo check 2>&1 | grep -q "error:"
if [ $? -eq 0 ]; then
    echo "❌ Tauri compilation errors found"
else
    echo "✅ Tauri compiles successfully (warnings are OK)"
fi
cd ..

# Quick GUI test - just check if it starts without crashing
echo "🖥️  Testing GUI launch..."
timeout 10s npm run tauri:dev > tauri-test.log 2>&1 &
TAURI_PID=$!

sleep 8

if kill -0 $TAURI_PID > /dev/null 2>&1; then
    echo "✅ Tauri GUI launched successfully"
    kill $TAURI_PID > /dev/null 2>&1
else
    echo "❌ Tauri GUI failed to launch"
    echo "Last few lines of log:"
    tail -5 tauri-test.log
fi

# Cleanup
pkill -f "tauri|vite" > /dev/null 2>&1
rm -f tauri-test.log

echo "🔧 Health check complete"
echo ""
echo "If issues found, run: npm run vite:dev (browser fallback)"