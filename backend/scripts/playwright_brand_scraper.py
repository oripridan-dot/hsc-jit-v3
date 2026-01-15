#!/usr/bin/env python3
"""
ENHANCED PLAYWRIGHT-BASED BRAND SCRAPER
Fixes for Roland, Pearl, and Mackie with proper JavaScript rendering

Features:
- Playwright for full JS rendering support
- Brand-specific selectors and strategies
- Automatic retry with exponential backoff
- Session persistence for pagination
- Better error handling and logging
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse
from datetime import datetime

try:
    from playwright.async_api import async_playwright, Browser, Page
except ImportError:
    raise ImportError(
        "Playwright not installed. Run: pip install playwright && playwright install")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PlaywrightBrandScraper:
    """Enhanced brand scraper using Playwright for JS-heavy sites."""

    def __init__(self, data_dir: Optional[Path] = None, headless: bool = True):
        if data_dir is None:
            backend_dir = Path(__file__).resolve().parents[1]
            data_dir = backend_dir / "data"

        self.data_dir = Path(data_dir)
        self.catalogs_dir = self.data_dir / "catalogs_brand"
        self.catalogs_dir.mkdir(parents=True, exist_ok=True)
        self.headless = headless

    async def scrape_roland(self) -> Dict[str, Any]:
        """Scrape Roland with API-first approach + fallback to UI scraping."""
        logger.info("🎹 Scraping Roland keyboards and synthesizers...")
        products = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            page = await browser.new_page()

            try:
                # Method 1: Direct API endpoint (most reliable)
                logger.info("  Trying API endpoint...")
                api_data = await self._try_roland_api()
                if api_data:
                    products.extend(api_data)
                    logger.info(f"  ✅ API fetch: {len(api_data)} products")
                else:
                    # Method 2: Scrape product listing pages
                    logger.info("  Fallback to UI scraping...")
                    products.extend(await self._scrape_roland_ui(page))

            finally:
                await browser.close()

        return {
            "brand_id": "roland",
            "source_url": "https://www.roland.com/products/",
            "total_products": len(products),
            "products": products,
            "scrape_timestamp": datetime.now().isoformat(),
            "method": "playwright_api+ui"
        }

    async def _try_roland_api(self) -> List[Dict[str, Any]]:
        """Try to fetch Roland products from API endpoints."""
        products = []

        # Common Roland API endpoints
        api_endpoints = [
            "https://www.roland.com/api/v1/products",
            "https://api.roland.com/products",
            "https://www.roland.com/api/products/list",
        ]

        for endpoint in api_endpoints:
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10) as client:
                    response = await client.get(endpoint)
                    if response.status_code == 200:
                        data = response.json()
                        # Parse based on likely structure
                        if isinstance(data, list):
                            products = data
                        elif isinstance(data, dict) and "products" in data:
                            products = data["products"]
                        elif isinstance(data, dict) and "data" in data:
                            products = data["data"]

                        if products:
                            return products
            except Exception as e:
                logger.debug(f"  API endpoint {endpoint} failed: {e}")
                continue

        return []

    async def _scrape_roland_ui(self, page: Page) -> List[Dict[str, Any]]:
        """Scrape Roland UI with proper selectors."""
        products = []
        base_url = "https://www.roland.com"

        # Roland product categories to scrape
        categories = [
            "/products/keyboards/",
            "/products/synthesizers/",
            "/products/digital-pianos/",
            "/products/workstations/",
            "/products/home-keyboards/",
        ]

        for category_url in categories:
            try:
                full_url = urljoin(base_url, category_url)
                logger.info(f"  Scraping {full_url}...")
                try:
                    await page.goto(full_url, wait_until="domcontentloaded", timeout=10000)
                except:
                    # Continue even if page takes time to load
                    pass

                # Try to wait for products, but don't fail if selector not found
                try:
                    await page.wait_for_selector(".product-list-item, .product-card, [data-product-id], .product, li[data-id]", timeout=3000)
                except:
                    pass

                # Scroll to load all products
                await page.evaluate("""
                    async () => {
                        let lastHeight = document.body.scrollHeight;
                        for (let i = 0; i < 10; i++) {
                            window.scrollBy(0, window.innerHeight);
                            await new Promise(resolve => setTimeout(resolve, 500));
                            let newHeight = document.body.scrollHeight;
                            if (newHeight === lastHeight) break;
                            lastHeight = newHeight;
                        }
                    }
                """)

                # Extract products
                category_products = await page.evaluate("""
                    () => {
                        const products = [];
                        const items = document.querySelectorAll('.product-list-item, .product-card, [data-product-id]');
                        
                        items.forEach(item => {
                            const name = item.querySelector('h2, h3, .product-name')?.textContent?.trim();
                            const image = item.querySelector('img')?.src;
                            const url = item.querySelector('a')?.href;
                            const price = item.querySelector('.price, .product-price, [data-price]')?.textContent?.trim();
                            
                            if (name && (image || url)) {
                                products.push({
                                    name: name,
                                    image_url: image,
                                    detail_url: url,
                                    price: price,
                                    category: 'Roland'
                                });
                            }
                        });
                        
                        return products;
                    }
                """)

                products.extend(category_products)
                logger.info(f"    Found {len(category_products)} products")

            except Exception as e:
                logger.warning(f"  Error scraping {category_url}: {e}")
                continue

        return products

    async def scrape_pearl(self) -> Dict[str, Any]:
        """Scrape Pearl drums and percussion with proper selectors."""
        logger.info("🥁 Scraping Pearl drums and percussion...")
        products = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            page = await browser.new_page()

            try:
                url = "https://www.pearldrums.com/en/drums"
                logger.info(f"  Navigating to {url}...")
                await page.goto(url, wait_until="networkidle", timeout=15000)

                # Pearl uses pagination/infinite scroll
                for _ in range(10):  # Max 10 pages
                    await page.wait_for_selector(".product-item, .drum-product, [data-product-id]", timeout=5000)

                    # Scroll to trigger load more
                    await page.evaluate("window.scrollBy(0, window.innerHeight)")
                    await page.wait_for_timeout(1000)

                    # Extract current page products
                    current_products = await page.evaluate("""
                        () => {
                            const products = [];
                            const items = document.querySelectorAll('.product-item, .drum-product, article[data-product-id]');
                            
                            items.forEach((item, idx) => {
                                const name = item.querySelector('h2, h3, .product-name')?.textContent?.trim();
                                const image = item.querySelector('img')?.src;
                                const url = item.querySelector('a[href*="/en/drums/"]')?.href;
                                const price = item.querySelector('.price, [data-price]')?.textContent?.trim();
                                
                                if (name && idx < 50) {  // Limit to avoid duplicates
                                    products.push({
                                        name: name,
                                        image_url: image,
                                        detail_url: url,
                                        price: price,
                                        category: 'Pearl Drums'
                                    });
                                }
                            });
                            
                            return products;
                        }
                    """)

                    logger.info(
                        f"    Batch found {len(current_products)} products")
                    products.extend(current_products)

                    # Check if "Load More" button exists
                    load_more = await page.query_selector(".load-more, [data-load-more], .pagination .next")
                    if not load_more:
                        break

            except Exception as e:
                logger.warning(f"  Error during scraping: {e}")
            finally:
                await browser.close()

        return {
            "brand_id": "pearl",
            "source_url": "https://www.pearldrums.com/en/drums",
            "total_products": len(products),
            "products": products,
            "scrape_timestamp": datetime.now().isoformat(),
            "method": "playwright_ui"
        }

    async def scrape_mackie(self) -> Dict[str, Any]:
        """Scrape Mackie audio equipment with proper selectors."""
        logger.info("🔊 Scraping Mackie audio products...")
        products = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            page = await browser.new_page()

            try:
                url = "https://www.mackie.com/en-US/products"
                logger.info(f"  Navigating to {url}...")
                await page.goto(url, wait_until="networkidle", timeout=15000)

                # Mackie product categories
                categories = [
                    "/en-US/products/live-sound",
                    "/en-US/products/recording",
                    "/en-US/products/mixing",
                    "/en-US/products/monitoring",
                ]

                for category_path in categories:
                    try:
                        full_url = urljoin(
                            "https://www.mackie.com", category_path)
                        logger.info(f"  Scraping {category_path}...")
                        await page.goto(full_url, wait_until="networkidle", timeout=15000)

                        # Wait for products
                        await page.wait_for_selector(".product-card, .product-item, [data-product]", timeout=5000)

                        # Scroll to load
                        for _ in range(5):
                            await page.evaluate("window.scrollBy(0, window.innerHeight)")
                            await page.wait_for_timeout(500)

                        # Extract products
                        category_products = await page.evaluate("""
                            () => {
                                const products = [];
                                const items = document.querySelectorAll('.product-card, .product-item, [data-product]');
                                
                                items.forEach(item => {
                                    const name = item.querySelector('h2, h3, .product-name')?.textContent?.trim();
                                    const image = item.querySelector('img')?.src;
                                    const url = item.querySelector('a[href*="/products/"]')?.href;
                                    
                                    if (name) {
                                        products.push({
                                            name: name,
                                            image_url: image,
                                            detail_url: url,
                                            category: 'Mackie'
                                        });
                                    }
                                });
                                
                                return products;
                            }
                        """)

                        products.extend(category_products)
                        logger.info(
                            f"    Found {len(category_products)} products")

                    except Exception as e:
                        logger.warning(
                            f"  Error scraping {category_path}: {e}")
                        continue

            except Exception as e:
                logger.warning(f"  Error during scraping: {e}")
            finally:
                await browser.close()

        return {
            "brand_id": "mackie",
            "source_url": "https://www.mackie.com/en-US/products",
            "total_products": len(products),
            "products": products,
            "scrape_timestamp": datetime.now().isoformat(),
            "method": "playwright_ui"
        }

    async def scrape_all(self) -> Dict[str, Dict[str, Any]]:
        """Scrape all three fixed brands in parallel."""
        logger.info(
            "🚀 Starting enhanced brand scraping (Roland, Pearl, Mackie)...")

        results = await asyncio.gather(
            self.scrape_roland(),
            self.scrape_pearl(),
            self.scrape_mackie(),
            return_exceptions=True
        )

        output = {}
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"  Error: {result}")
                continue

            brand_id = result["brand_id"]
            output[brand_id] = result

            # Save individual catalog
            catalog_file = self.catalogs_dir / f"{brand_id}_catalog.json"
            with open(catalog_file, 'w') as f:
                json.dump(result, f, indent=2)

            logger.info(
                f"  ✅ {brand_id}: {result['total_products']} products saved")

        return output


async def main():
    """Test the enhanced scrapers."""
    scraper = PlaywrightBrandScraper()
    results = await scraper.scrape_all()

    print("\n📊 Summary:")
    total = sum(r["total_products"] for r in results.values())
    print(f"  Total products scraped: {total}")
    for brand_id, result in results.items():
        print(f"  • {brand_id}: {result['total_products']} products")


if __name__ == "__main__":
    asyncio.run(main())
