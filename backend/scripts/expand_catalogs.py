#!/usr/bin/env python3
"""
Expand catalogs to 20% industry coverage (~1600 products).

Strategy:
- Keep top brands (Roland, Nord, etc.) rich with diverse products
- Expand each brand proportionally to maintain realism
- Add model variants, accessories, and related products
"""

import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
CATALOGS_DIR = BASE_DIR / "data" / "catalogs"

# Expansion templates by category
EXPANSION_TEMPLATES = {
    "Electronic Drums": [
        "TD-{series} Compact",
        "TD-{series} Pro",
        "TD-{series} Mesh Head Kit",
        "V-{series} Portable Kit",
    ],
    "Synthesizer": [
        "{model} Analog Synthesizer",
        "{model} Digital Synthesizer",
        "{model} Workstation",
        "{model} Module",
    ],
    "Stage Keyboard": [
        "{model} 73-Key",
        "{model} 88-Key Hammer Action",
        "{model} Compact",
    ],
    "Microphone": [
        "{model} Large Diaphragm",
        "{model} Pencil",
        "{model} USB",
        "{model} Wireless",
    ],
    "Studio Monitor": [
        "{model} 5-inch",
        "{model} 7-inch",
        "{model} 8-inch",
        "{model} Sub",
    ],
    "Audio Interface": [
        "{model} 2x2",
        "{model} 4x4",
        "{model} 8x8",
    ],
    "Electric Guitar": [
        "{model} Standard",
        "{model} Custom",
        "{model} Deluxe",
        "{model} Player",
    ],
    "Bass Guitar": [
        "{model} 4-String",
        "{model} 5-String",
        "{model} Fretless",
    ],
    "Effects Pedal": [
        "{model} Overdrive",
        "{model} Distortion",
        "{model} Delay",
        "{model} Reverb",
        "{model} Chorus",
        "{model} Compressor",
    ],
}


def expand_brand_catalog(catalog_path: Path, target_mult: float = 5.0) -> int:
    """Expand a single brand catalog by adding product variants."""
    with open(catalog_path, encoding="utf-8") as f:
        data = json.load(f)
    
    brand_id = data["brand_identity"]["id"]
    brand_name = data["brand_identity"]["name"]
    existing_products = data.get("products", [])
    current_count = len(existing_products)
    
    if current_count == 0:
        logger.warning(f"⚠ {brand_id}: Empty catalog, skipping")
        return 0
    
    target_count = max(int(current_count * target_mult), current_count + 3)
    new_products = []
    used_ids = {p["id"] for p in existing_products}
    
    # For each existing product, generate variants
    for base_product in existing_products[:5]:  # Expanded base for more products
        category = base_product.get("category", "Generic")
        templates = EXPANSION_TEMPLATES.get(category, [
            "{model} Plus",
            "{model} Pro",
            "{model} Compact",
            "{model} Limited Edition",
            "{model} Anniversary",
        ])
        
        base_name = base_product["name"].replace(brand_name, "").strip()
        model_code = base_name.split()[0] if base_name else "X"
        
        for i, template in enumerate(templates):
            if len(existing_products) + len(new_products) >= target_count:
                break
            
            variant_name = f"{brand_name} {template.format(model=model_code, series=model_code)}"
            variant_id = f"{brand_id}-{model_code.lower()}-variant-{i+1}"
            
            if variant_id in used_ids:
                continue
            
            used_ids.add(variant_id)
            new_product = {
                "id": variant_id,
                "name": variant_name,
                "brand": brand_id,
                "category": category,
                "production_country": base_product.get("production_country", "Unknown 🌍"),
                "images": {
                    "main": f"/static/assets/products/{variant_id}.webp",
                    "thumbnail": f"/static/assets/products/{variant_id}.webp",
                },
                "documentation": {
                    "type": "pdf",
                    "url": f"https://example.com/manuals/{variant_id}.pdf",
                },
                "relationships": [
                    {
                        "type": "related",
                        "target_id": base_product["id"],
                        "label": "Base Model"
                    }
                ],
            }
            new_products.append(new_product)
    
    if new_products:
        data["products"].extend(new_products)
        with open(catalog_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"✓ {brand_id}: {current_count} → {len(data['products'])} products (+{len(new_products)})")
        return len(new_products)
    
    return 0


def main():
    logger.info("🚀 Expanding catalogs to 20% industry coverage...")
    logger.info("=" * 60)
    
    total_before = 0
    total_after = 0
    
    for catalog_file in sorted(CATALOGS_DIR.glob("*_catalog.json")):
        with open(catalog_file) as f:
            data = json.load(f)
            total_before += len(data.get("products", []))
        
        added = expand_brand_catalog(catalog_file, target_mult=6.8)  # Reaches 20%+
        total_after += added
    
    logger.info("=" * 60)
    logger.info("✅ Expansion complete!")
    logger.info(f"   Before: {total_before} products")
    logger.info(f"   After:  {total_before + total_after} products")
    logger.info(f"   Added:  +{total_after} products")
    logger.info(f"   Coverage: ~{(total_before + total_after) / 8000 * 100:.1f}% of industry")


if __name__ == "__main__":
    main()
