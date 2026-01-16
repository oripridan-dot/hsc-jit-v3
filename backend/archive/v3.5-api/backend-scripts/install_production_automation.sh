#!/bin/bash
# PRODUCTION CRON SETUP & AUTOMATION v3.5
# Sets up complete daily synchronization and monitoring

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
PYTHON_BIN=$(which python3)
LOG_DIR="$BACKEND_DIR/logs/automation"

echo "════════════════════════════════════════════════════════════"
echo "   🧠 ECOSYSTEM INTELLIGENCE - PRODUCTION CRON SETUP v3.5"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📍 Backend Directory: $BACKEND_DIR"
echo "📍 Python Binary: $PYTHON_BIN"
echo "📍 Log Directory: $LOG_DIR"
echo ""

# Create necessary directories
mkdir -p "$LOG_DIR"
mkdir -p "$BACKEND_DIR/logs/ecosystem"
mkdir -p "$BACKEND_DIR/logs/health"
mkdir -p "$BACKEND_DIR/data/backups"

# Make scripts executable
chmod +x "$SCRIPT_DIR/ecosystem_orchestrator.py"
chmod +x "$SCRIPT_DIR/ecosystem_automation_manager.py"
chmod +x "$SCRIPT_DIR/elite_monitor.py"
chmod +x "$SCRIPT_DIR/playwright_brand_scraper.py"

echo "✅ Directories created and scripts made executable"
echo ""

# Backup existing crontab
echo "📋 Backing up existing crontab..."
BACKUP_FILE="/tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt"
crontab -l > "$BACKUP_FILE" 2>/dev/null || true
echo "   Saved to: $BACKUP_FILE"
echo ""

# Check if entries already exist
if crontab -l 2>/dev/null | grep -q "ECOSYSTEM INTELLIGENCE"; then
    echo "⚠️  Ecosystem cron jobs already installed"
    echo ""
    read -p "   Do you want to reinstall? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled. Existing cron jobs preserved."
        exit 0
    fi
    
    # Remove old entries
    echo "🗑️  Removing old entries..."
    crontab -l | grep -v "ECOSYSTEM INTELLIGENCE" | grep -v "ecosystem_orchestrator" | grep -v "ecosystem_automation" | grep -v "elite_monitor" | grep -v "playwright_brand" | crontab - 2>/dev/null || true
fi

# Create comprehensive cron entries
CRON_ENTRIES="
# ════════════════════════════════════════════════════════════════
# ECOSYSTEM INTELLIGENCE ENGINE v3.5 - AUTOMATED SYNCHRONIZATION
# Generated: $(date)
# ════════════════════════════════════════════════════════════════

# TIER 1: ENHANCED BRAND SCRAPING (Roland, Pearl, Mackie)
# Daily at 2:00 AM - High priority for PRIMARY coverage improvement
0 2 * * * cd $BACKEND_DIR && $PYTHON_BIN scripts/playwright_brand_scraper.py >> $LOG_DIR/brand_scrape.log 2>&1

# TIER 2: FULL ECOSYSTEM SYNC
# Daily at 2:30 AM - After enhanced brand scraping
30 2 * * * cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_orchestrator.py --mode=full >> $LOG_DIR/full_sync.log 2>&1

# TIER 3: QUICK PRICING UPDATES
# Every 6 hours (00:00, 06:00, 12:00, 18:00) - Fast Halilit pricing sync
0 */6 * * * cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_orchestrator.py --mode=quick >> $LOG_DIR/quick_sync.log 2>&1

# TIER 4: HEALTH MONITORING & AUTO-RECOVERY
# Every hour - Monitor system health and auto-recover from failures
0 * * * * cd $BACKEND_DIR && $PYTHON_BIN scripts/elite_monitor.py --auto-recover >> $LOG_DIR/health_check.log 2>&1

# TIER 5: ECOSYSTEM ANALYSIS & INTELLIGENCE
# Weekly on Sundays at 3:00 AM - Deep analysis and optimization
0 3 * * 0 cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_analyzer.py >> $LOG_DIR/analysis.log 2>&1

# TIER 6: DATA BACKUP & HOUSEKEEPING
# Weekly on Saturdays at 4:00 AM - Backup important data
0 4 * * 6 cd $BACKEND_DIR && bash scripts/backup_data.sh >> $LOG_DIR/backup.log 2>&1

# TIER 7: DAILY REPORTS & ALERTING
# Daily at 6:00 AM - Generate daily reports and check for anomalies
0 6 * * * cd $BACKEND_DIR && $PYTHON_BIN scripts/daily_report_generator.py >> $LOG_DIR/reports.log 2>&1

# TIER 8: PERFORMANCE CLEANUP
# Daily at 11:00 PM - Clean old logs and temp files
0 23 * * * cd $BACKEND_DIR && find logs -type f -name '*.log' -mtime +30 -delete >> $LOG_DIR/cleanup.log 2>&1

# ════════════════════════════════════════════════════════════════
"

# Add new entries
echo "✅ Installing comprehensive cron jobs..."
(crontab -l 2>/dev/null; echo "$CRON_ENTRIES") | crontab -

# Display summary
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ ECOSYSTEM INTELLIGENCE AUTOMATION INSTALLED!"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "📅 SCHEDULED AUTOMATION:"
echo ""
echo "  TIER 1: Enhanced Brand Scraping (Roland, Pearl, Mackie)"
echo "    ⏰ Daily at 02:00 AM"
echo "    📊 Improves PRIMARY coverage with Playwright JS rendering"
echo ""
echo "  TIER 2: Full Ecosystem Sync"
echo "    ⏰ Daily at 02:30 AM"
echo "    📊 Complete merge of brand + Halilit catalogs"
echo ""
echo "  TIER 3: Quick Pricing Updates"
echo "    ⏰ Every 6 hours (00:00, 06:00, 12:00, 18:00)"
echo "    ⚡ Fast Halilit updates only"
echo ""
echo "  TIER 4: Health Monitoring & Auto-Recovery"
echo "    ⏰ Every hour"
echo "    🏥 Automatic failure detection and recovery"
echo ""
echo "  TIER 5: Ecosystem Analysis"
echo "    ⏰ Weekly on Sundays at 03:00 AM"
echo "    📈 Deep intelligence and optimization"
echo ""
echo "  TIER 6: Data Backup"
echo "    ⏰ Weekly on Saturdays at 04:00 AM"
echo "    💾 Automatic catalog backups"
echo ""
echo "  TIER 7: Daily Reports"
echo "    ⏰ Daily at 06:00 AM"
echo "    📋 Generate reports and check anomalies"
echo ""
echo "  TIER 8: Performance Cleanup"
echo "    ⏰ Daily at 11:00 PM"
echo "    🧹 Clean logs older than 30 days"
echo ""

echo "📝 LOG FILES:"
echo "   Location: $LOG_DIR/"
echo ""
echo "   • brand_scrape.log      - Enhanced brand scraping (Roland, Pearl, Mackie)"
echo "   • full_sync.log         - Complete ecosystem sync"
echo "   • quick_sync.log        - Quick pricing updates"
echo "   • health_check.log      - Health monitoring and recovery"
echo "   • analysis.log          - Weekly analysis"
echo "   • backup.log            - Backup operations"
echo "   • reports.log           - Daily report generation"
echo "   • cleanup.log           - Cleanup operations"
echo ""

echo "🔧 MANAGEMENT COMMANDS:"
echo ""
echo "   View all cron jobs:"
echo "     crontab -l"
echo ""
echo "   Edit cron jobs:"
echo "     crontab -e"
echo ""
echo "   Remove all ecosystem jobs:"
echo "     crontab -l | grep -v ECOSYSTEM | crontab -"
echo ""
echo "   Remove all jobs:"
echo "     crontab -r"
echo ""

echo "🧪 TEST COMMANDS:"
echo ""
echo "   Test enhanced brand scraping:"
echo "     cd $BACKEND_DIR && $PYTHON_BIN scripts/playwright_brand_scraper.py"
echo ""
echo "   Test full sync:"
echo "     cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_orchestrator.py --mode=full"
echo ""
echo "   Test quick sync:"
echo "     cd $BACKEND_DIR && $PYTHON_BIN scripts/ecosystem_orchestrator.py --mode=quick"
echo ""
echo "   Test health check:"
echo "     cd $BACKEND_DIR && $PYTHON_BIN scripts/elite_monitor.py --auto-recover"
echo ""

echo "📊 EXPECTED IMPROVEMENTS:"
echo ""
echo "   Current PRIMARY coverage: 4.6% (12 products)"
echo "   Target PRIMARY coverage:  80%+ (250+ products)"
echo ""
echo "   Key improvements from enhanced scrapers:"
echo "   • Roland: 500 Halilit products → ~100-150 PRIMARY expected"
echo "   • Pearl:  364 Halilit products → ~80-120 PRIMARY expected"
echo "   • Mackie: 219 Halilit products → ~50-80 PRIMARY expected"
echo ""
echo "   Timeline to 80%+: 1-2 weeks of optimization"
echo ""

echo "🚀 SYSTEM STATUS:"
echo ""
echo "   System is now running on FULL AUTOPILOT!"
echo "   ✅ Brand scraping will improve PRIMARY coverage daily"
echo "   ✅ Halilit pricing updates every 6 hours"
echo "   ✅ Health monitoring every hour"
echo "   ✅ Automatic recovery from failures"
echo "   ✅ Weekly analysis and backups"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "💡 NEXT STEPS:"
echo ""
echo "   1. Monitor the logs for the first 24 hours"
echo "   2. Check coverage improvement in API:"
echo "      curl http://localhost:8000/api/dual-source-intelligence | jq"
echo ""
echo "   3. Optimize scraper configs based on results"
echo ""
echo "   4. Once PRIMARY coverage reaches 50%+, reduce sync frequency"
echo ""
echo "════════════════════════════════════════════════════════════"
