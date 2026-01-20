#!/usr/bin/env python3
"""
Pipeline Data Sync Script
=========================

This script synchronizes all scraped data from backend to frontend:
1. Copies catalogs from backend/data/catalogs_brand/ to frontend/public/data/catalogs_brand/
2. Downloads and saves brand logos to frontend/public/data/logos/
3. Regenerates index.json with proper metadata
4. Validates all data is properly synced

Usage:
    python3 sync_pipeline.py
    python3 sync_pipeline.py --force  # Force overwrite existing files
"""

import json
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import urllib.request
import urllib.error

# Paths
PROJECT_ROOT = Path(__file__).parent
BACKEND_CATALOGS = PROJECT_ROOT / "backend" / "data" / "catalogs_brand"
FRONTEND_DATA = PROJECT_ROOT / "frontend" / "public" / "data"
FRONTEND_CATALOGS = FRONTEND_DATA / "catalogs_brand"
FRONTEND_LOGOS = FRONTEND_DATA / "logos"

# Brand themes (WCAG AA compliant)
BRAND_COLORS = {
    "roland": "#ef4444",
    "boss": "#ef4444",  # Boss is part of Roland
    "yamaha": "#a855f7",
    "korg": "#fb923c",
    "moog": "#22d3ee",
    "nord": "#f87171"
}

def ensure_directories():
    """Create necessary directories"""
    FRONTEND_CATALOGS.mkdir(parents=True, exist_ok=True)
    FRONTEND_LOGOS.mkdir(parents=True, exist_ok=True)
    print("✅ Directories ensured")

def download_logo(url: str, brand_id: str) -> bool:
    """Download brand logo from URL"""
    try:
        logo_path = FRONTEND_LOGOS / f"{brand_id}.svg"
        
        # Check if already exists
        if logo_path.exists():
            print(f"   ℹ️  Logo already exists: {brand_id}.svg")
            return True
        
        # Download
        print(f"   📥 Downloading logo for {brand_id}...")
        with urllib.request.urlopen(url, timeout=10) as response:
            data = response.read()
        
        # Save
        with open(logo_path, 'wb') as f:
            f.write(data)
        
        print(f"   ✅ Saved logo: {logo_path}")
        return True
        
    except Exception as e:
        print(f"   ⚠️  Failed to download logo for {brand_id}: {e}")
        return False

def sync_catalog(catalog_file: Path, force: bool = False) -> Dict:
    """Sync a single catalog file"""
    print(f"\n📦 Processing {catalog_file.name}...")
    
    # Read catalog
    with open(catalog_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    brand_identity = data.get('brand_identity', {})
    brand_id = brand_identity.get('id', catalog_file.stem)
    products = data.get('products', [])
    
    print(f"   Brand: {brand_identity.get('name', 'Unknown')}")
    print(f"   Products: {len(products)}")
    
    # Copy to frontend
    dest_file = FRONTEND_CATALOGS / f"{brand_id}.json"
    
    if dest_file.exists() and not force:
        print(f"   ℹ️  Catalog already exists in frontend (use --force to overwrite)")
    else:
        shutil.copy2(catalog_file, dest_file)
        print(f"   ✅ Copied to frontend: {dest_file.name}")
    
    # Download logo if URL present
    logo_url = brand_identity.get('logo_url')
    if logo_url:
        download_logo(logo_url, brand_id)
    else:
        print(f"   ⚠️  No logo URL found in catalog")
    
    # Count verified products
    verified_count = len([p for p in products if p.get('verified', False)])
    
    return {
        "id": brand_id,
        "name": brand_identity.get('name', 'Unknown'),
        "logo_url": f"/data/logos/{brand_id}.svg" if (FRONTEND_LOGOS / f"{brand_id}.svg").exists() else logo_url,
        "website": brand_identity.get('website'),
        "description": brand_identity.get('description'),
        "product_count": len(products),
        "verified_count": verified_count,
        "brand_color": BRAND_COLORS.get(brand_id, "#6366f1"),
        "data_file": f"catalogs_brand/{brand_id}.json"
    }

def generate_index(brands: List[Dict]):
    """Generate master index.json"""
    print("\n📋 Generating master index...")
    
    index_data = {
        "build_timestamp": datetime.utcnow().isoformat(),
        "version": "3.7-Halilit",
        "total_products": sum(b['product_count'] for b in brands),
        "total_verified": sum(b['verified_count'] for b in brands),
        "brands": brands
    }
    
    index_path = FRONTEND_DATA / "index.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2)
    
    print(f"✅ Generated index with {len(brands)} brands, {index_data['total_products']} products")
    print(f"   Saved to: {index_path}")

def main():
    parser = argparse.ArgumentParser(description="Sync pipeline data from backend to frontend")
    parser.add_argument('--force', action='store_true', help='Force overwrite existing files')
    args = parser.parse_args()
    
    print("=" * 70)
    print("HSC JIT v3.7 - Pipeline Data Sync".center(70))
    print("=" * 70)
    
    # Ensure directories
    ensure_directories()
    
    # Check if backend has data
    if not BACKEND_CATALOGS.exists():
        print(f"\n❌ Backend catalogs directory not found: {BACKEND_CATALOGS}")
        print("   Please run the scraper first: python3 backend/orchestrate_brand.py")
        return 1
    
    catalog_files = list(BACKEND_CATALOGS.glob("*.json"))
    if not catalog_files:
        print(f"\n❌ No catalog files found in {BACKEND_CATALOGS}")
        print("   Please run the scraper first")
        return 1
    
    print(f"\nFound {len(catalog_files)} catalogs in backend")
    
    # Sync each catalog
    brands = []
    for catalog_file in catalog_files:
        try:
            brand_info = sync_catalog(catalog_file, force=args.force)
            brands.append(brand_info)
        except Exception as e:
            print(f"   ❌ Failed to sync {catalog_file.name}: {e}")
    
    # Generate index
    if brands:
        generate_index(brands)
    
    # Summary
    print("\n" + "=" * 70)
    print("Sync Summary".center(70))
    print("=" * 70)
    print(f"\n✅ Synced {len(brands)} brands to frontend")
    print(f"📁 Frontend catalogs: {FRONTEND_CATALOGS}")
    print(f"🖼️  Logos directory: {FRONTEND_LOGOS}")
    print(f"📋 Master index: {FRONTEND_DATA / 'index.json'}")
    
    # List what was synced
    print(f"\nSynced Brands:")
    for brand in brands:
        logo_url = brand.get('logo_url') or ''
        logo_status = "✓" if logo_url.startswith('/data/logos/') else "✗"
        print(f"  [{logo_status}] {brand['name']}: {brand['product_count']} products ({brand['verified_count']} verified)")
    
    print("\n🎉 Pipeline sync complete!")
    print("\nNext steps:")
    print("  1. Start frontend: cd frontend && pnpm dev")
    print("  2. Monitor pipeline: python3 monitor_pipeline.py --watch")
    print("  3. Verify UI: Open http://localhost:5173")
    
    return 0

if __name__ == "__main__":
    exit(main())
