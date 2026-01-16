from scripts.universal_brand_scraper import UniversalScraper
from app.core.contracts import ProductContract, BrandComplianceReport
import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Dict, Any

# Ensure we can import from app
sys.path.append(str(Path(__file__).resolve().parents[1]))


logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

RECIPES_PATH = Path(__file__).resolve(
).parents[1] / "data" / "brand_recipes.json"
HARVEST_DIR = Path(__file__).resolve().parents[1] / "data" / "harvests"
LOCKED_DIR = Path(__file__).resolve(
).parents[1] / "data" / "contracts" / "locked"
CATALOGS_DIR = Path(__file__).resolve().parents[1] / "data" / "catalogs_brand"

HARVEST_DIR.mkdir(parents=True, exist_ok=True)
LOCKED_DIR.mkdir(parents=True, exist_ok=True)


class ComplianceAgent:
    def __init__(self):
        self.recipes = self._load_recipes()
        self.scraper = UniversalScraper()

    def _load_recipes(self) -> Dict:
        if not RECIPES_PATH.exists():
            return {}
        with open(RECIPES_PATH, "r") as f:
            return json.load(f)

    async def run_compliance_cycle(self, brand_id: str):
        """
        The Core Loop: Harvest -> Validate -> Lock (if good) or Report Failures.
        """
        logger.info(f"🛡️  Starting Compliance Cycle for: {brand_id}")

        recipe = self.recipes.get(brand_id)
        if not recipe:
            logger.error(
                f"❌ No recipe found for {brand_id}. Please define in brand_recipes.json")
            return

        # 1. Harvest Phase (Using the recipe parameters - simplified integration)
        # In a full implementation, we'd pass the recipe config to the scraper.
        # For now, we rely on the scraper's improved internal logic which matches the recipe intentions.
        logger.info(f"🚜 Harvesting data...")
        await self.scraper.run_brand(brand_id, recipe['start_url'])

        # 2. Load Raw Harvest Data
        raw_file = CATALOGS_DIR / f"{brand_id}_brand.json"
        if not raw_file.exists():
            logger.error("❌ Scrape failed to produce output file.")
            return

        with open(raw_file, "r") as f:
            raw_data = json.load(f)
            raw_products = raw_data.get("products", [])

        # 3. Validation Phase
        logger.info(f"⚖️  Validating against Contract...")
        valid_products = []
        rejection_reasons = {}

        for p in raw_products:
            try:
                # Map raw fields to Contract fields
                contract_product = ProductContract(
                    id=f"{brand_id}-{p.get('name','').replace(' ','-')}",
                    brand=brand_id,
                    name=p.get('name'),
                    category=p.get('category'),
                    description=p.get('description'),
                    image_url=p.get('image_url'),
                    specs=p.get('specs', {}),
                    source_url=p.get('url')
                )
                valid_products.append(contract_product)
            except Exception as e:
                # Catch validation errors (missing fields, bad values)
                reason = str(e).split(' [')[0]  # Simplify error message
                rejection_reasons[reason] = rejection_reasons.get(
                    reason, 0) + 1

        # 4. Report Generation
        total = len(raw_products)
        compliant = len(valid_products)
        rate = (compliant / total) if total > 0 else 0.0

        report = BrandComplianceReport(
            brand_id=brand_id,
            total_scraped=total,
            compliant_count=compliant,
            compliance_rate=rate,
            products=valid_products,
            rejection_reasons=rejection_reasons,
            is_locked=rate >= 0.95  # Strict 95% threshold
        )

        logger.info(f"📊 Compliance Results for {brand_id}:")
        logger.info(
            f"   Total: {total}, Compliant: {compliant} ({rate*100:.1f}%)")

        if rejection_reasons:
            logger.warning("   ⚠️  Rejection Reasons:")
            for reason, count in rejection_reasons.items():
                logger.warning(f"      - {reason}: {count} items")

        # 5. Lock / feedback
        if report.is_locked:
            logger.info(f"✅ Contract SATISFIED. Locking data for merger.")
            locked_path = LOCKED_DIR / f"{brand_id}_contract.json"
            with open(locked_path, "w") as f:
                f.write(report.model_dump_json(indent=2))
        else:
            logger.error(
                f"⛔ Contract FAILED. {compliant}/{total} valid. Recipe adjustment needed.")
            # Save partial report for debugging
            debug_path = HARVEST_DIR / f"{brand_id}_failures.json"
            with open(debug_path, "w") as f:
                f.write(report.model_dump_json(indent=2))


async def main():
    agent = ComplianceAgent()

    # Initialize Scraper
    await agent.scraper.start()

    try:
        # Run for the target brands
        await agent.run_compliance_cycle("roland")
        await agent.run_compliance_cycle("boss")
    finally:
        await agent.scraper.stop()

if __name__ == "__main__":
    asyncio.run(main())
