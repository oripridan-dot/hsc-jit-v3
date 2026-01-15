#!/usr/bin/env python3
"""
Real Halilit Sync - Fetch actual data from Halilit website
"""
from scripts.halilit_scraper import HalilitScraper
import sys
import asyncio
from pathlib import Path
import json
import logging

# Setup paths
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))


# Setup logging
LOGS_DIR = BACKEND_DIR / "logs" / "elite"
LOGS_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / 'halilit_sync.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Official Halilit brand URLs (updated for 2026 site structure)
# Using search URLs which work across all brands
BRANDS = [
    {
        'id': 'korg',
        'name': 'Korg',
        'url': 'https://www.halilit.com/search?brand=Korg'
    },
    {
        'id': 'roland',
        'name': 'Roland',
        'url': 'https://www.halilit.com/search?brand=Roland'
    },
    {
        'id': 'yamaha',
        'name': 'Yamaha',
        'url': 'https://www.halilit.com/search?brand=Yamaha'
    },
    {
        'id': 'nord',
        'name': 'Nord',
        'url': 'https://www.halilit.com/search?brand=Nord'
    },
    {
        'id': 'arturia',
        'name': 'Arturia',
        'url': 'https://www.halilit.com/search?brand=Arturia'
    },
    {
        'id': 'akai',
        'name': 'Akai Professional',
        'url': 'https://www.halilit.com/search?brand=Akai+Professional'
    },
    {
        'id': 'boss',
        'name': 'Boss',
        'url': 'https://www.halilit.com/search?brand=Boss'
    }
]


async def main():
    """Run full Halilit sync"""
    logger.info("=" * 60)
    logger.info("🚀 STARTING REAL HALILIT SYNC")
    logger.info("=" * 60)
    logger.info(f"Scraping {len(BRANDS)} brands from Halilit.com")

    scraper = HalilitScraper()
    total_products = 0
    results = []

    for i, brand in enumerate(BRANDS, 1):
        brand_id = brand['id']
        brand_name = brand['name']
        brand_url = brand['url']

        logger.info(f"\n[{i}/{len(BRANDS)}] Processing: {brand_name}")
        logger.info(f"URL: {brand_url}")

        try:
            result = await scraper.scrape_brand(brand_id, brand_url, max_pages=20)
            count = result.get('total_products', 0)
            total_products += count
            results.append(result)

            logger.info(f"✅ {brand_name}: {count} products scraped")

        except Exception as e:
            logger.error(f"❌ {brand_name} FAILED: {str(e)}")
            continue

    logger.info("\n" + "=" * 60)
    logger.info(f"✨ HALILIT SYNC COMPLETE")
    logger.info(f"Total products: {total_products:,}")
    logger.info(f"Brands processed: {len(results)}/{len(BRANDS)}")
    logger.info("=" * 60)

    # Save summary
    summary_file = BACKEND_DIR / "data" / "halilit_sync_summary.json"
    with open(summary_file, 'w') as f:
        json.dump({
            'total_products': total_products,
            'brands_count': len(results),
            'brands': [
                {
                    'id': r.get('brand_id'),
                    'products': r.get('total_products', 0),
                    'pages': r.get('pages_scraped', 0)
                }
                for r in results
            ]
        }, f, indent=2)

    print(f"\n💡 Check the UI Sync Monitor to see the results!")
    return total_products

if __name__ == "__main__":
    asyncio.run(main())
