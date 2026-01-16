#!/usr/bin/env python3
"""
Halilit Product Scraper - PRIMARY SOURCE OF TRUTH

Scrapes products directly from Halilit's website for each brand.
All images and data are official and approved by brands.

Source: https://www.halilit.com/g/5193-Brand/{brand-id}
"""

from app.utils.hebrew import detect_hebrew, normalize_model_from_text, extract_price_ils, extract_multiple_prices
import asyncio
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
from urllib.parse import urlsplit, parse_qs, urlencode, urlunsplit
import httpx
from bs4 import BeautifulSoup
import sys

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Hebrew utils

# Brand number mapping (Halilit internal IDs)
BRAND_HALILIT_IDS = {
    'roland': '87',
    'rcf': '61',
    'nord': 'nord',
    'boss': 'boss',
    'pearl': 'pearl',
    'yamaha': 'yamaha',
    'akai-professional': 'akai-professional',
    'adam-audio': 'adam-audio',
    'dynaudio': 'dynaudio',
    'krk-systems': 'krk-systems',
    'm-audio': 'm-audio',
    'mackie': 'mackie',
    'oberheim': 'oberheim',
    'paiste-cymbals': 'paiste-cymbals',
    'presonus': 'presonus',
    'remo': 'remo',
    'rogers': 'rogers',
    'xotic': 'xotic',
    'headrush-fx': 'headrush-fx'
}


class HalilitScraper:
    """Scrape products from Halilit's official inventory"""

    def __init__(self):
        self.base_url = "https://www.halilit.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (compatible; HSC-JIT-HalilitScraper/3.5)"
        }
        self.data_dir = Path(__file__).parent.parent / "data"
        self.catalogs_dir = self.data_dir / "catalogs_halilit"
        self.catalogs_dir.mkdir(parents=True, exist_ok=True)

    async def scrape_brand(self, brand_id: str, brand_url: str, max_pages: int = 20) -> Dict[str, Any]:
        """
        Scrape all products for a brand from Halilit's website.

        Returns:
            {
                "brand_id": str,
                "source": "halilit",
                "products": List[Dict],
                "total_products": int,
                "pages_scraped": int
            }
        """
        print(f"\n🛒 [HALILIT] Scraping brand: {brand_id}")
        print(f"   URL: {brand_url}")

        all_products: List[Dict[str, Any]] = []
        seen_ids: set = set()  # Track unique product IDs
        current_url = brand_url
        pages_scraped = 0
        page_counter = 1
        pages_with_no_new_products = 0

        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            while current_url and pages_scraped < max_pages:
                try:
                    print(f"   📄 Page {pages_scraped + 1}: {current_url}")
                    response = await client.get(current_url, headers=self.headers)
                    response.raise_for_status()

                    soup = BeautifulSoup(response.text, 'html.parser')

                    # Extract products from this page
                    products = self._extract_products(soup, brand_id)

                    # Deduplicate by product ID/URL
                    new_products = []
                    for product in products:
                        # Create unique key from halilit_id, url, or name
                        product_key = (
                            product.get('halilit_id') or
                            product.get('url') or
                            product.get('name')
                        )
                        if product_key and product_key not in seen_ids:
                            seen_ids.add(product_key)
                            new_products.append(product)

                    if not new_products:
                        pages_with_no_new_products += 1
                        print(f"      ⚠️  No new products found (all duplicates)")
                        # Stop if we get 2 consecutive pages with no new products
                        if pages_with_no_new_products >= 2:
                            print(
                                f"      🛑 Stopping - no new products for {pages_with_no_new_products} pages")
                            break
                    else:
                        pages_with_no_new_products = 0
                        all_products.extend(new_products)
                        print(
                            f"      ✓ Found {len(new_products)} new products (total: {len(all_products)})")

                    pages_scraped += 1

                    # Stop if we got no products at all (empty page)
                    if not products:
                        print(f"      🛑 Empty page - stopping pagination")
                        break

                    # Find next page
                    next_url = self._find_next_page(soup, current_url)
                    if not next_url or next_url == current_url:
                        # Fallback: try explicit ?page=N pagination if no next link was found
                        candidate = self._increment_page_url(
                            brand_url, page_counter + 1)
                        if candidate and candidate != current_url and pages_scraped < max_pages:
                            current_url = candidate
                            page_counter += 1
                            await asyncio.sleep(1)
                            continue
                        break

                    current_url = next_url
                    page_counter += 1
                    await asyncio.sleep(1)  # Be polite

                except Exception as e:
                    print(f"      ❌ Error: {e}")
                    break

        return {
            "brand_id": brand_id,
            "source": "halilit",
            "products": all_products,
            "total_products": len(all_products),
            "pages_scraped": pages_scraped
        }

    def _increment_page_url(self, url: str, next_page: int) -> str:
        """Build a URL with the next page parameter."""
        parts = urlsplit(url)
        query = parse_qs(parts.query)
        query['page'] = [str(next_page)]
        new_query = urlencode(query, doseq=True)
        return urlunsplit((parts.scheme, parts.netloc, parts.path, new_query, parts.fragment))

    def _extract_products(self, soup: BeautifulSoup, brand_id: str) -> List[Dict[str, Any]]:
        """Extract products from a Halilit page"""
        products = []

        # Halilit uses .layout_list_item for product items
        # Try the main selector first
        product_containers = soup.select('.layout_list_item')

        # Fallback patterns if main selector doesn't work
        if not product_containers:
            product_containers.extend(soup.select('.item_gallery_view'))
            product_containers.extend(soup.select('.product-item'))
            product_containers.extend(soup.select('[data-product-id]'))

        for item in product_containers:
            try:
                product = self._parse_product_item(item, brand_id)
                if product and product.get('name'):
                    products.append(product)
            except Exception as e:
                print(f"         ⚠️  Error parsing product: {e}")
                continue

        return products

    def _parse_product_item(self, item: BeautifulSoup, brand_id: str) -> Optional[Dict[str, Any]]:
        """Parse a single product item"""
        product = {}

        # Get data attributes (Halilit has rich data attributes)
        product['halilit_id'] = item.get('id', '').replace('item_id_', '')
        product['item_code'] = item.get('data-item-code', '')
        product['category'] = item.get('data-category-title', '')

        # Product name - find the first link with meaningful text
        # Halilit has multiple links, we want the one with the product name
        links = [a for a in item.find_all('a', href=True) if a.get('href')]
        name_elem = None
        for link in links:
            text = link.get_text(strip=True)
            # Look for links with reasonable text length that aren't just numbers/symbols
            if text and len(text) > 5 and len(text) < 200:
                name_elem = link
                break

        if name_elem:
            product['name'] = name_elem.get_text(strip=True)
            product['url'] = name_elem.get('href', '')
            if product['url'] and not product['url'].startswith('http'):
                product['url'] = f"{self.base_url}{product['url']}"
            # Hebrew-localized title and normalized model for matching
            product['title_he'] = product['name'] if detect_hebrew(
                product['name']) else None
            norm_model = normalize_model_from_text(product['name'])
            if norm_model:
                product['normalized_sku'] = norm_model

        # Product ID from URL if not already set
        if 'url' in product and not product.get('halilit_id'):
            match = re.search(r'/(\d+)-', product['url'])
            if match:
                product['halilit_id'] = match.group(1)

        # Image
        img_elem = item.select_one('img')
        if img_elem:
            img_url = (
                img_elem.get('src') or
                img_elem.get('data-src') or
                img_elem.get('data-lazy')
            )
            if img_url:
                if img_url.startswith('//'):
                    img_url = f"https:{img_url}"
                elif not img_url.startswith('http'):
                    img_url = f"{self.base_url}{img_url}"
                product['image_url'] = img_url
                product['thumbnail_url'] = img_url

        # Price - extract all three types
        price_container = item  # The entire item is the price container
        prices = extract_multiple_prices(price_container)

        # Store all available prices
        if prices['regular_price']:
            product['price_ils'] = prices['regular_price']
            product['price'] = str(int(prices['regular_price']))
            product['currency'] = 'ILS'

        if prices['original_price']:
            product['original_price_ils'] = prices['original_price']

        if prices['eilat_price']:
            product['eilat_price_ils'] = prices['eilat_price']

        # If no regular price but have eilat, use eilat as main
        if not prices['regular_price'] and prices['eilat_price']:
            product['price_ils'] = prices['eilat_price']
            product['price'] = str(int(prices['eilat_price']))
            product['currency'] = 'ILS'

        # Availability
        stock_elem = item.select_one('.stock_status, .availability')
        if stock_elem:
            stock_text = stock_elem.get_text(strip=True)
            product['in_stock'] = 'במלאי' in stock_text or 'in stock' in stock_text.lower()

        # Brand
        product['brand'] = brand_id
        product['source'] = 'halilit'
        product['distributor'] = 'Halilit Music Center'

        return product if product.get('name') else None

    def _find_next_page(self, soup: BeautifulSoup, current_url: str) -> Optional[str]:
        """Find the next page URL"""
        # Look for pagination links
        next_link = (
            soup.select_one('.pagination .next a') or
            soup.select_one('a[rel="next"]') or
            soup.select_one('.next-page a')
        )

        if next_link:
            href = next_link.get('href')
            if href:
                if href.startswith('http'):
                    return href
                elif href.startswith('/'):
                    return f"{self.base_url}{href}"
                else:
                    # Relative to current page
                    return f"{current_url.rsplit('/', 1)[0]}/{href}"

        return None

    def save_catalog(self, brand_id: str, data: Dict[str, Any]) -> Path:
        """Save Halilit catalog for a brand"""
        catalog_path = self.catalogs_dir / f"{brand_id}_halilit.json"

        # Build catalog in standard format
        catalog = {
            "source": "halilit",
            "distributor": "Halilit Music Center",
            "brand_id": brand_id,
            "halilit_brand_number": BRAND_HALILIT_IDS.get(brand_id),
            "total_products": data['total_products'],
            "products": data['products'],
            "metadata": {
                "pages_scraped": data['pages_scraped'],
                "scrape_date": None  # Add timestamp if needed
            }
        }

        with open(catalog_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        print(
            f"   💾 Saved {data['total_products']} products to {catalog_path}")
        return catalog_path


async def main():
    """Test scraper with a single brand"""
    import argparse

    parser = argparse.ArgumentParser(description="Scrape Halilit products")
    parser.add_argument("--brand-id", required=True,
                        help="Brand ID (e.g., roland)")
    parser.add_argument("--url", required=True, help="Halilit brand page URL")
    parser.add_argument("--max-pages", type=int, default=20,
                        help="Max pages to scrape")

    args = parser.parse_args()

    scraper = HalilitScraper()
    result = await scraper.scrape_brand(args.brand_id, args.url, args.max_pages)

    print(f"\n✅ Scraped {result['total_products']} products from Halilit")
    scraper.save_catalog(args.brand_id, result)


if __name__ == "__main__":
    asyncio.run(main())
