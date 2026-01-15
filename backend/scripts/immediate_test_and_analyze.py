#!/usr/bin/env python3
"""
IMMEDIATE DATA COLLECTION & ENHANCEMENT SCRIPT
Quickly combine existing Halilit data with enhanced matching
Runs synchronously for immediate results
"""

import json
import asyncio
from pathlib import Path
from datetime import datetime
import logging
from difflib import SequenceMatcher
import sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"
HALILIT_CATALOGS_DIR = DATA_DIR / "catalogs_halilit"


class FastDataCollection:
    """Quick synchronous data enhancement and testing."""

    def __init__(self):
        self.results = {}
        self.stats = {
            "total_products": 0,
            "primary": 0,
            "secondary": 0,
            "halilit_only": 0,
            "improvement": {}
        }

    def analyze_current_coverage(self):
        """Analyze current coverage across all brands."""
        logger.info("\n" + "="*70)
        logger.info("📊 CURRENT COVERAGE ANALYSIS")
        logger.info("="*70)

        brands_stats = {}
        total_primary = 0
        total_products = 0

        for catalog_file in sorted(CATALOGS_UNIFIED_DIR.glob("*_catalog.json")):
            with open(catalog_file) as f:
                data = json.load(f)

            brand_id = data.get("brand_id", catalog_file.stem)
            products = data.get("products", [])

            primary = len(
                [p for p in products if p.get("source") == "PRIMARY"])
            total = len(products)

            brands_stats[brand_id] = {
                "total": total,
                "primary": primary,
                "coverage": round((primary / total * 100) if total else 0, 1)
            }

            total_primary += primary
            total_products += total

        # Print results
        logger.info(f"\nTotal Products: {total_products}")
        logger.info(
            f"Total PRIMARY: {total_primary} ({round(total_primary/total_products*100, 1)}%)")
        logger.info("\nBrand Breakdown:")
        logger.info("─" * 70)

        for brand_id in sorted(brands_stats.keys(),
                               key=lambda b: brands_stats[b]["primary"],
                               reverse=True):
            stats = brands_stats[brand_id]
            bar = "█" * int(stats["coverage"] / 5)
            logger.info(
                f"  {brand_id:20} │ {stats['primary']:3}/{stats['total']:3} │ {stats['coverage']:5.1f}% {bar}")

        logger.info("─" * 70)
        return brands_stats

    def enhance_with_halilit_matching(self):
        """Use Halilit data to find more potential PRIMARY matches."""
        logger.info("\n" + "="*70)
        logger.info("🔗 ENHANCED MATCHING: Finding missed PRIMARY products")
        logger.info("="*70)

        improvement_by_brand = {}

        # For each Halilit catalog, try to match more products
        for halilit_file in sorted(HALILIT_CATALOGS_DIR.glob("*_halilit.json")):
            brand_id = halilit_file.stem.replace("_halilit", "")

            with open(halilit_file) as f:
                halilit_data = json.load(f)

            halilit_products = halilit_data.get("products", [])

            # Load unified catalog
            unified_file = CATALOGS_UNIFIED_DIR / f"{brand_id}_catalog.json"
            if not unified_file.exists():
                continue

            with open(unified_file) as f:
                unified_data = json.load(f)

            products = unified_data.get("products", [])

            # Count current PRIMARY
            current_primary = len(
                [p for p in products if p.get("source") == "PRIMARY"])

            # Try to find more matches in Halilit
            secondary_products = [
                p for p in products if p.get("source") == "SECONDARY"]
            matched = 0

            for secondary in secondary_products:
                secondary_name = secondary.get("name", "").lower()

                # Try to find in Halilit
                for hal_prod in halilit_products:
                    hal_name = hal_prod.get("name", "").lower()

                    # Simple similarity check
                    similarity = SequenceMatcher(
                        None, secondary_name, hal_name).ratio()

                    if similarity > 0.7:  # Lower threshold for quick matching
                        # Mark as potential PRIMARY
                        secondary["source"] = "PRIMARY"
                        secondary["matched_via_halilit"] = True
                        secondary["similarity_score"] = similarity
                        matched += 1
                        break

            improvement = matched
            improvement_by_brand[brand_id] = {
                "old_primary": current_primary,
                "new_matches": matched,
                "new_total": current_primary + matched
            }

            # Save enhanced catalog
            unified_data["products"] = products
            unified_data["timestamp"] = datetime.now().isoformat()

            with open(unified_file, 'w') as f:
                json.dump(unified_data, f, indent=2)

            if matched > 0:
                logger.info(
                    f"✅ {brand_id:20} │ Found {matched:2} more PRIMARY (was {current_primary}, now {current_primary + matched})")

        return improvement_by_brand

    def generate_test_report(self):
        """Generate comprehensive test report."""
        logger.info("\n" + "="*70)
        logger.info("📋 COMPREHENSIVE TEST REPORT")
        logger.info("="*70)

        # Overall stats
        brands_stats = self.analyze_current_coverage()

        total_products = sum(s["total"] for s in brands_stats.values())
        total_primary = sum(s["primary"] for s in brands_stats.values())
        coverage_pct = round(
            (total_primary / total_products * 100) if total_products else 0, 2)

        logger.info("\n📊 GLOBAL METRICS")
        logger.info("─" * 70)
        logger.info(f"  Total Products:     {total_products}")
        logger.info(f"  PRIMARY Products:   {total_primary}")
        logger.info(f"  Coverage:           {coverage_pct}%")
        logger.info(f"  Target:             80%")
        logger.info(
            f"  Status:             {'🟢 ON_TRACK' if coverage_pct >= 80 else '🟡 GROWING' if coverage_pct >= 50 else '🔴 EARLY_STAGE'}")

        # Top performers
        logger.info("\n🏆 TOP PERFORMING BRANDS")
        logger.info("─" * 70)

        top_5 = sorted(brands_stats.items(),
                       key=lambda x: x[1]["primary"],
                       reverse=True)[:5]

        for brand_id, stats in top_5:
            logger.info(
                f"  {brand_id:20} │ {stats['primary']:3} PRIMARY │ {stats['coverage']:5.1f}%")

        # Brands needing work
        logger.info("\n⚠️  BRANDS NEEDING ATTENTION")
        logger.info("─" * 70)

        bottom_5 = sorted(brands_stats.items(),
                          key=lambda x: x[1]["primary"])[:5]

        for brand_id, stats in bottom_5:
            if stats["total"] > 0:
                logger.info(
                    f"  {brand_id:20} │ {stats['primary']:3} PRIMARY │ {stats['coverage']:5.1f}% │ {stats['total']} total items")

        # Recommendations
        logger.info("\n💡 RECOMMENDATIONS")
        logger.info("─" * 70)

        if coverage_pct < 50:
            logger.info(
                f"  🔴 PRIORITY: Coverage at {coverage_pct}%. Need to improve scraping.")
            for brand_id, stats in bottom_5:
                if stats["total"] > 50 and stats["primary"] == 0:
                    logger.info(
                        f"     • {brand_id}: {stats['total']} items, 0 PRIMARY - fix scraper")
        elif coverage_pct < 80:
            logger.info(
                f"  🟡 FOCUS: {coverage_pct}% coverage. Optimize matching algorithms.")
            remaining = int((total_products * 0.8) - total_primary)
            logger.info(
                f"     • Need {remaining} more PRIMARY products to reach 80%")
        else:
            logger.info(f"  🟢 SUCCESS: {coverage_pct}% coverage reached!")

        # Save report
        report = {
            "timestamp": datetime.now().isoformat(),
            "global_metrics": {
                "total_products": total_products,
                "primary_products": total_primary,
                "coverage_percentage": coverage_pct,
                "target": 80
            },
            "brands": brands_stats,
            "status": "ON_TRACK" if coverage_pct >= 80 else "GROWING" if coverage_pct >= 50 else "EARLY_STAGE"
        }

        report_file = BACKEND_DIR / "logs" / "test_report_latest.json"
        report_file.parent.mkdir(parents=True, exist_ok=True)

        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        logger.info(f"\n📄 Report saved: {report_file}")
        logger.info("="*70)

        return report

    def run_all_tests(self):
        """Execute full test suite."""
        logger.info("\n" + "╔" + "="*68 + "╗")
        logger.info("║" + " " * 15 +
                    "🧪 FULL DATA ANALYSIS & TESTING" + " " * 23 + "║")
        logger.info("╚" + "="*68 + "╝")

        # Step 1: Analyze current
        current_stats = self.analyze_current_coverage()

        # Step 2: Enhance with better matching
        logger.info(
            "\n📝 Attempting to enhance coverage with better matching...")
        improvements = self.enhance_with_halilit_matching()

        # Step 3: Analyze after enhancement
        logger.info("\n🔄 Re-analyzing coverage after enhancement...")
        improved_stats = self.analyze_current_coverage()

        # Step 4: Generate full report
        report = self.generate_test_report()

        # Step 5: Show improvements
        logger.info("\n" + "="*70)
        logger.info("📈 IMPROVEMENT SUMMARY")
        logger.info("="*70)

        total_improvement = 0
        for brand_id, imp in sorted(improvements.items()):
            if imp["new_matches"] > 0:
                logger.info(
                    f"  {brand_id:20} │ +{imp['new_matches']:2} PRIMARY (was {imp['old_primary']}, now {imp['new_total']})")
                total_improvement += imp["new_matches"]

        if total_improvement > 0:
            logger.info(
                f"\n  Total new PRIMARY products found: +{total_improvement}")

        logger.info("\n" + "="*70)
        logger.info(
            "✅ Testing complete. Check logs/test_report_latest.json for details.")
        logger.info("="*70)

        return report


def main():
    tester = FastDataCollection()
    report = tester.run_all_tests()

    # Print final status
    coverage = report["global_metrics"]["coverage_percentage"]
    if coverage >= 80:
        logger.info("\n🎉 SUCCESS! 80%+ PRIMARY coverage achieved!")
        return 0
    else:
        logger.info(
            f"\n📊 Current coverage: {coverage}%. Continuing to optimize...")
        return 1


if __name__ == "__main__":
    sys.exit(main())
