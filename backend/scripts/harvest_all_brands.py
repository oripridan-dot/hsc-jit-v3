#!/usr/bin/env python3
"""
Automated brand harvesting using Diplomat (AI config generator) + Harvester (scraper).
This script processes ONLY official Halilit-authorized brands from their website.

Source of Truth: https://www.halilit.com/pages/4367
"""

from scripts.diplomat import Diplomat
from app.services.harvester import HarvesterService
import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# Load official Halilit brands
def load_official_brands() -> List[Dict]:
    """Load the official Halilit brand list (single source of truth)"""
    brands_file = Path(__file__).parent.parent / "data" / \
        "halilit_official_brands.json"

    if not brands_file.exists():
        print("⚠️  Official brands file not found. Run extract_halilit_brands.py first!")
        return []

    with open(brands_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return data.get('brands', [])


# Priority brands to harvest (based on Halilit's key product lines)
# These are confirmed authorized brands from https://www.halilit.com/pages/4367
PRIORITY_BRANDS = [
    # Synthesizers & Digital Pianos
    {"id": "roland", "categories": [
        "synthesizers", "pianos", "drums"], "max_pages": 15},
    {"id": "nord", "categories": [
        "keyboards", "synthesizers"], "max_pages": 5},
    {"id": "oberheim", "categories": ["synthesizers"], "max_pages": 3},

    # Audio Interfaces & Controllers
    {"id": "presonus", "categories": [
        "audio-interfaces", "mixers"], "max_pages": 10},
    {"id": "m-audio",
        "categories": ["audio-interfaces", "midi"], "max_pages": 10},
    {"id": "akai-professional",
        "categories": ["midi-controllers"], "max_pages": 8},

    # Studio Monitors
    {"id": "adam-audio", "categories": ["monitors"], "max_pages": 5},
    {"id": "krk-systems", "categories": ["monitors"], "max_pages": 5},
    {"id": "dynaudio", "categories": ["monitors"], "max_pages": 5},

    # Guitar Effects
    {"id": "boss", "categories": ["effects"], "max_pages": 15},
    {"id": "headrush-fx", "categories": ["effects"], "max_pages": 5},
    {"id": "xotic", "categories": ["effects"], "max_pages": 3},

    # PA Systems
    {"id": "rcf", "categories": ["pa-systems"], "max_pages": 10},
    {"id": "mackie", "categories": ["pa-systems", "mixers"], "max_pages": 10},

    # Drums & Percussion
    {"id": "pearl", "categories": ["drums"], "max_pages": 10},
    {"id": "rogers", "categories": ["drums"], "max_pages": 5},
    {"id": "paiste-cymbals", "categories": ["cymbals"], "max_pages": 5},
    {"id": "remo", "categories": ["drum-heads"], "max_pages": 5},
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
    print("\n🎯 Halilit Official Brand Harvester")
    print("=" * 80)
    print("Source: https://www.halilit.com/pages/4367")
    print("=" * 80)

    # Load official brands
    official_brands = load_official_brands()
    if not official_brands:
        print("❌ Failed to load official brands. Exiting.")
        return

    print(f"\n✅ Loaded {len(official_brands)} official Halilit brands")

    # Filter to priority brands only
    brands_to_harvest = []
    for priority in PRIORITY_BRANDS:
        brand_id = priority["id"]
        # Find in official list
        official = next(
            (b for b in official_brands if b["id"] == brand_id), None)
        if official:
            brands_to_harvest.append({
                "id": brand_id,
                "name": official["name"],
                "url": official["url"],  # Use Halilit's URL
                "max_pages": priority.get("max_pages", 5),
                "categories": priority.get("categories", [])
            })
        else:
            print(
                f"⚠️  Priority brand '{brand_id}' not found in official list - SKIPPING")

    print(f"\n📋 Harvesting {len(brands_to_harvest)} priority brands:\n")
    for i, b in enumerate(brands_to_harvest, 1):
        print(f"  {i:2}. {b['name']:30} ({b['id']})")

    print("\n")

    orchestrator = BrandHarvestOrchestrator()

    try:
        await orchestrator.harvest_all(brands_to_harvest)
        orchestrator.print_summary()

        # Save results to file
        results_file = Path(__file__).parent.parent / \
            "data" / "harvest_results.json"
        results_file.parent.mkdir(parents=True, exist_ok=True)
        with open(results_file, "w") as f:
            json.dump(orchestrator.results, f, indent=2)

        print(f"\n💾 Results saved to: {results_file}")
        print("\n✅ All harvested brands are officially authorized by Halilit!")

    except KeyboardInterrupt:
        print("\n\n⚠️  Harvest interrupted by user")
        orchestrator.print_summary()
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
