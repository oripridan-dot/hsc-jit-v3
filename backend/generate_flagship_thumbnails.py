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
from typing import Optional

class FlagshipThumbnailExtractor:
    """Extract flagship product images for category thumbnails"""
    
    # FLAGSHIP PRODUCTS - Premium tier from each category
    FLAGSHIP_MAPPING = {
        # Keys & Pianos - TOP TIER
        "keys-synths": "roland_87_system8",  # Roland SYSTEM-8 (premium synth)
        "keys-stage-pianos": "roland_87_rd2000ex",  # Roland RD-2000 EX (premium stage piano)
        "keys-controllers": "akai_professional_55_apc64",  # Akai APC64 (premium controller)
        "keys-arrangers": "roland_87_junod8",  # Roland JUNO-D8 (premium arranger)
        "keys-organs": "roland_87_junod8",  # Roland JUNO-D8
        "keys-workstations": "roland_87_junod8",  # Roland JUNO-D8
        
        # Drums & Percussion - TOP TIER
        "drums-electronic-drums": "roland_87_td07dmk",  # Roland TD-07DMK (premium V-Drums)
        "drums-acoustic-drums": "roland_87_td07dmk",  # Roland TD-07DMK
        "drums-cymbals": "roland_87_td07dmk",  # Part of premium kit
        "drums-percussion": "roland_87_tr8s",  # Roland TR-8S (rhythm performer)
        "drums-drum-machines": "akai_professional_55_mpcone",  # Akai MPC One (premium drum machine)
        "drums-pads": "akai_professional_55_apc64",  # Akai APC64 (premium pads)
        
        # Guitars & Amps (using available guitar-related products)
        "guitars-electric-guitars": "boss_87_ktnminix",  # Boss Katana (premium amp)
        "guitars-bass-guitars": "boss_87_ktnminix",  # Boss Katana
        "guitars-amplifiers": "boss_87_ktnminix",  # Boss Katana (premium amplifier)
        "guitars-effects-pedals": "boss_87_ktnminix",  # Boss Katana with effects
        "guitars-multi-effects": "boss_87_ktnminix",  # Boss Katana
        "guitars-accessories": "boss_87_bsc20brn",  # Boss case/accessory
        
        # Studio & Recording
        "studio-audio-interfaces": "roland_44_apollo_twinx_x4",  # UA Apollo Twin (premium interface)
        "studio-studio-monitors": "roland_44_apollo_twinx_x4",  # UA Apollo
        "studio-microphones": "roland_87_rtmics",  # Roland mics
        "studio-outboard-gear": "roland_44_apollo_twinx_x4",  # UA Apollo
        "studio-preamps": "roland_44_apollo_twinx_x4",  # UA Apollo
        "studio-software": "roland_87_junod8",  # Digital workstation
        
        # Live Sound
        "live-pa-speakers": "roland_87_v_stage76",  # Roland V-Stage (premium live keyboard)
        "live-mixers": "roland_87_v_stage76",  # V-Stage
        "live-stage-boxes": "roland_87_v_stage76",  # V-Stage
        "live-wireless-systems": "roland_87_v_stage76",  # V-Stage
        "live-in-ear-monitoring": "roland_87_v_stage76",  # V-Stage
        
        # DJ & Production
        "dj-production": "akai_professional_55_mpcone",  # Akai MPC One (flagship production)
        "dj-dj-headphones": "akai_professional_55_apc64",  # Akai APC64
        "dj-samplers": "akai_professional_55_mpcone",  # Akai MPC One (premium sampler)
        "dj-grooveboxes": "roland_87_tr8s",  # Roland TR-8S (premium groove)
        "dj-accessories": "akai_professional_55_apc64",  # Akai premium
        
        # Software & Cloud
        "software-daw": "roland_87_junod8",  # Digital audio
        "software-plugins": "roland_87_junod8",  # Digital
        "software-sound-libraries": "roland_87_junod8",  # Digital
        
        # Accessories
        "accessories-cables": "boss_87_bsc20brn",  # Boss premium cable
        "accessories-cases": "boss_87_bsc20brn",  # Boss premium case
        "accessories-pedals": "boss_87_ktnminix",  # Boss premium pedal
        "accessories-power": "akai_professional_55_mpcone",  # Power/accessory
        "accessories-stands": "roland_87_tr8s",  # Premium stand
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
            if json_file.name in ["index.json", "taxonomy.json", "scrape_progress.json"]:
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
        """Extract flagship product images and create thumbnails"""
        print("\n🏆 GENERATING FLAGSHIP CATEGORY THUMBNAILS\n")
        print("=" * 70)
        
        success = 0
        failed = 0
        failed_categories = []
        
        for category, product_id in self.FLAGSHIP_MAPPING.items():
            if product_id not in self.products:
                print(f"✗ {category:30} - Product {product_id} not found")
                failed += 1
                failed_categories.append((category, product_id))
                continue
            
            product = self.products[product_id]
            image_url = product.get('image_url') or product.get('image')
            
            if not image_url:
                print(f"✗ {category:30} - No image URL")
                failed += 1
                failed_categories.append((category, product_id))
                continue
            
            # Fetch and process
            product_name = product.get('name', product_id)
            print(f"→ {category:30}...", end=' ', flush=True)
            
            image = self.fetch_image(image_url)
            if not image:
                failed += 1
                failed_categories.append((category, product_id))
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
                failed_categories.append((category, product_id))
        
        print("=" * 70)
        print(f"\n✅ Generated {success} / {len(self.FLAGSHIP_MAPPING)} categories")
        
        if failed_categories:
            print(f"\n⚠️  Failed categories ({len(failed_categories)}):")
            for cat, prod in failed_categories:
                print(f"   - {cat}: {prod}")
        
        return success == len(self.FLAGSHIP_MAPPING)


if __name__ == "__main__":
    extractor = FlagshipThumbnailExtractor()
    success = extractor.generate_thumbnails()
    
    if success:
        print("\n🏆 All FLAGSHIP category thumbnails created successfully!")
        print("✓ frontend/public/data/category_thumbnails/ updated")
        print("\n📝 Next: Commit changes")
    else:
        print("\n⚠️  Some categories failed. Check product mappings.")
