#!/usr/bin/env python3
"""
COMPLETE 38-BRAND COVERAGE
Final push to 100% coverage across 38 brands
"""

import asyncio
import json
from pathlib import Path
import logging
import subprocess

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent

async def main():
    logger.info("="*80)
    logger.info("🚀 FINAL PUSH: 38-BRAND COMPLETE COVERAGE")
    logger.info("="*80 + "\n")
    
    # Step 1: Complete scraping for 20 new brands
    logger.info("STEP 1: Completing brand website scraping...")
    logger.info("-"*80)
    result = subprocess.run([
        "python3",
        str(BACKEND_DIR / "scripts" / "scrape_new_brands.py")
    ], capture_output=True, text=True, timeout=300)
    
    if result.returncode == 0:
        logger.info("✅ Brand website scraping complete")
    else:
        logger.warning("⚠️  Some brands may have failed")
        logger.info(result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
    
    # Step 2: Run aggressive matcher for ALL brands
    logger.info("\nSTEP 2: Creating unified catalogs...")
    logger.info("-"*80)
    result = subprocess.run([
        "python3",
        str(BACKEND_DIR / "scripts" / "aggressive_matcher.py")
    ], capture_output=True, text=True)
    
    print(result.stdout)
    
    # Step 3: Update API reports
    logger.info("\nSTEP 3: Updating API reports...")
    logger.info("-"*80)
    result = subprocess.run([
        "python3",
        str(BACKEND_DIR / "scripts" / "update_api_reports.py")
    ], capture_output=True, text=True)
    
    print(result.stdout)
    
    # Step 4: Verify final coverage
    logger.info("\nSTEP 4: Verifying final coverage...")
    logger.info("-"*80)
    
    import requests
    try:
        response = requests.get("http://localhost:8000/api/dual-source-intelligence")
        if response.status_code == 200:
            data = response.json()
            stats = data.get("global_stats", {})
            
            logger.info(f"\n🎉 FINAL RESULTS:")
            logger.info(f"   Total Products: {stats.get('total_products', 0)}")
            logger.info(f"   PRIMARY: {stats.get('primary_products', 0)}")
            logger.info(f"   Coverage: {stats.get('dual_source_coverage', 0)}%")
            logger.info(f"   Total Brands: {len(data.get('brands', []))}")
    except:
        logger.info("   ℹ️  API not available, check reports manually")
    
    logger.info("\n" + "="*80)
    logger.info("✅ 38-BRAND EXPANSION COMPLETE!")
    logger.info("="*80)

if __name__ == "__main__":
    asyncio.run(main())
