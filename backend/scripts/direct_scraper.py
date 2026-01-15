#!/usr/bin/env python3
"""
SYNCHRONOUS DIRECT SCRAPER - NO ASYNC DELAYS
Just extract the data. Simple. Direct. Works.
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import logging
import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"

# Brand mappings
BRANDS = {
    "nord": ("https://www.nordkeyboards.com/products", 90),
    "pearl": ("https://www.pearldrum.com/products", 364),
    "boss": ("https://www.boss.info/en-us/products/", 260),
    "m-audio": ("https://www.m-audio.com/products", 312),
    "remo": ("https://www.remo.com/products", 224),
    "paiste-cymbals": ("https://www.paiste.com/en/products", 151),
    "roland": ("https://www.roland.com/us/products", 74),
    "mackie": ("https://www.mackie.com/en-us/products", 219),
    "presonus": ("https://www.presonus.com/en-US/products", 106),
    "akai-professional": ("https://www.akaipro.com/products", 35),
    "krk-systems": ("https://www.krksys.com/products", 17),
    "rcf": ("https://www.rcf.it/en/products", 74),
    "dynaudio": ("https://www.dynaudio.com/products", 22),
    "xotic": ("https://www.xotic.cc/products", 28),
    "adam-audio": ("https://www.adam-audio.com/en/products", 26),
    "rogers": ("https://www.rogersdrums.com/products", 9),
    "oberheim": ("https://www.oberheim.com/products", 6),
    "headrush-fx": ("https://www.headrushsampler.com/products", 4),
}


def extract_from_html(html: str) -> List[Dict]:
    """Extract products from HTML directly."""
    soup = BeautifulSoup(html, 'html.parser')
    products = []
    seen = set()

    # Find all h2, h3 tags (common for product names)
    for tag in soup.find_all(['h2', 'h3', 'h4']):
        text = tag.get_text(strip=True)

        # Filter out nav/ui elements
        if not text or len(text) < 3 or len(text) > 200:
            continue
        if any(x in text.lower() for x in ['menu', 'home', 'about', 'contact', 'search']):
            continue

        key = text.lower()
        if key not in seen:
            seen.add(key)
            products.append({"name": text})

    # Find all links that might be products
    for link in soup.find_all('a'):
        href = link.get('href', '')
        text = link.get_text(strip=True)

        if any(x in href.lower() for x in ['/product', '/item', '/catalog']):
            if text and 3 < len(text) < 150:
                key = text.lower()
                if key not in seen:
                    seen.add(key)
                    products.append({"name": text})

    return products


def scrape_brand(brand_id: str, url: str, expected: int) -> List[Dict]:
    """Scrape a single brand."""
    logger.info(f"🎯 {brand_id:20} │ Target: {expected:3} products │ ", end="")

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=15, verify=False)
        response.raise_for_status()

        products = extract_from_html(response.text)

        if products:
            logger.info(f"✅ {len(products):3}")
            return products
        else:
            logger.info(f"❌ 0")
            return []

    except Exception as e:
        logger.info(f"❌ Error: {str(e)[:20]}")
        return []


def main():
    """Scrape all brands."""
    logger.info("\n" + "=" * 90)
    logger.info("🚀 DIRECT SYNCHRONOUS SCRAPER")
    logger.info("=" * 90 + "\n")

    # Disable SSL warnings
    requests.packages.urllib3.disable_warnings()

    results = {}

    for brand_id, (url, expected) in sorted(BRANDS.items()):
        products = scrape_brand(brand_id, url, expected)
        results[brand_id] = products

        # Save immediately
        if products:
            catalog = {
                "brand_id": brand_id,
                "products": products,
                "count": len(products),
                "expected": expected,
                "timestamp": datetime.now().isoformat()
            }

            CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)
            with open(CATALOGS_BRAND_DIR / f"{brand_id}_brand.json", 'w') as f:
                json.dump(catalog, f, indent=2)

    # Summary
    logger.info("\n" + "=" * 90)
    logger.info("📊 RESULTS")
    logger.info("=" * 90)

    total_scraped = sum(len(p) for p in results.values())
    total_expected = sum(expected for _, expected in BRANDS.values())
    successful = sum(1 for p in results.values() if len(p) > 0)

    logger.info(f"\nSuccessful: {successful}/{len(BRANDS)}")
    logger.info(
        f"Total: {total_scraped}/{total_expected} products ({round(100*total_scraped/total_expected, 1)}%)\n")

    for brand_id in sorted(results.keys(), key=lambda b: len(results[b]), reverse=True):
        products = results[brand_id]
        expected = BRANDS[brand_id][1]
        count = len(products)
        pct = round(100 * count / expected, 1) if expected else 0
        status = "✅" if count > 0 else "❌"
        logger.info(
            f"   {status} {brand_id:20} │ {count:3}/{expected:3} ({pct:5.1f}%)")


if __name__ == "__main__":
    main()
