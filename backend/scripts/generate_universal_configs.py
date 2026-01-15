"""
Generate universal scrape configs for brands that need them.
Uses smart fallback patterns that work with the updated harvester.
"""

import json
from pathlib import Path

# Priority brands with their product page URLs
BRAND_CONFIGS = {
    "roland": {
        "product_urls": [
            "https://www.roland.com/us/products/",  # All products
            "https://www.roland.com/us/categories/pianos/grand_pianos/",
            "https://www.roland.com/us/categories/pianos/upright_pianos/",
            "https://www.roland.com/us/categories/synthesizers/",
            "https://www.roland.com/us/categories/drums/",
        ]
    },
    "nord": {
        "product_urls": [
            "https://www.nordkeyboards.com/products/nord-stage-4",
            "https://www.nordkeyboards.com/products/nord-piano-5",
            "https://www.nordkeyboards.com/products/nord-grand-2",
        ]
    },
    "boss": {
        "product_urls": [
            "https://www.boss.info/us/products/",
        ]
    },
    "pearl": {
        "product_urls": [
            "https://pearldrum.com/products/drums",
            "https://pearldrum.com/products/hardware",
        ]
    }
}


def generate_universal_config(brand_id: str, base_url: str) -> dict:
    """Generate a universal config that uses auto-detection."""
    return {
        "brand_id": brand_id,
        "base_url": base_url,
        "product_list_selector": None,  # Let harvester auto-detect
        "product_item_selector": None,   # Let harvester auto-detect
        "pagination": {
            "type": "none",
            "next_button_selector": None
        },
        "fields": {
            "name": {
                "selector": "h2, h3, h4, .name, .title, .product-name",
                "attribute": "text"
            },
            "image_url": {
                "selector": "img",
                "attribute": "src"
            },
            "detail_url": {
                "selector": "a",
                "attribute": "href"
            },
            "price": {
                "selector": ".price, [class*='price'], .cost",
                "attribute": "text"
            },
            "category": {
                "selector": ".category, [class*='category']",
                "attribute": "text"
            }
        }
    }


def main():
    backend_dir = Path(__file__).parent.parent
    brands_dir = backend_dir / "data" / "brands"
    brands_dir.mkdir(parents=True, exist_ok=True)

    created = 0
    for brand_id, config in BRAND_CONFIGS.items():
        brand_dir = brands_dir / brand_id
        brand_dir.mkdir(exist_ok=True)

        # Use first URL as base
        base_url = config["product_urls"][0]

        # Generate config
        scrape_config = generate_universal_config(brand_id, base_url)

        # Save
        config_path = brand_dir / "scrape_config.json"
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(scrape_config, f, indent=2)

        print(f"✅ Created config for {brand_id}: {config_path}")
        created += 1

    print(f"\n✨ Generated {created} universal configs")


if __name__ == "__main__":
    main()
