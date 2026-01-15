"""
CATALOG MERGER: Unified Product Catalog Generator

Architecture:
- Halilit = Source of Truth for: prices, SKU, images, availability
- Brand Websites = Source of Truth for: specs, manuals, content, knowledge
- Output = Unified catalog with source flags: PRIMARY or SECONDARY

Product Classification:
- PRIMARY: Product exists in BOTH Halilit AND Brand website
  → Use Halilit data for pricing/SKU
  → Enhance with Brand website data for specs/manuals
  → Mark as "Available from official distributor + brand documentation"
  
- SECONDARY: Product exists ONLY in Brand website
  → Show as "Check availability"
  → Link directly to brand website
  → User must verify pricing elsewhere
  
- HALILIT-ONLY: Product exists ONLY in Halilit
  → Show as "Available from official distributor"
  → All data from Halilit
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from difflib import SequenceMatcher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CatalogMerger:
    """Merges Halilit and Brand website catalogs into unified view."""

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            backend_dir = Path(__file__).resolve().parents[1]
            data_dir = backend_dir / "data"

        self.data_dir = Path(data_dir)
        self.halilit_dir = self.data_dir / "catalogs_halilit"
        self.brand_dir = self.data_dir / "catalogs_brand"
        self.unified_dir = self.data_dir / "catalogs_unified"
        self.unified_dir.mkdir(parents=True, exist_ok=True)

    def merge_all_brands(self, brands: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Merge catalogs for all brands.
        """
        result = {
            "timestamp": datetime.now().isoformat(),
            "total_brands": 0,
            "total_products": 0,
            "primary_products": 0,
            "secondary_products": 0,
            "brands": {}
        }

        if brands is None:
            # Auto-detect brands from halilit directory
            brands = [f.stem.replace("_halilit", "")
                      for f in self.halilit_dir.glob("*_halilit.json")]

        logger.info(f"🔗 [MERGER] Starting merge for {len(brands)} brands\n")

        for brand_id in sorted(brands):
            logger.info(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            logger.info(f"Merging: {brand_id}")
            logger.info(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

            # Load catalogs
            halilit_data = self._load_catalog(
                self.halilit_dir / f"{brand_id}_halilit.json"
            )
            brand_data = self._load_catalog(
                self.brand_dir / f"{brand_id}_brand.json"
            )

            halilit_products = halilit_data.get(
                "products", []) if halilit_data else []
            brand_products = brand_data.get(
                "products", []) if brand_data else []

            logger.info(f"  Halilit: {len(halilit_products)} products")
            logger.info(f"  Brand: {len(brand_products)} products")

            # Merge
            unified_products = self._merge_products(
                brand_id, halilit_products, brand_products
            )

            # Save unified catalog
            unified_catalog = {
                "brand_id": brand_id,
                "brand_name": halilit_data.get("brand_identity", {}).get("name", brand_id)
                if halilit_data else brand_id,
                "source_integration": {
                    "halilit": {
                        "authoritative_for": ["prices", "skus", "images", "availability"],
                        "product_count": len(halilit_products)
                    },
                    "brand_website": {
                        "authoritative_for": ["specs", "manuals", "documentation", "knowledge"],
                        "product_count": len(brand_products)
                    }
                },
                "products": unified_products,
                "statistics": {
                    "total_products": len(unified_products),
                    "primary_products": len([p for p in unified_products
                                             if p["source_flag"] == "PRIMARY"]),
                    "secondary_products": len([p for p in unified_products
                                               if p["source_flag"] == "SECONDARY"]),
                    "coverage": self._calculate_coverage(unified_products)
                },
                "timestamp": datetime.now().isoformat()
            }

            output_path = self.unified_dir / f"{brand_id}_unified.json"
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(unified_catalog, f, indent=2, ensure_ascii=False)

            logger.info(
                f"  ✅ PRIMARY (both sources): {unified_catalog['statistics']['primary_products']}")
            logger.info(
                f"  🔄 SECONDARY (brand-only): {unified_catalog['statistics']['secondary_products']}")
            logger.info(
                f"  📊 Coverage: {unified_catalog['statistics']['coverage']:.1f}%")
            logger.info(f"  💾 Saved: {output_path}\n")

            # Update result
            result["total_brands"] += 1
            result["total_products"] += len(unified_products)
            result["primary_products"] += unified_catalog["statistics"]["primary_products"]
            result["secondary_products"] += unified_catalog["statistics"]["secondary_products"]
            result["brands"][brand_id] = unified_catalog["statistics"]

        # Save summary
        summary_path = self.unified_dir / "summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)

        logger.info(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.info(f"✅ MERGE COMPLETE")
        logger.info(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.info(f"Total brands: {result['total_brands']}")
        logger.info(f"Total products: {result['total_products']}")
        logger.info(f"  PRIMARY (both sources): {result['primary_products']}")
        logger.info(
            f"  SECONDARY (brand-only): {result['secondary_products']}")

        return result

    def _merge_products(self, brand_id: str,
                        halilit_products: List[Dict],
                        brand_products: List[Dict]) -> List[Dict]:
        """
        Merge products from both sources.

        Logic:
        1. For each Halilit product, try to find matching Brand product
        2. If found → PRIMARY (merge data, Halilit prices authoritative)
        3. If not found → Use Halilit data as-is
        4. For unmatched Brand products → SECONDARY
        """
        unified = []
        matched_brand_indices = set()

        # Process Halilit products (PRIMARY source)
        for h_idx, h_prod in enumerate(halilit_products):
            h_name = h_prod.get("name", "").lower().strip()
            h_sku = h_prod.get("item_code", "") or h_prod.get("sku", "")

            matched_b_idx = None
            match_score = 0.0

            # Try to match with Brand product
            for b_idx, b_prod in enumerate(brand_products):
                if b_idx in matched_brand_indices:
                    continue

                b_name = b_prod.get("name", "").lower().strip()

                # Match by SKU first (most reliable)
                if h_sku and h_sku.lower() in b_name:
                    matched_b_idx = b_idx
                    match_score = 1.0
                    break

                # Match by name similarity
                similarity = self._similarity_score(h_name, b_name)
                if similarity > 0.75 and similarity > match_score:
                    matched_b_idx = b_idx
                    match_score = similarity

            # Create unified product
            if matched_b_idx is not None:
                # PRIMARY: In both sources
                b_prod = brand_products[matched_b_idx]
                unified_prod = self._merge_primary(h_prod, b_prod)
                matched_brand_indices.add(matched_b_idx)
            else:
                # PRIMARY (Halilit-only): Still primary, just no brand data
                unified_prod = self._merge_primary(h_prod, None)

            unified.append(unified_prod)

        # Add unmatched Brand products as SECONDARY
        for b_idx, b_prod in enumerate(brand_products):
            if b_idx not in matched_brand_indices:
                unified_prod = self._create_secondary(b_prod)
                unified.append(unified_prod)

        return unified

    def _merge_primary(self, halilit_prod: Dict, brand_prod: Optional[Dict]) -> Dict:
        """Merge as PRIMARY: Halilit data is authoritative."""
        unified = {
            # Core data from Halilit (authoritative)
            "id": halilit_prod.get("id") or halilit_prod.get("halilit_id", f"prod-{id(halilit_prod)}"),
            "name": halilit_prod.get("name"),
            "brand": halilit_prod.get("brand", halilit_prod.get("brand_id")),
            "sku": halilit_prod.get("item_code") or halilit_prod.get("sku"),
            "price": halilit_prod.get("price"),
            "currency": halilit_prod.get("currency", "ILS"),
            "category": halilit_prod.get("category"),
            "image_url": halilit_prod.get("image_url") or halilit_prod.get("thumbnail_url"),

            # Source flags
            "source_flag": "PRIMARY",  # Available from official distributor
            "sources": {
                "halilit": {
                    "available": True,
                    "url": halilit_prod.get("url"),
                    "price": halilit_prod.get("price"),
                    "availability": halilit_prod.get("stock_status", "unknown")
                },
                "brand_website": {
                    "available": brand_prod is not None,
                    "url": brand_prod.get("url") if brand_prod else None,
                    "specs": brand_prod.get("specs") if brand_prod else None,
                    "manual_url": brand_prod.get("manual_url") if brand_prod else None,
                }
            },

            # Raw data for advanced uses
            "halilit_data": halilit_prod,
            "brand_data": brand_prod,

            # UI Hints
            "display_text": "Available at official distributor",
            "buy_link": halilit_prod.get("url"),
        }

        return unified

    def _create_secondary(self, brand_prod: Dict) -> Dict:
        """Create as SECONDARY: Brand website only."""
        unified = {
            "id": brand_prod.get("id") or f"prod-{id(brand_prod)}",
            "name": brand_prod.get("name"),
            "brand": brand_prod.get("brand"),
            "sku": brand_prod.get("sku"),
            "price": brand_prod.get("price"),
            "category": brand_prod.get("category"),
            "image_url": brand_prod.get("image_url"),

            # Source flags
            "source_flag": "SECONDARY",  # Brand-only, check availability
            "sources": {
                "halilit": {
                    "available": False,
                },
                "brand_website": {
                    "available": True,
                    "url": brand_prod.get("url"),
                    "specs": brand_prod.get("specs"),
                    "manual_url": brand_prod.get("manual_url"),
                }
            },

            # Raw data
            "brand_data": brand_prod,

            # UI Hints
            "display_text": "Check availability on brand website",
            "info_link": brand_prod.get("url"),
        }

        return unified

    def _similarity_score(self, str1: str, str2: str) -> float:
        """Calculate string similarity (0-1)."""
        if not str1 or not str2:
            return 0.0

        # Direct substring match
        if str1 in str2 or str2 in str1:
            return 0.9

        # SequenceMatcher ratio
        return SequenceMatcher(None, str1, str2).ratio()

    def _calculate_coverage(self, products: List[Dict]) -> float:
        """Calculate % of products with pricing (from Halilit)."""
        with_price = len([p for p in products if p.get("price")])
        return (with_price / len(products) * 100) if products else 0.0

    def _load_catalog(self, path: Path) -> Optional[Dict]:
        """Safely load catalog file."""
        if not path.exists():
            return None

        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load {path}: {e}")
            return None


def main():
    """Merge all catalogs."""
    merger = CatalogMerger()
    result = merger.merge_all_brands()

    print(f"\n✅ Merge complete: {result['total_products']} unified products")


if __name__ == "__main__":
    main()
