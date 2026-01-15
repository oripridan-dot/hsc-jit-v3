#!/usr/bin/env python3
"""
Brand Gap Analyzer

Compares:
1. Halilit's inventory (what they sell) - PRIMARY SOURCE
2. Brand's website (full product line) - REFERENCE

Identifies:
- Products Halilit sells
- Products Halilit doesn't carry (gap analysis)
- Price differences
- Stock availability
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Set
from collections import defaultdict


class BrandGapAnalyzer:
    """Analyze gaps between Halilit inventory and brand catalogs"""

    def __init__(self, data_dir: Path = None):
        if data_dir is None:
            data_dir = Path(__file__).parent.parent / "data"

        self.data_dir = Path(data_dir)
        self.halilit_catalogs_dir = self.data_dir / "catalogs_halilit"
        self.brand_catalogs_dir = self.data_dir / "catalogs"
        self.gap_reports_dir = self.data_dir / "gap_reports"
        self.gap_reports_dir.mkdir(parents=True, exist_ok=True)

    def analyze_brand(self, brand_id: str) -> Dict[str, Any]:
        """
        Analyze gaps for a specific brand.

        Returns:
            {
                "brand_id": str,
                "halilit_count": int,
                "brand_website_count": int,
                "gap_count": int,
                "coverage_percentage": float,
                "halilit_only": List[Dict],  # Products only in Halilit
                "brand_only": List[Dict],    # Products not in Halilit (gap)
                "common": List[Dict],         # Products in both
            }
        """
        print(f"\n🔍 Analyzing gaps for: {brand_id}")

        # Load Halilit catalog (PRIMARY SOURCE)
        halilit_catalog = self._load_halilit_catalog(brand_id)
        halilit_products = halilit_catalog.get(
            'products', []) if halilit_catalog else []

        # Load Brand website catalog (REFERENCE)
        brand_catalog = self._load_brand_catalog(brand_id)
        brand_products = brand_catalog.get(
            'products', []) if brand_catalog else []

        print(f"   📦 Halilit inventory: {len(halilit_products)} products")
        print(f"   🌐 Brand website: {len(brand_products)} products")

        # Normalize product names for comparison
        halilit_names = {self._normalize_name(
            p.get('name', '')): p for p in halilit_products}
        brand_names = {self._normalize_name(
            p.get('name', '')): p for p in brand_products}

        # Find overlaps and gaps
        common_names = set(halilit_names.keys()) & set(brand_names.keys())
        halilit_only_names = set(halilit_names.keys()) - \
            set(brand_names.keys())
        brand_only_names = set(brand_names.keys()) - set(halilit_names.keys())

        # Build results
        common = [halilit_names[name] for name in common_names]
        halilit_only = [halilit_names[name] for name in halilit_only_names]
        brand_only = [brand_names[name]
                      for name in brand_only_names]  # THE GAP

        # Calculate coverage
        total_brand_products = len(brand_names)
        coverage = (len(common) / total_brand_products *
                    100) if total_brand_products > 0 else 0

        gap_report = {
            "brand_id": brand_id,
            "halilit_count": len(halilit_products),
            "brand_website_count": len(brand_products),
            "common_count": len(common),
            "gap_count": len(brand_only),
            "halilit_only_count": len(halilit_only),
            "coverage_percentage": round(coverage, 2),
            "gap_products": brand_only,  # Products Halilit doesn't sell
            "common_products": common,
            "halilit_exclusive": halilit_only
        }

        print(f"   ✓ Common: {len(common)} products")
        print(f"   📊 Coverage: {coverage:.1f}%")
        print(f"   ⚠️  Gap: {len(brand_only)} products not in Halilit")

        return gap_report

    def _load_halilit_catalog(self, brand_id: str) -> Dict[str, Any]:
        """Load Halilit's catalog for a brand"""
        catalog_path = self.halilit_catalogs_dir / f"{brand_id}_halilit.json"
        if not catalog_path.exists():
            print(f"      ⚠️  Halilit catalog not found: {catalog_path}")
            return {}

        with open(catalog_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _load_brand_catalog(self, brand_id: str) -> Dict[str, Any]:
        """Load brand's website catalog"""
        catalog_path = self.brand_catalogs_dir / f"{brand_id}_catalog.json"
        if not catalog_path.exists():
            print(f"      ⚠️  Brand catalog not found: {catalog_path}")
            return {}

        with open(catalog_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _normalize_name(self, name: str) -> str:
        """Normalize product name for comparison"""
        import re
        # Remove special chars, lowercase, remove extra spaces
        name = name.lower()
        name = re.sub(r'[^\w\s]', '', name)
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    def save_gap_report(self, brand_id: str, report: Dict[str, Any]) -> Path:
        """Save gap analysis report"""
        report_path = self.gap_reports_dir / f"{brand_id}_gap_report.json"

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"   💾 Gap report saved: {report_path}")
        return report_path

    def generate_summary_report(self, brand_ids: List[str]) -> Dict[str, Any]:
        """Generate summary report for multiple brands"""
        print("\n📊 Generating summary gap report...")

        summary = {
            "total_brands": len(brand_ids),
            "brands": [],
            "totals": {
                "halilit_products": 0,
                "brand_products": 0,
                "total_gap": 0,
                "average_coverage": 0
            }
        }

        for brand_id in brand_ids:
            report = self.analyze_brand(brand_id)
            summary["brands"].append({
                "brand_id": brand_id,
                "halilit_count": report["halilit_count"],
                "brand_count": report["brand_website_count"],
                "gap_count": report["gap_count"],
                "coverage": report["coverage_percentage"]
            })

            summary["totals"]["halilit_products"] += report["halilit_count"]
            summary["totals"]["brand_products"] += report["brand_website_count"]
            summary["totals"]["total_gap"] += report["gap_count"]

        # Calculate average coverage
        if summary["brands"]:
            avg_coverage = sum(b["coverage"]
                               for b in summary["brands"]) / len(summary["brands"])
            summary["totals"]["average_coverage"] = round(avg_coverage, 2)

        # Save summary
        summary_path = self.gap_reports_dir / "summary_gap_report.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Summary report saved: {summary_path}")
        self._print_summary(summary)

        return summary

    def _print_summary(self, summary: Dict[str, Any]):
        """Print formatted summary"""
        print("\n" + "=" * 80)
        print("BRAND GAP ANALYSIS SUMMARY")
        print("=" * 80)
        print(f"\nTotal Brands Analyzed: {summary['total_brands']}")
        print(
            f"Total Halilit Products: {summary['totals']['halilit_products']}")
        print(f"Total Brand Products: {summary['totals']['brand_products']}")
        print(f"Total Gap: {summary['totals']['total_gap']} products")
        print(f"Average Coverage: {summary['totals']['average_coverage']}%")

        print("\n" + "-" * 80)
        print(
            f"{'Brand':<20} {'Halilit':<10} {'Brand Site':<12} {'Gap':<8} {'Coverage':<10}")
        print("-" * 80)

        for brand in summary["brands"]:
            print(f"{brand['brand_id']:<20} {brand['halilit_count']:<10} "
                  f"{brand['brand_count']:<12} {brand['gap_count']:<8} "
                  f"{brand['coverage']:<10.1f}%")

        print("=" * 80)


async def main():
    """Analyze gaps for specific brands"""
    import argparse

    parser = argparse.ArgumentParser(description="Analyze brand gaps")
    parser.add_argument("--brand", help="Single brand ID to analyze")
    parser.add_argument("--all", action="store_true",
                        help="Analyze all available brands")

    args = parser.parse_args()

    analyzer = BrandGapAnalyzer()

    if args.brand:
        # Single brand analysis
        report = analyzer.analyze_brand(args.brand)
        analyzer.save_gap_report(args.brand, report)

    elif args.all:
        # Find all brands with catalogs
        halilit_brands = set()
        if analyzer.halilit_catalogs_dir.exists():
            for f in analyzer.halilit_catalogs_dir.glob("*_halilit.json"):
                brand_id = f.stem.replace('_halilit', '')
                halilit_brands.add(brand_id)

        brand_brands = set()
        if analyzer.brand_catalogs_dir.exists():
            for f in analyzer.brand_catalogs_dir.glob("*_catalog.json"):
                brand_id = f.stem.replace('_catalog', '')
                brand_brands.add(brand_id)

        # Analyze brands that have both catalogs
        common_brands = halilit_brands & brand_brands

        if not common_brands:
            print("❌ No brands with both Halilit and brand catalogs found")
            return

        analyzer.generate_summary_report(sorted(common_brands))

    else:
        parser.print_help()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
