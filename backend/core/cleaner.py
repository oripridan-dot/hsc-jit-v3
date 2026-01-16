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
            "Bass Chorus" -> "Effects"
            "Acoustic Amplifier" -> "Amplifiers"
            "MIDI Cable" -> "Cables & Accessories"
            "עורות לתופים" -> "Drums & Percussion"
        """
        if not category:
            return "Uncategorized"
        
        category_lower = category.strip().lower()
        
        # Hebrew category mapping
        hebrew_mappings = {
            'תוף': 'Drums & Percussion',
            'עור': 'Drums & Percussion',
            'מצילות': 'Drums & Percussion',
            'כלי הקשה': 'Drums & Percussion',
            'הקשה': 'Drums & Percussion',
            'סנר': 'Drums & Percussion',
            'טמטם': 'Drums & Percussion',
            'בס': 'Drums & Percussion',
            'מערכת': 'Drums & Percussion',
            'מוניטור': 'Monitors & Speakers',
            'רמקול': 'Monitors & Speakers',
            'מיקרופון': 'Microphones',
            'מיקסר': 'Audio Equipment',
            'כרטיס קול': 'Audio Equipment',
            'ממיר': 'Audio Equipment',
            'אוזניות': 'Accessories',
            'אביזר': 'Accessories',
            'פדל': 'Effects & Pedals',
            'אפקט': 'Effects & Pedals',
            'מגבר': 'Amplifiers',
            'הגברה': 'Amplifiers',
            'קדם מגבר': 'Amplifiers',
            'מעבד': 'Audio Equipment',
            'מקלדת': 'Synthesizers & Keys',
            'סינתי': 'Synthesizers & Keys',
            'בלוג': 'Software & Apps',
            'חלילית': 'Software & Apps',
            'משטח': 'Synthesizers & Keys',
            'שליטה': 'Synthesizers & Keys',
            'שלט': 'Software & Apps',
            'צילום': 'Microphones',
            'שידור': 'Microphones',
            'חבילת': 'Audio Equipment',
            'אולפן': 'Audio Equipment',
            'כבל': 'Cables & Accessories'
        }
        
        # Check Hebrew keywords
        for hebrew_word, english_category in hebrew_mappings.items():
            if hebrew_word in category_lower:
                return english_category
        
        # Parent category mapping with keyword matching
        # Check for keywords in the category string
        
        # Drums & Percussion
        if any(word in category_lower for word in ['drum', 'percussion', 'cymbal', 'snare', 'kick', 'tom']):
            return "Drums & Percussion"
        
        # Synthesizers & Keys
        if any(word in category_lower for word in ['synth', 'keyboard', 'piano', 'organ', 'stage', 'electro']):
            return "Synthesizers & Keys"
        
        # Guitars
        if 'guitar' in category_lower and 'bass' not in category_lower and 'pick' not in category_lower and 'cable' not in category_lower and 'strap' not in category_lower:
            return "Guitars"
        
        # Bass
        if 'bass' in category_lower and any(word in category_lower for word in ['guitar', 'amp', 'effect', 'driver', 'comp', 'chorus', 'overdrive', 'equalizer', 'limiter', 'preamp']):
            return "Bass"
        
        # Amplifiers & Cabinets
        if any(word in category_lower for word in ['amplifier', 'amp', 'cabinet', 'head', 'combo']) and 'stand' not in category_lower:
            return "Amplifiers"
        
        # Effects & Processors
        if any(word in category_lower for word in [
            'effect', 'pedal', 'distortion', 'overdrive', 'fuzz', 'chorus', 'delay', 
            'reverb', 'compressor', 'equalizer', 'eq', 'wah', 'phaser', 'flanger',
            'tremolo', 'vibrato', 'boost', 'preamp', 'loop station', 'switcher',
            'harmonist', 'octave', 'pitch', 'metal zone', 'blues driver', 'noise suppressor'
        ]):
            return "Effects & Pedals"
        
        # Audio Equipment
        if any(word in category_lower for word in [
            'audio', 'mixer', 'interface', 'recorder', 'player', 'streaming'
        ]):
            return "Audio Equipment"
        
        # Cables & Connectors
        if any(word in category_lower for word in [
            'cable', 'connector', 'adapter', 'jack', 'xlr', 'patch', 'instrument cable',
            'midi cable', 'speaker cable'
        ]):
            return "Cables & Accessories"
        
        # Microphones
        if any(word in category_lower for word in ['microphone', 'mic']):
            return "Microphones"
        
        # Monitors & Speakers
        if any(word in category_lower for word in ['monitor', 'speaker', 'studio monitor']):
            return "Monitors & Speakers"
        
        # Accessories
        if any(word in category_lower for word in [
            'bag', 'case', 'pouch', 'stand', 'strap', 'pick', 'string',
            'tuner', 'metronome', 't-shirt', 'shirt', 'carrying', 'gig bag',
            'footswitch', 'foot switch', 'adaptor', 'power adaptor', 'pedal board',
            'pedalboard', 'parallel', 'cord', 'dr. beat', 'dr beat'
        ]):
            return "Accessories"
        
        # Software & Apps
        if any(word in category_lower for word in [
            'app', 'software', 'bluetooth adaptor', 'wireless transmitter', 'wireless system',
            'wireless footswitch', 'wireless midi'
        ]):
            return "Software & Apps"
        
        # If no match found, try to use the original category but clean it up
        # Remove numbers and hyphens from the end
        cleaned = category.strip()
        if cleaned:
            return cleaned
        
        return "Other"
    
    def clean_product(self, product: Dict) -> Dict:
        """
        Apply all cleaning operations to a single product
        
        - Trim whitespace
        - Remove empty strings
        - Standardize field names
        - PRESERVE brand-specific categories from website
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
        
        # DO NOT normalize categories - preserve brand-specific categories from their website!
        # Boss uses "Loop Station", "Guitar Effects Processor"
        # Roland uses "Synthesizer", "Creative Sampler", "GROOVEBOX"
        # Each brand's official categorization is preserved
        
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
