#!/usr/bin/env python3
"""
TARGETED IMPROVEMENT FOR LOW-COVERAGE BRANDS
Focuses on Nord, RCF, Roland, Adam-Audio, PreSonus to push them to 100%
"""

import asyncio
import json
from pathlib import Path
import logging
from ultra_scraper_100_percent import UltraScraper100Percent

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent

# Brands needing improvement with enhanced strategies
IMPROVE_BRANDS = {
    "nord": ("Nord Keyboards", "https://www.nordkeyboards.com/products"),
    "rcf": ("RCF", "https://www.rcf.it/en_US/products"),
    "roland": ("Roland", "https://www.roland.com/us/categories/"),
    "adam-audio": ("Adam Audio", "https://www.adam-audio.com/en/products/"),
    "presonus": ("PreSonus", "https://www.presonus.com/products"),
}

async def main():
    logger.info("="*70)
    logger.info("🎯 TARGETED IMPROVEMENT - Push to 100%")
    logger.info("="*70 + "\n")
    
    scraper = UltraScraper100Percent()
    
    # Scrape brands needing improvement with enhanced strategies
    for brand_id, (name, url) in IMPROVE_BRANDS.items():
        logger.info(f"🔧 Re-scraping {name} with enhanced strategies...")
        result = await scraper.scrape_brand(brand_id, name, url)
        scraper.results[brand_id] = result
        scraper._save_brand_data(result)
        logger.info(f"   📊 {result['scraped_count']}/{result['expected_count']} = {result['coverage']}\n")
    
    logger.info("="*70)
    logger.info("✅ IMPROVEMENT COMPLETE")
    logger.info("="*70)

if __name__ == "__main__":
    asyncio.run(main())
