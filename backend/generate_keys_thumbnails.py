#!/usr/bin/env python3
"""
Generate Keys & Pianos Category Thumbnails

Focused test script for the "keys" category only.
Once refined, the approach will be applied to all categories.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from services.visual_factory import VisualFactory

# Keys & Pianos subcategories with matching keywords
KEYS_SUBCATEGORIES = {
    "synths": {
        "keywords": ["synth", "synthesizer", "lead", "wave", "analog", "modular", "jupiter", "juno"],
        "priority_brands": ["roland", "moog", "nord"],
    },
    "stage-pianos": {
        "keywords": ["stage", "piano", "electro", "grand", "rd-", "fp-", "nord stage"],
        "priority_brands": ["nord", "roland"],
    },
    "controllers": {
        "keywords": ["controller", "midi", "a-88", "a-49", "mpk", "launchpad", "mkii"],
        "priority_brands": ["roland", "akai"],
    },
    "arrangers": {
        "keywords": ["arranger", "e-x", "bk-", "e-x50", "e-a7"],
        "priority_brands": ["roland"],
    },
    "organs": {
        "keywords": ["organ", "combo", "vk-", "c3", "nord c"],
        "priority_brands": ["nord"],
    },
    "workstations": {
        "keywords": ["workstation", "fantom", "montage", "kronos", "motif"],
        "priority_brands": ["roland"],
    },
}


def load_products() -> List[Dict]:
    """Load all products from original scraped catalogs."""
    scraped_data = Path(__file__).parent.parent / "data" / "catalogs_brand"
    all_products = []
    
    for catalog_file in scraped_data.glob("*.json"):
        try:
            with open(catalog_file, "r") as f:
                data = json.load(f)
                products = data.get("products", [])
                for p in products:
                    p["_source_brand"] = catalog_file.stem
                all_products.extend(products)
                print(f"📦 Loaded {len(products)} from {catalog_file.stem}")
        except Exception as e:
            print(f"⚠️ Error loading {catalog_file}: {e}")
    
    return all_products


def get_http_image_url(product: Dict) -> Optional[str]:
    """Extract HTTP image URL from product."""
    # Check images array
    images = product.get("images", [])
    if isinstance(images, list):
        # Prefer 'main' type
        for img in images:
            if img.get("type") == "main" and img.get("url", "").startswith("http"):
                return img["url"]
        # Fallback to first HTTP URL
        for img in images:
            if img.get("url", "").startswith("http"):
                return img["url"]
    
    # Try direct fields
    for field in ["image_url", "image"]:
        url = product.get(field, "")
        if url and url.startswith("http"):
            return url
    
    return None


def score_product(product: Dict, keywords: List[str], priority_brands: List[str]) -> int:
    """Score a product based on keyword and brand matches."""
    name = (product.get("name") or "").lower()
    category = (product.get("main_category") or product.get("category") or "").lower()
    subcategory = (product.get("subcategory") or "").lower()
    description = (product.get("description") or "").lower()
    brand = (product.get("brand") or product.get("_source_brand") or "").lower()
    
    search_text = f"{name} {category} {subcategory} {description}"
    
    score = 0
    
    # Keyword matches
    for keyword in keywords:
        kw = keyword.lower()
        if kw in search_text:
            score += 10
            # Bonus for name match
            if kw in name:
                score += 15
    
    # Brand priority bonus
    for i, pb in enumerate(priority_brands):
        if pb.lower() in brand:
            score += 20 - (i * 5)  # Higher priority = more points
            break
    
    return score


def find_best_product(products: List[Dict], subcategory_id: str, config: Dict) -> Optional[Dict]:
    """Find the best product for a subcategory."""
    keywords = config["keywords"]
    priority_brands = config.get("priority_brands", [])
    
    candidates = []
    
    for product in products:
        # Must have HTTP image URL
        image_url = get_http_image_url(product)
        if not image_url:
            continue
        
        score = score_product(product, keywords, priority_brands)
        if score > 0:
            candidates.append((score, product, image_url))
    
    # Sort by score (highest first)
    candidates.sort(key=lambda x: -x[0])
    
    if candidates:
        print(f"\n   Top 3 candidates for {subcategory_id}:")
        for i, (score, p, url) in enumerate(candidates[:3]):
            print(f"      {i+1}. [{score}pts] {p.get('name', '?')[:35]}")
        return candidates[0][1], candidates[0][2]
    
    return None, None


def main():
    print("🎹 Keys & Pianos Thumbnail Generator")
    print("=" * 50)
    
    # Output directory
    output_dir = Path(__file__).parent.parent / "frontend" / "public" / "data" / "category_thumbnails"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load products
    products = load_products()
    print(f"\nTotal: {len(products)} products with HTTP images")
    
    # Count products with HTTP URLs
    with_urls = [p for p in products if get_http_image_url(p)]
    print(f"Products with HTTP URLs: {len(with_urls)}")
    
    # Initialize VisualFactory
    vf = VisualFactory()
    
    # Process each subcategory
    results = {}
    
    print("\n🎹 KEYS & PIANOS")
    print("-" * 40)
    
    for subcategory_id, config in KEYS_SUBCATEGORIES.items():
        print(f"\n📌 {subcategory_id.upper()}")
        print(f"   Keywords: {', '.join(config['keywords'][:5])}...")
        
        product, image_url = find_best_product(products, subcategory_id, config)
        
        if not product:
            print(f"   ❌ No matching product found")
            continue
        
        print(f"\n   ✓ Selected: {product.get('name', '?')}")
        print(f"   URL: {image_url[:70]}...")
        
        # Process through VisualFactory
        output_base = output_dir / f"keys-{subcategory_id}"
        
        try:
            result = vf.process_product_asset(
                image_url=image_url,
                output_path_base=str(output_base),
                force_reprocess=True
            )
            
            if result:
                thumb_path = f"/data/category_thumbnails/keys-{subcategory_id}_thumb.webp"
                results[subcategory_id] = {
                    "product_id": product.get("id"),
                    "product_name": product.get("name"),
                    "brand": product.get("brand") or product.get("_source_brand"),
                    "source_url": image_url,
                    "thumbnail": thumb_path,
                }
                print(f"   ✅ Thumbnail generated: {thumb_path}")
            else:
                print(f"   ❌ VisualFactory returned None")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Save mapping
    mapping_file = output_dir / "_keys_mapping.json"
    with open(mapping_file, "w") as f:
        json.dump({"keys": results}, f, indent=2)
    
    print(f"\n{'=' * 50}")
    print(f"✨ KEYS & PIANOS COMPLETE")
    print(f"   Generated: {len(results)}/{len(KEYS_SUBCATEGORIES)} thumbnails")
    print(f"   Mapping: {mapping_file}")
    
    # Show generated files
    print(f"\n📁 Generated files:")
    for f in sorted(output_dir.glob("keys-*_thumb.webp")):
        print(f"   - {f.name}")


if __name__ == "__main__":
    main()
