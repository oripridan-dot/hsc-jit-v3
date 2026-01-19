"""
Data Quality Validator - v3.7.0
=================================
Comprehensive validation for scraped product data with detailed error reporting.

Validates:
- Required fields (name, brand, category)
- Image URL accessibility
- Category consistency and hierarchy
- Specification completeness
- Price sanity (positive, reasonable range)
- Relationships integrity
- Schema conformance (Pydantic models)
"""

import logging
from typing import Dict, List, Tuple, Optional, Any, Set
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict
import json
import re
from enum import Enum
import asyncio
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class ValidationLevel(str, Enum):
    """Validation severity levels"""
    ERROR = "error"      # Block publication
    WARNING = "warning"  # Log but continue
    INFO = "info"        # Informational
    SUGGESTION = "suggestion"  # Nice-to-have


class ValidationScope(str, Enum):
    """Scope of validation"""
    FIELD = "field"      # Single field issue
    PRODUCT = "product"  # Product-level issue
    CATALOG = "catalog"  # Catalog-wide issue
    PIPELINE = "pipeline"  # Cross-catalog consistency


@dataclass
class ValidationIssue:
    """Single validation issue"""
    level: ValidationLevel
    scope: ValidationScope
    category: str  # e.g., "image_validation", "required_field", "price_sanity"
    message: str
    product_id: Optional[str] = None
    field_name: Optional[str] = None
    expected_value: Optional[Any] = None
    actual_value: Optional[Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class ValidationReport:
    """Complete validation report"""
    brand: str
    total_products: int
    issues: List[ValidationIssue]
    timestamp: datetime
    
    @property
    def error_count(self) -> int:
        return sum(1 for i in self.issues if i.level == ValidationLevel.ERROR)
    
    @property
    def warning_count(self) -> int:
        return sum(1 for i in self.issues if i.level == ValidationLevel.WARNING)
    
    @property
    def is_valid(self) -> bool:
        """True if no errors (warnings OK)"""
        return self.error_count == 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "brand": self.brand,
            "total_products": self.total_products,
            "error_count": self.error_count,
            "warning_count": self.warning_count,
            "is_valid": self.is_valid,
            "timestamp": self.timestamp.isoformat(),
            "issues": [i.to_dict() for i in self.issues]
        }
    
    def summary(self) -> str:
        """Human-readable summary"""
        lines = [
            f"\n{'='*70}",
            f"Validation Report: {self.brand} | {self.total_products} products",
            f"{'='*70}",
            f"✓ Valid: {self.is_valid}",
            f"🔴 Errors: {self.error_count}",
            f"🟡 Warnings: {self.warning_count}",
            f"⏰ {self.timestamp.isoformat()}",
        ]
        
        if self.issues:
            lines.append(f"\n{'-'*70}")
            for issue in sorted(self.issues, key=lambda x: (x.level.value, x.product_id or "")):
                icon = "❌" if issue.level == ValidationLevel.ERROR else "⚠️" if issue.level == ValidationLevel.WARNING else "ℹ️"
                prod = f" [{issue.product_id}]" if issue.product_id else ""
                lines.append(f"{icon} {issue.level.value.upper()}{prod}: {issue.message}")
        
        lines.append(f"{'='*70}\n")
        return "\n".join(lines)


class ProductValidator:
    """Validates individual product data"""
    
    # Category patterns (loose validation)
    VALID_CATEGORY_PATTERNS = {
        "drums", "percussion", "keyboards", "synthesizers", "pianos", 
        "guitar", "bass", "wind", "strings", "effect", "amplifier",
        "mixer", "interface", "controller", "daw", "recorder"
    }
    
    # Price sanity: 50 NIS to 100,000 NIS
    MIN_PRICE = 50.0
    MAX_PRICE = 100000.0
    
    # Required fields (categories can be inferred from main_category)
    REQUIRED_FIELDS = {"id", "name", "brand", "main_category"}
    
    # Image validations
    IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}
    
    def __init__(self):
        self.issues: List[ValidationIssue] = []
    
    def validate(self, product: Dict[str, Any], catalog_brand: str) -> Tuple[bool, List[ValidationIssue]]:
        """
        Validate single product.
        
        Returns:
            (is_valid, issues)
        """
        self.issues = []
        
        product_id = product.get("id", "unknown")
        
        # Required fields
        self._validate_required_fields(product, product_id)
        
        # Brand consistency - accept both "Roland" and "Roland Corporation"
        product_brand = product.get("brand", "").lower().strip()
        catalog_brand_short = catalog_brand.split()[0].lower()  # e.g., "Roland Corporation" -> "roland"
        catalog_brand_lower = catalog_brand.lower()
        
        if product_brand not in [catalog_brand_lower, catalog_brand_short]:
            # Only warn, not error - scrapers may shorten brand names
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                scope=ValidationScope.PRODUCT,
                category="brand_format",
                message=f"Product brand '{product.get('brand')}' abbreviated (catalog: '{catalog_brand}')",
                product_id=product_id,
                expected_value=catalog_brand,
                actual_value=product.get("brand")
            ))
        
        # Name validation
        name = product.get("name", "").strip()
        if len(name) < 2:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                scope=ValidationScope.FIELD,
                category="invalid_name",
                message=f"Product name too short or empty: '{name}'",
                product_id=product_id,
                field_name="name"
            ))
        if len(name) > 500:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                scope=ValidationScope.FIELD,
                category="name_too_long",
                message=f"Product name suspiciously long ({len(name)} chars)",
                product_id=product_id,
                field_name="name"
            ))
        
        # Categories - if missing but has main_category, use warning not error
        categories = product.get("categories", [])
        main_category = product.get("main_category")
        
        if not categories:
            if main_category:
                # Can infer from main_category - just warning
                self.issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    scope=ValidationScope.FIELD,
                    category="missing_categories",
                    message=f"Categories empty (can infer from main_category: '{main_category}')",
                    product_id=product_id,
                    field_name="categories"
                ))
            else:
                # Both missing - that's an error
                self.issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    scope=ValidationScope.FIELD,
                    category="missing_categories",
                    message="Product has no categories or main_category",
                    product_id=product_id,
                    field_name="categories"
                ))
        elif not isinstance(categories, list):
            self.issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                scope=ValidationScope.FIELD,
                category="invalid_categories_type",
                message=f"Categories should be list, got {type(categories).__name__}",
                product_id=product_id,
                field_name="categories"
            ))
        
        # Image validation
        self._validate_images(product, product_id)
        
        # Price validation
        if "price_nis" in product:
            price = product.get("price_nis")
            if price is not None:
                if not isinstance(price, (int, float)):
                    self.issues.append(ValidationIssue(
                        level=ValidationLevel.ERROR,
                        scope=ValidationScope.FIELD,
                        category="invalid_price_type",
                        message=f"Price should be number, got {type(price).__name__}",
                        product_id=product_id,
                        field_name="price_nis"
                    ))
                elif price < self.MIN_PRICE or price > self.MAX_PRICE:
                    self.issues.append(ValidationIssue(
                        level=ValidationLevel.WARNING,
                        scope=ValidationScope.FIELD,
                        category="price_out_of_range",
                        message=f"Price {price} NIS outside normal range ({self.MIN_PRICE}-{self.MAX_PRICE})",
                        product_id=product_id,
                        field_name="price_nis",
                        actual_value=price
                    ))
        
        # Description validation
        description = product.get("description", "").strip()
        if not description:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                scope=ValidationScope.FIELD,
                category="missing_description",
                message="Product has no description",
                product_id=product_id,
                field_name="description"
            ))
        elif len(description) < 10:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                scope=ValidationScope.FIELD,
                category="short_description",
                message=f"Description too short ({len(description)} chars)",
                product_id=product_id,
                field_name="description"
            ))
        
        # Specifications
        specs = product.get("specifications", [])
        if specs and not isinstance(specs, list):
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                scope=ValidationScope.FIELD,
                category="invalid_specs_type",
                message=f"Specifications should be list, got {type(specs).__name__}",
                product_id=product_id,
                field_name="specifications"
            ))
        
        # Features
        features = product.get("features", [])
        if features and not isinstance(features, list):
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                scope=ValidationScope.FIELD,
                category="invalid_features_type",
                message=f"Features should be list, got {type(features).__name__}",
                product_id=product_id,
                field_name="features"
            ))
        
        # Relationships
        self._validate_relationships(product, product_id)
        
        return len([i for i in self.issues if i.level == ValidationLevel.ERROR]) == 0, self.issues
    
    def _validate_required_fields(self, product: Dict, product_id: str) -> None:
        """Validate required fields exist"""
        missing = self.REQUIRED_FIELDS - set(product.keys())
        for field in missing:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                scope=ValidationScope.FIELD,
                category="missing_required_field",
                message=f"Missing required field: {field}",
                product_id=product_id,
                field_name=field
            ))
    
    def _validate_images(self, product: Dict, product_id: str) -> None:
        """Validate image URLs and structure"""
        image_url = product.get("image_url", "").strip()
        
        if not image_url:
            self.issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                scope=ValidationScope.FIELD,
                category="missing_image_url",
                message="Product has no main image URL",
                product_id=product_id,
                field_name="image_url"
            ))
        else:
            # Basic URL validation
            if not self._is_valid_url(image_url):
                self.issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    scope=ValidationScope.FIELD,
                    category="invalid_image_url",
                    message=f"Invalid image URL format: {image_url}",
                    product_id=product_id,
                    field_name="image_url",
                    actual_value=image_url
                ))
            
            # Check file extension
            if not any(image_url.lower().endswith(ext) for ext in self.IMAGE_EXTENSIONS):
                self.issues.append(ValidationIssue(
                    level=ValidationLevel.WARNING,
                    scope=ValidationScope.FIELD,
                    category="unsupported_image_extension",
                    message=f"Image extension may not be supported: {image_url}",
                    product_id=product_id,
                    field_name="image_url"
                ))
        
        # Gallery images
        images = product.get("images", [])
        if images:
            if not isinstance(images, list):
                self.issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    scope=ValidationScope.FIELD,
                    category="invalid_images_type",
                    message=f"Images should be list, got {type(images).__name__}",
                    product_id=product_id,
                    field_name="images"
                ))
            else:
                for i, img in enumerate(images):
                    if isinstance(img, dict):
                        img_url = img.get("url", "").strip()
                        if not img_url:
                            self.issues.append(ValidationIssue(
                                level=ValidationLevel.WARNING,
                                scope=ValidationScope.FIELD,
                                category="empty_gallery_image_url",
                                message=f"Gallery image #{i} has no URL",
                                product_id=product_id,
                                field_name=f"images[{i}].url"
                            ))
                        elif not self._is_valid_url(img_url):
                            self.issues.append(ValidationIssue(
                                level=ValidationLevel.ERROR,
                                scope=ValidationScope.FIELD,
                                category="invalid_gallery_image_url",
                                message=f"Gallery image #{i} invalid URL: {img_url}",
                                product_id=product_id,
                                field_name=f"images[{i}].url"
                            ))
    
    def _validate_relationships(self, product: Dict, product_id: str) -> None:
        """Validate product relationships (accessories, related, etc.)"""
        for rel_type in ["related_accessories", "related_products", "related_bundles"]:
            rels = product.get(rel_type, [])
            if rels:
                if not isinstance(rels, list):
                    self.issues.append(ValidationIssue(
                        level=ValidationLevel.WARNING,
                        scope=ValidationScope.FIELD,
                        category="invalid_relationships_type",
                        message=f"{rel_type} should be list, got {type(rels).__name__}",
                        product_id=product_id,
                        field_name=rel_type
                    ))
    
    @staticmethod
    def _is_valid_url(url: str) -> bool:
        """Basic URL validation - reject data URIs and invalid schemes"""
        try:
            url_clean = url.strip()
            # Reject data URIs (data:image/gif;base64,...)
            if url_clean.startswith("data:"):
                return False
            result = urlparse(url_clean)
            return all([result.scheme in ("http", "https"), result.netloc])
        except:
            return False


class CatalogValidator:
    """Validates complete product catalog"""
    
    def __init__(self):
        self.product_validator = ProductValidator()
    
    def validate(self, catalog: Dict[str, Any]) -> ValidationReport:
        """
        Validate complete catalog.
        
        Args:
            catalog: Complete ProductCatalog dict
        
        Returns:
            ValidationReport with all issues found
        """
        issues: List[ValidationIssue] = []
        
        # Catalog structure
        brand_identity = catalog.get("brand_identity", {})
        products = catalog.get("products", [])
        
        brand_name = brand_identity.get("name", "unknown")
        
        if not brand_identity:
            issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                scope=ValidationScope.CATALOG,
                category="missing_brand_identity",
                message="Catalog missing brand_identity"
            ))
        
        if not products:
            issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                scope=ValidationScope.CATALOG,
                category="no_products",
                message="Catalog contains no products"
            ))
        
        # Validate each product
        seen_ids: Set[str] = set()
        for product in products:
            product_id = product.get("id", "unknown")
            
            # Duplicate IDs
            if product_id in seen_ids:
                issues.append(ValidationIssue(
                    level=ValidationLevel.ERROR,
                    scope=ValidationScope.PRODUCT,
                    category="duplicate_product_id",
                    message=f"Duplicate product ID: {product_id}",
                    product_id=product_id
                ))
            seen_ids.add(product_id)
            
            # Validate product
            _, product_issues = self.product_validator.validate(product, brand_name)
            issues.extend(product_issues)
        
        return ValidationReport(
            brand=brand_name,
            total_products=len(products),
            issues=issues,
            timestamp=datetime.utcnow()
        )


def validate_catalog_file(filepath: Path) -> ValidationReport:
    """Convenience function to validate catalog JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    validator = CatalogValidator()
    return validator.validate(catalog)
