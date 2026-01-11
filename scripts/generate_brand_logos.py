#!/usr/bin/env python3
"""
Create a logo availability manifest for the frontend.
Maps brand IDs to available logo sources (local files, fallback emoji, etc).
"""
import json
import os

def main():
    catalogs_dir = "/workspaces/hsc-jit-v3/backend/data/catalogs"
    logo_dir = "/workspaces/hsc-jit-v3/backend/app/static/assets/brands"
    
    os.makedirs(logo_dir, exist_ok=True)
    
    # Get existing local logos
    existing_logos = set(
        f.replace('.png', '').replace('.svg', '')
        for f in os.listdir(logo_dir) if os.path.isfile(os.path.join(logo_dir, f))
    )
    
    print(f"Found existing logos: {sorted(existing_logos)}")
    
    # Collect all brands and create manifest
    manifest = {}
    missing_count = 0
    
    for f in sorted(os.listdir(catalogs_dir)):
        if f.endswith('.json'):
            try:
                with open(os.path.join(catalogs_dir, f)) as fp:
                    data = json.load(fp)
                    if 'brand_identity' in data:
                        bi = data['brand_identity']
                        brand_id = bi.get('id')
                        
                        if brand_id:
                            if brand_id in existing_logos:
                                manifest[brand_id] = {
                                    'status': 'available',
                                    'source': 'local',
                                    'url': f'/static/assets/brands/{brand_id}.png'
                                }
                            else:
                                missing_count += 1
                                # Use brand name for fallback
                                brand_name = bi.get('name', brand_id)
                                manifest[brand_id] = {
                                    'status': 'fallback',
                                    'source': 'text_avatar',
                                    'label': brand_name,
                                    'note': 'Real logo needed - see docs/guides/LOGO_SOURCES.md'
                                }
            except Exception as e:
                print(f"Error processing {f}: {e}")
    
    # Save manifest
    manifest_path = os.path.join(logo_dir, 'manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\n✓ Logo manifest created: {len(manifest)} brands")
    print(f"  - Available: {sum(1 for v in manifest.values() if v['status'] == 'available')}")
    print(f"  - Fallback:  {missing_count}")
    print(f"\n✓ Saved to: {manifest_path}")
    print(f"\nNext: Use manual sources or batch download services")
    print(f"See: docs/guides/LOGO_SOURCES.md for brand logo sources")

if __name__ == '__main__':
    main()
