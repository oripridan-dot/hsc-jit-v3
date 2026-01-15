#!/bin/bash
# ELITE CRON JOB SETUP FOR OPTION 2 AUTOMATION
# Run this script to install automated syncs
# Syncs: MON 2 AM Halilit → TUE 2 AM Brand Sites → WED 4 AM Merge

set -e

BACKEND_DIR="/workspaces/hsc-jit-v3/backend"
SCRIPTS_DIR="$BACKEND_DIR/scripts"
LOG_DIR="/var/log"

echo "🔧 Setting up elite automated syncs..."

# Create log directory
sudo mkdir -p $LOG_DIR
sudo chmod 777 $LOG_DIR

# Install cron jobs
CRONTAB_ENTRY_HALILIT="0 2 * * MON cd $BACKEND_DIR && python $SCRIPTS_DIR/master_sync.py --priority >> $LOG_DIR/halilit-sync.log 2>&1"
CRONTAB_ENTRY_BRAND="0 2 * * TUE cd $BACKEND_DIR && python $SCRIPTS_DIR/brand_website_scraper.py >> $LOG_DIR/brand-sync.log 2>&1"
CRONTAB_ENTRY_MERGE="0 4 * * WED cd $BACKEND_DIR && python $SCRIPTS_DIR/merge_catalog.py >> $LOG_DIR/merge-sync.log 2>&1"
CRONTAB_ENTRY_MONITOR="*/30 * * * * cd $BACKEND_DIR && python $SCRIPTS_DIR/elite_monitor.py >> $LOG_DIR/monitor.log 2>&1"

# Check if already installed
if crontab -l 2>/dev/null | grep -q "master_sync.py"; then
    echo "⚠️  Cron jobs already configured, skipping..."
else
    echo "Installing cron jobs..."
    (crontab -l 2>/dev/null || true; echo "$CRONTAB_ENTRY_HALILIT"; echo "$CRONTAB_ENTRY_BRAND"; echo "$CRONTAB_ENTRY_MERGE"; echo "$CRONTAB_ENTRY_MONITOR") | crontab -
    echo "✅ Cron jobs installed"
fi

# List installed jobs
echo ""
echo "📋 Scheduled Syncs:"
echo "   MON 2 AM  → Halilit sync (source: hnilit.com, 18 brands)"
echo "   TUE 2 AM  → Brand website scraping (with Playwright)"
echo "   WED 4 AM  → Merge catalogs (PRIMARY/SECONDARY marking)"
echo "   Every 30m → Health monitoring with auto-recovery"
echo ""

# Verify cron is running
if pgrep -x cron > /dev/null; then
    echo "✅ Cron daemon is running"
else
    echo "⚠️  Cron daemon not running, starting..."
    sudo service cron start
fi

echo ""
echo "🎯 Setup complete! Logs will be saved to:"
echo "   - $LOG_DIR/halilit-sync.log"
echo "   - $LOG_DIR/brand-sync.log"
echo "   - $LOG_DIR/merge-sync.log"
echo "   - $LOG_DIR/monitor.log"
echo "   - $LOG_DIR/hsc-sync-orchestrator.log"
echo ""
echo "📊 Check current cron schedule:"
echo "   crontab -l"
echo ""
echo "🔍 Monitor health in real-time:"
echo "   python $SCRIPTS_DIR/elite_monitor.py"
echo ""
