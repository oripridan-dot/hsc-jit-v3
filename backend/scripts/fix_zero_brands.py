#!/usr/bin/env python3
"""
TARGETED FIX FOR ZERO-PRODUCT BRANDS
Uses manual product list extraction for problematic sites
"""

import asyncio
import json
from pathlib import Path
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"

# Manual product lists for stubborn brands
MANUAL_PRODUCTS = {
    "allen-heath": {
        "brand": "Allen & Heath",
        "products": [
            {"name": "SQ-5", "category": "Digital Mixers", "url": "https://www.allen-heath.com/ahproducts/sq-5/"},
            {"name": "SQ-6", "category": "Digital Mixers", "url": "https://www.allen-heath.com/ahproducts/sq-6/"},
            {"name": "SQ-7", "category": "Digital Mixers", "url": "https://www.allen-heath.com/ahproducts/sq-7/"},
            {"name": "Avantis", "category": "Digital Mixers", "url": "https://www.allen-heath.com/ahproducts/avantis/"},
            {"name": "dLive S Class", "category": "Digital Mixers", "url": "https://www.allen-heath.com/ahproducts/dlive/"},
            {"name": "QU-16", "category": "Digital Mixers", "url": "https://www.allen-heath.com/ahproducts/qu-16/"},
            {"name": "QU-24", "category": "Digital Mixers", "url": "https://www.allen-heath.com/ahproducts/qu-24/"},
            {"name": "QU-32", "category": "Digital Mixers", "url": "https://www.allen-heath.com/ahproducts/qu-32/"},
            {"name": "ZED-10", "category": "Analog Mixers", "url": "https://www.allen-heath.com/ahproducts/zed-10/"},
            {"name": "ZED-12FX", "category": "Analog Mixers", "url": "https://www.allen-heath.com/ahproducts/zed-12fx/"},
        ]
    },
    "dixon": {
        "brand": "Dixon",
        "products": [
            {"name": "Spark 5-Piece Drum Kit", "category": "Drum Sets", "url": "https://www.dixondrums.com/products/spark-drum-set"},
            {"name": "Jet Pro 5-Piece Drum Kit", "category": "Drum Sets", "url": "https://www.dixondrums.com/products/jet-pro"},
            {"name": "Artisan 5-Piece Drum Kit", "category": "Drum Sets", "url": "https://www.dixondrums.com/products/artisan"},
            {"name": "Gregg Bissonette Signature Snare", "category": "Snare Drums", "url": "https://www.dixondrums.com/products/gregg-bissonette"},
            {"name": "PSH614 14x6.5 Snare", "category": "Snare Drums", "url": "https://www.dixondrums.com/products/psh614"},
            {"name": "Dixon Hi-Hat Stand", "category": "Hardware", "url": "https://www.dixondrums.com/products/hi-hat-stand"},
            {"name": "Dixon Snare Stand", "category": "Hardware", "url": "https://www.dixondrums.com/products/snare-stand"},
            {"name": "Dixon Cymbal Stand", "category": "Hardware", "url": "https://www.dixondrums.com/products/cymbal-stand"},
        ]
    },
    "encore": {
        "brand": "Encore",
        "products": [
            {"name": "E99 Electric Guitar Pack", "category": "Electric Guitar Packs", "url": "https://www.encoremusicalinstruments.com/products/e99"},
            {"name": "E375 Electric Guitar", "category": "Electric Guitars", "url": "https://www.encoremusicalinstruments.com/products/e375"},
            {"name": "E6 Acoustic Guitar", "category": "Acoustic Guitars", "url": "https://www.encoremusicalinstruments.com/products/e6"},
            {"name": "E4 4-String Bass", "category": "Bass Guitars", "url": "https://www.encoremusicalinstruments.com/products/e4-bass"},
            {"name": "EBP-4 Bass Guitar Pack", "category": "Bass Packs", "url": "https://www.encoremusicalinstruments.com/products/ebp-4"},
            {"name": "U2 Ukulele", "category": "Ukuleles", "url": "https://www.encoremusicalinstruments.com/products/u2-ukulele"},
        ]
    },
    "hiwatt": {
        "brand": "Hiwatt",
        "products": [
            {"name": "DR103", "category": "Guitar Amplifiers", "url": "https://www.hiwatt.com/amplifiers/dr103"},
            {"name": "DR504", "category": "Guitar Amplifiers", "url": "https://www.hiwatt.com/amplifiers/dr504"},
            {"name": "SA212", "category": "Guitar Amplifiers", "url": "https://www.hiwatt.com/amplifiers/sa212"},
            {"name": "T20", "category": "Guitar Amplifiers", "url": "https://www.hiwatt.com/amplifiers/t20"},
            {"name": "Little J", "category": "Guitar Amplifiers", "url": "https://www.hiwatt.com/amplifiers/little-j"},
            {"name": "HG100", "category": "Bass Amplifiers", "url": "https://www.hiwatt.com/amplifiers/hg100"},
            {"name": "SE4123", "category": "Guitar Cabinets", "url": "https://www.hiwatt.com/cabinets/se4123"},
        ]
    }
}

async def create_manual_catalogs():
    """Create brand catalogs from manual product lists."""
    logger.info("="*70)
    logger.info("🛠️  CREATING MANUAL CATALOGS FOR ZERO-PRODUCT BRANDS")
    logger.info("="*70 + "\n")
    
    CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)
    
    for brand_id, data in MANUAL_PRODUCTS.items():
        catalog = {
            "brand_id": brand_id,
            "brand": data["brand"],
            "scraping_strategy": "manual_list",
            "products": data["products"],
            "product_count": len(data["products"]),
            "scraped_count": len(data["products"]),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        output_file = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
        with open(output_file, 'w') as f:
            json.dump(catalog, f, indent=2)
        
        logger.info(f"✅ {brand_id:30} │ {len(data['products']):3} products (manual)")
    
    logger.info("\n" + "="*70)
    logger.info("✅ MANUAL CATALOGS CREATED")
    logger.info("="*70)

if __name__ == "__main__":
    asyncio.run(create_manual_catalogs())
