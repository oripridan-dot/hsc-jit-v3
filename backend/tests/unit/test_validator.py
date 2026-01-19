"""
Unit tests for data quality validator
"""

import pytest
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from core.validator import (
    ProductValidator, CatalogValidator, ValidationLevel, ValidationScope,
    ValidationIssue, ValidationReport
)


class TestProductValidator:
    """Tests for single product validation"""
    
    def test_valid_product_no_issues(self, sample_roland_product_dict):
        """Valid product should pass with no errors"""
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is True
        assert len([i for i in issues if i.level == ValidationLevel.ERROR]) == 0
    
    def test_missing_required_field_name(self, sample_roland_product_dict):
        """Missing name should error"""
        del sample_roland_product_dict["name"]
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.level == ValidationLevel.ERROR and i.field_name == "name"]
        assert len(errors) > 0
    
    def test_missing_required_field_id(self, sample_roland_product_dict):
        """Missing ID should error"""
        del sample_roland_product_dict["id"]
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.level == ValidationLevel.ERROR and i.field_name == "id"]
        assert len(errors) > 0
    
    def test_missing_required_field_brand(self, sample_roland_product_dict):
        """Missing brand should error"""
        del sample_roland_product_dict["brand"]
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.level == ValidationLevel.ERROR and i.field_name == "brand"]
        assert len(errors) > 0
    
    def test_missing_required_field_categories(self, sample_roland_product_dict):
        """Missing categories should error"""
        del sample_roland_product_dict["categories"]
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.level == ValidationLevel.ERROR and i.field_name == "categories"]
        assert len(errors) > 0
    
    def test_brand_mismatch(self, sample_roland_product_dict):
        """Brand mismatch with catalog should error"""
        sample_roland_product_dict["brand"] = "Boss"
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.category == "brand_mismatch"]
        assert len(errors) > 0
    
    def test_invalid_name_empty(self, sample_roland_product_dict):
        """Empty name should error"""
        sample_roland_product_dict["name"] = ""
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.category == "invalid_name"]
        assert len(errors) > 0
    
    def test_invalid_name_single_char(self, sample_roland_product_dict):
        """Single character name should error"""
        sample_roland_product_dict["name"] = "A"
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.category == "invalid_name"]
        assert len(errors) > 0
    
    def test_name_too_long_warning(self, sample_roland_product_dict):
        """Very long name should warn"""
        sample_roland_product_dict["name"] = "A" * 600
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        # Should still be valid (warning not error)
        assert is_valid is True
        warnings = [i for i in issues if i.level == ValidationLevel.WARNING and i.category == "name_too_long"]
        assert len(warnings) > 0
    
    def test_empty_categories_list(self, sample_roland_product_dict):
        """Empty categories list should error"""
        sample_roland_product_dict["categories"] = []
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.category == "missing_categories"]
        assert len(errors) > 0
    
    def test_invalid_categories_type(self, sample_roland_product_dict):
        """Categories as string instead of list should error"""
        sample_roland_product_dict["categories"] = "Drums"
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.category == "invalid_categories_type"]
        assert len(errors) > 0
    
    def test_missing_image_url_warning(self, sample_roland_product_dict):
        """Missing image_url should warn (not error)"""
        sample_roland_product_dict["image_url"] = ""
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        # Still valid (warning)
        assert is_valid is True
        warnings = [i for i in issues if i.category == "missing_image_url"]
        assert len(warnings) > 0
    
    def test_invalid_image_url_malformed(self, sample_roland_product_dict):
        """Malformed image URL should error"""
        sample_roland_product_dict["image_url"] = "not-a-url"
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.category == "invalid_image_url"]
        assert len(errors) > 0
    
    def test_valid_image_url_formats(self, sample_roland_product_dict):
        """Test various valid URL formats"""
        valid_urls = [
            "https://example.com/image.png",
            "http://example.com/image.jpg",
            "https://cdn.example.com/path/to/image.jpeg",
            "https://example.com/image.webp",
        ]
        
        validator = ProductValidator()
        for url in valid_urls:
            sample_roland_product_dict["image_url"] = url
            is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
            
            url_errors = [i for i in issues if i.category == "invalid_image_url"]
            assert len(url_errors) == 0, f"URL {url} should be valid"
    
    def test_price_below_minimum_warning(self, sample_roland_product_dict):
        """Price below minimum should warn"""
        sample_roland_product_dict["price_nis"] = 10.0
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is True
        warnings = [i for i in issues if i.category == "price_out_of_range"]
        assert len(warnings) > 0
    
    def test_price_above_maximum_warning(self, sample_roland_product_dict):
        """Price above maximum should warn"""
        sample_roland_product_dict["price_nis"] = 150000.0
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is True
        warnings = [i for i in issues if i.category == "price_out_of_range"]
        assert len(warnings) > 0
    
    def test_invalid_price_type(self, sample_roland_product_dict):
        """Price as string should error"""
        sample_roland_product_dict["price_nis"] = "4999"
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is False
        errors = [i for i in issues if i.category == "invalid_price_type"]
        assert len(errors) > 0
    
    def test_missing_description_warning(self, sample_roland_product_dict):
        """Missing description should warn"""
        sample_roland_product_dict["description"] = ""
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        assert is_valid is True
        warnings = [i for i in issues if i.category == "missing_description"]
        assert len(warnings) > 0
    
    def test_short_description_warning(self, sample_roland_product_dict):
        """Description under 10 chars should warn"""
        sample_roland_product_dict["description"] = "Short desc"  # Exactly 10 chars, should be OK
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        
        sample_roland_product_dict["description"] = "Short"  # Less than 10 chars
        is_valid, issues = validator.validate(sample_roland_product_dict, "Roland")
        warnings = [i for i in issues if i.category == "short_description"]
        assert len(warnings) > 0
    
    def test_valid_boss_product(self, sample_boss_product_dict):
        """Boss product should validate with Boss brand"""
        validator = ProductValidator()
        is_valid, issues = validator.validate(sample_boss_product_dict, "Boss")
        
        assert is_valid is True
        assert len([i for i in issues if i.level == ValidationLevel.ERROR]) == 0


class TestCatalogValidator:
    """Tests for complete catalog validation"""
    
    def test_valid_roland_catalog(self, sample_roland_catalog_dict):
        """Valid Roland catalog should pass"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        assert report.is_valid is True
        assert report.error_count == 0
        assert report.total_products == 2
        assert report.brand == "Roland"
    
    def test_valid_boss_catalog(self, sample_boss_catalog_dict):
        """Valid Boss catalog should pass"""
        validator = CatalogValidator()
        report = validator.validate(sample_boss_catalog_dict)
        
        assert report.is_valid is True
        assert report.error_count == 0
        assert report.total_products == 1
        assert report.brand == "Boss"
    
    def test_empty_catalog_error(self, sample_roland_catalog_dict):
        """Catalog with no products should error"""
        sample_roland_catalog_dict["products"] = []
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        assert report.is_valid is False
        assert report.error_count > 0
    
    def test_missing_brand_identity_error(self, sample_roland_catalog_dict):
        """Catalog without brand_identity should error"""
        del sample_roland_catalog_dict["brand_identity"]
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        assert report.is_valid is False
        errors = [i for i in report.issues if i.category == "missing_brand_identity"]
        assert len(errors) > 0
    
    def test_duplicate_product_ids_error(self, sample_roland_catalog_dict):
        """Duplicate product IDs should error"""
        sample_roland_catalog_dict["products"][1]["id"] = sample_roland_catalog_dict["products"][0]["id"]
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        assert report.is_valid is False
        errors = [i for i in report.issues if i.category == "duplicate_product_id"]
        assert len(errors) > 0
    
    def test_validation_report_summary(self, sample_roland_catalog_dict):
        """Validation report should generate readable summary"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        summary = report.summary()
        assert "Validation Report" in summary
        assert "Roland" in summary
        assert "2 products" in summary
    
    def test_validation_report_to_dict(self, sample_roland_catalog_dict):
        """Validation report should convert to dict"""
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        report_dict = report.to_dict()
        assert report_dict["brand"] == "Roland"
        assert report_dict["total_products"] == 2
        assert report_dict["is_valid"] is True
        assert "timestamp" in report_dict
    
    def test_mixed_product_issues_in_catalog(self, sample_roland_catalog_dict):
        """Catalog with some invalid products should report all issues"""
        # Make second product invalid
        sample_roland_catalog_dict["products"][1]["brand"] = "Boss"
        
        validator = CatalogValidator()
        report = validator.validate(sample_roland_catalog_dict)
        
        assert report.is_valid is False
        assert report.error_count > 0
        
        # Should have specific product error
        product_errors = [i for i in report.issues if i.product_id == "fa-08"]
        assert len(product_errors) > 0
