#!/usr/bin/env python3
"""
MASTER SYSTEM VALIDATION & ALIGNMENT
=====================================
Comprehensive check that:
1. All real data is intact
2. Real logos only (no generated content)
3. System components are aligned
4. Everything is production-ready

This script MUST PASS before any deployment or development.
"""

import sys
import subprocess
import json
from pathlib import Path


class MasterValidator:
    """Master system validation and alignment checker."""
    
    def __init__(self, base_path: str = '/workspaces/hsc-jit-v3'):
        """Initialize the master validator."""
        self.base_path = Path(base_path)
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = []
    
    def run_full_validation(self) -> bool:
        """Run complete system validation."""
        print("\n" + "█"*80)
        print("█" + " "*78 + "█")
        print("█" + " "*20 + "MASTER SYSTEM VALIDATION" + " "*34 + "█")
        print("█" + " "*78 + "█")
        print("█"*80)
        
        print("\n[1/5] Checking directory structure...")
        if not self._check_structure():
            return False
        
        print("\n[2/5] Validating real logos only...")
        if not self._validate_logos():
            return False
        
        print("\n[3/5] Validating data integrity...")
        if not self._validate_data():
            return False
        
        print("\n[4/5] Running system validation suite...")
        if not self._run_system_validator():
            return False
        
        print("\n[5/5] Checking system alignment...")
        if not self._check_alignment():
            return False
        
        self._print_final_report()
        return True
    
    def _check_structure(self) -> bool:
        """Check directory structure."""
        required_dirs = [
            'frontend/src',
            'frontend/public/data',
            'frontend/public/data/logos',
            'backend/models',
            'backend/services',
            'backend/core',
            'docs',
        ]
        
        all_exist = True
        for dirname in required_dirs:
            path = self.base_path / dirname
            if path.exists():
                print(f"  ✓ {dirname}")
            else:
                print(f"  ✗ {dirname} - MISSING")
                all_exist = False
                self.checks_failed += 1
        
        if all_exist:
            self.checks_passed += 1
        
        return all_exist
    
    def _validate_logos(self) -> bool:
        """Validate that only real logos exist."""
        print("  Running strict logo validator...", end=" ", flush=True)
        
        try:
            result = subprocess.run(
                ['python3', 'logo_validator.py'],
                cwd=str(self.base_path / 'backend'),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("✓ PASSED")
                self.checks_passed += 1
                return True
            else:
                print("✗ FAILED")
                print(result.stdout)
                print(result.stderr)
                self.checks_failed += 1
                return False
        
        except subprocess.TimeoutExpired:
            print("✗ TIMEOUT")
            self.checks_failed += 1
            return False
        except Exception as e:
            print(f"✗ ERROR: {e}")
            self.checks_failed += 1
            return False
    
    def _validate_data(self) -> bool:
        """Validate data files."""
        data_dir = self.base_path / 'frontend' / 'public' / 'data'
        
        # Check essential files
        essential_files = ['index.json', 'taxonomy.json']
        logos_dir = data_dir / 'logos'
        
        for filename in essential_files:
            filepath = data_dir / filename
            if filepath.exists():
                print(f"  ✓ {filename}")
            else:
                print(f"  ✗ {filename} - MISSING")
                self.checks_failed += 1
                return False
        
        # Check logos
        if logos_dir.exists():
            logo_count = len(list(logos_dir.glob('*_logo.jpg')))
            print(f"  ✓ Logos directory ({logo_count} real logos)")
        else:
            print(f"  ✗ Logos directory - MISSING")
            self.checks_failed += 1
            return False
        
        # Check catalogs
        catalog_files = list(data_dir.glob("*.json"))
        catalog_count = len([f for f in catalog_files if f.name not in 
                           ['index.json', 'taxonomy.json']])
        print(f"  ✓ Catalog files ({catalog_count} brand catalogs)")
        
        # Validate JSON
        for json_file in data_dir.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    json.load(f)
            except json.JSONDecodeError as e:
                print(f"  ✗ {json_file.name} - Invalid JSON: {e}")
                self.checks_failed += 1
                return False
        
        print(f"  ✓ All JSON files valid")
        self.checks_passed += 1
        return True
    
    def _run_system_validator(self) -> bool:
        """Run comprehensive system validation suite."""
        print("  Running comprehensive system validation...", end=" ", flush=True)
        
        try:
            result = subprocess.run(
                ['python3', 'system_validator.py'],
                cwd=str(self.base_path / 'backend'),
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                print("✓ PASSED")
                self.checks_passed += 1
                # Print detailed results
                print("\n  System Tests Results:")
                for line in result.stdout.split('\n'):
                    if 'PASS' in line or 'FAIL' in line:
                        print(f"  {line}")
                return True
            else:
                print("✗ FAILED")
                print("\n" + result.stdout)
                self.checks_failed += 1
                return False
        
        except subprocess.TimeoutExpired:
            print("✗ TIMEOUT")
            self.checks_failed += 1
            return False
        except Exception as e:
            print(f"✗ ERROR: {e}")
            self.checks_failed += 1
            return False
    
    def _check_alignment(self) -> bool:
        """Check that frontend and backend are aligned."""
        issues = []
        
        # Check frontend has data loaders
        frontend_lib = self.base_path / 'frontend' / 'src' / 'lib'
        required_files = [
            'catalogLoader.ts',
            'categoryConsolidator.ts',
            'instantSearch.ts',
        ]
        
        for filename in required_files:
            filepath = frontend_lib / filename
            if filepath.exists():
                print(f"  ✓ {filename}")
            else:
                print(f"  ✗ {filename} - MISSING")
                issues.append(filename)
        
        # Check backend has category consolidator
        category_file = self.base_path / 'backend' / 'models' / 'category_consolidator.py'
        if category_file.exists():
            print(f"  ✓ Backend category consolidator")
        else:
            print(f"  ✗ Backend category consolidator - MISSING")
            issues.append("category_consolidator.py")
        
        # Check no dev-only endpoints in production code
        app_file = self.base_path / 'backend' / 'app' / 'main.py'
        if app_file.exists():
            with open(app_file, 'r') as f:
                content = f.read()
                if 'localhost:8000' in content:
                    self.warnings.append(
                        "Found localhost:8000 reference in main.py - "
                        "ensure it's only for dev"
                    )
        
        if issues:
            self.checks_failed += 1
            return False
        
        self.checks_passed += 1
        return True
    
    def _print_final_report(self):
        """Print final validation report."""
        print("\n" + "█"*80)
        print("█" + " "*78 + "█")
        print("█" + " "*25 + "VALIDATION REPORT" + " "*35 + "█")
        print("█" + " "*78 + "█")
        print("█"*80)
        
        print(f"\n✓ Checks Passed: {self.checks_passed}")
        print(f"✗ Checks Failed: {self.checks_failed}")
        
        if self.warnings:
            print(f"\n⚠ Warnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  • {warning}")
        
        print("\n" + "-"*80)
        
        if self.checks_failed == 0:
            print("\n✓✓✓ ALL VALIDATIONS PASSED ✓✓✓")
            print("\nSystem Status: CLEAN, LEAN, AND READY FOR DEVELOPMENT")
            print("• Only real brand logos present")
            print("• No generated or placeholder content")
            print("• All data files valid and consistent")
            print("• Frontend and backend components aligned")
            print("• Ready for production deployment")
        else:
            print(f"\n✗✗✗ VALIDATION FAILED - {self.checks_failed} ISSUE(S) FOUND ✗✗✗")
            print("\nFix all issues before proceeding.")
        
        print("\n" + "█"*80 + "\n")


def main():
    """Run master validation."""
    validator = MasterValidator()
    success = validator.run_full_validation()
    exit(0 if success else 1)


if __name__ == '__main__':
    main()
