#!/bin/bash
# ECOSYSTEM INTELLIGENCE AUTOMATION INSTALLER v3.5
# Sets up cron jobs for continuous product ecosystem updates

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PYTHON_BIN=$(which python3)

echo "🧠 Ecosystem Intelligence Automation Installer"
echo "=============================================="
echo ""
echo "Backend Directory: $BACKEND_DIR"
echo "Python Binary: $PYTHON_BIN"
echo ""

# Create cron job entries
CRON_ENTRIES="
# Ecosystem Intelligence Engine v3.5 - Automated Product Sync
# Generated: $(date)

# Full brand scraping - Daily at 2 AM
0 2 * * * cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_orchestrator.py --mode=full >> logs/ecosystem_full.log 2>&1

# Quick pricing updates - Every 6 hours
0 */6 * * * cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_orchestrator.py --mode=quick >> logs/ecosystem_quick.log 2>&1

# Weekly ecosystem analysis - Sundays at 3 AM
0 3 * * 0 cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_analyzer.py >> logs/ecosystem_analysis.log 2>&1

# Health check - Every hour
0 * * * * cd $BACKEND_DIR && $PYTHON_BIN scripts/elite_monitor.py >> logs/ecosystem_health.log 2>&1
"

# Backup existing crontab
echo "📋 Backing up existing crontab..."
crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || true

# Check if entries already exist
if crontab -l 2>/dev/null | grep -q "Ecosystem Intelligence Engine"; then
    echo "⚠️  Ecosystem cron jobs already installed"
    echo ""
    read -p "Do you want to reinstall? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    
    # Remove old entries
    echo "🗑️  Removing old entries..."
    crontab -l | grep -v "Ecosystem Intelligence Engine" | grep -v "ecosystem_orchestrator" | grep -v "ecosystem_analyzer" | crontab -
fi

# Add new entries
echo "✅ Installing cron jobs..."
(crontab -l 2>/dev/null; echo "$CRON_ENTRIES") | crontab -

# Create log directory
mkdir -p "$BACKEND_DIR/logs"

# Make scripts executable
chmod +x "$SCRIPT_DIR/ecosystem_orchestrator.py"
chmod +x "$SCRIPT_DIR/elite_monitor.py"

echo ""
echo "✅ Ecosystem Intelligence Automation Installed!"
echo ""
echo "📅 Scheduled Jobs:"
echo "  • Full Sync: Daily at 2:00 AM"
echo "  • Quick Sync: Every 6 hours"
echo "  • Analysis: Weekly (Sundays 3:00 AM)"
echo "  • Health Check: Every hour"
echo ""
echo "📝 Logs Location: $BACKEND_DIR/logs/"
echo "  • ecosystem_full.log"
echo "  • ecosystem_quick.log"
echo "  • ecosystem_analysis.log"
echo "  • ecosystem_health.log"
echo ""
echo "🔧 Management Commands:"
echo "  View cron jobs:   crontab -l"
echo "  Edit cron jobs:   crontab -e"
echo "  Remove all jobs:  crontab -r"
echo "  Test full sync:   cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_orchestrator.py --mode=full"
echo "  Test quick sync:  cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_orchestrator.py --mode=quick"
echo ""
echo "🚀 System is now running on autopilot!"
