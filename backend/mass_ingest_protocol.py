import time
from services.halilit_brand_registry import HalilitBrandRegistry
from services.super_explorer import SuperExplorer
from services.halilit_direct_scraper import HalilitDirectScraper
from services.genesis_builder import GenesisBuilder
from config.brand_maps import BRAND_MAPS

def execute_full_catalog_skeleton():
    print("\n" + "="*60)
    print("💀 INITIATING FULL CATALOG SKELETON EXECUTION")
    print("="*60 + "\n")

    # PHASE 1: REGISTRY SYNC (The "Bible" Check)
    registry = HalilitBrandRegistry()
    official_roster = registry.fetch_official_roster()
    registry.sync_logos(official_roster)

    explorer = SuperExplorer()
    halilit_scraper = HalilitDirectScraper()
    
    total = len(official_roster)
    
    for idx, brand_node in enumerate(official_roster):
        slug = brand_node['slug']
        name = brand_node['name']
        halilit_url = brand_node['halilit_url']
        print(f"\n[{idx+1}/{total}] Processing Sector: {name.upper()}")

        # Check if we have a deep-scraper map for this brand
        blueprint_path = None
        used_deep_scraper = False
        
        if slug in BRAND_MAPS:
            print("  Example: Deep Scraper Available. Engaging SuperExplorer...")
            # 1. Map the global site
            blueprint_path = explorer.scan_brand(slug)
            
            # Validation: Check if blueprint has data
            has_data = False
            if blueprint_path:
                try:
                    import json
                    with open(blueprint_path, 'r') as f:
                        data = json.load(f)
                        if data and len(data) > 0:
                            has_data = True
                except:
                    pass
            
            if has_data:
                used_deep_scraper = True
                # 2. Build the full skeleton
                builder = GenesisBuilder(slug)
                builder.construct()
            else:
                 print("  ⚠️  Deep Scraper yielded 0 results. Falling back to Halilit Direct...")

        if not used_deep_scraper:
            if not slug in BRAND_MAPS:
                 print("  ⚠️  No Deep Map. Engaging Halilit-Only Ingestion...")
            
            # Fallback: Scrape Halilit brand page directly
            if halilit_url:
                blueprint_path = halilit_scraper.scrape_brand(slug, halilit_url)
                if blueprint_path:
                     # Build skeleton from this direct blueprint
                     builder = GenesisBuilder(slug)
                     builder.construct()
            else:
                print("     ❌ No Halilit URL available for this brand.")

    print("\n" + "="*60)
    print("✨ SKELETON EXECUTION COMPLETE")
    print("   The app is now synced with the Halilit Registry.")
    print("="*60)

if __name__ == "__main__":
    execute_full_catalog_skeleton()
