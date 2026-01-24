#!/usr/bin/env python3
"""
Daily Update Script
===================

Designed for Cron / Scheduled Task execution (e.g., twice daily).

Pipeline:
1. Brand Registry Sync (Fetch latest official brands list)
2. Mass Ingest (Scrape all brands to Vault)
3. Forge Backbone (Refine, Verify, and Deploy to Frontend)

Usage:
    python3 daily_update.py >> /var/log/hsc_daily.log 2>&1
"""

import logging
from datetime import datetime
from mass_ingest_protocol import execute_full_catalog_skeleton

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | DAILY_UPDATE | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    start_time = datetime.now()
    logger.info("🚀 Starting Daily Catalog Update Cycle")
    
    try:
        # Run the full protocol (Scrape -> Forge)
        execute_full_catalog_skeleton()
        
        duration = datetime.now() - start_time
        logger.info(f"✅ Daily Cycle Complete in {duration}")
        
    except KeyboardInterrupt:
        logger.warning("⚠️  Cycle Interrupted by User")
    except Exception as e:
        logger.error(f"❌ Cycle Failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    import sys
    main()
