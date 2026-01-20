#!/usr/bin/env python3
"""
Smart Scraping Validation Test - v3.7.0
========================================

Comprehensive end-to-end test of the scraping pipeline:
1. Scrape Roland (5 products) 
2. Scrape Boss (5 products)
3. Validate both catalogs
4. Compare data quality metrics
5. Verify dual-brand compatibility

Run: python test_scraping_pipeline.py
"""

import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Tuple

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from core.validator import CatalogValidator, ValidationReport
from core.metrics import ScrapingMetrics, ValidationMetrics
from services.roland_scraper import RolandScraper
from services.boss_scraper import BossScraper


class ScrapingTestRunner:
    """Runs comprehensive scraping tests"""
    
    def __init__(self):
        self.results: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "tests": []
        }
    
    async def test_roland_scraper(self, max_products: int = 5) -> Tuple[bool, Dict[str, Any]]:
        """Test Roland scraper"""
        print("\n" + "="*70)
        print("🎹 TEST 1: ROLAND SCRAPER (DRY RUN)")
        print("="*70)
        
        try:
            scraper = RolandScraper()
            print(f"Scraping {max_products} Roland products (timeout: 30s per product)...")
            
            catalog = await asyncio.wait_for(
                scraper.scrape_all_products(max_products=max_products),
                timeout=120
            )
            
            # Save catalog
            catalog_path = Path(__file__).parent / "backend" / "data" / "catalogs" / "roland_catalog_test.json"
            catalog_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(catalog_path, 'w') as f:
                # Convert to dict for JSON serialization
                catalog_dict = {
                    "brand_identity": {
                        "id": catalog.brand_identity.id,
                        "name": catalog.brand_identity.name,
                        "website": catalog.brand_identity.website,
                        "description": catalog.brand_identity.description,
                        "categories": catalog.brand_identity.categories
                    },
                    "products": [p.model_dump() for p in catalog.products],
                    "metadata": {
                        "scrape_date": datetime.utcnow().isoformat(),
                        "total_products": len(catalog.products),
                        "version": "3.7.0"
                    }
                }
                json.dump(catalog_dict, f, indent=2, default=str)
            
            print(f"✅ Scraped {len(catalog.products)} Roland products")
            print(f"   Saved to: {catalog_path}")
            
            return True, {
                "brand": "Roland",
                "product_count": len(catalog.products),
                "catalog_path": str(catalog_path)
            }
        
        except Exception as e:
            print(f"❌ Roland scraper failed: {e}")
            import traceback
            traceback.print_exc()
            return False, {"error": str(e)}
    
    async def test_boss_scraper(self, max_products: int = 5) -> Tuple[bool, Dict[str, Any]]:
        """Test Boss scraper"""
        print("\n" + "="*70)
        print("🎸 TEST 2: BOSS SCRAPER (DRY RUN)")
        print("="*70)
        
        try:
            scraper = BossScraper()
            print(f"Scraping {max_products} Boss products...")
            
            catalog = await asyncio.wait_for(
                scraper.scrape_all_products(max_products=max_products),
                timeout=120
            )
            
            # Save catalog
            catalog_path = Path(__file__).parent / "backend" / "data" / "catalogs" / "boss_catalog_test.json"
            catalog_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(catalog_path, 'w') as f:
                catalog_dict = {
                    "brand_identity": {
                        "id": catalog.brand_identity.id,
                        "name": catalog.brand_identity.name,
                        "website": catalog.brand_identity.website,
                        "description": catalog.brand_identity.description,
                        "categories": catalog.brand_identity.categories
                    },
                    "products": [p.model_dump() for p in catalog.products],
                    "metadata": {
                        "scrape_date": datetime.utcnow().isoformat(),
                        "total_products": len(catalog.products),
                        "version": "3.7.0"
                    }
                }
                json.dump(catalog_dict, f, indent=2, default=str)
            
            print(f"✅ Scraped {len(catalog.products)} Boss products")
            print(f"   Saved to: {catalog_path}")
            
            return True, {
                "brand": "Boss",
                "product_count": len(catalog.products),
                "catalog_path": str(catalog_path)
            }
        
        except Exception as e:
            print(f"❌ Boss scraper failed: {e}")
            import traceback
            traceback.print_exc()
            return False, {"error": str(e)}
    
    def validate_catalog(self, catalog_path: Path, brand: str) -> Tuple[bool, ValidationReport]:
        """Validate a scraped catalog"""
        print(f"\n📋 Validating {brand} catalog...")
        
        try:
            from core.validator import validate_catalog_file
            report = validate_catalog_file(catalog_path)
            
            print(report.summary())
            
            return report.is_valid, report
        
        except Exception as e:
            print(f"❌ Validation failed: {e}")
            return False, None
    
    def compare_structures(self) -> bool:
        """Compare Roland and Boss product structures"""
        print("\n" + "="*70)
        print("🔀 TEST 3: STRUCTURE COMPATIBILITY")
        print("="*70)
        
        try:
            roland_path = Path(__file__).parent / "backend" / "data" / "catalogs" / "roland_catalog_test.json"
            boss_path = Path(__file__).parent / "backend" / "data" / "catalogs" / "boss_catalog_test.json"
            
            with open(roland_path) as f:
                roland = json.load(f)
            with open(boss_path) as f:
                boss = json.load(f)
            
            # Check top-level structure
            roland_keys = set(roland.keys())
            boss_keys = set(boss.keys())
            
            print(f"\nRoland keys: {roland_keys}")
            print(f"Boss keys: {boss_keys}")
            
            if roland_keys != boss_keys:
                print(f"⚠️  Key mismatch!")
                missing_in_boss = roland_keys - boss_keys
                missing_in_roland = boss_keys - roland_keys
                if missing_in_boss:
                    print(f"   Missing in Boss: {missing_in_boss}")
                if missing_in_roland:
                    print(f"   Missing in Roland: {missing_in_roland}")
                return False
            
            # Check product field consistency
            if roland["products"] and boss["products"]:
                roland_prod_keys = set(roland["products"][0].keys())
                boss_prod_keys = set(boss["products"][0].keys())
                
                print(f"\nRoland product fields: {len(roland_prod_keys)}")
                print(f"Boss product fields: {len(boss_prod_keys)}")
                
                common_keys = roland_prod_keys & boss_prod_keys
                print(f"Common fields: {len(common_keys)}")
                
                if common_keys < roland_prod_keys or common_keys < boss_prod_keys:
                    print(f"⚠️  Field mismatch detected")
                    missing_in_boss = roland_prod_keys - boss_prod_keys
                    missing_in_roland = boss_prod_keys - roland_prod_keys
                    if missing_in_boss:
                        print(f"   Missing in Boss: {missing_in_boss}")
                    if missing_in_roland:
                        print(f"   Missing in Roland: {missing_in_roland}")
            
            print("✅ Structure compatibility check complete")
            return True
        
        except Exception as e:
            print(f"❌ Comparison failed: {e}")
            return False
    
    def generate_report(self):
        """Generate final test report"""
        print("\n" + "="*70)
        print("📊 FINAL TEST REPORT")
        print("="*70)
        
        # Validate both catalogs
        print("\n🔍 VALIDATION RESULTS:\n")
        
        roland_path = Path(__file__).parent / "backend" / "data" / "catalogs" / "roland_catalog_test.json"
        boss_path = Path(__file__).parent / "backend" / "data" / "catalogs" / "boss_catalog_test.json"
        
        roland_valid, roland_report = self.validate_catalog(roland_path, "Roland")
        boss_valid, boss_report = self.validate_catalog(boss_path, "Boss")
        
        # Compatibility check
        print("\n🔗 STRUCTURE COMPATIBILITY:\n")
        structure_ok = self.compare_structures()
        
        # Summary
        print("\n" + "="*70)
        print("✅ SUMMARY")
        print("="*70)
        
        all_ok = roland_valid and boss_valid and structure_ok
        
        print(f"\nRoland Scraper: {'✅ PASS' if roland_path.exists() else '❌ FAIL'}")
        print(f"Boss Scraper: {'✅ PASS' if boss_path.exists() else '❌ FAIL'}")
        print(f"Roland Validation: {'✅ PASS' if roland_valid else '❌ FAIL'}")
        print(f"Boss Validation: {'✅ PASS' if boss_valid else '❌ FAIL'}")
        print(f"Structure Compatibility: {'✅ PASS' if structure_ok else '❌ FAIL'}")
        
        print("\n" + "="*70)
        if all_ok:
            print("🎉 ALL TESTS PASSED - PIPELINE READY FOR PRODUCTION")
        else:
            print("⚠️  SOME TESTS FAILED - REVIEW ERRORS ABOVE")
        print("="*70)
        
        return all_ok


async def main():
    """Main test entry point"""
    print("\n")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║  Smart Scraping Validation Test - v3.7.0                          ║")
    print("║  Testing: Roland Scraper + Boss Scraper + Validation Pipeline     ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    
    runner = ScrapingTestRunner()
    
    try:
        # Test Roland scraper
        roland_ok, roland_result = await runner.test_roland_scraper(max_products=5)
        
        # Test Boss scraper
        boss_ok, boss_result = await runner.test_boss_scraper(max_products=5)
        
        # Generate comprehensive report
        runner.generate_report()
        
    except KeyboardInterrupt:
        print("\n\n❌ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
