#!/usr/bin/env python3
"""
HSC JIT v3.6 - Static Catalog Builder
=====================================

Single command to build entire catalog:
    python build.py --brand=all --download-pdfs

This script pre-computes everything offline and generates static JSON files
for instant frontend loading. No runtime API needed.

Architecture Philosophy:
- Read brand configs once
- Scrape & validate brand websites
- Match with Halilit catalog (fuzzy 85%)
- Download PDFs to frontend/public/manuals/
- Generate frontend/public/data/{brand}.json
- Create searchable index.json

Output: Deployable static files ready for Netlify/Vercel
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from core.cleaner import DataCleaner
from core.matcher import HalilitMatcher

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CatalogBuilder:
    """Orchestrates the static catalog build process"""
    
    def __init__(self, output_dir: Path = None):
        self.backend_dir = Path(__file__).parent
        self.data_dir = self.backend_dir / "data"
        self.brands_dir = self.data_dir / "catalogs_brand"
        self.halilit_dir = self.data_dir / "catalogs_halilit"
        self.output_dir = output_dir or (self.backend_dir.parent / "frontend" / "public" / "data")
        self.manuals_dir = self.backend_dir.parent / "frontend" / "public" / "manuals"
        
        self.cleaner = DataCleaner()
        self.matcher = HalilitMatcher()
        
        # Create output directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.manuals_dir.mkdir(parents=True, exist_ok=True)
    
    def get_available_brands(self) -> List[str]:
        """Get list of brands with existing catalog data"""
        brands = []
        for file in self.brands_dir.glob("*_brand.json"):
            brand_id = file.stem.replace("_brand", "")
            brands.append(brand_id)
        return sorted(brands)
    
    def load_brand_catalog(self, brand_id: str) -> Optional[Dict]:
        """Load brand catalog from data directory"""
        brand_file = self.brands_dir / f"{brand_id}_brand.json"
        
        if not brand_file.exists():
            logger.error(f"Brand catalog not found: {brand_file}")
            return None
        
        try:
            with open(brand_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load {brand_id}: {e}")
            return None
    
    def load_halilit_catalog(self, brand_id: str = None) -> Dict:
        """
        Load Halilit catalog for matching
        
        Args:
            brand_id: Optional brand ID to load specific brand catalog
            
        Returns:
            Halilit catalog data
        """
        if brand_id:
            # Try brand-specific Halilit catalog first
            brand_halilit_file = self.halilit_dir / f"{brand_id}_halilit.json"
            
            if brand_halilit_file.exists():
                try:
                    with open(brand_halilit_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        logger.debug(f"Loaded brand-specific Halilit catalog: {brand_halilit_file}")
                        return data
                except Exception as e:
                    logger.warning(f"Failed to load {brand_halilit_file}: {e}")
        
        # Fallback to main catalog
        halilit_file = self.data_dir / "halilit_official_brands.json"
        
        if not halilit_file.exists():
            logger.warning(f"Halilit catalog not found: {halilit_file}")
            return {}
        
        try:
            with open(halilit_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load Halilit catalog: {e}")
            return {}
    
    def build_brand(self, brand_id: str, download_pdfs: bool = False) -> Dict:
        """
        Build static catalog for a single brand
        
        Returns:
            dict: Build statistics and metadata
        """
        logger.info(f"Building catalog for: {brand_id}")
        
        # Load brand data
        brand_data = self.load_brand_catalog(brand_id)
        if not brand_data:
            return {"brand": brand_id, "status": "failed", "error": "Failed to load catalog"}
        
        original_count = len(brand_data.get("products", []))
        logger.info(f"Loaded {original_count} products")
        
        # Step 1: Clean and deduplicate
        logger.info("Step 1/4: Cleaning and deduplicating...")
        cleaned_products = self.cleaner.deduplicate(brand_data.get("products", []))
        validated_products = [
            p for p in cleaned_products 
            if self.cleaner.validate_required_fields(p)
        ]
        logger.info(f"After cleaning: {len(validated_products)} unique valid products")
        
        # Step 2: Match with Halilit
        logger.info("Step 2/4: Matching with Halilit catalog...")
        halilit_data = self.load_halilit_catalog(brand_id)
        enriched_products = []
        
        for product in validated_products:
            enriched = self.matcher.match_and_enrich(product, halilit_data)
            enriched_products.append(enriched)
        
        matched_count = sum(1 for p in enriched_products if p.get("verified"))
        logger.info(f"Matched {matched_count}/{len(enriched_products)} with Halilit")
        
        # Step 3: Download PDFs (optional)
        if download_pdfs:
            logger.info("Step 3/4: Downloading PDF manuals...")
            # TODO: Implement PDF hunting
            logger.info("PDF download not yet implemented")
        else:
            logger.info("Step 3/4: Skipping PDF download")
        
        # Step 4: Generate output JSON
        logger.info("Step 4/4: Generating output JSON...")
        output_data = {
            "brand_id": brand_id,
            "brand_name": brand_data.get("brand_name", brand_id.title()),
            "source": "v3.6_static_build",
            "build_timestamp": self._get_timestamp(),
            "stats": {
                "total_products": len(enriched_products),
                "verified_products": matched_count,
                "verification_rate": round(matched_count / len(enriched_products) * 100, 2) if enriched_products else 0,
                "original_count": original_count,
                "removed_duplicates": original_count - len(validated_products)
            },
            "products": enriched_products
        }
        
        # Write to output directory
        output_file = self.output_dir / f"{brand_id}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ Wrote {output_file}")
        
        return output_data["stats"]
    
    def build_all(self, download_pdfs: bool = False) -> Dict:
        """Build catalogs for all available brands"""
        brands = self.get_available_brands()
        logger.info(f"Building {len(brands)} brand catalogs...")
        
        results = {}
        for brand_id in brands:
            try:
                stats = self.build_brand(brand_id, download_pdfs)
                results[brand_id] = stats
            except Exception as e:
                logger.error(f"Failed to build {brand_id}: {e}")
                results[brand_id] = {"status": "failed", "error": str(e)}
        
        # Generate master index
        self._generate_index(results)
        
        return results
    
    def _generate_index(self, build_results: Dict):
        """Generate master index.json for frontend search"""
        logger.info("Generating master index...")
        
        index_data = {
            "build_timestamp": self._get_timestamp(),
            "version": "3.6",
            "brands": [],
            "total_products": 0,
            "total_verified": 0
        }
        
        # Aggregate all brand data
        for brand_id, stats in build_results.items():
            if isinstance(stats, dict) and "total_products" in stats:
                index_data["brands"].append({
                    "id": brand_id,
                    "name": brand_id.replace("-", " ").title(),
                    "product_count": stats["total_products"],
                    "verified_count": stats.get("verified_products", 0),
                    "data_file": f"{brand_id}.json"
                })
                index_data["total_products"] += stats["total_products"]
                index_data["total_verified"] += stats.get("verified_products", 0)
        
        # Write index
        index_file = self.output_dir / "index.json"
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ Wrote {index_file}")
        logger.info(f"📊 Total: {index_data['total_products']} products across {len(index_data['brands'])} brands")
    
    def _get_timestamp(self) -> str:
        """Get ISO timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"


def main():
    parser = argparse.ArgumentParser(
        description="HSC JIT v3.6 Static Catalog Builder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python build.py --brand=nord                    # Build Nord only
  python build.py --brand=all                     # Build all brands
  python build.py --brand=moog --download-pdfs    # Build Moog with PDFs
  python build.py --list                          # List available brands
        """
    )
    
    parser.add_argument(
        "--brand",
        type=str,
        default="all",
        help="Brand to build (use 'all' for all brands)"
    )
    
    parser.add_argument(
        "--download-pdfs",
        action="store_true",
        help="Download PDF manuals (slower)"
    )
    
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available brands and exit"
    )
    
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Custom output directory (default: frontend/public/data)"
    )
    
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate output after building"
    )
    
    args = parser.parse_args()
    
    # Initialize builder
    builder = CatalogBuilder(output_dir=args.output_dir)
    
    # List brands and exit
    if args.list:
        brands = builder.get_available_brands()
        print(f"\n📦 Available brands ({len(brands)}):\n")
        for brand in brands:
            print(f"  - {brand}")
        print()
        return
    
    # Build catalogs
    if args.brand == "all":
        results = builder.build_all(download_pdfs=args.download_pdfs)
        
        # Print summary
        print("\n" + "="*60)
        print("BUILD SUMMARY")
        print("="*60)
        
        for brand_id, stats in results.items():
            if isinstance(stats, dict) and "total_products" in stats:
                status = "✅" if stats["total_products"] > 0 else "⚠️"
                print(f"{status} {brand_id:30} {stats['total_products']:4} products ({stats['verified_products']} verified)")
        
        print("="*60)
        
    else:
        # Build single brand
        stats = builder.build_brand(args.brand, download_pdfs=args.download_pdfs)
        print(f"\n✅ Built {args.brand}: {stats}")
    
    # Validation
    if args.validate:
        logger.info("Running validation...")
        # TODO: Add validation logic


if __name__ == "__main__":
    main()
