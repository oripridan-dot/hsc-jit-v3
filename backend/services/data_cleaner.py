"""
Data Cleaner & Publisher

Removes invalid products and images from catalogs before publishing.
Ensures data quality at every stage of the pipeline.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.validator import ProductValidator, CatalogValidator, ValidationLevel


class DataCleaner:
    """Cleans and publishes catalog data"""
    
    def __init__(self):
        self.product_validator = ProductValidator()
        self.catalog_validator = CatalogValidator()
    
    def clean_catalog(self, catalog: Dict[str, Any]) -> Tuple[Dict[str, Any], int, int]:
        """
        Clean catalog by removing invalid products and images.
        
        Returns:
            (cleaned_catalog, removed_products, removed_images)
        """
        cleaned = {
            "brand_identity": catalog.get("brand_identity", {}),
            "products": [],
            "metadata": catalog.get("metadata", {})
        }
        
        brand_name = cleaned["brand_identity"].get("name", "unknown")
        removed_products = 0
        removed_images = 0
        
        for product in catalog.get("products", []):
            # Validate product
            is_valid, issues = self.product_validator.validate(product, brand_name)
            
            # Check if product has CRITICAL errors (not image/description issues)
            critical_errors = [
                i for i in issues
                if i.level == ValidationLevel.ERROR and i.category not in [
                    "missing_description",
                    "missing_image_url",
                    "missing_categories",
                    "invalid_gallery_image_url",  # Images can be filtered
                    "invalid_image_url"  # Images can be filtered
                ]
            ]
            
            if critical_errors:
                # Skip this product - it has fundamental problems
                removed_products += 1
                print(f"  ⏭️  Skipped {product.get('id')}: {critical_errors[0].message}")
                continue
            
            # Clean product images (remove data URIs and invalid URLs)
            cleaned_product = product.copy()
            if "images" in cleaned_product:
                original_count = len(cleaned_product["images"])
                
                # Filter out invalid images
                valid_images = []
                for img in cleaned_product["images"]:
                    if isinstance(img, dict):
                        img_url = img.get("url", "").strip()
                        
                        # Skip data URIs, empty URLs, and relative URLs
                        if not img_url or img_url.startswith("data:"):
                            removed_images += 1
                            continue
                        
                        # Keep only absolute HTTP(S) URLs
                        if img_url.startswith("http://") or img_url.startswith("https://"):
                            valid_images.append(img)
                        else:
                            removed_images += 1
                
                cleaned_product["images"] = valid_images
                if removed_images > 0 and product.get("id"):
                    print(f"  🖼️  {product.get('id')}: removed {original_count - len(valid_images)} invalid images")
            
            # Infer categories from main_category if missing
            if not cleaned_product.get("categories"):
                main_cat = cleaned_product.get("main_category")
                if main_cat:
                    cleaned_product["categories"] = [main_cat]
            
            cleaned["products"].append(cleaned_product)
        
        return cleaned, removed_products, removed_images
    
    def publish_catalog(self, catalog: Dict[str, Any], output_path: Path) -> bool:
        """
        Publish cleaned catalog to JSON file.
        
        Returns:
            True if successful
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(catalog, f, indent=2, ensure_ascii=False, default=str)
            
            return True
        except Exception as e:
            print(f"❌ Failed to publish catalog: {e}")
            return False


def main():
    """Clean and publish all catalogs"""
    backend_dir = Path(__file__).parent.parent
    catalogs_dir = backend_dir / "data" / "catalogs"
    output_dir = backend_dir / "data" / "catalogs_brand"
    
    print("\n" + "="*70)
    print("🧹 Data Cleaner - Removing invalid products and images")
    print("="*70 + "\n")
    
    cleaner = DataCleaner()
    
    # Find all catalog files
    catalog_files = list(catalogs_dir.glob("*.json"))
    
    if not catalog_files:
        print(f"⚠️  No catalogs found in {catalogs_dir}")
        return 1
    
    results = {}
    
    for catalog_file in sorted(catalog_files):
        brand_name = catalog_file.stem
        print(f"\n🔄 Processing {brand_name}...")
        
        try:
            # Load catalog
            with open(catalog_file, "r", encoding="utf-8") as f:
                catalog = json.load(f)
            
            original_count = len(catalog.get("products", []))
            
            # Clean catalog
            cleaned, removed_products, removed_images = cleaner.clean_catalog(catalog)
            final_count = len(cleaned.get("products", []))
            
            print(f"  📊 {original_count} → {final_count} products ({removed_products} removed)")
            print(f"  🖼️  {removed_images} invalid images removed")
            
            # Publish cleaned catalog
            output_file = output_dir / f"{brand_name}_catalog.json"
            if cleaner.publish_catalog(cleaned, output_file):
                print(f"  ✅ Published to {output_file.relative_to(backend_dir)}")
                results[brand_name] = {
                    "status": "✅",
                    "original": original_count,
                    "final": final_count,
                    "removed_products": removed_products,
                    "removed_images": removed_images
                }
            else:
                results[brand_name] = {"status": "❌", "error": "publish_failed"}
        
        except Exception as e:
            print(f"  ❌ Error: {e}")
            results[brand_name] = {"status": "❌", "error": str(e)}
    
    # Summary
    print("\n" + "="*70)
    print("📋 Summary")
    print("="*70)
    
    for brand, result in results.items():
        status = result.get("status", "?")
        if result.get("status") == "✅":
            print(f"{status} {brand}")
            print(f"   {result['original']} → {result['final']} products")
            print(f"   {result['removed_products']} products skipped, {result['removed_images']} images removed")
        else:
            print(f"{status} {brand}: {result.get('error', 'unknown error')}")
    
    print("="*70 + "\n")
    
    return 0 if all(r.get("status") == "✅" for r in results.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
