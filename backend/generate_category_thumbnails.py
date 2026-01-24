"""
Extract best product images from catalog and create category thumbnails.
Maps best representatives of each category to appropriate thumbnail.
"""

import json
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import io

class CategoryThumbnailGenerator:
    """Generate category thumbnails from best product images"""
    
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "frontend" / "public" / "data"
        self.category_thumbnails_dir = self.data_dir / "category_thumbnails"
        self.category_thumbnails_dir.mkdir(exist_ok=True)
        
    def load_product_data(self):
        """Load all product data from JSON catalogs"""
        products = {}
        
        # Load index.json to understand structure
        index_path = self.data_dir / "index.json"
        if index_path.exists():
            with open(index_path, 'r') as f:
                index = json.load(f)
                print(f"Loaded index with {len(index.get('brands', []))} brands")
        
        return products
    
    def find_best_product_for_category(self, category_id):
        """
        Find the best product image that represents a category.
        Currently placeholders - should be mapped manually.
        """
        
        # Mapping of category to product characteristics
        category_mapping = {
            # Keys & Pianos
            "keys-synths": {"brands": ["nord", "moog", "roland"], "types": ["synth", "synthesizer"]},
            "keys-stage-pianos": {"brands": ["nord", "roland"], "types": ["piano", "stage piano"]},
            "keys-controllers": {"brands": ["roland", "akai"], "types": ["controller", "keyboard"]},
            "keys-arrangers": {"brands": ["roland"], "types": ["arranger"]},
            "keys-organs": {"brands": ["nord"], "types": ["organ", "b3"]},
            "keys-workstations": {"brands": ["roland"], "types": ["workstation"]},
            
            # Drums & Percussion
            "drums-electronic-drums": {"brands": ["roland"], "types": ["v-drum", "electronic drum"]},
            "drums-acoustic-drums": {"brands": ["roland", "pearl"], "types": ["drum kit", "acoustic drum"]},
            "drums-cymbals": {"brands": ["roland"], "types": ["cymbal"]},
            "drums-percussion": {"brands": ["roland"], "types": ["percussion"]},
            "drums-drum-machines": {"brands": ["roland", "akai"], "types": ["drum machine"]},
            "drums-pads": {"brands": ["akai"], "types": ["pad"]},
            
            # Guitars & Amps
            "guitars-electric-guitars": {"brands": ["boss"], "types": ["guitar", "electric guitar"]},
            "guitars-bass-guitars": {"brands": ["boss"], "types": ["bass", "bass guitar"]},
            "guitars-amplifiers": {"brands": ["boss"], "types": ["amp", "amplifier"]},
            "guitars-effects-pedals": {"brands": ["boss"], "types": ["pedal", "effect"]},
            "guitars-multi-effects": {"brands": ["boss"], "types": ["multi-effects"]},
            "guitars-accessories": {"brands": ["boss"], "types": ["strap", "cable"]},
            
            # Studio & Recording
            "studio-audio-interfaces": {"brands": [], "types": ["interface", "audio interface"]},
            "studio-studio-monitors": {"brands": [], "types": ["monitor", "speaker"]},
            "studio-microphones": {"brands": [], "types": ["microphone", "mic"]},
            "studio-outboard-gear": {"brands": [], "types": ["outboard", "processor"]},
            "studio-preamps": {"brands": [], "types": ["preamp"]},
            "studio-software": {"brands": [], "types": ["software", "daw"]},
            
            # Live Sound
            "live-pa-speakers": {"brands": [], "types": ["pa", "speaker", "cabinet"]},
            "live-mixers": {"brands": [], "types": ["mixer", "console"]},
            "live-stage-boxes": {"brands": [], "types": ["stage box"]},
            "live-wireless-systems": {"brands": [], "types": ["wireless", "microphone"]},
            "live-in-ear-monitoring": {"brands": [], "types": ["monitor", "iem"]},
            
            # DJ & Production
            "dj-production": {"brands": [], "types": ["controller", "dj"]},
            "dj-dj-headphones": {"brands": [], "types": ["headphones", "headphone"]},
            "dj-samplers": {"brands": [], "types": ["sampler", "sampling"]},
            "dj-grooveboxes": {"brands": [], "types": ["groovebox"]},
            "dj-accessories": {"brands": [], "types": ["accessory"]},
            
            # Software & Cloud
            "software-daw": {"brands": [], "types": ["daw", "digital audio workstation"]},
            "software-plugins": {"brands": [], "types": ["plugin", "vst"]},
            "software-sound-libraries": {"brands": [], "types": ["library", "sound"]},
            
            # Accessories
            "accessories-cables": {"brands": [], "types": ["cable", "xlr"]},
            "accessories-cases": {"brands": [], "types": ["case", "bag"]},
            "accessories-pedals": {"brands": [], "types": ["pedal", "footswitch"]},
            "accessories-power": {"brands": [], "types": ["power", "psu"]},
            "accessories-stands": {"brands": [], "types": ["stand", "holder"]},
        }
        
        return category_mapping.get(category_id, {})
    
    def generate_placeholders(self):
        """
        Generate placeholder images for missing category thumbnails.
        Should be replaced with real product images.
        """
        print("Category Thumbnail Generator")
        print("=" * 60)
        print("\n⚠️  This tool is designed to extract product images and")
        print("convert them into category thumbnails.")
        print("\nCurrent status: Placeholder generation needed")
        print("\nHow to add real images:")
        print("1. Identify best product for each category")
        print("2. Download/prepare WebP images")
        print("3. Place in: frontend/public/data/category_thumbnails/")
        print("4. Use naming: {category}_{thumb|inspect}.webp")
        
    def map_products_to_categories(self):
        """
        Manual mapping of product images to categories.
        This is where you configure which product represents which category.
        """
        
        mapping = {
            # Example: Use this to manually assign product images
            # "keys-synths": "nord_lead_a1",
            # "keys-stage-pianos": "nord_stage_3",
            # etc.
        }
        
        print("\n📋 Category Mapping (configure in code):")
        print("   Each category needs a source product image")
        print("   Edit 'map_products_to_categories()' method")
        
        return mapping


if __name__ == "__main__":
    generator = CategoryThumbnailGenerator()
    generator.generate_placeholders()
    generator.map_products_to_categories()
    
    print("\n✨ Next Steps:")
    print("1. Source product images from:")
    print("   - Existing product catalog images")
    print("   - Brand official photos")
    print("   - Stock photography sites")
    print("2. Convert to WebP format with transparent backgrounds")
    print("3. Size appropriately:")
    print("   - Thumbnail: 400x400px")
    print("   - Inspect: 800x800px")
    print("4. Use visual_factory.py for processing")
