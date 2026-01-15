#!/usr/bin/env python3
"""
Rebuild all catalogs with brand-specific categories instead of Halilit's.
This updates existing catalogs to use the brand category definitions.
"""

from app.services.harvester import HarvesterService
import json
import sys
from pathlib import Path

# Add backend dir to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def rebuild_catalogs():
    """Rebuild all catalogs with normalized brand categories."""
    harvester = HarvesterService()
    catalogs_dir = harvester.catalogs_dir

    print(f"\n🔄 [REBUILD] Processing catalogs in {catalogs_dir}")
    print(f"📋 Brand categories defined: {len(harvester.brand_categories)}")

    rebuilt_count = 0

    for catalog_file in sorted(catalogs_dir.glob("*_catalog.json")):
        try:
            with open(catalog_file, "r", encoding="utf-8") as f:
                catalog = json.load(f)

            # Extract brand_id from filename
            brand_id = catalog_file.stem.replace("_catalog", "")

            # Get brand identity
            brand_identity = catalog.get("brand_identity", {})
            brand_name = brand_identity.get("name", brand_id.title())

            # Get brand categories
            brand_categories = harvester.brand_categories.get(brand_id, [])

            # Update brand identity with categories
            brand_identity["categories"] = brand_categories
            brand_identity["category_mapping"] = harvester._build_category_mapping(
                brand_categories)

            # Update products with normalized categories
            products = catalog.get("products", [])
            for product in products:
                # Normalize Halilit category to brand category
                old_category = product.get("category", "")
                new_category = harvester._normalize_to_brand_category(
                    old_category, brand_id)
                product["category"] = new_category

            # Write back
            catalog["brand_identity"] = brand_identity
            catalog["products"] = products

            with open(catalog_file, "w", encoding="utf-8") as f:
                json.dump(catalog, f, indent=2, ensure_ascii=False)

            status = "✅" if brand_categories else "⚠️"
            cat_str = ", ".join(
                brand_categories[:3]) if brand_categories else "NONE"
            print(f"{status} {brand_id:20} → {len(products):4} products | Categories: {cat_str}{'...' if len(brand_categories) > 3 else ''}")
            rebuilt_count += 1

        except Exception as e:
            print(f"❌ {catalog_file.name}: {e}")

    print(f"\n✅ Rebuilt {rebuilt_count} catalogs with brand categories")


if __name__ == "__main__":
    rebuild_catalogs()
