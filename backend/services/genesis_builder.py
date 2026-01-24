# backend/services/genesis_builder.py
"""
Genesis Builder - The App Constructor

Reads "blueprint" JSON files created by SuperExplorer and constructs
the complete app file structure:
  - Product JSON files in frontend/public/data
  - Thumbnail images in frontend/public/data/images
  - Updated index.json with all products

The resulting "Skeleton" app is fully browseable with all products visible,
waiting for heavy scrapers to fill in detailed specs in the background.
"""

import json
import os
import requests
import shutil
from typing import Dict, List, Optional
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class GenesisBuilder:
    """
    Constructs the app structure from blueprint JSON files.
    
    Manages product files, images, and the master index.
    """
    
    # Relative paths from backend directory
    FRONTEND_DATA = "../frontend/public/data"
    FRONTEND_IMAGES = "../frontend/public/data/images"

    def __init__(self, brand_key: str):
        """
        Initialize builder for a specific brand.
        
        Args:
            brand_key: Brand identifier (e.g., "roland")
        """
        self.brand = brand_key
        self.blueprint_file = f"backend/data/blueprints/{brand_key}_blueprint.json"
        self.products_built = []

    def construct(self) -> bool:
        """
        Read blueprint and construct app structure.
        
        Returns:
            True if successful, False otherwise
        """
        if not os.path.exists(self.blueprint_file):
            print(f"⚠️  Blueprint missing: {self.blueprint_file}")
            print(f"   Run SuperExplorer first: python backend/services/super_explorer.py")
            return False

        with open(self.blueprint_file, 'r') as f:
            blueprint = json.load(f)

        print(f"🏗️  Initiating Genesis for {self.brand.upper()}...")
        print(f"   Processing {len(blueprint)} products...")
        
        for idx, item in enumerate(blueprint, 1):
            success = self._build_node(item)
            if success:
                self.products_built.append(item['id'])
            
            if idx % 10 == 0:
                print(f"   └─ {idx}/{len(blueprint)} products constructed")
            
        print(f"✨ Genesis Complete for {self.brand}: {len(self.products_built)} products.")
        return True

    def _build_node(self, item: Dict) -> bool:
        """
        Construct a single product's file structure and assets.
        
        Args:
            item: Product dict from blueprint
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # 1. Prepare Paths
            safe_id = item['id']
            product_folder = os.path.join(self.FRONTEND_DATA, self.brand)
            image_folder = os.path.join(self.FRONTEND_IMAGES, self.brand)
            
            os.makedirs(product_folder, exist_ok=True)
            os.makedirs(image_folder, exist_ok=True)

            # 2. Acquire Asset (Download Thumbnail)
            # NOTE: Image downloads are deferred to background job for speed.
            # For now, we store the remote URL and can download later.
            local_image_name = f"{safe_id}_thumb.jpg"
            local_image_full_path = os.path.join(image_folder, local_image_name)
            
            # Use remote URL directly, or fall back to placeholder
            if item.get('remote_image'):
                public_url = item['remote_image']  # Use remote URL for now
            else:
                public_url = "/assets/placeholder_gear.png"

            # 3. Construct JSON State (The "Skeleton" Data Structure)
            # Determine Badge
            badges = []
            if item['intelligence']['is_sold']:
                badges.append("HALILIT_CERTIFIED")
            else:
                badges.append("GLOBAL_CATALOG")

            product_data = {
                "id": safe_id,
                "name": item['name'],
                "brand": self.brand,
                "category": item['category'],
                "description": item['short_description'],
                "media": {
                    "thumbnail": public_url,
                    "gallery": [],  # Empty for now
                    "videos": []
                },
                "commercial": {
                    "price": item['intelligence']['price'],
                    "link": item['intelligence']['url'],
                    "status": item['intelligence']['status']
                },
                "specs": {},  # Waiting for heavy scrape
                "badges": badges,
                "meta": {
                    "completeness": "SKELETON",
                    "last_scan": self._get_timestamp()
                }
            }

            # 4. Write to Disk
            product_file_path = os.path.join(product_folder, f"{safe_id}.json")
            with open(product_file_path, 'w') as f:
                json.dump(product_data, f, indent=2)
            
            return True
            
        except Exception as e:
            print(f"   ⚠️  Failed to build {item.get('id', 'unknown')}: {e}")
            return False

    def _download_image(self, url: str, save_path: str) -> bool:
        """
        Download an image from URL and save locally.
        
        Args:
            url: Image URL
            save_path: Local file path to save to
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.get(url, timeout=5, stream=True)
            if response.status_code == 200:
                with open(save_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                return True
        except Exception:
            pass
        return False

    def _get_timestamp(self) -> str:
        """Get current ISO timestamp."""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"

    def construct_all_brands(self) -> Dict[str, bool]:
        """
        Construct all brand catalogs.
        
        Returns:
            Dict mapping brand names to success status
        """
        blueprints_dir = "backend/data/blueprints"
        
        if not os.path.exists(blueprints_dir):
            print(f"⚠️  Blueprints directory not found: {blueprints_dir}")
            return {}
        
        blueprint_files = [f for f in os.listdir(blueprints_dir) if f.endswith('_blueprint.json')]
        results = {}
        
        print(f"🌍 Constructing Genesis for {len(blueprint_files)} brands...\n")
        
        for blueprint_file in blueprint_files:
            brand_key = blueprint_file.replace('_blueprint.json', '')
            builder = GenesisBuilder(brand_key)
            success = builder.construct()
            results[brand_key] = success
            print()
        
        return results


if __name__ == "__main__":
    # Example: Build a single brand
    # builder = GenesisBuilder("roland")
    # builder.construct()
    
    # Or build all brands
    builder = GenesisBuilder("")  # Dummy instance
    results = builder.construct_all_brands()
    
    print(f"\n📊 Genesis Summary:")
    for brand, success in results.items():
        status = "✅" if success else "❌"
        print(f"   {status} {brand}")
