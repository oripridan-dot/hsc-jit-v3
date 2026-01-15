#!/usr/bin/env python3
"""
FAST & PRACTICAL BRAND SCRAPER
Focuses on what actually works: APIs, structured data, and simple extraction.
"""

from bs4 import BeautifulSoup
import aiohttp
import asyncio
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import logging
import re

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"


class FastPracticalScraper:
    """Fast, practical scraper using real-world strategies."""

    def __init__(self):
        self.results = {}
        self.halilit_counts = self._load_halilit_counts()

    def _load_halilit_counts(self) -> Dict[str, int]:
        """Load expected product counts from Halilit."""
        counts = {}
        for file in CATALOGS_HALILIT_DIR.glob("*_halilit.json"):
            try:
                with open(file) as f:
                    data = json.load(f)
                brand_id = file.stem.replace("_halilit", "")
                counts[brand_id] = len(data.get("products", []))
            except:
                pass
        return counts

    async def try_direct_api(self, base_url: str) -> Optional[List[Dict]]:
        """Try to fetch from common API endpoints."""
        domain = base_url.split("//")[1].split("/")[0].replace("www.", "")

        api_urls = [
            f"https://{domain}/api/products",
            f"https://{domain}/api/v1/products",
            f"https://{domain}/graphql?query={{products{{name price}}}}",
        ]

        async with aiohttp.ClientSession() as session:
            for api_url in api_urls:
                try:
                    async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=5), ssl=False) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            if isinstance(data, list) and len(data) > 5:
                                return data
                            if isinstance(data, dict):
                                for key in ['products', 'items', 'data']:
                                    if key in data and isinstance(data[key], list):
                                        return data[key]
                except:
                    pass

        return None

    async def try_simple_html(self, base_url: str) -> Optional[List[Dict]]:
        """Simple HTML extraction - just find anything that looks like a product."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(base_url, timeout=aiohttp.ClientTimeout(total=10), ssl=False) as resp:
                    html = await resp.text()
                    soup = BeautifulSoup(html, 'html.parser')

                    # Method 1: Look for JSON in script tags
                    scripts = soup.find_all('script')
                    for script in scripts:
                        if script.string:
                            try:
                                # Try to find JSON data in the script
                                json_match = re.search(
                                    r'\{\s*"?products?"?\s*:\s*\[', script.string)
                                if json_match:
                                    json_str = script.string[json_match.start(
                                    ):]
                                    # Try to parse
                                    try:
                                        data = json.loads(
                                            json_str[:json_str.find('\n')] or json_str)
                                        if 'products' in data:
                                            return data['products']
                                    except:
                                        pass
                            except:
                                pass

                    # Method 2: Find all links and headers (simple approach)
                    products = []

                    # Get all h2, h3 tags (often product names)
                    for tag in soup.find_all(['h2', 'h3']):
                        text = tag.get_text(strip=True)
                        if text and 3 < len(text) < 150:
                            products.append({"name": text})

                    if len(products) > 5:
                        return products
        except:
            pass

        return None

    async def scrape_brand_fast(self, brand_id: str) -> Optional[List[Dict]]:
        """Quickly try to scrape a brand."""
        expected = self.halilit_counts.get(brand_id, 0)

        # Determine URL
        base_url = f"https://www.{brand_id.replace('-', '')}.com/products"

        if brand_id == "nord":
            base_url = "https://www.nordkeyboards.com/products"
        elif brand_id == "pearl":
            base_url = "https://www.pearldrum.com/products"
        elif brand_id == "boss":
            base_url = "https://www.boss.info/en-us/products/"
        elif brand_id == "m-audio":
            base_url = "https://www.m-audio.com/products"
        elif brand_id == "akai-professional":
            base_url = "https://www.akaipro.com/products"
        elif brand_id == "krk-systems":
            base_url = "https://www.krksys.com/products"

        logger.info(f"🎯 {brand_id:20} (target: ~{expected})")

        # Try API first
        products = await self.try_direct_api(base_url)
        if products:
            logger.info(f"   ✅ API: {len(products)} products")
            return products

        # Try simple HTML
        products = await self.try_simple_html(base_url)
        if products:
            logger.info(f"   ✅ HTML: {len(products)} products")
            return products

        logger.info(f"   ❌ No data")
        return None

    async def scrape_all(self):
        """Scrape all brands."""
        logger.info("\n" + "=" * 70)
        logger.info("⚡ FAST PRACTICAL SCRAPER")
        logger.info("=" * 70 + "\n")

        for brand_id in sorted(self.halilit_counts.keys()):
            products = await self.scrape_brand_fast(brand_id)

            if products and len(products) > 0:
                catalog = {
                    "brand_id": brand_id,
                    "products": products,
                    "count": len(products),
                    "timestamp": datetime.now().isoformat()
                }

                CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)
                catalog_file = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"

                with open(catalog_file, 'w') as f:
                    json.dump(catalog, f, indent=2)

                self.results[brand_id] = len(products)
            else:
                self.results[brand_id] = 0

        # Summary
        logger.info("\n" + "=" * 70)
        logger.info("📊 RESULTS")
        logger.info("=" * 70)

        total = sum(self.results.values())
        successful = sum(1 for c in self.results.values() if c > 0)

        logger.info(f"\nSuccessful: {successful}/{len(self.results)}")
        logger.info(f"Total products: {total}\n")

        for brand_id in sorted(self.results.keys(), key=lambda b: self.results[b], reverse=True):
            count = self.results[brand_id]
            status = "✅" if count > 0 else "❌"
            logger.info(f"   {status} {brand_id:20} │ {count:4}")


async def main():
    scraper = FastPracticalScraper()
    await scraper.scrape_all()


if __name__ == "__main__":
    asyncio.run(main())
