"""
Brand Contract Manager - v3.6
Loads and applies brand contracts for consistent categorization and display
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class BrandContractManager:
    """
    Manages brand contracts defining:
    - Category hierarchies (main categories + subcategories)
    - Visual assets (logos, colors, typography)
    - Display rules (UI behavior)
    """
    
    def __init__(self, contracts_dir: Path = None):
        if contracts_dir is None:
            backend_dir = Path(__file__).resolve().parents[1]
            contracts_dir = backend_dir / "data" / "contracts" / "brands"
        
        self.contracts_dir = Path(contracts_dir)
        self.contracts = {}
        self._load_all_contracts()
    
    def _load_all_contracts(self):
        """Load all brand contracts from contracts directory"""
        if not self.contracts_dir.exists():
            logger.warning(f"Contracts directory not found: {self.contracts_dir}")
            return
        
        for contract_file in self.contracts_dir.glob("*_contract.json"):
            try:
                with open(contract_file, 'r', encoding='utf-8') as f:
                    contract = json.load(f)
                    brand_id = contract.get("brand_id")
                    if brand_id:
                        self.contracts[brand_id] = contract
                        logger.info(f"Loaded contract for: {brand_id}")
            except Exception as e:
                logger.error(f"Failed to load contract {contract_file}: {e}")
    
    def get_contract(self, brand_id: str) -> Optional[Dict]:
        """Get full contract for a brand"""
        return self.contracts.get(brand_id)
    
    def get_main_categories(self, brand_id: str) -> List[Dict]:
        """Get main categories for a brand"""
        contract = self.get_contract(brand_id)
        if not contract:
            return []
        
        return contract.get("categories", {}).get("main_categories", [])
    
    def map_product_category(self, brand_id: str, product_category: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Map a product's category to main_category and subcategory
        
        Args:
            brand_id: Brand identifier
            product_category: Category from product (e.g., "Blues Driver", "Loop Station")
        
        Returns:
            Tuple of (main_category_id, subcategory_id) or (None, None)
        """
        contract = self.get_contract(brand_id)
        if not contract:
            return None, None
        
        # Check direct mapping first
        mapping = contract.get("categories", {}).get("category_mapping", {})
        main_category_id = mapping.get(product_category)
        
        if main_category_id:
            # Find subcategory by keyword matching
            main_categories = self.get_main_categories(brand_id)
            for main_cat in main_categories:
                if main_cat["id"] == main_category_id:
                    for subcat in main_cat.get("subcategories", []):
                        keywords = subcat.get("keywords", [])
                        if any(keyword.lower() in product_category.lower() for keyword in keywords):
                            return main_category_id, subcat["id"]
                    # No subcategory match, return main category only
                    return main_category_id, None
        
        # Fallback: Search all subcategories by keywords
        main_categories = self.get_main_categories(brand_id)
        product_cat_lower = product_category.lower()
        
        for main_cat in main_categories:
            for subcat in main_cat.get("subcategories", []):
                keywords = subcat.get("keywords", [])
                if any(keyword.lower() in product_cat_lower for keyword in keywords):
                    return main_cat["id"], subcat["id"]
        
        return None, None
    
    def enrich_product(self, product: Dict) -> Dict:
        """
        Enrich product with category hierarchy from contract
        
        Adds:
        - main_category: Top-level category ID
        - main_category_name: Top-level category display name
        - subcategory: Subcategory ID
        - subcategory_name: Subcategory display name
        - original_category: Preserved for reference
        """
        brand_id = product.get("brand")
        product_category = product.get("category")
        
        if not brand_id or not product_category:
            return product
        
        # Preserve original
        product["original_category"] = product_category
        
        # Map to hierarchy
        main_cat_id, subcat_id = self.map_product_category(brand_id, product_category)
        
        if main_cat_id:
            contract = self.get_contract(brand_id)
            main_categories = self.get_main_categories(brand_id)
            
            # Find full main category
            for main_cat in main_categories:
                if main_cat["id"] == main_cat_id:
                    product["main_category"] = main_cat_id
                    product["main_category_name"] = main_cat["name"]
                    
                    # Find subcategory if exists
                    if subcat_id:
                        for subcat in main_cat.get("subcategories", []):
                            if subcat["id"] == subcat_id:
                                product["subcategory"] = subcat_id
                                product["subcategory_name"] = subcat["name"]
                                break
                    
                    break
        
        return product
    
    def get_brand_assets(self, brand_id: str) -> Optional[Dict]:
        """Get brand visual assets (logo, colors, typography)"""
        contract = self.get_contract(brand_id)
        if not contract:
            return None
        
        return contract.get("assets")
    
    def get_display_rules(self, brand_id: str) -> Optional[Dict]:
        """Get brand-specific display rules"""
        contract = self.get_contract(brand_id)
        if not contract:
            return None
        
        return contract.get("display_rules")
    
    def get_category_tree(self, brand_id: str) -> Dict:
        """
        Get full category tree for UI rendering
        
        Returns structured tree with counts
        """
        main_categories = self.get_main_categories(brand_id)
        
        tree = {
            "brand_id": brand_id,
            "categories": []
        }
        
        for main_cat in main_categories:
            cat_node = {
                "id": main_cat["id"],
                "name": main_cat["name"],
                "slug": main_cat["slug"],
                "icon": main_cat.get("icon"),
                "subcategories": []
            }
            
            for subcat in main_cat.get("subcategories", []):
                subcat_node = {
                    "id": subcat["id"],
                    "name": subcat["name"],
                    "slug": subcat["slug"]
                }
                cat_node["subcategories"].append(subcat_node)
            
            tree["categories"].append(cat_node)
        
        return tree
    
    def validate_contract(self, brand_id: str) -> Tuple[bool, List[str]]:
        """
        Validate brand contract against schema
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        contract = self.get_contract(brand_id)
        if not contract:
            return False, [f"Contract not found for brand: {brand_id}"]
        
        errors = []
        
        # Check required fields
        required_fields = ["brand_id", "brand_name", "version", "assets", "categories", "display_rules"]
        for field in required_fields:
            if field not in contract:
                errors.append(f"Missing required field: {field}")
        
        # Check assets structure
        if "assets" in contract:
            if "logo" not in contract["assets"]:
                errors.append("Missing assets.logo")
            if "colors" not in contract["assets"]:
                errors.append("Missing assets.colors")
        
        # Check categories structure
        if "categories" in contract:
            if "main_categories" not in contract["categories"]:
                errors.append("Missing categories.main_categories")
            else:
                main_cats = contract["categories"]["main_categories"]
                if not isinstance(main_cats, list):
                    errors.append("categories.main_categories must be an array")
        
        return len(errors) == 0, errors


if __name__ == "__main__":
    # Test the contract manager
    logging.basicConfig(level=logging.INFO)
    
    manager = BrandContractManager()
    
    # Test Boss
    print("\n=== BOSS Contract ===")
    boss_contract = manager.get_contract("boss")
    if boss_contract:
        print(f"✅ Boss contract loaded")
        print(f"Main categories: {len(manager.get_main_categories('boss'))}")
        
        # Test mapping
        test_products = [
            {"brand": "boss", "category": "Blues Driver"},
            {"brand": "boss", "category": "Loop Station"},
            {"brand": "boss", "category": "Chromatic Tuner"}
        ]
        
        for product in test_products:
            enriched = manager.enrich_product(product)
            print(f"\n{product['category']} →")
            print(f"  Main: {enriched.get('main_category_name')}")
            print(f"  Sub: {enriched.get('subcategory_name')}")
    
    # Test Roland
    print("\n\n=== ROLAND Contract ===")
    roland_contract = manager.get_contract("roland")
    if roland_contract:
        print(f"✅ Roland contract loaded")
        print(f"Main categories: {len(manager.get_main_categories('roland'))}")
        
        # Test mapping
        test_products = [
            {"brand": "roland", "category": "Synthesizer"},
            {"brand": "roland", "category": "V-Drums"},
            {"brand": "roland", "category": "Digital Piano"}
        ]
        
        for product in test_products:
            enriched = manager.enrich_product(product)
            print(f"\n{product['category']} →")
            print(f"  Main: {enriched.get('main_category_name')}")
            print(f"  Sub: {enriched.get('subcategory_name')}")
