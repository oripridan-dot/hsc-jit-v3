#!/usr/bin/env python3
"""
REAL BRAND WEBSITE SCRAPER
Scrapes actual products from brand websites using multiple fallback strategies.
Goal: Get real product data to match against Halilit for PRIMARY coverage.
"""

import asyncio
import aiohttp
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List
import re
from urllib.parse import urljoin

logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"

# Brand website configurations with multiple scraping strategies
BRAND_CONFIGS = {
    "roland": {
        "urls": [
            "https://www.roland.com/us/en/products/",
            "https://www.roland.com/us/products/",
        ],
        "api_endpoints": [
            "https://www.roland.com/api/products",
            "https://www.roland.com/api/v1/products",
        ],
        "selectors": {
            "product_container": ".product-item, .product-card, [data-product-id]",
            "name": ".product-name, .product-title, h2, h3",
            "price": ".price, .product-price, [data-price]",
            "url": "a[href*=products], .product-link",
        }
    },
    "pearl": {
        "urls": [
            "https://www.pearldrum.com/en-us/products",
            "https://www.pearldrum.com/products",
        ],
        "api_endpoints": [
            "https://www.pearldrum.com/api/products",
        ],
        "selectors": {
            "product_container": ".product-item, .product, [class*=product]",
            "name": ".product-name, h2, h3",
            "price": ".price, [data-price]",
        }
    },
    "mackie": {
        "urls": [
            "https://www.mackie.com/en-us/products/",
            "https://www.mackie.com/products/",
        ],
        "api_endpoints": [
            "https://www.mackie.com/api/products",
        ],
        "selectors": {
            "product_container": ".product, .product-item",
            "name": ".name, h2, h3",
            "price": ".price",
        }
    },
    "boss": {
        "urls": [
            "https://www.boss.info/en-us/products/",
            "https://www.bosscorp.jp/e/products/",
        ],
        "api_endpoints": [
            "https://www.boss.info/api/products",
        ],
    },
    "nord": {
        "urls": [
            "https://www.nordkeyboards.com/products",
        ],
        "api_endpoints": [
            "https://www.nordkeyboards.com/api/products",
        ],
    },
    "m-audio": {
        "urls": [
            "https://www.m-audio.com/en/products",
            "https://www.m-audio.com/products",
        ],
        "api_endpoints": [
            "https://www.m-audio.com/api/products",
        ],
    },
    "presonus": {
        "urls": [
            "https://www.presonus.com/en-US/products",
            "https://www.presonus.com/products",
        ],
        "api_endpoints": [
            "https://www.presonus.com/api/products",
        ],
    },
    "akai-professional": {
        "urls": [
            "https://www.akaipro.com/products",
            "https://www.akaipro.com/en/products",
        ],
        "api_endpoints": [
            "https://www.akaipro.com/api/products",
        ],
    },
    "dynaudio": {
        "urls": [
            "https://www.dynaudio.com/products",
        ],
        "api_endpoints": [
            "https://www.dynaudio.com/api/products",
        ],
    },
    "krk-systems": {
        "urls": [
            "https://www.krksys.com/products",
            "https://www.krksystems.com/products",
        ],
        "api_endpoints": [
            "https://www.krksys.com/api/products",
        ],
    },
    "rcf": {
        "urls": [
            "https://www.rcf.it/en/products",
            "https://www.rcf.it/products",
        ],
        "api_endpoints": [
            "https://www.rcf.it/api/products",
        ],
    },
    "remo": {
        "urls": [
            "https://www.remo.com/products",
        ],
        "api_endpoints": [
            "https://www.remo.com/api/products",
        ],
    },
    "paiste-cymbals": {
        "urls": [
            "https://www.paiste.com/en/Products/",
            "https://www.paiste.com/Products/",
        ],
        "api_endpoints": [
            "https://www.paiste.com/api/products",
        ],
    },
    "adam-audio": {
        "urls": [
            "https://www.adam-audio.com/en/products/",
            "https://www.adam-audio.com/products/",
        ],
        "api_endpoints": [
            "https://www.adam-audio.com/api/products",
        ],
    },
    "xotic": {
        "urls": [
            "https://www.xotic.cc/products/",
        ],
        "api_endpoints": [
            "https://www.xotic.cc/api/products",
        ],
    },
    "roland": {
        "urls": [
            "https://www.roland.com/us/en/products/",
        ],
        "api_endpoints": [],
    },
    "oberheim": {
        "urls": [
            "https://www.oberheim.com/products",
        ],
        "api_endpoints": [],
    },
    "rogers": {
        "urls": [
            "https://www.rogersdrums.com/products/",
        ],
        "api_endpoints": [],
    },
    "headrush-fx": {
        "urls": [
            "https://www.headrushamplifiers.com/products",
        ],
        "api_endpoints": [],
    },
}


class RealBrandScraper:
    """Scrapes real brand websites with multiple fallback strategies."""

    def __init__(self, timeout: int = 10):
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.session: Optional[aiohttp.ClientSession] = None
        self.products_scraped = {}

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=self.timeout)
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    async def try_api_endpoints(self, brand_id: str, urls: List[str]) -> Optional[List[Dict]]:
        """Try to fetch from API endpoints first (fastest)."""
        config = BRAND_CONFIGS.get(brand_id, {})
        api_endpoints = config.get("api_endpoints", [])

        for api_url in api_endpoints:
            try:
                logger.info(f"  → Trying API: {api_url}")
                async with self.session.get(api_url, ssl=False) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        products = data.get("products", [])
                        if products:
                            logger.info(
                                f"    ✅ Got {len(products)} products from API")
                            return products
            except Exception as e:
                logger.debug(f"    API failed: {e}")
                continue

        return None

    async def try_html_scrape(self, brand_id: str, url: str) -> Optional[List[Dict]]:
        """Try HTML scraping as fallback."""
        try:
            logger.info(f"  → Trying HTML: {url}")
            async with self.session.get(url, ssl=False) as resp:
                if resp.status == 200:
                    html = await resp.text()
                    # Simple regex-based product extraction
                    products = self._extract_from_html(html, brand_id)
                    if products:
                        logger.info(
                            f"    ✅ Extracted {len(products)} products from HTML")
                        return products
        except Exception as e:
            logger.debug(f"    HTML scrape failed: {e}")

        return None

    def _extract_from_html(self, html: str, brand_id: str) -> List[Dict]:
        """Extract products from HTML using regex patterns."""
        products = []

        # Simple extraction patterns
        patterns = [
            # Product with price
            r'<h[2-4][^>]*>([^<]+)</h[2-4]>.*?(?:\$|€|£)([\d,\.]+)',
            # Product name from title
            r'"title"\s*:\s*"([^"]+)"',
            # Product data attributes
            r'data-product-name="([^"]+)"',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    name = match[0].strip() if len(match) > 0 else ""
                    price = match[1].strip() if len(match) > 1 else ""
                else:
                    name = match.strip()
                    price = ""

                if name and len(name) > 2:
                    products.append({
                        "name": name,
                        "price": price,
                        "brand_id": brand_id,
                        "source": "website_scrape"
                    })

        # Deduplicate
        seen = set()
        unique_products = []
        for p in products:
            key = p["name"].lower()
            if key not in seen:
                seen.add(key)
                unique_products.append(p)

        return unique_products[:100]  # Limit to 100 per site

    async def scrape_brand(self, brand_id: str) -> List[Dict]:
        """Scrape a single brand using multiple strategies."""
        logger.info(f"\n🔍 Scraping {brand_id}...")

        config = BRAND_CONFIGS.get(brand_id, {})
        urls = config.get("urls", [])

        # Strategy 1: Try API endpoints
        if config.get("api_endpoints"):
            products = await self.try_api_endpoints(brand_id, urls)
            if products:
                return products

        # Strategy 2: Try HTML scraping
        for url in urls:
            products = await self.try_html_scrape(brand_id, url)
            if products:
                return products

        logger.warning(f"❌ Could not scrape {brand_id}")
        return []

    async def scrape_all_brands(self) -> Dict[str, List[Dict]]:
        """Scrape all brands concurrently."""
        logger.info("=" * 60)
        logger.info("🚀 REAL BRAND WEBSITE SCRAPER")
        logger.info("=" * 60)

        tasks = [
            self.scrape_brand(brand_id)
            for brand_id in sorted(BRAND_CONFIGS.keys())
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for brand_id, result in zip(sorted(BRAND_CONFIGS.keys()), results):
            if isinstance(result, Exception):
                logger.error(f"  {brand_id}: ERROR - {result}")
                self.products_scraped[brand_id] = []
            else:
                self.products_scraped[brand_id] = result
                count = len(result)
                status = "✅" if count > 0 else "⚠️"
                logger.info(f"{status} {brand_id:25} │ {count:3} products")

        return self.products_scraped

    def save_catalogs(self):
        """Save scraped products to catalog files."""
        CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)

        total_products = 0
        for brand_id, products in self.products_scraped.items():
            if products:
                catalog = {
                    "brand_id": brand_id,
                    "total_products": len(products),
                    "products": products,
                    "timestamp": datetime.now().isoformat(),
                    "source": "website_scrape",
                    "status": "success"
                }

                file_path = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
                with open(file_path, 'w') as f:
                    json.dump(catalog, f, indent=2)

                logger.info(f"  Saved {brand_id}: {file_path}")
                total_products += len(products)

        logger.info(f"\n✅ Total products scraped: {total_products}")
        return total_products


async def main():
    """Run the scraper."""
    async with RealBrandScraper(timeout=15) as scraper:
        await scraper.scrape_all_brands()
        scraper.save_catalogs()


if __name__ == "__main__":
    asyncio.run(main())
