"""
Data Maintenance & Optimization System - v3.7.0
=============================================

Automated maintenance tasks:
- Keep data fresh (re-scrape on schedule)
- Optimize embeddings
- Clean up orphaned files
- Generate analytics
"""

import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List
import hashlib

logger = logging.getLogger(__name__)


class MaintenanceSystem:
    """Automated data maintenance and optimization"""

    def __init__(self, data_dir: Path = None):
        if data_dir is None:
            data_dir = Path(__file__).resolve().parents[1] / "data"

        self.data_dir = Path(data_dir)
        self.catalogs_dir = self.data_dir / "catalogs"
        self.maintenance_log = self.data_dir / "maintenance_log.json"

        self.log_entries = self._load_log()

    def _load_log(self) -> List[dict]:
        """Load maintenance log"""
        if not self.maintenance_log.exists():
            return []

        try:
            with open(self.maintenance_log, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Log load error: {e}")
            return []

    def _save_log(self):
        """Save maintenance log"""
        try:
            with open(self.maintenance_log, 'w') as f:
                json.dump(self.log_entries, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Log save error: {e}")

    async def check_data_freshness(self) -> Dict[str, bool]:
        """Check which brands need updates"""
        freshness = {}
        max_age_days = 7  # Re-scrape after 7 days

        for catalog_file in self.catalogs_dir.glob("*_catalog.json"):
            brand_id = catalog_file.stem.replace("_catalog", "")

            try:
                with open(catalog_file, 'r') as f:
                    catalog = json.load(f)

                last_updated = datetime.fromisoformat(
                    catalog.get('last_updated'))
                age = datetime.now() - last_updated

                needs_update = age > timedelta(days=max_age_days)
                freshness[brand_id] = not needs_update

                if needs_update:
                    logger.info(
                        f"⚠️ {brand_id} is {age.days} days old (needs update)")

            except Exception as e:
                logger.error(f"Freshness check error for {brand_id}: {e}")
                freshness[brand_id] = False

        return freshness

    async def optimize_embeddings(self):
        """Optimize RAG embeddings for faster search"""
        embeddings_dir = self.data_dir / "rag_embeddings"

        if not embeddings_dir.exists():
            logger.info("No embeddings to optimize")
            return

        logger.info("🔧 Optimizing embeddings...")

        for embedding_file in embeddings_dir.glob("*_embeddings.json"):
            try:
                with open(embedding_file, 'r') as f:
                    data = json.load(f)

                # Remove duplicate snippets based on content hash
                snippets = data.get('snippets', [])
                unique_snippets = {}

                for snippet in snippets:
                    content_hash = hashlib.md5(
                        snippet['content'].encode()
                    ).hexdigest()

                    if content_hash not in unique_snippets:
                        unique_snippets[content_hash] = snippet

                # Update if duplicates found
                if len(unique_snippets) < len(snippets):
                    data['snippets'] = list(unique_snippets.values())
                    data['total_snippets'] = len(unique_snippets)

                    with open(embedding_file, 'w') as f:
                        json.dump(data, f, indent=2, default=str)

                    logger.info(
                        f"   {embedding_file.stem}: {len(snippets)} -> {len(unique_snippets)}")

            except Exception as e:
                logger.error(f"Optimization error: {e}")

    async def cleanup_orphaned_files(self):
        """Remove files for products that no longer exist"""
        logger.info("🧹 Cleaning up orphaned files...")

        # Get all valid product IDs from catalogs
        valid_product_ids = set()

        for catalog_file in self.catalogs_dir.glob("*_catalog.json"):
            try:
                with open(catalog_file, 'r') as f:
                    catalog = json.load(f)

                for product in catalog.get('products', []):
                    valid_product_ids.add(product['id'])
            except Exception as e:
                logger.error(f"Catalog read error: {e}")

        logger.info(f"   Valid products: {len(valid_product_ids)}")

        # Check embeddings directory
        embeddings_dir = self.data_dir / "rag_embeddings"
        if embeddings_dir.exists():
            for embedding_file in embeddings_dir.glob("*_embeddings.json"):
                product_id = embedding_file.stem.replace("_embeddings", "")

                if product_id not in valid_product_ids:
                    logger.info(f"   Removing orphaned: {embedding_file.name}")
                    embedding_file.unlink()

        # Check manuals directory
        manuals_dir = self.data_dir / "manuals"
        if manuals_dir.exists():
            for manual_file in manuals_dir.glob("*_manual.pdf"):
                product_id = manual_file.stem.replace("_manual", "")

                if product_id not in valid_product_ids:
                    logger.info(f"   Removing orphaned: {manual_file.name}")
                    manual_file.unlink()

    async def generate_analytics(self) -> Dict:
        """Generate system analytics"""
        logger.info("📊 Generating analytics...")

        analytics = {
            'timestamp': datetime.now().isoformat(),
            'brands': {},
            'totals': {
                'brands': 0,
                'products': 0,
                'with_pricing': 0,
                'with_rag': 0,
                'with_accessories': 0,
                'documentation_snippets': 0
            }
        }

        for catalog_file in self.catalogs_dir.glob("*_catalog.json"):
            brand_id = catalog_file.stem.replace("_catalog", "")

            try:
                with open(catalog_file, 'r') as f:
                    catalog = json.load(f)

                brand_stats = {
                    'total_products': catalog.get('total_products', 0),
                    'coverage_stats': catalog.get('coverage_stats', {}),
                    'rag_enabled': catalog.get('rag_enabled', False),
                    'last_updated': catalog.get('last_updated')
                }

                analytics['brands'][brand_id] = brand_stats

                # Update totals
                analytics['totals']['brands'] += 1
                analytics['totals']['products'] += brand_stats['total_products']

                if brand_stats.get('coverage_stats'):
                    analytics['totals']['with_pricing'] += brand_stats['coverage_stats'].get(
                        'with_pricing', 0)
                    analytics['totals']['with_rag'] += brand_stats['coverage_stats'].get(
                        'with_rag', 0)
                    analytics['totals']['with_accessories'] += brand_stats['coverage_stats'].get(
                        'with_accessories', 0)

                analytics['totals']['documentation_snippets'] += catalog.get(
                    'total_documentation_snippets', 0)

            except Exception as e:
                logger.error(f"Analytics error for {brand_id}: {e}")

        # Save analytics
        analytics_file = self.data_dir / "system_analytics.json"
        with open(analytics_file, 'w') as f:
            json.dump(analytics, f, indent=2, default=str)

        logger.info(f"✅ Analytics saved: {analytics_file}")

        return analytics

    async def run_maintenance(self):
        """Run all maintenance tasks"""
        logger.info(f"\n{'='*60}")
        logger.info("🔧 Starting maintenance tasks")
        logger.info(f"{'='*60}\n")

        start_time = datetime.now()

        # Task 1: Check freshness
        logger.info("Task 1: Checking data freshness")
        freshness = await self.check_data_freshness()
        stale_brands = [b for b, fresh in freshness.items() if not fresh]

        if stale_brands:
            logger.info(
                f"⚠️ {len(stale_brands)} brands need updates: {', '.join(stale_brands)}")
        else:
            logger.info("✅ All data is fresh")

        # Task 2: Optimize embeddings
        logger.info("\nTask 2: Optimizing embeddings")
        await self.optimize_embeddings()
        logger.info("✅ Embeddings optimized")

        # Task 3: Cleanup
        logger.info("\nTask 3: Cleaning up orphaned files")
        await self.cleanup_orphaned_files()
        logger.info("✅ Cleanup complete")

        # Task 4: Analytics
        logger.info("\nTask 4: Generating analytics")
        analytics = await self.generate_analytics()
        logger.info("✅ Analytics generated")

        # Log maintenance run
        duration = (datetime.now() - start_time).total_seconds()
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration,
            'stale_brands': stale_brands,
            'analytics': analytics['totals']
        }

        self.log_entries.append(log_entry)
        self._save_log()

        logger.info(f"\n{'='*60}")
        logger.info(f"✅ Maintenance completed in {duration:.1f}s")
        logger.info(f"{'='*60}\n")

        # Print summary
        print("\n📊 System Summary:")
        print(f"   Brands: {analytics['totals']['brands']}")
        print(f"   Products: {analytics['totals']['products']}")
        print(f"   With pricing: {analytics['totals']['with_pricing']}")
        print(f"   With RAG: {analytics['totals']['with_rag']}")
        print(
            f"   Total documentation snippets: {analytics['totals']['documentation_snippets']}")

        return log_entry


async def main():
    """Run maintenance"""
    maintenance = MaintenanceSystem()
    await maintenance.run_maintenance()


if __name__ == "__main__":
    asyncio.run(main())
