#!/usr/bin/env python3
"""
System Validator for HSC JIT v3.5
Checks that all required components are in place and ready for dual-source sync
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Tuple


class SystemValidator:
    def __init__(self):
        self.backend_dir = Path(__file__).parent.parent
        self.data_dir = self.backend_dir / "data"
        self.scripts_dir = self.backend_dir / "scripts"
        self.issues = []
        self.warnings = []
        self.passed = []

    def validate_all(self) -> Tuple[bool, List[str], List[str], List[str]]:
        """Run all validation checks"""
        print("=" * 80)
        print("HSC JIT v3.5 - SYSTEM VALIDATION")
        print("=" * 80)
        print()

        self._check_required_scripts()
        self._check_data_structure()
        self._check_halilit_brands_file()
        self._check_configuration_files()
        self._check_brand_configs()
        self._check_directories()

        self._print_results()
        return len(self.issues) == 0, self.issues, self.warnings, self.passed

    def _check_required_scripts(self):
        """Check that all required Python scripts exist"""
        print("Checking required scripts...")

        required_scripts = [
            "extract_halilit_brands.py",
            "halilit_scraper.py",
            "gap_analyzer.py",
            "unified_catalog_builder.py",
            "master_sync.py",
            "diplomat.py",
            "harvest_all_brands.py",
        ]

        for script in required_scripts:
            script_path = self.scripts_dir / script
            if script_path.exists():
                self.passed.append(f"✅ Script: {script}")
            else:
                self.issues.append(f"❌ Missing script: {script}")

    def _check_data_structure(self):
        """Check that required data directories exist"""
        print("Checking data structure...")

        required_dirs = [
            "brands",
            "catalogs",
        ]

        for dir_name in required_dirs:
            dir_path = self.data_dir / dir_name
            if dir_path.exists():
                self.passed.append(f"✅ Directory: {dir_name}/")
            else:
                self.issues.append(f"❌ Missing directory: {dir_name}/")

        # Check optional but important directories
        optional_dirs = [
            "catalogs_halilit",
            "catalogs_unified",
            "gap_reports",
        ]

        for dir_name in optional_dirs:
            dir_path = self.data_dir / dir_name
            if dir_path.exists():
                self.passed.append(f"✅ Optional directory exists: {dir_name}/")
            else:
                self.warnings.append(
                    f"⚠️  Optional directory not found: {dir_name}/ (will be created during sync)")

    def _check_halilit_brands_file(self):
        """Check that halilit_official_brands.json exists and is valid"""
        print("Checking Halilit official brands...")

        brands_file = self.data_dir / "halilit_official_brands.json"

        if not brands_file.exists():
            self.issues.append(f"❌ Missing: halilit_official_brands.json")
            return

        try:
            with open(brands_file) as f:
                data = json.load(f)

            if "brands" not in data:
                self.issues.append(
                    "❌ Invalid halilit_official_brands.json: missing 'brands' key")
                return

            brands = data["brands"]
            if not isinstance(brands, list):
                self.issues.append(
                    "❌ Invalid halilit_official_brands.json: 'brands' is not a list")
                return

            if len(brands) == 0:
                self.issues.append(
                    "❌ halilit_official_brands.json is empty (no brands)")
                return

            # Check required fields
            required_fields = ["id", "name", "url"]
            missing_fields = []

            for brand in brands:
                for field in required_fields:
                    if field not in brand:
                        missing_fields.append(
                            f"Brand '{brand.get('name', 'UNKNOWN')}' missing field: {field}")

            if missing_fields:
                for msg in missing_fields[:3]:  # Show first 3
                    self.issues.append(f"❌ {msg}")
                if len(missing_fields) > 3:
                    self.issues.append(
                        f"❌ ... and {len(missing_fields) - 3} more field issues")
                return

            self.passed.append(
                f"✅ halilit_official_brands.json valid ({len(brands)} brands)")

        except json.JSONDecodeError:
            self.issues.append(
                "❌ halilit_official_brands.json is invalid JSON")
        except Exception as e:
            self.issues.append(
                f"❌ Error reading halilit_official_brands.json: {str(e)}")

    def _check_configuration_files(self):
        """Check that important config files exist"""
        print("Checking configuration files...")

        configs = [
            ("brands_metadata.json", self.data_dir /
             "brands" / "brands_metadata.json"),
        ]

        for name, path in configs:
            if path.exists():
                try:
                    with open(path) as f:
                        json.load(f)
                    self.passed.append(f"✅ Config: {name} (valid JSON)")
                except json.JSONDecodeError:
                    self.issues.append(f"❌ Config {name} is invalid JSON")
                except Exception as e:
                    self.issues.append(f"❌ Error reading {name}: {str(e)}")
            else:
                self.warnings.append(f"⚠️  Optional config not found: {name}")

    def _check_brand_configs(self):
        """Check brand-specific configuration files"""
        print("Checking brand configurations...")

        brands_dir = self.data_dir / "brands"
        brand_count = 0
        brands_with_configs = 0

        if brands_dir.exists():
            for brand_path in brands_dir.iterdir():
                if brand_path.is_dir() and not brand_path.name.startswith('.'):
                    brand_count += 1
                    scrape_config = brand_path / "scrape_config.json"
                    if scrape_config.exists():
                        brands_with_configs += 1

        if brand_count > 0:
            self.passed.append(f"✅ Found {brand_count} brand directories")
            if brands_with_configs > 0:
                self.passed.append(
                    f"✅ Found {brands_with_configs} brands with scrape configs")
        else:
            self.warnings.append(
                "⚠️  No brand directories found (expected after initial setup)")

    def _check_directories(self):
        """Check that output directories can be created"""
        print("Checking directory permissions...")

        # These should be writable
        check_dirs = [
            self.data_dir / "catalogs",
            self.scripts_dir,
        ]

        for dir_path in check_dirs:
            if dir_path.exists():
                if os.access(dir_path, os.W_OK):
                    self.passed.append(f"✅ Writable: {dir_path.name}/")
                else:
                    self.issues.append(f"❌ Not writable: {dir_path.name}/")
            else:
                self.issues.append(
                    f"❌ Directory doesn't exist: {dir_path.name}/")

    def _print_results(self):
        """Print validation results"""
        print()
        print("=" * 80)
        print("VALIDATION RESULTS")
        print("=" * 80)
        print()

        if self.passed:
            print("PASSED CHECKS:")
            for item in self.passed:
                print(f"  {item}")
            print()

        if self.warnings:
            print("WARNINGS:")
            for item in self.warnings:
                print(f"  {item}")
            print()

        if self.issues:
            print("ISSUES (BLOCKING):")
            for item in self.issues:
                print(f"  {item}")
            print()

        # Summary
        print("=" * 80)
        if self.issues:
            print("❌ VALIDATION FAILED - Fix issues above before running sync")
            print()
            print("Common fixes:")
            print("  1. Run: python scripts/extract_halilit_brands.py")
            print("  2. Verify halilit_official_brands.json exists")
            print("  3. Check directory permissions")
        elif self.warnings:
            print("⚠️  VALIDATION WARNING - System functional but check warnings")
            print()
            print("Next steps:")
            print("  1. Run: python scripts/master_sync.py --priority")
            print("  2. Monitor output for errors")
            print("  3. Check gap_reports/ for results")
        else:
            print("✅ VALIDATION PASSED - System ready for dual-source sync")
            print()
            print("Next steps:")
            print("  1. Run: python scripts/master_sync.py --priority")
            print("  2. Wait for sync to complete (~45 minutes)")
            print("  3. Check sync_results.json for summary")
            print("  4. Review gap_reports/ for gap analysis")

        print("=" * 80)
        print()


def main():
    validator = SystemValidator()
    success, issues, warnings, passed = validator.validate_all()

    if not success:
        exit(1)


if __name__ == "__main__":
    main()
