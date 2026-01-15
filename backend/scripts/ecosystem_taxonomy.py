#!/usr/bin/env python3
"""
ECOSYSTEM TAXONOMY EXTRACTOR v3.5
Intelligently extracts product hierarchy, categories, families, and relationships

Features:
- Product family detection (e.g., "Nord Stage" family)
- Category/subcategory extraction
- Variant identification (61-key, 73-key, 88-key)
- Compatibility detection
- Technical specifications parsing
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, asdict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ProductTaxonomy:
    """Structured product taxonomy."""
    category: Optional[str] = None
    subcategory: Optional[str] = None
    product_family: Optional[str] = None
    series: Optional[str] = None
    variant: Optional[str] = None
    key_features: List[str] = None

    def __post_init__(self):
        if self.key_features is None:
            self.key_features = []


@dataclass
class ProductEcosystem:
    """Product ecosystem relationships."""
    compatible_accessories: List[str] = None
    compatible_with: List[str] = None
    part_of_family: Optional[str] = None
    supersedes: Optional[str] = None
    compatible_formats: List[str] = None

    def __post_init__(self):
        if self.compatible_accessories is None:
            self.compatible_accessories = []
        if self.compatible_with is None:
            self.compatible_with = []
        if self.compatible_formats is None:
            self.compatible_formats = []


class TaxonomyExtractor:
    """Extracts intelligent taxonomy from product data."""

    # Category keywords
    CATEGORIES = {
        'keyboards': ['keyboard', 'piano', 'organ', 'synth', 'synthesizer', 'electro'],
        'drums': ['drum', 'percussion', 'cymbal', 'hi-hat', 'snare'],
        'audio_interfaces': ['interface', 'audio interface', 'recording'],
        'controllers': ['controller', 'midi controller', 'pad controller'],
        'monitors': ['monitor', 'speaker', 'studio monitor'],
        'accessories': ['case', 'cover', 'stand', 'pedal', 'cable', 'adapter']
    }

    # Variant patterns
    VARIANT_PATTERNS = [
        r'(\d+)[-\s]?key',  # 61-key, 73-key, 88-key
        r'(\d+)"',           # 5", 8" (monitors)
        r'(compact|mini|pro|hp|d)',  # Model variants
        r'(mk\s*\d+|mark\s*\d+)',    # MK2, Mark II
        r'(v\d+)',           # V2, V3
    ]

    # Feature keywords
    FEATURES = [
        'waterfall', 'weighted', 'semi-weighted', 'hammer action',
        'aftertouch', 'polyphonic', 'velocity sensitive',
        'midi', 'usb', 'bluetooth', 'wireless',
        'rgb', 'led', 'backlit',
        'rechargeable', 'battery powered',
        'rack mount', 'portable', 'stage ready'
    ]

    def extract_taxonomy(self, product: Dict[str, Any]) -> ProductTaxonomy:
        """Extract comprehensive taxonomy from product data."""
        name = product.get('name', '').lower()
        brand = product.get('brand', '').lower()
        description = product.get('description', '').lower()

        taxonomy = ProductTaxonomy()

        # Extract category
        taxonomy.category = self._extract_category(name, description)

        # Extract product family
        taxonomy.product_family = self._extract_family(name, brand)

        # Extract series
        taxonomy.series = self._extract_series(name)

        # Extract variant
        taxonomy.variant = self._extract_variant(name)

        # Extract features
        taxonomy.key_features = self._extract_features(name, description)

        return taxonomy

    def _extract_category(self, name: str, description: str) -> Optional[str]:
        """Identify product category."""
        text = f"{name} {description}".lower()

        for category, keywords in self.CATEGORIES.items():
            for keyword in keywords:
                if keyword in text:
                    return category

        return 'other'

    def _extract_family(self, name: str, brand: str) -> Optional[str]:
        """Extract product family (e.g., 'Nord Stage', 'Roland Jupiter')."""
        # Remove brand name
        name_clean = name.replace(brand, '').strip()

        # Extract base product line (first 1-2 words before numbers/variants)
        match = re.match(r'^([a-z]+(?:\s+[a-z]+)?)', name_clean)
        if match:
            family = match.group(1).strip()
            return f"{brand} {family}".strip()

        return None

    def _extract_series(self, name: str) -> Optional[str]:
        """Extract series/generation (e.g., 'Stage 4', 'Electro 6')."""
        # Look for product name + number pattern
        match = re.search(r'([a-z]+\s+\d+[a-z]*)', name.lower())
        if match:
            return match.group(1).strip()

        return None

    def _extract_variant(self, name: str) -> Optional[str]:
        """Extract variant information."""
        variants = []

        for pattern in self.VARIANT_PATTERNS:
            matches = re.findall(pattern, name.lower())
            if matches:
                variants.extend(matches)

        return ', '.join(variants) if variants else None

    def _extract_features(self, name: str, description: str) -> List[str]:
        """Extract key features from text."""
        text = f"{name} {description}".lower()
        found_features = []

        for feature in self.FEATURES:
            if feature in text:
                found_features.append(feature)

        return found_features[:10]  # Limit to top 10

    def build_ecosystem(self, product: Dict[str, Any], all_products: List[Dict[str, Any]]) -> ProductEcosystem:
        """Build ecosystem relationships for a product."""
        ecosystem = ProductEcosystem()

        name = product.get('name', '').lower()
        brand = product.get('brand', '').lower()
        taxonomy = self.extract_taxonomy(product)

        # Find compatible accessories (same brand, 'accessories' category)
        for other in all_products:
            if other.get('brand', '').lower() == brand:
                other_tax = self.extract_taxonomy(other)
                if other_tax.category == 'accessories':
                    # Check if accessory name mentions this product
                    if taxonomy.product_family and taxonomy.product_family.lower() in other.get('name', '').lower():
                        ecosystem.compatible_accessories.append(
                            other.get('name', ''))

        # Find products in same family
        if taxonomy.product_family:
            ecosystem.part_of_family = taxonomy.product_family

            for other in all_products:
                other_tax = self.extract_taxonomy(other)
                if (other_tax.product_family == taxonomy.product_family and
                        other.get('name') != product.get('name')):
                    ecosystem.compatible_with.append(other.get('name', ''))

        # Detect common formats
        name_desc = f"{name} {product.get('description', '')}".lower()
        if 'midi' in name_desc:
            ecosystem.compatible_formats.append('MIDI')
        if 'usb' in name_desc:
            ecosystem.compatible_formats.append('USB')
        if any(x in name_desc for x in ['vst', 'au', 'plugin']):
            ecosystem.compatible_formats.extend(['VST', 'AU'])

        return ecosystem


class EcosystemEnhancer:
    """Enhances product catalogs with ecosystem intelligence."""

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            backend_dir = Path(__file__).resolve().parents[1]
            data_dir = backend_dir / "data"

        self.data_dir = Path(data_dir)
        self.unified_dir = self.data_dir / "catalogs_unified"
        self.extractor = TaxonomyExtractor()

    def enhance_brand_catalog(self, brand_id: str):
        """Add ecosystem intelligence to a brand catalog."""
        logger.info(f"🧠 Enhancing ecosystem data for: {brand_id}")

        catalog_path = self.unified_dir / f"{brand_id}_catalog.json"
        if not catalog_path.exists():
            logger.warning(f"⚠️  Catalog not found: {catalog_path}")
            return

        with open(catalog_path) as f:
            catalog = json.load(f)

        products = catalog.get('products', [])
        enhanced_products = []

        for product in products:
            # Extract taxonomy
            taxonomy = self.extractor.extract_taxonomy(product)
            product['taxonomy'] = asdict(taxonomy)

            # Build ecosystem
            ecosystem = self.extractor.build_ecosystem(product, products)
            product['ecosystem'] = asdict(ecosystem)

            enhanced_products.append(product)

            logger.info(f"  ✅ {product.get('name')}")
            logger.info(f"     Category: {taxonomy.category}")
            logger.info(f"     Family: {taxonomy.product_family}")
            if taxonomy.variant:
                logger.info(f"     Variant: {taxonomy.variant}")

        # Update catalog
        catalog['products'] = enhanced_products
        catalog['enhanced'] = True
        catalog['enhancement_timestamp'] = datetime.now().isoformat()

        with open(catalog_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        logger.info(f"💾 Enhanced catalog saved: {catalog_path}")

    def enhance_all_catalogs(self):
        """Enhance all brand catalogs."""
        logger.info("🚀 Enhancing all catalogs with ecosystem intelligence")

        for catalog_file in self.unified_dir.glob("*_catalog.json"):
            brand_id = catalog_file.stem.replace('_catalog', '')
            try:
                self.enhance_brand_catalog(brand_id)
            except Exception as e:
                logger.error(f"❌ Failed to enhance {brand_id}: {e}")


if __name__ == "__main__":
    import argparse
    from datetime import datetime

    parser = argparse.ArgumentParser(
        description='Ecosystem Taxonomy Extractor v3.5')
    parser.add_argument('--brand', type=str, help='Single brand to enhance')
    parser.add_argument('--all', action='store_true',
                        help='Enhance all brands')

    args = parser.parse_args()

    enhancer = EcosystemEnhancer()

    if args.all:
        enhancer.enhance_all_catalogs()
    elif args.brand:
        enhancer.enhance_brand_catalog(args.brand)
    else:
        print("Usage: python ecosystem_taxonomy.py --brand=nord  OR  --all")
