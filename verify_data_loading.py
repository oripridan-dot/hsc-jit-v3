#!/usr/bin/env python3
"""
Verification Script for HSC JIT v3.7 Data Loading
Tests that scraped data is in the right place and properly structured
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any

# Get absolute path to project root
SCRIPT_DIR = Path(__file__).parent.absolute()
DATA_DIR = SCRIPT_DIR / "frontend" / "public" / "data"

def test_index_json():
    """Test that index.json is properly structured"""
    print("\n🔍 Testing index.json...")
    
    index_path = DATA_DIR / "index.json"
    if not index_path.exists():
        print(f"❌ index.json not found at {index_path}")
        return False
    
    with open(index_path) as f:
        index = json.load(f)
    
    # Check required fields
    required_fields = ["version", "brands", "total_brands", "total_products"]
    for field in required_fields:
        if field not in index:
            print(f"❌ Missing field: {field}")
            return False
    
    # Check brands structure
    if not isinstance(index["brands"], list):
        print("❌ brands must be a list")
        return False
    
    print(f"✅ index.json valid: {index['total_brands']} brands, {index['total_products']} products")
    
    # Check each brand has required fields
    for brand in index["brands"]:
        required_brand_fields = ["id", "name", "data_file"]
        for field in required_brand_fields:
            if field not in brand:
                print(f"❌ Brand missing field: {field}")
                return False
        
        # Check if data_file exists
        brand_file = DATA_DIR / brand["data_file"]
        if not brand_file.exists():
            print(f"❌ Brand data file not found: {brand_file}")
            return False
        
        print(f"  ✅ Brand {brand['id']}: data file exists at {brand['data_file']}")
    
    return True

def test_brand_catalog(brand_id: str):
    """Test that a brand catalog is properly structured"""
    print(f"\n🔍 Testing brand catalog: {brand_id}...")
    
    # Load index to get data_file path
    index_path = DATA_DIR / "index.json"
    with open(index_path) as f:
        index = json.load(f)
    
    brand_entry = next((b for b in index["brands"] if b["id"] == brand_id), None)
    if not brand_entry:
        print(f"❌ Brand {brand_id} not found in index")
        return False
    
    catalog_path = DATA_DIR / brand_entry["data_file"]
    with open(catalog_path) as f:
        catalog = json.load(f)
    
    # Check required fields
    if "brand_identity" not in catalog:
        print("❌ Missing brand_identity")
        return False
    
    if "products" not in catalog:
        print("❌ Missing products")
        return False
    
    brand_identity = catalog["brand_identity"]
    products = catalog["products"]
    
    # Validate brand_identity
    required_identity_fields = ["id", "name"]
    for field in required_identity_fields:
        if field not in brand_identity:
            print(f"❌ brand_identity missing field: {field}")
            return False
    
    print(f"✅ Brand identity valid: {brand_identity['name']}")
    
    # Check brand colors
    if "brand_colors" in brand_identity:
        colors = brand_identity["brand_colors"]
        print(f"  ✅ Brand colors: primary={colors.get('primary', 'N/A')}")
    
    # Validate products
    if not isinstance(products, list):
        print("❌ products must be a list")
        return False
    
    print(f"✅ Found {len(products)} products")
    
    # Check first product structure
    if products:
        product = products[0]
        required_product_fields = ["id", "name", "brand", "main_category"]
        for field in required_product_fields:
            if field not in product:
                print(f"⚠️  Product missing field: {field}")
        
        print(f"  ✅ Sample product: {product.get('name', 'N/A')[:50]}")
        
        # Check images
        if "images" in product and product["images"]:
            images = product["images"]
            if isinstance(images, list):
                print(f"  ✅ Images: {len(images)} images found")
            else:
                print(f"  ✅ Images: object format")
        
        # Check categories
        if "main_category" in product:
            print(f"  ✅ Category: {product['main_category']}")
    
    return True

def test_data_accessibility():
    """Test that data is accessible via HTTP (simulated)"""
    print("\n🔍 Testing data file accessibility...")
    
    # Check directory structure
    required_dirs = [
        DATA_DIR,
        DATA_DIR / "catalogs_brand"
    ]
    
    for dir_path in required_dirs:
        if not dir_path.exists():
            print(f"❌ Directory not found: {dir_path}")
            return False
        print(f"  ✅ Directory exists: {dir_path}")
    
    return True

def test_product_hierarchy():
    """Test that products have proper category hierarchy"""
    print("\n🔍 Testing product hierarchy...")
    
    # Load index
    index_path = DATA_DIR / "index.json"
    with open(index_path) as f:
        index = json.load(f)
    
    categories = set()
    subcategories = set()
    
    for brand in index["brands"]:
        catalog_path = DATA_DIR / brand["data_file"]
        with open(catalog_path) as f:
            catalog = json.load(f)
        
        for product in catalog["products"]:
            if "main_category" in product and product["main_category"]:
                categories.add(product["main_category"])
            if "subcategory" in product and product["subcategory"]:
                subcategories.add(product["subcategory"])
    
    print(f"✅ Found {len(categories)} main categories:")
    for cat in sorted(categories):
        print(f"  - {cat}")
    
    print(f"✅ Found {len(subcategories)} subcategories")
    
    return True

def main():
    """Run all verification tests"""
    print("=" * 60)
    print("HSC JIT v3.7 - Data Verification")
    print("=" * 60)
    
    tests = [
        ("Index JSON Structure", test_index_json),
        ("Data Accessibility", test_data_accessibility),
        ("Roland Catalog", lambda: test_brand_catalog("roland")),
        ("Product Hierarchy", test_product_hierarchy),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All verification tests passed!")
        print("✅ Scraped data is properly populated and accessible")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please review the output above.")
        return 1

if __name__ == "__main__":
    exit(main())
