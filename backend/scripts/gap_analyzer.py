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

from app.models.product import Product, ProductValidation
from app.utils.hebrew import normalize_model_from_text, extract_base_model, detect_variant_info
import json
from pathlib import Path
from typing import Dict, List, Any, Set, Optional
from collections import defaultdict
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))


class BrandGapAnalyzer:
    """Analyze gaps between Halilit inventory and brand catalogs"""

    def __init__(self, data_dir: Path = None):
        if data_dir is None:
            data_dir = Path(__file__).parent.parent / "data"

        self.data_dir = Path(data_dir)
        self.halilit_catalogs_dir = self.data_dir / "catalogs_halilit"
        self.brand_catalogs_dir = self.data_dir / "catalogs"
        self.brand_catalogs_brand_dir = self.data_dir / "catalogs_brand"
        self.gap_reports_dir = self.data_dir / "gap_reports"
        self.unified_catalogs_dir = self.data_dir / "catalogs_unified"
        self.gap_reports_dir.mkdir(parents=True, exist_ok=True)
        self.unified_catalogs_dir.mkdir(parents=True, exist_ok=True)

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

        # Normalize keys using bilingual-aware model extraction
        halilit_keys = {self._normalized_key_for_halilit(
            p): p for p in halilit_products if self._normalized_key_for_halilit(p)}
        brand_keys = {self._normalized_key_for_brand(
            p): p for p in brand_products if self._normalized_key_for_brand(p)}

        # Find overlaps and gaps
        common_keys = set(halilit_keys.keys()) & set(brand_keys.keys())
        halilit_only_keys = set(halilit_keys.keys()) - set(brand_keys.keys())
        brand_only_keys = set(brand_keys.keys()) - set(halilit_keys.keys())

        # Build results and enrich with confidence scoring and variant info
        common = []
        for key in common_keys:
            h = halilit_keys[key]
            b = brand_keys[key]

            # Extract variant information from model name
            model_name = b.get('model') or h.get('normalized_sku', '')
            variant_info = detect_variant_info(model_name)
            variant_info['base_model'] = extract_base_model(model_name)

            merged = {
                **b,
                # Preserve brand data as global truth
                "title_en": b.get("name"),
                # Enrich with local Hebrew context
                "title_he": h.get("title_he") or h.get("name"),
                "price_ils": h.get("price_ils"),
                "original_price_ils": h.get("original_price_ils"),
                "eilat_price_ils": h.get("eilat_price_ils"),
                # Do not overwrite English specs if present; carry local URL
                "halilit_product_url": h.get("url"),
                "variant_info": variant_info,
                "validation": {
                    "is_globally_recognized": True,
                    "is_locally_available": True,
                    "confidence_score": 100
                }
            }
            common.append(merged)

        halilit_only = []
        for key in halilit_only_keys:
            h = halilit_keys[key]

            # Extract variant information
            model_name = h.get('normalized_sku', '')
            variant_info = detect_variant_info(model_name)
            variant_info['base_model'] = extract_base_model(model_name)

            enriched = {
                **h,
                "title_he": h.get("title_he") or h.get("name"),
                "price_ils": h.get("price_ils"),
                "original_price_ils": h.get("original_price_ils"),
                "eilat_price_ils": h.get("eilat_price_ils"),
                "variant_info": variant_info,
                "validation": {
                    "is_globally_recognized": False,
                    "is_locally_available": True,
                    "confidence_score": 60
                }
            }
            halilit_only.append(enriched)

        brand_only = []  # THE GAP
        for key in brand_only_keys:
            b = brand_keys[key]

            # Extract variant information
            model_name = b.get('model', '')
            variant_info = detect_variant_info(model_name)
            variant_info['base_model'] = extract_base_model(model_name)

            enriched = {
                **b,
                "title_en": b.get("name"),
                "variant_info": variant_info,
                "validation": {
                    "is_globally_recognized": True,
                    "is_locally_available": False,
                    "confidence_score": 80
                }
            }
            brand_only.append(enriched)

        # Calculate coverage
        total_brand_products = len(brand_keys)
        coverage = min(100, (len(common) / total_brand_products * 100)
                       ) if total_brand_products > 0 else 0

        # Calculate variant statistics
        def count_variants(products):
            variants = sum(1 for p in products if p.get(
                'variant_info', {}).get('has_variant', False))
            base_models = set()
            for p in products:
                base = p.get('variant_info', {}).get(
                    'base_model') or p.get('model', '')
                if base:
                    base_models.add(extract_base_model(base))
            return {
                'total_products': len(products),
                'variant_count': variants,
                'base_model_count': len(base_models)
            }

        common_stats = count_variants(common)
        halilit_stats = count_variants(halilit_only)
        gap_stats = count_variants(brand_only)

        gap_report = {
            "brand_id": brand_id,
            "halilit_count": len(halilit_products),
            "brand_website_count": len(brand_products),
            "common_count": len(common),
            "gap_count": len(brand_only),
            "halilit_only_count": len(halilit_only),
            "coverage_percentage": round(coverage, 2),
            "variant_statistics": {
                "common": common_stats,
                "halilit_only": halilit_stats,
                "gap": gap_stats
            },
            "gap_products": brand_only,  # Products Halilit doesn't sell
            "common_products": common,
            "halilit_exclusive": halilit_only
        }

        print(
            f"   ✓ Common: {len(common)} products ({common_stats['base_model_count']} base models, {common_stats['variant_count']} variants)")
        print(f"   📊 Coverage: {coverage:.1f}%")
        print(
            f"   ⚠️  Gap: {len(brand_only)} products ({gap_stats['base_model_count']} base models)")

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
        """Load brand's website catalog from catalogs_brand if available; fallback to catalogs when empty or missing."""
        brand_site_path = self.brand_catalogs_brand_dir / \
            f"{brand_id}_brand.json"
        if brand_site_path.exists():
            try:
                with open(brand_site_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if data.get('products'):
                    return data
            except Exception:
                pass
        # Fallback to legacy unified catalog path
        catalog_path = self.brand_catalogs_dir / f"{brand_id}_catalog.json"
        if not catalog_path.exists():
            print(
                f"      ⚠️  Brand catalog not found: {brand_site_path} or {catalog_path}")
            return {}
        with open(catalog_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _normalized_key_for_halilit(self, p: Dict[str, Any]) -> str:
        """Generate a normalized model key for Halilit product, with variant consolidation."""
        key = (
            p.get('normalized_sku')
            or normalize_model_from_text(p.get('name', ''))
            or normalize_model_from_text(p.get('item_code', ''))
            or self._normalize_name(p.get('name', ''))
        )
        # Apply variant consolidation - strip color suffixes and version indicators
        if key:
            key = extract_base_model(key)
        return key.upper() if key else ''

    def _normalized_key_for_brand(self, p: Dict[str, Any]) -> str:
        """Generate a normalized model key for Brand product, with variant consolidation."""
        key = (
            normalize_model_from_text(p.get('name', ''))
            or p.get('model')
            or normalize_model_from_text(p.get('sku', ''))
            or self._normalize_name(p.get('name', ''))
        )
        # Apply variant consolidation - strip color suffixes and version indicators
        if key:
            key = extract_base_model(key)
        return key.upper() if key else ''

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

    def save_unified_catalog(self, brand_id: str, common_products: List[Dict[str, Any]]) -> Path:
        """Save unified catalog with validated Product models."""
        catalog_path = self.unified_catalogs_dir / f"{brand_id}_unified.json"

        # Import VariantInfo for proper mapping
        from app.models.product import VariantInfo

        # Convert to Product models for validation
        validated_products = []
        for p in common_products:
            try:
                # Map variant_info dict to VariantInfo model if present
                variant_info = None
                if p.get('variant_info'):
                    variant_info = VariantInfo(**p['variant_info'])

                # Map the enriched dict to Product schema
                product = Product(
                    id=p.get('id') or p.get('halilit_id'),
                    brand=brand_id,
                    model=p.get('model') or self._normalized_key_for_brand(p),
                    title_en=p.get('title_en'),
                    description_en=p.get('description_en'),
                    specs_en=p.get('specs_en') or p.get('specs'),
                    title_he=p.get('title_he'),
                    description_he=p.get('description_he'),
                    price_ils=p.get('price_ils'),
                    original_price_ils=p.get('original_price_ils'),
                    eilat_price_ils=p.get('eilat_price_ils'),
                    variant_info=variant_info,
                    validation=ProductValidation(**p.get('validation', {}))
                )
                validated_products.append(product.model_dump())
            except Exception as e:
                print(
                    f"      ⚠️  Validation error for product {p.get('name')}: {e}")
                continue

        catalog = {
            "brand_id": brand_id,
            "source": "unified",
            "total_products": len(validated_products),
            "products": validated_products,
            "metadata": {
                "schema_version": "v3.5-bilingual",
                "validated": True
            }
        }

        with open(catalog_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        print(
            f"   📦 Unified catalog saved: {catalog_path} ({len(validated_products)} validated products)")
        return catalog_path

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
        # Save unified catalog with validated products
        if report.get('common_products'):
            analyzer.save_unified_catalog(
                args.brand, report['common_products'])

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

        # Generate unified catalogs for all brands
        print("\n📦 Generating unified catalogs...")
        for brand_id in sorted(common_brands):
            report_path = analyzer.gap_reports_dir / \
                f"{brand_id}_gap_report.json"
            if report_path.exists():
                with open(report_path, 'r', encoding='utf-8') as f:
                    report = json.load(f)
                if report.get('common_products'):
                    analyzer.save_unified_catalog(
                        brand_id, report['common_products'])
        print("✅ Unified catalogs generated")

    else:
        parser.print_help()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
