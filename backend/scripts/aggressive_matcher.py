#!/usr/bin/env python3
"""
AGGRESSIVE SCRAPING + RELAXED MATCHING
Strategy: Lower matching threshold + better product extraction
"""

import json
from pathlib import Path
from difflib import SequenceMatcher
import re
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"


class AggressiveMatcher:
    """Aggressive matching with lower threshold to maximize PRIMARY coverage."""

    def __init__(self, threshold=0.4):  # Lowered from 0.6 to 0.4
        self.threshold = threshold
        self.total_primary = 0
        self.total_products = 0

    def normalize_name(self, name: str) -> str:
        """Aggressively normalize product names."""
        name = name.lower()

        # Remove common noise words
        noise = ['products', 'country selector', 'oops', 'for international', 'orders',
                 'please visit', 'europe', 'gibson', 'krk', 'nord', 'mackie', 'presonus',
                 'roland', 'pearl', 'boss', 'remo', 'paiste', 'adam', 'audio',
                 'professional', 'cymbals', 'drums', 'systems']
        for word in noise:
            name = name.replace(word, ' ')

        # Keep only alphanumeric
        name = re.sub(r'[^a-z0-9\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()

        # Must have some content
        if len(name) < 3:
            return ""

        return name

    def similarity(self, a: str, b: str) -> float:
        """Calculate fuzzy similarity."""
        norm_a = self.normalize_name(a)
        norm_b = self.normalize_name(b)

        if not norm_a or not norm_b:
            return 0.0

        # Try exact word matching first
        words_a = set(norm_a.split())
        words_b = set(norm_b.split())

        if words_a and words_b:
            common_words = words_a & words_b
            word_match_score = len(common_words) / \
                max(len(words_a), len(words_b))

            # Also check sequence matching
            sequence_score = SequenceMatcher(None, norm_a, norm_b).ratio()

            # Return best of both
            return max(word_match_score, sequence_score)

        return SequenceMatcher(None, norm_a, norm_b).ratio()

    def match_brand(self, brand_id: str) -> dict:
        """Match brand products to Halilit with aggressive threshold."""
        print(f"🔗 {brand_id:20} ", end="")

        # Load Halilit (ground truth)
        halilit_file = CATALOGS_HALILIT_DIR / f"{brand_id}_halilit.json"
        if not halilit_file.exists():
            print("│ No Halilit data")
            return {"primary": 0, "secondary": 0, "halilit_only": 0, "total": 0}

        with open(halilit_file) as f:
            halilit_data = json.load(f)
        halilit_products = halilit_data.get("products", [])

        # Load brand scrape (if exists)
        brand_file = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
        brand_products = []
        if brand_file.exists():
            with open(brand_file) as f:
                brand_data = json.load(f)
            brand_products = brand_data.get("products", [])
            # Filter out noise
            brand_products = [p for p in brand_products if len(
                self.normalize_name(p.get("name", ""))) > 2]

        unified_products = []
        matched_halilit = set()

        # Match brand → Halilit
        for brand_product in brand_products:
            best_idx = None
            best_score = 0

            for idx, hal_product in enumerate(halilit_products):
                if idx in matched_halilit:
                    continue

                score = self.similarity(
                    brand_product.get("name", ""),
                    hal_product.get("name", "")
                )

                if score > best_score and score >= self.threshold:
                    best_score = score
                    best_idx = idx

            if best_idx is not None:
                # PRIMARY match
                matched = halilit_products[best_idx].copy()
                matched["source"] = "PRIMARY"
                matched["brand_match"] = brand_product.get("name")
                matched["match_score"] = round(best_score, 2)
                unified_products.append(matched)
                matched_halilit.add(best_idx)
            else:
                # SECONDARY (brand only)
                brand_product["source"] = "SECONDARY"
                unified_products.append(brand_product)

        # Add unmatched Halilit as HALILIT_ONLY
        for idx, hal_product in enumerate(halilit_products):
            if idx not in matched_halilit:
                hal_product["source"] = "HALILIT_ONLY"
                unified_products.append(hal_product)

        # Stats
        stats = {
            "primary": len([p for p in unified_products if p.get("source") == "PRIMARY"]),
            "secondary": len([p for p in unified_products if p.get("source") == "SECONDARY"]),
            "halilit_only": len([p for p in unified_products if p.get("source") == "HALILIT_ONLY"]),
            "total": len(unified_products)
        }

        # Save
        catalog = {
            "brand_id": brand_id,
            "total_products": len(unified_products),
            "products": unified_products,
            "statistics": stats,
            "timestamp": "2026-01-15T15:00:00",
            "status": "success"
        }

        CATALOGS_UNIFIED_DIR.mkdir(parents=True, exist_ok=True)
        output_file = CATALOGS_UNIFIED_DIR / f"{brand_id}_catalog.json"
        with open(output_file, 'w') as f:
            json.dump(catalog, f, indent=2)

        coverage = round(100 * stats["primary"] /
                         stats["total"], 1) if stats["total"] else 0
        status = "✅" if stats["primary"] > 0 else "❌"
        print(
            f"│ {status} {stats['primary']:3}/{stats['total']:3} │ {coverage:5.1f}%")

        self.total_primary += stats["primary"]
        self.total_products += stats["total"]

        return stats

    def match_all_brands(self):
        """Match all 18 brands."""
        logger.info("\n" + "=" * 70)
        logger.info(f"🚀 AGGRESSIVE MATCHING (threshold={self.threshold})")
        logger.info("=" * 70 + "\n")

        all_stats = {}
        for halilit_file in sorted(CATALOGS_HALILIT_DIR.glob("*_halilit.json")):
            brand_id = halilit_file.stem.replace("_halilit", "")
            stats = self.match_brand(brand_id)
            all_stats[brand_id] = stats

        # Summary
        logger.info("─" * 70)
        coverage = round(100 * self.total_primary /
                         self.total_products, 2) if self.total_products else 0
        logger.info(
            f"\n📊 TOTAL: {self.total_primary}/{self.total_products} PRIMARY = {coverage}%")

        if coverage >= 80:
            logger.info("✅ TARGET REACHED!")
        elif coverage >= 50:
            logger.info("🟡 GOOD PROGRESS")
        elif coverage >= 20:
            logger.info("🟠 NEEDS MORE WORK")
        else:
            logger.info("🔴 EARLY STAGE")

        return coverage, all_stats


if __name__ == "__main__":
    matcher = AggressiveMatcher(threshold=0.4)
    coverage, stats = matcher.match_all_brands()
