#!/bin/bash
# Halilit Mission Control v3.7 - Startup Script

set -e

echo "🚀 Halilit Mission Control v3.7 - Starting Services"
echo "=================================================="

# Kill any existing processes
echo "🛑 Cleaning up old processes..."
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "pnpm dev" 2>/dev/null || true
sleep 1

# Verify data files
echo "✅ Verifying data files..."
if [ ! -f "/workspaces/hsc-jit-v3/frontend/public/data/index.json" ]; then
  echo "❌ Missing /data/index.json"
  exit 1
fi

if [ ! -f "/workspaces/hsc-jit-v3/frontend/public/data/catalogs_brand/roland_catalog.json" ]; then
  echo "❌ Missing /data/catalogs_brand/roland_catalog.json"
  exit 1
fi

echo "✅ Data files verified"

# Build frontend
echo ""
echo "🏗️  Building frontend..."
cd /workspaces/hsc-jit-v3/frontend
pnpm build > /tmp/build.log 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  cat /tmp/build.log
  exit 1
fi

BUILD_TIME=$(grep "built in" /tmp/build.log | tail -1)
echo "✅ Build complete ($BUILD_TIME)"

# Start dev server
echo ""
echo "🌐 Starting dev server..."
cd /workspaces/hsc-jit-v3/frontend

# Start in background
nohup pnpm dev > /tmp/vite-dev.log 2>&1 &
DEV_PID=$!
echo "   PID: $DEV_PID"

# Wait for server to be ready
echo "   Waiting for server..."
for i in {1..15}; do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Dev server ready at http://localhost:5173"
    break
  fi
  sleep 1
  if [ $i -eq 15 ]; then
    echo "❌ Dev server failed to start"
    cat /tmp/vite-dev.log | tail -20
    exit 1
  fi
done

echo ""
echo "=================================================="
echo "✅ MISSION CONTROL ONLINE"
echo "=================================================="
echo ""
echo "Access points:"
echo "  • http://localhost:5173  (Development)"
echo "  • http://127.0.0.1:5173  (Localhost)"
echo ""
echo "Data:"
echo "  • Static catalog: /data/index.json"
echo "  • Roland products: /data/catalogs_brand/roland_catalog.json (29 products)"
echo ""
echo "Components:"
echo "  • Navigator (left) - Browse product hierarchy"
echo "  • Workbench (center) - View product cockpit"
echo "  • MediaBar (right) - Explore images/videos"
echo "  • SystemHealthBadge (top) - Status indicator"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Click 'Roland Corporation' to expand brand"
echo "  3. Click a category to see products"
echo "  4. Click a product to view details"
echo "  5. Explore MediaBar on the right side"
echo ""
echo "Logs:"
echo "  • Build: /tmp/build.log"
echo "  • Server: /tmp/vite-dev.log"
echo ""
echo "To stop server: pkill -f 'vite.*dev'"
echo "=================================================="
