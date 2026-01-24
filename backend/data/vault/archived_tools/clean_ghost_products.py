#!/usr/bin/env python3
"""Clean ghost/placeholder products from catalogs"""
import json
from pathlib import Path

data_dir = Path('/workspaces/hsc-jit-v3/frontend/public/data')

for catalog_file in sorted(data_dir.glob("*.json")):
    if catalog_file.name in ['index.json', 'taxonomy.json']:
        continue
    
    try:
        with open(catalog_file, 'r') as f:
            data = json.load(f)
        
        if 'products' in data:
            original_count = len(data['products'])
            real_products = [
                p for p in data['products'] 
                if not any(marker in p.get('id', '').lower() for marker in 
                          ['ghost', 'placeholder', 'test_', 'tmp_', 'dummy_'])
            ]
            
            if len(real_products) < original_count:
                removed = original_count - len(real_products)
                print(f"{catalog_file.name}: Removed {removed} ghost products")
                data['products'] = real_products
                with open(catalog_file, 'w') as f:
                    json.dump(data, f, indent=2)
            else:
                print(f"{catalog_file.name}: OK ({original_count} real products)")
    
    except Exception as e:
        print(f"{catalog_file.name}: ERROR - {e}")

print("\nDone!")
