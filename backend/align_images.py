#!/usr/bin/env python3
"""
Align Images Script
Synchronizes image URLs in JSON catalogs with actual files on disk.
This ensures that every product in the JSON points to a real image file that exists.
"""

import json
import os
from pathlib import Path

# Configuration
DATA_DIR = Path("../frontend/public/data")
IMG_DIR = DATA_DIR / "product_images"

def sync_catalog(brand_name: str) -> None:
    """
    Sync a brand's catalog JSON with actual image files on disk.
    Uses a round-robin assignment if there are more products than images.
    """
    json_path = DATA_DIR / f"{brand_name}.json"
    brand_img_dir = IMG_DIR / brand_name
    
    # Validate paths exist
    if not json_path.exists():
        print(f"⚠️  Skipping {brand_name} - JSON file not found: {json_path}")
        return
    
    if not brand_img_dir.exists():
        print(f"⚠️  Skipping {brand_name} - Image directory not found: {brand_img_dir}")
        return
    
    # Load the catalog
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get list of actual thumbnail files
    files = sorted([f.name for f in brand_img_dir.glob("*_thumb.webp")])
    
    if not files:
        print(f"⚠️  {brand_name} - No thumbnail images found in {brand_img_dir}")
        return
    
    products = data.get('products', [])
    print(f"🔄 Syncing {brand_name}: {len(files)} images → {len(products)} products")
    
    # Assign real files to products (round-robin if needed)
    for i, product in enumerate(products):
        if files:
            # Round-robin: assign files cyclically across products
            assigned_file = files[i % len(files)]
            
            # Construct the web-accessible path (as served from frontend/public)
            web_path = f"/data/product_images/{brand_name}/{assigned_file}"
            
            # Update product image references
            product['image_url'] = web_path
            
            # Ensure images object exists
            if 'images' not in product:
                product['images'] = {}
            
            # Set all image variants to the same base file
            product['images']['thumbnail'] = web_path
            product['images']['main'] = web_path
            
            # Handle high_res variant (swap _thumb with _main if it exists)
            main_variant = assigned_file.replace('_thumb.webp', '_main.webp')
            main_path = brand_img_dir / main_variant
            if main_path.exists():
                product['images']['high_res'] = f"/data/product_images/{brand_name}/{main_variant}"
            else:
                product['images']['high_res'] = web_path
            
            product['images']['original'] = web_path
    
    # Write updated catalog back to disk
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Updated {brand_name}.json with {len(products)} product image references")

def main() -> None:
    """Main entry point: sync all available brand catalogs."""
    print("=" * 70)
    print("HALILIT IMAGE ALIGNMENT TOOL")
    print("Syncing JSON catalogs with actual image files on disk")
    print("=" * 70)
    print()
    
    # Find all brand JSON files
    brand_files = sorted([f.stem for f in DATA_DIR.glob("*.json") if f.stem != "index"])
    
    if not brand_files:
        print("❌ No brand catalog files found in", DATA_DIR)
        return
    
    print(f"Found {len(brand_files)} brand catalogs: {', '.join(brand_files)}\n")
    
    # Sync each brand
    for brand in brand_files:
        sync_catalog(brand)
    
    print()
    print("=" * 70)
    print("✅ Image alignment complete!")
    print("=" * 70)

if __name__ == "__main__":
    main()
