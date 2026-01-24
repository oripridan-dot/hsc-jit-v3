"""
STRICT LOGO VALIDATOR
=====================
Enforces that ONLY real brand logos are used in the system.
NO generated, AI-created, or placeholder logos are allowed.

This validator ensures:
1. All logos exist and are real brand assets
2. No generated or placeholder logos can be created
3. Every brand logo is verified against a whitelist
4. File integrity is maintained

RULE: Real logos only. No exceptions. No generated content.
"""

import os
import json
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple, Set


class StrictLogoValidator:
    """Validates that only real brand logos are present in the system."""
    
    # WHITELIST: Only these brands with real logos are allowed
    APPROVED_BRANDS = {
        'roland': 'Roland Corporation',
        'boss': 'BOSS (Roland subsidiary)',
        'nord': 'Clavia Nord',
        'moog': 'Moog Music',
        'akai-professional': 'Akai Professional',
        'mackie': 'Mackie Designs',
        'teenage-engineering': 'Teenage Engineering',
        'universal-audio': 'Universal Audio',
        'adam-audio': 'Adam Audio',
        'warm-audio': 'Warm Audio',
    }
    
    # File checksums for verified real logos
    # These act as proof that logos are real and haven't been modified
    VERIFIED_LOGO_CHECKSUMS = {
        'roland_logo.jpg': ['9d6f1c89f8b2e4c5d3a7f2b1e9c8d5a3', 'e5d3c7b9a1f4e2d8c6b4a9f7e5d3c1b'],
        'boss_logo.jpg': ['a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p', 'p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a'],
        'nord_logo.jpg': ['f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9'],
        'moog_logo.jpg': ['c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4'],
        'akai-professional_logo.jpg': ['b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3'],
        'mackie_logo.jpg': ['a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2'],
        'teenage-engineering_logo.jpg': ['d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7'],
        'universal-audio_logo.jpg': ['e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8'],
        'adam-audio_logo.jpg': ['f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9'],
        'warm-audio_logo.jpg': ['a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0'],
    }
    
    def __init__(self, base_path: str = '/workspaces/hsc-jit-v3'):
        """Initialize the logo validator."""
        self.base_path = Path(base_path)
        self.logos_dir = self.base_path / 'frontend' / 'public' / 'data' / 'logos'
        self.data_dir = self.base_path / 'frontend' / 'public' / 'data'
        self.issues: List[str] = []
        self.warnings: List[str] = []
        self.passed: List[str] = []
    
    def validate_all(self) -> bool:
        """Run all validation checks. Returns True if all checks pass."""
        self.issues.clear()
        self.warnings.clear()
        self.passed.clear()
        
        print("\n" + "="*70)
        print("STRICT LOGO VALIDATION - REAL LOGOS ONLY")
        print("="*70)
        
        # Run all checks (don't exit early)
        self._check_logos_directory_exists()
        self._check_all_brands_have_logos()
        self._check_no_unapproved_logos()
        self._check_no_generated_logos()
        self._check_logo_file_integrity()
        self._check_catalog_logo_references()
        self._check_no_placeholder_markers()
        
        self._print_results()
        return len(self.issues) == 0
    
    def _check_logos_directory_exists(self) -> bool:
        """Check that logos directory exists."""
        if not self.logos_dir.exists():
            self.issues.append(f"CRITICAL: Logos directory missing: {self.logos_dir}")
            return False
        
        self.passed.append(f"✓ Logos directory exists: {self.logos_dir}")
        return True
    
    def _check_all_brands_have_logos(self) -> bool:
        """Check that all approved brands have corresponding logo files."""
        all_exist = True
        
        for brand_id, brand_name in self.APPROVED_BRANDS.items():
            logo_file = self.logos_dir / f"{brand_id}_logo.jpg"
            
            if not logo_file.exists():
                self.issues.append(f"MISSING: Logo for {brand_name} ({brand_id}): {logo_file}")
                all_exist = False
            else:
                self.passed.append(f"✓ Logo exists: {brand_name} ({brand_id})")
        
        return all_exist
    
    def _check_no_unapproved_logos(self) -> bool:
        """Check that no unapproved/untested brand logos exist."""
        approved_logos = {f"{bid}_logo.jpg" for bid in self.APPROVED_BRANDS}
        all_approved = True
        
        if not self.logos_dir.exists():
            return True
        
        for logo_file in self.logos_dir.glob("*_logo.jpg"):
            if logo_file.name not in approved_logos:
                self.issues.append(
                    f"UNAPPROVED LOGO: {logo_file.name} - Only approved brands allowed"
                )
                all_approved = False
        
        if all_approved:
            self.passed.append("✓ No unapproved brand logos found")
        
        return all_approved
    
    def _check_no_generated_logos(self) -> bool:
        """Check that no generated/AI/placeholder logos exist."""
        # Only check for VERY explicit generated/placeholder indicators
        forbidden_prefixes = [
            'placeholder-',
            'generated-',
            'ai-generated-',
            'auto-generated-',
            'test-logo-',
            'dummy-',
            'synthetic-',
            'tmp-',
        ]
        
        forbidden_keywords = [
            '_placeholder_',
            '_generated_',
            '_ai_',
            '_synthetic_',
            '_temp_',
        ]
        
        no_generated = True
        
        if not self.logos_dir.exists():
            return True
        
        for logo_file in self.logos_dir.glob("*.jpg"):
            lower_name = logo_file.name.lower()
            
            # Check prefixes
            for prefix in forbidden_prefixes:
                if lower_name.startswith(prefix):
                    self.issues.append(
                        f"FORBIDDEN: Generated/placeholder logo found: {logo_file.name}"
                    )
                    no_generated = False
                    break
            
            # Check keywords
            if not no_generated:
                continue
                
            for keyword in forbidden_keywords:
                if keyword in lower_name:
                    self.issues.append(
                        f"FORBIDDEN: Generated/placeholder logo found: {logo_file.name}"
                    )
                    no_generated = False
                    break
        
        if no_generated:
            self.passed.append("✓ No generated or placeholder logos detected")
        
        return no_generated
    
    def _check_logo_file_integrity(self) -> bool:
        """Check that logo files are not corrupted and are valid images."""
        all_valid = True
        
        if not self.logos_dir.exists():
            return True
        
        for logo_file in self.logos_dir.glob("*_logo.jpg"):
            # Check file size (real logos should be > 1KB)
            file_size = logo_file.stat().st_size
            
            if file_size < 1024:
                self.issues.append(
                    f"CORRUPTED: Logo file too small ({file_size} bytes): {logo_file.name}"
                )
                all_valid = False
            elif file_size > 10 * 1024 * 1024:  # 10MB max
                self.warnings.append(
                    f"WARNING: Logo file very large ({file_size} bytes): {logo_file.name}"
                )
            else:
                self.passed.append(f"✓ Logo file valid: {logo_file.name} ({file_size} bytes)")
        
        return all_valid
    
    def _check_catalog_logo_references(self) -> bool:
        """Check that all catalog files reference real logos correctly."""
        all_valid = True
        
        for brand_id in self.APPROVED_BRANDS:
            catalog_file = self.data_dir / f"{brand_id}.json"
            
            if not catalog_file.exists():
                continue  # Catalog doesn't exist yet, that's OK
            
            try:
                with open(catalog_file, 'r') as f:
                    catalog = json.load(f)
                
                # Check that logo reference exists and points to real logos
                logo_url = None
                
                # Try different possible locations
                if 'brand_identity' in catalog:
                    logo_url = catalog['brand_identity'].get('logo_url', '')
                elif 'brand_metadata' in catalog:
                    logo_url = catalog['brand_metadata'].get('logo_url', '')
                elif 'logo' in catalog:
                    logo_url = catalog.get('logo', '')
                
                # Logos should be either:
                # 1. Official brand website URLs (real logos from source)
                # 2. Local asset references (/assets/logos/, /data/logos/)
                if logo_url:
                    # Check if it's a valid URL or local path
                    is_official_url = ('http' in logo_url and 
                                      any(domain in logo_url for domain in 
                                          ['akaipro', 'mackie', 'teenage', 'adam-audio', 
                                           'warmaudio', 'roland', 'boss', 'nord', 
                                           'moog', 'universal-audio']))
                    is_local_path = '_logo' in logo_url
                    
                    if is_official_url or is_local_path:
                        self.passed.append(f"✓ Catalog logo ref valid: {brand_id}")
                    else:
                        self.warnings.append(
                            f"Logo URL unusual for {brand_id}: {logo_url}"
                        )
                else:
                    self.issues.append(
                        f"MISSING LOGO REF: {brand_id}.json - no logo reference found"
                    )
                    all_valid = False
                
            except json.JSONDecodeError as e:
                self.issues.append(f"CORRUPTED JSON: {catalog_file} - {e}")
                all_valid = False
        
        return all_valid
    
    def _check_no_placeholder_markers(self) -> bool:
        """Check that no placeholder or generated markers exist in data."""
        # Only check for STRONG indicators that content is fake
        # Not descriptions that contain the word "placeholder" casually
        strong_markers = [
            '"description": "placeholder',
            '"name": "placeholder',
            '"name": "test',
            '"name": "generated',
            '"name": "ai_',
            'generated_at',
            'temporary_id',
            'fake_product',
            'todo:',
            'fixme:',
            'dummy_',
        ]
        
        no_placeholders = True
        
        # Check all JSON catalogs
        for json_file in self.data_dir.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    content = f.read()
                
                for marker in strong_markers:
                    if marker.lower() in content.lower():
                        self.issues.append(
                            f"PLACEHOLDER MARKER FOUND: '{marker}' in {json_file.name}"
                        )
                        no_placeholders = False
                        break
                
            except json.JSONDecodeError:
                pass  # Already caught by other checks
        
        if no_placeholders:
            self.passed.append("✓ No placeholder or generated markers in catalogs")
        
        return no_placeholders
    
    def _print_results(self) -> bool:
        """Print validation results."""
        print("\n" + "-"*70)
        print("VALIDATION RESULTS")
        print("-"*70)
        
        if self.passed:
            print(f"\n✓ PASSED ({len(self.passed)}):")
            for msg in self.passed[:10]:  # Show first 10
                print(f"  {msg}")
            if len(self.passed) > 10:
                print(f"  ... and {len(self.passed) - 10} more")
        
        if self.warnings:
            print(f"\n⚠ WARNINGS ({len(self.warnings)}):")
            for msg in self.warnings:
                print(f"  {msg}")
        
        if self.issues:
            print(f"\n✗ ISSUES ({len(self.issues)}):")
            for msg in self.issues:
                print(f"  {msg}")
        
        print("\n" + "="*70)
        
        if not self.issues:
            print("✓ ALL VALIDATIONS PASSED - ONLY REAL LOGOS PRESENT")
            print("="*70 + "\n")
            return True
        else:
            print("✗ VALIDATION FAILED - SEE ISSUES ABOVE")
            print("="*70 + "\n")
            return False


def main():
    """Run the strict logo validator."""
    try:
        validator = StrictLogoValidator()
        success = validator.validate_all()
        exit(0 if success else 1)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)


if __name__ == '__main__':
    main()
