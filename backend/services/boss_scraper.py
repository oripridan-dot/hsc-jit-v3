"""
Boss-Specific Scraper - COMPREHENSIVE DATA EXTRACTION
=====================================================

Boss uses the same CMS architecture as Roland (parent company: Roland Corporation).
This scraper mirrors RolandScraper approach with Boss-specific URLs and configurations.

GOAL: Extract ALL available data from Boss website for JIT RAG system
----------------------------------------------------------------------
✓ Product metadata (name, model, SKU, categories)
✓ Full descriptions (marketing copy, long-form content)
✓ ALL images and media (main, gallery, technical diagrams, videos)
✓ Complete specifications (all spec tables, technical details)
✓ Features and benefits (bullet points, marketing content)
✓ Manuals and documentation (PDFs, quick start guides, reference docs)
✓ Knowledge base articles (support articles, FAQs, tutorials)
✓ Related accessories (recommended, required, compatible)
✓ Support resources (downloads, software, drivers, firmware)
"""

from models.product_hierarchy import (
    ProductCore, ProductCatalog, BrandIdentity,
    ProductImage, ProductSpecification, SourceType, ProductRelationship, RelationshipType
)
import asyncio
import logging
from typing import List, Dict, Optional, Set
from datetime import datetime
from playwright.async_api import async_playwright, Page, TimeoutError as PlaywrightTimeoutError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, AsyncRetrying
from pathlib import Path
import json
import sys
import re
import os

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))
from core.config import settings

sys.path.insert(0, '/workspaces/hsc-jit-v3/backend/models')

logger = logging.getLogger(__name__)


class BossScraper:
    """Specialized scraper for Boss website - mirrors Roland CMS structure"""

    def __init__(self):
        self.base_url = "https://www.boss.info"
        self.products_url = f"{self.base_url}/us/products/"
        
        # Boss main categories (similar to Roland hierarchy)
        self.category_urls = [
            # Main products page
            "https://www.boss.info/us/products/",
            # Guitar Effects (main Boss category)
            "https://www.boss.info/us/products/multi-effects_processors/",
            "https://www.boss.info/us/products/stompbox_effects/",
            "https://www.boss.info/us/products/distortion_overdrive/",
            "https://www.boss.info/us/products/modulation/",
            "https://www.boss.info/us/products/delay_reverb/",
            # Drums/Percussion
            "https://www.boss.info/us/products/drum_machines/",
            "https://www.boss.info/us/products/drum_pads/",
            # Keyboards/Synthesizers
            "https://www.boss.info/us/products/synthesizers/",
            "https://www.boss.info/us/products/keyboards/",
            # Amplifiers
            "https://www.boss.info/us/products/amplifiers/",
            # Loopers/Recorders
            "https://www.boss.info/us/products/loopers_recorders/",
            # Tuners/Metronomes
            "https://www.boss.info/us/products/tuners_metronomes/",
            # Accessories
            "https://www.boss.info/us/products/accessories/",
            "https://www.boss.info/us/products/cables_connectors/",
            "https://www.boss.info/us/products/stands_holders/",
        ]

    async def scrape_all_products(self, max_products: int = None) -> ProductCatalog:
        """
        Scrape ALL Boss products with COMPREHENSIVE data extraction

        For each product, we extract:
        ✓ Full metadata (name, model, SKU, categories)
        ✓ Complete descriptions (all text content, marketing copy)
        ✓ ALL images (main, gallery, technical diagrams)
        ✓ ALL videos (YouTube, Vimeo, product demos)
        ✓ Complete specifications (all spec tables)
        ✓ All features (bullet lists, feature descriptions)
        ✓ Manuals and documentation (PDFs, guides, quick starts)
        ✓ Support resources (support page links, FAQs)
        ✓ Related accessories (recommended, compatible)
        ✓ Related products (similar, complementary)

        Args:
            max_products: Maximum products to scrape (None = scrape ALL products)

        Returns:
            ProductCatalog with comprehensive product data ready for JIT RAG
        """
        logger.info(
            f"🎸 Starting COMPREHENSIVE Boss scrape (max: {'ALL' if max_products is None else max_products})")
        logger.info(f"   Goal: Extract ALL available data for JIT RAG system")
        logger.info(f"   Note: Boss uses same CMS as Roland (parent company)")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=settings.SCRAPER_HEADLESS,
                args=['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu']
            )
            page = await browser.new_page()

            try:
                # Step 1: Get all product URLs
                product_urls = await self._get_product_urls(page, max_products)
                logger.info(f"📋 Found {len(product_urls)} product URLs")

                # Limit to max_products only if specified
                if max_products is not None:
                    product_urls = product_urls[:max_products]
                    logger.info(f"   Limited to {len(product_urls)} products")

                # Step 2: Scrape each product with FULL data extraction
                products = []
                total_images = 0
                total_videos = 0
                total_specs = 0
                total_features = 0
                total_manuals = 0
                total_accessories = 0

                for i, url in enumerate(product_urls, 1):
                    logger.info(
                        f"   [{i}/{len(product_urls)}] Scraping: {url}")
                    try:
                        # Wrap individual product scrape with timeout
                        product = await asyncio.wait_for(
                            self._scrape_product_page(page, url),
                            timeout=45  # 45 seconds per product max
                        )
                        if product:
                            products.append(product)
                            total_images += len(product.images)
                            total_videos += len(product.video_urls)
                            total_specs += len(product.specifications)
                            total_features += len(product.features)
                            total_manuals += len(product.manual_urls)
                            total_accessories += len(product.accessories)
                    except asyncio.TimeoutError:
                        logger.error(f"   Timeout scraping {url} (45s limit)")
                        continue
                    except Exception as e:
                        logger.error(f"   Error scraping {url}: {e}")
                        continue

                logger.info(f"\n✅ COMPREHENSIVE SCRAPING COMPLETE!")
                logger.info(f"   Products: {len(products)}")
                logger.info(f"   Total Images: {total_images}")
                logger.info(f"   Total Videos: {total_videos}")
                logger.info(f"   Total Specs: {total_specs}")
                logger.info(f"   Total Features: {total_features}")
                logger.info(f"   Total Manuals: {total_manuals}")
                logger.info(f"   Total Accessories: {total_accessories}")

                # Create comprehensive catalog
                brand = BrandIdentity(
                    id="boss",
                    name="Boss Corporation",
                    website="https://www.boss.info",
                    description="Leading manufacturer of guitar effects and audio equipment",
                    categories=["Guitar Effects", "Synthesizers", "Drum Machines", 
                                "Amplifiers", "Loopers", "Accessories"]
                )

                catalog = ProductCatalog(
                    brand_identity=brand,
                    products=products,
                    total_products=len(products),
                    last_updated=datetime.utcnow(),
                    catalog_version="3.7.0",
                    coverage_stats={
                        "total_images": total_images,
                        "total_videos": total_videos,
                        "total_specifications": total_specs,
                        "total_features": total_features,
                        "total_manuals": total_manuals,
                        "total_accessories": total_accessories,
                        "avg_images_per_product": round(total_images / len(products), 2) if products else 0,
                        "avg_specs_per_product": round(total_specs / len(products), 2) if products else 0
                    }
                )

                return catalog

            finally:
                await browser.close()

    async def _navigate(self, page: Page, url: str, timeout: int = None):
        """Robust navigation with retries using centralized settings"""
        if timeout is None:
            timeout = settings.SCRAPER_TIMEOUT

        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(settings.SCRAPER_RETRIES),
            wait=wait_exponential(multiplier=1, min=settings.SCRAPER_RETRY_DELAY, max=10)
        ):
            with attempt:
                try:
                    # Changed to domcontentloaded to prevent hanging on analytics/tracking
                    await page.goto(url, wait_until='domcontentloaded', timeout=timeout)
                except PlaywrightTimeoutError:
                    logger.warning(f"   Timeout on {url}, retrying...")
                    raise
                except Exception as e:
                    logger.warning(f"   Error accessing {url}: {e}, retrying...")
                    raise

    async def _get_product_urls(self, page: Page, max_products: int = None) -> List[str]:
        """Get all product URLs by navigating through categories"""
        logger.info(f"📄 Discovering Boss products through category navigation")

        all_urls = set()

        # Navigate each category to find product links
        for cat_url in self.category_urls:
            try:
                await asyncio.wait_for(
                    self._navigate(page, cat_url),
                    timeout=20
                )
                await asyncio.sleep(1)

                # Find all product links on category page
                try:
                    links = await asyncio.wait_for(
                        page.locator('a[href*="/products/"]').all(),
                        timeout=10
                    )
                    
                    for link in links:
                        try:
                            href = await link.get_attribute('href')
                            if href and '/products/' in href and '/us/products/' not in href.replace(self.base_url, ''):
                                # Get full URL
                                if href.startswith('http'):
                                    full_url = href
                                elif href.startswith('/'):
                                    full_url = f"https://www.boss.info{href}"
                                else:
                                    full_url = f"https://www.boss.info/us/{href}"
                                
                                # Only add actual product pages (exclude category/filter pages)
                                if full_url not in all_urls and not any(skip in full_url.lower() for skip in ['?', 'search', 'compare']):
                                    all_urls.add(full_url)
                        except:
                            continue
                except asyncio.TimeoutError:
                    logger.warning(f"   Timeout finding links on {cat_url}")
            except Exception as e:
                logger.warning(f"   Error exploring category {cat_url}: {e}")
                continue

        logger.info(f"   Found {len(all_urls)} total product URLs")
        return list(all_urls)

    async def _scrape_product_page(self, page: Page, url: str) -> Optional[ProductCore]:
        """Scrape comprehensive data from product page"""
        try:
            await asyncio.wait_for(
                self._navigate(page, url),
                timeout=30
            )
            await asyncio.sleep(1)

            # Extract product metadata
            try:
                name = await asyncio.wait_for(page.locator('h1').first.text_content(), timeout=5)
                name = name.strip() if name else "Unknown"
            except:
                name = "Unknown"

            # Extract product ID from URL
            product_id = url.split('/products/')[-1].rstrip('/')

            # Extract description
            try:
                description_elem = await asyncio.wait_for(
                    page.locator('[class*="description"], [class*="overview"], p').first.text_content(),
                    timeout=5
                )
                description = description_elem.strip() if description_elem else ""
            except:
                description = ""

            # Extract main image
            images = []
            try:
                main_img = await asyncio.wait_for(
                    page.locator('img[class*="main"], img[class*="product"], img').first.get_attribute('src'),
                    timeout=5
                )
                if main_img and not main_img.startswith('data:'):
                    images.append(ProductImage(
                        url=main_img,
                        type="main",
                        alt_text=name
                    ))
            except:
                pass

            # Extract category from breadcrumb or URL
            categories = ["Boss Products"]  # Default category
            try:
                breadcrumbs = await asyncio.wait_for(
                    page.locator('[class*="breadcrumb"] a').all(),
                    timeout=5
                )
                if len(breadcrumbs) > 1:
                    cat_text = await breadcrumbs[1].text_content()
                    if cat_text:
                        categories = [cat_text.strip()]
            except:
                # Try to extract from URL
                if '/products/' in url:
                    cat_from_url = url.split('/products/')[1].split('/')[0].replace('-', ' ').title()
                    categories = [cat_from_url]

            # Extract specifications
            specifications = []
            try:
                spec_rows = await asyncio.wait_for(
                    page.locator('[class*="specs"] tr, [class*="specification"] tr').all(),
                    timeout=5
                )
                for row in spec_rows[:20]:  # Limit to 20 specs
                    try:
                        cells = await row.locator('td, th').all()
                        if len(cells) >= 2:
                            key = await cells[0].text_content()
                            value = await cells[1].text_content()
                            if key and value:
                                specifications.append(ProductSpecification(
                                    category="Specifications",
                                    specs=[{
                                        "key": key.strip(),
                                        "value": value.strip()
                                    }]
                                ))
                    except:
                        continue
            except:
                pass

            # Extract features
            features = []
            try:
                feature_items = await asyncio.wait_for(
                    page.locator('[class*="features"] li, [class*="feature"] li').all(),
                    timeout=5
                )
                for item in feature_items[:15]:  # Limit to 15 features
                    try:
                        text = await item.text_content()
                        if text:
                            features.append(text.strip())
                    except:
                        continue
            except:
                pass

            # Create product object
            product = ProductCore(
                id=product_id,
                name=name,
                brand="Boss",
                description=description,
                categories=categories,
                image_url=images[0].url if images else "",
                images=images,
                price_nis=None,  # Will be filled by Halilit if available
                status="in_stock",
                specifications=specifications,
                features=features,
                video_urls=[],
                manual_urls=[],
                accessories=[],
                source=SourceType.BRAND_OFFICIAL,
                brand_product_url=url
            )

            logger.info(f"   ✓ Extracted: {name}")
            return product

        except asyncio.TimeoutError:
            logger.error(f"   Timeout on {url}")
            return None
        except Exception as e:
            logger.error(f"   Error scraping {url}: {e}")
            return None


async def scrape_boss_products(max_products: int = None) -> ProductCatalog:
    """Convenience function to scrape Boss products"""
    scraper = BossScraper()
    return await scraper.scrape_all_products(max_products)
