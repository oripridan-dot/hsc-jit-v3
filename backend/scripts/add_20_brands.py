#!/usr/bin/env python3
"""
ADD 20 NEW BRANDS - Complete Implementation
1. Scrape Halilit catalogs for 20 new brands
2. Scrape brand websites
3. Create unified catalogs
4. Update API reports
"""

import asyncio
import json
from pathlib import Path
import logging
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.harvester import HarvesterService
from ultra_scraper_100_percent import UltraScraper100Percent
from aggressive_matcher import AggressiveMatcher

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"

# 20 new brands with verified websites
NEW_BRANDS = [
    ("allen-heath", "Allen & Heath", "https://www.allen-heath.com"),
    ("ampeg", "Ampeg", "https://www.ampeg.com"),
    ("avid", "Avid", "https://www.avid.com"),
    ("breedlove-guitars", "Breedlove Guitars", "https://www.breedloveguitars.com"),
    ("cordoba-guitars", "Cordoba Guitars", "https://www.cordobaguitars.com"),
    ("esp", "ESP Guitars", "https://www.espguitars.com"),
    ("eve-audio", "EVE Audio", "https://eve-audio.com"),
    ("guild", "Guild Guitars", "https://www.guildguitars.com"),
    ("heritage-audio", "Heritage Audio", "https://www.heritageaudio.com"),
    ("universal-audio", "Universal Audio", "https://www.uaudio.com"),
    ("austrian-audio", "Austrian Audio", "https://austrian.audio"),
    ("amphion", "Amphion", "https://www.amphion.fi"),
    ("ashdown-engineering", "Ashdown Engineering", "https://ashdownmusic.com"),
    ("alto-professional", "Alto Professional", "https://www.altoprofessional.com"),
    ("dixon", "Dixon Drums", "https://www.dixondrums.com"),
    ("encore", "Encore", "https://www.encoreusa.com"),
    ("fusion", "Fusion", "https://www.fusionguitars.com"),
    ("gon-bops", "Gon Bops", "https://gonbops.com"),
    ("adams", "Adams Musical Instruments", "https://www.Adams-music.com"),
    ("hiwatt", "Hiwatt", "https://www.hiwatt.co.uk"),
]

async def main():
    logger.info("="*80)
    logger.info("🚀 ADDING 20 NEW BRANDS TO ECOSYSTEM")
    logger.info("="*80 + "\n")
    
    # Step 1: Harvest Halilit catalogs
    logger.info("📥 STEP 1: Harvesting Halilit catalogs...")
    logger.info("-"*80)
    harvester = HarvesterService()
    for brand_id, brand_name, _ in NEW_BRANDS:
        try:
            products = await harvester.harvest_brand(brand_id)
            logger.info(f"✅ {brand_name:30} │ {len(products):3} Halilit products")
        except Exception as e:
            logger.warning(f"⚠️  {brand_name:30} │ {str(e)[:40]}")
    
    # Step 2: Scrape brand websites
    logger.info("\n🎯 STEP 2: Scraping brand websites...")
    logger.info("-"*80)
    scraper = UltraScraper100Percent()
    tasks = [
        scraper.scrape_brand(brand_id, name, url)
        for brand_id, name, url in NEW_BRANDS
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"❌ Error: {result}")
        else:
            scraper.results[result['brand_id']] = result
            scraper._save_brand_data(result)
            logger.info(f"✅ {result['brand_name']:30} │ {result['scraped_count']:3} products")
    
    # Step 3: Create unified catalogs
    logger.info("\n🔗 STEP 3: Creating unified catalogs...")
    logger.info("-"*80)
    matcher = AggressiveMatcher(threshold=0.4)
    matcher.match_all_brands()
    
    # Step 4: Update reports
    logger.info("\n📊 STEP 4: Updating API reports...")
    import subprocess
    subprocess.run([
        "python3",
        str(BACKEND_DIR / "scripts" / "update_api_reports.py")
    ])
    
    logger.info("\n" + "="*80)
    logger.info("✅ EXPANSION COMPLETE!")
    logger.info(f"   Total brands: {18 + len(NEW_BRANDS)}")
    logger.info("="*80)

if __name__ == "__main__":
    asyncio.run(main())
