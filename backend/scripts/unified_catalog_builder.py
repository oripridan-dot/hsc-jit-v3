#!/usr/bin/env python3
"""
Unified Catalog Builder

Combines Halilit inventory with brand websites into a single queryable catalog.

Structure:
{
    "brand_id": {
        "halilit": { ... Halilit's inventory ... },
        "brand": { ... Full brand product line ... },
        "unified": { ... Merged with metadata ... },
        "gaps": { ... What's missing ... }
    }
}
"""

import json
from pathlib import Path
from typing import Dict, List, Any
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))


class UnifiedCatalogBuilder:
    """Build unified catalog from dual sources"""

    def __init__(self, data_dir: Path = None):
        if data_dir is None:
            data_dir = Path(__file__).parent.parent / "data"

        self.data_dir = Path(data_dir)
        self.halilit_catalogs = self.data_dir / "catalogs_halilit"
        self.brand_catalogs = self.data_dir / "catalogs"
        self.output_dir = self.data_dir / "catalogs_unified"
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def build_unified_catalog(self, brand_id: str) -> Dict[str, Any]:
        """
        Build unified catalog for a brand.

        Combines:
        - Halilit inventory (PRIMARY - what they sell)
        - Brand website (REFERENCE - full line)
        - Gap analysis (what's missing)
        """
        print(f"\n📚 Building unified catalog for: {brand_id}")

        # Load both sources
        halilit_data = self._load_catalog(
            self.halilit_catalogs, f"{brand_id}_halilit.json")
        brand_data = self._load_catalog(
            self.brand_catalogs, f"{brand_id}_catalog.json")

        # Build unified catalog
        unified = {
            "brand_id": brand_id,
            "metadata": {
                "primary_source": "halilit",
                "source_url": "https://www.halilit.com/pages/4367",
                "includes_full_brand_line": brand_data is not None,
                "gap_analysis_available": True
            },
            "inventory": {
                "halilit": {
                    "count": len(halilit_data.get('products', [])) if halilit_data else 0,
                    "products": halilit_data.get('products', []) if halilit_data else [],
                    "source": "halilit",
                    "note": "Official Halilit inventory - PRIMARY SOURCE OF TRUTH"
                },
                "brand_website": {
                    "count": len(brand_data.get('products', [])) if brand_data else 0,
                    "products": brand_data.get('products', []) if brand_data else [],
                    "source": "brand",
                    "note": "Full product line from brand website - for gap analysis"
                }
            }
        }

        # Perform gap analysis
        gap_analysis = self._analyze_gaps(
            halilit_data.get('products', []) if halilit_data else [],
            brand_data.get('products', []) if brand_data else []
        )

        unified['gap_analysis'] = gap_analysis

        print(
            f"   ✓ Halilit: {unified['inventory']['halilit']['count']} products")
        print(
            f"   ✓ Brand: {unified['inventory']['brand_website']['count']} products")
        print(f"   ✓ Gap: {gap_analysis['gap_count']} products")

        return unified

    def _load_catalog(self, directory: Path, filename: str) -> Dict[str, Any]:
        """Load a catalog file"""
        filepath = directory / filename
        if not filepath.exists():
            return None

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"   ⚠️  Error loading {filename}: {e}")
            return None

    def _analyze_gaps(self, halilit_products: List[Dict], brand_products: List[Dict]) -> Dict[str, Any]:
        """Analyze gaps between Halilit and brand products"""

        # Normalize product names for comparison
        halilit_names = {self._normalize(
            p.get('name', '')): p for p in halilit_products}
        brand_names = {self._normalize(
            p.get('name', '')): p for p in brand_products}

        # Calculate overlaps
        common_names = set(halilit_names.keys()) & set(brand_names.keys())
        gap_names = set(brand_names.keys()) - set(halilit_names.keys())

        # Build gap list
        gap_products = [brand_names[name] for name in gap_names]

        # Calculate coverage
        total_brand = len(brand_names)
        coverage = (len(common_names) / total_brand *
                    100) if total_brand > 0 else 0

        return {
            "total_halilit": len(halilit_names),
            "total_brand": total_brand,
            "common_products": len(common_names),
            "gap_count": len(gap_names),
            "coverage_percentage": round(coverage, 2),
            "gap_products": gap_products[:10],  # Sample first 10 gaps
            "gap_total_count": len(gap_products)
        }

    def _normalize(self, text: str) -> str:
        """Normalize text for comparison"""
        import re
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def save_catalog(self, brand_id: str, catalog: Dict[str, Any]) -> Path:
        """Save unified catalog"""
        output_path = self.output_dir / f"{brand_id}_unified.json"

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        print(f"   💾 Saved: {output_path}")
        return output_path

    def build_all_unified_catalogs(self, brand_ids: List[str]) -> None:
        """Build unified catalogs for multiple brands"""
        print(f"\n🔧 Building unified catalogs for {len(brand_ids)} brands\n")

        successful = 0
        for brand_id in brand_ids:
            try:
                catalog = self.build_unified_catalog(brand_id)
                self.save_catalog(brand_id, catalog)
                successful += 1
            except Exception as e:
                print(f"   ❌ Error: {e}")

        print(f"\n✅ Built {successful}/{len(brand_ids)} unified catalogs")
        print(f"   Location: {self.output_dir}")


async def main():
    """Build unified catalogs"""
    import argparse

    parser = argparse.ArgumentParser(description="Build unified catalogs")
    parser.add_argument("--brands", nargs="+", help="Brand IDs to process")
    parser.add_argument("--all", action="store_true",
                        help="Process all available")

    args = parser.parse_args()

    builder = UnifiedCatalogBuilder()

    if args.brands:
        brands_to_process = args.brands
    elif args.all:
        # Find all brands with Halilit catalogs
        brands_to_process = []
        if builder.halilit_catalogs.exists():
            for f in builder.halilit_catalogs.glob("*_halilit.json"):
                brand_id = f.stem.replace('_halilit', '')
                brands_to_process.append(brand_id)
    else:
        parser.print_help()
        return

    builder.build_all_unified_catalogs(brands_to_process)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
