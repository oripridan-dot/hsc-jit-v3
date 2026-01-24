import json
import os
import re
from pathlib import Path

def normalize_sku(sku):
    if not sku:
        return ""
    return re.sub(r'[^a-zA-Z0-9]', '', str(sku)).lower()

def extract_sku_from_id(product_id):
    # expect format like roland_87_td513
    # remove brand prefix
    parts = product_id.replace('roland_', '').replace('roland-', '')
    return normalize_sku(parts)

def update_catalog():
    # Paths
    public_path = Path("frontend/public/data/roland.json")
    commercial_path = Path("backend/data/blueprints/roland_commercial.json")
    output_path = Path("backend/data/vault/catalogs_brand/roland.json")
    
    # Ensure output dir exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Loading public data from {public_path}...")
    try:
        with open(public_path, "r", encoding="utf-8") as f:
            public_data = json.load(f)
    except FileNotFoundError:
        print("Public data not found. Creating fresh structure.")
        public_data = {
            "brand_identity": {
                "id": "roland",
                "name": "Roland",
                "logo_url": "https://static.roland.com/assets/images/logo_roland.svg"
            },
            "products": []
        }

    print(f"Loading commercial data from {commercial_path}...")
    with open(commercial_path, "r", encoding="utf-8") as f:
        commercial_data = json.load(f)
    
    # Index commercial data
    commercial_map = {}
    for p in commercial_data:
        # Key by SKU if possible
        sku = p.get('sku') or p.get('halilit_id')
        if sku:
            norm_sku = normalize_sku(sku)
            commercial_map[norm_sku] = p
        
        # Also key by exact name for fallback
        if p.get('name'):
            commercial_map[p.get('name')] = p

    print(f"Indexed {len(commercial_data)} commercial products.")

    # Update existing products
    matched_count = 0
    existing_skus = set()
    
    if "products" not in public_data:
        public_data["products"] = []

    for product in public_data["products"]:
        # Try to match
        match = None
        
        # 1. Try by extracting SKU from ID
        product_id = product.get('id', '')
        extracted_sku = extract_sku_from_id(product_id)
        if extracted_sku in commercial_map:
            match = commercial_map[extracted_sku]
        
        # 2. Try by Name
        if not match and product.get('name') in commercial_map:
             match = commercial_map[product.get('name')]

        if match:
            matched_count += 1
            # Update pricing
            product['pricing'] = match.get('pricing', {})
            # Update URL if missing
            if not product.get('halilit_url'):
                product['halilit_url'] = match.get('url')
            
            # Update Image if missing or generic
            if not product.get('image_url') and match.get('image'):
                 product['image_url'] = match.get('image')

            existing_skus.add(extracted_sku)

    print(f"Updated prices for {matched_count} existing products.")

    # Add new products that were not in public catalog
    added_count = 0
    for p in commercial_data:
        sku = p.get('sku') or p.get('halilit_id')
        norm_sku = normalize_sku(sku)
        
        if norm_sku not in existing_skus:
            # Create new product record
            new_product = {
                "id": f"roland_{normalize_sku(p.get('halilit_id', 'new'))}",
                "name": p.get('name'),
                "brand": "roland",
                "category": p.get('category', 'uncategorized'),
                "image_url": p.get('image'),
                "description": p.get('description'),
                "pricing": p.get('pricing', {}),
                "halilit_id": p.get('halilit_id'),
                "halilit_url": p.get('url')
            }
            public_data["products"].append(new_product)
            added_count += 1
            existing_skus.add(norm_sku)

    print(f"Added {added_count} new products from commercial data.")

    # Save to vault
    print(f"Saving merged catalog to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(public_data, f, indent=2, ensure_ascii=False)

    print("Success. Now run forge_backbone.py to propagate.")

if __name__ == "__main__":
    update_catalog()
