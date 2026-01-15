#!/usr/bin/env python3
"""
DUAL-SOURCE ORCHESTRATOR: Complete Brand Website + Halilit Sync

Workflow:
1. Scrape brand websites for product details (name, specs, images, manuals)
2. Load Halilit data for pricing and SKU
3. Merge using dual-source strategy: Brand-First + Halilit Commerce Data
4. Output: Catalogs with:
   - Product content from brand websites
   - Pricing & SKU from Halilit
   - High-quality images from both sources
"""

import asyncio
import json
import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)8s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


class DualSourceOrchestrator:
    """Orchestrates complete dual-source product synchronization."""

    def __init__(self, data_dir: Optional[Path] = None):
        # Default to the backend/data directory adjacent to this script
        if data_dir is None:
            backend_dir = Path(__file__).resolve().parents[1]
            data_dir = backend_dir / "data"

        self.data_dir = Path(data_dir)
        self.backend_dir = self.data_dir.parent

        # Import services
        sys.path.insert(0, str(self.backend_dir))
        from scripts.brand_website_scraper import BrandWebsiteScraper
        from scripts.halilit_scraper import HalilitScraper
        from scripts.dual_source_merger import DualSourceMerger

        # BrandWebsiteScraper and DualSourceMerger support custom data directories; HalilitScraper
        # currently uses its internal default path (backend/data), so we instantiate it without
        # arguments to match its signature.
        self.scraper = BrandWebsiteScraper(self.data_dir)
        self.halilit_scraper = HalilitScraper()
        self.merger = DualSourceMerger(self.data_dir)

    async def run_full_sync(self, brands: Optional[list] = None):
        """Execute complete sync: scrape brands, load Halilit, merge."""
        logger.info("\n" + "="*80)
        logger.info("🔄 DUAL-SOURCE ORCHESTRATOR: Starting Complete Sync")
        logger.info("="*80)

        # Get list of brands to sync
        if brands is None:
            brands = self._get_all_brands()

        result = {
            "timestamp": datetime.now().isoformat(),
            "total_brands": len(brands),
            "brands_synced": 0,
            "brands_failed": 0,
            "summary": {}
        }

        for i, brand_id in enumerate(sorted(brands), 1):
            logger.info(f"\n{'─'*80}")
            logger.info(f"[{i}/{len(brands)}] Processing: {brand_id.upper()}")
            logger.info(f"{'─'*80}")

            try:
                # Step 1: Scrape brand website
                logger.info(f"  [1/3] Scraping brand website...")
                brand_data = await self._scrape_brand_website(brand_id)
                brand_products = len(brand_data.get("products", []))
                logger.info(f"        ✅ Found {brand_products} products")

                # Step 2: Load Halilit data
                logger.info(f"  [2/3] Loading Halilit pricing data...")
                halilit_data = self._load_halilit_data(brand_id)
                halilit_products = len(halilit_data.get(
                    "products", []) if halilit_data else [])
                logger.info(f"        ✅ Found {halilit_products} products")

                # Step 3: Merge (brand-first strategy)
                logger.info(
                    f"  [3/3] Merging: Brand Content + Halilit Commerce...")
                merged_count = await self._merge_brand_data(brand_id, brand_products, halilit_products)
                logger.info(
                    f"        ✅ Created {merged_count} unified products")

                result["brands_synced"] += 1
                result["summary"][brand_id] = {
                    "status": "success",
                    "brand_products": brand_products,
                    "halilit_products": halilit_products,
                    "unified_products": merged_count
                }

            except Exception as e:
                logger.error(f"  ❌ Failed: {e}")
                result["brands_failed"] += 1
                result["summary"][brand_id] = {
                    "status": "failed",
                    "error": str(e)
                }

        # Final summary
        logger.info("\n" + "="*80)
        logger.info("✅ SYNC COMPLETE")
        logger.info("="*80)
        logger.info(
            f"  Brands Synced: {result['brands_synced']}/{len(brands)}")
        logger.info(
            f"  Brands Failed: {result['brands_failed']}/{len(brands)}")
        logger.info(f"  Timestamp: {result['timestamp']}")

        # Save orchestration report
        report_path = self.data_dir / "orchestration_report.json"
        with open(report_path, "w") as f:
            json.dump(result, f, indent=2)
        logger.info(f"\n  📊 Report: {report_path}")

        return result

    async def _scrape_brand_website(self, brand_id: str) -> Dict[str, Any]:
        """Scrape brand website for product data."""
        # Load brand config
        config = self._load_brand_config(brand_id)
        if not config:
            logger.warning(
                f"    ⚠️  No config for {brand_id}, skipping scrape")
            return {"brand_id": brand_id, "products": [], "status": "no_config"}

        # Get product list URL from config
        product_list_url = config.get("base_url")
        if not product_list_url:
            logger.warning(f"    ⚠️  No product list URL for {brand_id}")
            return {"brand_id": brand_id, "products": [], "status": "no_url"}

        # Scrape
        result = await self.scraper.scrape_brand(
            brand_id,
            product_list_url,
            max_products=500,
            config=config
        )

        return result

    def _load_halilit_data(self, brand_id: str) -> Optional[Dict]:
        """Load existing Halilit catalog for brand."""
        halilit_file = self.data_dir / \
            "catalogs_halilit" / f"{brand_id}_halilit.json"
        if not halilit_file.exists():
            logger.warning(f"    ⚠️  No Halilit data found for {brand_id}")
            return None

        try:
            with open(halilit_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"    ❌ Failed to load Halilit data: {e}")
            return None

    async def _merge_brand_data(self, brand_id: str, brand_count: int, halilit_count: int) -> int:
        """Run dual-source merger for this brand."""
        # Run merger on just this brand
        result = self.merger.merge_all_brands([brand_id])

        brand_result = result.get("brands", {}).get(brand_id, {})
        total_unified = brand_result.get(
            "primary", 0) + brand_result.get("secondary", 0) + brand_result.get("halilit_only", 0)

        return total_unified

    def _load_brand_config(self, brand_id: str) -> Optional[Dict]:
        """Load brand configuration (supports config.json or scrape_config.json)."""
        brand_dir = self.data_dir / "brands" / brand_id
        primary = brand_dir / "config.json"
        legacy = brand_dir / "scrape_config.json"

        config_file = primary if primary.exists() else legacy if legacy.exists() else None
        if not config_file:
            return None

        try:
            with open(config_file, "r") as f:
                return json.load(f)
        except Exception:
            return None

    def _get_all_brands(self) -> list:
        """Get list of all brands from both sources."""
        brands = set()

        # From Halilit data
        halilit_dir = self.data_dir / "catalogs_halilit"
        if halilit_dir.exists():
            brands.update(
                f.stem.replace("_halilit", "")
                for f in halilit_dir.glob("*_halilit.json")
            )

        # From brand configs
        brands_dir = self.data_dir / "brands"
        if brands_dir.exists():
            brands.update(d.name for d in brands_dir.iterdir() if d.is_dir())

        return list(brands)


async def main():
    """Run orchestrator."""
    orchestrator = DualSourceOrchestrator()

    # Run full sync
    await orchestrator.run_full_sync()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
