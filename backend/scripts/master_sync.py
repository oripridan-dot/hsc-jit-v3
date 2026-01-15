#!/usr/bin/env python3
"""
Master Synchronization System - HSC JIT v3.5

Syncs Halilit's official product catalog with brand websites:

Flow:
1. Load official Halilit brands list
2. Scrape Halilit's inventory for each brand (PRIMARY SOURCE)
3. Scrape brand websites for full product lines (REFERENCE)
4. Generate gap analysis (products not in Halilit)
5. Build unified catalog with dual sources

Single Source of Truth: https://www.halilit.com/pages/4367
"""

from scripts.gap_analyzer import BrandGapAnalyzer
from app.services.harvester import HarvesterService
from scripts.diplomat import Diplomat
from scripts.halilit_scraper import HalilitScraper
import asyncio
import json
from pathlib import Path
from typing import Dict, List, Any
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))


class MasterSynchronizer:
    """Master orchestrator for dual-source system"""

    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "data"
        self.brands_file = self.data_dir / "halilit_official_brands.json"
        self.halilit_scraper = HalilitScraper()
        self.gap_analyzer = BrandGapAnalyzer()
        self.diplomat = Diplomat()
        self.harvester = HarvesterService()
        self.results = {
            "halilit_scrapes": [],
            "brand_scrapes": [],
            "gap_analyses": []
        }

    def load_official_brands(self) -> List[Dict[str, Any]]:
        """Load official Halilit brands"""
        if not self.brands_file.exists():
            print("❌ Official brands file not found!")
            return []

        with open(self.brands_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('brands', [])

    async def sync_brand(self, brand: Dict[str, Any]) -> Dict[str, Any]:
        """
        Full sync for one brand:
        1. Scrape Halilit (PRIMARY)
        2. Scrape brand website (REFERENCE)
        3. Analyze gaps
        """
        brand_id = brand['id']
        brand_name = brand['name']
        halilit_url = brand['url']

        print(f"\n{'='*80}")
        print(f"🎯 SYNCING: {brand_name} ({brand_id})")
        print(f"{'='*80}")

        sync_result = {
            "brand_id": brand_id,
            "brand_name": brand_name,
            "halilit_success": False,
            "brand_website_success": False,
            "gap_analysis_success": False,
            "halilit_products": 0,
            "brand_products": 0,
            "gap_products": 0,
            "errors": []
        }

        # STEP 1: Scrape Halilit's official inventory (PRIMARY SOURCE)
        print(f"\n📦 [STEP 1] Scraping Halilit's inventory...")
        try:
            halilit_result = await self.halilit_scraper.scrape_brand(
                brand_id,
                halilit_url,
                max_pages=20
            )

            if halilit_result['total_products'] > 0:
                self.halilit_scraper.save_catalog(brand_id, halilit_result)
                sync_result['halilit_success'] = True
                sync_result['halilit_products'] = halilit_result['total_products']
                print(
                    f"✅ Halilit: {halilit_result['total_products']} products")
            else:
                print(f"⚠️  Halilit: No products found")
                sync_result['errors'].append("No products found on Halilit")

        except Exception as e:
            print(f"❌ Halilit error: {e}")
            sync_result['errors'].append(str(e))

        # STEP 2: Scrape brand website for full product line (REFERENCE)
        print(f"\n🌐 [STEP 2] Scraping brand website...")
        try:
            # Check if brand config exists
            config_path = self.data_dir / "brands" / brand_id / "scrape_config.json"

            if not config_path.exists():
                print(f"   🤖 Generating scrape config with Diplomat...")
                # Try to generate config with Diplomat
                brand_website = brand.get('website', '')
                if brand_website:
                    config = await self.diplomat.analyze_website(brand_website, brand_id)
                    if config:
                        self.diplomat.save_config(config, brand_id)
                        print(f"   ✅ Config generated")
                    else:
                        print(f"   ⚠️  Could not generate config")
                else:
                    print(f"   ⚠️  No website URL available")

            # Try to harvest from brand website
            if config_path.exists():
                harvest_result = await self.harvester.harvest_brand(brand_id, max_pages=20)

                if harvest_result['success']:
                    sync_result['brand_website_success'] = True
                    sync_result['brand_products'] = harvest_result['products_found']
                    print(
                        f"✅ Brand website: {harvest_result['products_found']} products")
                else:
                    print(
                        f"⚠️  Brand website: {harvest_result.get('error', 'Unknown error')}")
                    sync_result['errors'].append(
                        harvest_result.get('error', 'Harvest failed'))
            else:
                print(f"⚠️  Brand website: No scrape config available")

        except Exception as e:
            print(f"❌ Brand website error: {e}")
            sync_result['errors'].append(str(e))

        # STEP 3: Analyze gaps
        print(f"\n📊 [STEP 3] Analyzing gaps...")
        try:
            gap_report = self.gap_analyzer.analyze_brand(brand_id)
            self.gap_analyzer.save_gap_report(brand_id, gap_report)

            sync_result['gap_analysis_success'] = True
            sync_result['gap_products'] = gap_report['gap_count']
            sync_result['coverage_percentage'] = gap_report['coverage_percentage']

            print(f"✅ Gap analysis complete")
            print(f"   Coverage: {gap_report['coverage_percentage']:.1f}%")

        except Exception as e:
            print(f"⚠️  Gap analysis: {e}")
            sync_result['errors'].append(str(e))

        # Summary for this brand
        print(f"\n📈 SUMMARY: {brand_name}")
        print(f"   Halilit: {sync_result['halilit_products']} products")
        print(f"   Brand site: {sync_result['brand_products']} products")
        print(f"   Gap: {sync_result['gap_products']} products")

        return sync_result

    async def sync_all_brands(self, brands: List[Dict[str, Any]]) -> None:
        """Sync all priority brands"""
        print(
            f"\n🚀 Starting dual-source synchronization for {len(brands)} brands\n")

        for i, brand in enumerate(brands, 1):
            print(f"\n[{i}/{len(brands)}] Syncing {brand['name']}...")
            result = await self.sync_brand(brand)
            self.results['gap_analyses'].append(result)

            # Brief pause between brands
            await asyncio.sleep(2)

        self._print_final_summary()

    def _print_final_summary(self) -> None:
        """Print final summary"""
        results = self.results['gap_analyses']

        total = len(results)
        halilit_success = sum(1 for r in results if r['halilit_success'])
        brand_success = sum(1 for r in results if r['brand_website_success'])
        gap_success = sum(1 for r in results if r['gap_analysis_success'])

        total_halilit = sum(r['halilit_products'] for r in results)
        total_brand = sum(r['brand_products'] for r in results)
        total_gap = sum(r['gap_products'] for r in results)

        print(f"\n{'='*80}")
        print(f"📊 SYNCHRONIZATION COMPLETE")
        print(f"{'='*80}\n")

        print(f"Brands Processed: {total}")
        print(f"\n✅ Halilit Scrapes: {halilit_success}/{total} successful")
        print(f"✅ Brand Scrapes: {brand_success}/{total} successful")
        print(f"✅ Gap Analyses: {gap_success}/{total} successful")

        print(f"\n📦 Inventory Summary:")
        print(f"   Halilit (PRIMARY): {total_halilit} products")
        print(f"   Brand Websites: {total_brand} products")
        print(
            f"   Coverage Gap: {total_gap} products ({(total_gap/total_brand*100):.1f}%)")

        print(f"\n💾 Output Files Generated:")
        print(f"   - Halilit catalogs: data/catalogs_halilit/")
        print(f"   - Gap reports: data/gap_reports/")
        print(f"   - Summary: data/gap_reports/summary_gap_report.json")

        print(f"\n{'='*80}")

    def save_sync_results(self) -> None:
        """Save all sync results"""
        results_file = self.data_dir / "sync_results.json"

        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)

        print(f"💾 Detailed results saved: {results_file}")


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Master synchronization system for Halilit + Brand catalogs"
    )
    parser.add_argument(
        "--brands",
        nargs="+",
        help="Specific brand IDs to sync (e.g., --brands roland nord boss)"
    )
    parser.add_argument(
        "--priority",
        action="store_true",
        help="Sync only priority brands"
    )

    args = parser.parse_args()

    # Load official brands
    synchronizer = MasterSynchronizer()
    official_brands = synchronizer.load_official_brands()

    if not official_brands:
        print("❌ No official brands loaded!")
        return

    print(f"✅ Loaded {len(official_brands)} official Halilit brands\n")

    # Determine which brands to sync
    if args.brands:
        # Sync specific brands
        brands_to_sync = [b for b in official_brands if b['id'] in args.brands]
        print(f"🎯 Syncing {len(brands_to_sync)} specified brands\n")

    elif args.priority:
        # Sync only priority brands
        priority_ids = [
            'roland', 'nord', 'oberheim',
            'presonus', 'm-audio', 'akai-professional',
            'adam-audio', 'krk-systems', 'dynaudio',
            'boss', 'headrush-fx', 'xotic',
            'rcf', 'mackie',
            'pearl', 'rogers', 'paiste-cymbals', 'remo'
        ]
        brands_to_sync = [
            b for b in official_brands if b['id'] in priority_ids]
        print(f"🎯 Syncing {len(brands_to_sync)} priority brands\n")

    else:
        # Default: sync all
        brands_to_sync = official_brands
        print(f"🎯 Syncing all {len(brands_to_sync)} brands\n")

    # Run synchronization
    try:
        await synchronizer.sync_all_brands(brands_to_sync)
        synchronizer.save_sync_results()

    except KeyboardInterrupt:
        print("\n\n⚠️  Synchronization interrupted")
        synchronizer.save_sync_results()

    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
