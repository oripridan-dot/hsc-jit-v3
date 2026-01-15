#!/usr/bin/env python3
"""
SMART FILTER & CLEANING
Takes raw scraped data and filters out noise to get real products.
"""

import json
from pathlib import Path
from datetime import datetime
import sys

# Disable buffering for real-time output
sys.stdout.reconfigure(line_buffering=True)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"

# Noise patterns to filter out
NOISE_PATTERNS = [
    'menu', 'nav', 'home', 'about', 'contact', 'search', 'filter', 'sort',
    'country selector', 'language', '404', 'missing', 'error', 'oops',
    'your cart', 'add to cart', 'compare', 'wishlist', 'login', 'register',
    'skip to', 'mobile menu', 'cart items', 'checkout', 'continue shopping',
    'back to', 'view all', 'more', 'see less', 'show more', 'hide',
    'cookie', 'accept', 'dismiss', 'close', 'click here',
    'javascript', 'script', 'reload', 'try again', 'refresh',
]


def is_noise(text: str) -> bool:
    """Check if text is likely noise/UI element."""
    if not text:
        return True

    text_lower = text.lower().strip()

    # Too short or too long
    if len(text_lower) < 3 or len(text_lower) > 200:
        return True

    # Check noise patterns
    for pattern in NOISE_PATTERNS:
        if pattern in text_lower:
            return True

    # All uppercase or all lowercase with numbers/symbols (likely code)
    if text_lower.count('_') > 2 or text_lower.count('-') > 3:
        return True

    # Just numbers or symbols
    if not any(c.isalpha() for c in text):
        return True

    return False


def clean_brand_data():
    """Clean raw scraped data and filter out noise."""
    print("\n" + "=" * 70)
    print("🧹 SMART FILTER & CLEANING")
    print("=" * 70 + "\n")

    # Load Halilit expected counts
    halilit_counts = {}
    for file in CATALOGS_HALILIT_DIR.glob("*_halilit.json"):
        try:
            data = json.load(open(file))
            brand_id = file.stem.replace("_halilit", "")
            halilit_counts[brand_id] = len(data.get("products", []))
        except:
            pass

    results = {}

    for brand_file in sorted(CATALOGS_BRAND_DIR.glob("*_brand.json")):
        brand_id = brand_file.stem.replace("_brand", "")

        try:
            with open(brand_file) as f:
                catalog = json.load(f)

            raw_products = catalog.get("products", [])

            # Filter out noise
            clean_products = []
            seen = set()

            for product in raw_products:
                if isinstance(product, dict):
                    name = product.get("name", "").strip()
                else:
                    name = str(product).strip()

                # Skip noise
                if is_noise(name):
                    continue

                # Skip duplicates
                key = name.lower()
                if key in seen:
                    continue

                seen.add(key)

                if isinstance(product, dict):
                    clean_products.append(product)
                else:
                    clean_products.append({"name": name})

            # Save cleaned version
            expected = halilit_counts.get(brand_id, 0)
            actual = len(clean_products)

            if actual > 0:
                cleaned_catalog = {
                    "brand_id": brand_id,
                    "products": clean_products,
                    "product_count": actual,
                    "expected_count": expected,
                    "raw_count": len(raw_products),
                    "filtered_out": len(raw_products) - actual,
                    "timestamp": datetime.now().isoformat(),
                    "status": "success"
                }

                with open(brand_file, 'w') as f:
                    json.dump(cleaned_catalog, f, indent=2)

                pct = round(100 * actual / expected, 1) if expected > 0 else 0
                status = "✅" if actual >= expected * 0.5 else "⚠️"

                print(
                    f"{status} {brand_id:20} │ {len(raw_products):3} raw → {actual:3} clean ({pct}% of {expected})")
                results[brand_id] = actual
            else:
                print(f"❌ {brand_id:20} │ {len(raw_products):3} raw → 0 clean")
                results[brand_id] = 0

        except Exception as e:
            print(f"❌ {brand_id}: {e}")

    # Summary
    print("\n" + "=" * 70)
    print("📊 CLEANING RESULTS")
    print("=" * 70)

    total_clean = sum(results.values())
    total_halilit = sum(halilit_counts.values())
    overall_pct = round(100 * total_clean / total_halilit,
                        1) if total_halilit > 0 else 0

    successful = sum(1 for c in results.values() if c > 0)

    print(f"\n{successful}/{len(results)} brands have clean data")
    print(f"Total: {total_clean}/{total_halilit} products ({overall_pct}%)\n")

    for brand_id in sorted(results.keys(), key=lambda b: results[b], reverse=True):
        count = results[brand_id]
        expected = halilit_counts.get(brand_id, 0)
        pct = round(100 * count / expected, 1) if expected > 0 else 0
        status = "✅" if count > 0 else "❌"
        print(f"   {status} {brand_id:20} │ {count:3}/{expected:3} ({pct:5.1f}%)")


if __name__ == "__main__":
    clean_brand_data()
