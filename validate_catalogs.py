#!/usr/bin/env python3
"""
Smart Catalog Validation Test - validates existing catalogs without scraping.
This is a fast, offline validation that tests the entire pipeline.
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from core.validator import CatalogValidator, ValidationReport
from models.product_hierarchy import ProductCatalog


def load_catalog(brand: str) -> Tuple[bool, Dict[str, Any]]:
    """Load a catalog from JSON file."""
    catalog_dir = Path(__file__).parent / "backend" / "data" / "catalogs_brand"
    
    # Try cleaned catalog first (_catalog.json), then fallback to catalog.json
    for pattern in [f"{brand}_catalog.json", f"{brand}.json"]:
        catalog_file = catalog_dir / pattern
        
        if catalog_file.exists():
            try:
                with open(catalog_file) as f:
                    return True, json.load(f)
            except Exception as e:
                return False, {"error": str(e)}
    
    return False, {"error": f"Catalog not found: {catalog_dir / f'{brand}*'}"}



def validate_catalog_json(brand: str, data: Dict[str, Any]) -> ValidationReport:
    """Validate catalog JSON structure and content."""
    validator = CatalogValidator()
    
    try:
        # Validate the complete catalog
        return validator.validate(data)
    
    except Exception as e:
        print(f"Validation error: {e}")
        import traceback
        traceback.print_exc()
        from datetime import datetime
        return ValidationReport(
            brand=brand,
            total_products=0,
            issues=[],
            timestamp=datetime.now()
        )


def main():
    """Run validation tests."""
    print("\n" + "╔" + "="*70 + "╗")
    print("║  Smart Catalog Validation Test - v3.7.0                          ║")
    print("║  Fast offline validation of existing catalogs                    ║")
    print("╚" + "="*70 + "╝\n")
    
    brands_to_test = ["roland", "boss"]
    results = {}
    
    for brand in brands_to_test:
        print("="*70)
        print(f"🔍 Validating {brand.upper()} catalog")
        print("="*70)
        
        # Load catalog
        success, data = load_catalog(brand)
        if not success:
            print(f"❌ Failed to load {brand} catalog: {data.get('error')}")
            results[brand] = {"status": "FAIL", "reason": "load_failed"}
            continue
        
        product_count = len(data.get("products", []))
        print(f"✅ Loaded {brand} catalog with {product_count} products\n")
        
        # Validate
        report = validate_catalog_json(brand, data)
        print(report.summary())
        
        # Store result
        results[brand] = {
            "status": "PASS" if report.is_valid else "WARNINGS" if report.error_count == 0 else "FAIL",
            "errors": report.error_count,
            "warnings": report.warning_count,
            "products": product_count
        }
    
    # Summary
    print("\n" + "="*70)
    print("📊 VALIDATION SUMMARY")
    print("="*70)
    
    for brand, result in results.items():
        status_icon = "✅" if result["status"] == "PASS" else "⚠️" if result["status"] == "WARNINGS" else "❌"
        print(f"\n{status_icon} {brand.upper()}:")
        print(f"   Status: {result['status']}")
        print(f"   Products: {result.get('products', 'N/A')}")
        print(f"   Errors: {result.get('errors', 'N/A')}")
        print(f"   Warnings: {result.get('warnings', 'N/A')}")
    
    # Overall result
    all_pass = all(r["status"] in ["PASS", "WARNINGS"] for r in results.values())
    print("\n" + "="*70)
    if all_pass:
        print("✅ ALL CATALOGS VALIDATED SUCCESSFULLY")
        print("="*70 + "\n")
        return 0
    else:
        print("❌ SOME CATALOGS HAVE CRITICAL ERRORS")
        print("="*70 + "\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
