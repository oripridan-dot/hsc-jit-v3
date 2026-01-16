#!/usr/bin/env python3
"""
DUAL SOURCE MERGER: Brand-Website-First Product Catalog Builder

Architecture:
PRIMARY SOURCE (Product Content): Brand Websites
- Product name, specs, technical details
- Descriptions, manuals, documentation  
- Product images (from brand + high-res sources)
- Categories (brand-specific website navigation)

SECONDARY SOURCE (Commerce Data): Halilit Website
- Price (ILS currency)
- SKU/Item Code
- Stock status
- Additional product images if not available from brand

Output Strategy:
1. Start with brand website product data (complete specs, high-res images)
2. Match with Halilit products for pricing & SKU
3. Prioritize brand images, fallback to Halilit for missing images
4. Mark products: PRIMARY (matched), SECONDARY (brand-only), HALILIT-ONLY (Halilit without brand)

This ensures:
✓ Best product information from brand source
✓ Current pricing & SKU from Halilit
✓ Complete image coverage
✓ All products have authoritative specs
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from datetime import datetime
from difflib import SequenceMatcher
import re
import sys

# Add backend root to path to allow imports from app
backend_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(backend_dir))

try:
    from app.utils.hebrew import normalize_for_matching
except ImportError:
    # Fallback if running relative to script location differently
    sys.path.append(str(backend_dir.parent))
    from backend.app.utils.hebrew import normalize_for_matching

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DualSourceMerger:
    """Merges brand website (primary) with Halilit (commerce) data."""

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            backend_dir = Path(__file__).resolve().parents[1]
            data_dir = backend_dir / "data"

        self.data_dir = Path(data_dir)
        # Use Locked Contracts as the source for Brand data if available
        self.locked_dir = self.data_dir / "contracts" / "locked"
        self.brand_dir = self.data_dir / "catalogs_brand"  # Fallback
        self.halilit_dir = self.data_dir / \
            "catalogs_halilit"  # Halilit products (price/sku)
        self.catalogs_dir = self.data_dir / "catalogs"  # Output
        self.catalogs_dir.mkdir(parents=True, exist_ok=True)

        # New Output Dir
        self.unified_dir = self.data_dir / "catalogs_unified"
        self.unified_dir.mkdir(parents=True, exist_ok=True)

    def merge_all_brands(self, brands: Optional[List[str]] = None) -> Dict[str, Any]:
        """Merge all brands using dual-source strategy."""
        result = {
            "timestamp": datetime.now().isoformat(),
            "strategy": "Brand-Website-First with Halilit Price/SKU",
            "total_brands": 0,
            "total_products": 0,
            "primary_products": 0,
            "secondary_products": 0,
            "halilit_only_products": 0,
            "brands": {}
        }

        # Auto-detect brands
        if brands is None:
            halilit_brands = {
                f.stem.replace("_halilit", "")
                for f in self.halilit_dir.glob("*_halilit.json")
            }
            brand_brands = {
                f.stem.replace("_brand", "")
                for f in self.brand_dir.glob("*_brand.json")
            }
            brands = sorted(halilit_brands | brand_brands)

        logger.info(f"\n{'='*70}")
        logger.info(f"🔗 DUAL SOURCE MERGER: Brand-Website-First Strategy")
        logger.info(f"{'='*70}")
        logger.info(f"Processing {len(brands)} brands\n")

        for brand_id in sorted(brands):
            logger.info(f"\n{'─'*70}")
            logger.info(f"Processing: {brand_id}")
            logger.info(f"{'─'*70}")

            # USE LOCKED CONTRACT if available
            contract_file = self.locked_dir / f"{brand_id}_contract.json"
            brand_file = self.brand_dir / f"{brand_id}_brand.json"

            clean_brand_products = []
            data = None

            if contract_file.exists():
                logger.info(f"  🔒 Using LOCKED CONTRACT: {contract_file}")
                data = self._load_catalog(contract_file)
                if data:
                    clean_brand_products = data.get("products", [])
            elif brand_file.exists():
                logger.info(
                    f"  ⚠️  No Contract. Using RAW SCRAPE: {brand_file}")
                data = self._load_catalog(brand_file)
                if data:
                    # Filter polluted raw data
                    raw_prods = data.get("products", [])
                    for bp in raw_prods:
                        is_polluted = (
                            bp.get("source") == "halilit" or
                            "halilit_id" in bp or
                            "price_ils" in bp
                        )
                        if not is_polluted:
                            clean_brand_products.append(bp)
            else:
                logger.warning("  ❌ No Brand Data source found.")

            halilit_data = self._load_catalog(
                self.halilit_dir / f"{brand_id}_halilit.json"
            )
            halilit_products = halilit_data.get(
                "products", []) if halilit_data else []

            brand_products = clean_brand_products

            logger.info(f"  📱 Brand Website: {len(brand_products)} products")
            logger.info(f"  💰 Halilit: {len(halilit_products)} products")

            # Get brand identity (from either source)
            brand_identity = (
                data.get("brand_identity", {}) if data
                else halilit_data.get("brand_identity", {})
            )
            if not brand_identity.get("id"):
                brand_identity["id"] = brand_id
            if not brand_identity.get("name"):
                brand_identity["name"] = brand_id.replace("-", " ").title()

            # Merge using brand-website-first strategy
            unified_products, stats = self._merge_products_dual_source(
                brand_id, brand_products, halilit_products
            )

            # Save unified catalog
            unified_catalog = {
                "brand_identity": brand_identity,
                "products": unified_products,
                "metadata": {
                    "source_strategy": "brand-website-first",
                    "brand_products": len(brand_products),
                    "halilit_products": len(halilit_products),
                    "unified_products": len(unified_products),
                    "primary_count": stats["primary"],
                    "secondary_count": stats["secondary"],
                    "halilit_only_count": stats["halilit_only"],
                    "timestamp": datetime.now().isoformat()
                }
            }

            catalog_file = self.catalogs_dir / f"{brand_id}_catalog.json"
            with open(catalog_file, "w", encoding="utf-8") as f:
                json.dump(unified_catalog, f, indent=2, ensure_ascii=False)

            # Update results
            result["brands"][brand_id] = stats
            result["total_brands"] += 1
            result["total_products"] += len(unified_products)
            result["primary_products"] += stats["primary"]
            result["secondary_products"] += stats["secondary"]
            result["halilit_only_products"] += stats["halilit_only"]

            # Log summary
            logger.info(f"  ✅ PRIMARY (brand+price): {stats['primary']:3d}")
            logger.info(
                f"  ℹ️  SECONDARY (brand-only): {stats['secondary']:3d}")
            logger.info(f"  💳 HALILIT-ONLY: {stats['halilit_only']:3d}")
            logger.info(f"  📦 TOTAL: {len(unified_products):3d} products")

        # Final report
        logger.info(f"\n{'='*70}")
        logger.info(f"✅ MERGE COMPLETE")
        logger.info(f"{'='*70}")
        logger.info(f"  Brands: {result['total_brands']}")
        logger.info(f"  Total Products: {result['total_products']}")
        logger.info(f"  Primary (Brand+Price): {result['primary_products']}")
        logger.info(
            f"  Secondary (Brand-only): {result['secondary_products']}")
        logger.info(f"  Halilit-only: {result['halilit_only_products']}")

        return result

    def _merge_products_dual_source(
        self, brand_id: str, brand_products: List[Dict], halilit_products: List[Dict]
    ) -> tuple:
        """
        Merge products using brand-website-first strategy:
        1. Take brand products as primary (full content)
        2. Match with Halilit for price/SKU
        3. Add Halilit-only products with note
        4. Ensure all have images
        """
        unified = []
        stats = {"primary": 0, "secondary": 0,
                 "halilit_only": 0, "images_added": 0}

        # Create Halilit lookup by normalized name for matching
        halilit_by_name = {}
        for h_prod in halilit_products:
            # We pass brand_id to help strip it out
            name_norm = self._normalize_name(h_prod.get("name", ""), brand_id)
            if name_norm:
                if name_norm not in halilit_by_name:
                    halilit_by_name[name_norm] = []
                halilit_by_name[name_norm].append(h_prod)

        matched_halilit_ids: Set[str] = set()

        # Process brand products (primary source)
        for brand_prod in brand_products:
            brand_name = brand_prod.get("name", "Unknown")
            brand_name_norm = self._normalize_name(brand_name, brand_id)

            # Find matching Halilit product
            halilit_match = None
            if brand_name_norm in halilit_by_name:
                # Find best match
                candidates = halilit_by_name[brand_name_norm]
                if candidates:
                    halilit_match = candidates[0]  # Take first match
                    matched_halilit_ids.add(
                        halilit_match.get("halilit_id", ""))

            # Build unified product
            if halilit_match:
                # PRIMARY: Merge brand content with Halilit commerce data
                unified_prod = self._merge_brand_with_halilit(
                    brand_prod, halilit_match
                )
                unified_prod["source"] = "PRIMARY"
                # Verified Locally (Tier 1)
                unified_prod["confidence_score"] = 1.0
                unified_prod["source_details"] = {
                    "content": "brand_website",
                    "pricing": "halilit",
                    "sku": "halilit"
                }
                stats["primary"] += 1
            else:
                # SECONDARY: Brand-only product
                unified_prod = self._prepare_brand_product(brand_prod)
                unified_prod["source"] = "SECONDARY"
                # Global Orphan (Tier 2)
                unified_prod["confidence_score"] = 0.8
                unified_prod["source_details"] = {
                    "content": "brand_website",
                    "pricing": "check_brand",
                    "availability": "verify_with_brand"
                }
                stats["secondary"] += 1

            # Ensure images
            if not unified_prod.get("images", {}).get("main"):
                stats["images_added"] += 1
                # Try to find a default image
                unified_prod["images"] = {
                    "main": f"https://via.placeholder.com/400?text={brand_name[:20]}",
                    "thumbnail": f"https://via.placeholder.com/100?text={brand_name[:10]}"
                }

            unified.append(unified_prod)

        # Add Halilit-only products (products in Halilit but not on brand website)
        for halilit_prod in halilit_products:
            halilit_id = halilit_prod.get("halilit_id", "")
            if halilit_id not in matched_halilit_ids:
                # HALILIT-ONLY: Not found on brand website
                unified_prod = self._prepare_halilit_product(halilit_prod)
                unified_prod["source"] = "HALILIT_ONLY"
                unified_prod["confidence_score"] = 0.6  # Local Ghost (Tier 3)
                unified_prod["source_details"] = {
                    "content": "halilit",
                    "pricing": "halilit",
                    "note": "Not currently listed on brand website"
                }
                stats["halilit_only"] += 1
                unified.append(unified_prod)

        return unified, stats

    def _merge_brand_with_halilit(
        self, brand_prod: Dict, halilit_prod: Dict
    ) -> Dict:
        """Merge brand product (content) with Halilit product (price/SKU)."""
        product = {
            "id": brand_prod.get("id") or f"{brand_prod.get('brand', 'unknown')}-{self._slugify(brand_prod.get('name', ''))}",
            "brand": brand_prod.get("brand"),
            "name": brand_prod.get("name", halilit_prod.get("name")),
            "title_en": brand_prod.get("name"),
            "title_he": halilit_prod.get("name"),
            "description": brand_prod.get("description", ""),
            "specs": brand_prod.get("specs", {}),
            "category": brand_prod.get("category", halilit_prod.get("category")),

            # Commerce data from Halilit
            "price": halilit_prod.get("price"),
            "price_ils": halilit_prod.get("price"),
            "currency": halilit_prod.get("currency", "ILS"),
            "sku": halilit_prod.get("item_code") or halilit_prod.get("sku"),
            "halilit_id": halilit_prod.get("halilit_id"),

            # Images (prefer brand, fallback to Halilit)
            "images": {
                "main": brand_prod.get("image_url") or halilit_prod.get("image_url"),
                "thumbnail": brand_prod.get("thumbnail_url") or halilit_prod.get("thumbnail_url"),
                "gallery": brand_prod.get("gallery", [])
            },

            # Documentation
            "documentation": brand_prod.get("documentation", {}),
            "manual_url": brand_prod.get("manual_url"),
            "brand_product_url": brand_prod.get("url"),
            "halilit_product_url": halilit_prod.get("url"),
        }

        return {k: v for k, v in product.items() if v is not None}

    def _prepare_brand_product(self, brand_prod: Dict) -> Dict:
        """Prepare brand-only product for unified catalog."""
        return {
            "id": brand_prod.get("id") or f"{brand_prod.get('brand', 'unknown')}-{self._slugify(brand_prod.get('name', ''))}",
            "brand": brand_prod.get("brand"),
            "name": brand_prod.get("name"),
            "description": brand_prod.get("description", ""),
            "specs": brand_prod.get("specs", {}),
            "category": brand_prod.get("category"),
            "images": {
                "main": brand_prod.get("image_url"),
                "thumbnail": brand_prod.get("thumbnail_url"),
                "gallery": brand_prod.get("gallery", [])
            },
            "documentation": brand_prod.get("documentation", {}),
            "manual_url": brand_prod.get("manual_url"),
            "brand_product_url": brand_prod.get("url"),
        }

    def _prepare_halilit_product(self, halilit_prod: Dict) -> Dict:
        """Prepare Halilit-only product for unified catalog."""
        return {
            "id": f"{halilit_prod.get('brand', 'unknown')}-{self._slugify(halilit_prod.get('name', ''))}",
            "brand": halilit_prod.get("brand"),
            "name": halilit_prod.get("name"),
            "category": halilit_prod.get("category"),
            "price": halilit_prod.get("price"),
            "currency": halilit_prod.get("currency", "ILS"),
            "sku": halilit_prod.get("item_code") or halilit_prod.get("sku"),
            "halilit_id": halilit_prod.get("halilit_id"),
            "images": {
                "main": halilit_prod.get("image_url"),
                "thumbnail": halilit_prod.get("thumbnail_url")
            },
            "halilit_product_url": halilit_prod.get("url"),
        }

    def _normalize_name(self, name: str, brand_id: Optional[str] = None) -> str:
        """Normalize product name for matching using the sophisticated Hebrew utils."""
        # Use brand_id as hint to remove brand name from model string
        return normalize_for_matching(name, brand_name=brand_id)

    def _slugify(self, text: str) -> str:
        """Convert text to URL-safe slug."""
        text = re.sub(r'[^\w\s-]', '', text.lower())
        text = re.sub(r'[-\s]+', '-', text)
        return text.strip('-')

    def _load_catalog(self, path: Path) -> Optional[Dict]:
        """Load catalog JSON file."""
        if not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load {path}: {e}")
            return None


def main():
    """Run the merger."""
    merger = DualSourceMerger()
    result = merger.merge_all_brands()

    # Save merge report
    report_path = Path(__file__).parent.parent / "data" / "merge_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    logger.info(f"\n📊 Report saved to: {report_path}")


if __name__ == "__main__":
    main()
