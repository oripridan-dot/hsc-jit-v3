#!/usr/bin/env python3
"""
Fix logo URLs in all catalog files.
Updates brand_identity.logo_url to use local static files or external URLs where available.
"""
import json
import os
from pathlib import Path

def main():
    catalogs_dir = Path("/workspaces/hsc-jit-v3/backend/data/catalogs")
    logo_dir = Path("/workspaces/hsc-jit-v3/backend/app/static/assets/brands")
    
    # Get existing local logos (without extension)
    existing_logos = {}
    for f in logo_dir.glob("*"):
        if f.is_file() and f.suffix in ['.png', '.svg', '.jpg', '.webp']:
            brand_id = f.stem
            existing_logos[brand_id] = f"/static/assets/brands/{f.name}"
    
    print(f"Found {len(existing_logos)} local logo files: {list(existing_logos.keys())}")
    
    updated_count = 0
    for catalog_file in sorted(catalogs_dir.glob("*_catalog.json")):
        try:
            with open(catalog_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if 'brand_identity' not in data:
                continue
            
            brand_id = data['brand_identity'].get('id')
            if not brand_id:
                continue
            
            current_logo = data['brand_identity'].get('logo_url', '')
            
            # If logo_url is empty or missing, try to set it
            if not current_logo or current_logo.strip() == '':
                if brand_id in existing_logos:
                    # Use local static file
                    data['brand_identity']['logo_url'] = existing_logos[brand_id]
                    print(f"✓ {brand_id}: Set to local logo {existing_logos[brand_id]}")
                else:
                    # For now, leave it empty - SmartImage will show fallback
                    data['brand_identity']['logo_url'] = ''
                    print(f"  {brand_id}: No logo available (will use fallback)")
                
                # Write back to file
                with open(catalog_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                updated_count += 1
            elif current_logo.startswith('http'):
                # Keep external URLs
                print(f"  {brand_id}: Keeping external URL")
            else:
                print(f"  {brand_id}: Already has logo: {current_logo}")
        
        except Exception as e:
            print(f"❌ Error processing {catalog_file.name}: {e}")
    
    print(f"\n✅ Updated {updated_count} catalog files")
    print(f"Brands with local logos: {len(existing_logos)}")

if __name__ == '__main__':
    main()
