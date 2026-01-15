#!/usr/bin/env python3
"""
INTELLIGENT BRAND SCRAPER
Uses intelligent page analysis instead of brittle selectors.
Reverse-engineers APIs, analyzes page structure, extracts actual product data.
"""

import asyncio
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Set
import logging
from urllib.parse import urljoin, urlparse

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"

try:
    import aiohttp
    from bs4 import BeautifulSoup
    from playwright.async_api import async_playwright
except ImportError:
    import subprocess
    subprocess.run(["pip", "install", "aiohttp",
                   "beautifulsoup4", "playwright", "-q"])
    import aiohttp
    from bs4 import BeautifulSoup
    from playwright.async_api import async_playwright


class IntelligentBrandScraper:
    """Intelligently scrapes brand catalogs by understanding page structure."""

    def __init__(self):
        self.results = {}
        self.halilit_counts = self._load_halilit_counts()

    def _load_halilit_counts(self) -> Dict[str, int]:
        """Load expected product counts from Halilit data."""
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

    async def reverse_engineer_api(self, brand_id: str, base_url: str) -> Optional[List[Dict]]:
        """Try to find and use the brand's actual API."""
        logger.info(f"   🔍 Reverse-engineering API...")

        # Extract domain
        domain = urlparse(base_url).netloc.replace("www.", "")
        domain_short = domain.split(".")[0]

        # Common API patterns
        api_patterns = [
            f"https://api.{domain}/products",
            f"https://{domain}/api/products",
            f"https://{domain}/api/v1/products",
            f"https://{domain}/api/v2/products",
            f"https://{domain}/api/catalogs",
            f"https://{domain}/api/items",
            f"https://{domain.replace(domain_short, 'api')}/products",
        ]

        async with aiohttp.ClientSession() as session:
            for api_url in api_patterns:
                try:
                    async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=5), ssl=False) as resp:
                        if resp.status == 200:
                            try:
                                data = await resp.json()

                                # Look for products in various keys
                                for key in ['products', 'items', 'data', 'results', 'catalog']:
                                    if key in data:
                                        products = data[key]
                                        if isinstance(products, list) and len(products) > 5:
                                            logger.info(
                                                f"      ✅ Found API with {len(products)} products at {api_url}")
                                            return products

                                # Try direct list
                                if isinstance(data, list) and len(data) > 5:
                                    logger.info(
                                        f"      ✅ Found API list with {len(data)} products at {api_url}")
                                    return data
                            except:
                                pass
                except:
                    pass

        return None

    async def intelligent_page_analysis(self, brand_id: str, url: str) -> Optional[List[Dict]]:
        """Intelligently analyze page to find products."""
        logger.info(f"   🧠 Intelligent page analysis...")

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                # Go to page with flexible wait
                try:
                    await page.goto(url, wait_until='networkidle', timeout=35000)
                except:
                    try:
                        await page.goto(url, wait_until='domcontentloaded', timeout=30000)
                    except:
                        await page.goto(url, timeout=25000)

                # Aggressive scrolling to load lazy-loaded content
                for _ in range(5):
                    await page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                    await asyncio.sleep(1)

                # Get all text on page
                page_text = await page.inner_text("body")

                # Get full HTML for analysis
                html = await page.content()

                await browser.close()

                # Intelligent extraction
                products = self._intelligent_extract(brand_id, html, page_text)

                if products:
                    logger.info(
                        f"      ✅ Extracted {len(products)} products via intelligent analysis")
                    return products

        except Exception as e:
            logger.warning(f"      Page analysis failed: {e}")

        return None

    def _intelligent_extract(self, brand_id: str, html: str, text: str) -> List[Dict]:
        """Intelligently extract products from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        products = []
        product_names: Set[str] = set()

        # Strategy 1: Look for price patterns (strong indicator of products)
        # Products usually have prices listed
        price_pattern = r'\$\s*[\d,]+(?:\.\d{2})?|\€\s*[\d,]+(?:\.\d{2})?|£\s*[\d,]+'
        price_matches = re.finditer(price_pattern, text)

        # Get context around prices
        price_contexts = []
        for match in price_matches:
            start = max(0, match.start() - 200)
            end = min(len(text), match.end() + 200)
            context = text[start:end]
            price_contexts.append(context)

        # Strategy 2: Extract from structured data (JSON-LD, microdata)
        # Many modern sites use structured data
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    if 'itemListElement' in data:  # Product list
                        for item in data['itemListElement']:
                            if 'name' in item:
                                products.append({
                                    "name": item['name'],
                                    "sku": item.get('sku', ''),
                                    "price": item.get('price', ''),
                                    "brand_id": brand_id
                                })
                    elif data.get('@type') == 'Product':
                        products.append({
                            "name": data.get('name'),
                            "sku": data.get('sku', ''),
                            "price": data.get('price', ''),
                            "brand_id": brand_id
                        })
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and 'name' in item:
                            products.append({
                                "name": item['name'],
                                "sku": item.get('sku', ''),
                                "price": item.get('price', ''),
                                "brand_id": brand_id
                            })
            except:
                pass

        # Strategy 3: Look for common product containers
        # Check for elements with product-like content
        product_patterns = [
            {'name': 'h2', 'price': 'next_span_with_digit'},
            {'name': 'h3', 'price': 'nearby_currency'},
            {'name': 'a.product-link', 'price': 'nearby_span'},
        ]

        # Find all headers that might be product names
        headers = soup.find_all(['h2', 'h3', 'h4'])
        for header in headers:
            text = header.get_text(strip=True)

            # Filter out navigation/UI elements
            if text and 3 < len(text) < 150 and not any(x in text.lower() for x in
                                                        ['menu', 'nav', 'home', 'about', 'contact', 'search', 'filter', 'sort']):

                # Look for price near this header
                parent = header.parent
                price_match = None

                # Check parent and siblings
                for elem in parent.find_all(text=re.compile(r'\$|€|£')):
                    price_text = elem.get_text(strip=True)
                    if re.search(r'\$\s*[\d,]+', price_text):
                        price_match = price_text
                        break

                if text not in product_names:
                    products.append({
                        "name": text,
                        "price": price_match or "",
                        "brand_id": brand_id
                    })
                    product_names.add(text)

        # Strategy 4: Look for links that look like products
        all_links = soup.find_all('a', href=True)
        for link in all_links:
            href = link.get('href', '')
            link_text = link.get_text(strip=True)

            # Product links often contain /product/, /item/, /catalog/
            if any(x in href.lower() for x in ['/product', '/item', '/catalog', '/shop']):
                if link_text and 3 < len(link_text) < 150 and link_text not in product_names:
                    products.append({
                        "name": link_text,
                        "url": urljoin("https://example.com", href),
                        "brand_id": brand_id
                    })
                    product_names.add(link_text)

        # Deduplicate and clean
        seen = set()
        unique = []
        for p in products:
            if not p.get('name'):
                continue
            key = p['name'].lower().strip()
            if key not in seen and len(key) > 2:
                seen.add(key)
                unique.append(p)

        return unique

    async def smart_scrape_brand(self, brand_id: str) -> Optional[List[Dict]]:
        """Smartly scrape a brand using multiple strategies."""
        logger.info(f"\n🎯 {brand_id.upper()}")

        expected = self.halilit_counts.get(brand_id, 0)
        logger.info(f"   Target: ~{expected} products (from Halilit)")

        # Determine primary URLs
        urls = self._get_product_urls(brand_id)

        best_products = None
        best_count = 0

        # Strategy 1: Try to reverse-engineer API
        for base_url in urls:
            products = await self.reverse_engineer_api(brand_id, base_url)
            if products and len(products) > best_count:
                best_products = products
                best_count = len(products)
                if len(products) >= expected * 0.6:
                    return products

        # Strategy 2: Intelligent page analysis
        for url in urls:
            products = await self.intelligent_page_analysis(brand_id, url)
            if products and len(products) > best_count:
                best_products = products
                best_count = len(products)
                if len(products) >= expected * 0.6:
                    return products

        # Return best attempt even if < 60%
        if best_products:
            logger.warning(
                f"   ⚠️  Partial scrape: {best_count} products (only {round(100*best_count/expected)}% of expected)")
            return best_products

        logger.warning(f"   ❌ Could not scrape {brand_id}")
        return None

    def _get_product_urls(self, brand_id: str) -> List[str]:
        """Get product page URLs for each brand."""
        urls_map = {
            "nord": ["https://www.nordkeyboards.com/products"],
            "pearl": ["https://www.pearldrum.com/products"],
            "boss": ["https://www.boss.info/en-us/products/"],
            "m-audio": ["https://www.m-audio.com/products"],
            "remo": ["https://www.remo.com/products"],
            "paiste-cymbals": ["https://www.paiste.com/en/products"],
            "roland": ["https://www.roland.com/us/products"],
            "mackie": ["https://www.mackie.com/en-us/products"],
            "presonus": ["https://www.presonus.com/en-US/products"],
            "akai-professional": ["https://www.akaipro.com/products"],
            "krk-systems": ["https://www.krksys.com/products"],
            "rcf": ["https://www.rcf.it/en/products"],
            "dynaudio": ["https://www.dynaudio.com/products"],
            "xotic": ["https://www.xotic.cc/products"],
            "adam-audio": ["https://www.adam-audio.com/en/products"],
            "rogers": ["https://www.rogersdrums.com/products"],
            "oberheim": ["https://www.oberheim.com/products"],
            "headrush-fx": ["https://www.headrushsampler.com/products"],
        }
        return urls_map.get(brand_id, [f"https://www.{brand_id}.com/products"])

    async def scrape_all_smart(self):
        """Scrape all brands intelligently."""
        logger.info("\n" + "=" * 70)
        logger.info("🧠 INTELLIGENT BRAND SCRAPER")
        logger.info("=" * 70)

        for brand_id in sorted(self.halilit_counts.keys()):
            products = await self.smart_scrape_brand(brand_id)

            if products and len(products) > 0:
                # Save catalog
                catalog = {
                    "brand_id": brand_id,
                    "products": products,
                    "product_count": len(products),
                    "expected_count": self.halilit_counts[brand_id],
                    "timestamp": datetime.now().isoformat(),
                    "status": "success"
                }

                catalog_file = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
                CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)

                with open(catalog_file, 'w') as f:
                    json.dump(catalog, f, indent=2)

                expected = self.halilit_counts[brand_id]
                actual = len(products)
                pct = round(100 * actual / expected, 1) if expected > 0 else 0

                status = "✅" if pct >= 60 else "⚠️"
                logger.info(
                    f"   {status} {actual} products ({pct}% of {expected})")

                self.results[brand_id] = actual
            else:
                self.results[brand_id] = 0

        # Summary
        logger.info("\n" + "=" * 70)
        logger.info("📊 SCRAPING RESULTS")
        logger.info("=" * 70)

        total_scraped = sum(self.results.values())
        total_halilit = sum(self.halilit_counts.values())
        overall_pct = round(100 * total_scraped /
                            total_halilit, 1) if total_halilit > 0 else 0

        successful = sum(1 for c in self.results.values() if c > 0)

        logger.info(f"\n{successful}/{len(self.results)} brands successful")
        logger.info(
            f"Total: {total_scraped}/{total_halilit} products ({overall_pct}%)")
        logger.info(" ")

        for brand_id in sorted(self.results.keys(),
                               key=lambda b: self.results[b], reverse=True):
            count = self.results[brand_id]
            expected = self.halilit_counts[brand_id]
            pct = round(100 * count / expected, 1) if expected > 0 else 0
            status = "✅" if count > 0 else "❌"
            logger.info(
                f"   {status} {brand_id:20} │ {count:3}/{expected:3} ({pct:5.1f}%)")


async def main():
    scraper = IntelligentBrandScraper()
    await scraper.scrape_all_smart()


if __name__ == "__main__":
    asyncio.run(main())
