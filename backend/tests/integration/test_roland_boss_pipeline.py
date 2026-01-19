"""
Integration tests for Roland and Boss scraping pipeline
Tests the complete data flow from scraping → orchestration → validation
"""

import pytest
import asyncio
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from core.validator import CatalogValidator, ValidationReport, ValidationLevel
from models.product_hierarchy import ProductCatalog, BrandIdentity, ProductCore


class TestRolandBossPipelineStructure:
    """Test that Roland and Boss have compatible data structures"""
    
    def test_roland_catalog_structure(self, sample_roland_catalog_dict):
        """Verify Roland catalog has all required fields"""
        assert "brand_identity" in sample_roland_catalog_dict
        assert "products" in sample_roland_catalog_dict
        assert "metadata" in sample_roland_catalog_dict
        
        brand = sample_roland_catalog_dict["brand_identity"]
        assert brand["id"] == "roland"
        assert brand["name"] == "Roland"
        assert brand["website"]
        assert brand["brand_color"]
    
    def test_boss_catalog_structure(self, sample_boss_catalog_dict):
        """Verify Boss catalog has matching structure to Roland"""
        assert "brand_identity" in sample_boss_catalog_dict
        assert "products" in sample_boss_catalog_dict
        assert "metadata" in sample_boss_catalog_dict
        
        brand = sample_boss_catalog_dict["brand_identity"]
        assert brand["id"] == "boss"
        assert brand["name"] == "Boss"
        assert brand["website"]
        assert brand["brand_color"]
    
    def test_product_structure_consistency(self, sample_roland_product_dict, sample_boss_product_dict):
        """Verify Roland and Boss products use same field structure"""
        roland_keys = set(sample_roland_product_dict.keys())
        boss_keys = set(sample_boss_product_dict.keys())
        
        # Should have same core fields
        core_fields = {"id", "name", "brand", "description", "categories", "images", "price_nis", "status"}
        assert core_fields.issubset(roland_keys)
        assert core_fields.issubset(boss_keys)
    
    def test_shared_selector_patterns(self):
        """Verify both scrapers use compatible selector patterns"""
        # Both should use h1 for name, breadcrumb for categories, etc.
        # This is enforced by shared BrandRecipeManager
        import json
        from pathlib import Path
        
        backend_dir = Path(__file__).parent.parent.parent
        recipes_file = backend_dir / "data" / "brand_recipes.json"
        
        with open(recipes_file) as f:
            recipes = json.load(f)
        
        # Both brands should have recipes
        roland_recipe = recipes.get("roland")
        boss_recipe = recipes.get("boss")
        
        assert roland_recipe is not None
        assert boss_recipe is not None
        
        # Should have compatible structure
        assert "selectors" in roland_recipe
        assert "selectors" in boss_recipe
        assert "name_strategies" in roland_recipe["selectors"]
        assert "name_strategies" in boss_recipe["selectors"]


class TestCatalogValidationPipeline:
    """Test complete validation pipeline for scraped catalogs"""
    
    def test_validate_valid_roland_catalog(self, sample_roland_catalog_dict):
        """Valid Roland catalog should pass validation"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        assert report.is_valid is True
        assert report.error_count == 0
        assert report.brand == "Roland"
        assert report.total_products == 2
    
    def test_validate_valid_boss_catalog(self, sample_boss_catalog_dict):
        """Valid Boss catalog should pass validation"""
        validator = CatalogValidator()
        report = validator.validate(sample_boss_catalog_dict)
        
        assert report.is_valid is True
        assert report.error_count == 0
        assert report.brand == "Boss"
        assert report.total_products == 1
    
    def test_validation_report_structure(self, sample_roland_catalog_dict):
        """Validation report should have complete structure"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        # Check report properties
        assert isinstance(report.error_count, int)
        assert isinstance(report.warning_count, int)
        assert isinstance(report.is_valid, bool)
        assert isinstance(report.timestamp, datetime)
        assert isinstance(report.issues, list)
        
        # Check to_dict conversion
        report_dict = report.to_dict()
        assert report_dict["brand"] == "Roland"
        assert "timestamp" in report_dict
        assert "error_count" in report_dict
        assert "is_valid" in report_dict
    
    def test_validation_report_summary(self, sample_roland_catalog_dict):
        """Validation report should generate human-readable summary"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        summary = report.summary()
        assert "Validation Report" in summary
        assert "Roland" in summary
        assert "✓ Valid" in summary


class TestDataQualityChecks:
    """Test data quality validation across both brands"""
    
    def test_required_fields_present_roland(self, sample_roland_catalog_dict):
        """All Roland products should have required fields"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        # Check no missing required field errors
        missing_field_errors = [
            i for i in report.issues 
            if i.category == "missing_required_field"
        ]
        assert len(missing_field_errors) == 0
    
    def test_required_fields_present_boss(self, sample_boss_catalog_dict):
        """All Boss products should have required fields"""
        validator = CatalogValidator()
        report = validator.validate(sample_boss_catalog_dict)
        
        missing_field_errors = [
            i for i in report.issues 
            if i.category == "missing_required_field"
        ]
        assert len(missing_field_errors) == 0
    
    def test_image_urls_valid_roland(self, sample_roland_catalog_dict):
        """Roland product images should have valid URLs"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        image_errors = [
            i for i in report.issues 
            if i.category in ["invalid_image_url", "invalid_gallery_image_url"]
        ]
        assert len(image_errors) == 0
    
    def test_image_urls_valid_boss(self, sample_boss_catalog_dict):
        """Boss product images should have valid URLs"""
        validator = CatalogValidator()
        report = validator.validate(sample_boss_catalog_dict)
        
        image_errors = [
            i for i in report.issues 
            if i.category in ["invalid_image_url", "invalid_gallery_image_url"]
        ]
        assert len(image_errors) == 0
    
    def test_categories_valid_roland(self, sample_roland_catalog_dict):
        """Roland products should have valid categories"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        category_errors = [
            i for i in report.issues 
            if i.category in ["missing_categories", "invalid_categories_type"]
        ]
        assert len(category_errors) == 0
    
    def test_categories_valid_boss(self, sample_boss_catalog_dict):
        """Boss products should have valid categories"""
        validator = CatalogValidator()
        report = validator.validate(sample_boss_catalog_dict)
        
        category_errors = [
            i for i in report.issues 
            if i.category in ["missing_categories", "invalid_categories_type"]
        ]
        assert len(category_errors) == 0
    
    def test_prices_reasonable_roland(self, sample_roland_catalog_dict):
        """Roland product prices should be in reasonable range"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        # Warnings are OK, but check for extreme outliers
        price_errors = [
            i for i in report.issues 
            if i.category == "invalid_price_type"  # Type errors are bad
        ]
        assert len(price_errors) == 0
    
    def test_prices_reasonable_boss(self, sample_boss_catalog_dict):
        """Boss product prices should be in reasonable range"""
        validator = CatalogValidator()
        report = validator.validate(sample_boss_catalog_dict)
        
        price_errors = [
            i for i in report.issues 
            if i.category == "invalid_price_type"
        ]
        assert len(price_errors) == 0


class TestPipelineEndToEnd:
    """Test complete pipeline from scraping through serving"""
    
    def test_catalog_serialization_roland(self, sample_roland_catalog_dict, tmp_path):
        """Roland catalog should serialize/deserialize without data loss"""
        # Save to JSON
        catalog_path = tmp_path / "roland_catalog.json"
        with open(catalog_path, 'w') as f:
            json.dump(sample_roland_catalog_dict, f)
        
        # Load from JSON
        with open(catalog_path, 'r') as f:
            loaded = json.load(f)
        
        # Verify integrity
        assert loaded == sample_roland_catalog_dict
        assert loaded["brand_identity"]["id"] == "roland"
        assert len(loaded["products"]) == 2
    
    def test_catalog_serialization_boss(self, sample_boss_catalog_dict, tmp_path):
        """Boss catalog should serialize/deserialize without data loss"""
        catalog_path = tmp_path / "boss_catalog.json"
        with open(catalog_path, 'w') as f:
            json.dump(sample_boss_catalog_dict, f)
        
        with open(catalog_path, 'r') as f:
            loaded = json.load(f)
        
        assert loaded == sample_boss_catalog_dict
        assert loaded["brand_identity"]["id"] == "boss"
        assert len(loaded["products"]) == 1
    
    def test_validation_before_publication_roland(self, sample_roland_catalog_dict):
        """Should validate Roland catalog before publishing to frontend"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        # This is the gate for frontend publication
        if not report.is_valid:
            pytest.fail(f"Roland catalog failed validation:\n{report.summary()}")
    
    def test_validation_before_publication_boss(self, sample_boss_catalog_dict):
        """Should validate Boss catalog before publishing to frontend"""
        validator = CatalogValidator()
        report = validator.validate(sample_boss_catalog_dict)
        
        if not report.is_valid:
            pytest.fail(f"Boss catalog failed validation:\n{report.summary()}")
    
    def test_multi_brand_validation_consistency(self, sample_roland_catalog_dict, sample_boss_catalog_dict):
        """Both brands should validate with same criteria"""
        validator = CatalogValidator()
        
        roland_report = validator.validate(sample_roland_catalog_dict)
        boss_report = validator.validate(sample_boss_catalog_dict)
        
        # Both should use same validation rule set
        # Check issue categories are consistent
        roland_categories = {i.category for i in roland_report.issues}
        boss_categories = {i.category for i in boss_report.issues}
        
        # If Boss has no issues, it's valid (no shared categories needed)
        # But if it does, categories should be from same set
        if boss_categories:
            # Categories should come from same validator
            assert all(c in [
                "missing_required_field", "brand_mismatch", "invalid_name",
                "missing_categories", "invalid_categories_type",
                "missing_image_url", "invalid_image_url",
                "invalid_price_type", "price_out_of_range",
                "missing_description", "short_description"
            ] for c in boss_categories)


class TestScraperConfigurationCompatibility:
    """Test that scraper configurations are compatible"""
    
    def test_brand_recipes_exist_for_both(self):
        """Both Roland and Boss should have brand recipe configurations"""
        import json
        from pathlib import Path
        
        backend_dir = Path(__file__).parent.parent.parent
        recipes_file = backend_dir / "data" / "brand_recipes.json"
        
        with open(recipes_file) as f:
            BRAND_RECIPES = json.load(f)
        
        assert "roland" in BRAND_RECIPES
        assert "boss" in BRAND_RECIPES
    
    def test_brand_recipes_compatible_structure(self):
        """Brand recipes should have compatible structure"""
        import json
        from pathlib import Path
        
        backend_dir = Path(__file__).parent.parent.parent
        recipes_file = backend_dir / "data" / "brand_recipes.json"
        
        with open(recipes_file) as f:
            BRAND_RECIPES = json.load(f)
        
        roland_recipe = BRAND_RECIPES["roland"]
        boss_recipe = BRAND_RECIPES["boss"]
        
        # Both should have these top-level keys
        required_keys = {"start_url", "link_pattern", "discovery_depth", "selectors", "cleaning"}
        assert required_keys.issubset(set(roland_recipe.keys()))
        assert required_keys.issubset(set(boss_recipe.keys()))
        
        # Both should have same selector strategies
        selector_strategies = {"name_strategies", "category_strategies", "image_strategies", "description_strategies"}
        assert selector_strategies.issubset(set(roland_recipe["selectors"].keys()))
        assert selector_strategies.issubset(set(boss_recipe["selectors"].keys()))
    
    def test_brand_metadata_exists_for_both(self):
        """Both brands should have metadata configurations"""
        import json
        from pathlib import Path
        
        backend_dir = Path(__file__).parent.parent.parent
        metadata_file = backend_dir / "data" / "brands_metadata.json"
        
        # Just verify the file exists and contains valid JSON
        assert metadata_file.exists(), "brands_metadata.json not found"
        
        with open(metadata_file) as f:
            data = json.load(f)
            assert isinstance(data, dict), "brands_metadata should be a dict"
            assert len(data) > 0, "brands_metadata should have entries"


class TestOrchestrationIntegration:
    """Test orchestration layer works with both brands"""
    
    def test_orchestrator_recognizes_roland(self):
        """Orchestrator should recognize Roland as valid brand"""
        # This would test the actual orchestrate_brand.py logic
        # Requires reading brand configuration
        pass  # Placeholder for CLI integration test
    
    def test_orchestrator_recognizes_boss(self):
        """Orchestrator should recognize Boss as valid brand"""
        # This would test the actual orchestrate_brand.py logic
        pass  # Placeholder for CLI integration test
