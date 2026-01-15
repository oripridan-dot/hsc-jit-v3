#!/usr/bin/env python3
"""
DUAL STRATEGY: Playwright Scraping + Smart Matching
1. Scrape missing 14 brands with Playwright (handles JS-rendered sites)
2. Match scraped products with Halilit catalog to expand PRIMARY coverage
"""

import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from difflib import SequenceMatcher
import re

# Check if playwright is available
try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("⚠️  Playwright not available - will install")

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"

# Brands that failed simple HTTP scraping - need Playwright
PLAYWRIGHT_BRANDS = {
    "roland": "https://www.roland.com/us/products/",
    "pearl": "https://www.pearldrum.com/products",
    "boss": "https://www.boss.info/us/products/",
    "m-audio": "https://www.m-audio.com/products",
    "akai-professional": "https://www.akaipro.com/products",
    "adam-audio": "https://www.adam-audio.com/en/products/",
    "dynaudio": "https://www.dynaudio.com/products",
    "remo": "https://www.remo.com/products",
    "paiste-cymbals": "https://www.paiste.com/en/products",
    "xotic": "https://www.xotic.us/",
    "oberheim": "https://www.uaudio.com/synthesizers.html",
    "rogers": "https://www.rogersdrums.com/",
    "headrush-fx": "https://www.headrush.com/products/",
}


class PlaywrightScraper:
    """Scrape JS-rendered websites using Playwright."""

    def __init__(self):
        self.scraped_products = {}

    async def scrape_brand(self, brand_id: str, url: str) -> List[Dict]:
        """Scrape a brand website using Playwright."""
        logger.info(f"\n🎭 Scraping {brand_id} with Playwright...")
        logger.info(f"   URL: {url}")

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                page = await context.new_page()

                # Navigate with timeout
                try:
                    await page.goto(url, wait_until='networkidle', timeout=20000)
                except PlaywrightTimeout:
                    logger.warning(
                        f"   ⚠️  Timeout loading {url}, trying with domcontentloaded...")
                    await page.goto(url, wait_until='domcontentloaded', timeout=15000)

                # Wait for products to load
                await asyncio.sleep(2)

                # Try multiple selectors
                selectors = [
                    '.product-item', '.product-card', '.product',
                    '[data-product]', '[class*="product"]',
                    '.item', 'article', '[itemtype*="Product"]'
                ]

                products = []
                for selector in selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        # Found something meaningful
                        if elements and len(elements) > 3:
                            logger.info(
                                f"   ✅ Found {len(elements)} elements with '{selector}'")

                            for elem in elements[:100]:  # Limit to 100
                                try:
                                    text = await elem.inner_text()
                                    # Extract product name from text
                                    lines = [l.strip()
                                             for l in text.split('\n') if l.strip()]
                                    if lines:
                                        name = lines[0]
                                        # Look for price
                                        price = ""
                                        for line in lines:
                                            if re.search(r'\$|€|£', line):
                                                price = line
                                                break

                                        if len(name) > 2 and len(name) < 200:
                                            products.append({
                                                "name": name,
                                                "price": price,
                                                "brand_id": brand_id,
                                                "source": "playwright_scrape"
                                            })
                                except:
                                    continue

                            if products:
                                break  # Found products, stop trying selectors
                    except:
                        continue

                await browser.close()

                # Deduplicate
                seen = set()
                unique = []
                for p in products:
                    key = p["name"].lower()
                    if key not in seen and len(key) > 2:
                        seen.add(key)
                        unique.append(p)

                logger.info(f"   📦 Extracted {len(unique)} unique products")
                return unique

        except Exception as e:
            logger.error(f"   ❌ Playwright error: {e}")
            return []

    async def scrape_all_missing_brands(self) -> Dict[str, List[Dict]]:
        """Scrape all brands that failed simple HTTP."""
        logger.info("=" * 70)
        logger.info("🎭 PLAYWRIGHT SCRAPER - Missing 14 Brands")
        logger.info("=" * 70)

        # Scrape sequentially to avoid overwhelming sites
        for brand_id, url in PLAYWRIGHT_BRANDS.items():
            products = await self.scrape_brand(brand_id, url)
            self.scraped_products[brand_id] = products

            status = "✅" if len(products) > 0 else "❌"
            logger.info(f"{status} {brand_id:25} │ {len(products):3} products")

        total = sum(len(p) for p in self.scraped_products.values())
        logger.info(f"\n✅ Playwright scraped: {total} new products")

        return self.scraped_products

    def save_catalogs(self):
        """Save scraped products to catalog files."""
        CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)

        for brand_id, products in self.scraped_products.items():
            if products:
                catalog = {
                    "brand_id": brand_id,
                    "total_products": len(products),
                    "products": products,
                    "timestamp": datetime.now().isoformat(),
                    "source": "playwright_scrape",
                    "status": "success"
                }

                file_path = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
                with open(file_path, 'w') as f:
                    json.dump(catalog, f, indent=2)


class SmartMatcher:
    """Match brand website products with Halilit catalog."""

    def __init__(self):
        self.matches = {}
        self.total_primary = 0

    def normalize_name(self, name: str) -> str:
        """Normalize product name for matching."""
        name = name.lower()
        # Remove brand names
        brands = ['roland', 'pearl', 'boss', 'nord', 'mackie', 'presonus',
                  'm-audio', 'akai', 'krk', 'rcf', 'remo', 'paiste', 'adam',
                  'dynaudio', 'xotic', 'oberheim', 'rogers', 'headrush']
        for brand in brands:
            name = re.sub(rf'\b{brand}\b', '', name, flags=re.IGNORECASE)

        # Remove special chars, keep alphanumeric and spaces
        name = re.sub(r'[^a-z0-9\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        return name

    def similarity(self, a: str, b: str) -> float:
        """Calculate similarity between two product names."""
        norm_a = self.normalize_name(a)
        norm_b = self.normalize_name(b)
        return SequenceMatcher(None, norm_a, norm_b).ratio()

    def match_brand_to_halilit(self, brand_id: str) -> Dict:
        """Match brand products with Halilit products."""
        logger.info(f"\n🔗 Matching {brand_id}...")

        # Load brand products
        brand_file = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
        if not brand_file.exists():
            return {"primary": 0, "secondary": 0, "halilit_only": 0}

        with open(brand_file) as f:
            brand_data = json.load(f)
        brand_products = brand_data.get("products", [])

        # Load Halilit products
        halilit_file = CATALOGS_HALILIT_DIR / f"{brand_id}_halilit.json"
        if not halilit_file.exists():
            return {"primary": len(brand_products), "secondary": len(brand_products), "halilit_only": 0}

        with open(halilit_file) as f:
            halilit_data = json.load(f)
        halilit_products = halilit_data.get("products", [])

        # Match products
        unified_products = []
        matched_halilit_indices = set()

        # First pass: Match brand products to Halilit
        for brand_product in brand_products:
            best_match_idx = None
            best_score = 0

            for idx, hal_product in enumerate(halilit_products):
                if idx in matched_halilit_indices:
                    continue

                score = self.similarity(
                    brand_product.get("name", ""),
                    hal_product.get("name", "")
                )

                if score > best_score and score >= 0.6:  # 60% similarity threshold
                    best_score = score
                    best_match_idx = idx

            if best_match_idx is not None:
                # PRIMARY: Found match
                matched = halilit_products[best_match_idx].copy()
                matched["source"] = "PRIMARY"
                matched["brand_name"] = brand_product.get("name")
                matched["match_score"] = round(best_score, 2)
                unified_products.append(matched)
                matched_halilit_indices.add(best_match_idx)
            else:
                # SECONDARY: Brand only
                brand_product["source"] = "SECONDARY"
                unified_products.append(brand_product)

        # Add unmatched Halilit products as HALILIT_ONLY
        for idx, hal_product in enumerate(halilit_products):
            if idx not in matched_halilit_indices:
                hal_product["source"] = "HALILIT_ONLY"
                unified_products.append(hal_product)

        # Statistics
        stats = {
            "primary": len([p for p in unified_products if p.get("source") == "PRIMARY"]),
            "secondary": len([p for p in unified_products if p.get("source") == "SECONDARY"]),
            "halilit_only": len([p for p in unified_products if p.get("source") == "HALILIT_ONLY"])
        }

        # Save unified catalog
        unified_catalog = {
            "brand_id": brand_id,
            "total_products": len(unified_products),
            "products": unified_products,
            "statistics": stats,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        }

        output_file = CATALOGS_UNIFIED_DIR / f"{brand_id}_catalog.json"
        CATALOGS_UNIFIED_DIR.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(unified_catalog, f, indent=2)

        coverage = round(
            100 * stats["primary"] / len(unified_products), 1) if unified_products else 0
        logger.info(
            f"   ✅ {stats['primary']} PRIMARY / {len(unified_products)} total = {coverage}%")

        self.total_primary += stats["primary"]
        return stats

    def match_all_brands(self) -> Dict[str, Dict]:
        """Match all brands."""
        logger.info("\n" + "=" * 70)
        logger.info("🔗 SMART MATCHING - Brand Products → Halilit")
        logger.info("=" * 70)

        all_stats = {}

        # Get all brands (from Halilit as baseline)
        for halilit_file in sorted(CATALOGS_HALILIT_DIR.glob("*_halilit.json")):
            brand_id = halilit_file.stem.replace("_halilit", "")
            stats = self.match_brand_to_halilit(brand_id)
            all_stats[brand_id] = stats

        return all_stats


async def main():
    """Run dual strategy: Playwright + Matching."""
    logger.info("\n╔" + "="*68 + "╗")
    logger.info(
        "║" + " "*8 + "🚀 DUAL STRATEGY: Playwright + Smart Matching" + " "*13 + "║")
    logger.info("╚" + "="*68 + "╝\n")

    # Step 1: Playwright scraping for missing brands
    if PLAYWRIGHT_AVAILABLE:
        scraper = PlaywrightScraper()
        await scraper.scrape_all_missing_brands()
        scraper.save_catalogs()
    else:
        logger.warning(
            "⚠️  Playwright not available - skipping enhanced scraping")

    # Step 2: Smart matching
    matcher = SmartMatcher()
    all_stats = matcher.match_all_brands()

    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("📊 FINAL RESULTS")
    logger.info("=" * 70)

    total_products = sum(s["primary"] + s["secondary"] +
                         s["halilit_only"] for s in all_stats.values())
    total_primary = sum(s["primary"] for s in all_stats.values())
    coverage = round(100 * total_primary / total_products,
                     2) if total_products else 0

    logger.info(f"Total Products: {total_products}")
    logger.info(f"PRIMARY: {total_primary}")
    logger.info(f"Coverage: {coverage}%")

    if coverage >= 80:
        logger.info("✅ TARGET REACHED!")
    elif coverage >= 50:
        logger.info("🟡 Good progress - continue")
    else:
        logger.info("🔴 More work needed")


if __name__ == "__main__":
    if not PLAYWRIGHT_AVAILABLE:
        print("Installing Playwright...")
        import subprocess
        subprocess.run(["pip", "install", "playwright", "-q"])
        subprocess.run(["playwright", "install", "chromium"])
        print("✅ Playwright installed, please run again")
    else:
        asyncio.run(main())
