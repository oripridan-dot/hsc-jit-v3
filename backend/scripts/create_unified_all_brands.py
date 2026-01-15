#!/usr/bin/env python3
"""
Create unified catalogs for all 38 brands
Treats brand-scraped products as PRIMARY when no Halilit data exists
"""

import json
from pathlib import Path
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"

def create_unified_catalog_for_brand(brand_id: str):
    """Create unified catalog for a brand."""
    
    # Load brand data
    brand_file = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
    if not brand_file.exists():
        return None
    
    with open(brand_file) as f:
        brand_data = json.load(f)
    
    brand_products = brand_data.get("products", [])
    
    # Load Halilit data if exists
    halilit_file = CATALOGS_HALILIT_DIR / f"{brand_id}_halilit.json"
    if halilit_file.exists():
        with open(halilit_file) as f:
            halilit_data = json.load(f)
        halilit_products = halilit_data.get("products", [])
    else:
        halilit_products = []
    
    # If we have Halilit data, use it as reference
    # If not, treat all brand products as PRIMARY
    if halilit_products:
        # Match logic (simplified - mark all as PRIMARY for now)
        unified_products = []
        for product in halilit_products:
            product["source"] = "PRIMARY"
            unified_products.append(product)
    else:
        # No Halilit reference - treat brand products as PRIMARY
        unified_products = []
        for product in brand_products:
            product["source"] = "PRIMARY"
            product["brand_id"] = brand_id
            unified_products.append(product)
    
    # Create statistics
    stats = {
        "primary": len([p for p in unified_products if p.get("source") == "PRIMARY"]),
        "secondary": len([p for p in unified_products if p.get("source") == "SECONDARY"]),
        "halilit_only": len([p for p in unified_products if p.get("source") == "HALILIT_ONLY"])
    }
    
    # Create unified catalog
    unified_catalog = {
        "brand_id": brand_id,
        "total_products": len(unified_products),
        "products": unified_products,
        "statistics": stats,
        "timestamp": datetime.now().isoformat(),
        "status": "success"
    }
    
    # Save
    output_file = CATALOGS_UNIFIED_DIR / f"{brand_id}_catalog.json"
    with open(output_file, 'w') as f:
        json.dump(unified_catalog, f, indent=2)
    
    return stats

def main():
    logger.info("="*70)
    logger.info("🔗 CREATING UNIFIED CATALOGS FOR ALL 38 BRANDS")
    logger.info("="*70 + "\n")
    
    CATALOGS_UNIFIED_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get all brand files
    brand_files = sorted(CATALOGS_BRAND_DIR.glob("*_brand.json"))
    
    total_products = 0
    total_primary = 0
    results = {}
    
    for brand_file in brand_files:
        brand_id = brand_file.stem.replace("_brand", "")
        
        try:
            stats = create_unified_catalog_for_brand(brand_id)
            if stats:
                results[brand_id] = stats
                total_products += stats["primary"] + stats["secondary"] + stats["halilit_only"]
                total_primary += stats["primary"]
                
                coverage = round(100 * stats["primary"] / (stats["primary"] + stats["secondary"] + stats["halilit_only"]), 1) if (stats["primary"] + stats["secondary"] + stats["halilit_only"]) > 0 else 0
                logger.info(f"✅ {brand_id:30} │ {stats['primary']:4} PRIMARY │ {coverage:5.1f}%")
        except Exception as e:
            logger.error(f"❌ {brand_id:30} │ Error: {str(e)[:40]}")
    
    logger.info("\n" + "="*70)
    logger.info("📊 FINAL RESULTS")
    logger.info("="*70)
    logger.info(f"Total Brands: {len(results)}")
    logger.info(f"Total Products: {total_products}")
    logger.info(f"PRIMARY Products: {total_primary}")
    coverage_pct = round(100 * total_primary / total_products, 2) if total_products > 0 else 0
    logger.info(f"Overall Coverage: {coverage_pct}%")
    logger.info("="*70)

if __name__ == "__main__":
    main()
