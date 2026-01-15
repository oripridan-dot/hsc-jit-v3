#!/usr/bin/env python3
"""
Category-aware harvester for brands with nested product structures
"""
from app.services.harvester import HarvesterService
import asyncio
import json
import httpx
from bs4 import BeautifulSoup
from pathlib import Path
import sys
from typing import List, Dict

# Add parent dir to path for imports
sys.path.append(str(Path(__file__).parent.parent))


class CategoryHarvester:
    """Scraper that follows category links to get all products"""

    def __init__(self, brand_id: str):
        self.brand_id = brand_id
        self.harvester_service = HarvesterService()
        self.all_products = []

    async def harvest_with_categories(self, max_products_per_category: int = 50):
        """
        First scrape main page to get categories,
        then follow each category link to get individual products
        """
        print(f"🔍 [CATEGORY HARVESTER] Starting for: {self.brand_id}")

        # Step 1: Get category pages
        print(f"📂 [STEP 1] Scraping category pages...")
        result = await self.harvester_service.harvest_brand(self.brand_id, max_pages=1)

        if not result.get("success"):
            print(f"❌ Failed to scrape categories: {result.get('error')}")
            return []

        # Read the generated catalog to get category pages
        catalog_path = Path(result["catalog_path"])
        with open(catalog_path, 'r') as f:
            catalog_data = json.load(f)

        categories = catalog_data.get("products", [])

        if not categories:
            print(f"❌ No categories found for {self.brand_id}")
            return []

        print(f"✅ Found {len(categories)} categories")

        # Step 2: For each category that has a documentation.url, scrape it
        for category in categories:
            doc_url = category.get("documentation", {}).get("url")
            if not doc_url:
                # This is already a product, keep it
                self.all_products.append(category)
                continue

            print(f"\n📦 Scraping category: {category['name']}")
            print(f"   URL: {doc_url}")

            # Scrape products from this category
            try:
                products = await self._scrape_category_products(
                    doc_url,
                    category['name'],
                    max_products_per_category
                )
                print(
                    f"   ✓ Found {len(products)} products in {category['name']}")
                self.all_products.extend(products)
            except Exception as e:
                print(f"   ⚠️  Error scraping {category['name']}: {e}")
                # Keep the category itself as fallback
                self.all_products.append(category)

        # Save combined catalog
        await self._save_catalog()

        return self.all_products

    async def _scrape_category_products(self, category_url: str, category_name: str, max_products: int) -> List[Dict]:
        """Scrape individual products from a category page"""
        products = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(category_url, follow_redirects=True)
                response.raise_for_status()
                html = response.text
                soup = BeautifulSoup(html, 'html.parser')

                # Roland-specific selectors
                product_items = soup.select('li[class*="product-"]')

                for item in product_items[:max_products]:
                    try:
                        # Extract product data
                        link = item.select_one('a')
                        img = item.select_one('img')

                        if not link:
                            continue

                        product_url = link.get('href', '')
                        if not product_url.startswith('http'):
                            # Convert relative URL to absolute
                            from urllib.parse import urljoin
                            product_url = urljoin(category_url, product_url)

                        # Get product name from URL or alt text
                        name = img.get('alt', '') if img else ''
                        if not name:
                            # Extract from URL like /us/products/gp-9m/
                            name = product_url.rstrip(
                                '/').split('/')[-1].upper()

                        # Get image URL
                        image_url = None
                        if img:
                            image_url = img.get('data-src') or img.get('src')
                            if image_url and image_url.startswith('data:'):
                                # Skip base64 placeholder
                                noscript = item.select_one('noscript img')
                                if noscript:
                                    image_url = noscript.get('src')

                        product = {
                            "id": f"{self.brand_id}-{name.lower().replace(' ', '-')}",
                            "brand_id": self.brand_id,
                            "brand": self.brand_id,
                            "name": name,
                            "images": {
                                "main": image_url,
                                "thumbnail": image_url
                            },
                            "category": category_name,
                            "price": None,
                            "documentation": {
                                "url": product_url,
                                "type": "html"
                            }
                        }

                        products.append(product)

                    except Exception as e:
                        print(f"      ⚠️  Error parsing product: {e}")
                        continue

            except Exception as e:
                print(f"      ❌ Failed to fetch {category_url}: {e}")
                raise

        return products

    async def _save_catalog(self):
        """Save the combined catalog to file"""
        # Load config to get base URL
        config_path = Path(__file__).parent.parent / "data" / \
            "brands" / self.brand_id / "scrape_config.json"
        with open(config_path, 'r') as f:
            config = json.load(f)

        catalog = {
            "brand_identity": {
                "id": self.brand_id,
                "name": self.brand_id.title(),
                "website": config.get("base_url"),
                "logo_url": None,
                "hq": None
            },
            "products": self.all_products
        }

        # Save to catalog file
        catalog_dir = Path(__file__).parent.parent / "data" / "catalogs"
        catalog_dir.mkdir(parents=True, exist_ok=True)
        catalog_path = catalog_dir / f"{self.brand_id}_catalog.json"

        with open(catalog_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        print(
            f"\n✅ [CATEGORY HARVESTER] Saved {len(self.all_products)} products to {catalog_path}")


async def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python category_harvester.py <brand_id>")
        sys.exit(1)

    brand_id = sys.argv[1]
    harvester = CategoryHarvester(brand_id)
    products = await harvester.harvest_with_categories(max_products_per_category=50)

    print(f"\n🎉 Total products harvested: {len(products)}")


if __name__ == "__main__":
    asyncio.run(main())
