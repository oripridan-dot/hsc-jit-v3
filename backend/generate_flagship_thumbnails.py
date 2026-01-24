"""
FLAGSHIP PRODUCT THUMBNAILS - The Best of Each Category

Uses the most premium/expensive products from each category:
- Roland SYSTEM-8 (premium synth)
- Roland TR-8S (premium drum machine)
- Roland RD-2000 EX (premium stage piano)
- Akai MPC One (premium production)
- And more...
"""

import json
import sys
from pathlib import Path
from PIL import Image, ImageEnhance
import requests
import io
from typing import Optional, List, Dict
from rembg import remove

class FlagshipThumbnailExtractor:
    """Extract flagship product images for category thumbnails"""
    
    # Keywords to search for products in each category
    CATEGORY_KEYWORDS = {
        # Keys
        "keys-synths": ["system-8", "prophet", "moog grandmother", "nord lead", "synthesizer"],
        "keys-stage-pianos": ["rd-2000", "nord piano", "stage piano", "cp88"],
        "keys-controllers": ["apc64", "keylab", "launchkey", "midi controller"],
        "keys-arrangers": ["pa5x", "genos", "arranger", "bk-"],
        "keys-organs": ["hammond", "nord c2", "organ", "vr-730"],
        "keys-workstations": ["fantom", "montage", "nautilus", "workstation"],
        
        # Drums
        "drums-electronic-drums": ["td-50", "td-27", "v-drums", "electronic drum"],
        "drums-acoustic-drums": ["pearl reference", "pearl export", "acoustic drum"],
        "drums-cymbals": ["paiste ride", "paiste crash", "cymbal"],
        "drums-percussion": ["conga", "cajon", "handpan"],
        "drums-drum-machines": ["tr-8s", "mpc one", "drum machine"],
        "drums-pads": ["sp-404", "spdsx", "pad"],
        
        # Guitars
        "guitars-electric-guitars": ["esp ltd", "solar", "stratocaster", "electric guitar"],
        "guitars-bass-guitars": ["spector", "jazz bass", "precision bass"],
        "guitars-amplifiers": ["katana", "hiwatt", "tube amp"],
        "guitars-effects-pedals": ["distortion", "delay", "reverb", "pedal"],
        "guitars-multi-effects": ["gt-1000", "helix", "headrush"],
        "guitars-accessories": ["guitar case", "strap"],
        
        # Studio
        "studio-audio-interfaces": ["apollo", "rme", "interface"],
        "studio-studio-monitors": ["adam audio", "genelec", "monitor"],
        "studio-microphones": ["condenser", "neumann", "shure"],
        "studio-outboard-gear": ["compressor", "la-2a", "1176"],
        "studio-preamps": ["preamp", "neve"],
        "studio-software": ["cubase", "ableton", "daw"],
        
        # Live
        "live-pa-speakers": ["rcf", "montarbo", "pa speaker"],
        "live-mixers": ["allen & heath", "console", "mixer"],
        "live-stage-boxes": ["stage box", "snake"],
        "live-wireless-systems": ["xvive", "wireless mic"],
        "live-in-ear-monitoring": ["iem", "in-ear"],
        
        # DJ
        "dj-production": ["mpc", "maschine"],
        "dj-dj-headphones": ["v-moda", "dj headphone"],
        "dj-samplers": ["sp-404", "sampler"],
        "dj-grooveboxes": ["mc-707", "circuit"],
        "dj-accessories": ["decksaver", "dj case"],
        
        # Software
        "software-daw": ["cubase pro", "nuendo"],
        "software-plugins": ["uafx", "plugin"],
        "software-sound-libraries": ["library", "sound"],
        
        # Accessories
        "accessories-cables": ["xlr cable", "instrument cable"],
        "accessories-cases": ["flight case", "gig bag"],
        "accessories-pedals": ["sustain pedal", "expression pedal"],
        "accessories-power": ["power supply"],
        "accessories-stands": ["keyboard stand", "mic stand"],
    }

    # Explicit Overrides for Flagships (Optional, will take precedence if found)
    FLAGSHIP_OVERRIDES = {
        "keys-synths": "roland_87_system8",
        "keys-stage-pianos": "roland_87_rd2000",
        "drums-electronic-drums": "roland_87_td07dmk",
        "drums-drum-machines": "roland_87_tr8s", 
        "guitars-amplifiers": "boss_87_ktnminix",
    }
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "frontend" / "public" / "data"
        self.output_dir = self.data_dir / "category_thumbnails"
        self.output_dir.mkdir(exist_ok=True)
        
        self.used_ids = set()
        # Load all products into memory
        self.products = self.load_all_products()
    
    def load_all_products(self) -> Dict:
        """Load all product catalogs"""
        products = {}
        
        print("📦 Loading product catalogs...")
        for json_file in self.data_dir.glob("*.json"):
            if json_file.name in ["index.json", "taxonomy.json", "scrape_progress.json"]:
                continue
            
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    brand_name = data.get("brand_identity", {}).get("name")
                    for prod in data.get('products', []):
                        pid = prod.get('id')
                        if pid and prod.get('image_url'):
                            prod['brand_name'] = brand_name
                            products[pid] = prod
            except Exception as e:
                pass
        print(f"✅ Loaded {len(products)} products.")
        return products

    def find_best_product(self, category_key: str) -> Optional[Dict]:
        """Find the best unique product for a category"""
        
        # 1. Try Override First
        if category_key in self.FLAGSHIP_OVERRIDES:
            pid = self.FLAGSHIP_OVERRIDES[category_key]
            if pid in self.products:
                if pid not in self.used_ids:
                    return self.products[pid]
                # If used, continue to search
        
        keywords = self.CATEGORY_KEYWORDS.get(category_key, [])
        candidates = []

        for pid, prod in self.products.items():
            if pid in self.used_ids:
                continue
                
            name = prod.get('name', '').lower()
            desc = prod.get('description', '').lower() if prod.get('description') else ""
            full_text = f"{name} {desc}"
            
            score = 0
            # Higher priority for earlier keywords
            for idx, kw in enumerate(keywords):
                if kw in full_text:
                    score += (len(keywords) - idx) * 10 
            
            if score > 0:
                candidates.append((score, prod))
        
        # Sort by score desc
        candidates.sort(key=lambda x: x[0], reverse=True)
        
        if candidates:
            best = candidates[0][1]
            return best
            
        print(f"⚠️ No candidate found for {category_key}")
        return None
    
    def fetch_image(self, url: str) -> Optional[Image.Image]:
        """Download image from URL"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return Image.open(io.BytesIO(response.content))
        except Exception as e:
            print(f"  ✗ Failed to fetch image: {str(e)[:50]}")
            return None
    
    def process_to_webp(self, image: Image.Image, size: tuple, quality: int = 92) -> bytes:
        """Convert image to optimized WebP with Background Removal AND Proper Padding"""
        print("    ✨ Removing background & Standardizing...")
        try:
            # 1. Remove Background
            image = remove(image)
        except Exception as e:
            print(f"    ⚠️ Background removal failed: {e}")
            if image.mode != 'RGBA':
                image = image.convert('RGBA')

        # 2. Trim empty space (Autocrop) to get the object's true bounding box
        bbox = image.getbbox()
        if bbox:
            image = image.crop(bbox)

        # 3. Calculate target size with padding (Normalization)
        # We want the content to fit within 75% of the canvas to allow consistent "breathing room"
        target_w, target_h = size
        padding_factor = 0.75  # The object will take up at most 75% of the width/height
        
        max_object_w = int(target_w * padding_factor)
        max_object_h = int(target_h * padding_factor)
        
        # 4. Resize object to fit within max_object dimensions while maintaining aspect ratio
        image.thumbnail((max_object_w, max_object_h), Image.Resampling.LANCZOS)
        
        # 5. Enhance (Sharpen)
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.2)
        
        # 6. Create Transparent Canvas (The "Standard" Container)
        final = Image.new('RGBA', size, (0, 0, 0, 0))
        
        # 7. Center
        offset_x = (size[0] - image.width) // 2
        offset_y = (size[1] - image.height) // 2
        
        final.paste(image, (offset_x, offset_y), mask=image if image.mode == 'RGBA' else None)
        
        # 8. Export to WebP
        buffer = io.BytesIO()
        final.save(buffer, format='WEBP', quality=quality)
        return buffer.getvalue()
    
    def generate_thumbnails(self):
        """Generate all thumbnails"""
        print(f"🚀 Generating {len(self.CATEGORY_KEYWORDS)} category thumbnails...")
        
        for cat_key in self.CATEGORY_KEYWORDS.keys():
            print(f"\nProcessing {cat_key}...")
            
            product = self.find_best_product(cat_key)
            if not product:
                continue
                
            self.used_ids.add(product['id'])
            print(f"  ✅ Selected: {product['name']} ({product.get('brand_name')})")
            
            image_url = product.get('image_url')
            if not image_url:
                continue
                
            image = self.fetch_image(image_url)
            if not image:
                continue
                
            # Process Thumbnail (400x400)
            thumb_data = self.process_to_webp(image, (400, 400), quality=92)
            thumb_path = self.output_dir / f"{cat_key}_thumb.webp"
            with open(thumb_path, 'wb') as f:
                f.write(thumb_data)
                
            # Process Inspect (800x800)
            inspect_data = self.process_to_webp(image, (800, 800), quality=95)
            inspect_path = self.output_dir / f"{cat_key}_inspect.webp"
            with open(inspect_path, 'wb') as f:
                f.write(inspect_data)
                
            print(f"  💾 Saved to {thumb_path.name}")

if __name__ == "__main__":
    extractor = FlagshipThumbnailExtractor()
    extractor.generate_thumbnails()
