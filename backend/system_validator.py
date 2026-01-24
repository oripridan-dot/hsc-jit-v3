"""
COMPREHENSIVE SYSTEM VALIDATION SUITE
======================================
Tests the entire HSC-JIT system for:
1. Data integrity and consistency
2. Real logos only (no generated content)
3. Brand catalog completeness
4. Frontend/backend alignment
5. Category consolidation correctness
6. Product data validity

All tests must PASS for production deployment.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any


class SystemValidator:
    """Comprehensive system validation."""
    
    def __init__(self, base_path: str = '/workspaces/hsc-jit-v3'):
        """Initialize the system validator."""
        self.base_path = Path(base_path)
        self.frontend_data = self.base_path / 'frontend' / 'public' / 'data'
        self.backend_models = self.base_path / 'backend' / 'models'
        self.backend_services = self.base_path / 'backend' / 'services'
        
        self.test_results: Dict[str, Dict[str, Any]] = {}
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
    
    def run_all_tests(self) -> bool:
        """Run all system validation tests."""
        print("\n" + "="*80)
        print("COMPREHENSIVE SYSTEM VALIDATION SUITE")
        print("="*80)
        
        tests = [
            ("Frontend Data Structure", self.test_frontend_data_structure),
            ("Real Logos Only", self.test_real_logos_only),
            ("Brand Catalog Completeness", self.test_brand_catalog_completeness),
            ("Product Data Integrity", self.test_product_data_integrity),
            ("Category Consolidation", self.test_category_consolidation),
            ("Index Consistency", self.test_index_consistency),
            ("No Placeholder Content", self.test_no_placeholder_content),
            ("Frontend Components Valid", self.test_frontend_components),
            ("Data File Integrity", self.test_data_file_integrity),
            ("Cross-Reference Validation", self.test_cross_references),
        ]
        
        for test_name, test_func in tests:
            self._run_test(test_name, test_func)
        
        self._print_summary()
        return self.failed_tests == 0
    
    def _run_test(self, test_name: str, test_func) -> None:
        """Run a single test and track results."""
        self.total_tests += 1
        
        try:
            result = test_func()
            
            if result['passed']:
                self.passed_tests += 1
                status = "✓ PASS"
            else:
                self.failed_tests += 1
                status = "✗ FAIL"
            
            self.test_results[test_name] = result
            
            print(f"\n{status}: {test_name}")
            if result.get('messages'):
                for msg in result['messages']:
                    print(f"  • {msg}")
            if result.get('details'):
                print(f"  Details: {result['details']}")
            
        except Exception as e:
            self.failed_tests += 1
            self.test_results[test_name] = {
                'passed': False,
                'messages': [f"Exception: {str(e)}"]
            }
            print(f"\n✗ ERROR: {test_name}")
            print(f"  Exception: {str(e)}")
    
    def test_frontend_data_structure(self) -> Dict[str, Any]:
        """Test that frontend data directory has correct structure."""
        expected_files = [
            'index.json',
            'taxonomy.json',
            'logos',
        ]
        
        messages = []
        missing = []
        
        for filename in expected_files:
            path = self.frontend_data / filename
            if not path.exists():
                missing.append(filename)
        
        if missing:
            return {
                'passed': False,
                'messages': [f"Missing files: {', '.join(missing)}"]
            }
        
        # Check for catalog files
        catalog_files = list(self.frontend_data.glob("*.json"))
        if len(catalog_files) < 2:
            return {
                'passed': False,
                'messages': ["Too few catalog JSON files found"]
            }
        
        messages.append(f"Found {len(catalog_files)} catalog files")
        messages.append(f"Data directory structure: OK")
        
        return {
            'passed': True,
            'messages': messages
        }
    
    def test_real_logos_only(self) -> Dict[str, Any]:
        """Test that only real brand logos are present."""
        messages = []
        logos_dir = self.frontend_data / 'logos'
        
        if not logos_dir.exists():
            return {
                'passed': False,
                'messages': ["Logos directory not found"]
            }
        
        logo_files = list(logos_dir.glob("*_logo.jpg"))
        
        if len(logo_files) == 0:
            return {
                'passed': False,
                'messages': ["No logo files found"]
            }
        
        approved_brands = {
            'roland', 'boss', 'nord', 'moog', 'akai-professional',
            'mackie', 'teenage-engineering', 'universal-audio',
            'adam-audio', 'warm-audio'
        }
        
        unapproved = []
        generated = []
        
        for logo_file in logo_files:
            brand = logo_file.name.replace('_logo.jpg', '')
            
            # Check for generated patterns
            if any(x in logo_file.name.lower() for x in 
                   ['placeholder', 'generated', 'ai_', 'synthetic']):
                generated.append(logo_file.name)
            
            # Check brand approval
            if brand not in approved_brands:
                unapproved.append(brand)
        
        if generated:
            return {
                'passed': False,
                'messages': [f"Generated logos found: {', '.join(generated)}"]
            }
        
        if unapproved:
            return {
                'passed': False,
                'messages': [f"Unapproved brands: {', '.join(unapproved)}"]
            }
        
        messages.append(f"Found {len(logo_files)} real brand logos")
        messages.append("All logos are approved real brands")
        
        return {
            'passed': True,
            'messages': messages,
            'details': f"{len(logo_files)} logos validated"
        }
    
    def test_brand_catalog_completeness(self) -> Dict[str, Any]:
        """Test that all expected brand catalogs exist and are valid."""
        messages = []
        expected_brands = {
            'roland', 'boss', 'nord', 'moog', 'akai-professional',
            'mackie', 'teenage-engineering', 'universal-audio',
            'adam-audio', 'warm-audio'
        }
        
        found_brands = set()
        invalid_catalogs = []
        
        for brand in expected_brands:
            catalog_file = self.frontend_data / f"{brand}.json"
            
            if not catalog_file.exists():
                invalid_catalogs.append(f"{brand}: missing")
                continue
            
            try:
                with open(catalog_file, 'r') as f:
                    catalog = json.load(f)
                
                # Validate catalog structure
                required_fields = ['brand', 'logo', 'products']
                missing_fields = [f for f in required_fields if f not in catalog]
                
                if missing_fields:
                    invalid_catalogs.append(
                        f"{brand}: missing fields {missing_fields}"
                    )
                else:
                    found_brands.add(brand)
                
            except json.JSONDecodeError:
                invalid_catalogs.append(f"{brand}: invalid JSON")
        
        if invalid_catalogs:
            return {
                'passed': False,
                'messages': invalid_catalogs
            }
        
        messages.append(f"All {len(found_brands)} expected brands found")
        messages.append("All catalogs have valid JSON and required fields")
        
        return {
            'passed': True,
            'messages': messages,
            'details': f"{len(found_brands)} brand catalogs validated"
        }
    
    def test_product_data_integrity(self) -> Dict[str, Any]:
        """Test that all products have required fields and valid data."""
        messages = []
        issues = []
        total_products = 0
        
        for catalog_file in self.frontend_data.glob("*.json"):
            if catalog_file.name in ['index.json', 'taxonomy.json']:
                continue
            
            try:
                with open(catalog_file, 'r') as f:
                    catalog = json.load(f)
                
                products = catalog.get('products', [])
                total_products += len(products)
                
                for product in products:
                    # Check required fields
                    required = ['id', 'name', 'category']
                    missing = [f for f in required if f not in product]
                    
                    if missing:
                        issues.append(
                            f"{catalog_file.name}: Product {product.get('id', '?')} "
                            f"missing {missing}"
                        )
                
            except json.JSONDecodeError as e:
                issues.append(f"{catalog_file.name}: Invalid JSON - {e}")
        
        if issues:
            return {
                'passed': False,
                'messages': issues[:5]  # Show first 5 issues
            }
        
        messages.append(f"Total products validated: {total_products}")
        messages.append("All products have required fields")
        
        return {
            'passed': True,
            'messages': messages,
            'details': f"{total_products} products checked"
        }
    
    def test_category_consolidation(self) -> Dict[str, Any]:
        """Test that categories map to the 8 universal categories."""
        messages = []
        
        taxonomy_file = self.frontend_data / 'taxonomy.json'
        
        if not taxonomy_file.exists():
            return {
                'passed': False,
                'messages': ["taxonomy.json not found"]
            }
        
        try:
            with open(taxonomy_file, 'r') as f:
                taxonomy = json.load(f)
            
            required_categories = {
                'keys', 'drums', 'guitars', 'studio',
                'live', 'dj', 'software', 'accessories'
            }
            
            found_categories = set(taxonomy.get('categories', {}).keys())
            
            if found_categories != required_categories:
                missing = required_categories - found_categories
                extra = found_categories - required_categories
                
                issues = []
                if missing:
                    issues.append(f"Missing categories: {missing}")
                if extra:
                    issues.append(f"Extra categories: {extra}")
                
                return {
                    'passed': False,
                    'messages': issues
                }
            
            messages.append("All 8 universal categories present")
            messages.append("Category taxonomy is complete")
            
            return {
                'passed': True,
                'messages': messages,
                'details': f"{len(found_categories)} categories"
            }
            
        except json.JSONDecodeError:
            return {
                'passed': False,
                'messages': ["taxonomy.json is invalid JSON"]
            }
    
    def test_index_consistency(self) -> Dict[str, Any]:
        """Test that index.json is consistent with actual catalogs."""
        messages = []
        
        index_file = self.frontend_data / 'index.json'
        
        if not index_file.exists():
            return {
                'passed': False,
                'messages': ["index.json not found"]
            }
        
        try:
            with open(index_file, 'r') as f:
                index = json.load(f)
            
            indexed_brands = set(index.get('brands', {}).keys())
            actual_brands = set()
            
            for catalog_file in self.frontend_data.glob("*.json"):
                if catalog_file.name not in ['index.json', 'taxonomy.json']:
                    brand = catalog_file.stem
                    actual_brands.add(brand)
            
            if indexed_brands != actual_brands:
                missing = actual_brands - indexed_brands
                extra = indexed_brands - actual_brands
                
                issues = []
                if missing:
                    issues.append(f"Index missing: {missing}")
                if extra:
                    issues.append(f"Index has extra: {extra}")
                
                return {
                    'passed': False,
                    'messages': issues
                }
            
            messages.append("Index matches actual catalogs")
            messages.append(f"All {len(indexed_brands)} brands indexed correctly")
            
            return {
                'passed': True,
                'messages': messages
            }
            
        except json.JSONDecodeError:
            return {
                'passed': False,
                'messages': ["index.json is invalid JSON"]
            }
    
    def test_no_placeholder_content(self) -> Dict[str, Any]:
        """Test that no placeholder or generated content exists."""
        messages = []
        issues = []
        
        placeholder_keywords = [
            'placeholder', 'generated', 'ai_generated', 'ai-generated',
            'synthetic', 'test_', 'temporary', 'todo', 'fixme', 'lorem'
        ]
        
        for json_file in self.frontend_data.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    content = f.read().lower()
                
                for keyword in placeholder_keywords:
                    if keyword in content:
                        issues.append(f"{json_file.name}: Contains '{keyword}'")
                        break
                
            except Exception as e:
                issues.append(f"{json_file.name}: Error reading - {e}")
        
        if issues:
            return {
                'passed': False,
                'messages': issues
            }
        
        messages.append("No placeholder keywords found")
        messages.append("All content appears to be real data")
        
        return {
            'passed': True,
            'messages': messages
        }
    
    def test_frontend_components(self) -> Dict[str, Any]:
        """Test that frontend components exist and are valid."""
        messages = []
        
        frontend_src = self.base_path / 'frontend' / 'src'
        
        expected_dirs = [
            'components',
            'hooks',
            'lib',
            'store',
        ]
        
        missing = []
        for dirname in expected_dirs:
            if not (frontend_src / dirname).exists():
                missing.append(dirname)
        
        if missing:
            return {
                'passed': False,
                'messages': [f"Missing frontend dirs: {', '.join(missing)}"]
            }
        
        messages.append("All frontend directories present")
        messages.append("Frontend component structure: OK")
        
        return {
            'passed': True,
            'messages': messages
        }
    
    def test_data_file_integrity(self) -> Dict[str, Any]:
        """Test that all JSON data files are not corrupted."""
        messages = []
        issues = []
        
        for json_file in self.frontend_data.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    json.load(f)
                messages.append(f"✓ {json_file.name}")
            except json.JSONDecodeError as e:
                issues.append(f"{json_file.name}: Invalid JSON - {e}")
            except Exception as e:
                issues.append(f"{json_file.name}: Read error - {e}")
        
        if issues:
            return {
                'passed': False,
                'messages': issues
            }
        
        messages.append(f"All {len(messages)} JSON files are valid")
        
        return {
            'passed': True,
            'messages': messages[:3]
        }
    
    def test_cross_references(self) -> Dict[str, Any]:
        """Test that logo references are correct across all catalogs."""
        messages = []
        issues = []
        
        for catalog_file in self.frontend_data.glob("*.json"):
            if catalog_file.name in ['index.json', 'taxonomy.json']:
                continue
            
            try:
                with open(catalog_file, 'r') as f:
                    catalog = json.load(f)
                
                brand_id = catalog_file.stem
                expected_logo = f"/data/logos/{brand_id}_logo.jpg"
                actual_logo = catalog.get('logo', '')
                
                if actual_logo != expected_logo:
                    issues.append(
                        f"{catalog_file.name}: logo mismatch "
                        f"(expected {expected_logo}, got {actual_logo})"
                    )
                
            except json.JSONDecodeError:
                issues.append(f"{catalog_file.name}: Invalid JSON")
        
        if issues:
            return {
                'passed': False,
                'messages': issues
            }
        
        messages.append("All logo cross-references are valid")
        messages.append("No broken logo links found")
        
        return {
            'passed': True,
            'messages': messages
        }
    
    def _print_summary(self):
        """Print test summary."""
        print("\n" + "="*80)
        print("VALIDATION SUMMARY")
        print("="*80)
        print(f"\nTotal Tests: {self.total_tests}")
        print(f"✓ Passed: {self.passed_tests}")
        print(f"✗ Failed: {self.failed_tests}")
        
        if self.failed_tests == 0:
            print("\n✓ ALL TESTS PASSED - SYSTEM READY FOR DEPLOYMENT")
        else:
            print(f"\n✗ {self.failed_tests} TEST(S) FAILED - FIX ISSUES BEFORE DEPLOYMENT")
        
        print("="*80 + "\n")


def main():
    """Run the comprehensive system validation suite."""
    validator = SystemValidator()
    success = validator.run_all_tests()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
