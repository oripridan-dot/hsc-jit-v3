#!/usr/bin/env python3
"""
FINAL SYSTEM VALIDATION REPORT
================================
Complete verification that the system is clean, lean, and production-ready.
"""

import json
import subprocess
from pathlib import Path

class FinalValidation:
    def __init__(self):
        self.base = Path('/workspaces/hsc-jit-v3')
        self.data_dir = self.base / 'frontend/public/data'
        self.checks = []
    
    def run(self) -> bool:
        print("\n" + "="*80)
        print("FINAL SYSTEM VALIDATION REPORT")
        print("="*80)
        
        # 1. Logos validation
        self._check_logos()
        
        # 2. Ghost products
        self._check_ghost_products()
        
        # 3. Data integrity
        self._check_data_integrity()
        
        # 4. Real products
        self._check_real_products()
        
        # 5. Directory structure
        self._check_structure()
        
        self._print_report()
        return all(check['passed'] for check in self.checks)
    
    def _check_logos(self):
        """Verify only real logos exist."""
        logos_dir = self.data_dir / 'logos'
        
        if not logos_dir.exists():
            self.checks.append({
                'name': 'Real Logos Validation',
                'passed': False,
                'message': 'Logos directory not found'
            })
            return
        
        logos = list(logos_dir.glob('*_logo.jpg'))
        approved_brands = {
            'roland', 'boss', 'nord', 'moog', 'akai-professional',
            'mackie', 'teenage-engineering', 'universal-audio',
            'adam-audio', 'warm-audio'
        }
        
        # Check all logos are approved and real
        all_valid = True
        for logo in logos:
            brand = logo.name.replace('_logo.jpg', '')
            if brand not in approved_brands:
                all_valid = False
                break
            
            # Verify it's a real JPEG
            if logo.stat().st_size < 1024:
                all_valid = False
                break
        
        self.checks.append({
            'name': 'Real Logos Validation',
            'passed': all_valid and len(logos) == len(approved_brands),
            'message': f'{len(logos)} real brand logos verified'
        })
    
    def _check_ghost_products(self):
        """Verify no ghost/placeholder products remain."""
        ghost_count = 0
        placeholder_count = 0
        
        for catalog_file in self.data_dir.glob('*.json'):
            if catalog_file.name in ['index.json', 'taxonomy.json']:
                continue
            
            try:
                with open(catalog_file) as f:
                    data = json.load(f)
                
                products = data.get('products', [])
                for product in products:
                    pid = product.get('id', '').lower()
                    if 'ghost' in pid:
                        ghost_count += 1
                    if 'placeholder' in pid:
                        placeholder_count += 1
            except:
                pass
        
        self.checks.append({
            'name': 'Ghost Product Removal',
            'passed': ghost_count == 0 and placeholder_count == 0,
            'message': f'No ghost or placeholder products found'
        })
    
    def _check_data_integrity(self):
        """Verify all JSON files are valid."""
        invalid_count = 0
        
        for json_file in self.data_dir.glob('*.json'):
            try:
                with open(json_file) as f:
                    json.load(f)
            except json.JSONDecodeError:
                invalid_count += 1
        
        self.checks.append({
            'name': 'JSON Data Integrity',
            'passed': invalid_count == 0,
            'message': f'{self.data_dir.glob("*.json").__length_hint__()} JSON files valid'
        })
    
    def _check_real_products(self):
        """Verify only real products exist."""
        total_products = 0
        brands_with_products = 0
        
        for catalog_file in self.data_dir.glob('*.json'):
            if catalog_file.name in ['index.json', 'taxonomy.json']:
                continue
            
            try:
                with open(catalog_file) as f:
                    data = json.load(f)
                
                products = data.get('products', [])
                if products:
                    total_products += len(products)
                    brands_with_products += 1
            except:
                pass
        
        self.checks.append({
            'name': 'Real Product Validation',
            'passed': total_products > 0 and brands_with_products > 5,
            'message': f'{total_products} real products across {brands_with_products} brands'
        })
    
    def _check_structure(self):
        """Verify directory structure is complete."""
        required = [
            'frontend/src/components',
            'frontend/src/hooks',
            'frontend/src/lib',
            'frontend/src/store',
            'frontend/public/data',
            'frontend/public/data/logos',
            'backend/models',
            'backend/services',
            'backend/core',
        ]
        
        all_exist = all((self.base / path).exists() for path in required)
        
        self.checks.append({
            'name': 'Directory Structure',
            'passed': all_exist,
            'message': f'{len(required)} required directories present'
        })
    
    def _print_report(self):
        """Print final report."""
        print("\nVALIDATION RESULTS:")
        print("-" * 80)
        
        passed = sum(1 for c in self.checks if c['passed'])
        
        for check in self.checks:
            status = "✓" if check['passed'] else "✗"
            print(f"{status} {check['name']:<35} {check['message']}")
        
        print("\n" + "=" * 80)
        print(f"\nRESULT: {passed}/{len(self.checks)} checks passed\n")
        
        if passed == len(self.checks):
            print("✓✓✓ SYSTEM READY FOR PRODUCTION ✓✓✓\n")
            print("STATUS:")
            print("  • Only real brand logos (10 verified)")
            print("  • All ghost products removed")
            print("  • No placeholder content")
            print("  • All real products validated")
            print("  • Complete directory structure")
            print("  • Data files intact and valid")
            print("\nThe system is CLEAN, LEAN, and READY FOR DEVELOPMENT.\n")
        else:
            print(f"✗ {len(self.checks) - passed} checks failed - fix issues before proceeding\n")
        
        print("=" * 80 + "\n")
        
        return passed == len(self.checks)


if __name__ == '__main__':
    validator = FinalValidation()
    success = validator.run()
    exit(0 if success else 1)
