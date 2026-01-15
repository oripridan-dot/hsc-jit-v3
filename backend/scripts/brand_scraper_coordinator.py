#!/usr/bin/env python3
"""
BRAND-SPECIFIC SCRAPING COORDINATOR
Master orchestrator for systematic brand catalog scraping.
Each brand gets dedicated scraper configuration and validation.
"""

import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_BRAND_DIR = DATA_DIR / "catalogs_brand"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"
SCRAPER_DOCS_DIR = BACKEND_DIR / "docs" / "brand_scrapers"

# Brand scraping configurations with expected product counts
BRAND_CONFIGS = {
    "nord": {
        "expected_product_count": 90,  # User confirmed
        "primary_url": "https://www.nordkeyboards.com/products",
        "alternate_urls": [
            "https://www.nordkeyboards.com/en/products",
            "https://www.nordkeyboards.com/us/products"
        ],
        "api_endpoints": [
            "https://www.nordkeyboards.com/api/products",
            "https://www.nordkeyboards.com/api/v1/products"
        ],
        "selectors": {
            "product_list": ".products, [data-products], .product-list",
            "product_item": ".product-item, .product-card, [data-product-id]",
            "name": ".product-name, .name, h2, h3, a[href*=product]",
            "price": ".price, .product-price, [data-price], .cost"
        },
        "pagination": {
            "method": "scroll",  # scroll, pagination, ajax
            "next_button": ".next, [aria-label*=Next], .pagination-next"
        },
        "wait_for": ".product-item",  # Element to wait for before scraping
        "timeout_ms": 20000,
        "notes": "Keyboard synthesizers - relatively simple product list"
    },
    "pearl": {
        "expected_product_count": 364,
        "primary_url": "https://www.pearldrum.com/products",
        "alternate_urls": [
            "https://www.pearldrum.com/en-us/products",
            "https://www.pearldrum.com/us/products"
        ],
        "api_endpoints": [
            "https://www.pearldrum.com/api/products"
        ],
        "selectors": {
            "product_list": ".products, [data-products]",
            "product_item": ".product, .product-card, [data-product]",
            "name": ".product-name, .title, h2, h3",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "scroll"
        },
        "wait_for": ".product-card",
        "timeout_ms": 25000,
        "notes": "Drum company - large catalog with many variants"
    },
    "boss": {
        "expected_product_count": 260,
        "primary_url": "https://www.boss.info/en-us/products/",
        "alternate_urls": [
            "https://www.bosscorp.jp/e/products/",
            "https://www.boss.info/us/products/"
        ],
        "api_endpoints": [
            "https://www.boss.info/api/products"
        ],
        "selectors": {
            "product_item": ".product, .product-row, [data-product]",
            "name": ".name, h2, a.product-link",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "ajax",  # Load more button
            "next_button": ".load-more, [data-load-more]"
        },
        "wait_for": "[data-product-id]",
        "timeout_ms": 30000,
        "notes": "Effects and drums - multiple categories"
    },
    "m-audio": {
        "expected_product_count": 312,
        "primary_url": "https://www.m-audio.com/products",
        "alternate_urls": [
            "https://www.m-audio.com/en/products",
            "https://www.m-audio.com/us/products"
        ],
        "api_endpoints": [
            "https://www.m-audio.com/api/products",
            "https://www.m-audio.com/api/v1/products"
        ],
        "selectors": {
            "product_item": ".product, [class*=product-item]",
            "name": "[class*=product-name], h2, h3",
            "price": "[class*=price], [data-price]"
        },
        "pagination": {
            "method": "infinite_scroll"
        },
        "wait_for": ".product-item:nth-child(5)",  # Wait for multiple items
        "timeout_ms": 35000,
        "notes": "Audio equipment - heavy JavaScript"
    },
    "remo": {
        "expected_product_count": 224,
        "primary_url": "https://www.remo.com/products",
        "alternate_urls": [
            "https://www.remo.com/en/products",
            "https://www.remo.com/us/products"
        ],
        "api_endpoints": [
            "https://www.remo.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, .drum-product, [data-product-id]",
            "name": ".product-title, h2, .name",
            "price": ".price, [data-price], .product-price"
        },
        "pagination": {
            "method": "scroll"
        },
        "wait_for": ".product-card",
        "timeout_ms": 25000,
        "notes": "Drum heads and percussion - multiple categories"
    },
    "paiste-cymbals": {
        "expected_product_count": 151,
        "primary_url": "https://www.paiste.com/en/products",
        "alternate_urls": [
            "https://www.paiste.com/products",
            "https://www.paiste.com/en/cymbals"
        ],
        "api_endpoints": [
            "https://www.paiste.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product], .cymbal-product",
            "name": ".product-name, h2, .title",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "pagination",
            "next_button": ".pagination .next, [aria-label=Next]"
        },
        "wait_for": ".product-item",
        "timeout_ms": 20000,
        "notes": "Cymbal manufacturer - categorized by type"
    },
    "roland": {
        "expected_product_count": 74,
        "primary_url": "https://www.roland.com/us/products/",
        "alternate_urls": [
            "https://www.roland.com/en/products",
            "https://www.roland.com/products"
        ],
        "api_endpoints": [
            "https://www.roland.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2, a[href*=products]",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "scroll"
        },
        "wait_for": ".product-card",
        "timeout_ms": 25000,
        "notes": "Music instrument manufacturer - keyboards, drums, etc."
    },
    "mackie": {
        "expected_product_count": 219,
        "primary_url": "https://www.mackie.com/en-us/products/",
        "alternate_urls": [
            "https://www.mackie.com/products",
            "https://www.mackie.com/us/products"
        ],
        "api_endpoints": [
            "https://www.mackie.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product], .mackie-product",
            "name": ".product-name, .name, h2, h3",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "scroll"
        },
        "wait_for": ".product-item",
        "timeout_ms": 25000,
        "notes": "Audio equipment - speakers, mixers, etc."
    },
    "presonus": {
        "expected_product_count": 106,
        "primary_url": "https://www.presonus.com/en-US/products",
        "alternate_urls": [
            "https://www.presonus.com/products",
            "https://www.presonus.com/en/products"
        ],
        "api_endpoints": [
            "https://www.presonus.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product], .presonus-product",
            "name": ".product-name, .name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "scroll"
        },
        "wait_for": ".product-card",
        "timeout_ms": 20000,
        "notes": "Audio software and hardware - already partially scraped"
    },
    "akai-professional": {
        "expected_product_count": 35,
        "primary_url": "https://www.akaipro.com/products",
        "alternate_urls": [
            "https://www.akaipro.com/en/products"
        ],
        "api_endpoints": [
            "https://www.akaipro.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2, .name",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "scroll"
        },
        "wait_for": ".product-item",
        "timeout_ms": 20000,
        "notes": "MIDI controllers and music equipment"
    },
    "krk-systems": {
        "expected_product_count": 17,
        "primary_url": "https://www.krksys.com/products",
        "alternate_urls": [
            "https://www.krksys.com/en/products"
        ],
        "api_endpoints": [
            "https://www.krksys.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "none"  # Small catalog
        },
        "wait_for": ".product-item",
        "timeout_ms": 15000,
        "notes": "Studio monitors - small but well-organized catalog"
    },
    "rcf": {
        "expected_product_count": 74,
        "primary_url": "https://www.rcf.it/en/products",
        "alternate_urls": [
            "https://www.rcf.it/products"
        ],
        "api_endpoints": [
            "https://www.rcf.it/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "scroll"
        },
        "wait_for": ".product-item",
        "timeout_ms": 20000,
        "notes": "Audio equipment - Italian site"
    },
    "dynaudio": {
        "expected_product_count": 22,
        "primary_url": "https://www.dynaudio.com/products",
        "alternate_urls": [
            "https://www.dynaudio.com/en/products"
        ],
        "api_endpoints": [
            "https://www.dynaudio.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "none"
        },
        "wait_for": ".product-item",
        "timeout_ms": 15000,
        "notes": "Studio monitors - premium brand, small catalog"
    },
    "xotic": {
        "expected_product_count": 28,
        "primary_url": "https://www.xotic.cc/products",
        "alternate_urls": [
            "https://www.xotic.us/products"
        ],
        "api_endpoints": [
            "https://www.xotic.cc/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "scroll"
        },
        "wait_for": ".product-item",
        "timeout_ms": 20000,
        "notes": "Guitar effects pedals - niche product line"
    },
    "adam-audio": {
        "expected_product_count": 26,
        "primary_url": "https://www.adam-audio.com/en/products",
        "alternate_urls": [
            "https://www.adam-audio.com/products"
        ],
        "api_endpoints": [
            "https://www.adam-audio.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "none"
        },
        "wait_for": ".product-item",
        "timeout_ms": 15000,
        "notes": "Studio monitors - German brand"
    },
    "rogers": {
        "expected_product_count": 9,
        "primary_url": "https://www.rogersdrums.com/products",
        "alternate_urls": [
            "https://www.rogersdrums.com/shop"
        ],
        "api_endpoints": [
            "https://www.rogersdrums.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "none"
        },
        "wait_for": ".product-item",
        "timeout_ms": 15000,
        "notes": "Drum manufacturer - vintage heritage brand"
    },
    "oberheim": {
        "expected_product_count": 6,
        "primary_url": "https://www.oberheim.com/products",
        "alternate_urls": [
            "https://www.uaudio.com/synthesizers"
        ],
        "api_endpoints": [
            "https://www.oberheim.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "none"
        },
        "wait_for": ".product-item",
        "timeout_ms": 15000,
        "notes": "Synthesizer manufacturer - small catalog"
    },
    "headrush-fx": {
        "expected_product_count": 4,
        "primary_url": "https://www.headrushsampler.com/products",
        "alternate_urls": [
            "https://www.headrush.com/products"
        ],
        "api_endpoints": [
            "https://www.headrushsampler.com/api/products"
        ],
        "selectors": {
            "product_item": ".product, [data-product]",
            "name": ".product-name, h2",
            "price": ".price, [data-price]"
        },
        "pagination": {
            "method": "none"
        },
        "wait_for": ".product-item",
        "timeout_ms": 15000,
        "notes": "Sampling instruments - small niche brand"
    },
}


class BrandScraperCoordinator:
    """Orchestrates brand-specific scraping with validation."""

    def __init__(self):
        self.results = {}
        self.validation_alerts = []
        SCRAPER_DOCS_DIR.mkdir(parents=True, exist_ok=True)

    def validate_scrape(self, brand_id: str, products: List[Dict]) -> bool:
        """
        Validate scraped products against expected count.
        Alert if deviation exceeds threshold.
        """
        config = BRAND_CONFIGS.get(brand_id, {})
        expected = config.get("expected_product_count", 0)
        actual = len(products)

        if expected == 0:
            return True  # No validation

        deviation_pct = abs(actual - expected) / expected * 100

        if deviation_pct > 50:  # More than 50% deviation
            alert = {
                "brand": brand_id,
                "expected": expected,
                "actual": actual,
                "deviation_pct": round(deviation_pct, 1),
                "severity": "CRITICAL" if deviation_pct > 100 else "WARNING",
                "timestamp": datetime.now().isoformat()
            }
            self.validation_alerts.append(alert)

            logger.warning(
                f"⚠️  {brand_id}: Expected {expected}, got {actual} ({deviation_pct:.1f}% deviation)")
            return False

        return True

    def save_scraping_instructions(self, brand_id: str, products: List[Dict], config: Dict):
        """
        Save detailed scraping instructions after successful scrape.
        """
        instructions = {
            "brand_id": brand_id,
            "timestamp": datetime.now().isoformat(),
            "scrape_status": "SUCCESS",
            "products_scraped": len(products),
            "expected_count": config.get("expected_product_count"),
            "deviation_pct": round(abs(len(products) - config.get("expected_product_count", len(products))) /
                                   max(config.get("expected_product_count", 1), len(products)) * 100, 1),
            "scraping_config": {
                "primary_url": config.get("primary_url"),
                "wait_for": config.get("wait_for"),
                "selectors": config.get("selectors"),
                "pagination": config.get("pagination"),
                "timeout_ms": config.get("timeout_ms")
            },
            "sample_products": products[:3],  # First 3 products as examples
            "total_fields_per_product": len(products[0]) if products else 0,
            "instructions": {
                "1_load_page": f"Navigate to {config.get('primary_url')}",
                "2_wait": f"Wait for element: {config.get('wait_for')}",
                "3_pagination": config.get("pagination", {}).get("method", "none"),
                "4_extract": f"Extract all products using selectors: {list(config.get('selectors', {}).keys())}",
                "5_validate": f"Expect approximately {config.get('expected_product_count')} products",
                "6_alert_condition": f"Alert if count deviates >50% from {config.get('expected_product_count')}"
            },
            "notes": config.get("notes"),
            "tested_urls": [config.get("primary_url")] + config.get("alternate_urls", [])
        }

        doc_file = SCRAPER_DOCS_DIR / f"{brand_id}_scraping_guide.json"
        with open(doc_file, 'w') as f:
            json.dump(instructions, f, indent=2)

        return doc_file

    async def scrape_brand(self, brand_id: str) -> Optional[List[Dict]]:
        """
        Scrape a specific brand using its dedicated configuration.
        """
        config = BRAND_CONFIGS.get(brand_id)
        if not config:
            logger.warning(f"❌ No config for {brand_id}")
            return None

        logger.info(f"\n🎯 Scraping {brand_id}...")
        logger.info(
            f"   Expected: ~{config['expected_product_count']} products")
        logger.info(f"   URL: {config['primary_url']}")

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )

                # Try primary URL
                try:
                    await page.goto(
                        config['primary_url'],
                        wait_until='networkidle',
                        timeout=config['timeout_ms']
                    )
                except:
                    logger.warning(
                        f"   Timeout on primary URL, trying domcontentloaded...")
                    await page.goto(
                        config['primary_url'],
                        wait_until='domcontentloaded',
                        timeout=config['timeout_ms']
                    )

                # Wait for products to load
                try:
                    await page.wait_for_selector(config['wait_for'], timeout=config['timeout_ms'])
                except:
                    logger.warning(
                        f"   Wait for '{config['wait_for']}' timed out, continuing...")

                await asyncio.sleep(2)  # Extra wait for JS rendering

                # Extract products
                products = []
                selectors = config.get('selectors', {})

                # Try to find product items
                try:
                    items = await page.query_selector_all(selectors.get('product_item', '.product'))
                    logger.info(f"   Found {len(items)} product elements")

                    for item in items[:500]:  # Limit to 500 to avoid memory issues
                        try:
                            text = await item.inner_text()
                            if text and len(text.strip()) > 0:
                                products.append({
                                    # First line as name
                                    "name": text.split('\n')[0][:200],
                                    "full_text": text[:500],
                                    "brand_id": brand_id,
                                    "source": "brand_website"
                                })
                        except:
                            continue

                except Exception as e:
                    logger.warning(f"   Error extracting products: {e}")

                await browser.close()

                # Deduplicate
                seen = set()
                unique = []
                for p in products:
                    key = p['name'].lower()
                    if key not in seen and len(key) > 2:
                        seen.add(key)
                        unique.append(p)

                logger.info(f"   ✅ Scraped {len(unique)} unique products")

                # Validate
                is_valid = self.validate_scrape(brand_id, unique)

                # Save instructions
                doc_file = self.save_scraping_instructions(
                    brand_id, unique, config)
                logger.info(f"   📄 Instructions saved: {doc_file}")

                # Save catalog
                catalog_file = CATALOGS_BRAND_DIR / f"{brand_id}_brand.json"
                CATALOGS_BRAND_DIR.mkdir(parents=True, exist_ok=True)

                catalog = {
                    "brand_id": brand_id,
                    "products": unique,
                    "product_count": len(unique),
                    "expected_count": config['expected_product_count'],
                    "is_valid": is_valid,
                    "timestamp": datetime.now().isoformat(),
                    "source": "brand_website",
                    "status": "success"
                }

                with open(catalog_file, 'w') as f:
                    json.dump(catalog, f, indent=2)

                logger.info(f"   💾 Catalog saved: {catalog_file}")

                return unique

        except Exception as e:
            logger.error(f"   ❌ Scraping failed: {e}")
            return None

    async def scrape_all_brands(self):
        """Orchestrate scraping for all brands sequentially."""
        logger.info("\n" + "=" * 70)
        logger.info("🚀 BRAND-SPECIFIC SCRAPER COORDINATOR")
        logger.info("=" * 70)

        for brand_id in sorted(BRAND_CONFIGS.keys()):
            products = await self.scrape_brand(brand_id)
            self.results[brand_id] = {
                "products": products,
                "count": len(products) if products else 0
            }

        # Summary
        logger.info("\n" + "=" * 70)
        logger.info("📊 SCRAPING SUMMARY")
        logger.info("=" * 70)

        total_products = sum(r['count'] for r in self.results.values())
        successful_brands = sum(
            1 for r in self.results.values() if r['count'] > 0)

        logger.info(f"\nTotal brands: {len(self.results)}")
        logger.info(f"Successful: {successful_brands}")
        logger.info(f"Total products: {total_products}")

        if self.validation_alerts:
            logger.warning(
                f"\n⚠️  {len(self.validation_alerts)} validation alerts:")
            for alert in self.validation_alerts:
                logger.warning(f"   {alert['brand']}: {alert['severity']} - "
                               f"expected {alert['expected']}, got {alert['actual']}")

        # Save summary
        summary = {
            "timestamp": datetime.now().isoformat(),
            "total_brands": len(self.results),
            "successful_brands": successful_brands,
            "total_products_scraped": total_products,
            "validation_alerts": self.validation_alerts,
            "results": {
                brand: {
                    "count": r['count'],
                    "expected": BRAND_CONFIGS[brand]['expected_product_count']
                }
                for brand, r in self.results.items()
            }
        }

        summary_file = BACKEND_DIR / "logs" / "brand_scraper_summary.json"
        summary_file.parent.mkdir(parents=True, exist_ok=True)
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)

        logger.info(f"\n📄 Summary saved: {summary_file}")


async def main():
    """Run the coordinator."""
    coordinator = BrandScraperCoordinator()
    await coordinator.scrape_all_brands()


if __name__ == "__main__":
    asyncio.run(main())
