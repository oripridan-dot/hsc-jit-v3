"""
Roland Skeleton Scraper - Phase 2: Targeted Extraction
======================================================
This version uses the PRE-DEFINED PLAN from backend/roland_scraping_plan_v3.json
which contains a comprehensive list of product URLs.
"""

from models.product_hierarchy import (
    ProductCore, ProductCatalog, BrandIdentity,
    ProductImage, SourceType, ProductRelationship, RelationshipType
)
import asyncio
import logging
from typing import List, Dict, Optional, Set
from datetime import datetime
from playwright.async_api import async_playwright, Page
from pathlib import Path
import json
import sys
import re
import os

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


logger = logging.getLogger(__name__)


class RolandSkeletonScraper:
    """Targeted skeleton scraper using structured plan"""

    def __init__(self):
        self.base_url = "https://www.roland.com/global"
        # Using V3 plan - flat list of all products found by deep crawler
        self.plan_path = Path(__file__).parent.parent / \
            "roland_scraping_plan_v3.json"

    async def scrape_skeleton(self) -> ProductCatalog:
        logger.info("🚀 PHASE 1 (Refined): Targeted Skeleton Scraping (V3 Plan)")

        # Load the plan
        if not self.plan_path.exists():
            logger.error(f"❌ Plan not found: {self.plan_path}")
            return None

        with open(self.plan_path, 'r') as f:
            plan = json.load(f)

        product_urls = plan.get('product_urls', [])
        logger.info(
            f"   Using plan with {len(product_urls)} products pre-identified.")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            # Step 2: Extract skeleton data (Concurrent)
            products = []
            categories_count = {}

            # Concurrency Control
            sem = asyncio.Semaphore(12)  # 12 parallel tabs

            async def scrape_wrapper(url, idx, total):
                async with sem:
                    try:
                        # Create a new page per task for isolation
                        page = await browser.new_page()
                        try:
                            # 20s timeout for skeleton is enough
                            prod = await self._scrape_skeleton_page(page, url)
                            if prod:
                                logger.info(
                                    f"   [{idx}/{total}] ✅ {prod.name}")
                            else:
                                logger.info(
                                    f"   [{idx}/{total}] ⚠️ Skipped: {url}")
                            return prod
                        except Exception as e:
                            logger.error(
                                f"   [{idx}/{total}] ❌ Error scraping {url}: {e}")
                            return None
                        finally:
                            await page.close()
                    except Exception as e:
                        logger.error(f"   Context error: {e}")
                        return None

            tasks = []
            sorted_urls = sorted(product_urls)
            logger.info(
                f"   Starting concurrent scraping of {len(sorted_urls)} items...")

            for i, url in enumerate(sorted_urls, 1):
                tasks.append(scrape_wrapper(url, i, len(sorted_urls)))

            # Execute batch
            results = await asyncio.gather(*tasks)

            for product in results:
                if product:
                    products.append(product)
                    cat = product.main_category
                    categories_count[cat] = categories_count.get(cat, 0) + 1

            # Create Catalog
            brand = BrandIdentity(
                id="roland",
                name="Roland Corporation",
                website="https://www.roland.com",
                description="World leader in electronic musical instruments"
            )

            catalog = ProductCatalog(
                brand_identity=brand,
                products=products,
                total_products=len(products),
                last_updated=datetime.utcnow(),
                catalog_version="3.7.0-targeted-v3",
                coverage_stats={
                    "categories": categories_count,
                    "phase": "skeleton_v3_deep",
                    "content_status": "skeleton"
                }
            )

            # Final Report
            logger.info(f"\n✅ SKELETON SCRAPING COMPLETE!")
            logger.info(f"   Products Scraped: {len(products)}")
            logger.info(f"   Categories Found: {len(categories_count)}")
            for cat, count in sorted(categories_count.items()):
                logger.info(f"     • {cat}: {count}")

            return catalog

    async def _scrape_skeleton_page(self, page: Page, url: str) -> Optional[ProductCore]:
        """Extract basic skeleton data"""
        try:
            # Fast timeout, we just need the H1 and Image
            await page.goto(url, wait_until='domcontentloaded', timeout=20000)

            # Validation: Is this actually a product page?
            # Must have an H1
            if await page.locator('h1').count() == 0:
                # logger.warning(f"No H1 found on {url}")
                return None

            name = await page.locator('h1').first.inner_text()
            name = name.strip()
            if not name:
                return None

            # 2. ID
            product_id = f"roland-{url.split('/')[-2]}"

            # 3. Category Logic
            category = "Musical Instruments"
            try:
                # Breadcrumb is usually: Home > Products > Category > Group > Product
                breadcrumb = await page.locator('.breadcrumb li, .breadcrumbs li').all_inner_texts()
                # Clean up text
                breadcrumb = [b.strip() for b in breadcrumb if b.strip()]

                if len(breadcrumb) >= 3:
                    # Pick the one before the product name
                    # Often the last one is product name, or the one before it is category
                    # Let's try to grab the most general "Product Group"
                    # e.g. Products > Synthesizers > Analog Modeling > Jupiter-X
                    # We might want "Synthesizers" (index 1 or 2)

                    # Simple heuristic: Take the 2nd item if available (after Products)
                    # or the item before the product name

                    found_cat = None
                    reversed_breadcrumb = breadcrumb[::-1]
                    for b in reversed_breadcrumb:
                        if b.upper() != name.upper() and b.upper() != "PRODUCTS" and b.upper() != "HOME":
                            found_cat = b
                            break

                    if found_cat:
                        category = found_cat

            except Exception as e:
                pass

            # Fallback strict mapping
            if category == "Musical Instruments":
                url_lower = url.lower()
                if 'drum' in url_lower:
                    category = "Electronic Drums"
                elif 'piano' in url_lower:
                    category = "Digital Pianos"
                elif 'synth' in url_lower:
                    category = "Synthesizers"
                elif 'guitar' in url_lower:
                    category = "Guitar & Bass"
                elif 'wind' in url_lower:
                    category = "Wind Instruments"
                elif 'dj' in url_lower:
                    category = "DJ Gear"
                elif 'proav' in url_lower:
                    category = "Pro A/V"

            # 4. Main Image
            images = []
            # Try specific selectors first
            selectors = [
                '.product-image img',
                '.hero-image img',
                '.kv-image img',
                'main img',
            ]

            found_img = False
            for sel in selectors:
                if await page.locator(sel).count() > 0:
                    img_loc = page.locator(sel).first
                    src = await img_loc.get_attribute('src')
                    if src:
                        # Validate it's not a pixel or logo
                        if 'pixel' in src or 'logo' in src:
                            continue

                        if src.startswith('//'):
                            src = f"https:{src}"
                        elif src.startswith('/'):
                            src = f"https://www.roland.com{src}"

                        images.append(ProductImage(
                            url=src, type='main', alt_text=name))
                        found_img = True
                        break

            return ProductCore(
                id=product_id,
                brand="Roland",
                name=name,
                main_category=category,
                brand_product_url=url,
                images=images,
                description="",
                source_type=SourceType.BRAND_OFFICIAL
            )

        except Exception as e:
            # logger.error(f"Error extracting {url}: {e}")
            return None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(levelname)s - %(message)s')
    scraper = RolandSkeletonScraper()

    # Save output
    output_dir = Path("backend/data/catalogs_brand")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "roland_brand_skeleton.json"

    try:
        catalog = asyncio.run(scraper.scrape_skeleton())

        if catalog:
            with open(output_file, "w") as f:
                f.write(catalog.model_dump_json(indent=2))

            print(f"\n💾 SKELETON CATALOG SAVED:")
            print(f"   {output_file}")
            print(f"   Size: {output_file.stat().st_size / 1024:.2f} KB")

    except KeyboardInterrupt:
        print("\n⚠️ Scraper interrupted by user.")
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
