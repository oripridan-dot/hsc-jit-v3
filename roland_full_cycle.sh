#!/bin/bash
set -e

echo "🎹 STARTING ROLAND FULL CYCLE IMPLEMENTATION (V3.7)"
echo "==================================================="
echo ""
echo "✨ All timeout issues have been fixed!"
echo "   - Comprehensive timeout handling on all network operations"
echo "   - 45s timeout per product page"
echo "   - 15s timeout per navigation"
echo "   - 5-10s timeouts on element extraction"
echo ""

# 1. Clean Slate & Run Orchestrator
# This parses Roland site, extracts 3-level hierarchy, saves catalog, and syncs to frontend
echo "🚀 Launching Backend Orchestrator (Fresh Start)..."
cd backend

# For development/testing: use --max-products 15
# For full production run: remove --max-products entirely
python3 orchestrate_brand.py --brand roland --clean --max-products 15

echo "✅ Backend Cycle Complete"
echo ""

# 2. Frontend Check
echo "🎨 Frontend Data Synced:"
ls -lh ../frontend/public/data/catalogs_brand/ 2>/dev/null || echo "   (Directory will be created on first run)"
ls -lh ../frontend/public/data/index.json 2>/dev/null || echo "   (Index will be created on first run)"

echo ""
echo "✨ SYSTEM READY at http://localhost:5173"
echo "==================================================="
echo ""
echo "📝 To run the full catalog scrape (remove limits):"
echo "   cd backend && python3 orchestrate_brand.py --brand roland --clean"
echo ""
