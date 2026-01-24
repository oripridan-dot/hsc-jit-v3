import time
import sys
import traceback
from services.halilit_brand_registry import HalilitBrandRegistry
from services.super_explorer import SuperExplorer
from services.halilit_direct_scraper import HalilitDirectScraper
from services.genesis_builder import GenesisBuilder
from config.brand_maps import BRAND_MAPS
from forge_backbone import HalilitCatalog

def execute_full_catalog_skeleton():
    print("\n" + "="*60)
    print("💀 INITIATING FULL CATALOG SKELETON EXECUTION")
    print("="*60 + "\n")

    # PHASE 1: REGISTRY SYNC (The "Bible" Check)
    try:
        registry = HalilitBrandRegistry()
        official_roster = registry.fetch_official_roster()
        registry.sync_logos(official_roster)
    except Exception as e:
        print(f"❌ CRITICAL: Failed to sync registry. Aborting. {e}")
        return

    explorer = SuperExplorer()
    halilit_scraper = HalilitDirectScraper()
    
    total = len(official_roster)
    failed_brands = []
    
    for idx, brand_node in enumerate(official_roster):
        slug = brand_node['slug']
        name = brand_node['name']
        halilit_url = brand_node['halilit_url']
        print(f"\n[{idx+1}/{total}] Processing Sector: {name.upper()}")

        try:
            # 1. COMMERCIAL LAYER: Run Halilit Direct Scraper (ALWAYS)
            if halilit_url:
                 print("  🛒 extracting commercial data (Halilit)...")
                 halilit_scraper.scrape_brand(slug, halilit_url)
            else:
                 print("  ⚠️  No Halilit URL - Commercial data will be missing.")

            # 2. CONTENT LAYER: Run Deep Scraper (If Available)
            if slug in BRAND_MAPS:
                print("  🌍 extracting global content (Official Brand)...")
                explorer.scan_brand(slug)
            else:
                print("  ℹ️  No Deep Scraper map - relying on local content only.")
            
            # 3. GENESIS: Build & Merge
            builder = GenesisBuilder(slug)
            builder.construct()

        except Exception as e:
            print(f"     ❌ ERROR Processing {slug}: {e}")
            traceback.print_exc()
            failed_brands.append(slug)

    print("\n" + "="*60)
    print("✨ SKELETON EXECUTION COMPLETE")
    if failed_brands:
        print(f"⚠️  Failures: {failed_brands}")
    print("   The app is now synced with the Halilit Registry.")
    print("="*60)
    
    # PHASE 2: FORGE BACKBONE (Refinement & Deployment)
    print("\n" + "="*60)
    print("🔨 INITIATING BACKBONE FORGE (Static Compilation)")
    print("="*60 + "\n")
    
    try:
        catalog = HalilitCatalog()
        catalog.build()
        print("\n✅ PROCESS COMPLETE: Scrape -> Skeleton -> Vault -> Forge -> Frontend")
    except Exception as e:
        print(f"\n❌ BACKBONE FAILURE: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    execute_full_catalog_skeleton()
