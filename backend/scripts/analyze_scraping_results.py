#!/usr/bin/env python3
"""
Analyze scraping results and generate comprehensive coverage report.
"""

import json
from pathlib import Path
from datetime import datetime

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"


def load_data():
    """Load all data from catalogs."""
    halilit = {}
    brand = {}

    for file in CATALOGS_HALILIT_DIR.glob("*_halilit.json"):
        brand_id = file.stem.replace("_halilit", "")
        data = json.load(open(file))
        halilit[brand_id] = len(data.get("products", []))

    for file in CATALOGS_BRAND_DIR.glob("*_brand.json"):
        brand_id = file.stem.replace("_brand", "")
        data = json.load(open(file))
        brand[brand_id] = {
            "count": len(data.get("products", [])),
            "expected": data.get("expected_count", halilit.get(brand_id, 0)),
            "raw_count": data.get("raw_count", 0),
            "filtered": data.get("filtered_out", 0),
        }

    return halilit, brand


def main():
    halilit_counts, brand_data = load_data()

    print("\n" + "=" * 80)
    print("📊 COMPREHENSIVE SCRAPING ANALYSIS")
    print("=" * 80 + "\n")

    # Sort by performance
    sorted_brands = sorted(
        brand_data.items(), key=lambda x: x[1]['count'], reverse=True)

    # Categories
    excellent = []  # >= 80%
    good = []       # >= 50%
    partial = []    # >= 10%
    poor = []       # < 10%

    total_clean = 0
    total_expected = sum(halilit_counts.values())

    for brand_id, data in sorted_brands:
        expected = data['expected']
        actual = data['count']
        raw = data['raw_count']
        filtered = data['filtered']
        pct = round(100 * actual / expected, 1) if expected > 0 else 0

        total_clean += actual

        status = "✅" if actual > 0 else "❌"

        if pct >= 80:
            excellent.append((brand_id, actual, expected, pct, raw, filtered))
        elif pct >= 50:
            good.append((brand_id, actual, expected, pct, raw, filtered))
        elif pct >= 10:
            partial.append((brand_id, actual, expected, pct, raw, filtered))
        else:
            poor.append((brand_id, actual, expected, pct, raw, filtered))

    # Display by category
    print("🌟 EXCELLENT COVERAGE (80%+)")
    print("-" * 80)
    for brand_id, actual, expected, pct, raw, filtered in excellent:
        print(
            f"  ✅ {brand_id:20} │ {actual:3}/{expected:3} ({pct:5.1f}%) │ Raw: {raw} → Filtered: {filtered}")

    print("\n✅ GOOD COVERAGE (50-80%)")
    print("-" * 80)
    for brand_id, actual, expected, pct, raw, filtered in good:
        print(
            f"  ✅ {brand_id:20} │ {actual:3}/{expected:3} ({pct:5.1f}%) │ Raw: {raw} → Filtered: {filtered}")

    print("\n⚠️  PARTIAL COVERAGE (10-50%)")
    print("-" * 80)
    for brand_id, actual, expected, pct, raw, filtered in partial:
        print(
            f"  ⚠️  {brand_id:20} │ {actual:3}/{expected:3} ({pct:5.1f}%) │ Raw: {raw} → Filtered: {filtered}")

    print("\n❌ POOR/NO COVERAGE (<10%)")
    print("-" * 80)
    for brand_id, actual, expected, pct, raw, filtered in poor:
        status = "❌" if actual == 0 else "⚠️"
        print(f"  {status} {brand_id:20} │ {actual:3}/{expected:3} ({pct:5.1f}%) │ Raw: {raw} → Filtered: {filtered}")

    # Summary
    print("\n" + "=" * 80)
    print("📈 OVERALL SUMMARY")
    print("=" * 80)

    overall_pct = round(100 * total_clean / total_expected,
                        1) if total_expected > 0 else 0
    successful = len(excellent) + len(good) + len(partial)

    print(
        f"\n  Total Coverage: {total_clean:,}/{total_expected:,} products ({overall_pct}%)")
    print(f"  Successful Brands: {successful}/{len(brand_data)} brands")
    print(f"  Excellent (80%+): {len(excellent)} brands")
    print(f"  Good (50-80%): {len(good)} brands")
    print(f"  Partial (10-50%): {len(partial)} brands")
    print(f"  Poor/None (<10%): {len(poor)} brands")

    # Action items
    print("\n" + "=" * 80)
    print("📋 NEXT STEPS")
    print("=" * 80)

    if overall_pct >= 80:
        print("\n  ✅ EXCELLENT: Coverage exceeds 80%. Ready for production.")
    elif overall_pct >= 60:
        print("\n  ✅ GOOD: Coverage exceeds 60%. Focus on improving poor performers:")
        for brand_id, _, _, _, _, _ in poor:
            print(f"     - {brand_id}")
    elif overall_pct >= 40:
        print("\n  ⚠️  MODERATE: Coverage between 40-60%. Need significant improvement:")
        for brand_id, _, _, _, _, _ in poor + partial:
            print(f"     - {brand_id}")
    else:
        print("\n  ❌ LOW: Coverage below 40%. Major improvements needed.")

    print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    main()
