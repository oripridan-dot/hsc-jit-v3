"""
Intelligent Matching Module - HSC JIT v3.6
==========================================

Matches brand products with Halilit catalog using fuzzy logic.

Key Features:
- Fuzzy name matching (85% threshold)
- Category hints for better accuracy
- Price and SKU enrichment
- Verification confidence scoring
"""

import logging
from difflib import SequenceMatcher
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class HalilitMatcher:
    """Matches brand products with Halilit official catalog"""
    
    # Matching thresholds
    NAME_MATCH_THRESHOLD = 0.85  # 85% similarity required
    GOOD_MATCH_THRESHOLD = 0.95  # 95% = excellent match
    
    def __init__(self):
        self.halilit_products = []
        self.halilit_by_brand = {}
        self._load_attempts = 0
    
    def load_halilit_catalog(self, halilit_data: Dict):
        """
        Load Halilit catalog for matching
        
        Args:
            halilit_data: Halilit catalog dictionary
        """
        self.halilit_products = []
        self.halilit_by_brand = {}
        
        # Handle different data structures
        if isinstance(halilit_data, dict):
            if "brands" in halilit_data:
                # Format: {"brands": [...]} - each brand has products
                for brand in halilit_data.get("brands", []):
                    brand_name = brand.get("name", "").lower().strip()
                    products = brand.get("products", [])
                    if products:
                        self.halilit_by_brand[brand_name] = products
                        self.halilit_products.extend(products)
            
            elif "products" in halilit_data:
                # Format: {"products": [...]} - flat list with brand field
                self.halilit_products = halilit_data.get("products", [])
                
                # Group by brand
                for product in self.halilit_products:
                    brand_name = product.get("brand", "").lower().strip()
                    if brand_name:
                        if brand_name not in self.halilit_by_brand:
                            self.halilit_by_brand[brand_name] = []
                        self.halilit_by_brand[brand_name].append(product)
        
        logger.info(
            f"Loaded {len(self.halilit_products)} Halilit products "
            f"across {len(self.halilit_by_brand)} brands"
        )
    
    def match_and_enrich(self, product: Dict, halilit_data: Dict = None) -> Dict:
        """
        Match product with Halilit catalog and enrich data
        
        Args:
            product: Brand product to match
            halilit_data: Optional Halilit catalog (loads if not already loaded)
            
        Returns:
            Enriched product with Halilit data if matched
        """
        # Load catalog if provided and not loaded yet
        if halilit_data and not self.halilit_products:
            self.load_halilit_catalog(halilit_data)
        
        # Start with copy of original product
        enriched = product.copy()
        
        # Add default verification status
        enriched["verified"] = False
        enriched["verification_confidence"] = 0.0
        
        if not self.halilit_products:
            logger.debug("No Halilit catalog loaded, skipping match")
            return enriched
        
        # Find best match
        brand_name = product.get("brand", "").lower()
        product_name = product.get("name", "")
        
        if not product_name:
            return enriched
        
        # Get brand-specific products for faster matching
        candidates = self.halilit_by_brand.get(brand_name, self.halilit_products)
        
        best_match = self._find_best_match(product_name, candidates)
        
        if best_match:
            match_data, confidence = best_match
            
            if confidence >= self.NAME_MATCH_THRESHOLD:
                # Enrich with Halilit data
                enriched = self._enrich_with_match(enriched, match_data, confidence)
                logger.debug(
                    f"Matched '{product_name}' with '{match_data.get('name')}' "
                    f"(confidence: {confidence:.2%})"
                )
        
        return enriched
    
    def _find_best_match(
        self, 
        product_name: str, 
        candidates: List[Dict]
    ) -> Optional[tuple]:
        """
        Find best matching Halilit product
        
        Returns:
            Tuple of (match_data, confidence) or None if no good match
        """
        if not candidates:
            return None
        
        best_match = None
        best_score = 0.0
        
        product_name_clean = self._normalize_name(product_name)
        
        for candidate in candidates:
            candidate_name = candidate.get("name", "")
            if not candidate_name:
                continue
            
            candidate_name_clean = self._normalize_name(candidate_name)
            
            # Calculate similarity
            score = self._calculate_similarity(product_name_clean, candidate_name_clean)
            
            if score > best_score:
                best_score = score
                best_match = candidate
        
        if best_score >= self.NAME_MATCH_THRESHOLD:
            return (best_match, best_score)
        
        return None
    
    def _normalize_name(self, name: str) -> str:
        """
        Normalize product name for better matching
        
        - Lowercase
        - Remove extra spaces
        - Remove special characters
        - Remove common words like "the", "a", etc.
        """
        if not name:
            return ""
        
        # Lowercase and strip
        normalized = name.lower().strip()
        
        # Remove special characters but keep alphanumeric and spaces
        normalized = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in normalized)
        
        # Remove extra spaces
        normalized = ' '.join(normalized.split())
        
        # Remove common filler words
        filler_words = {'the', 'a', 'an', 'and', 'or', 'of', 'in', 'with'}
        words = [w for w in normalized.split() if w not in filler_words]
        
        return ' '.join(words)
    
    def _calculate_similarity(self, name1: str, name2: str) -> float:
        """
        Calculate similarity between two product names
        
        Uses SequenceMatcher for fuzzy matching
        Returns score between 0.0 and 1.0
        """
        if not name1 or not name2:
            return 0.0
        
        # Use SequenceMatcher for fuzzy comparison
        return SequenceMatcher(None, name1, name2).ratio()
    
    def _enrich_with_match(
        self, 
        product: Dict, 
        match_data: Dict, 
        confidence: float
    ) -> Dict:
        """
        Enrich product with Halilit data
        
        Adds:
        - verified: True
        - verification_confidence: float
        - halilit_sku: str
        - halilit_price: float
        - halilit_stock_status: str
        - halilit_category: str (if different)
        """
        enriched = product.copy()
        
        # Mark as verified
        enriched["verified"] = True
        enriched["verification_confidence"] = round(confidence, 4)
        
        # Add Halilit-specific fields with prefix
        if "sku" in match_data:
            enriched["halilit_sku"] = match_data["sku"]
        
        if "price" in match_data:
            enriched["halilit_price"] = match_data["price"]
        
        if "stock_status" in match_data:
            enriched["halilit_stock_status"] = match_data["stock_status"]
        
        if "availability" in match_data:
            enriched["halilit_availability"] = match_data["availability"]
        
        # Add category if not present or different
        if "category" in match_data:
            halilit_category = match_data["category"]
            if not enriched.get("category"):
                enriched["category"] = halilit_category
            elif enriched["category"] != halilit_category:
                enriched["halilit_category"] = halilit_category
        
        # Add confidence level tag
        if confidence >= self.GOOD_MATCH_THRESHOLD:
            enriched["match_quality"] = "excellent"
        elif confidence >= self.NAME_MATCH_THRESHOLD:
            enriched["match_quality"] = "good"
        
        return enriched
    
    def batch_match(self, products: List[Dict], halilit_data: Dict = None) -> List[Dict]:
        """
        Match and enrich a batch of products
        
        Args:
            products: List of products to match
            halilit_data: Optional Halilit catalog
            
        Returns:
            List of enriched products
        """
        if halilit_data and not self.halilit_products:
            self.load_halilit_catalog(halilit_data)
        
        enriched_products = []
        matched_count = 0
        
        for product in products:
            enriched = self.match_and_enrich(product)
            enriched_products.append(enriched)
            
            if enriched.get("verified"):
                matched_count += 1
        
        match_rate = (matched_count / len(products) * 100) if products else 0
        logger.info(
            f"Matched {matched_count}/{len(products)} products ({match_rate:.1f}%)"
        )
        
        return enriched_products
    
    def get_match_statistics(self, products: List[Dict]) -> Dict:
        """
        Get matching statistics for a list of products
        
        Returns:
            Dictionary with match statistics
        """
        total = len(products)
        
        if total == 0:
            return {
                "total_products": 0,
                "matched_products": 0,
                "match_rate": 0.0
            }
        
        verified = sum(1 for p in products if p.get("verified"))
        excellent = sum(1 for p in products if p.get("match_quality") == "excellent")
        good = sum(1 for p in products if p.get("match_quality") == "good")
        
        avg_confidence = sum(
            p.get("verification_confidence", 0) for p in products if p.get("verified")
        ) / verified if verified > 0 else 0
        
        return {
            "total_products": total,
            "matched_products": verified,
            "match_rate": round((verified / total) * 100, 2),
            "excellent_matches": excellent,
            "good_matches": good,
            "average_confidence": round(avg_confidence, 4)
        }
