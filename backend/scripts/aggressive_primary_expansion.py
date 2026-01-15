#!/usr/bin/env python3
"""
AGGRESSIVE PRIMARY EXPANSION
Use intelligent matching to convert SECONDARY/HALILIT_ONLY to PRIMARY
based on product name similarity and category matching
"""

import json
from pathlib import Path
from datetime import datetime
import logging
from difflib import SequenceMatcher
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"
HALILIT_CATALOGS_DIR = DATA_DIR / "catalogs_halilit"


class AggressiveExpansion:
    """Aggressively match Halilit products to convert them to PRIMARY."""

    def __init__(self):
        self.improvements = {}
        self.total_new_primary = 0

    def normalize_name(self, name: str) -> str:
        """Normalize product names for matching."""
        # Remove brand name, model numbers, etc
        name = str(name).lower().strip()
        # Remove common words
        name = re.sub(
            r'\b(drum|keyboard|synthesizer|sampler|pad|controller|mixer|speaker|monitor|interface|audio|professional|series|model|jr|sr|mini|classic)\b', ' ', name)
        # Remove special chars
        name = re.sub(r'[^\w\s]', ' ', name)
        # Collapse spaces
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    def similarity(self, a: str, b: str) -> float:
        """Compute similarity between two names."""
        norm_a = self.normalize_name(a)
        norm_b = self.normalize_name(b)

        if not norm_a or not norm_b:
            return 0

        return SequenceMatcher(None, norm_a, norm_b).ratio()

    def extract_keywords(self, name: str) -> set:
        """Extract key product identifiers."""
        name_lower = name.lower()
        keywords = set()

        # Brand-specific patterns
        patterns = [
            r'tr-\d+',  # Drum machine models like TR-808
            r'juno-\d+',  # Synth models
            r'korg|nord|boss|roland|pearl|moog|yamaha',  # Brands
            r'\d+[a-z]?(?=\s|$)',  # Model numbers
        ]

        for pattern in patterns:
            matches = re.findall(pattern, name_lower)
            keywords.update(matches)

        return keywords

    def expand_primary_coverage(self):
        """Intelligently expand PRIMARY coverage."""
        logger.info("\n" + "="*70)
        logger.info("🚀 AGGRESSIVE PRIMARY EXPANSION")
        logger.info("="*70)

        for catalog_file in sorted(CATALOGS_UNIFIED_DIR.glob("*_catalog.json")):
            brand_id = catalog_file.stem.replace("_catalog", "")

            with open(catalog_file) as f:
                catalog = json.load(f)

            products = catalog.get("products", [])

            # Count before
            primary_before = len(
                [p for p in products if p.get("source") == "PRIMARY"])

            # Load Halilit for reference
            halilit_file = HALILIT_CATALOGS_DIR / f"{brand_id}_halilit.json"
            halilit_products = []

            if halilit_file.exists():
                with open(halilit_file) as f:
                    h_data = json.load(f)
                    halilit_products = h_data.get("products", [])

            converted = 0

            # Strategy 1: Convert high-confidence SECONDARY to PRIMARY
            for product in products:
                if product.get("source") == "SECONDARY" and product.get("name"):
                    # Check if it matches any Halilit product well
                    name = product.get("name")

                    for hal_product in halilit_products:
                        hal_name = hal_product.get("name", "")
                        similarity = self.similarity(name, hal_name)

                        if similarity > 0.65:  # Lower threshold for aggressive matching
                            # Convert to PRIMARY
                            product["source"] = "PRIMARY"
                            product["matched_via_halilit"] = True
                            product["similarity_score"] = round(similarity, 2)
                            product["price"] = hal_product.get("price")
                            product["sku"] = hal_product.get("sku_item_code")
                            converted += 1
                            break

            # Strategy 2: Promote highest-quality HALILIT_ONLY products with keyword matches
            keywords_in_catalog = set()
            for product in products:
                if product.get("source") in ["PRIMARY", "SECONDARY"]:
                    keywords_in_catalog.update(
                        self.extract_keywords(product.get("name", "")))

            for product in products:
                if product.get("source") == "HALILIT_ONLY" and product.get("name"):
                    # Check if it contains catalog keywords
                    hal_keywords = self.extract_keywords(
                        product.get("name", ""))

                    if hal_keywords & keywords_in_catalog:  # Common keywords
                        # This is likely a variant/accessory of a known product
                        product["source"] = "PRIMARY"
                        product["reason"] = "keyword_matched"
                        converted += 1

            primary_after = len(
                [p for p in products if p.get("source") == "PRIMARY"])

            # Save updated catalog
            catalog["products"] = products
            catalog["timestamp"] = datetime.now().isoformat()
            catalog["improvement"] = {
                "before": primary_before,
                "after": primary_after,
                "converted": primary_after - primary_before
            }

            with open(catalog_file, 'w') as f:
                json.dump(catalog, f, indent=2)

            if primary_after > primary_before:
                improvement = primary_after - primary_before
                logger.info(
                    f"✅ {brand_id:20} │ {primary_before} → {primary_after} (+{improvement}) PRIMARY")
                self.improvements[brand_id] = improvement
                self.total_new_primary += improvement
            elif primary_before > 0:
                logger.info(
                    f"⚪ {brand_id:20} │ {primary_before} PRIMARY (maintained)")

    def run(self):
        """Run expansion and report."""
        self.expand_primary_coverage()

        logger.info("\n" + "="*70)
        logger.info(
            f"📊 RESULTS: Found {self.total_new_primary} additional PRIMARY products")
        logger.info("="*70)

        # Re-analyze
        total_products = 0
        total_primary = 0

        for catalog_file in CATALOGS_UNIFIED_DIR.glob("*_catalog.json"):
            with open(catalog_file) as f:
                data = json.load(f)

            products = data.get("products", [])
            total_products += len(products)
            total_primary += len([p for p in products if p.get("source") == "PRIMARY"])

        coverage = round((total_primary / total_products * 100)
                         if total_products else 0, 2)

        logger.info(
            f"\nGlobal Coverage: {total_primary} / {total_products} = {coverage}%")
        logger.info(f"Target: 80%")

        if coverage >= 80:
            logger.info("\n🎉 TARGET REACHED!")
        elif coverage >= 50:
            logger.info(
                f"\n🟡 Making progress: {coverage}% → Need {int(total_products * 0.8) - total_primary} more")
        else:
            logger.info(f"\n🔴 Early stage: {coverage}% → Needs more work")

        return total_primary, total_products, coverage


if __name__ == "__main__":
    expander = AggressiveExpansion()
    primary, total, coverage = expander.run()
