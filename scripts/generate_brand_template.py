#!/usr/bin/env python3
"""
Brand Completion Template Generator
===================================

Generates all files needed to complete a brand like Moog:
- Test suite template
- Documentation templates
- Completion checklist

Usage:
    python scripts/generate_brand_template.py roland
    python scripts/generate_brand_template.py --brand yamaha --output docs/brands/
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime


TEMPLATES = {
    'test_suite': '''#!/usr/bin/env python3
"""
{brand_name_title} Brand - Full Pipeline Test
Test all {product_count} products through the complete JIT pipeline.
Generated: {timestamp}
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.services.sniffer import SnifferService
from app.services.catalog import CatalogService
from app.services.fetcher import ContentFetcher


class {brand_class}PipelineTest:
    """Complete pipeline test for {brand_name_title}"""
    
    def __init__(self):
        self.catalog = CatalogService()
        self.sniffer = SnifferService(self.catalog)
        self.fetcher = ContentFetcher()
        
        self.results = {{
            "brand": "{brand_name_title}",
            "total_products": 0,
            "tests": []
        }}
    
    def test_catalog_loading(self):
        """Test 1: Verify all {brand_name_title} products are loaded"""
        print("\\n" + "="*60)
        print("TEST 1: Catalog Loading")
        print("="*60)
        
        products = [p for p in self.catalog.all_products() if p["brand"] == "{brand_id}"]
        self.results["total_products"] = len(products)
        
        print(f"✓ Found {{len(products)}} {brand_name_title} products")
        
        for product in products:
            print(f"  - {{product['name']}} (${{product['price']}})")
            print(f"    ID: {{product['id']}}")
            
            if "documentation" in product:
                doc_url = product["documentation"]["url"]
                is_real = "example.com" not in doc_url
                print(f"    {{'✓' if is_real else '✗'}} Doc: {{doc_url}}")
            print()
        
        return products
    
    def test_fuzzy_search(self, products):
        """Test 2: Fuzzy search predictions"""
        print("\\n" + "="*60)
        print("TEST 2: Fuzzy Search Predictions")
        print("="*60)
        
        # Add relevant search queries for this brand
        test_queries = [
            "{brand_id}",
            # TODO: Add more specific product queries
        ]
        
        for query in test_queries:
            predictions = self.sniffer.predict(query, limit=5)
            brand_predictions = [p for p in predictions 
                               if p.get("product", {{}}).get("brand") == "{brand_id}"]
            
            print(f"\\nQuery: '{{query}}'")
            print(f"  Found {{len(brand_predictions)}} {brand_name_title} products")
            
            for pred in brand_predictions[:3]:
                product = pred.get("product", {{}})
                print(f"    - {{product.get('name')}} (score: {{pred.get('confidence')}})")
    
    async def test_document_fetching(self, products):
        """Test 3: Fetch documentation"""
        print("\\n" + "="*60)
        print("TEST 3: Document Fetching")
        print("="*60)
        
        for product in products:
            if "documentation" not in product:
                print(f"\\n✗ {{product['name']}}: No documentation")
                continue
            
            doc_url = product["documentation"]["url"]
            print(f"\\n{{product['name']}}:")
            print(f"  URL: {{doc_url}}")
            
            if "example.com" in doc_url:
                print(f"  ⚠ Placeholder URL - needs real URL")
                continue
            
            try:
                content = await self.fetcher.fetch(product)
                if content:
                    print(f"  ✓ Fetched successfully ({{len(content)}} chars)")
                else:
                    print(f"  ✗ Fetch returned empty content")
            except Exception as e:
                print(f"  ✗ Fetch failed: {{str(e)[:100]}}")
    
    def generate_summary(self):
        """Generate test summary report"""
        print("\\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        print(f"\\nBrand: {{self.results['brand']}}")
        print(f"Total Products: {{self.results['total_products']}}")
        print("\\n✓ {brand_name_title} pipeline testing complete!")


async def main():
    print("\\n" + "="*60)
    print("{brand_name_upper} BRAND - FULL PIPELINE TEST")
    print("="*60)
    
    tester = {brand_class}PipelineTest()
    
    products = tester.test_catalog_loading()
    tester.test_fuzzy_search(products)
    await tester.test_document_fetching(products)
    tester.generate_summary()
    
    print("\\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
''',
    
    'completion_checklist': '''# {brand_name_title} - Completion Checklist

**Brand ID:** `{brand_id}`  
**Current Products:** {product_count}  
**Status:** 🚧 In Progress  
**Started:** {timestamp}

---

## Phase 1: Product Curation ⬜

- [ ] Review existing {product_count} products
- [ ] Identify fake/placeholder products
- [ ] Research current {brand_name_title} product lineup
- [ ] Select 5-10 flagship products to include
- [ ] Verify product names and models are accurate

**Target:** 5-10 real, current products

---

## Phase 2: Documentation URLs ⬜

For each product:
- [ ] Find official product manual/documentation
- [ ] Verify URL is accessible
- [ ] Check PDF/HTML quality
- [ ] Update `documentation.url` in catalog

**Sources to check:**
- {brand_name_title} official website
- Product support pages
- Manual download sections

---

## Phase 3: Product Descriptions ⬜

For each product:
- [ ] Write detailed 2-3 sentence description
- [ ] Include key features and use cases
- [ ] Mention target audience (beginner/pro)
- [ ] Verify technical accuracy

**Guidelines:**
- Be specific, not generic
- Focus on what makes product unique
- Use professional tone
- 50-150 words per product

---

## Phase 4: Technical Specifications ⬜

For each product:
- [ ] Add 3-5 key specifications
- [ ] Use consistent naming (e.g., "Polyphony", "Keys")
- [ ] Include units where relevant (e.g., "44.1 kHz")
- [ ] Verify accuracy from official sources

**Common specs:**
- Physical dimensions
- Weight
- Key features
- Technical capabilities
- Connectivity options

---

## Phase 5: Pricing ⬜

For each product:
- [ ] Find current retail price (USD)
- [ ] Verify from multiple sources
- [ ] Use realistic prices
- [ ] Update `price` field

---

## Phase 6: Images ⬜

For each product:
- [ ] Check if image exists in `backend/app/static/assets/products/`
- [ ] If missing, source high-quality product image
- [ ] Convert to WebP format
- [ ] Name as `{{brand_id}}-{{product-id}}.webp`

**Image requirements:**
- WebP format
- Clean product shot
- ~3-5KB file size
- Consistent aspect ratio

---

## Phase 7: Testing ⬜

- [ ] Run test suite: `python tests/test_{brand_id}_pipeline.py`
- [ ] Verify all products load correctly
- [ ] Test fuzzy search with various queries
- [ ] Validate documentation URLs
- [ ] Check for errors/warnings

---

## Phase 8: Documentation ⬜

- [ ] Create `docs/brands/{brand_id_upper}_COMPLETE_REPORT.md`
- [ ] Create `docs/brands/{brand_id_upper}_QUICKREF.md`
- [ ] Update `docs/brands/README.md` with new brand
- [ ] Add to production-ready list

---

## Phase 9: Final Verification ⬜

- [ ] All products have real documentation URLs
- [ ] All products have detailed descriptions
- [ ] All products have technical specs
- [ ] All products have images
- [ ] No placeholder/fake products remain
- [ ] Test suite passes 100%
- [ ] Audit shows 0 issues

---

## Completion Criteria

✅ **Definition of Done:**
1. 5-10 real products with complete metadata
2. All documentation URLs verified and accessible
3. Detailed descriptions for all products
4. Technical specifications for all products
5. Images for all products (real or placeholders)
6. Test suite created and passing
7. Documentation reports generated
8. Zero issues in audit

---

**Use Moog as reference:** `docs/brands/MOOG_COMPLETE_REPORT.md`
''',
    
    'quickref': '''# {brand_name_title} - Quick Reference

## ✅ Completion Status: {completion_percent}%

### Products ({product_count_current}/{product_count_target})
| Product | Price | Category | Docs | Image |
|---------|-------|----------|------|-------|
<!-- Add products here -->

### Test Results
- **Catalog Loading:** ⬜ TODO
- **Fuzzy Search:** ⬜ TODO
- **Document Fetching:** ⬜ TODO
- **Pipeline Integration:** ⬜ TODO
- **End-to-End:** ⬜ TODO

### Files
- **Catalog:** `backend/data/catalogs/{brand_id}_catalog.json`
- **Test Suite:** `tests/test_{brand_id}_pipeline.py`
- **Checklist:** `docs/brands/{brand_id_upper}_CHECKLIST.md`

### Sample Queries
| Query | Expected Result |
|-------|----------------|
| "{brand_id}" | All {brand_name_title} products |
<!-- Add more queries -->

---

**Status:** 🚧 In Progress  
**Last Updated:** {timestamp}
'''
}


def generate_brand_templates(brand_id: str, output_dir: Path):
    """Generate all template files for a brand"""
    
    # Load brand catalog
    catalog_file = output_dir.parent.parent / 'backend' / 'data' / 'catalogs' / f'{brand_id}_catalog.json'
    
    if not catalog_file.exists():
        print(f"✗ Catalog not found: {catalog_file}")
        return
    
    import json
    with open(catalog_file, 'r') as f:
        catalog = json.load(f)
    
    brand_identity = catalog.get('brand_identity', {})
    brand_name = brand_identity.get('name', brand_id.replace('-', ' ').title())
    products = catalog.get('products', [])
    
    # Template variables
    template_vars = {
        'brand_id': brand_id,
        'brand_id_upper': brand_id.upper().replace('-', '_'),
        'brand_name_title': brand_name,
        'brand_name_upper': brand_name.upper(),
        'brand_class': brand_id.replace('-', '_').title().replace('_', ''),
        'product_count': len(products),
        'product_count_current': len(products),
        'product_count_target': '5-10',
        'completion_percent': 0,
        'timestamp': datetime.now().strftime('%Y-%m-%d')
    }
    
    print(f"\n╔{'═'*60}╗")
    print(f"║{'Brand Template Generator'.center(60)}║")
    print(f"╚{'═'*60}╝\n")
    
    print(f"Brand: {brand_name}")
    print(f"ID: {brand_id}")
    print(f"Current Products: {len(products)}\n")
    print("─" * 62)
    
    # Generate test suite
    test_file = output_dir.parent.parent / 'tests' / f'test_{brand_id}_pipeline.py'
    with open(test_file, 'w') as f:
        f.write(TEMPLATES['test_suite'].format(**template_vars))
    print(f"✓ Test suite:    {test_file}")
    
    # Generate checklist
    checklist_file = output_dir / f'{template_vars["brand_id_upper"]}_CHECKLIST.md'
    with open(checklist_file, 'w') as f:
        f.write(TEMPLATES['completion_checklist'].format(**template_vars))
    print(f"✓ Checklist:     {checklist_file}")
    
    # Generate quick ref
    quickref_file = output_dir / f'{template_vars["brand_id_upper"]}_QUICKREF.md'
    with open(quickref_file, 'w') as f:
        f.write(TEMPLATES['quickref'].format(**template_vars))
    print(f"✓ Quick ref:     {quickref_file}")
    
    print("\n" + "─" * 62)
    print("✅ Template generation complete!")
    print("\nNext steps:")
    print(f"  1. Review checklist: {checklist_file.name}")
    print(f"  2. Update catalog: backend/data/catalogs/{brand_id}_catalog.json")
    print(f"  3. Run tests: python tests/test_{brand_id}_pipeline.py")


def main():
    parser = argparse.ArgumentParser(description='Generate brand completion templates')
    parser.add_argument('brand', help='Brand ID (e.g., roland, yamaha)')
    parser.add_argument('--output', default='docs/brands', 
                       help='Output directory for documentation')
    
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    generate_brand_templates(args.brand, output_dir)


if __name__ == '__main__':
    main()
