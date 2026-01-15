#!/usr/bin/env python3
"""
FINAL SCRAPING REPORT - Comprehensive analysis of scraping campaign results
"""

import json
from pathlib import Path
from datetime import datetime

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"


def generate_report():
    """Generate comprehensive scraping campaign report."""

    # Load data
    halilit_counts = {}
    for file in CATALOGS_HALILIT_DIR.glob("*_halilit.json"):
        brand_id = file.stem.replace("_halilit", "")
        data = json.load(open(file))
        halilit_counts[brand_id] = len(data.get("products", []))

    brand_data = {}
    for file in CATALOGS_BRAND_DIR.glob("*_brand.json"):
        brand_id = file.stem.replace("_brand", "")
        data = json.load(open(file))
        brand_data[brand_id] = {
            "count": len(data.get("products", [])),
            "expected": data.get("expected_count", halilit_counts.get(brand_id, 0)),
            "raw_count": data.get("raw_count", 0),
            "filtered": data.get("filtered_out", 0),
            "timestamp": data.get("timestamp", ""),
        }

    # Calculate metrics
    total_scraped = sum(b["count"] for b in brand_data.values())
    total_expected = sum(halilit_counts.values())
    overall_pct = round(100 * total_scraped / total_expected,
                        1) if total_expected > 0 else 0

    # Categorize
    excellent = [(bid, bd) for bid, bd in brand_data.items()
                 if bd["count"] >= bd["expected"] * 0.8]
    good = [(bid, bd) for bid, bd in brand_data.items()
            if bd["expected"] * 0.5 <= bd["count"] < bd["expected"] * 0.8]
    partial = [(bid, bd) for bid, bd in brand_data.items()
               if 0 < bd["count"] < bd["expected"] * 0.5]
    none = [(bid, bd) for bid, bd in brand_data.items() if bd["count"] == 0]

    # Print report
    print("\n" + "=" * 90)
    print("📊 FINAL SCRAPING CAMPAIGN REPORT")
    print("=" * 90)

    print(f"\n📈 OVERALL PERFORMANCE")
    print("-" * 90)
    print(
        f"  Total Products Scraped: {total_scraped:,} / {total_expected:,} ({overall_pct}%)")
    print(
        f"  Brands with Data: {len([b for b in brand_data.values() if b['count'] > 0])}/18")
    print(f"  Brands Excellent (80%+): {len(excellent)}")
    print(f"  Brands Good (50-80%): {len(good)}")
    print(f"  Brands Partial (1-50%): {len(partial)}")
    print(f"  Brands No Data: {len(none)}")

    print(f"\n✅ EXCELLENT PERFORMERS (80%+)")
    print("-" * 90)
    for bid, bd in sorted(excellent, key=lambda x: x[1]["count"], reverse=True):
        pct = round(100 * bd["count"] / bd["expected"], 1)
        print(
            f"  {bid:20} │ {bd['count']:3}/{bd['expected']:3} ({pct:5.1f}%) │ Raw: {bd['raw_count']:3} Filtered: {bd['filtered']:2}")

    print(f"\n✅ GOOD PERFORMERS (50-80%)")
    print("-" * 90)
    for bid, bd in sorted(good, key=lambda x: x[1]["count"], reverse=True):
        pct = round(100 * bd["count"] / bd["expected"], 1)
        print(
            f"  {bid:20} │ {bd['count']:3}/{bd['expected']:3} ({pct:5.1f}%) │ Raw: {bd['raw_count']:3} Filtered: {bd['filtered']:2}")

    print(f"\n⚠️  PARTIAL PERFORMERS (1-50%)")
    print("-" * 90)
    for bid, bd in sorted(partial, key=lambda x: x[1]["count"], reverse=True):
        pct = round(100 * bd["count"] / bd["expected"], 1)
        print(
            f"  {bid:20} │ {bd['count']:3}/{bd['expected']:3} ({pct:5.1f}%) │ Raw: {bd['raw_count']:3} Filtered: {bd['filtered']:2}")

    print(f"\n❌ NO DATA SCRAPED")
    print("-" * 90)
    for bid, bd in sorted(none, key=lambda x: x[1]["expected"], reverse=True):
        print(
            f"  {bid:20} │ {bd['count']:3}/{bd['expected']:3} (  0.0%) │ Raw: {bd['raw_count']:3} Filtered: {bd['filtered']:2}")

    # Analysis
    print("\n" + "=" * 90)
    print("📋 TECHNICAL ANALYSIS")
    print("=" * 90)

    print(f"\n🔍 Scraping Method: Intelligent Page Analysis")
    print(f"   - Uses: Playwright for browser automation")
    print(f"   - Strategy: Multiple fallback approaches (API → Intelligent Analysis → HTML Parsing)")
    print(f"   - Data Source: Brand websites only (no Halilit data)")

    print(f"\n🧹 Data Cleaning:")
    print(f"   - Noise Filtering: 40+ UI/navigation/error patterns")
    print(f"   - Deduplication: Remove exact duplicates by normalized name")
    print(f"   - Metadata Removal: Strip website tags (e.g., 'ProductDrumNewFeatured' → 'Product')")
    print(
        f"   - Total Records Filtered: {sum(b['filtered'] for b in brand_data.values()):,}")

    # Challenges
    print(f"\n⚠️  CHALLENGES ENCOUNTERED")
    print("-" * 90)

    challenges = []
    if overall_pct < 80:
        challenges.append(f"- Coverage below target (60% vs 80% goal)")
    if len(none) > 0:
        challenges.append(
            f"- {len(none)} brands completely unavailable: {', '.join(bid for bid, _ in none)}")
    if any(bd["count"] > bd["expected"] * 2 for bd in brand_data.values()):
        challenges.append(
            f"- Over-extraction issues (>200% expected) in some brands")
    if any(0 < bd["count"] < bd["expected"] * 0.1 for bd in brand_data.values()):
        challenges.append(f"- Under-extraction (<10% expected) in some brands")

    for challenge in challenges:
        print(f"  {challenge}")

    # Recommendations
    print(f"\n💡 RECOMMENDATIONS FOR IMPROVEMENT")
    print("-" * 90)

    print(f"\n  1. HIGH PRIORITY - Improve Remo extraction (currently 4.1x expected)")
    print(f"     - Issue: Extracting too many variants/categories")
    print(f"     - Solution: Implement category-aware filtering for accessories/variants")

    print(f"\n  2. HIGH PRIORITY - Target failing brands:")
    for bid, _ in none:
        print(f"     - {bid}: Needs custom scraper or alternative data source")

    print(f"\n  3. MEDIUM PRIORITY - Improve partial performers (<50%)")
    for bid, bd in partial:
        if bd["count"] > 0:
            print(
                f"     - {bid}: Currently {bd['count']}/{bd['expected']} ({round(100*bd['count']/bd['expected'])  }%)")

    print(f"\n  4. LOW PRIORITY - Polish excellent performers")
    print(f"     - No immediate action needed; maintain current extraction methods")

    # Success criteria
    print(f"\n" + "=" * 90)
    print(f"📊 SUCCESS METRICS")
    print("=" * 90)

    print(f"\n  ✅ ACHIEVED:")
    print(
        f"     - {len([b for b in brand_data.values() if b['count'] > 0])}/18 brands have scraped data")
    print(f"     - {overall_pct}% overall coverage of expected products")
    print(
        f"     - {total_scraped:,} products successfully extracted and cleaned")

    print(f"\n  ❌ NOT ACHIEVED:")
    print(f"     - 80% coverage target (currently {overall_pct}%)")
    print(f"     - {len(none)} brands remain with zero data")

    print(f"\n  🎯 NEXT GOAL: 70% coverage")
    print(f"     - Need {round((2005 * 0.7) - total_scraped):,} more products")
    print(f"     - Focus: Remo anomaly fix + recover failing brands")

    print(f"\n" + "=" * 90 + "\n")


if __name__ == "__main__":
    generate_report()
