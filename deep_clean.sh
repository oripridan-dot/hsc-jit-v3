#!/bin/bash
set -e

echo "🧹 STARTING DEEP CLEAN PROTOCOL"
echo "=============================="

# Define directories
BACKEND_DATA_DIR="backend/data"
FRONTEND_DATA_DIR="frontend/public/data"

# 1. Clean Backend Data
if [ -d "$BACKEND_DATA_DIR" ]; then
    echo "🗑️  Deleting $BACKEND_DATA_DIR..."
    rm -rf "$BACKEND_DATA_DIR"
fi
# Recreate structure
mkdir -p "$BACKEND_DATA_DIR/catalogs_brand"
echo "✅ Recreated backend/data/catalogs_brand"

# 2. Clean Frontend Data
echo "🗑️  Cleaning $FRONTEND_DATA_DIR..."
rm -f "$FRONTEND_DATA_DIR"/*.json
rm -rf "$FRONTEND_DATA_DIR/catalogs"
rm -rf "$FRONTEND_DATA_DIR/catalogs_brand"

# Recreate index with empty valid state to prevent frontend crash
echo '{
  "last_updated": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "brands": []
}' > "$FRONTEND_DATA_DIR/index.json"
echo "✅ Reset frontend/public/data/index.json"

# 3. Flush Redis (if available)
if command -v redis-cli &> /dev/null; then
    echo "🧹 Flushing Redis..."
    # Try to flush, but don't fail script if connection fails
    redis-cli FLUSHALL || echo "⚠️  Redis flush failed (server might be down)"
else
    echo "ℹ️  redis-cli not found, skipping Redis flush"
fi

# 4. Verification
echo ""
echo "🔍 VERIFICATION (Should be near 0kb/empty):"
echo "Backend Data:"
ls -R "$BACKEND_DATA_DIR"
echo "Frontend Data:"
ls -R "$FRONTEND_DATA_DIR"

echo ""
echo "✨ DEEP CLEAN COMPLETE - READY FOR FRESH START"
echo "============================================="
