"""
Data Quality Module - HSC JIT v3.6
===================================

Handles deduplication, validation, and data quality assurance.

Key Functions:
- deduplicate(): Remove duplicate products by name + first image
- validate_required_fields(): Ensure minimum data quality
- enrich_from_halilit(): Add verified data from Halilit
"""

import hashlib
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class DataCleaner:
    """Ensures data quality through deduplication and validation"""
    
    # Required fields for a valid product
    REQUIRED_FIELDS = ["name", "brand"]
    
    # Recommended fields (warnings only)
    RECOMMENDED_FIELDS = ["category", "image_url", "brand_product_url"]
    
    def deduplicate(self, products: List[Dict]) -> List[Dict]:
        """
        Remove duplicate products based on unique signature
        
        Deduplication strategy:
        1. Create hash from (name + first_image_url)
        2. Keep first occurrence
        3. Log removed duplicates
        
        Args:
            products: List of product dictionaries
            
        Returns:
            List of unique products (preserves order)
        """
        if not products:
            return []
        
        seen_hashes = set()
        unique_products = []
        duplicates_removed = 0
        
        for product in products:
            # Create unique signature
            signature = self._create_signature(product)
            
            if signature not in seen_hashes:
                seen_hashes.add(signature)
                unique_products.append(product)
            else:
                duplicates_removed += 1
                logger.debug(f"Duplicate removed: {product.get('name', 'Unknown')}")
        
        if duplicates_removed > 0:
            logger.info(f"Removed {duplicates_removed} duplicates from {len(products)} products")
        
        return unique_products
    
    def _create_signature(self, product: Dict) -> str:
        """
        Create unique signature for product
        
        Uses: normalized name + first image URL (or detail URL if no image)
        This catches products that are the same model but listed multiple times
        """
        name = product.get("name", "").strip().lower()
        image = product.get("image_url", "").strip().lower()
        detail_url = product.get("detail_url", "").strip().lower()
        
        # Use image if available, otherwise detail URL
        identifier = image or detail_url
        
        # Create hash from combination
        signature_string = f"{name}|{identifier}"
        return hashlib.md5(signature_string.encode()).hexdigest()
    
    def validate_required_fields(self, product: Dict) -> bool:
        """
        Validate that product has all required fields
        
        Args:
            product: Product dictionary to validate
            
        Returns:
            True if valid, False otherwise
        """
        # Check required fields
        for field in self.REQUIRED_FIELDS:
            value = product.get(field)
            if not value or (isinstance(value, str) and not value.strip()):
                logger.warning(
                    f"Product missing required field '{field}': "
                    f"{product.get('name', 'Unknown')}"
                )
                return False
        
        # Check recommended fields (warnings only)
        missing_recommended = []
        for field in self.RECOMMENDED_FIELDS:
            value = product.get(field)
            if not value or (isinstance(value, str) and not value.strip()):
                missing_recommended.append(field)
        
        if missing_recommended:
            logger.debug(
                f"Product missing recommended fields {missing_recommended}: "
                f"{product.get('name', 'Unknown')}"
            )
        
        return True
    
    def normalize_category(self, category: str) -> str:
        """
        Normalize category names for consistency
        
        Examples:
            "Drum Machines" -> "Drums"
            "synthesizer" -> "Synthesizers"
            "PIANO" -> "Pianos"
        """
        if not category:
            return "Uncategorized"
        
        # Category mapping for common variations
        CATEGORY_MAP = {
            "drum": "Drums",
            "drums": "Drums",
            "drum machine": "Drums",
            "drum machines": "Drums",
            "synthesizer": "Synthesizers",
            "synthesizers": "Synthesizers",
            "synth": "Synthesizers",
            "synths": "Synthesizers",
            "keyboard": "Keyboards",
            "keyboards": "Keyboards",
            "piano": "Pianos",
            "pianos": "Pianos",
            "digital piano": "Pianos",
            "electric piano": "Pianos",
            "guitar": "Guitars",
            "guitars": "Guitars",
            "bass": "Bass",
            "basses": "Bass",
            "bass guitar": "Bass",
            "amplifier": "Amplifiers",
            "amplifiers": "Amplifiers",
            "amp": "Amplifiers",
            "amps": "Amplifiers",
            "effect": "Effects",
            "effects": "Effects",
            "pedal": "Effects",
            "pedals": "Effects",
            "audio interface": "Audio Interfaces",
            "interface": "Audio Interfaces",
            "microphone": "Microphones",
            "microphones": "Microphones",
            "mic": "Microphones",
            "mics": "Microphones",
            "monitor": "Monitors",
            "monitors": "Monitors",
            "speaker": "Monitors",
            "speakers": "Monitors",
        }
        
        normalized = category.strip().lower()
        return CATEGORY_MAP.get(normalized, category.title())
    
    def clean_product(self, product: Dict) -> Dict:
        """
        Apply all cleaning operations to a single product
        
        - Normalize category
        - Trim whitespace
        - Remove empty strings
        - Standardize field names
        """
        cleaned = {}
        
        # Copy and clean each field
        for key, value in product.items():
            if isinstance(value, str):
                value = value.strip()
                if value:  # Only keep non-empty strings
                    cleaned[key] = value
            elif value is not None:  # Keep non-None values
                cleaned[key] = value
        
        # Normalize category if present
        if "category" in cleaned:
            cleaned["category"] = self.normalize_category(cleaned["category"])
        
        return cleaned
    
    def batch_clean(self, products: List[Dict]) -> List[Dict]:
        """
        Clean all products in a batch
        
        Applies:
        1. Individual product cleaning
        2. Deduplication
        3. Validation
        
        Returns only valid, unique products
        """
        # Step 1: Clean each product
        cleaned = [self.clean_product(p) for p in products]
        
        # Step 2: Deduplicate
        unique = self.deduplicate(cleaned)
        
        # Step 3: Validate
        valid = [p for p in unique if self.validate_required_fields(p)]
        
        logger.info(
            f"Batch cleaned: {len(products)} -> {len(cleaned)} -> "
            f"{len(unique)} -> {len(valid)} (original->cleaned->unique->valid)"
        )
        
        return valid
    
    def get_quality_report(self, products: List[Dict]) -> Dict:
        """
        Generate data quality report
        
        Returns statistics about:
        - Total products
        - Valid products
        - Missing required fields
        - Missing recommended fields
        - Duplicate rate
        """
        total = len(products)
        
        if total == 0:
            return {
                "total_products": 0,
                "valid_products": 0,
                "quality_score": 0
            }
        
        valid_count = sum(1 for p in products if self.validate_required_fields(p))
        unique_products = self.deduplicate(products)
        duplicate_count = total - len(unique_products)
        
        # Check recommended fields
        has_image = sum(1 for p in products if p.get("image_url"))
        has_category = sum(1 for p in products if p.get("category"))
        has_url = sum(1 for p in products if p.get("brand_product_url"))
        
        return {
            "total_products": total,
            "valid_products": valid_count,
            "unique_products": len(unique_products),
            "duplicate_count": duplicate_count,
            "quality_score": round((valid_count / total) * 100, 2),
            "completeness": {
                "has_image": round((has_image / total) * 100, 2),
                "has_category": round((has_category / total) * 100, 2),
                "has_url": round((has_url / total) * 100, 2)
            }
        }
