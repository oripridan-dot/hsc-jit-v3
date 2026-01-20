#!/usr/bin/env python3
"""
Dynamic Product Scraper Runner
================================

Allows on-the-fly scraping of specific numbers of products from any brand.
Supports adding/removing products from existing catalogs or creating new ones.

Usage:
    python3 dynamic_scraper.py --brand roland --products 3
    python3 dynamic_scraper.py --brand boss --products 5
    python3 dynamic_scraper.py --brand nord --products 3
    python3 dynamic_scraper.py --brand moog --products 10
    python3 dynamic_scraper.py --brand roland --products 3 --merge  # Add to existing
"""

import asyncio
import logging
import json
from pathlib import Path
from typing import Optional
import argparse
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import scrapers
from services.roland_scraper import RolandScraper
from services.boss_scraper import BossScraper
from services.nord_scraper import NordScraper
from services.moog_scraper import MoogScraper

# Data paths
DATA_DIR = Path(__file__).parent.parent / "frontend" / "public" / "data"
CATALOGS_DIR = DATA_DIR / "catalogs_brand"

SCRAPERS = {
    'roland': RolandScraper,
    'boss': BossScraper,
    'nord': NordScraper,
    'moog': MoogScraper,
}

BRANDS = {
    'roland': {'name': 'Roland', 'file': 'roland.json'},
    'boss': {'name': 'Boss', 'file': 'boss.json'},
    'nord': {'name': 'Nord', 'file': 'nord.json'},
    'moog': {'name': 'Moog', 'file': 'moog.json'},
}


async def scrape_brand(brand: str, num_products: int, merge: bool = False) -> bool:
    """
    Scrape specific number of products from a brand
    
    Args:
        brand: Brand name (roland, boss, nord, moog)
        num_products: Number of products to scrape
        merge: If True, merge with existing catalog; if False, replace
        
    Returns:
        True if successful, False otherwise
    """
    
    if brand.lower() not in SCRAPERS:
        logger.error(f"Unknown brand: {brand}. Available: {list(SCRAPERS.keys())}")
        return False
    
    brand_lower = brand.lower()
    scraper_class = SCRAPERS[brand_lower]
    brand_info = BRANDS[brand_lower]
    
    logger.info(f"\n{'='*80}")
    logger.info(f"🎯 Starting scrape: {brand_info['name']} ({num_products} products)")
    logger.info(f"{'='*80}\n")
    
    try:
        # Create scraper instance
        scraper = scraper_class()
        logger.info(f"✓ Initialized {brand_info['name']} scraper")
        
        # Scrape products
        logger.info(f"📊 Scraping {num_products} products...")
        catalog = await scraper.scrape_all_products(max_products=num_products)
        
        logger.info(f"✓ Scraped {len(catalog.products)} products")
        
        # Load existing catalog if merging
        existing_products = []
        existing_stats = {}
        catalog_path = DATA_DIR / brand_info['file']
        
        if merge and catalog_path.exists():
            logger.info(f"📂 Loading existing catalog: {brand_info['file']}")
            with open(catalog_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                existing_products = existing_data.get('products', [])
                existing_stats = existing_data.get('coverage_stats', {})
            
            logger.info(f"✓ Found {len(existing_products)} existing products")
            
            # Remove duplicates (by product ID)
            new_ids = {p.id for p in catalog.products}
            existing_products = [
                p for p in existing_products 
                if p['id'] not in new_ids
            ]
            
            # Combine products
            all_products = existing_products + [p.model_dump() for p in catalog.products]
            logger.info(f"✓ Merged: {len(existing_products)} existing + {len(catalog.products)} new = {len(all_products)} total")
            
            # Update catalog with merged products
            catalog.products = all_products
            catalog.total_products = len(all_products)
        
        # Save catalog
        logger.info(f"💾 Saving catalog: {brand_info['file']}")
        catalog_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(catalog_path, 'w', encoding='utf-8') as f:
            json.dump(catalog.model_dump(), f, indent=2, ensure_ascii=False, default=str)
        
        file_size = catalog_path.stat().st_size / 1024
        logger.info(f"✓ Saved: {brand_info['file']} ({file_size:.1f} KB)")
        
        # Also save to catalogs_brand for backup
        backup_path = CATALOGS_DIR / f"{brand_lower}_comprehensive.json"
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(catalog.model_dump(), f, indent=2, ensure_ascii=False, default=str)
        logger.info(f"✓ Backup: {backup_path.name}")
        
        # Print summary
        logger.info(f"\n{'─'*80}")
        logger.info(f"📈 SUMMARY: {brand_info['name']}")
        logger.info(f"{'─'*80}")
        logger.info(f"   Total Products: {catalog.total_products}")
        logger.info(f"   Total Images: {catalog.coverage_stats.get('total_images', 0)}")
        logger.info(f"   Total Videos: {catalog.coverage_stats.get('total_videos', 0)}")
        logger.info(f"   Total Specs: {catalog.coverage_stats.get('total_specifications', 0)}")
        logger.info(f"   Total Features: {catalog.coverage_stats.get('total_features', 0)}")
        logger.info(f"   Total Manuals: {catalog.coverage_stats.get('total_manuals', 0)}")
        logger.info(f"\n✅ Scraping complete!\n")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error scraping {brand_info['name']}: {e}", exc_info=True)
        return False


async def scrape_all_brands(num_products: int = 3, merge: bool = False) -> None:
    """Scrape specified number of products from all brands"""
    
    logger.info(f"\n{'='*80}")
    logger.info(f"🚀 MULTI-BRAND SCRAPE: {num_products} products per brand")
    logger.info(f"{'='*80}\n")
    
    results = {}
    
    for brand in SCRAPERS.keys():
        success = await scrape_brand(brand, num_products, merge)
        results[brand] = 'SUCCESS' if success else 'FAILED'
    
    # Print final summary
    logger.info(f"\n{'='*80}")
    logger.info(f"📊 FINAL RESULTS")
    logger.info(f"{'='*80}")
    for brand, status in results.items():
        symbol = '✅' if status == 'SUCCESS' else '❌'
        logger.info(f"   {symbol} {brand.upper()}: {status}")
    logger.info(f"{'='*80}\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Dynamic Product Scraper for Brand Syncing',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape 3 products from Roland
  python3 dynamic_scraper.py --brand roland --products 3
  
  # Scrape 5 products from Boss and add to existing catalog
  python3 dynamic_scraper.py --brand boss --products 5 --merge
  
  # Scrape 3 products from each brand
  python3 dynamic_scraper.py --all --products 3
  
  # Quick test: 3 products from all brands
  python3 dynamic_scraper.py --quick-test
        """
    )
    
    parser.add_argument(
        '--brand',
        choices=['roland', 'boss', 'nord', 'moog'],
        help='Brand to scrape'
    )
    parser.add_argument(
        '--products', '--num-products',
        type=int,
        default=3,
        help='Number of products to scrape (default: 3)'
    )
    parser.add_argument(
        '--merge',
        action='store_true',
        help='Merge with existing catalog instead of replacing'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Scrape all brands'
    )
    parser.add_argument(
        '--quick-test',
        action='store_true',
        help='Quick test: 3 products from each brand'
    )
    
    args = parser.parse_args()
    
    # Determine what to do
    if args.quick_test:
        asyncio.run(scrape_all_brands(num_products=3, merge=False))
    elif args.all:
        asyncio.run(scrape_all_brands(num_products=args.products, merge=args.merge))
    elif args.brand:
        success = asyncio.run(scrape_brand(args.brand, args.products, args.merge))
        exit(0 if success else 1)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
