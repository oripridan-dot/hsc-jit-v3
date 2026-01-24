"""
FINAL: Extract real product images and create category thumbnails.

Maps 40 category thumbnails to actual products from your catalog:
- Roland TD-02KV (V-Drums)
- Akai MPD218 (Pads/Drum Machine)
- Roland RD-2000 (Stage Piano)
- Nord Drum 3P (Synthesizer)
- And more...

Output: WebP thumbnails in frontend/public/data/category_thumbnails/
"""

import json
import sys
from pathlib import Path
from PIL import Image, ImageEnhance
import requests
import io
from typing import Optional

class ProductThumbnailExtractor:
    """Extract real product images and convert to category thumbnails"""
    
    # REAL PRODUCTS FROM YOUR CATALOG - Curated for recognition
    PRODUCT_MAPPING = {
        # Keys & Pianos
        "keys-synths": "nord_42_drum3p",  # Nord Drum 3P - synthesizer
        "keys-stage-pianos": "roland_87_rd2000",  # Roland RD-2000
        "keys-controllers": "akai_professional_55_mpd218",  # Akai MPD218
        "keys-arrangers": "roland_87_vad716sw",  # Roland VAD716
        "keys-organs": "roland_87_vad716sw",  # Roland (electronic)
        "keys-workstations": "roland_87_vad716sw",  # Roland workstation
        
        # Drums & Percussion (6)
        "drums-electronic-drums": "roland_87_td02kv",  # Roland V-Drums TD-02KV
        "drums-acoustic-drums": "roland_87_td02kv",  # Same kit
        "drums-cymbals": "roland_87_td02kv",  # Part of kit
        "drums-percussion": "roland_87_td02kv",  # Part of kit
        "drums-drum-machines": "akai_professional_55_mpd218",  # Akai MPD218
        "drums-pads": "akai_professional_55_mpd218",  # Akai pads
        
        # Guitars & Amps (6)
        "guitars-electric-guitars": "roland_87_p6",  # P-6 sampler
        "guitars-bass-guitars": "roland_87_p6",  # P-6
        "guitars-amplifiers": "roland_87_p6",  # P-6
        "guitars-effects-pedals": "roland_87_p6",  # P-6
        "guitars-multi-effects": "roland_87_p6",  # P-6
        "guitars-accessories": "akai_professional_55_mpd218",  # Akai
        
        # Studio & Recording (6)
        "studio-audio-interfaces": "roland_44_apollo_twinx_x4",  # UA Apollo
        "studio-studio-monitors": "roland_44_apollo_twinx_x4",  # UA Apollo
        "studio-microphones": "roland_87_rtmics",  # Roland RT-MICS
        "studio-outboard-gear": "roland_44_apollo_twinx_x4",  # UA
        "studio-preamps": "roland_44_apollo_twinx_x4",  # UA
        "studio-software": "roland_87_vad716sw",  # Roland (digital)
        
        # Live Sound (5)
        "live-pa-speakers": "roland_87_v_stage76",  # Roland V-Stage
        "live-mixers": "roland_87_v_stage76",  # V-Stage
        "live-stage-boxes": "roland_87_v_stage76",  # V-Stage
        "live-wireless-systems": "roland_87_v_stage76",  # V-Stage
        "live-in-ear-monitoring": "roland_87_v_stage76",  # V-Stage
        
        # DJ & Production (5)
        "dj-production": "roland_87_cbbdj202",  # Roland DJ equipment
        "dj-dj-headphones": "roland_87_cbbdj202",  # Roland
        "dj-samplers": "akai_professional_55_mpd218",  # Akai MPC-like
        "dj-grooveboxes": "akai_professional_55_mpd218",  # Akai
        "dj-accessories": "akai_professional_55_mpd218",  # Akai
        
        # Software & Cloud (3)
        "software-daw": "roland_87_vad716sw",  # Digital
        "software-plugins": "roland_87_vad716sw",  # Digital
        "software-sound-libraries": "roland_87_vad716sw",  # Digital
        
        # Accessories (5)
        "accessories-cables": "akai_professional_55_mpd218",  # Cable/accessory
        "accessories-cases": "roland_87_cb404",  # Roland carrying case
        "accessories-pedals": "akai_professional_55_mpd218",  # Pedal
        "accessories-power": "akai_professional_55_mpd218",  # Power
        "accessories-stands": "roland_87_p6",  # Stand
    }
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "frontend" / "public" / "data"
        self.output_dir = self.data_dir / "category_thumbnails"
        self.output_dir.mkdir(exist_ok=True)
        
        # Load all products into memory
        self.products = self.load_all_products()
    
    def load_all_products(self):
        """Load all product catalogs"""
        products = {}
        
        for json_file in self.data_dir.glob("*.json"):
            if json_file.name in ["index.json", "taxonomy.json"]:
                continue
            
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    for prod in data.get('products', []):
                        pid = prod.get('id')
                        if pid:
                            products[pid] = prod
            except:
                pass
        
        return products
    
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
        """Convert image to optimized WebP"""
        # Convert to RGB
        if image.mode != 'RGB':
            if image.mode == 'RGBA':
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[3])
                image = background
            else:
                image = image.convert('RGB')
        
        # Resize maintaining aspect ratio
        image.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Enhance sharpness for clarity
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.2)
        
        # Create canvas
        final = Image.new('RGB', size, (255, 255, 255))
        offset = ((size[0] - image.width) // 2, (size[1] - image.height) // 2)
        final.paste(image, offset)
        
        # Export to WebP
        buffer = io.BytesIO()
        final.save(buffer, format='WEBP', quality=quality)
        return buffer.getvalue()
    
    def generate_thumbnails(self):
        """Extract product images and create thumbnails"""
        print("\n📸 GENERATING CATEGORY THUMBNAILS\n")
        print("=" * 70)
        
        success = 0
        failed = 0
        
        for category, product_id in self.PRODUCT_MAPPING.items():
            if product_id not in self.products:
                print(f"✗ {category:30} - Product {product_id} not found")
                failed += 1
                continue
            
            product = self.products[product_id]
            image_url = product.get('image_url') or product.get('image')
            
            if not image_url:
                print(f"✗ {category:30} - No image URL")
                failed += 1
                continue
            
            # Fetch and process
            print(f"→ {category:30}...", end=' ', flush=True)
            
            image = self.fetch_image(image_url)
            if not image:
                failed += 1
                continue
            
            try:
                # Create thumbnail (400x400)
                thumb_data = self.process_to_webp(image, (400, 400), quality=92)
                thumb_file = self.output_dir / f"{category}_thumb.webp"
                with open(thumb_file, 'wb') as f:
                    f.write(thumb_data)
                
                # Create inspect version (800x800)
                inspect_data = self.process_to_webp(image, (800, 800), quality=95)
                inspect_file = self.output_dir / f"{category}_inspect.webp"
                with open(inspect_file, 'wb') as f:
                    f.write(inspect_data)
                
                print(f"✓ ({len(thumb_data)//1024}KB + {len(inspect_data)//1024}KB)")
                success += 1
                
            except Exception as e:
                print(f"✗ {str(e)[:40]}")
                failed += 1
        
        print("=" * 70)
        print(f"\n✅ Generated {success} / {len(self.PRODUCT_MAPPING)} categories")
        if failed > 0:
            print(f"⚠️  Failed: {failed} categories")
        
        return success == len(self.PRODUCT_MAPPING)


if __name__ == "__main__":
    extractor = ProductThumbnailExtractor()
    success = extractor.generate_thumbnails()
    
    if success:
        print("\n🎉 All category thumbnails created successfully!")
        print("✓ frontend/public/data/category_thumbnails/ updated")
        print("\n📝 Next: Commit changes")
        print("   git add frontend/public/data/category_thumbnails/")
        print("   git commit -m 'feat: Add real product category thumbnails'")
    else:
        print("\n⚠️  Some categories failed. Please check product mappings.")
        sys.exit(1)
