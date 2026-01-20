"""
� HALILIT CATALOG SYSTEM
=========================

The "Halilit Catalog" architecture: Pre-calculate everything.
Scrapes → Raw Data → Refiner → Golden Record (Static JSON) → Frontend

This script runs offline to build verified, static catalog data that the frontend consumes instantly.
No runtime API calls. No database queries. Just pristine JSON.

Usage:
    python3 forge_backbone.py
    
Result:
    frontend/public/data/ is populated with:
    - index.json (The Spine - Master Catalog Index)
    - <brand>.json (Individual Brand Catalogs)
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import logging
import urllib.request
import urllib.error
from io import BytesIO
import base64

# --- SETUP LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
SOURCE_DIR = Path("./data/catalogs_brand")  # Where scraper outputs live
PUBLIC_DATA_PATH = Path("../frontend/public/data")  # The "Live" destination
LOGOS_DIR = PUBLIC_DATA_PATH / "logos"  # Logo destination
CATALOG_VERSION = "3.7-Halilit"

# Brand color themes (WCAG AA compliant)
BRAND_THEMES = {
    "roland": {
        "primary": "#ef4444",
        "secondary": "#1f2937",
        "accent": "#fbbf24",
        "background": "#18181b",
        "text": "#ffffff"
    },
    "roland-catalog": {
        "primary": "#ef4444",
        "secondary": "#1f2937",
        "accent": "#fbbf24",
        "background": "#18181b",
        "text": "#ffffff"
    },
    "yamaha": {
        "primary": "#a855f7",
        "secondary": "#fbbf24",
        "accent": "#22d3ee",
        "background": "#18181b",
        "text": "#ffffff"
    },
    "yamaha-catalog": {
        "primary": "#a855f7",
        "secondary": "#fbbf24",
        "accent": "#22d3ee",
        "background": "#18181b",
        "text": "#ffffff"
    },
    "korg": {
        "primary": "#fb923c",
        "secondary": "#1f2937",
        "accent": "#34d399",
        "background": "#18181b",
        "text": "#ffffff"
    },
    "korg-catalog": {
        "primary": "#fb923c",
        "secondary": "#1f2937",
        "accent": "#34d399",
        "background": "#18181b",
        "text": "#ffffff"
    },
    "moog": {
        "primary": "#22d3ee",
        "secondary": "#f87171",
        "accent": "#34d399",
        "background": "#18181b",
        "text": "#ffffff"
    },
    "moog-catalog": {
        "primary": "#22d3ee",
        "secondary": "#f87171",
        "accent": "#34d399",
        "background": "#18181b",
        "text": "#ffffff"
    }
}


class HalilitCatalog:
    """The Halilit Catalog System - Transforms raw data into production-ready static JSON catalogs."""
    
    def __init__(self):
        self.source_dir = SOURCE_DIR
        self.output_dir = PUBLIC_DATA_PATH
        self.master_index = {
            "metadata": {
                "version": CATALOG_VERSION,
                "generated_at": datetime.now().isoformat(),
                "environment": "static_production",
                "note": "Golden Record - Pre-calculated, Static, Fast"
            },
            "brands": [],
            "search_graph": [],  # Lightweight search index for Halilit Catalog
            "total_products": 0
        }
        self.stats = {
            "brands_processed": 0,
            "products_total": 0,
            "images_verified": 0,
            "errors": []
        }
    
    def _download_logo(self, logo_url: str, brand_slug: str) -> str:
        """
        Download brand logo and save locally, return local path or data URI.
        Falls back to data URI if download fails.
        
        Returns:
            str: Local file path (/data/logos/...) or data URI (data:image/...)
        """
        if not logo_url or not logo_url.startswith('http'):
            return logo_url
        
        try:
            # Create logos directory
            logos_dir = self.output_dir / "logos"
            logos_dir.mkdir(parents=True, exist_ok=True)
            
            # Determine file extension from URL
            ext = '.svg' if '.svg' in logo_url else '.png'
            local_path = logos_dir / f"{brand_slug}_logo{ext}"
            
            # Skip if already downloaded
            if local_path.exists():
                return f"/data/logos/{brand_slug}_logo{ext}"
            
            # Download with timeout
            req = urllib.request.Request(
                logo_url,
                headers={'User-Agent': 'Mozilla/5.0 (Halilit Catalog Builder)'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                logo_data = response.read()
                
                # Save locally
                with open(local_path, 'wb') as f:
                    f.write(logo_data)
                
                logger.info(f"      ✓ Downloaded logo: {brand_slug} ({len(logo_data)} bytes)")
                return f"/data/logos/{brand_slug}_logo{ext}"
        
        except Exception as e:
            logger.warning(f"      ⚠️  Failed to download logo from {logo_url}: {e}")
            # Fallback: return original URL and let browser fetch it
            return logo_url
    
    def build(self):
        """Main Catalog Build Process"""
        logger.info(f"📚 [CATALOG] Building Halilit Catalog v{CATALOG_VERSION}...")
        logger.info(f"   Source: {self.source_dir.absolute()}")
        logger.info(f"   Output: {self.output_dir.absolute()}")
        
        try:
            # 1. Prepare Workspace
            self._prepare_workspace()
            
            # 2. Process Each Brand
            self._forge_brands()
            
            # 3. Finalize Catalog
            self._finalize_catalog()
            
            # 4. Report
            self._report()
            
            logger.info("✅ [CATALOG] Complete. System ready at frontend/public/data/index.json")
            return True
            
        except Exception as e:
            logger.error(f"❌ [CATALOG] Critical failure: {e}")
            return False
    
    def _prepare_workspace(self):
        """Ensure output directory exists and is clean."""
        logger.info("   [1/4] Preparing catalog workspace...")
        
        if not self.output_dir.exists():
            self.output_dir.mkdir(parents=True)
            logger.info(f"      Created {self.output_dir}")
        
        logger.info(f"      ✓ Catalog workspace ready")
    
    def _forge_brands(self):
        """Process each brand catalog and generate static files."""
        logger.info("   [2/4] Building brand catalogs...")
        
        if not self.source_dir.exists():
            logger.warning(f"      Source directory {self.source_dir} does not exist")
            logger.info("      Checking for catalogs_unified instead...")
            alt_source = Path("./data/catalogs_unified")
            if alt_source.exists():
                self.source_dir = alt_source
            else:
                logger.warning("      No source data found. Using empty catalog.")
                return
        
        catalog_files = list(self.source_dir.glob("*.json"))
        
        if not catalog_files:
            logger.warning(f"      No JSON files found in {self.source_dir}")
            return
        
        # Filter out "-brand.json" and "_brand.json" files to avoid duplicates (only process catalogs)
        catalog_files = [f for f in catalog_files if not ('_brand.json' in f.name or '-brand.json' in f.name)]
        
        for catalog_file in catalog_files:
            try:
                self._process_brand(catalog_file)
            except Exception as e:
                logger.error(f"      ❌ Failed: {catalog_file.name} - {e}")
                self.stats["errors"].append(str(e))
    
    def _process_brand(self, catalog_file: Path):
        """Process a single brand catalog."""
        
        try:
            with open(catalog_file, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
            
            # Extract Brand Info
            brand_name = raw_data.get('brand_name') or raw_data.get('name') or catalog_file.stem.replace('_', ' ').title()
            # Remove "Catalog" or "Brand" suffix from brand name for slug
            brand_name_clean = brand_name.replace(' Catalog', '').replace(' Brand', '').strip()
            safe_slug = brand_name_clean.lower().replace(" ", "-").replace(".", "").replace("&", "and")
            products = raw_data.get('products', [])
            product_count = len(products)
            
            logger.info(f"      🔨 {brand_name:20s} ({product_count:3d} products) → {safe_slug}.json")
            
            # --- REFINEMENT LAYER ---
            # Ensure data quality: IDs, images, structure
            refined_data = self._refine_brand_data(raw_data, brand_name, safe_slug)
            
            # --- BUILD SEARCH GRAPH ---
            # Lightweight index for Halileo AI
            self._index_for_search(refined_data, safe_slug)
            
            # --- WRITE BRAND FILE ---
            # This is lazy-loaded when user clicks the brand
            output_file = self.output_dir / f"{safe_slug}.json"
            with open(output_file, 'w', encoding='utf-8') as out:
                json.dump(refined_data, out, indent=2, ensure_ascii=False)
            
            # --- UPDATE MASTER INDEX ---
            self.master_index["brands"].append({
                "id": safe_slug,
                "name": brand_name,
                "slug": safe_slug,
                "count": product_count,
                "file": f"{safe_slug}.json",
                "data_file": f"{safe_slug}.json",
                "product_count": product_count,
                "verified_count": product_count,
                "last_updated": datetime.now().isoformat()
            })
            
            # --- UPDATE STATS ---
            self.stats["brands_processed"] += 1
            self.stats["products_total"] += product_count
            
        except json.JSONDecodeError as e:
            logger.error(f"      ❌ Invalid JSON in {catalog_file.name}: {e}")
            self.stats["errors"].append(f"JSON error in {catalog_file.name}")
        except Exception as e:
            logger.error(f"      ❌ Error processing {catalog_file.name}: {e}")
            self.stats["errors"].append(str(e))
    
    def _refine_brand_data(self, raw_data: Dict, brand_name: str, slug: str) -> Dict:
        """
        Refinement Layer: Ensure data quality AND build hierarchy
        - Ensure all products have IDs
        - Validate image structure
        - Add missing fields
        - Build hierarchical category structure (main → sub → products)
        - Enrich brand_identity with theme colors
        - Download brand logos locally
        """
        
        refined = raw_data.copy()
        refined['brand_name'] = brand_name
        refined['brand_slug'] = slug
        refined['refined_at'] = datetime.now().isoformat()
        
        # Enrich brand_identity with theme colors and download logo
        if 'brand_identity' not in refined:
            refined['brand_identity'] = {}
        
        # Always set brand_colors from BRAND_THEMES
        refined['brand_identity']['brand_colors'] = BRAND_THEMES.get(slug, {})
        
        # Download logo and update path
        if refined['brand_identity'].get('logo_url'):
            local_logo_path = self._download_logo(refined['brand_identity']['logo_url'], slug)
            refined['brand_identity']['logo_url'] = local_logo_path
        
        # First pass: Ensure product quality
        if 'products' in refined:
            for idx, product in enumerate(refined['products']):
                # Ensure ID
                if not product.get('id'):
                    product['id'] = f"{slug}-product-{idx}"
                
                # Ensure images are lists
                if 'images' in product and isinstance(product['images'], dict):
                    product['images'] = [product['images']]
                elif 'images' not in product:
                    product['images'] = []
                
                # Ensure category_hierarchy
                if 'category_hierarchy' not in product:
                    product['category_hierarchy'] = [product.get('category', 'Uncategorized')]
                
                # --- NEW: DOWNLOAD INNER LOGOS (series_logo) ---
                if product.get('series_logo'):
                    # Create a unique name: roland-fantom-06-series.png
                    logo_name = f"{slug}-{product.get('id', idx)}-series"
                    local_path = self._download_logo(product['series_logo'], logo_name)
                    product['series_logo'] = local_path
                    logger.info(f"      ⬇️  Downloaded inner logo for {product.get('name')}")
                
                # --- HALILEO INTELLIGENCE LAYER ---
                # Pre-calculate context tags for the Frontend "Brain"
                context_tags = []
                
                # 1. Complexity Analysis
                features = product.get('features', [])
                if len(features) > 10:
                    context_tags.append('complex_device')
                
                # 2. Category Intelligence
                cat_lower = product.get('category', '').lower()
                if 'synthesizer' in cat_lower or 'workstation' in cat_lower:
                    context_tags.append('needs_manual')
                    context_tags.append('sound_design_focused')
                elif 'piano' in cat_lower:
                    context_tags.append('action_focused')
                elif 'drum' in cat_lower:
                    context_tags.append('performance_focused')
                
                # 3. Media Intelligence
                if product.get('videos') or product.get('youtube_videos'):
                    context_tags.append('has_tutorials')
                
                if product.get('manuals') and len(product.get('manuals', [])) > 0:
                    context_tags.append('has_manual')
                
                # 4. Product Tier (based on features & specs)
                specs_count = len(product.get('specs', [])) + len(product.get('specifications', []))
                if specs_count > 20:
                    context_tags.append('pro_tier')
                elif specs_count < 5:
                    context_tags.append('entry_tier')
                
                # Store intelligence tags
                product['halileo_context'] = context_tags
        
        # Second pass: Build hierarchical category tree
        refined['hierarchy'] = self._build_category_hierarchy(refined.get('products', []))
        
        return refined
    
    def _build_category_hierarchy(self, products: List[Dict]) -> Dict:
        """
        Build a tree structure: Category → Subcategory → Products
        
        Structure:
        {
          "Electronics": {
            "Keyboards": [product1, product2],
            "Drums": [product3]
          },
          "Accessories": {
            "Cables": [product4]
          }
        }
        """
        hierarchy = {}
        
        for product in products:
            main_cat = product.get('main_category', 'Uncategorized')
            sub_cat = product.get('subcategory', 'General')
            
            # Ensure category exists
            if main_cat not in hierarchy:
                hierarchy[main_cat] = {}
            
            # Ensure subcategory exists
            if sub_cat not in hierarchy[main_cat]:
                hierarchy[main_cat][sub_cat] = []
            
            # Add product to subcategory (include full product data)
            hierarchy[main_cat][sub_cat].append({
                "id": product.get('id'),
                "name": product.get('name'),
                "description": product.get('short_description', product.get('description', '')),
                "images": product.get('images', []),
                "model_number": product.get('model_number'),
                "sku": product.get('sku')
            })
        
        return hierarchy
    
    def _index_for_search(self, brand_data: Dict, slug: str):
        """
        Build lightweight search graph entry for Halilit Catalog.
        This is what the navigator uses for instant suggestions.
        """
        
        brand_name = brand_data.get('brand_name', slug)
        
        for product in brand_data.get('products', []):
            entry = {
                "id": product.get('id'),
                "label": product.get('name', ''),
                "brand": slug,
                "brand_name": brand_name,
                "category": product.get('main_category', 'Uncategorized'),
                "subcategory": product.get('subcategory', 'General'),
                "keywords": product.get('features', [])[:5] if product.get('features') else [],
                "description": product.get('description', '')[:100] if product.get('description') else ''
            }
            self.master_index["search_graph"].append(entry)
    
    def _finalize_catalog(self):
        """Write the master index (The Spine of the Halilit Catalog)."""
        logger.info("   [3/4] Finalizing catalog structure...")
        
        # Update metadata
        self.master_index["metadata"]["total_brands"] = len(self.master_index["brands"])
        self.master_index["total_products"] = self.stats["products_total"]
        
        # Write index.json (The Master Catalog File)
        index_file = self.output_dir / "index.json"
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(self.master_index, f, indent=2, ensure_ascii=False)
        
        logger.info(f"      ✓ Master Catalog Index: {index_file.name}")
        logger.info(f"      ✓ {len(self.master_index['brands'])} brands")
        logger.info(f"      ✓ {self.master_index['total_products']} products")
        logger.info(f"      ✓ {len(self.master_index['search_graph'])} search entries")
    
    def _report(self):
        """Print final catalog build report."""
        logger.info("   [4/4] Catalog Build Report")
        logger.info(f"      📊 Brands Processed:   {self.stats['brands_processed']}")
        logger.info(f"      📊 Total Products:     {self.stats['products_total']}")
        logger.info(f"      📊 Search Entries:     {len(self.master_index['search_graph'])}")
        
        if self.stats['errors']:
            logger.warning(f"      ⚠️  Errors Encountered: {len(self.stats['errors'])}")
            for error in self.stats['errors'][:3]:
                logger.warning(f"         - {error}")
        else:
            logger.info(f"      ✅ Zero Errors")
        
        logger.info("")
        logger.info("🎯 HALILIT CATALOG IS READY")
        logger.info(f"   Frontend can now fetch /data/index.json")
        logger.info(f"   Each brand lazy-loads from /data/<slug>.json")


if __name__ == "__main__":
    catalog = HalilitCatalog()
    success = catalog.build()
    exit(0 if success else 1)
