"""
Roland-Specific Scraper - COMPREHENSIVE DATA EXTRACTION
=======================================================

GOAL: Extract ALL available data from Roland website for JIT RAG system
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
✓ Related links (support pages, articles, videos)

Philosophy: If it's there to take, we take it as-is.
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
from  tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, AsyncRetrying
from pathlib import Path
import json
import sys
import re
import os

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))
from core.config import settings

sys.path.insert(0, '/workspaces/hsc-jit-v3/backend/models')

print('PYTHON PATH:', sys.path)  # Debug statement to print Python path

logger = logging.getLogger(__name__)


class RolandScraper:
    """Specialized scraper for Roland website"""

    def __init__(self):
        self.base_url = "https://www.roland.com/global"
        self.products_url = f"{self.base_url}/products/"
        # Comprehensive category URLs including all known subcategories
        self.category_urls = [
            # Main categories page
            "https://www.roland.com/global/categories/",
            # Pianos and subcategories
            "https://www.roland.com/global/categories/pianos/",
            "https://www.roland.com/global/categories/pianos/grand_pianos/",
            "https://www.roland.com/global/categories/pianos/portable_pianos/",
            "https://www.roland.com/global/categories/pianos/stage_pianos/",
            "https://www.roland.com/global/categories/pianos/upright_pianos/",
            "https://www.roland.com/global/categories/pianos/accessories/",
            # Synthesizers and subcategories
            "https://www.roland.com/global/categories/synthesizers/",
            "https://www.roland.com/global/categories/synthesizers/analog_modeling/",
            "https://www.roland.com/global/categories/synthesizers/performance_workstation/",
            "https://www.roland.com/global/categories/synthesizers/sound_expansion_patches/",
            "https://www.roland.com/global/categories/synthesizers/accessories/",
            # Keyboards
            "https://www.roland.com/global/categories/keyboards/",
            # Guitar/Bass
            "https://www.roland.com/global/categories/guitar_bass/",
            # Drums/Percussion
            "https://www.roland.com/global/categories/drums_percussion/",
            # Wind Instruments
            "https://www.roland.com/global/categories/wind_instruments/",
            # Production
            "https://www.roland.com/global/categories/production/",
            # Amplifiers
            "https://www.roland.com/global/categories/amplifiers/",
            "https://www.roland.com/global/categories/amplifiers/keyboard_amplifiers/",
            # AIRA
            "https://www.roland.com/global/categories/aira/",
            # Roland Cloud
            "https://www.roland.com/global/categories/roland_cloud/",
            # Featured Products
            "https://www.roland.com/global/categories/featured_products/",
            # Accessories
            "https://www.roland.com/global/categories/accessories/",
            "https://www.roland.com/global/categories/accessories/headphones/",
            # Organs
            "https://www.roland.com/global/categories/organs/",
        ]

    async def scrape_all_products(self, max_products: int = None) -> ProductCatalog:
        """
        Scrape ALL Roland products with COMPREHENSIVE data extraction

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
            f"🎹 Starting COMPREHENSIVE Roland scrape (max: {'ALL' if max_products is None else max_products})")
        logger.info(f"   Goal: Extract ALL available data for JIT RAG system")

        async with async_playwright() as p:
            # Use --disable-dev-shm-usage to prevent crashes in containerized environments
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
                    id="roland",
                    name="Roland Corporation",
                    website="https://www.roland.com",
                    description="World leader in electronic musical instruments",
                    categories=["Electronic Drums", "Digital Pianos",
                                "Synthesizers", "Guitar Products", "Wind Instruments"]
                )

                catalog = ProductCatalog(
                    brand_identity=brand,
                    products=products,
                    total_products=len(products),
                    last_updated=datetime.utcnow(),
                    catalog_version="3.6.1",
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

    async def _discover_all_categories(self, page: Page) -> Set[str]:
        """Dynamically discover ALL category and subcategory URLs"""
        logger.info(
            "🔍 Dynamically discovering all categories and subcategories...")

        discovered_categories = set(self.category_urls)

        # Visit each known category to find more subcategories
        for cat_url in list(self.category_urls):
            try:
                # Add timeout wrapper for each category visit
                await asyncio.wait_for(
                    self._navigate(page, cat_url),
                    timeout=15
                )
                await asyncio.sleep(2)

                # Find all category links on this page with timeout
                try:
                    links = await asyncio.wait_for(
                        page.locator('a[href*="/categories/"]').all(),
                        timeout=10
                    )
                    for link in links:
                        try:
                            href = await link.get_attribute('href')
                            if href and href.startswith('/global/categories/'):
                                full_url = f"https://www.roland.com{href}"
                                # Avoid obvious non-category pages
                                if not any(skip in full_url.lower() for skip in ['/apps/', '/search']):
                                    discovered_categories.add(full_url)
                        except:
                            continue
                except asyncio.TimeoutError:
                    logger.warning(f"   Timeout finding links on {cat_url}")
            except Exception as e:
                logger.warning(f"   Error discovering from {cat_url}: {e}")
                continue

        logger.info(
            f"   Found {len(discovered_categories)} total category URLs")
        return discovered_categories

    async def _get_product_urls(self, page: Page, max_products: int = None) -> List[str]:
        """Get all product URLs by navigating through categories and subcategories"""
        logger.info(
            f"📄 Discovering products through category/subcategory navigation")

        # First, discover all categories dynamically
        all_category_urls = await self._discover_all_categories(page)
        logger.info(f"   Will explore {len(all_category_urls)} category pages")

        all_urls = set()

        # Method 1: Get products from main page
        logger.info(f"   Checking main products page...")
        try:
            await asyncio.wait_for(
                self._navigate(page, self.products_url),
                timeout=20
            )
            await asyncio.sleep(2)

            main_page_links = await asyncio.wait_for(
                page.locator('a[href*="/products/"]').all(),
                timeout=10
            )
        except asyncio.TimeoutError:
            logger.warning("   Timeout on main products page, continuing...")
            main_page_links = []
        
        for link in main_page_links:
            try:
                href = await link.get_attribute('href')
                if href and 'roland.com' in href or href.startswith('/'):
                    if href.startswith('//'):
                        href = f"https:{href}"
                    elif href.startswith('/'):
                        href = f"https://www.roland.com{href}"
                    if '/products/' in href and not href.endswith('/products/'):
                        all_urls.add(href)
            except:
                continue

        logger.info(f"   Found {len(all_urls)} products from main page")

        # Method 2: Navigate through all discovered category pages
        logger.info(f"   Exploring all category pages...")

        # Track visited pages to avoid duplicates
        visited_pages = set()
        subcategory_urls = set()

        # Visit each category page (NO LIMIT - get all products)
        for i, cat_url in enumerate(list(all_category_urls), 1):
            if max_products and len(all_urls) >= max_products:
                break
            try:
                if cat_url in visited_pages:
                    continue
                visited_pages.add(cat_url)

                logger.info(
                    f"   Category {i}/{len(all_category_urls)}: {cat_url[:80]}...")
                
                try:
                    await asyncio.wait_for(
                        self._navigate(page, cat_url),
                        timeout=15
                    )
                    await asyncio.sleep(1)

                    # Get product links from category page with timeout
                    cat_links = await asyncio.wait_for(
                        page.locator('a[href*="/products/"]').all(),
                        timeout=10
                    )
                except asyncio.TimeoutError:
                    logger.warning(f"   Timeout on category {cat_url}, skipping...")
                    continue

                for link in cat_links:
                    try:
                        href = await link.get_attribute('href')
                        if href:
                            if href.startswith('//'):
                                href = f"https:{href}"
                            elif href.startswith('/'):
                                href = f"https://www.roland.com{href}"

                            # Only Roland product pages
                            if ('roland.com' in href and
                                '/products/' in href and
                                    not href.endswith('/products/')):
                                all_urls.add(href)
                    except:
                        continue

                # Look for subcategory links on this page with timeout
                try:
                    all_links = await asyncio.wait_for(
                        page.locator('a').all(),
                        timeout=10
                    )
                except asyncio.TimeoutError:
                    logger.warning(f"   Timeout finding subcategory links on {cat_url}")
                    all_links = []
                
                for link in all_links:
                    try:
                        href = await link.get_attribute('href')
                        text = await link.inner_text()

                        if href and text and len(text.strip()) > 2:
                            if href.startswith('//'):
                                href = f"https:{href}"
                            elif href.startswith('/'):
                                href = f"https://www.roland.com{href}"

                            # Detect subcategory links (categories or products subdirectories)
                            if (href not in visited_pages and
                                'roland.com' in href and
                                    ('/categories/' in href or '/products/' in href)):
                                # Avoid obvious non-product pages
                                if not any(skip in href.lower() for skip in
                                           ['/search', '/news', '/support', '/community', '/articles']):
                                    subcategory_urls.add(href)
                    except:
                        continue

            except Exception as e:
                logger.warning(f"   Error exploring category {cat_url}: {e}")
                continue

        # Method 3: Explore subcategories (NO LIMIT)
        if subcategory_urls:
            logger.info(
                f"   Found {len(subcategory_urls)} additional subcategories to explore")

            # Visit all subcategories to ensure complete coverage
            for i, sub_url in enumerate(list(subcategory_urls), 1):
                if max_products and len(all_urls) >= max_products:
                    break
                try:
                    if sub_url in visited_pages or sub_url in all_urls:
                        continue
                    visited_pages.add(sub_url)

                    logger.info(
                        f"   Subcategory {i}/{len(subcategory_urls)}: {sub_url[:80]}...")
                    
                    try:
                        await asyncio.wait_for(
                            self._navigate(page, sub_url),
                            timeout=15
                        )
                        await asyncio.sleep(1)

                        # Get product links from subcategory page with timeout
                        sub_links = await asyncio.wait_for(
                            page.locator('a[href*="/products/"]').all(),
                            timeout=10
                        )
                    except asyncio.TimeoutError:
                        logger.warning(f"   Timeout on subcategory {sub_url}, skipping...")
                        continue
                    except Exception:
                        continue

                    for link in sub_links:
                        try:
                            href = await link.get_attribute('href')
                            if href:
                                if href.startswith('//'):
                                    href = f"https:{href}"
                                elif href.startswith('/'):
                                    href = f"https://www.roland.com{href}"

                                # Only Roland product pages
                                if ('roland.com' in href and
                                    '/products/' in href and
                                        not href.endswith('/products/')):
                                    all_urls.add(href)
                        except:
                            continue

                except Exception as e:
                    logger.warning(
                        f"   Error exploring subcategory {sub_url}: {e}")
                    continue

        # Remove duplicates and filter
        urls = []
        for url in all_urls:
            # Skip non-product pages
            if any(skip in url.lower() for skip in ['/search', '/news', '/support', '/community', '/articles']):
                continue
            urls.append(url)

        # Sort for consistent ordering
        urls = sorted(list(set(urls)))

        logger.info(f"📋 Total unique products found: {len(urls)}")

        return urls

    async def _scrape_product_page(self, page: Page, url: str) -> Optional[ProductCore]:
        """
        COMPREHENSIVE product page scraping - Extract ALL available data

        Extracts:
        - Metadata (name, model, categories)
        - Full descriptions (all text content)
        - ALL images (main, gallery, technical)
        - ALL specifications (complete spec tables)
        - Features list
        - Manuals and documentation (PDFs, guides)
        - Knowledge base articles
        - Support resources (downloads, software)
        - Related accessories
        - Support links
        - Videos and media
        """

        try:
            # Add timeout wrapper for page navigation
            await asyncio.wait_for(
                self._navigate(page, url),
                timeout=20
            )
            await asyncio.sleep(1)

            # ============================================================
            # 1. EXTRACT PRODUCT NAME & MODEL
            # ============================================================
            name = ""
            model_number = ""

            try:
                if await asyncio.wait_for(page.locator('h1').count(), timeout=5) > 0:
                    name = await asyncio.wait_for(
                        page.locator('h1').first.inner_text(),
                        timeout=5
                    )
                    name = name.strip()
            except asyncio.TimeoutError:
                logger.warning(f"   Timeout extracting name from {url}")

            # Try to extract model number from name or page
            model_match = re.search(
                r'([A-Z]{2,}-\d+[A-Z]*)', name) if name else None
            if model_match:
                model_number = model_match.group(1)

            if not name:
                logger.warning(f"   No product name found on {url}")
                return None

            # Generate product ID from URL
            product_id = url.split('/products/')[-1].rstrip('/').split('/')[0]
            product_id = f"roland-{product_id}"

            # ============================================================
            # 2. EXTRACT FULL DESCRIPTION (ALL TEXT CONTENT)
            # ============================================================
            description = ""
            short_description = ""

            # Try meta description first
            meta_desc = await page.locator('meta[name="description"]').get_attribute('content') if await page.locator('meta[name="description"]').count() > 0 else ""
            if meta_desc:
                short_description = meta_desc[:200]

            # Collect ALL description paragraphs
            description_parts = []
            desc_selectors = [
                '.product-description',
                '.description',
                '[class*="description"]',
                'article p',
                'main p',
                '.content p'
            ]

            for selector in desc_selectors:
                try:
                    elements = await asyncio.wait_for(
                        page.locator(selector).all(),
                        timeout=5
                    )
                    for elem in elements:
                        try:
                            text = await asyncio.wait_for(elem.inner_text(), timeout=2)
                            if text and len(text.strip()) > 20 and text not in description_parts:
                                description_parts.append(text.strip())
                        except:
                            continue
                except asyncio.TimeoutError:
                    continue

            description = "\n\n".join(description_parts) if description_parts else (
                short_description or name)

            # ============================================================
            # 3. EXTRACT ALL IMAGES & MEDIA (COMPLETE GALLERY)
            # ============================================================
            images = []
            seen_urls: Set[str] = set()

            # Try multiple image selectors
            img_selectors = [
                'img[src*="product"]',
                'img[src*="roland"]',
                '.product-image img',
                '.gallery img',
                '.image-gallery img',
                '[class*="image"] img',
                'main img',
                'article img'
            ]

            for selector in img_selectors:
                try:
                    img_elements = await asyncio.wait_for(
                        page.locator(selector).all(),
                        timeout=5
                    )
                    for img_elem in img_elements:
                        try:
                            src = await asyncio.wait_for(img_elem.get_attribute('src'), timeout=2)
                            alt = await asyncio.wait_for(img_elem.get_attribute('alt'), timeout=2) or name

                            if not src or src in seen_urls:
                                continue

                            # Skip icons, logos, tiny images
                            if any(skip in src.lower() for skip in ['icon', 'logo', 'button', 'banner']):
                                continue

                            # Make absolute URL
                            if src.startswith('//'):
                                src = f"https:{src}"
                            elif src.startswith('/'):
                                src = f"https://www.roland.com{src}"

                            # Determine image type
                            img_type = "main"
                            if 'gallery' in src.lower() or len(images) > 0:
                                img_type = "gallery"
                            if 'spec' in src.lower() or 'diagram' in src.lower():
                                img_type = "technical"

                            images.append(ProductImage(
                                url=src,
                                type=img_type,
                                alt_text=alt
                            ))
                            seen_urls.add(src)
                        except (asyncio.TimeoutError, Exception):
                            continue
                except asyncio.TimeoutError:
                    continue  # Skip this selector if timeout

            # ============================================================
            # 4. EXTRACT ALL VIDEOS
            # ============================================================
            video_urls = []
            video_selectors = [
                'iframe[src*="youtube"]',
                'iframe[src*="vimeo"]',
                'video source',
                'a[href*="youtube"]',
                'a[href*="vimeo"]'
            ]

            for selector in video_selectors:
                try:
                    elements = await asyncio.wait_for(
                        page.locator(selector).all(),
                        timeout=5
                    )
                    for elem in elements:
                        try:
                            video_url = await asyncio.wait_for(
                                elem.get_attribute('src'),
                                timeout=2
                            ) or await asyncio.wait_for(
                                elem.get_attribute('href'),
                                timeout=2
                            )
                            if video_url and video_url not in video_urls:
                                if not video_url.startswith('http'):
                                    video_url = f"https:{video_url}" if video_url.startswith(
                                        '//') else f"https://www.roland.com{video_url}"
                                video_urls.append(video_url)
                        except (asyncio.TimeoutError, Exception):
                            continue
                except asyncio.TimeoutError:
                    continue  # Skip this selector if timeout

            # ============================================================
            # 5. EXTRACT ALL SPECIFICATIONS (COMPLETE TABLES)
            # ============================================================
            specifications = []

            # Look for specification tables
            try:
                tables = await asyncio.wait_for(
                    page.locator('table').all(),
                    timeout=5
                )
            except asyncio.TimeoutError:
                tables = []
            
            for table in tables:
                try:
                    rows = await table.locator('tr').all()
                    for row in rows:
                        cells = await row.locator('td, th').all()
                        if len(cells) >= 2:
                            key = await cells[0].inner_text()
                            value = await cells[1].inner_text()
                            if key and value and len(key.strip()) > 0:
                                # Determine spec category
                                spec_category = "General"
                                key_lower = key.lower()
                                if any(word in key_lower for word in ['dimension', 'size', 'width', 'height', 'depth']):
                                    spec_category = "Dimensions"
                                elif any(word in key_lower for word in ['weight', 'mass']):
                                    spec_category = "Weight"
                                elif any(word in key_lower for word in ['power', 'voltage', 'current']):
                                    spec_category = "Power"
                                elif any(word in key_lower for word in ['audio', 'frequency', 'output', 'input', 'sound']):
                                    spec_category = "Audio"
                                elif any(word in key_lower for word in ['interface', 'connectivity', 'port', 'usb', 'midi']):
                                    spec_category = "Connectivity"

                                specifications.append(ProductSpecification(
                                    category=spec_category,
                                    key=key.strip(),
                                    value=value.strip(),
                                    source=SourceType.BRAND_OFFICIAL
                                ))
                except:
                    continue

            # Also look for dl/dt/dd specification lists
            dl_elements = await page.locator('dl').all()
            for dl in dl_elements:
                try:
                    dt_elements = await dl.locator('dt').all()
                    dd_elements = await dl.locator('dd').all()

                    for dt, dd in zip(dt_elements, dd_elements):
                        key = await dt.inner_text()
                        value = await dd.inner_text()
                        if key and value:
                            specifications.append(ProductSpecification(
                                category="General",
                                key=key.strip(),
                                value=value.strip(),
                                source=SourceType.BRAND_OFFICIAL
                            ))
                except:
                    continue

            # ============================================================
            # 6. EXTRACT FEATURES LIST
            # ============================================================
            features = []

            # Look for bullet points, feature lists
            feature_selectors = [
                'ul li',
                '.features li',
                '.feature-list li',
                '[class*="feature"] li'
            ]

            for selector in feature_selectors:
                elements = await page.locator(selector).all()
                for elem in elements[:30]:  # Limit to reasonable number
                    try:
                        text = await elem.inner_text()
                        if text and len(text.strip()) > 10 and text not in features:
                            features.append(text.strip())
                    except:
                        continue

            # ============================================================
            # 7. EXTRACT MANUALS & DOCUMENTATION
            # ============================================================
            manual_urls = []

            # Look for download links (PDFs, manuals)
            download_selectors = [
                'a[href$=".pdf"]',
                'a[href*="manual"]',
                'a[href*="download"]',
                'a[href*="guide"]',
                'a[href*="documentation"]'
            ]

            for selector in download_selectors:
                elements = await page.locator(selector).all()
                for elem in elements:
                    try:
                        href = await elem.get_attribute('href')
                        if href and href not in manual_urls:
                            if href.startswith('/'):
                                href = f"https://www.roland.com{href}"
                            elif not href.startswith('http'):
                                href = f"https://www.roland.com/{href}"
                            manual_urls.append(href)
                    except:
                        continue

            # ============================================================
            # 8. EXTRACT SUPPORT RESOURCES & LINKS
            # ============================================================
            support_url = None

            # Look for support page link
            support_selectors = [
                'a[href*="support"]',
                'a[href*="help"]',
                'a[href*="faq"]'
            ]

            for selector in support_selectors:
                if await page.locator(selector).count() > 0:
                    elem = page.locator(selector).first
                    href = await elem.get_attribute('href')
                    if href:
                        if href.startswith('/'):
                            support_url = f"https://www.roland.com{href}"
                        elif href.startswith('http'):
                            support_url = href
                        break

            # ============================================================
            # 9. DETERMINE HIERARCHY (BREADCRUMBS & CATEGORIES)
            # ============================================================
            main_category = "Musical Instruments"
            subcategory = None
            sub_subcategory = None
            
            # Method A: Extract from Breadcrumbs (Most Accurate)
            # Selector strategies for Roland's breadcrumbs
            breadcrumb_selectors = [
                 '.breadcrumb li',
                 'ul.breadcrumbs li',
                 'nav[aria-label="breadcrumb"] li',
                 '.breadcrumb-item',
                 '#breadcrumb li'
            ]
            
            breadcrumbs = []
            for selector in breadcrumb_selectors:
                elements = await page.locator(selector).all()
                if len(elements) > 1:
                    for elem in elements:
                        text = await elem.inner_text()
                        if text:
                            breadcrumbs.append(text.strip())
                    if breadcrumbs: 
                        break
            
            if len(breadcrumbs) >= 2:
                # Structure: Home > Categories > Main > Sub > Product
                # Or: Home > Main > Sub > Product
                
                # Filter out 'Home' or 'Products' or 'Categories'
                clean_crumbs = [b for b in breadcrumbs if b.lower() not in ['home', 'products', 'categories', 'top']]
                
                # Remove the product name itself if it's the last crumb
                if clean_crumbs and (clean_crumbs[-1].lower() in name.lower() or name.lower() in clean_crumbs[-1].lower()):
                    clean_crumbs.pop()
                
                if len(clean_crumbs) >= 1:
                     main_category = clean_crumbs[0]
                if len(clean_crumbs) >= 2:
                     subcategory = clean_crumbs[1]
                if len(clean_crumbs) >= 3:
                     sub_subcategory = clean_crumbs[2]

            # Method B: Fallback Keyword Matching (If breadcrumbs failed for main category)
            if main_category == "Musical Instruments":
                url_lower = url.lower()
                name_lower = name.lower()

                if 'drum' in url_lower or 'td-' in url_lower or 'drum' in name_lower:
                    main_category = "Electronic Drums"
                elif 'piano' in url_lower or 'fp-' in url_lower or 'rd-' in url_lower or 'piano' in name_lower:
                    main_category = "Digital Pianos"
                elif 'synth' in url_lower or 'juno' in url_lower or 'jupiter' in url_lower or 'synth' in name_lower:
                    main_category = "Synthesizers"
                elif 'guitar' in url_lower or 'amp' in url_lower or 'guitar' in name_lower:
                    main_category = "Guitar Products"
                elif 'aero' in url_lower or 'wind' in name_lower:
                    main_category = "Wind Instruments"
                elif 'keyboard' in url_lower or 'keyboard' in name_lower:
                    main_category = "Keyboards"
            
            logger.info(f"     └─ Hierarchy: {main_category} > {subcategory} > {sub_subcategory}")

            # ============================================================
            # 10. EXTRACT ACCESSORIES (FROM ACCESSORIES TAB/PAGE)
            # ============================================================
            accessories = []

            # Try to navigate to accessories page with stricter timeout
            accessories_url = url.rstrip('/') + '/accessories/'

            try:
                # Wrap entire accessories extraction in timeout
                async def extract_accessories():
                    response = await page.goto(accessories_url, wait_until='domcontentloaded', timeout=5000)

                    if response and response.status == 200:
                        await asyncio.sleep(1)

                        # Extract all product links from accessories page
                        accessory_links = await asyncio.wait_for(
                            page.locator('a[href*="/products/"]').all(),
                            timeout=5
                        )

                        for link in accessory_links:
                            try:
                                href = await asyncio.wait_for(link.get_attribute('href'), timeout=2)
                                acc_name = await asyncio.wait_for(link.inner_text(), timeout=2)
                                acc_name = acc_name.strip()

                                if not href or not acc_name or len(acc_name) < 3:
                                    # Try to find name within link
                                    heading = link.locator('h1, h2, h3, h4, .title, [class*="name"]').first
                                    if await asyncio.wait_for(heading.count(), timeout=2) > 0:
                                        acc_name = await asyncio.wait_for(heading.inner_text(), timeout=2)
                                        acc_name = acc_name.strip()

                                if not href or not acc_name or len(acc_name) < 3:
                                    continue

                                # Make absolute URL
                                if href.startswith('/'):
                                    href = f"https://www.roland.com{href}"

                                # Skip if not a product page or same as current
                                if '/products/' not in href or href.endswith('/products/') or href == url:
                                    continue

                                # Extract accessory ID
                                acc_id = href.split('/products/')[-1].rstrip('/').split('/')[0]

                                accessories.append(ProductRelationship(
                                    relationship_type=RelationshipType.ACCESSORY,
                                    target_product_id=f"roland-{acc_id}",
                                    target_product_name=acc_name,
                                    target_product_brand="Roland",
                                    description=f"Recommended accessory for {name}",
                                    is_required=False,
                                    priority=0
                                ))
                            except (asyncio.TimeoutError, Exception):
                                continue

                        # Go back to main product page
                        await asyncio.wait_for(self._navigate(page, url), timeout=10)
                        await asyncio.sleep(0.5)
                
                # Run with timeout
                await asyncio.wait_for(extract_accessories(), timeout=20)

            except (asyncio.TimeoutError, Exception) as e:
                # No accessories page or timeout - that's okay, skip it
                logger.debug(f"   Skipping accessories for {url}: {type(e).__name__}")
                pass

            # ============================================================
            # 11. EXTRACT RELATED PRODUCTS (SIMILAR/COMPLEMENTARY)
            # ============================================================
            related_products = []

            # Look for "related products" sections
            related_selectors = [
                '[class*="related"] a[href*="/products/"]',
                '[class*="similar"] a[href*="/products/"]',
                '[class*="recommended"] a[href*="/products/"]'
            ]

            for selector in related_selectors:
                try:
                    elements = await asyncio.wait_for(
                        page.locator(selector).all(),
                        timeout=3
                    )
                    for elem in elements[:10]:  # Limit
                        try:
                            href = await asyncio.wait_for(elem.get_attribute('href'), timeout=2)
                            rel_name = await asyncio.wait_for(elem.inner_text(), timeout=2)
                            rel_name = rel_name.strip()

                            if not href or not rel_name or href == url:
                                continue

                            if href.startswith('/'):
                                href = f"https://www.roland.com{href}"

                            if '/products/' not in href:
                                continue

                            rel_id = href.split('/products/')[-1].rstrip('/').split('/')[0]

                            related_products.append(ProductRelationship(
                                relationship_type=RelationshipType.RELATED,
                                target_product_id=f"roland-{rel_id}",
                                target_product_name=rel_name,
                                target_product_brand="Roland",
                                description=f"Related to {name}",
                                is_required=False,
                                priority=1
                            ))
                        except (asyncio.TimeoutError, Exception):
                            continue
                except asyncio.TimeoutError:
                    continue  # Skip this selector if timeout

            # ============================================================
            # 12. CREATE COMPREHENSIVE PRODUCT
            # ============================================================
            product = ProductCore(
                id=product_id,
                brand="Roland",
                name=name,
                model_number=model_number if model_number else None,
                description=description,
                short_description=short_description if short_description else None,
                brand_product_url=url,
                main_category=main_category,
                subcategory=subcategory,
                sub_subcategory=sub_subcategory,
                images=images,
                video_urls=video_urls,
                specifications=specifications,
                features=features,
                manual_urls=manual_urls,
                support_url=support_url,
                accessories=accessories,
                related_products=related_products,
                data_sources=[SourceType.BRAND_OFFICIAL],
                last_scraped=datetime.utcnow(),
                last_updated=datetime.utcnow()
            )

            # Log what we found
            logger.info(f"   ✓ {name}")
            logger.info(
                f"     └─ Images: {len(images)} | Videos: {len(video_urls)} | Specs: {len(specifications)}")
            logger.info(
                f"     └─ Features: {len(features)} | Manuals: {len(manual_urls)} | Accessories: {len(accessories)}")
            if support_url:
                logger.info(f"     └─ Support URL: ✓")

            return product

        except Exception as e:
            logger.error(f"   Error scraping product page {url}: {e}")
            import traceback
            traceback.print_exc()
            return None


async def test_scraper():
    """Test the COMPREHENSIVE Roland scraper"""
    scraper = RolandScraper()

    print("🧪 Testing Roland Scraper - COMPREHENSIVE DATA EXTRACTION\n")
    print("="*80)
    print("Goal: Extract ALL available data for JIT RAG system")
    print("  ✓ Metadata, descriptions, images, videos")
    print("  ✓ Specifications, features, manuals")
    print("  ✓ Support resources, accessories, related products")
    print("="*80)

    # Scrape ALL products (no limit) - or set limit for testing
    catalog = await scraper.scrape_all_products(max_products=None)

    print(f"\n✅ COMPREHENSIVE SCRAPING COMPLETE!")
    print(f"\n📊 CATALOG STATISTICS:")
    print(f"   Total Products: {catalog.total_products}")
    print(f"   Brand: {catalog.brand_identity.name}")
    print(f"   Version: {catalog.catalog_version}")

    print(f"\n📈 DATA COVERAGE:")
    stats = catalog.coverage_stats
    print(f"   Total Images: {stats.get('total_images', 0)}")
    print(f"   Total Videos: {stats.get('total_videos', 0)}")
    print(f"   Total Specifications: {stats.get('total_specifications', 0)}")
    print(f"   Total Features: {stats.get('total_features', 0)}")
    print(f"   Total Manuals: {stats.get('total_manuals', 0)}")
    print(f"   Total Accessories: {stats.get('total_accessories', 0)}")
    print(f"   Avg Images/Product: {stats.get('avg_images_per_product', 0)}")
    print(f"   Avg Specs/Product: {stats.get('avg_specs_per_product', 0)}")

    print("\n📦 SAMPLE PRODUCTS (showing first 5):")
    for i, p in enumerate(catalog.products[:5], 1):
        print(f"\n   {i}. {p.name}")
        print(f"      └─ Category: {p.main_category}")
        print(f"      └─ Model: {p.model_number or 'N/A'}")
        print(
            f"      └─ Images: {len(p.images)} | Videos: {len(p.video_urls)}")
        print(
            f"      └─ Specs: {len(p.specifications)} | Features: {len(p.features)}")
        print(
            f"      └─ Manuals: {len(p.manual_urls)} | Accessories: {len(p.accessories)}")
        print(f"      └─ Description: {p.description[:100]}..." if len(
            p.description) > 100 else f"      └─ Description: {p.description}")
        if p.support_url:
            print(f"      └─ Support: ✓")

    # Save comprehensive output
    output_dir = Path(__file__).parent.parent / "data" / "catalogs_brand"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "roland_brand_comprehensive.json"

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(catalog.model_dump(), f, indent=2,
                  ensure_ascii=False, default=str)

    print(f"\n💾 COMPREHENSIVE CATALOG SAVED:")
    print(f"   {output_file}")
    print(f"   Size: {output_file.stat().st_size / 1024:.2f} KB")

    print("\n" + "="*80)
    print("✨ Ready for JIT RAG system!")
    print("="*80)


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    asyncio.run(test_scraper())
