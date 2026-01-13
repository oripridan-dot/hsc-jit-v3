#!/usr/bin/env python3
"""
Roland Corporation Brand - Full Pipeline Test
Test all 9 products through the complete JIT pipeline.
Generated: 2026-01-13
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.services.sniffer import SnifferService
from app.services.catalog import CatalogService
from app.services.fetcher import ContentFetcher


class RolandPipelineTest:
    """Complete pipeline test for Roland Corporation"""
    
    def __init__(self):
        self.catalog = CatalogService()
        self.sniffer = SnifferService(self.catalog)
        self.fetcher = ContentFetcher()
        
        self.results = {
            "brand": "Roland Corporation",
            "total_products": 0,
            "tests": []
        }
    
    def test_catalog_loading(self):
        """Test 1: Verify all Roland Corporation products are loaded"""
        print("\n" + "="*60)
        print("TEST 1: Catalog Loading")
        print("="*60)
        
        products = [p for p in self.catalog.all_products() if p["brand"] == "roland"]
        self.results["total_products"] = len(products)
        
        print(f"✓ Found {len(products)} Roland Corporation products")
        
        for product in products:
            print(f"  - {product['name']} (${product['price']})")
            print(f"    ID: {product['id']}")
            
            if "documentation" in product:
                doc_url = product["documentation"]["url"]
                is_real = "example.com" not in doc_url
                print(f"    {'✓' if is_real else '✗'} Doc: {doc_url}")
            print()
        
        return products
    
    def test_fuzzy_search(self, products):
        """Test 2: Fuzzy search predictions"""
        print("\n" + "="*60)
        print("TEST 2: Fuzzy Search Predictions")
        print("="*60)
        
        # Add relevant search queries for this brand
        test_queries = [
            "roland",
            # TODO: Add more specific product queries
        ]
        
        for query in test_queries:
            predictions = self.sniffer.predict(query, limit=5)
            brand_predictions = [p for p in predictions 
                               if p.get("product", {}).get("brand") == "roland"]
            
            print(f"\nQuery: '{query}'")
            print(f"  Found {len(brand_predictions)} Roland Corporation products")
            
            for pred in brand_predictions[:3]:
                product = pred.get("product", {})
                print(f"    - {product.get('name')} (score: {pred.get('confidence')})")
    
    async def test_document_fetching(self, products):
        """Test 3: Fetch documentation"""
        print("\n" + "="*60)
        print("TEST 3: Document Fetching")
        print("="*60)
        
        for product in products:
            if "documentation" not in product:
                print(f"\n✗ {product['name']}: No documentation")
                continue
            
            doc_url = product["documentation"]["url"]
            print(f"\n{product['name']}:")
            print(f"  URL: {doc_url}")
            
            if "example.com" in doc_url:
                print(f"  ⚠ Placeholder URL - needs real URL")
                continue
            
            try:
                content = await self.fetcher.fetch(product)
                if content:
                    print(f"  ✓ Fetched successfully ({len(content)} chars)")
                else:
                    print(f"  ✗ Fetch returned empty content")
            except Exception as e:
                print(f"  ✗ Fetch failed: {str(e)[:100]}")
    
    def generate_summary(self):
        """Generate test summary report"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        print(f"\nBrand: {self.results['brand']}")
        print(f"Total Products: {self.results['total_products']}")
        print("\n✓ Roland Corporation pipeline testing complete!")


async def main():
    print("\n" + "="*60)
    print("ROLAND CORPORATION BRAND - FULL PIPELINE TEST")
    print("="*60)
    
    tester = RolandPipelineTest()
    
    products = tester.test_catalog_loading()
    tester.test_fuzzy_search(products)
    await tester.test_document_fetching(products)
    tester.generate_summary()
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
