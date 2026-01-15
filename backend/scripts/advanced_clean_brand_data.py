#!/usr/bin/env python3
"""
ADVANCED NOISE FILTERING with anomaly detection
Handles overly-scraped categories like Remo's 976 products.
"""

import json
from pathlib import Path
from datetime import datetime
from collections import Counter

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"

NOISE_PATTERNS = [
    'menu', 'nav', 'home', 'about', 'contact', 'search', 'filter', 'sort',
    'country selector', 'language', '404', 'missing', 'error', 'oops',
    'your cart', 'add to cart', 'compare', 'wishlist', 'login', 'register',
    'skip to', 'mobile menu', 'cart items', 'checkout', 'continue shopping',
    'back to', 'view all', 'more', 'see less', 'show more', 'hide',
    'cookie', 'accept', 'dismiss', 'close', 'click here',
    'javascript', 'script', 'reload', 'try again', 'refresh',
]

# Metadata tags appended by websites
METADATA_SUFFIXES = [
    'DrumNew', 'Drum', 'NewFeatured', 'New', 'Featured', 'Sale', 'Hot',
    'LimitedEdition', 'Limited', 'AccessoryNewFeatured', 'Accessory',
    'BagNew', 'Bag', 'StandNew', 'Stand', 'ClampNew', 'Clamp',
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

    # Too many symbols
    if text_lower.count('_') > 2 or text_lower.count('-') > 3:
        return True

    return False


def normalize_product_name(text: str) -> str:
    """Remove metadata suffixes from product names."""
    normalized = text.strip()

    # Remove metadata tags
    for suffix in METADATA_SUFFIXES:
        if normalized.endswith(suffix) and len(normalized) > len(suffix):
            normalized = normalized[:-len(suffix)].strip()

    return normalized


def detect_duplicates(products: list) -> list:
    """Remove near-duplicate products (likely category variants)."""
    # For large sets (>200), check for patterns like "X - Red", "X - Blue"
    if len(products) < 200:
        return products

    # Get names
    names = [p.get('name', '') if isinstance(p, dict) else str(p)
             for p in products]

    # Look for base products with many color/size variants
    base_names = Counter()
    for name in names:
        # Strip off common variant patterns
        base = name.split(' - ')[0].split(' (')[0].split(' [')[0].strip()
        base_names[base] += 1

    # If we have many products with same base name, it's likely variants
    # Keep only the base product
    variant_threshold = 5  # If same base appears 5+ times, it's variants
    variant_bases = {base for base,
                     count in base_names.items() if count >= variant_threshold}

    if not variant_bases:
        return products

    # Remove variants, keep only the base
    seen_bases = set()
    filtered = []

    for product in products:
        if isinstance(product, dict):
            name = product.get('name', '')
        else:
            name = str(product)

        base = name.split(' - ')[0].split(' (')[0].split(' [')[0].strip()

        if base in variant_bases:
            if base not in seen_bases:
                filtered.append(product)
                seen_bases.add(base)
        else:
            filtered.append(product)

    print(f"       Removed {len(products) - len(filtered)} variant duplicates")
    return filtered


def clean_brand_data_advanced():
    """Clean raw scraped data with advanced filtering."""
    print("\n" + "=" * 70)
    print("🔬 ADVANCED NOISE FILTERING & ANOMALY DETECTION")
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
    anomalies = {}

    for brand_file in sorted(CATALOGS_BRAND_DIR.glob("*_brand.json")):
        brand_id = brand_file.stem.replace("_brand", "")

        try:
            with open(brand_file) as f:
                catalog = json.load(f)

            raw_products = catalog.get("products", [])
            expected = halilit_counts.get(brand_id, 0)

            if not raw_products:
                print(f"❌ {brand_id:20} │ No raw data")
                results[brand_id] = 0
                continue

            # Step 1: Filter noise
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

                # Normalize name (remove metadata tags)
                normalized_name = normalize_product_name(name)

                # Skip duplicates
                key = normalized_name.lower()
                if key in seen:
                    continue

                seen.add(key)

                # Update product with normalized name
                if isinstance(product, dict):
                    product['name'] = normalized_name
                    clean_products.append(product)
                else:
                    clean_products.append({"name": normalized_name})

            # Step 2: Detect and handle anomalies (way too many products)
            pct = round(100 * len(clean_products) /
                        expected, 1) if expected > 0 else 0

            if pct > 200:  # More than 2x expected = likely massive over-extraction
                print(
                    f"⚠️  {brand_id:20} │ ANOMALY DETECTED: {len(clean_products)} products ({pct}% of {expected})")
                anomalies[brand_id] = (len(clean_products), expected, pct)

                # Try variant deduplication
                before = len(clean_products)
                clean_products = detect_duplicates(clean_products)
                after = len(clean_products)

                pct = round(100 * len(clean_products) /
                            expected, 1) if expected > 0 else 0

            # Step 3: Save cleaned version
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
                status = "✅" if actual >= expected * 0.5 else "⚠️" if actual > 0 else "❌"

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
    print("📊 ADVANCED CLEANING RESULTS")
    print("=" * 70)

    total_clean = sum(results.values())
    total_halilit = sum(halilit_counts.values())
    overall_pct = round(100 * total_clean / total_halilit,
                        1) if total_halilit > 0 else 0

    successful = sum(1 for c in results.values() if c > 0)

    print(f"\n{successful}/{len(results)} brands have clean data")
    print(f"Total: {total_clean}/{total_halilit} products ({overall_pct}%)")

    if anomalies:
        print(f"\n⚠️  ANOMALIES DETECTED ({len(anomalies)} brands):")
        for brand_id, (actual, expected, pct) in sorted(anomalies.items()):
            print(f"   - {brand_id}: {actual}/{expected} ({pct}%)")

    print("\n")

    for brand_id in sorted(results.keys(), key=lambda b: results[b], reverse=True):
        count = results[brand_id]
        expected = halilit_counts.get(brand_id, 0)
        pct = round(100 * count / expected, 1) if expected > 0 else 0
        status = "✅" if count > 0 else "❌"
        print(f"   {status} {brand_id:20} │ {count:3}/{expected:3} ({pct:5.1f}%)")


if __name__ == "__main__":
    clean_brand_data_advanced()
