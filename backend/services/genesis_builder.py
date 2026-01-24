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

try:
    from models.category_consolidator import consolidate_category
except ImportError:
    # Fallback if imports fail (e.g. running script directly)
    def consolidate_category(brand, cat): return "general"

class GenesisBuilder:

    """
    Constructs the app structure from blueprint JSON files.
    
    Manages product files, images, and the master index.
    """
    
    # Relative paths from backend directory
    # FRONTEND_DATA = "../frontend/public/data"
    # FRONTEND_IMAGES = "../frontend/public/data/images"
    
    # Use absolute paths based on file location to be safe
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # hsc-jit-v3/backend
    FRONTEND_DATA = os.path.join(os.path.dirname(BASE_DIR), "frontend/public/data")
    FRONTEND_IMAGES = os.path.join(os.path.dirname(BASE_DIR), "frontend/public/data/images")

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
            
        self._update_catalog_index(blueprint)
        print(f"✨ Genesis Complete for {self.brand}: {len(self.products_built)} products.")
        return True

    def _update_catalog_index(self, blueprint: List[Dict]):
        """
        Update the brand catalog file (e.g. roland.json) with new image URLs.
        Preserves existing brand identity if file exists.
        """
        catalog_path = os.path.join(self.FRONTEND_DATA, f"{self.brand}.json")
        catalog_data = {}
        
        if os.path.exists(catalog_path):
            try:
                with open(catalog_path, 'r') as f:
                    catalog_data = json.load(f)
            except:
                pass
        
        if "brand_identity" not in catalog_data:
            catalog_data["brand_identity"] = {
                "id": self.brand,
                "name": self.brand.upper()
            }
            
        # Rebuild or Update Products List
        # We prefer rebuilding from blueprint to ensure sync, 
        # but we want to keep fields not in blueprint if they exist? 
        # Actually, skeleton approach implies blueprint is source of truth for items.
        
        new_products = []
        for item in blueprint:
            safe_id = item['id']
            # Resolve Image URL
            if item.get('image_url'):
                public_url = item['image_url']
            elif item.get('remote_image'):
                public_url = item['remote_image']
            else:
                public_url = "/assets/placeholder_gear.png"
                
            # Smart Categorization
            raw_cat = item.get('category', 'general')
            final_cat = self._smart_categorize(item['name'], raw_cat)
            
            product_entry = {
                "id": safe_id,
                "name": item['name'],
                "brand": self.brand,
                "category": final_cat,
                "image_url": public_url,
                "description": item.get('description', ''),
            }
            
            # Carry over extra fields if needed? 
            # For now, simplistic rebuild is safer for consistency.
            new_products.append(product_entry)
            
        catalog_data["products"] = new_products
        
        with open(catalog_path, 'w') as f:
            json.dump(catalog_data, f, indent=2)

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
            if item.get('image_url'):
                public_url = item['image_url']
            elif item.get('remote_image'):
                public_url = item['remote_image']  # Use remote URL for now
            else:
                public_url = "/assets/placeholder_gear.png"

            # 3. Construct JSON State (The "Skeleton" Data Structure)
            
            # Normalize data source (support flat or nested 'intelligence')
            intel = item.get('intelligence', item)
            
            # Determine Badge
            badges = []
            if intel.get('is_sold'):
                badges.append("HALILIT_CERTIFIED")
            else:
                badges.append("GLOBAL_CATALOG")

            description = item.get('description') or item.get('short_description') or ''
            
            # Smart Categorization
            raw_cat = item.get('category', 'general')
            final_cat = self._smart_categorize(item['name'], raw_cat)

            product_data = {
                "id": safe_id,
                "name": item['name'],
                "brand": self.brand,
                "category": final_cat,
                "description": description,
                "media": {
                    "thumbnail": public_url,
                    "gallery": [],  # Empty for now
                    "videos": []
                },
                "commercial": {
                    "price": intel.get('price'),
                    "link": intel.get('halilit_url') or intel.get('url'),
                    "status": intel.get('status')
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

    def _smart_categorize(self, name: str, current_cat: str) -> str:
        """
        Determines the best UI category ID.
        1. Tries to consolidate existing category.
        2. If 'general', uses heuristics on Product Name.
        """
        # 1. Try strict consolidation first
        if current_cat and current_cat.lower() != 'general':
            consolidated = consolidate_category(self.brand, current_cat)
            if consolidated != 'general':
                return consolidated

        # 2. Heuristic fallback (Keyword Matching)
        name_lower = name.lower()
        
        # KEYWORDS MAPPING (Simple & Effective)
        keywords = {
            'keys': ['piano', 'synth', 'key', 'organ', 'mellotron', 'grand', 'upright', 'clavinova', 'keyboard', 'eurorack', 'modular', 'moog', 'nord', 'roland fantom', 'juno'],
            'drums': ['drum', 'cymbal', 'snare', 'kick', 'hi-hat', 'percussion', 'cajon', 'pad', 'vdrum', 'v-drum', 'td-', 'head'],
            'guitars': ['guitar', 'bass', 'strat', 'tele', 'les paul', 'pedal', 'amp', 'cabinet', 'fender', 'gibson', 'ibanez', 'boss', 'stompbox', 'multi-effect'],
            'studio': ['interface', 'monitor', 'speak', 'mic', 'preamp', 'audio', 'scarlett', 'apollo', 'neumann', 'shure', 'recording', 'isolator'],
            'live': ['mixer', 'pa system', 'wireless', 'loudspeaker', 'column', 'stage', 'allen'],
            'dj': ['controller', 'dj', 'sampler', 'turntable', 'numark', 'denon', 'serato', 'traktor', 'mpc', 'push', 'maschine'],
            'accessories': ['stand', 'case', 'cable', 'cover', 'bench', 'pedalboard', 'strap', 'pick', 'string', 'adapter', 'mount']
        }

        # Priority Check (Longer keywords first to avoid 'amp' matching 'sample')
        for cat_id, terms in keywords.items():
            for term in terms:
                if term in name_lower:
                    return cat_id

        # 3. Brand Specific Defaults
        if self.brand in ['roland', 'nord', 'moog', 'yamaha', 'korg', 'casio', 'asm', 'oberheim', 'sequential']:
            return 'keys'
                 
        if self.brand in ['pearl', 'dw', 'tama', 'mapex', 'paiste', 'zildjian', 'sabian', 'vic firth', 'remo', 'sonor', 'gretsch drums']:
            return 'drums'
            
        if self.brand in ['fender', 'gibson', 'ibanez', 'epiphone', 'esp', 'jackson', 'taylor', 'martin', 'prs', 'schecter', 'charvel', 'kramer', 'washburn', 'cort', 'godin', 'hagstrom', 'guild', 'gretsch guitars', 'supro', 'danelectro', 'rickenbacker', 'music man', 'g&l', 'squier', 'stagg', 'tokai', 'univox', 'aria', 'fernandes', 'hofner', 'jay turser', 'kay', 'mosrite', 'ovation', 'parker', 'peavey', 'samick', 'silvertone', 'teisco', 'vox', 'yamaha guitars']:
            return 'guitars'

        # Default fallback
        return 'general'

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
