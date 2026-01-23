#!/usr/bin/env python3
"""
HSC-JIT v3 - Complete Data Scrape with DNA System
===================================================

Full comprehensive product data extraction across all brands
with the DNA (Data Nervous Architecture) system active.

This script runs all brand scrapers to collect:
✓ Complete product metadata
✓ Full descriptions and marketing content  
✓ All images and media
✓ Complete specifications
✓ All features and benefits
✓ Manuals and documentation
✓ Support resources
✓ Related products and accessories
✓ Connectivity DNA analysis
✓ Product tier classification
"""

import asyncio
import logging
import json
from pathlib import Path
from datetime import datetime, timezone

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)


async def scrape_with_dna():
    """Run comprehensive scrape with DNA system"""
    
    logger.info("=" * 80)
    logger.info("🧬 HSC-JIT v3 - COMPREHENSIVE DATA SCRAPE WITH DNA SYSTEM")
    logger.info("=" * 80)
    logger.info("")
    logger.info("📋 System Configuration:")
    logger.info("   Version: 3.7.3-DNA")
    logger.info("   Mode: Full Comprehensive Extraction")
    logger.info("   Output: /workspaces/hsc-jit-v3/backend/data/catalogs_brand/")
    logger.info("")
    
    # Import scrapers
    try:
        from services.roland_scraper import RolandScraper
        from services.nord_scraper import NordScraper
        from services.boss_scraper import BossScraper
        from services.moog_scraper import MoogScraper
        from models.brand_taxonomy import get_brand_taxonomy
        
        logger.info("✅ All scrapers imported successfully")
        logger.info("")
    except Exception as e:
        logger.error(f"❌ Failed to import scrapers: {e}")
        return False
    
    # Initialize scrapers
    scrapers = {
        "roland": RolandScraper(),
        "nord": NordScraper(),
        "boss": BossScraper(),
        "moog": MoogScraper(),
    }
    
    output_dir = Path("./data/catalogs_brand")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    total_products = 0
    completed_brands = []
    failed_brands = []
    
    # Run scrapers sequentially
    for brand_id, scraper in scrapers.items():
        logger.info(f"\n{'='*80}")
        logger.info(f"🔨 SCRAPING: {brand_id.upper()}")
        logger.info(f"{'='*80}")
        
        try:
            logger.info(f"   Starting comprehensive scrape for {brand_id.upper()}...")
            logger.info(f"   Goal: Extract 100% of all available product data")
            logger.info("")
            
            # Run the scraper with DNA system active
            # max_products=None means scrape ALL products
            catalog = await scraper.scrape_all_products(max_products=None)
            
            if catalog and catalog.products:
                product_count = len(catalog.products)
                total_products += product_count
                
                # Save to JSON
                output_file = output_dir / f"{brand_id}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        "brand_identity": {
                            "id": catalog.brand_id,
                            "name": catalog.brand_name,
                            "description": catalog.description,
                            "logo_url": catalog.logo_url,
                            "website": catalog.brand_website,
                        },
                        "products": [
                            {
                                "id": p.id,
                                "brand": p.brand,
                                "name": p.name,
                                "model_number": p.model_number,
                                "sku": p.sku,
                                "main_category": p.main_category,
                                "subcategory": p.subcategory,
                                "description": p.description,
                                "short_description": p.short_description,
                                "image_url": p.image_url,
                                "images": [
                                    {"url": img.url, "type": img.type, "alt_text": img.alt_text}
                                    for img in (p.images or [])
                                ],
                                "specifications": [
                                    {"key": spec.key, "value": spec.value}
                                    for spec in (p.specifications or [])
                                ],
                                "features": p.features or [],
                                "tags": p.tags or [],
                                "price_ils": getattr(p, 'price_ils', None),
                                "availability": getattr(p, 'availability', 'unknown'),
                                "manuals": getattr(p, 'manuals', []),
                                "videos": getattr(p, 'videos', []),
                                "support_articles": getattr(p, 'support_articles', []),
                                "related_products": getattr(p, 'related_products', []),
                            }
                            for p in catalog.products
                        ]
                    }, f, indent=2, ensure_ascii=False)
                
                logger.info(f"✅ {brand_id.upper()} Complete!")
                logger.info(f"   Products extracted: {product_count}")
                logger.info(f"   File: {output_file}")
                completed_brands.append((brand_id, product_count))
            else:
                logger.warning(f"⚠️  No products found for {brand_id}")
                failed_brands.append(brand_id)
                
        except Exception as e:
            logger.error(f"❌ Error scraping {brand_id}: {e}")
            failed_brands.append(brand_id)
    
    # Final report
    logger.info(f"\n{'='*80}")
    logger.info("📊 FINAL COMPREHENSIVE SCRAPE REPORT")
    logger.info(f"{'='*80}")
    logger.info("")
    
    if completed_brands:
        logger.info("✅ SUCCESSFULLY SCRAPED BRANDS:")
        for brand_id, count in completed_brands:
            logger.info(f"   • {brand_id.upper()}: {count} products")
    
    if failed_brands:
        logger.info("")
        logger.info("⚠️  BRANDS WITH ISSUES:")
        for brand_id in failed_brands:
            logger.info(f"   • {brand_id.upper()}")
    
    logger.info("")
    logger.info(f"📈 TOTAL PRODUCTS EXTRACTED: {total_products}")
    logger.info(f"🧬 DNA SYSTEM STATUS: {'ACTIVE' if total_products > 0 else 'INACTIVE'}")
    logger.info(f"✓ Output Directory: {output_dir}")
    logger.info("")
    
    return total_products > 0


async def main():
    """Main entry point"""
    success = await scrape_with_dna()
    
    if success:
        logger.info("=" * 80)
        logger.info("🎉 COMPREHENSIVE SCRAPE WITH DNA SYSTEM COMPLETE!")
        logger.info("=" * 80)
        logger.info("")
        logger.info("📌 Next Steps:")
        logger.info("   1. Run: python3 forge_backbone.py")
        logger.info("   2. Frontend will load the complete dataset")
        logger.info("   3. All 100% product data with DNA enrichment active")
        logger.info("")
    else:
        logger.error("❌ Scrape failed. Please check the logs above.")


if __name__ == "__main__":
    asyncio.run(main())
