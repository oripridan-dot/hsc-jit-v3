import sys
import os
import argparse
import traceback

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.halilit_brand_registry import HalilitBrandRegistry
from services.halilit_direct_scraper import HalilitDirectScraper
from services.super_explorer import SuperExplorer
from services.genesis_builder import GenesisBuilder
from config.brand_maps import BRAND_MAPS

def run_brand_scrape(target_slug):
    print(f"\n🎯 TARGET LOCKED: {target_slug.upper()}")
    
    # 1. Get Official URL from Registry
    registry = HalilitBrandRegistry()
    roster = registry.fetch_official_roster()
    
    brand_node = next((b for b in roster if b['slug'] == target_slug), None)
    
    if not brand_node:
        print(f"❌ Brand '{target_slug}' not found in Halilit Registry.")
        # Manual fallback if registry fails or brand is hidden
        halilit_url = f"https://www.halilit.com/brand/{target_slug}"
        print(f"   ⚠️  Attempting manual URL: {halilit_url}")
    else:
        halilit_url = brand_node['halilit_url']
        print(f"   ✅ Found in Registry: {halilit_url}")

    # Initialize Services
    direct_scraper = HalilitDirectScraper()
    deep_explorer = SuperExplorer()
    
    try:
        # STEP 1: COMMERCIAL DATA (Halilit)
        print("\n💰 STEP 1: EXTRACTING COMMERCIAL DATA (Halilit Direct)")
        direct_scraper.scrape_brand(target_slug, halilit_url)
        
        # STEP 2: GLOBAL CONTENT (Brand Site)
        if target_slug in BRAND_MAPS:
            print("\n🌍 STEP 2: EXTRACTING GLOBAL CONTENT (Deep Scraper)")
            deep_explorer.scan_brand(target_slug)
        else:
            print("\n⏭️  STEP 2: Skipping Global Content (No Deep Scraper Map)")

        # STEP 3: MERGE & BUILD
        print("\n🧬 STEP 3: GENESIS MERGE PROTOCOL")
        builder = GenesisBuilder(target_slug)
        builder.construct()
        
        print(f"\n✨ SUCCESS: Full cycle complete for {target_slug}")
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        brand = sys.argv[1]
    else:
        brand = "roland"
        
    run_brand_scrape(brand)
