# backend/generate_frontend_json.py
import json
import logging
from pathlib import Path
from typing import List, Dict, Any

from models.product_hierarchy import ProductCore
from services.frontend_normalizer import FrontendNormalizer
from models.category_consolidator import CONSOLIDATED_CATEGORIES

# Setup Paths
BASE_DIR = Path(__file__).parent
SOURCE_DIR = BASE_DIR / "data/catalogs_brand" # Or "blueprints" if you prefer
TARGET_DIR = BASE_DIR.parent / "frontend/public/data"

# Configure Logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Temporary ProductCatalog to support legacy wrapper if needed
class ProductCatalog:
    pass

def run_migration():
    logger.info("🚀 Starting Frontend Data Migration...")
    
    # 1. Initialize Buckets for the 6 Tribes
    buckets: Dict[str, List[Dict[str, Any]]] = {
        cat.id: [] for cat in CONSOLIDATED_CATEGORIES
    }
    buckets["accessories"] = [] # Ensure fallback exists

    # 2. Scan & Load All Catalogs
    source_files = list(SOURCE_DIR.glob("*.json"))
    if not source_files:
        logger.warning(f"⚠️ No catalogs found in {SOURCE_DIR}. Checking blueprints...")
        source_files = list((BASE_DIR / "data/blueprints").glob("*.json"))

    total_products = 0
    
    for file_path in source_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            # Handle both 'ProductCatalog' wrapper and raw list
            if isinstance(data, dict) and "products" in data:
                raw_products = data["products"]
            elif isinstance(data, list):
                raw_products = data
            else:
                logger.warning(f"Skipping {file_path.name}: Unknown format")
                continue

            # 3. Normalize & Bucket
            brand_from_file = file_path.name.replace("_blueprint.json", "").replace("-", " ").title()

            for p_data in raw_products:
                # ADAPTER: Transform Blueprint -> ProductCore
                adapted_data = p_data.copy()
                
                # 1. Brand
                if "brand" not in adapted_data:
                    adapted_data["brand"] = brand_from_file
                
                # 2. Main Category
                if "main_category" not in adapted_data:
                    adapted_data["main_category"] = adapted_data.get("category", "general")
                    
                # 3. Status
                if "status" in adapted_data and isinstance(adapted_data["status"], str):
                    adapted_data["status"] = adapted_data["status"].lower()
                else:
                    adapted_data["status"] = "in_stock"

                # 4. Images
                if "images" not in adapted_data and "image_url" in adapted_data:
                     adapted_data["images"] = [{"url": adapted_data["image_url"], "type": "main"}]

                # 5. Pricing
                if "pricing" not in adapted_data and "price" in adapted_data:
                    adapted_data["pricing"] = {"regular_price": adapted_data["price"]}

                # Convert dict back to Pydantic for robust parsing
                try:
                    product_obj = ProductCore(**adapted_data)
                    
                    # THE MAGIC STEP: Normalize
                    ui_payload = FrontendNormalizer.normalize_product(product_obj)
                    
                    # Sort into Tribe Bucket
                    tribe_id = ui_payload["tribe_id"]
                    if tribe_id in buckets:
                        buckets[tribe_id].append(ui_payload)
                    else:
                        buckets["accessories"].append(ui_payload)
                        
                    total_products += 1
                except Exception as e:
                    logger.debug(f"Skipping product {p_data.get('id')}: {e}")
                    continue
                    
            logger.info(f"✅ Processed {file_path.name}")

        except Exception as e:
            logger.error(f"❌ Failed to load {file_path.name}: {e}")

    # 4. Write to Frontend
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    
    for tribe_id, products in buckets.items():
        output_path = TARGET_DIR / f"{tribe_id}.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        logger.info(f"💾 Saved {tribe_id}.json ({len(products)} products)")

    logger.info(f"🎉 Migration Complete. {total_products} products live on Frontend.")

if __name__ == "__main__":
    run_migration()
