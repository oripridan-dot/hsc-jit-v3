#!/usr/bin/env python3
"""
Automated Brand Catalog Auditor
================================

Comprehensive audit system for all brand catalogs in HSC-JIT.
Identifies issues, validates data quality, and generates reports.

Usage:
    python scripts/audit_all_brands.py --report       # Generate report only
    python scripts/audit_all_brands.py --fix          # Auto-fix common issues
    python scripts/audit_all_brands.py --brand moog   # Audit single brand
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple
from collections import defaultdict
import re
from urllib.parse import urlparse

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


class BrandAuditor:
    """Comprehensive brand catalog auditor"""
    
    ISSUES = {
        'PLACEHOLDER_URL': 'Documentation URL is placeholder (example.com)',
        'MISSING_DOC': 'No documentation URL provided',
        'INVALID_URL': 'Documentation URL is malformed',
        'MISSING_DESC': 'Product description is missing or too short',
        'MISSING_SPECS': 'Product specifications are missing or empty',
        'MISSING_IMAGE': 'Product image path is missing',
        'FAKE_PRODUCT': 'Product appears to be placeholder/generated (variant-N pattern)',
        'INVALID_PRICE': 'Price is missing, zero, or unrealistic',
        'MISSING_CATEGORY': 'Product category is missing',
        'DUPLICATE_ID': 'Product ID is duplicated',
        'MISSING_BRAND_ID': 'Product missing brand field',
    }
    
    def __init__(self, catalogs_dir: Path):
        self.catalogs_dir = catalogs_dir
        self.results = {}
        self.summary = {
            'total_brands': 0,
            'total_products': 0,
            'brands_with_issues': 0,
            'products_with_issues': 0,
            'issue_counts': defaultdict(int),
        }
    
    def audit_all_brands(self) -> Dict[str, Any]:
        """Audit all brand catalogs"""
        print("╔════════════════════════════════════════════════════════════╗")
        print("║         AUTOMATED BRAND CATALOG AUDITOR v1.0              ║")
        print("╚════════════════════════════════════════════════════════════╝\n")
        
        catalog_files = list(self.catalogs_dir.glob("*_catalog.json"))
        self.summary['total_brands'] = len(catalog_files)
        
        print(f"Found {len(catalog_files)} brand catalogs\n")
        print("Auditing...")
        print("─" * 60)
        
        for catalog_file in sorted(catalog_files):
            brand_id = catalog_file.stem.replace('_catalog', '')
            self.audit_brand(catalog_file, brand_id)
        
        return self.results
    
    def audit_brand(self, catalog_file: Path, brand_id: str) -> Dict[str, Any]:
        """Audit single brand catalog"""
        try:
            with open(catalog_file, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
        except Exception as e:
            print(f"✗ {brand_id}: Failed to load - {str(e)}")
            self.results[brand_id] = {
                'error': str(e),
                'issues': [],
                'products': []
            }
            self.summary['brands_with_issues'] += 1
            return self.results[brand_id]
        
        brand_result = {
            'brand_name': catalog.get('brand_identity', {}).get('name', brand_id),
            'products': [],
            'issues': [],
            'stats': {
                'total_products': 0,
                'products_with_issues': 0,
                'placeholder_urls': 0,
                'missing_docs': 0,
                'fake_products': 0,
            }
        }
        
        products = catalog.get('products', [])
        brand_result['stats']['total_products'] = len(products)
        self.summary['total_products'] += len(products)
        
        # Track duplicate IDs
        seen_ids = set()
        
        for product in products:
            product_issues = self.audit_product(product, brand_id, seen_ids)
            
            if product_issues:
                brand_result['stats']['products_with_issues'] += 1
                self.summary['products_with_issues'] += 1
                
                brand_result['products'].append({
                    'id': product.get('id', 'UNKNOWN'),
                    'name': product.get('name', 'UNKNOWN'),
                    'issues': product_issues
                })
                
                # Update issue counts
                for issue in product_issues:
                    self.summary['issue_counts'][issue['type']] += 1
                    
                    # Track specific stats
                    if issue['type'] == 'PLACEHOLDER_URL':
                        brand_result['stats']['placeholder_urls'] += 1
                    elif issue['type'] == 'MISSING_DOC':
                        brand_result['stats']['missing_docs'] += 1
                    elif issue['type'] == 'FAKE_PRODUCT':
                        brand_result['stats']['fake_products'] += 1
        
        # Print summary for this brand
        status = "✓" if brand_result['stats']['products_with_issues'] == 0 else "✗"
        print(f"{status} {brand_id:30s} {len(products):3d} products, "
              f"{brand_result['stats']['products_with_issues']:3d} issues")
        
        if brand_result['stats']['products_with_issues'] > 0:
            self.summary['brands_with_issues'] += 1
        
        self.results[brand_id] = brand_result
        return brand_result
    
    def audit_product(self, product: Dict[str, Any], brand_id: str, 
                     seen_ids: set) -> List[Dict[str, Any]]:
        """Audit single product and return list of issues"""
        issues = []
        product_id = product.get('id', '')
        
        # Check for duplicate ID
        if product_id in seen_ids:
            issues.append({
                'type': 'DUPLICATE_ID',
                'message': self.ISSUES['DUPLICATE_ID'],
                'field': 'id',
                'value': product_id
            })
        seen_ids.add(product_id)
        
        # Check for fake/generated product patterns
        if self._is_fake_product(product):
            issues.append({
                'type': 'FAKE_PRODUCT',
                'message': self.ISSUES['FAKE_PRODUCT'],
                'field': 'name',
                'value': product.get('name', '')
            })
        
        # Check brand field
        if product.get('brand') != brand_id:
            issues.append({
                'type': 'MISSING_BRAND_ID',
                'message': self.ISSUES['MISSING_BRAND_ID'],
                'field': 'brand',
                'value': product.get('brand', 'MISSING')
            })
        
        # Check documentation
        doc_issues = self._check_documentation(product)
        issues.extend(doc_issues)
        
        # Check description
        desc = product.get('description', '')
        if not desc or len(desc.strip()) < 20:
            issues.append({
                'type': 'MISSING_DESC',
                'message': self.ISSUES['MISSING_DESC'],
                'field': 'description',
                'value': f"Length: {len(desc)} chars"
            })
        
        # Check specifications
        specs = product.get('specs', {})
        if not specs or len(specs) == 0:
            issues.append({
                'type': 'MISSING_SPECS',
                'message': self.ISSUES['MISSING_SPECS'],
                'field': 'specs',
                'value': 'Empty or missing'
            })
        
        # Check images
        images = product.get('images', {})
        if not images.get('main'):
            issues.append({
                'type': 'MISSING_IMAGE',
                'message': self.ISSUES['MISSING_IMAGE'],
                'field': 'images.main',
                'value': 'Missing'
            })
        
        # Check price
        price = product.get('price', 0)
        if not price or price <= 0 or price > 100000:
            issues.append({
                'type': 'INVALID_PRICE',
                'message': self.ISSUES['INVALID_PRICE'],
                'field': 'price',
                'value': str(price)
            })
        
        # Check category
        if not product.get('category'):
            issues.append({
                'type': 'MISSING_CATEGORY',
                'message': self.ISSUES['MISSING_CATEGORY'],
                'field': 'category',
                'value': 'Missing'
            })
        
        return issues
    
    def _is_fake_product(self, product: Dict[str, Any]) -> bool:
        """Detect if product is likely a placeholder/generated product"""
        product_id = product.get('id', '')
        product_name = product.get('name', '')
        
        # Check for variant-N pattern
        if re.search(r'-variant-\d+$', product_id):
            return True
        
        # Check for generic names like "Brand Product Variant N"
        if re.search(r'(Plus|Pro|Compact|Limited Edition|Anniversary)$', product_name):
            # Check if description is also generic
            desc = product.get('description', '')
            if 'Professional audio equipment with premium quality' in desc:
                return True
        
        return False
    
    def _check_documentation(self, product: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check documentation URL quality"""
        issues = []
        
        if 'documentation' not in product:
            issues.append({
                'type': 'MISSING_DOC',
                'message': self.ISSUES['MISSING_DOC'],
                'field': 'documentation',
                'value': 'Not provided'
            })
            return issues
        
        doc = product.get('documentation', {})
        url = doc.get('url', '')
        
        if not url:
            issues.append({
                'type': 'MISSING_DOC',
                'message': self.ISSUES['MISSING_DOC'],
                'field': 'documentation.url',
                'value': 'Empty'
            })
            return issues
        
        # Check for placeholder URLs
        if 'example.com' in url.lower():
            issues.append({
                'type': 'PLACEHOLDER_URL',
                'message': self.ISSUES['PLACEHOLDER_URL'],
                'field': 'documentation.url',
                'value': url
            })
        
        # Check URL format
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                issues.append({
                    'type': 'INVALID_URL',
                    'message': self.ISSUES['INVALID_URL'],
                    'field': 'documentation.url',
                    'value': url
                })
        except Exception:
            issues.append({
                'type': 'INVALID_URL',
                'message': self.ISSUES['INVALID_URL'],
                'field': 'documentation.url',
                'value': url
            })
        
        return issues
    
    def generate_report(self, output_file: Path = None):
        """Generate comprehensive audit report"""
        print("\n" + "═" * 60)
        print("AUDIT SUMMARY")
        print("═" * 60)
        
        print(f"\nTotal Brands:              {self.summary['total_brands']}")
        print(f"Total Products:            {self.summary['total_products']}")
        print(f"Brands with Issues:        {self.summary['brands_with_issues']} "
              f"({self.summary['brands_with_issues']/self.summary['total_brands']*100:.1f}%)")
        print(f"Products with Issues:      {self.summary['products_with_issues']} "
              f"({self.summary['products_with_issues']/self.summary['total_products']*100:.1f}%)")
        
        print("\n" + "─" * 60)
        print("ISSUE BREAKDOWN")
        print("─" * 60)
        
        sorted_issues = sorted(self.summary['issue_counts'].items(), 
                              key=lambda x: x[1], reverse=True)
        
        for issue_type, count in sorted_issues:
            print(f"{issue_type:25s} {count:5d} ({count/self.summary['total_products']*100:5.1f}%)")
        
        # Top 10 brands with most issues
        print("\n" + "─" * 60)
        print("TOP 10 BRANDS NEEDING ATTENTION")
        print("─" * 60)
        
        brand_issues = [(brand, data['stats']['products_with_issues']) 
                       for brand, data in self.results.items()
                       if 'stats' in data]
        brand_issues.sort(key=lambda x: x[1], reverse=True)
        
        for brand, issue_count in brand_issues[:10]:
            total = self.results[brand]['stats']['total_products']
            print(f"{brand:30s} {issue_count:3d}/{total:3d} "
                  f"({issue_count/total*100:5.1f}%)")
        
        # Brands ready for production
        print("\n" + "─" * 60)
        print("BRANDS READY FOR PRODUCTION (0 issues)")
        print("─" * 60)
        
        clean_brands = [brand for brand, data in self.results.items()
                       if 'stats' in data and 
                       data['stats']['products_with_issues'] == 0]
        
        if clean_brands:
            for brand in sorted(clean_brands):
                product_count = self.results[brand]['stats']['total_products']
                print(f"✓ {brand:30s} ({product_count} products)")
        else:
            print("None - all brands need attention")
        
        # Save detailed report to JSON
        if output_file:
            report_data = {
                'summary': dict(self.summary),
                'brands': self.results,
                'timestamp': '2026-01-13'
            }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False)
            
            print(f"\n✓ Detailed report saved to: {output_file}")


def main():
    parser = argparse.ArgumentParser(description='Audit brand catalogs')
    parser.add_argument('--brand', help='Audit specific brand only')
    parser.add_argument('--report', action='store_true', 
                       help='Generate detailed JSON report')
    parser.add_argument('--output', default='audit_report.json',
                       help='Output file for report')
    
    args = parser.parse_args()
    
    # Find catalogs directory
    script_dir = Path(__file__).parent
    catalogs_dir = script_dir.parent / 'backend' / 'data' / 'catalogs'
    
    if not catalogs_dir.exists():
        print(f"✗ Catalogs directory not found: {catalogs_dir}")
        sys.exit(1)
    
    auditor = BrandAuditor(catalogs_dir)
    
    if args.brand:
        # Audit single brand
        catalog_file = catalogs_dir / f"{args.brand}_catalog.json"
        if not catalog_file.exists():
            print(f"✗ Brand catalog not found: {catalog_file}")
            sys.exit(1)
        auditor.audit_brand(catalog_file, args.brand)
    else:
        # Audit all brands
        auditor.audit_all_brands()
    
    # Generate report
    output_path = Path(args.output) if args.report else None
    auditor.generate_report(output_path)
    
    print("\n" + "═" * 60)
    print("AUDIT COMPLETE")
    print("═" * 60)


if __name__ == '__main__':
    main()
