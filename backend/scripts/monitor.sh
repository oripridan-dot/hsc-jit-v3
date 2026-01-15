#!/bin/bash
# Quick launcher for real-time sync monitoring

echo "🔄 Starting Real-Time Sync Monitor..."
echo ""
echo "Options:"
echo "  1. Watch all phases (default)"
echo "  2. Tail Halilit log"
echo "  3. Tail Brand scraper log"
echo "  4. Tail Orchestrator log"
echo "  5. Check gap analysis"
echo ""
echo "Press Ctrl+C to stop monitoring anytime"
echo ""

cd /workspaces/hsc-jit-v3/backend

# Default: watch all
python3 scripts/watch_sync.py --refresh 5
