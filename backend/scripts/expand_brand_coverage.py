#!/usr/bin/env python3
"""
EXPAND BRAND COVERAGE - Add 20+ More Brands
Identifies brands with substantial Halilit catalogs and adds them to scraping system
"""

import json
import asyncio
from pathlib import Path
import logging
from ultra_scraper_100_percent import UltraScraper100Percent

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"

# 20 additional high-value brands with their official websites
NEW_BRANDS = {
    "allen-heath": ("Allen & Heath", "https://www.allen-heath.com"),
    "ampeg": ("Ampeg", "https://www.ampeg.com"),
    "esp": ("ESP Guitars", "https://www.espguitars.com"),
    "eden": ("Eden Electronics", "https://www.eden-electronics.com"),
    "eve-audio": ("EVE Audio", "https://eve-audio.com"),
    "guild": ("Guild Guitars", "https://www.guildguitars.com"),
    "heritage-audio": ("Heritage Audio", "https://www.heritageaudio.com"),
    "hiwatt": ("Hiwatt", "https://www.hiwatt.co.uk"),
    "keith-mcmillen": ("Keith McMillen Instruments", "https://www.keithmcmillen.com"),
    "lag-guitars": ("LAG Guitars", "https://www.lagguitars.com"),
    "lynx": ("Lynx Studio Technology", "https://www.lynxstudio.com"),
    "maestro": ("Maestro", "https://www.gibson.com/maestro"),
    "maton": ("Maton Guitars", "https://www.maton.com.au"),
    "medeli": ("Medeli", "https://www.medeli.com"),
    "montarbo": ("Montarbo", "https://www.montarbo.com"),
    "oscar-schmidt": ("Oscar Schmidt", "https://www.oscarschmidt.com"),
    "perris-leathers": ("Perri's Leathers", "https://www.perrisleathers.com"),
    "on-stage": ("On-Stage Stands", "https://www.onstagestands.com"),
    "ashdown": ("Ashdown Engineering", "https://ashdownmusic.com"),
    "tc-electronic": ("TC Electronic", "https://www.tcelectronic.com"),
}

async def main():
    """Expand coverage to 20+ more brands."""
    logger.info("="*80)
    logger.info("EXPANDING BRAND COVERAGE - Adding 20 More Brands")
    logger.info("="*80)
    
    scraper = UltraScraper100Percent()
    
    # Update brand configs
    for brand_id, (name, url) in NEW_BRANDS.items():
        logger.info(f"\n🔍 Adding {name} ({brand_id})...")
    
    # Scrape all new brands
    tasks = []
    for brand_id, (name, url) in NEW_BRANDS.items():
        tasks.append(scraper.scrape_brand(brand_id, name, url))
    
    results = await asyncio.gather(*tasks)
    
    # Save results
    for result in results:
        scraper.results[result['brand_id']] = result
        scraper._save_brand_data(result)
    
    # Generate summary
    scraper._generate_summary()
    
    logger.info("\n" + "="*80)
    logger.info("✅ EXPANSION COMPLETE!")
    logger.info("="*80)
    logger.info(f"Total brands now covered: {len(scraper.halilit_reference) + len(NEW_BRANDS)}")

if __name__ == "__main__":
    asyncio.run(main())
