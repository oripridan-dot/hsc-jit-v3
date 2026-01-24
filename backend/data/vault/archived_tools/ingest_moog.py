from services.super_explorer import SuperExplorer
from services.genesis_builder import GenesisBuilder
import os
import json

def ingest_moog():
    print("🎹 Manually Ingesting MOOG...")
    
    slug = "moog"
    
    # 1. Run SuperExplorer (Deep Scraper)
    explorer = SuperExplorer()
    blueprint_path = explorer.scan_brand(slug)
    
    if blueprint_path:
        print(f"✅ Blueprint created: {blueprint_path}")
        
        # 2. Run GenesisBuilder
        builder = GenesisBuilder(slug)
        builder.construct()
        print("✅ Genesis Complete for Moog.")
        
    else:
        print("❌ SuperExplorer failed to create blueprint for Moog.")

if __name__ == "__main__":
    ingest_moog()
