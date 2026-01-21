"""
Hierarchy-Aware Product Scraper - v3.7.3-DNA
======================================

Scrapes products with complete relationship mapping:
- Main products
- Bound accessories
- Related/complementary products
"""

from models.product_hierarchy import (
    ProductCore,
    ProductRelationship,
    RelationshipType,
    ProductImage,
    ProductSpecification,
    SourceType,
    ProductStatus,
    BrandIdentity,
    ProductCatalog
)
import asyncio
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Any, Set
from datetime import datetime
from bs4 import BeautifulSoup
import httpx
from playwright.async_api import async_playwright, Page

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


logger = logging.getLogger(__name__)


class HierarchyScraper:
    """
    Intelligent scraper that identifies product relationships:
    - Detects accessories through common patterns
    - Identifies related products
    - Maps compatibility relationships
    """

    def __init__(self, data_dir: Path = None):
        if data_dir is None:
            data_dir = Path(__file__).resolve().parents[1] / "data"

        self.data_dir = Path(data_dir)
        self.catalogs_dir = self.data_dir / "catalogs_brand"
        self.catalogs_dir.mkdir(parents=True, exist_ok=True)

        # Accessory detection patterns
        self.accessory_keywords = {
            'cable', 'case', 'bag', 'cover', 'stand', 'mount', 'adapter',
            'power supply', 'pedal', 'footswitch', 'sustain pedal',
            'expression pedal', 'damper', 'stool', 'bench', 'throne',
            'stick', 'mallet', 'brush', 'heads', 'skin', 'pad',
            'module holder', 'clamp', 'connector', 'interface'
        }

        # Related product patterns
        self.related_keywords = {
            'subwoofer', 'speaker', 'monitor', 'headphones',
            'amplifier', 'mixer', 'interface', 'controller',
            'keyboard', 'synthesizer', 'drum machine', 'sequencer'
        }

        # Browser headers
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    async def scrape_brand_with_hierarchy(
        self,
        brand_id: str,
        brand_config: Dict[str, Any],
        max_products: int = 100
    ) -> ProductCatalog:
        """
        Scrape a brand's complete product catalog with relationships

        Args:
            brand_id: Brand identifier
            brand_config: Configuration with URLs and selectors
            max_products: Maximum products to scrape

        Returns:
            Complete ProductCatalog with hierarchy
        """
        logger.info(f"🔍 Starting hierarchical scrape for: {brand_id}")

        # Phase 1: Scrape all products
        products_raw = await self._scrape_all_products(brand_config, max_products)
        logger.info(f"📦 Found {len(products_raw)} raw products")

        # Phase 2: Classify products (main vs accessories)
        main_products = []
        accessory_products = []

        for product in products_raw:
            if self._is_accessory(product):
                accessory_products.append(product)
            else:
                main_products.append(product)

        logger.info(f"   Main products: {len(main_products)}")
        logger.info(f"   Accessories: {len(accessory_products)}")

        # Phase 3: Build product cores with relationships
        product_cores = []
        for product_raw in main_products:
            product_core = self._build_product_core(
                brand_id,
                product_raw,
                accessory_products
            )

            # Find related products
            self._add_related_products(product_core, main_products)

            product_cores.append(product_core)

        # Phase 4: Create catalog
        brand_identity = self._create_brand_identity(brand_id, brand_config)

        catalog = ProductCatalog(
            brand_identity=brand_identity,
            products=product_cores,
            total_products=len(product_cores),
            last_updated=datetime.utcnow(),
            catalog_version="3.6.1"
        )

        # Save to disk
        self._save_catalog(brand_id, catalog)

        logger.info(f"✅ Completed hierarchical scrape for {brand_id}")
        logger.info(
            f"   Total products with relationships: {len(product_cores)}")

        return catalog

    async def _scrape_all_products(
        self,
        config: Dict[str, Any],
        max_products: int
    ) -> List[Dict[str, Any]]:
        """Scrape all products using Playwright"""
        products = []

        # Get catalog URL from config
        base_url = config.get('catalog_url') or config.get(
            'base_url') or config.get('url')
        if not base_url:
            # Try to construct from website
            website = config.get('website', '')
            if website:
                base_url = f"{website}/products/" if not website.endswith(
                    '/') else f"{website}products/"
            else:
                logger.error(
                    "No catalog URL in config and no website to construct from")
                return products

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            try:
                logger.info(f"📄 Loading: {base_url}")
                await page.goto(base_url, timeout=30000, wait_until='networkidle')
                await page.wait_for_timeout(2000)  # Let JS render

                # Extract products using selectors from config
                product_selector = config.get(
                    'product_selector', '.product-item')

                product_elements = await page.query_selector_all(product_selector)
                logger.info(f"Found {len(product_elements)} product elements")

                for element in product_elements[:max_products]:
                    try:
                        product = await self._extract_product_data(element, config)
                        if product and product.get('name'):
                            products.append(product)
                    except Exception as e:
                        logger.error(f"Error extracting product: {e}")
                        continue

            except Exception as e:
                logger.error(f"Scraping error: {e}")
            finally:
                await browser.close()

        return products

    async def _extract_product_data(
        self,
        element,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract product data from HTML element"""
        product = {}

        # Name
        name_selector = config.get('name_selector', 'h2, h3, .product-name')
        name_elem = await element.query_selector(name_selector)
        if name_elem:
            product['name'] = (await name_elem.text_content()).strip()

        # URL
        link = await element.query_selector('a[href]')
        if link:
            product['url'] = await link.get_attribute('href')

        # Image
        img_selector = config.get('image_selector', 'img')
        img = await element.query_selector(img_selector)
        if img:
            product['image_url'] = (await img.get_attribute('src') or
                                    await img.get_attribute('data-src'))

        # Category
        cat_selector = config.get('category_selector', '.category')
        cat_elem = await element.query_selector(cat_selector)
        if cat_elem:
            product['category'] = (await cat_elem.text_content()).strip()

        # Description
        desc_selector = config.get(
            'description_selector', '.description, .tagline')
        desc_elem = await element.query_selector(desc_selector)
        if desc_elem:
            product['description'] = (await desc_elem.text_content()).strip()

        return product

    def _is_accessory(self, product: Dict[str, Any]) -> bool:
        """Determine if product is an accessory"""
        name = product.get('name', '').lower()
        category = product.get('category', '').lower()

        # Check name and category for accessory keywords
        text = f"{name} {category}"

        for keyword in self.accessory_keywords:
            if keyword in text:
                return True

        return False

    def _build_product_core(
        self,
        brand_id: str,
        product_raw: Dict[str, Any],
        all_accessories: List[Dict[str, Any]]
    ) -> ProductCore:
        """
        Build ProductCore with accessories

        Data Source Priority:
        - ALL product data from brand official website (PRIMARY)
        - Halilit used ONLY for: SKU, Prices (3 types), Images (if better quality)
        """

        # Generate ID
        name_slug = re.sub(r'[^a-z0-9]+', '-', product_raw['name'].lower())
        product_id = f"{brand_id}-{name_slug}"

        # Find matching accessories
        accessories = self._find_accessories(product_raw, all_accessories)

        # Build images from BRAND OFFICIAL SOURCE
        images = []
        if product_raw.get('image_url'):
            images.append(ProductImage(
                url=product_raw['image_url'],
                type='main',
                alt_text=f"{product_raw.get('name', '')} - Official"
            ))

        # Note: Pricing will be added later from Halilit (ONLY source for prices)
        product_core = ProductCore(
            id=product_id,
            brand=brand_id,
            name=product_raw.get('name', ''),
            main_category=product_raw.get('category', 'uncategorized'),
            description=product_raw.get('description', ''),
            images=images,
            accessories=accessories,
            brand_product_url=product_raw.get('url'),
            data_sources=[SourceType.BRAND_OFFICIAL],  # Primary source
            status=ProductStatus.IN_STOCK,
            # SKU will be added from Halilit during enrichment
            sku=None,
            # Pricing will be added from Halilit during enrichment
            pricing=None
        )

        return product_core

    def _find_accessories(
        self,
        main_product: Dict[str, Any],
        all_accessories: List[Dict[str, Any]]
    ) -> List[ProductRelationship]:
        """Find accessories that match this product"""
        relationships = []

        main_name = main_product.get('name', '').lower()
        main_category = main_product.get('category', '').lower()

        # Pattern matching for accessories
        for accessory in all_accessories:
            acc_name = accessory.get('name', '').lower()

            # Check if accessory name references main product
            # Example: "TD-17 Stand" matches "TD-17KVX"

            # Extract model number from main product
            model_match = re.search(
                r'[A-Z]{2,}-\d+[A-Z]*', main_product.get('name', ''))
            if model_match:
                model = model_match.group()
                if model.lower() in acc_name:
                    # Direct match
                    relationship = self._create_accessory_relationship(
                        main_product['name'],
                        accessory,
                        is_required=False
                    )
                    relationships.append(relationship)
                    continue

            # Category-based matching (e.g., drum accessories for drums)
            if main_category and main_category in acc_name:
                relationship = self._create_accessory_relationship(
                    main_product['name'],
                    accessory,
                    is_required=False
                )
                relationships.append(relationship)

        return relationships

    def _create_accessory_relationship(
        self,
        main_product_name: str,
        accessory: Dict[str, Any],
        is_required: bool = False
    ) -> ProductRelationship:
        """Create accessory relationship"""

        acc_name = accessory.get('name', '')
        brand = accessory.get('brand', 'unknown')
        name_slug = re.sub(r'[^a-z0-9]+', '-', acc_name.lower())
        acc_id = f"{brand}-{name_slug}"

        return ProductRelationship(
            relationship_type=RelationshipType.ACCESSORY,
            target_product_id=acc_id,
            target_product_name=acc_name,
            target_product_brand=brand,
            description=f"Recommended accessory for {main_product_name}",
            is_required=is_required,
            priority=0
        )

    def _add_related_products(
        self,
        product_core: ProductCore,
        all_main_products: List[Dict[str, Any]]
    ):
        """Add related product suggestions"""

        # Example: For a keyboard, suggest sustain pedals
        # For drum kit, suggest extra cymbals

        main_category = product_core.main_category.lower()

        # Category-based recommendations
        if 'keyboard' in main_category or 'piano' in main_category:
            # Look for stands, benches
            for product in all_main_products:
                prod_name = product.get('name', '').lower()
                if 'stand' in prod_name or 'bench' in prod_name:
                    rel = self._create_related_relationship(
                        product_core.brand,
                        product
                    )
                    if rel:
                        product_core.related_products.append(rel)

        elif 'drum' in main_category:
            # Look for cymbals, hardware
            for product in all_main_products:
                prod_name = product.get('name', '').lower()
                if 'cymbal' in prod_name or 'hardware' in prod_name:
                    rel = self._create_related_relationship(
                        product_core.brand,
                        product
                    )
                    if rel:
                        product_core.related_products.append(rel)

    def _create_related_relationship(
        self,
        brand: str,
        related_product: Dict[str, Any]
    ) -> Optional[ProductRelationship]:
        """Create related product relationship"""

        name = related_product.get('name')
        if not name:
            return None

        name_slug = re.sub(r'[^a-z0-9]+', '-', name.lower())
        prod_id = f"{brand}-{name_slug}"

        return ProductRelationship(
            relationship_type=RelationshipType.RELATED,
            target_product_id=prod_id,
            target_product_name=name,
            target_product_brand=brand,
            description="Recommended complementary product",
            is_required=False,
            priority=1
        )

    def _create_brand_identity(
        self,
        brand_id: str,
        config: Dict[str, Any]
    ) -> BrandIdentity:
        """Create brand identity from config"""

        # Extract category names from config
        categories_config = config.get('categories', {})
        if isinstance(categories_config, dict):
            # Extract main category names
            main_cats = categories_config.get('main_categories', [])
            category_names = [cat.get('name', cat.get('id', ''))
                              for cat in main_cats]
        else:
            category_names = []

        return BrandIdentity(
            id=brand_id,
            name=config.get('brand_name', brand_id.title()),
            logo_url=config.get('assets', {}).get(
                'logo', {}).get('primary_svg'),
            website=config.get('website'),
            description=config.get('description', ''),
            categories=category_names
        )

    def _save_catalog(self, brand_id: str, catalog: ProductCatalog):
        """Save catalog to JSON"""

        output_file = self.catalogs_dir / f"{brand_id}_brand.json"

        # Convert to dict and save
        catalog_dict = catalog.model_dump(mode='json')

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(catalog_dict, f, indent=2,
                      ensure_ascii=False, default=str)

        logger.info(f"💾 Saved catalog: {output_file}")


async def main():
    """Test scraper"""
    scraper = HierarchyScraper()

    # Example config for Roland
    roland_config = {
        'brand_name': 'Roland',
        'catalog_url': 'https://www.roland.com/global/products/',
        'product_selector': '.product-item',
        'name_selector': 'h2',
        'category_selector': '.category',
        'website': 'https://www.roland.com'
    }

    catalog = await scraper.scrape_brand_with_hierarchy(
        'roland',
        roland_config,
        max_products=50
    )

    print(f"\n✅ Scraped {catalog.total_products} products")
    print(
        f"   Sample product: {catalog.products[0].name if catalog.products else 'None'}")


if __name__ == "__main__":
    asyncio.run(main())
