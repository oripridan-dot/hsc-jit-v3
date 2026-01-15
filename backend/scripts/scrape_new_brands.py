#!/usr/bin/env python3
"""
SCRAPE 20 NEW BRANDS
Uses the ultra scraper to get catalogs for 20 additional brands
"""

import asyncio
from pathlib import Path
import logging
from ultra_scraper_100_percent import UltraScraper100Percent

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')
logger = logging.getLogger(__name__)

NEW_BRANDS = {
    "allen-heath": ("Allen & Heath", "https://www.allen-heath.com"),
    "ampeg": ("Ampeg", "https://www.ampeg.com"),
    "avid": ("Avid", "https://www.avid.com"),
    "breedlove-guitars": ("Breedlove", "https://www.breedloveguitars.com"),
    "cordoba-guitars": ("Cordoba", "https://www.cordobaguitars.com"),
    "esp": ("ESP", "https://www.espguitars.com"),
    "eve-audio": ("EVE Audio", "https://eve-audio.com"),
    "guild": ("Guild", "https://www.guildguitars.com"),
    "heritage-audio": ("Heritage Audio", "https://www.heritageaudio.com"),
    "universal-audio": ("Universal Audio", "https://www.uaudio.com"),
    "austrian-audio": ("Austrian Audio", "https://austrian.audio"),
    "amphion": ("Amphion", "https://www.amphion.fi"),
    "ashdown-engineering": ("Ashdown", "https://ashdownmusic.com"),
    "alto-professional": ("Alto", "https://www.altoprofessional.com"),
    "dixon": ("Dixon", "https://www.dixondrums.com"),
    "encore": ("Encore", "https://www.encoreusa.com"),
    "fusion": ("Fusion", "https://www.fusionguitars.com"),
    "gon-bops": ("Gon Bops", "https://gonbops.com"),
    "adams": ("Adams", "https://www.adams-music.com"),
    "hiwatt": ("Hiwatt", "https://www.hiwatt.co.uk"),
}

async def main():
    """Scrape all 20 new brands."""
    logger.info("\n" + "="*80)
    logger.info("SCRAPING 20 NEW BRANDS")
    logger.info("="*80)
    
    scraper = UltraScraper100Percent()
    
    # Scrape all brands in parallel
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

if __name__ == "__main__":
    asyncio.run(main())
