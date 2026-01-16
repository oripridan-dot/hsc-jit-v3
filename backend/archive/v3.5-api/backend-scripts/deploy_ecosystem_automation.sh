#!/bin/bash
# ECOSYSTEM AUTOMATION DEPLOYMENT
# Deploy continuous 24/7 ecosystem intelligence operations

set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$BACKEND_DIR/scripts"
LOGS_DIR="$BACKEND_DIR/logs/ecosystem"

echo "🚀 ECOSYSTEM AUTOMATION DEPLOYMENT"
echo "===================================="
echo ""

# Create logs directory
mkdir -p "$LOGS_DIR"
echo "✅ Logs directory created: $LOGS_DIR"

# Make scripts executable
chmod +x "$SCRIPTS_DIR/ecosystem_orchestrator.py"
chmod +x "$SCRIPTS_DIR/ecosystem_taxonomy.py"
chmod +x "$SCRIPTS_DIR/ecosystem_automation_manager.py"
echo "✅ Scripts made executable"

# Create automation status file
STATUS_FILE="$BACKEND_DIR/data/automation_status.json"
if [ ! -f "$STATUS_FILE" ]; then
    cat > "$STATUS_FILE" << 'EOF'
{
  "status": "active",
  "started": "2026-01-15",
  "last_full_sync": null,
  "last_quick_sync": null,
  "last_health_check": null,
  "catalog_count": 18,
  "total_products": 2049
}
EOF
    echo "✅ Created automation status file"
fi

# Display deployment information
echo ""
echo "📋 DEPLOYMENT COMMANDS"
echo "====================="
echo ""
echo "Run FULL SYNC (all 18 brands):"
echo "  python scripts/ecosystem_orchestrator.py --mode=full"
echo ""
echo "Run FULL SYNC for single brand:"
echo "  python scripts/ecosystem_orchestrator.py --brand=nord"
echo ""
echo "Run QUICK SYNC (Halilit pricing updates only):"
echo "  python scripts/ecosystem_automation_manager.py --mode=quick"
echo ""
echo "Run HEALTH CHECK:"
echo "  python scripts/ecosystem_automation_manager.py --mode=health"
echo ""
echo "View logs:"
echo "  tail -f logs/ecosystem/automation.log"
echo ""
echo "Check status:"
echo "  cat data/automation_status.json"
echo ""
echo "✅ DEPLOYMENT COMPLETE"
echo ""
echo "Next steps:"
echo "  1. Run: python scripts/ecosystem_orchestrator.py --mode=full"
echo "  2. Monitor: tail -f logs/ecosystem/automation.log"
echo "  3. Check results: ls -lh data/catalogs_unified/"
echo ""
