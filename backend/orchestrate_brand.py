import argparse
import asyncio
import sys
import shutil
import json
import os
from pathlib import Path
from datetime import datetime

# Add backend to path so we can import modules
sys.path.append(str(Path(__file__).parent))

from core.config import settings
from services.hierarchy_scraper import HierarchyScraper
from services.roland_scraper import RolandScraper
from models.product_hierarchy import ProductCatalog


def clean_slate():
    """Wipe database directories for a fresh start"""
    print("🧹 Cleaning data directories...")
    # Use settings for directory paths
    dirs_to_clean = [
        settings.CATALOGS_DIR,
        settings.FRONTEND_DATA_DIR / "catalogs_brand"
    ]
    
    for d in dirs_to_clean:
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True, exist_ok=True)
    
    # Ensure frontend data dir exists
    settings.FRONTEND_DATA_DIR.mkdir(parents=True, exist_ok=True)
    print("✨ Clean slate prepared.")

def save_catalog(catalog: ProductCatalog, brand_id: str):
    """Save catalog to backend data store"""
    settings.CATALOGS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = settings.CATALOGS_DIR / f"{brand_id}_catalog.json"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(catalog.model_dump_json(indent=2))
    
    print(f"💾 Saved catalog to: {file_path}")
    return file_path

def sync_to_frontend(brand_id: str, catalog_path: Path):
    """Sync catalog to frontend and regenerate index"""
    print("🔄 Syncing to frontend...")
    
    frontend_catalogs_dir = settings.FRONTEND_DATA_DIR / "catalogs_brand"
    
    # 1. Copy Catalog
    frontend_catalogs_dir.mkdir(parents=True, exist_ok=True)
    dest_path = frontend_catalogs_dir / f"{brand_id}_catalog.json"
    shutil.copy2(catalog_path, dest_path)
    print(f"   -> Copied catalog to {dest_path}")
    
    # 2. Update/Regenerate Index
    index_path = settings.FRONTEND_DATA_DIR / "index.json"
    
    brands_index = []
    
    # Scan all catalogs in frontend dir to rebuild index (source of truth for frontend)
    for cat_file in frontend_catalogs_dir.glob("*_catalog.json"):
        try:
            with open(cat_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            brand_identity = data.get('brand_identity', {})
            stats = data.get('coverage_stats', {})
            total_products = data.get('total_products', 0)
            
            brands_index.append({
                "id": brand_identity.get('id'),
                "name": brand_identity.get('name'),
                "logo_url": brand_identity.get('logo_url'),
                "hq": brand_identity.get('headquarters'),
                "website": brand_identity.get('website'),
                "product_count": total_products,
                "description": brand_identity.get('description'),
                "brand_number": "001" if brand_identity.get('id') == 'roland' else "999", # Temporary sort fix
                "data_file": f"catalogs_brand/{cat_file.name}"  # Add data_file for frontend
            })
        except Exception as e:
            print(f"⚠️ Failed to index {cat_file}: {e}")
            
    index_data = {
        "last_updated": datetime.utcnow().isoformat(),
        "brands": brands_index
    }
    
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2)
        
    print(f"   -> Updated index at {index_path} with {len(brands_index)} brands")

async def main():
    parser = argparse.ArgumentParser(description="HSC-JIT V3.7 Brand Orchestrator")
    parser.add_argument("--brand", type=str, required=True, help="Brand name to process (e.g., 'roland')")
    parser.add_argument("--max-products", type=int, default=None, help="Max products to process (default: None/All)")
    parser.add_argument("--clean", action="store_true", help="Start with a fresh clean slate")
    
    args = parser.parse_args()
    
    if args.clean:
        clean_slate()
    
    print(f"🚀 Starting V3.7 Orchestration for: {args.brand}")
    if args.max_products:
        print(f"📦 Limit: {args.max_products} products")
    else:
        print("📦 Limit: ALL available products")
    
    try:
        if args.brand.lower() == 'roland':
            scraper = RolandScraper()
            catalog = await scraper.scrape_all_products(max_products=args.max_products)
        else:
            # Fallback to generic scraper
            print(f"ℹ️ Using generic scraper for {args.brand}")
            scraper = HierarchyScraper()
            catalog = await scraper.scrape_brand_with_hierarchy(args.brand, {}, max_products=args.max_products or 10)
        
        # Save and Sync
        saved_path = save_catalog(catalog, args.brand)
        sync_to_frontend(args.brand, saved_path)
        
        print("✅ Orchestration Complete!")
        
    except Exception as e:
        print(f"❌ Error during orchestration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
