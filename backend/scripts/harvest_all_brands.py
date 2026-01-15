#!/usr/bin/env python3
"""
Automated brand harvesting using Diplomat (AI config generator) + Harvester (scraper).
This script processes multiple brands sequentially to build the product catalog.
"""

from app.services.harvester import HarvesterService
from scripts.diplomat import Diplomat
import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# Brands to harvest with their product pages
BRANDS_TO_HARVEST = [
    {"id": "roland", "name": "Roland",
        "url": "https://www.roland.com/us/categories/pianos/", "max_pages": 10},
    {"id": "nord", "name": "Nord",
        "url": "https://www.nordkeyboards.com/products/", "max_pages": 5},
    {"id": "moog", "name": "Moog",
        "url": "https://www.moogmusic.com/products", "max_pages": 5},
    {"id": "yamaha", "name": "Yamaha",
        "url": "https://usa.yamaha.com/products/music_production/synthesizers/index.html", "max_pages": 10},
    {"id": "korg", "name": "Korg",
        "url": "https://www.korg.com/us/products/synthesizers/", "max_pages": 10},
    {"id": "arturia", "name": "Arturia",
        "url": "https://www.arturia.com/products", "max_pages": 5},
]


class BrandHarvestOrchestrator:
    """Orchestrates the full harvest pipeline: Diplomat → Harvester → Catalog"""

    def __init__(self):
        self.results: List[Dict] = []
        self.diplomat = None
        self.harvester = None

    async def harvest_brand(self, brand: Dict) -> Dict:
        """
        Full pipeline for one brand:
        1. Use Diplomat to generate scrape_config.json (AI-powered)
        2. Use Harvester to scrape products using the config
        3. Return results
        """
        brand_id = brand["id"]
        brand_name = brand["name"]
        url = brand["url"]
        max_pages = brand.get("max_pages", 5)

        print(f"\n{'='*80}")
        print(f"🎯 Processing: {brand_name} ({brand_id})")
        print(f"📍 URL: {url}")
        print(f"{'='*80}\n")

        result = {
            "brand_id": brand_id,
            "brand_name": brand_name,
            "url": url,
            "diplomat_success": False,
            "harvest_success": False,
            "products_found": 0,
            "error": None
        }

        # Step 1: Generate config with Diplomat (AI)
        print(f"🤖 [STEP 1] Running Diplomat AI to analyze website...")
        try:
            if not self.diplomat:
                self.diplomat = Diplomat()

            config = await self.diplomat.analyze_website(url, brand_id)
            if config:
                config_path = self.diplomat.save_config(config, brand_id)
                if config_path and config_path.exists():
                    print(f"✅ Config generated: {config_path}")
                    result["diplomat_success"] = True
                else:
                    print(f"⚠️  Config save failed - will try manual harvest")
                    result["error"] = "Config save failed"
            else:
                print(f"⚠️  Diplomat failed - will try manual harvest")
                result["error"] = "Diplomat config generation failed"
        except Exception as e:
            print(f"❌ Diplomat error: {e}")
            result["error"] = str(e)

        # Step 2: Harvest with the generated config (or manual fallback)
        print(f"\n🌾 [STEP 2] Running Harvester to scrape products...")
        try:
            if not self.harvester:
                self.harvester = HarvesterService()

            harvest_result = await self.harvester.harvest_brand(brand_id, max_pages)

            if harvest_result["success"]:
                products_found = harvest_result["products_found"]
                print(f"✅ Harvest complete: {products_found} products")
                result["harvest_success"] = True
                result["products_found"] = products_found
            else:
                error = harvest_result.get("error", "Unknown error")
                print(f"❌ Harvest failed: {error}")
                result["error"] = error
        except Exception as e:
            print(f"❌ Harvest error: {e}")
            result["error"] = str(e)

        # Summary
        if result["harvest_success"]:
            print(
                f"\n🎉 SUCCESS: {brand_name} → {result['products_found']} products")
        else:
            print(
                f"\n❌ FAILED: {brand_name} → {result.get('error', 'Unknown error')}")

        return result

    async def harvest_all(self, brands: List[Dict]) -> List[Dict]:
        """Process all brands sequentially"""
        print(f"\n🚀 Starting harvest for {len(brands)} brands...\n")

        for brand in brands:
            result = await self.harvest_brand(brand)
            self.results.append(result)

            # Small delay between brands to be polite
            await asyncio.sleep(2)

        return self.results

    def print_summary(self):
        """Print final summary of all harvests"""
        print(f"\n{'='*80}")
        print(f"📊 HARVEST SUMMARY")
        print(f"{'='*80}\n")

        total = len(self.results)
        successful = sum(1 for r in self.results if r["harvest_success"])
        failed = total - successful
        total_products = sum(r["products_found"] for r in self.results)

        print(f"Total Brands: {total}")
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"📦 Total Products: {total_products}\n")

        print("Per-Brand Results:")
        print("-" * 80)
        for r in self.results:
            status = "✅" if r["harvest_success"] else "❌"
            print(
                f"{status} {r['brand_name']:20} → {r['products_found']:3} products")

        if failed > 0:
            print("\nFailed Brands:")
            print("-" * 80)
            for r in self.results:
                if not r["harvest_success"]:
                    print(
                        f"❌ {r['brand_name']:20} → {r.get('error', 'Unknown error')}")


async def main():
    """Main entry point"""
    orchestrator = BrandHarvestOrchestrator()

    try:
        await orchestrator.harvest_all(BRANDS_TO_HARVEST)
        orchestrator.print_summary()

        # Save results to file
        results_file = Path(__file__).parent.parent / \
            "data" / "harvest_results.json"
        results_file.parent.mkdir(parents=True, exist_ok=True)
        with open(results_file, "w") as f:
            json.dump(orchestrator.results, f, indent=2)

        print(f"\n💾 Results saved to: {results_file}")

    except KeyboardInterrupt:
        print("\n\n⚠️  Harvest interrupted by user")
        orchestrator.print_summary()
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
