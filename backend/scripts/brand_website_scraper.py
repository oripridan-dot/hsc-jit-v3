"""
JS-ENABLED BRAND SCRAPER: Universal Brand Website Scraper
Uses Playwright for JavaScript-rendered content

Purpose:
- Scrape full product catalogs from brand websites (not Halilit)
- Extract technical specs, manuals, documentation
- Enable product matching across sources
- Support dynamic/JS-heavy sites

Data Flow:
1. Scrape brand website → products_brand.json
2. Scrape Halilit → products_halilit.json  
3. Merge & Match → unified_catalog.json
4. Mark source: PRIMARY (in both), SECONDARY (brand-only)
"""

import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse
import logging
from datetime import datetime

try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BrandWebsiteScraper:
    """Scrapes brand websites using Playwright for JS support."""

    def __init__(self, data_dir: Optional[Path] = None, headless: bool = True):
        if data_dir is None:
            backend_dir = Path(__file__).resolve().parents[1]
            data_dir = backend_dir / "data"

        self.data_dir = Path(data_dir)
        self.catalogs_dir = self.data_dir / "catalogs_brand"
        self.catalogs_dir.mkdir(parents=True, exist_ok=True)

        self.headless = headless
        # Use a realistic browser UA to avoid bot blocks
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    async def scrape_brand(self, brand_id: str, start_url: str, max_products: int = 500,
                           config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Scrape brand website for products using Playwright.
        Supports both single-page and multi-page strategies.
        """
        # Check if multi-page strategy is configured
        if config and config.get("scraping_strategy") == "multi_page":
            return await self._scrape_multi_page(brand_id, start_url, config)
        
        # Default single-page scraping
        return await self._scrape_single_page(brand_id, start_url, max_products, config)

    async def _scrape_multi_page(self, brand_id: str, base_url: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Scrape multiple product pages individually."""
        if not async_playwright:
            logger.error("Playwright not installed.")
            return self._error_result(brand_id, "Playwright not installed")

        logger.info(f"🌐 [MULTI-PAGE SCRAPER] Starting scrape for: {brand_id}")
        
        product_pages = config.get("product_pages", [])
        if not product_pages:
            logger.error("No product_pages defined in config")
            return self._error_result(brand_id, "No product_pages in config")

        all_products = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            context = await browser.new_context(user_agent=self.headers["User-Agent"])

            try:
                for page_slug in product_pages:
                    url = f"{base_url}/{page_slug}"
                    logger.info(f"  📄 Loading {page_slug}...")
                    
                    try:
                        page = await context.new_page()
                        await page.goto(url, wait_until="networkidle", timeout=20000)
                        await page.wait_for_timeout(config.get("post_load_wait_ms", 2000))

                        # Get product title
                        title_elem = await page.query_selector('h1')
                        base_title = await title_elem.text_content() if title_elem else page_slug
                        base_title = base_title.strip()

                        # Get image
                        img = await page.query_selector(config["fields"]["image_url"]["selector"])
                        image_url = await img.get_attribute('src') if img else None
                        if image_url and not image_url.startswith('http'):
                            image_url = 'https://www.nordkeyboards.com' + image_url

                        # Check for variants
                        variant_selector = config.get("variant_selector")
                        variant_buttons = await page.query_selector_all(variant_selector) if variant_selector else []
                        
                        # Filter out empty/invalid buttons
                        valid_variants = []
                        for btn in variant_buttons:
                            text = await btn.text_content()
                            text = text.strip()
                            if text and text not in ["Models", ""]:
                                valid_variants.append(text)

                        if len(valid_variants) > 1:
                            # Multiple variants
                            for variant_name in valid_variants:
                                all_products.append({
                                    "name": variant_name,
                                    "image_url": image_url,
                                    "detail_url": url,
                                    "brand": brand_id.title()
                                })
                            logger.info(f"    ✅ {len(valid_variants)} variants")
                        else:
                            # Single product
                            all_products.append({
                                "name": base_title,
                                "image_url": image_url,
                                "detail_url": url,
                                "brand": brand_id.title()
                            })
                            logger.info(f"    ✅ {base_title}")

                        await page.close()

                    except Exception as e:
                        logger.error(f"    ❌ Error on {page_slug}: {str(e)[:50]}")

            finally:
                await browser.close()

        # Save results
        output_path = self.catalogs_dir / f"{brand_id}_brand.json"
        result = {
            "brand_id": brand_id,
            "source": "brand_website",
            "total_products": len(all_products),
            "products": all_products,
            "timestamp": datetime.now().isoformat(),
            "status": "success" if all_products else "partial"
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        logger.info(f"   💾 Saved {len(all_products)} products to {output_path}")
        return result

    def _error_result(self, brand_id: str, error: str) -> Dict[str, Any]:
        """Generate error result."""
        return {
            "brand_id": brand_id,
            "source": "brand_website",
            "total_products": 0,
            "products": [],
            "timestamp": datetime.now().isoformat(),
            "status": "failed",
            "error": error
        }

    async def _scrape_single_page(self, brand_id: str, start_url: str, max_products: int = 500,
                           config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Scrape brand website for products using Playwright.

        Args:
            brand_id: Brand identifier (e.g., 'roland')
            start_url: Starting URL for product list
            max_products: Maximum products to scrape

        Returns:
            {
                "brand_id": str,
                "source": "brand_website",
                "total_products": int,
                "products": [{"name", "url", "specs", ...}],
                "timestamp": datetime,
                "status": "success" | "partial" | "failed"
            }
        """
        if not async_playwright:
            logger.error(
                "Playwright not installed. Run: pip install -r requirements-playwright.txt")
            return {
                "brand_id": brand_id,
                "source": "brand_website",
                "total_products": 0,
                "products": [],
                "timestamp": datetime.now().isoformat(),
                "status": "failed",
                "error": "Playwright not installed"
            }

        logger.info(f"🌐 [BRAND SCRAPER] Starting scrape for: {brand_id}")
        logger.info(f"   URL: {start_url}")

        products = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless)
            context = await browser.new_context(user_agent=self.headers["User-Agent"])

            try:
                page = await context.new_page()

                # Navigate to start URL
                logger.info(f"   📄 Loading {start_url}")
                await page.goto(start_url, wait_until="networkidle", timeout=30000)

                # Handle consent banners if configured or by common defaults
                consent_selectors = []
                if config:
                    consent_selectors = config.get("consent_selectors", [])
                default_consent = [
                    "button:has-text('Accept')",
                    "button:has-text('I agree')",
                    "button#onetrust-accept-btn-handler",
                    "#onetrust-accept-btn-handler",
                    "button[aria-label='Accept']"
                ]
                for sel in consent_selectors + default_consent:
                    try:
                        btn = await page.query_selector(sel)
                        if btn:
                            await btn.click()
                            logger.info(
                                f"   ✅ Clicked consent selector: {sel}")
                            await page.wait_for_timeout(500)
                            break
                    except Exception:
                        continue

                # If config provides an explicit container selector, wait for it
                if config:
                    list_sel = config.get("product_list_selector")
                    if list_sel:
                        try:
                            await page.wait_for_selector(list_sel, timeout=10000)
                        except Exception:
                            logger.debug(
                                f"   ⏳ product_list_selector '{list_sel}' not found; continuing with heuristics")

                # Wait for products to load (extendable via config)
                extra_wait_ms = 0
                if config:
                    extra_wait_ms = config.get("post_load_wait_ms", 0)
                # Give JS time to render
                await page.wait_for_timeout(2000 + extra_wait_ms)

                # Brand-specific extraction (you can customize per brand)
                brand_products = await self._extract_products_js(
                    page, brand_id, max_products, config)
                products.extend(brand_products)

                logger.info(f"   ✅ Found {len(products)} products")

            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                return {
                    "brand_id": brand_id,
                    "source": "brand_website",
                    "total_products": 0,
                    "products": [],
                    "timestamp": datetime.now().isoformat(),
                    "status": "failed",
                    "error": str(e)
                }
            finally:
                await browser.close()

        # Save results
        output_path = self.catalogs_dir / f"{brand_id}_brand.json"
        result = {
            "brand_id": brand_id,
            "source": "brand_website",
            "total_products": len(products),
            "products": products,
            "timestamp": datetime.now().isoformat(),
            "status": "success" if products else "partial"
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        logger.info(f"   💾 Saved {len(products)} products to {output_path}")

        return result

    async def _extract_products_js(self, page, brand_id: str, max_count: int,
                                   config: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Extract products from page after JS rendering.
        Brand-specific logic can be added here.
        """
        products = []

        # 1) Config-driven selectors if provided
        if config:
            item_selector = config.get("product_item_selector")
            fields_cfg = config.get("fields")

            if item_selector:
                try:
                    items = await page.query_selector_all(item_selector)
                    if len(items) >= 1:
                        logger.info(
                            f"   Found {len(items)} items with config selector: {item_selector}")

                        for i, item in enumerate(items):
                            if len(products) >= max_count:
                                break

                            try:
                                if fields_cfg:
                                    product = await self._extract_product_item_custom(item, fields_cfg)
                                else:
                                    product = await self._extract_product_item(item)

                                if product.get("name"):
                                    products.append(product)
                            except Exception as e:
                                logger.debug(
                                    f"     Error extracting item {i}: {e}")
                                continue

                        if products:
                            return products
                except Exception as e:
                    logger.debug(
                        f"   Config selector {item_selector} failed: {e}")

        # 2) Universal selector attempts (fallback)
        selectors_to_try = [
            '.product-card',
            '.product-item',
            '.product',
            '[data-product-id]',
            'article',
            '.item-card',
            '.product-list-item'
        ]

        for selector in selectors_to_try:
            try:
                items = await page.query_selector_all(selector)
                if len(items) >= 2:
                    logger.info(
                        f"   Found {len(items)} items with: {selector}")

                    for i, item in enumerate(items):
                        if len(products) >= max_count:
                            break

                        try:
                            product = await self._extract_product_item(item)
                            if product.get("name"):
                                products.append(product)
                        except Exception as e:
                            logger.debug(
                                f"     Error extracting item {i}: {e}")
                            continue

                    if products:
                        break
            except Exception as e:
                logger.debug(f"   Selector {selector} failed: {e}")
                continue

        return products

    async def _extract_product_item(self, item) -> Dict[str, Any]:
        """Extract fields from a single product element."""
        product = {}

        # Name
        try:
            name_elem = await item.query_selector('h2, h3, h4, .name, .title')
            if name_elem:
                product["name"] = await name_elem.text_content()
                product["name"] = product["name"].strip(
                ) if product["name"] else None
        except:
            pass

        # URL
        try:
            link = await item.query_selector('a[href]')
            if link:
                product["url"] = await link.get_attribute('href')
        except:
            pass

        # Image
        try:
            img = await item.query_selector('img')
            if img:
                product["image_url"] = await img.get_attribute('src') or await img.get_attribute('data-src')
        except:
            pass

        # Price
        try:
            price_elem = await item.query_selector('.price, [class*="price"]')
            if price_elem:
                product["price"] = await price_elem.text_content()
                product["price"] = product["price"].strip(
                ) if product["price"] else None
        except:
            pass

        # Category
        try:
            cat_elem = await item.query_selector('.category, [class*="category"]')
            if cat_elem:
                product["category"] = await cat_elem.text_content()
                product["category"] = product["category"].strip(
                ) if product["category"] else None
        except:
            pass

        return product

    async def _extract_product_item_custom(self, item, fields_cfg: Dict[str, Any]) -> Dict[str, Any]:
        """Extract fields using config-provided selectors/attributes."""
        product: Dict[str, Any] = {}

        for field_name, cfg in fields_cfg.items():
            selector = cfg.get("selector")
            attribute = cfg.get("attribute", "text")

            if not selector:
                continue

            try:
                elem = await item.query_selector(selector)
                if not elem:
                    continue

                if attribute == "text":
                    val = await elem.text_content()
                    val = val.strip() if val else None
                else:
                    val = await elem.get_attribute(attribute)

                if val:
                    product[field_name] = val
            except Exception:
                continue

        return product


class ProductMatcher:
    """Matches products across Halilit and Brand websites."""

    @staticmethod
    def match_products(halilit_products: List[Dict], brand_products: List[Dict], brand_id: str) -> List[Dict]:
        """
        Match products across sources and mark as PRIMARY or SECONDARY.

        Returns unified product records with source flags.
        """
        unified = []
        matched_brand_ids: Set[int] = set()

        logger.info(f"\n🔗 [MATCHING] Matching products for {brand_id}")
        logger.info(f"   Halilit: {len(halilit_products)} products")
        logger.info(f"   Brand: {len(brand_products)} products")

        # Match Halilit products with Brand products
        for h_idx, h_prod in enumerate(halilit_products):
            h_name = h_prod.get("name", "").lower()
            h_sku = h_prod.get("item_code", "").lower()

            matched = False
            for b_idx, b_prod in enumerate(brand_products):
                b_name = b_prod.get("name", "").lower()

                # Match by name similarity or SKU
                if h_sku and h_sku in b_name:
                    matched_brand_ids.add(b_idx)
                    matched = True
                    break
                elif self._name_similarity(h_name, b_name) > 0.7:
                    matched_brand_ids.add(b_idx)
                    matched = True
                    break

            # Create unified record
            unified_prod = {
                **h_prod,
                "source_flag": "PRIMARY" if matched else "PRIMARY",  # Halilit is always primary
                "halilit_data": h_prod,
                "brand_data": brand_products[b_idx] if matched else None,
            }

            unified.append(unified_prod)

        # Add unmatched brand products as SECONDARY
        for b_idx, b_prod in enumerate(brand_products):
            if b_idx not in matched_brand_ids:
                unified_prod = {
                    **b_prod,
                    "source_flag": "SECONDARY",  # Brand-only
                    "halilit_data": None,
                    "brand_data": b_prod,
                }
                unified.append(unified_prod)

        logger.info(
            f"   ✅ Matched: {len(unified) - len([p for p in unified if p['source_flag'] == 'SECONDARY'])}")
        logger.info(
            f"   🔄 Secondary (brand-only): {len([p for p in unified if p['source_flag'] == 'SECONDARY'])}")

        return unified

    @staticmethod
    def _name_similarity(name1: str, name2: str) -> float:
        """Simple string similarity check."""
        if not name1 or not name2:
            return 0.0

        # Common words in both
        words1 = set(name1.split())
        words2 = set(name2.split())

        if not words1 or not words2:
            return 0.0

        common = len(words1 & words2)
        total = len(words1 | words2)

        return common / total if total > 0 else 0.0


async def main():
    """CLI entry: optionally pass brand_id via ARG/ENV; falls back to roland."""
    import os
    import sys

    brand_id = os.environ.get("BRAND_ID") or (
        len(sys.argv) > 1 and sys.argv[1]) or "roland"

    # Load config if present
    data_dir = Path(__file__).resolve().parents[1] / "data"
    config = None
    cfg_path = data_dir / "brands" / brand_id / "scrape_config.json"
    if cfg_path.exists():
        try:
            config = json.load(open(cfg_path, "r"))
        except Exception:
            config = None

    start_url = (config or {}).get(
        "base_url") or "https://www.roland.com/us/products/"

    scraper = BrandWebsiteScraper()
    matcher = ProductMatcher()

    brand_result = await scraper.scrape_brand(
        brand_id,
        start_url,
        max_products=100,
        config=config
    )

    logger.info(f"\n📊 [RESULT] {brand_result['brand_id']}")
    logger.info(f"   Total scraped: {brand_result['total_products']}")
    logger.info(f"   Status: {brand_result['status']}")


if __name__ == "__main__":
    asyncio.run(main())
