#!/usr/bin/env python3
"""
ECOSYSTEM INTELLIGENCE ORCHESTRATOR v3.5
Automated workflow for continuous product ecosystem updates

Features:
- Multi-strategy scraping (single-page, multi-page, API)
- Intelligent brand-first merging
- Ecosystem graph building
- Change detection and alerting
- Automated scheduling support

Usage:
    python ecosystem_orchestrator.py --mode=full      # Full scrape all brands
    python ecosystem_orchestrator.py --mode=quick     # Quick pricing updates
    python ecosystem_orchestrator.py --brand=nord     # Single brand update
"""

import asyncio
import argparse
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
from difflib import SequenceMatcher
from urllib.parse import quote_plus

# Import existing scrapers
import sys
sys.path.insert(0, str(Path(__file__).parent))

from brand_website_scraper import BrandWebsiteScraper
from halilit_scraper import HalilitScraper

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EcosystemOrchestrator:
    """Orchestrates the complete ecosystem intelligence pipeline."""

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is None:
            backend_dir = Path(__file__).resolve().parents[1]
            data_dir = backend_dir / "data"

        self.data_dir = Path(data_dir)
        self.brands_dir = self.data_dir / "brands"
        self.brand_catalogs_dir = self.data_dir / "catalogs_brand"
        self.halilit_catalogs_dir = self.data_dir / "catalogs_halilit"
        self.unified_catalogs_dir = self.data_dir / "catalogs_unified"
        
        # Ensure directories exist
        self.unified_catalogs_dir.mkdir(parents=True, exist_ok=True)
        
        self.brand_scraper = BrandWebsiteScraper(data_dir=self.data_dir)
        self.halilit_scraper = HalilitScraper()

        # Known Halilit display names when metadata is missing
        self.halilit_brand_names: Dict[str, str] = {
            "akai-professional": "Akai Professional",
            "boss": "BOSS",
            "roland": "Roland",
            "nord": "Nord",
            "pearl": "Pearl",
            "mackie": "Mackie",
            "remo": "Remo",
            "paiste": "Paiste",
        }

    def get_all_brands(self) -> List[str]:
        """Get list of all configured brands."""
        brands = []
        if self.brands_dir.exists():
            for brand_path in self.brands_dir.iterdir():
                if brand_path.is_dir():
                    config_file = brand_path / "scrape_config.json"
                    if config_file.exists():
                        brands.append(brand_path.name)
        return sorted(brands)

    async def scrape_brand_website(self, brand_id: str) -> Dict[str, Any]:
        """Scrape a single brand website."""
        logger.info(f"🔍 Scraping brand website: {brand_id}")
        
        # Load brand config
        config_path = self.brands_dir / brand_id / "scrape_config.json"
        if not config_path.exists():
            logger.warning(f"⚠️  No config found for {brand_id}")
            return {"brand_id": brand_id, "status": "skipped", "total_products": 0}

        with open(config_path) as f:
            config = json.load(f)

        base_url = config.get("base_url")
        if not base_url:
            logger.warning(f"⚠️  No base_url in config for {brand_id}")
            return {"brand_id": brand_id, "status": "skipped", "total_products": 0}

        # Scrape with config
        result = await self.brand_scraper.scrape_brand(
            brand_id=brand_id,
            start_url=base_url,
            max_products=200,
            config=config
        )

        return result

    async def scrape_halilit_catalog(self, brand_id: str) -> Dict[str, Any]:
        """Scrape Halilit distributor for a brand."""
        logger.info(f"📦 Scraping Halilit catalog: {brand_id}")
        
        # Build Halilit brand name from metadata
        metadata_path = self.brands_dir / "brands_metadata.json"
        halilit_brand_name = None

        if metadata_path.exists():
            with open(metadata_path) as f:
                metadata = json.load(f)
                if brand_id in metadata:
                    halilit_brand_name = metadata[brand_id].get("name")

        if not halilit_brand_name:
            halilit_brand_name = self.halilit_brand_names.get(
                brand_id,
                brand_id.replace("-", " ").title()
            )

        # Construct Halilit search URL with proper encoding
        # Note: Halilit uses ?q= for text search, not ?brand=
        encoded_name = quote_plus(halilit_brand_name)
        brand_url = f"https://www.halilit.com/search?q={encoded_name}"

        try:
            result = await self.halilit_scraper.scrape_brand(brand_id, brand_url)

            # Persist Halilit catalog for downstream merge
            output_path = self.halilit_catalogs_dir / f"{brand_id}_halilit.json"
            payload = {
                **result,
                "timestamp": datetime.now().isoformat(),
                "status": "success" if result.get("total_products", 0) else "partial"
            }
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)

            logger.info(
                f"  💾 Halilit saved: {result.get('total_products', 0)} products -> {output_path}"
            )
            return payload
        except Exception as e:
            logger.error(f"❌ Halilit scrape failed for {brand_id}: {e}")
            return {"brand_id": brand_id, "status": "failed", "total_products": 0}

    def merge_catalogs(self, brand_id: str) -> Dict[str, Any]:
        """Merge brand and Halilit catalogs with ecosystem intelligence."""
        logger.info(f"🔗 Merging catalogs for: {brand_id}")
        
        # Load brand catalog
        brand_path = self.brand_catalogs_dir / f"{brand_id}_brand.json"
        halilit_path = self.halilit_catalogs_dir / f"{brand_id}_halilit.json"
        
        brand_data = {"products": [], "total_products": 0}
        halilit_data = {"products": [], "total_products": 0}
        
        if brand_path.exists():
            with open(brand_path) as f:
                brand_data = json.load(f)
        
        if halilit_path.exists():
            with open(halilit_path) as f:
                halilit_data = json.load(f)

        # Intelligent matching with 85% threshold
        matched_halilit_ids = set()
        unified_products = []

        for brand_prod in brand_data.get("products", []):
            best_match = None
            best_score = 0.0
            
            for hal_prod in halilit_data.get("products", []):
                score = self._similarity(brand_prod.get("name", ""), hal_prod.get("name", ""))
                if score > best_score:
                    best_score = score
                    best_match = hal_prod
            
            if best_match and best_score >= 0.85:
                # PRIMARY: Brand content + Halilit pricing
                merged = {**brand_prod, **best_match}
                merged['source'] = 'PRIMARY'
                merged['match_score'] = round(best_score, 2)
                merged['last_updated'] = datetime.now().isoformat()
                unified_products.append(merged)
                matched_halilit_ids.add(id(best_match))
                logger.info(f"  ✅ PRIMARY: {brand_prod.get('name')} ({best_score:.2f})")
            else:
                # SECONDARY: Brand-only (no pricing yet)
                brand_prod['source'] = 'SECONDARY'
                brand_prod['last_updated'] = datetime.now().isoformat()
                unified_products.append(brand_prod)
                logger.info(f"  🔵 SECONDARY: {brand_prod.get('name')}")

        # Add unmatched Halilit products (accessories, legacy)
        for hal_prod in halilit_data.get("products", []):
            if id(hal_prod) not in matched_halilit_ids:
                hal_prod['source'] = 'HALILIT_ONLY'
                hal_prod['last_updated'] = datetime.now().isoformat()
                unified_products.append(hal_prod)

        # Save unified catalog
        unified = {
            'brand_id': brand_id,
            'source': 'unified',
            'total_products': len(unified_products),
            'products': unified_products,
            'timestamp': datetime.now().isoformat(),
            'status': 'success',
            'statistics': {
                'primary': len([p for p in unified_products if p.get('source') == 'PRIMARY']),
                'secondary': len([p for p in unified_products if p.get('source') == 'SECONDARY']),
                'halilit_only': len([p for p in unified_products if p.get('source') == 'HALILIT_ONLY'])
            }
        }

        output_path = self.unified_catalogs_dir / f"{brand_id}_catalog.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(unified, f, indent=2, ensure_ascii=False)

        logger.info(f"  💾 Saved: {len(unified_products)} unified products")
        logger.info(f"    PRIMARY: {unified['statistics']['primary']}")
        logger.info(f"    SECONDARY: {unified['statistics']['secondary']}")
        logger.info(f"    HALILIT_ONLY: {unified['statistics']['halilit_only']}")

        return unified

    def _similarity(self, a: str, b: str) -> float:
        """Calculate string similarity for product matching."""
        import re
        
        def normalize(text):
            # Remove Hebrew characters (non-ASCII)
            text = re.sub(r'[^\x00-\x7F]+', ' ', text)
            # Remove extra punctuation and normalize spaces
            text = text.lower().replace('-', ' ').replace('_', ' ')
            text = re.sub(r'[^\w\s]', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        
        return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

    async def run_full_sync(self, brands: Optional[List[str]] = None):
        """Run complete ecosystem sync for specified brands."""
        if brands is None:
            brands = self.get_all_brands()

        logger.info(f"🚀 Starting Full Ecosystem Sync for {len(brands)} brands")
        logger.info(f"   Brands: {', '.join(brands)}")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'mode': 'full',
            'brands': {}
        }

        for brand_id in brands:
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing: {brand_id.upper()}")
            logger.info(f"{'='*60}")
            
            try:
                # Step 1: Scrape brand website
                brand_result = await self.scrape_brand_website(brand_id)
                
                # Step 2: Scrape Halilit (if needed)
                halilit_result = await self.scrape_halilit_catalog(brand_id)
                
                # Step 3: Merge with intelligence
                unified_result = self.merge_catalogs(brand_id)
                
                results['brands'][brand_id] = {
                    'brand_products': brand_result.get('total_products', 0),
                    'halilit_products': halilit_result.get('total_products', 0),
                    'unified_products': unified_result.get('total_products', 0),
                    'statistics': unified_result.get('statistics', {}),
                    'status': 'success'
                }
                
            except Exception as e:
                logger.error(f"❌ Failed to process {brand_id}: {e}")
                results['brands'][brand_id] = {
                    'status': 'failed',
                    'error': str(e)
                }

        # Save orchestration report
        report_path = self.data_dir / "ecosystem_sync_report.json"
        with open(report_path, 'w') as f:
            json.dump(results, f, indent=2)

        logger.info(f"\n{'='*60}")
        logger.info(f"✅ ECOSYSTEM SYNC COMPLETE")
        logger.info(f"{'='*60}")
        logger.info(f"Report saved: {report_path}")
        
        return results

    async def run_quick_sync(self, brands: Optional[List[str]] = None):
        """Quick sync for pricing/stock updates only."""
        if brands is None:
            brands = self.get_all_brands()

        logger.info(f"⚡ Quick Sync: {len(brands)} brands (Halilit only)")
        
        for brand_id in brands:
            try:
                # Only update Halilit (pricing/stock changes faster)
                await self.scrape_halilit_catalog(brand_id)
                self.merge_catalogs(brand_id)
                logger.info(f"  ✅ {brand_id}")
            except Exception as e:
                logger.error(f"  ❌ {brand_id}: {e}")


async def main():
    parser = argparse.ArgumentParser(description='Ecosystem Intelligence Orchestrator v3.5')
    parser.add_argument('--mode', choices=['full', 'quick'], default='full',
                        help='Sync mode: full (brand+halilit) or quick (halilit only)')
    parser.add_argument('--brand', type=str, help='Single brand to process')
    parser.add_argument('--brands', nargs='+', help='Multiple brands to process')
    
    args = parser.parse_args()
    
    orchestrator = EcosystemOrchestrator()
    
    brands = None
    if args.brand:
        brands = [args.brand]
    elif args.brands:
        brands = args.brands
    
    if args.mode == 'full':
        await orchestrator.run_full_sync(brands)
    else:
        await orchestrator.run_quick_sync(brands)


if __name__ == "__main__":
    asyncio.run(main())
