#!/usr/bin/env python3
"""
MASTER BRAND SCRAPER - 100% Coverage Target
Uses brand-specific configurations for perfect catalog extraction.
Includes validation against Halilit baselines and alerting for data anomalies.
"""

import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import re

try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

from brand_scraping_configs import BRAND_CONFIGS, HALILIT_BASELINES

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
LOGS_DIR = BACKEND_DIR / "logs"


class BrandScraper:
    """Scrapes a single brand using its specific configuration."""

    def __init__(self, brand_id: str, config: Dict):
        self.brand_id = brand_id
        self.config = config
        self.products = []
        self.errors = []

    def clean_text(self, text: str) -> str:
        """Clean scraped text."""
        if not text:
            return ""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove common noise
        noise_patterns = [
            r'(products?|country selector|oops|for international|orders|please visit)',
            r'(shop now|buy now|learn more|view details)',
        ]
        for pattern in noise_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        return text.strip()

    def is_valid_product(self, name: str) -> bool:
        """Check if scraped text is a valid product name."""
        if not name or len(name) < 3:
            return False

        # Filter out common navigation/UI elements
        invalid_patterns = [
            r'^(products?|shop|home|about|contact|cart|menu)$',
            r'^(country|selector|oops|error)$',
            r'^\d+$',  # Just numbers
            r'^[^a-zA-Z0-9]+$',  # Only special chars
        ]

        for pattern in invalid_patterns:
            if re.match(pattern, name, re.IGNORECASE):
                return False

        return True

    async def scrape_with_playwright(self) -> List[Dict]:
        """Scrape using Playwright with brand-specific selectors."""
        logger.info(f"\n{'='*70}")
        logger.info(f"🎭 Scraping {self.config['name']} ({self.brand_id})")
        logger.info(f"{'='*70}")
        logger.info(f"URL: {self.config['products_url']}")

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()

            # Navigate to products page
            try:
                logger.info(f"Loading page...")
                await page.goto(
                    self.config['products_url'],
                    wait_until='domcontentloaded',
                    timeout=30000
                )
            except Exception as e:
                logger.error(f"Failed to load page: {e}")
                await browser.close()
                return []

            # Wait for products to load
            wait_for = self.config.get('wait_for')
            wait_time = self.config.get('wait_time', 3)

            try:
                logger.info(f"Waiting for products ({wait_for})...")
                await page.wait_for_selector(wait_for, timeout=15000)
                await asyncio.sleep(wait_time)
            except PlaywrightTimeout:
                logger.warning(
                    f"Timeout waiting for '{wait_for}', continuing anyway...")

            # Handle infinite scroll if needed
            if self.config.get('scroll_to_load'):
                logger.info("Handling infinite scroll...")
                for _ in range(5):  # Scroll 5 times
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                    await asyncio.sleep(self.config.get('pagination', {}).get('scroll_pause', 1))

            # Extract products using brand-specific selectors
            selectors = self.config['selectors']
            product_selector = selectors['product_item']

            try:
                logger.info(
                    f"Finding products with selector: {product_selector}")
                product_elements = await page.query_selector_all(product_selector)
                logger.info(f"Found {len(product_elements)} product elements")

                for element in product_elements[:500]:  # Limit to 500 per page
                    try:
                        # Extract product details
                        product_data = await self.extract_product_data(element, selectors)

                        if product_data and self.is_valid_product(product_data.get('name', '')):
                            product_data['brand_id'] = self.brand_id
                            product_data['source'] = 'brand_website'
                            product_data['scraped_at'] = datetime.now(
                            ).isoformat()
                            self.products.append(product_data)

                    except Exception as e:
                        logger.debug(f"Error extracting product: {e}")
                        continue

            except Exception as e:
                logger.error(f"Error finding products: {e}")

            # Handle multiple category pages if configured
            if 'categories' in self.config:
                logger.info(
                    f"Scraping {len(self.config['categories'])} category pages...")
                for category_url in self.config['categories']:
                    try:
                        await page.goto(category_url, wait_until='domcontentloaded', timeout=20000)
                        await asyncio.sleep(2)

                        category_elements = await page.query_selector_all(product_selector)
                        logger.info(
                            f"Category {category_url}: {len(category_elements)} products")

                        for element in category_elements[:200]:
                            try:
                                product_data = await self.extract_product_data(element, selectors)
                                if product_data and self.is_valid_product(product_data.get('name', '')):
                                    product_data['brand_id'] = self.brand_id
                                    product_data['source'] = 'brand_website'
                                    product_data['scraped_at'] = datetime.now(
                                    ).isoformat()
                                    product_data['category'] = category_url.split(
                                        '/')[-2]
                                    self.products.append(product_data)
                            except:
                                continue
                    except Exception as e:
                        logger.warning(
                            f"Error scraping category {category_url}: {e}")

            await browser.close()

        # Deduplicate products
        seen = set()
        unique_products = []
        for p in self.products:
            key = (p.get('name', '').lower(), p.get('brand_id'))
            if key not in seen:
                seen.add(key)
                unique_products.append(p)

        logger.info(f"✅ Extracted {len(unique_products)} unique products")
        return unique_products

    async def extract_product_data(self, element, selectors: Dict) -> Optional[Dict]:
        """Extract product data from an element."""
        try:
            # Extract name
            name = ""
            for selector in [selectors.get('product_name'), 'h2', 'h3', '.name']:
                if not selector:
                    continue
                try:
                    name_elem = await element.query_selector(selector)
                    if name_elem:
                        name = await name_elem.inner_text()
                        name = self.clean_text(name)
                        if name:
                            break
                except:
                    continue

            if not name:
                return None

            # Extract price (optional)
            price = ""
            price_selector = selectors.get('product_price')
            if price_selector:
                try:
                    price_elem = await element.query_selector(price_selector)
                    if price_elem:
                        price = await price_elem.inner_text()
                        price = self.clean_text(price)
                except:
                    pass

            # Extract URL (optional)
            url = ""
            url_selector = selectors.get('product_url', 'a')
            try:
                url_elem = await element.query_selector(url_selector)
                if url_elem:
                    url = await url_elem.get_attribute('href')
                    if url and not url.startswith('http'):
                        url = f"{self.config['base_url']}{url}"
            except:
                pass

            return {
                'name': name,
                'price': price,
                'url': url,
            }

        except Exception as e:
            return None

    def validate_results(self) -> Dict:
        """Validate scraped results against Halilit baseline."""
        expected_min = self.config.get('expected_min_products', 0)
        halilit_baseline = HALILIT_BASELINES.get(self.brand_id, 0)
        scraped_count = len(self.products)

        validation = {
            'brand_id': self.brand_id,
            'scraped_count': scraped_count,
            'expected_min': expected_min,
            'halilit_baseline': halilit_baseline,
            'meets_minimum': scraped_count >= expected_min,
            'halilit_coverage_pct': round(100 * scraped_count / halilit_baseline, 1) if halilit_baseline else 0,
            'status': 'unknown',
            'alerts': []
        }

        # Determine status
        if scraped_count == 0:
            validation['status'] = 'failed'
            validation['alerts'].append(f"❌ No products scraped")
        elif scraped_count < expected_min * 0.5:
            validation['status'] = 'warning'
            validation['alerts'].append(
                f"⚠️  Low count: {scraped_count} < {expected_min} expected")
        elif scraped_count < halilit_baseline * 0.5:
            validation['status'] = 'warning'
            validation['alerts'].append(
                f"⚠️  Low Halilit coverage: {scraped_count}/{halilit_baseline} ({validation['halilit_coverage_pct']}%)")
        elif scraped_count > halilit_baseline * 2:
            validation['status'] = 'warning'
            validation['alerts'].append(
                f"⚠️  Unexpectedly high count: {scraped_count} >> {halilit_baseline} baseline (possible false data)")
        else:
            validation['status'] = 'success'
            validation['alerts'].append(
                f"✅ Good coverage: {scraped_count} products ({validation['halilit_coverage_pct']}% of Halilit)")

        return validation

    def save_catalog(self):
        """Save scraped products to catalog file."""
        CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)

        validation = self.validate_results()

        catalog = {
            'brand_id': self.brand_id,
            'brand_name': self.config['name'],
            'total_products': len(self.products),
            'products': self.products,
            'validation': validation,
            'timestamp': datetime.now().isoformat(),
            'scraping_method': self.config['method'],
            'source_url': self.config['products_url'],
            'status': validation['status']
        }

        file_path = CATALOGS_BRAND_DIR / f"{self.brand_id}_brand.json"
        with open(file_path, 'w') as f:
            json.dump(catalog, f, indent=2)

        logger.info(f"💾 Saved to: {file_path}")

        return validation


class MasterScraper:
    """Orchestrates scraping for all brands."""

    def __init__(self):
        self.results = {}
        self.total_products = 0
        self.failed_brands = []
        self.warning_brands = []
        self.success_brands = []

    async def scrape_all_brands(self):
        """Scrape all brands sequentially."""
        logger.info("\n" + "="*70)
        logger.info("🚀 MASTER BRAND SCRAPER - 100% Coverage Target")
        logger.info("="*70 + "\n")

        for brand_id in sorted(BRAND_CONFIGS.keys()):
            config = BRAND_CONFIGS[brand_id]

            scraper = BrandScraper(brand_id, config)
            products = await scraper.scrape_with_playwright()

            scraper.products = products
            validation = scraper.save_catalog()

            self.results[brand_id] = validation
            self.total_products += len(products)

            # Categorize results
            if validation['status'] == 'failed':
                self.failed_brands.append(brand_id)
            elif validation['status'] == 'warning':
                self.warning_brands.append(brand_id)
            else:
                self.success_brands.append(brand_id)

            # Show validation alerts
            for alert in validation['alerts']:
                logger.info(f"  {alert}")

            logger.info("")  # Blank line between brands

    def generate_report(self):
        """Generate comprehensive scraping report."""
        logger.info("\n" + "="*70)
        logger.info("📊 SCRAPING RESULTS SUMMARY")
        logger.info("="*70 + "\n")

        logger.info(f"✅ Success: {len(self.success_brands)} brands")
        logger.info(f"⚠️  Warning: {len(self.warning_brands)} brands")
        logger.info(f"❌ Failed: {len(self.failed_brands)} brands")
        logger.info(f"📦 Total Products Scraped: {self.total_products}")

        # Calculate overall Halilit coverage
        total_halilit = sum(HALILIT_BASELINES.values())
        overall_coverage = round(100 * self.total_products / total_halilit, 1)
        logger.info(f"📈 Overall Halilit Coverage: {overall_coverage}%")

        logger.info("\n" + "-"*70)
        logger.info("BRAND DETAILS:")
        logger.info("-"*70)

        for brand_id in sorted(self.results.keys()):
            result = self.results[brand_id]
            status_icon = "✅" if result['status'] == 'success' else "⚠️ " if result['status'] == 'warning' else "❌"
            logger.info(
                f"{status_icon} {brand_id:25} │ {result['scraped_count']:3} products │ {result['halilit_coverage_pct']:5.1f}% Halilit coverage")

        # Save detailed report
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_products': self.total_products,
                'success_brands': len(self.success_brands),
                'warning_brands': len(self.warning_brands),
                'failed_brands': len(self.failed_brands),
                'overall_halilit_coverage': overall_coverage,
            },
            'brands': self.results,
            'failed_brands': self.failed_brands,
            'warning_brands': self.warning_brands,
            'success_brands': self.success_brands,
        }

        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        report_file = LOGS_DIR / 'master_scraping_report.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        logger.info(f"\n📄 Detailed report saved: {report_file}")

        if overall_coverage >= 80:
            logger.info("\n🎉 SUCCESS! Achieved 80%+ Halilit coverage target!")
        elif overall_coverage >= 50:
            logger.info(
                "\n🟡 Good progress! 50%+ coverage achieved, continue improving.")
        else:
            logger.info(
                f"\n🔴 More work needed. Current coverage: {overall_coverage}%")


async def main():
    """Run master scraper."""
    if not PLAYWRIGHT_AVAILABLE:
        logger.error(
            "❌ Playwright not installed. Run: pip install playwright && playwright install chromium")
        return

    master = MasterScraper()
    await master.scrape_all_brands()
    master.generate_report()


if __name__ == "__main__":
    asyncio.run(main())
