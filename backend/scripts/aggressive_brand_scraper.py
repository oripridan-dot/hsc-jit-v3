#!/usr/bin/env python3
"""
AGGRESSIVE BRAND SCRAPER - NEVER GIVE UP
Multiple fallback strategies, retry logic, aggressive data extraction.
"""

import asyncio
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import logging
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
SCRAPER_DOCS_DIR = BACKEND_DIR / "docs" / "brand_scrapers"

# Import Playwright
try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
    import aiohttp
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.run(["pip", "install", "playwright",
                   "aiohttp", "beautifulsoup4", "-q"])
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
    import aiohttp

BRAND_CONFIGS = {
    "nord": {
        "expected_product_count": 90,
        "urls": ["https://www.nordkeyboards.com/products"],
        "selectors": [".product", "[data-product]", ".product-item", ".product-card"],
        "text_patterns": [r"nord\s+\w+", r"keyboard|synth"]
    },
    "pearl": {
        "expected_product_count": 364,
        "urls": ["https://www.pearldrum.com/products", "https://www.pearldrum.com/en-us/products"],
        "selectors": [".product", "[data-product]", ".product-item", ".drum-product"],
        "text_patterns": [r"pearl\s+\w+", r"drum|cymbal"]
    },
    "boss": {
        "expected_product_count": 260,
        "urls": ["https://www.boss.info/en-us/products", "https://www.bosscorp.jp/e/products"],
        "selectors": [".product", "[data-product]", ".product-row", ".effect"],
        "text_patterns": [r"boss\s+\w+", r"effect|pedal"]
    },
    "m-audio": {
        "expected_product_count": 312,
        "urls": ["https://www.m-audio.com/products", "https://www.m-audio.com/en/products"],
        "selectors": [".product", "[data-product]", ".product-item", "[class*=product]"],
        "text_patterns": [r"m[- ]?audio", r"controller|interface"]
    },
    "remo": {
        "expected_product_count": 224,
        "urls": ["https://www.remo.com/products"],
        "selectors": [".product", "[data-product]", ".drum-product", ".product-card"],
        "text_patterns": [r"remo", r"drum|head"]
    },
    "paiste-cymbals": {
        "expected_product_count": 151,
        "urls": ["https://www.paiste.com/en/products", "https://www.paiste.com/products"],
        "selectors": [".product", "[data-product]", ".cymbal", ".cymbal-product"],
        "text_patterns": [r"paiste", r"cymbal"]
    },
    "roland": {
        "expected_product_count": 74,
        "urls": ["https://www.roland.com/us/products", "https://www.roland.com/en/products"],
        "selectors": [".product", "[data-product]", ".product-item", ".roland-product"],
        "text_patterns": [r"roland", r"keyboard|drum"]
    },
    "mackie": {
        "expected_product_count": 219,
        "urls": ["https://www.mackie.com/en-us/products", "https://www.mackie.com/products"],
        "selectors": [".product", "[data-product]", ".mackie-product", ".speaker"],
        "text_patterns": [r"mackie", r"speaker|mixer"]
    },
    "presonus": {
        "expected_product_count": 106,
        "urls": ["https://www.presonus.com/en-US/products", "https://www.presonus.com/products"],
        "selectors": [".product", "[data-product]", ".presonus-product", ".audio-product"],
        "text_patterns": [r"presonus", r"interface|studio"]
    },
    "akai-professional": {
        "expected_product_count": 35,
        "urls": ["https://www.akaipro.com/products"],
        "selectors": [".product", "[data-product]", ".controller", ".akai-product"],
        "text_patterns": [r"akai", r"controller|mpc"]
    },
    "krk-systems": {
        "expected_product_count": 17,
        "urls": ["https://www.krksys.com/products"],
        "selectors": [".product", "[data-product]", ".monitor", ".speaker"],
        "text_patterns": [r"krk", r"monitor|speaker"]
    },
    "rcf": {
        "expected_product_count": 74,
        "urls": ["https://www.rcf.it/en/products"],
        "selectors": [".product", "[data-product]", ".speaker", ".audio-product"],
        "text_patterns": [r"rcf", r"speaker"]
    },
    "dynaudio": {
        "expected_product_count": 22,
        "urls": ["https://www.dynaudio.com/products"],
        "selectors": [".product", "[data-product]", ".monitor", ".speaker"],
        "text_patterns": [r"dynaudio", r"monitor"]
    },
    "xotic": {
        "expected_product_count": 28,
        "urls": ["https://www.xotic.cc/products"],
        "selectors": [".product", "[data-product]", ".pedal", ".effect"],
        "text_patterns": [r"xotic", r"pedal|effect"]
    },
    "adam-audio": {
        "expected_product_count": 26,
        "urls": ["https://www.adam-audio.com/en/products"],
        "selectors": [".product", "[data-product]", ".monitor", ".speaker"],
        "text_patterns": [r"adam", r"monitor"]
    },
    "rogers": {
        "expected_product_count": 9,
        "urls": ["https://www.rogersdrums.com/products"],
        "selectors": [".product", "[data-product]", ".drum-product"],
        "text_patterns": [r"rogers", r"drum"]
    },
    "oberheim": {
        "expected_product_count": 6,
        "urls": ["https://www.oberheim.com/products"],
        "selectors": [".product", "[data-product]", ".synth"],
        "text_patterns": [r"oberheim", r"synthesizer"]
    },
    "headrush-fx": {
        "expected_product_count": 4,
        "urls": ["https://www.headrushsampler.com/products"],
        "selectors": [".product", "[data-product]", ".sampler"],
        "text_patterns": [r"headrush", r"sampler"]
    },
}


class AggressiveScraper:
    """Aggressively scrape brand websites with multiple fallback strategies."""

    def __init__(self):
        self.results = {}
        self.alerts = []
        SCRAPER_DOCS_DIR.mkdir(parents=True, exist_ok=True)

    async def try_api_extraction(self, brand_id: str) -> Optional[List[Dict]]:
        """Try to extract from API endpoints."""
        logger.info("   📡 Attempting API extraction...")

        api_patterns = [
            f"https://{brand_id.replace('-', '')}.com/api/products",
            f"https://www.{brand_id.replace('-', '')}.com/api/products",
            f"https://www.{brand_id}.com/api/v1/products",
        ]

        for api_url in api_patterns:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(api_url, timeout=aiohttp.ClientTimeout(total=10), ssl=False) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            products = data.get("products", [])
                            if products:
                                logger.info(
                                    f"      ✅ Got {len(products)} from API")
                                return products
            except:
                pass

        return None

    async def try_browser_extraction(self, brand_id: str, url: str, selectors: List[str]) -> Optional[List[Dict]]:
        """Try extracting with Playwright browser automation."""
        logger.info(f"   🎭 Attempting browser extraction from {url}...")

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled'])
                page = await browser.new_page(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )

                # Navigate with aggressive retry
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        await page.goto(url, wait_until='networkidle', timeout=30000)
                        break
                    except:
                        if attempt < max_retries - 1:
                            logger.info(
                                f"      Retry {attempt + 1}/{max_retries}...")
                            await asyncio.sleep(2)
                        else:
                            logger.info("      Trying domcontentloaded...")
                            await page.goto(url, wait_until='domcontentloaded', timeout=25000)

                # Aggressive scrolling to trigger lazy loading
                await page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                await asyncio.sleep(3)
                await page.evaluate("window.scrollBy(0, document.body.scrollHeight)")
                await asyncio.sleep(2)

                products = []

                # Try each selector aggressively
                for selector in selectors:
                    try:
                        elements = await page.query_selector_all(selector)
                        if len(elements) > 5:  # Found meaningful results
                            logger.info(
                                f"      Found {len(elements)} elements with '{selector}'")

                            for elem in elements[:200]:  # Extract up to 200
                                try:
                                    text = await elem.inner_text()
                                    html = await elem.inner_html()

                                    # Extract product name
                                    if text and len(text.strip()) > 2:
                                        name = text.split(
                                            '\n')[0][:150].strip()

                                        # Extract price if available
                                        price_match = re.search(
                                            r'\$[\d,]+', text)
                                        price = price_match.group(
                                            0) if price_match else ""

                                        products.append({
                                            "name": name,
                                            "price": price,
                                            "brand_id": brand_id,
                                            "source": "browser_scrape"
                                        })
                                except:
                                    pass

                            if products:
                                logger.info(
                                    f"      ✅ Extracted {len(products)} products")
                                await browser.close()
                                return products
                    except:
                        pass

                await browser.close()

        except Exception as e:
            logger.warning(f"      Browser extraction failed: {e}")

        return None

    async def try_html_parsing(self, brand_id: str, url: str, text_patterns: List[str]) -> Optional[List[Dict]]:
        """Try parsing HTML directly with BeautifulSoup."""
        logger.info(f"   🔍 Attempting HTML parsing...")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=15), ssl=False) as resp:
                    html = await resp.text()

                    soup = BeautifulSoup(html, 'html.parser')
                    products = []

                    # Try to find product containers
                    product_divs = soup.find_all(
                        ['div', 'article', 'li'], class_=re.compile('product', re.I))

                    if not product_divs:
                        # Try data attributes
                        product_divs = soup.find_all(
                            attrs={'data-product': True})

                    if not product_divs:
                        # Try any container with h2/h3 tags (likely product names)
                        product_divs = soup.find_all(
                            ['section', 'div'], limit=200)

                    logger.info(
                        f"      Found {len(product_divs)} potential product elements")

                    for div in product_divs[:200]:
                        text = div.get_text(strip=True)

                        # Look for headers (likely product names)
                        header = div.find(['h2', 'h3', 'h4', 'a'])
                        if header:
                            name = header.get_text(strip=True)

                            if name and len(name) > 2 and len(name) < 200:
                                # Extract price
                                price_match = re.search(r'\$[\d,\.]+', text)
                                price = price_match.group(
                                    0) if price_match else ""

                                products.append({
                                    "name": name,
                                    "price": price,
                                    "brand_id": brand_id,
                                    "source": "html_parse"
                                })

                    # Deduplicate
                    seen = set()
                    unique = []
                    for p in products:
                        key = p['name'].lower()
                        if key not in seen and len(key) > 2:
                            seen.add(key)
                            unique.append(p)

                    if unique:
                        logger.info(
                            f"      ✅ Extracted {len(unique)} unique products")
                        return unique

        except Exception as e:
            logger.warning(f"      HTML parsing failed: {e}")

        return None

    async def try_regex_extraction(self, brand_id: str, url: str) -> Optional[List[Dict]]:
        """Final aggressive: extract using regex patterns."""
        logger.info(f"   🔥 Attempting regex extraction...")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=15), ssl=False) as resp:
                    html = await resp.text()

                    products = []

                    # Extract potential product names (text between common tags)
                    patterns = [
                        r'<h2[^>]*>([^<]+)</h2>',
                        r'<h3[^>]*>([^<]+)</h3>',
                        r'<h4[^>]*>([^<]+)</h4>',
                        r'<a[^>]*title="([^"]+)"',
                        r'<span[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)',
                        r'data-product-name="([^"]+)"',
                        r'"name":\s*"([^"]+)"',
                    ]

                    for pattern in patterns:
                        matches = re.findall(pattern, html, re.IGNORECASE)
                        for match in matches:
                            if isinstance(match, tuple):
                                name = match[0]
                            else:
                                name = match

                            name = name.strip()

                            if name and 3 < len(name) < 200 and not name.startswith('<'):
                                products.append({
                                    "name": name,
                                    "brand_id": brand_id,
                                    "source": "regex_extract"
                                })

                    # Deduplicate
                    seen = set()
                    unique = []
                    for p in products:
                        key = p['name'].lower()
                        if key not in seen:
                            seen.add(key)
                            unique.append(p)

                    if unique:
                        logger.info(
                            f"      ✅ Regex extracted {len(unique)} products")
                        return unique

        except Exception as e:
            logger.warning(f"      Regex extraction failed: {e}")

        return None

    async def scrape_brand_aggressive(self, brand_id: str) -> Optional[List[Dict]]:
        """Scrape with aggressive fallback strategies."""
        config = BRAND_CONFIGS.get(brand_id)
        if not config:
            return None

        logger.info(f"\n🎯 {brand_id.upper()}")
        logger.info(f"   Target: ~{config['expected_product_count']} products")

        # Strategy 1: Try API
        products = await self.try_api_extraction(brand_id)
        if products and len(products) > config['expected_product_count'] * 0.5:
            return products

        # Strategy 2: Try browser for each URL
        for url in config['urls']:
            products = await self.try_browser_extraction(brand_id, url, config['selectors'])
            if products and len(products) > config['expected_product_count'] * 0.5:
                return products

        # Strategy 3: Try HTML parsing for each URL
        for url in config['urls']:
            products = await self.try_html_parsing(brand_id, url, config['text_patterns'])
            if products and len(products) > config['expected_product_count'] * 0.5:
                return products

        # Strategy 4: Try regex for each URL
        for url in config['urls']:
            products = await self.try_regex_extraction(brand_id, url)
            if products and len(products) > config['expected_product_count'] * 0.5:
                return products

        logger.warning(f"   ❌ Could not scrape {brand_id} effectively")
        return None

    async def scrape_all_aggressive(self):
        """Aggressively scrape all brands."""
        logger.info("\n" + "=" * 70)
        logger.info("🔥 AGGRESSIVE BRAND SCRAPER - NEVER GIVE UP")
        logger.info("=" * 70)

        for brand_id in sorted(BRAND_CONFIGS.keys()):
            products = await self.scrape_brand_aggressive(brand_id)

            if products:
                # Save catalog
                catalog = {
                    "brand_id": brand_id,
                    "products": products,
                    "product_count": len(products),
                    "expected_count": BRAND_CONFIGS[brand_id]['expected_product_count'],
                    "timestamp": datetime.now().isoformat(),
                    "status": "success"
                }

                catalog_file = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
                CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)

                with open(catalog_file, 'w') as f:
                    json.dump(catalog, f, indent=2)

                # Check for deviation
                expected = BRAND_CONFIGS[brand_id]['expected_product_count']
                actual = len(products)
                deviation = abs(actual - expected) / \
                    expected * 100 if expected > 0 else 0

                status = "✅" if deviation < 50 else "⚠️"
                logger.info(
                    f"   {status} Saved {actual} products (expected {expected}, {deviation:.1f}% deviation)")

                self.results[brand_id] = len(products)
            else:
                self.results[brand_id] = 0

        # Summary
        logger.info("\n" + "=" * 70)
        logger.info("📊 AGGRESSIVE SCRAPING RESULTS")
        logger.info("=" * 70)

        total = sum(self.results.values())
        successful = sum(1 for c in self.results.values() if c > 0)

        logger.info(f"\nSuccessful brands: {successful}/{len(BRAND_CONFIGS)}")
        logger.info(f"Total products: {total}")

        for brand_id, count in sorted(self.results.items(), key=lambda x: x[1], reverse=True):
            status = "✅" if count > 0 else "❌"
            expected = BRAND_CONFIGS[brand_id]['expected_product_count']
            logger.info(f"   {status} {brand_id:20} │ {count:3}/{expected:3}")


async def main():
    scraper = AggressiveScraper()
    await scraper.scrape_all_aggressive()


if __name__ == "__main__":
    # Install dependencies if needed
    try:
        from bs4 import BeautifulSoup
    except:
        import subprocess
        subprocess.run(["pip", "install", "beautifulsoup4", "-q"])

    asyncio.run(main())
