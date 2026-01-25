"""
FINAL: Extract real product images and create category thumbnails.

This script scans your ENTIRE product catalog (including Cordoba, Guild, etc.)
and automatically finds the best representative image for each of the 40 Spectrum Categories.

Output: WebP thumbnails in frontend/public/data/category_thumbnails/
"""

import json
import sys
from pathlib import Path
from PIL import Image, ImageEnhance
import requests
import io
import random

# =============================================================================
# 1. THE 40 SPECTRUM CATEGORIES (Target Output)
# =============================================================================
SPECTRUM_DEFINITIONS = {
    # --- GUITARS ---
    "electric-guitars": ["Electric Guitar", "Solid Body", "Telecaster", "Stratocaster", "Les Paul", "SG", "Electric"],
    "acoustic-guitars": ["Acoustic Guitar", "Classical Guitar", "Dreadnought", "Concert", "Nylon String", "Steel String"],
    "bass-guitars": ["Bass Guitar", "Precision Bass", "Jazz Bass", "4-String", "5-String"],
    "guitar-amps": ["Guitar Amplifier", "Guitar Amp", "Combo Amp", "Cabinet", "Head"],
    "guitar-pedals": ["Overdrive", "Distortion", "Reverb", "Delay", "Looper", "Fuzz", "Guitar Pedal", "Stompbox"],
    "folk-instruments": ["Ukulele", "Banjo", "Mandolin", "Resonator"],
    "guitar-accessories": ["Guitar Strings", "Guitar Strap", "Capo", "Pick", "Gig Bag", "Case"],

    # --- DRUMS ---
    "acoustic-drums": ["Drum Kit", "Shell Pack", "Acoustic Drum", "Bass Drum"],
    "electronic-drums": ["Electronic Drum", "V-Drums", "Drum Module", "Electric Kit"],
    "cymbals": ["Crash", "Ride", "Hi-Hat", "Splash", "China", "Cymbal"],
    "snares": ["Snare Drum", "Snare"],
    "sticks-heads": ["Drumsticks", "Drum Head", "Brushes"],
    "percussion": ["Cajon", "Bongos", "Congas", "Djembe", "Shaker", "Tambourine", "Cowbell"],
    "drum-hardware": ["Cymbal Stand", "Hi-Hat Stand", "Snare Stand", "Drum Pedal", "Throne"],

    # --- KEYS ---
    "synthesizers": ["Synthesizer", "Synth", "Analog Synth", "Polyphonic"],
    "stage-pianos": ["Stage Piano", "Digital Piano", "Electric Piano"],
    "midi-controllers": ["MIDI Controller", "Keyboard Controller", "Master Keyboard"],
    "grooveboxes": ["Groovebox", "Sampler", "Drum Machine", "Sequencer"],
    "eurorack": ["Eurorack", "Modular", "Module"],
    "keys-accessories": ["Keyboard Stand", "Sustain Pedal"],

    # --- STUDIO ---
    "audio-interfaces": ["Audio Interface", "USB Interface", "Thunderbolt"],
    "studio-monitors": ["Studio Monitor", "Reference Monitor", "Active Monitor"],
    "studio-microphones": ["Condenser Microphone", "Dynamic Microphone", "Ribbon Microphone", "Studio Mic"],
    "outboard-gear": ["Preamp", "Compressor", "Equalizer", "Channel Strip"],
    "software-plugins": ["DAW", "Plugin", "VST", "Software"],
    "studio-accessories": ["Pop Filter", "Shock Mount", "Acoustic Foam"],

    # --- LIVE ---
    "pa-systems": ["PA Speaker", "Active Speaker", "Subwoofer", "Line Array"],
    "live-mixers": ["Mixing Console", "Digital Mixer", "Analog Mixer"],
    "dj-equipment": ["DJ Controller", "Turntable", "DJ Mixer"],
    "lighting": ["Moving Head", "Par Can", "Stage Light", "DMX"],
    "live-mics": ["Wireless Microphone", "Handheld Mic", "Vocal Mic"],
    "live-accessories": ["Speaker Stand", "Microphone Stand", "XLR Cable"],

     # --- UTILITY ---
    "cables": ["Instrument Cable", "Patch Cable", "Microphone Cable"],
    "stands": ["Music Stand", "Guitar Stand"],
    "cases-bags": ["Flight Case", "Soft Case"],
    "power-supplies": ["Power Supply", "Battery"],
}

# =============================================================================
# 2. HERO PRODUCTS (The "Golden List" for exact visual matches)
# ONLY HTTP-ENABLED BRANDS (Roland, Boss, Nord)
# =============================================================================
HERO_PRODUCTS = {
    # Guitars
    "electric-guitars": "Boss EURUS GS-1",              # Electronic Guitar
    "acoustic-guitars": "Boss Acoustic Singer",         # Acoustic Amp (Proxy - trusted image)
    "bass-guitars": "Boss ME-90B",                      # Bass Multi-FX
    "guitar-amps": "Boss Katana-100 Gen 3",             # Amplifier
    "guitar-pedals": "Boss DS-1W",                      # Waza Craft Distortion
    "folk-instruments": "Boss TU-05",                   # Clip-on Tuner (Proxy)
    "guitar-accessories": "Boss WL-50",                 # Wireless System
    
    # Drums
    "acoustic-drums": "Roland VAD716",                  # V-Drums Acoustic Design
    "electronic-drums": "Roland TD-50",                 # Flagship V-Drums
    "cymbals": "Roland VH-14D",                         # Digital Hi-Hats
    "snares": "Roland PD-140DS",                        # Digital Snare
    "sticks-heads": "Roland DAP-3X",                    # Accessory Pack
    "percussion": "Roland HandSonic HPD-20",            # Digital Hand Percussion
    "drum-hardware": "Roland RDH-100",                  # Noise Eater Pedal

    # Keys
    "synthesizers": "Roland JUNO-X",                    # Synthesizer
    "stage-pianos": "Nord Stage 4",                     # Flagship Piano
    "midi-controllers": "Roland A-88MK2",               # MIDI Controller
    "grooveboxes": "Roland MC-707",                     # Groovebox
    "eurorack": "Roland SYSTEM-500",                    # Modular Comp
    "keys-accessories": "Roland KSC-70",                # Stand

    # Studio
    "audio-interfaces": "Roland Rubix",                 # Interface
    "studio-monitors": "Nord Piano Monitor",            # Monitors!
    "studio-microphones": "Roland VT-4",                # Voice Transformer (Proxy)
    "outboard-gear": "Boss RE-202",                     # Space Echo
    "software-plugins": "Roland TR-8S",                 # Rhythm Performer (Proxy)
    "studio-accessories": "Roland R-07",                # High Res Recorder

    # Live
    "pa-systems": "Roland CUBE Street EX",              # PA
    "live-mixers": "Roland V-1HD",                      # Video Switcher (Visually complex mixer)
    "dj-equipment": "Roland DJ-808",                    # DJ Controller
    "lighting": "Roland VC-1-DMX",                      # DMX Controller
    "live-mics": "Boss WL-30XLR",                       # Wireless Mic System
    "live-accessories": "Boss FS-1-WL",                 # Wireless Footswitch

    # Utility
    "cables": "Roland RMC-B",                           # Cables
    "cases-bags": "Roland CB-G88",                      # Case
    "power-supplies": "Boss PSA",                       # Power Supply
    "stands": "Roland KS-10Z",                          # Heavy Duty Stand
}

class AutoThumbnailGenerator:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "frontend" / "public" / "data"
        self.output_dir = self.data_dir / "category_thumbnails"
        self.output_dir.mkdir(exist_ok=True)
        self.products = []

    def load_catalog(self):
        """Load ALL products from ALL json files"""
        count = 0
        print("📥 Loading entire catalog...")
        for json_file in self.data_dir.glob("*.json"):
            if json_file.name in ["index.json", "taxonomy.json"]:
                continue
            
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "products" in data:
                        # Annotate with brand for debugging
                        brand_name = data.get("brand_identity", {}).get("name", json_file.stem)
                        for p in data["products"]:
                            p["_source_brand"] = brand_name
                            self.products.append(p)
                            count += 1
            except Exception as e:
                print(f"⚠️ Failed to load {json_file.name}: {e}")
        
        print(f"✅ Loaded {count} products into memory.")

    def find_best_image(self, spectrum_id: str, keywords: list) -> dict:
        """Find the best product for a given category"""
        candidates = []

        for p in self.products:
            # 1. Check if product has an image
            img_url = self.get_image_url(p)
            if not img_url:
                continue

            # 2. Score the match
            score = 0
            text = (p.get("name", "") + " " + p.get("category", "") + " " + p.get("description", "")).lower()
            
            for word in keywords:
                if word.lower() in text:
                    score += 10
            
            # Boost logic
            name_lower = p.get("name", "").lower()
            if any(k.lower() in name_lower for k in keywords):
                score += 20 # Name match is better than description
            
            if score > 0:
                candidates.append((score, p))

        if not candidates:
            return None

        # Sort by score desc, then random shuffle top 5 to vary it? No, just best score.
        # Prefer brands we know have good images (optional)
        candidates.sort(key=lambda x: x[0], reverse=True)
        
        # Take the best one
        return candidates[0][1]

    def get_image_url(self, product):
        """Robust image extractor matching frontend logic"""
        if product.get("image_url") and isinstance(product["image_url"], str) and product["image_url"].startswith("http"):
            return product["image_url"]
        
        images = product.get("images", [])
        if isinstance(images, list) and images:
            first = images[0]
            if isinstance(first, str): return first
            if isinstance(first, dict) and "url" in first: return first["url"]
            
        if isinstance(images, dict):
            return images.get("main", "")
            
        return None

    def process_image(self, img_url: str, output_path: Path):
        """Download/Load, process (remove BG) and save WebP"""
        try:
            img = None
            
            # Case 1: Remote URL
            if img_url.startswith("http"):
                response = requests.get(img_url, timeout=5)
                response.raise_for_status()
                img = Image.open(io.BytesIO(response.content))
            
            # Case 2: Local Path
            elif img_url.startswith("/data/"):
                rel_path = img_url.replace("/data/", "", 1)
                local_file = self.data_dir / rel_path
                if not local_file.exists():
                    print(f"File not found: {local_file}")
                    return False
                img = Image.open(local_file)
            else:
                return False

            # Convert to RGBA
            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            # --- SMART BACKGROUND REMOVAL (Simple White Kill) ---
            # Ideally use 'rembg' but it's heavy. We'll use a tolerance mask.
            # Convert to numpy for speed? No, PIL is fine for simple stuff.
            datas = img.getdata()
            new_data = []
            tolerance = 200 # Brightness threshold (0-255)
            
            # Check corners to see if it's a white-bg image
            corners = [
                img.getpixel((0,0)), 
                img.getpixel((img.width-1, 0)), 
                img.getpixel((0, img.height-1)), 
                img.getpixel((img.width-1, img.height-1))
            ]
            is_white_bg = all(sum(c[:3]) > 700 for c in corners) # > 233 avg

            if is_white_bg:
                for item in datas:
                    # If pixel is very bright/white, make transparent.
                    # R>240 and G>240 and B>240
                    if item[0] > 230 and item[1] > 230 and item[2] > 230:
                        new_data.append((255, 255, 255, 0))
                    else:
                        new_data.append(item)
                img.putdata(new_data)
            
            # Trim transparent borders (Auto-Crop)
            bbox = img.getbbox()
            if bbox:
                img = img.crop(bbox)

            # Create standard thumbnail size
            target_size = (500, 500) # Higher res
            
            # Resize with padding (contain)
            canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
            img.thumbnail(target_size, Image.Resampling.LANCZOS)
            
            # Center on canvas
            offset_x = (target_size[0] - img.width) // 2
            offset_y = (target_size[1] - img.height) // 2
            canvas.paste(img, (offset_x, offset_y), img if img.mode == 'RGBA' else None)
            
            # Enhance
            enhancer = ImageEnhance.Contrast(canvas)
            canvas = enhancer.enhance(1.1)
            enhancer_sat = ImageEnhance.Color(canvas)
            canvas = enhancer_sat.enhance(1.2) # Boost saturation for "Pop"
            
            # Save
            canvas.save(output_path, "WEBP", quality=90)
            return True

        except Exception as e:
            print(f"❌ Error processing image {img_url}: {e}")
            return False

    def run(self):
        self.load_catalog()
        
        # Fallback
        fallback_product = next((p for p in self.products if self.get_image_url(p) and self.get_image_url(p).startswith("http")), None)

        print("\n🎨 Generating Category Thumbnails (Hero Mode)...")
        
        success_count = 0
        
        for spectrum_id, keywords in SPECTRUM_DEFINITIONS.items():
            print(f"   🔍 {spectrum_id}:", end=" ")
            
            # 1. TRY HERO SEARCH FIRST
            hero_term = HERO_PRODUCTS.get(spectrum_id)
            product = None
            
            if hero_term:
                # Exact name search first
                for p in self.products:
                    if hero_term.lower() in p.get("name", "").lower():
                        # STRICT CHECK: Must be HTTP
                        url = self.get_image_url(p)
                        if url and url.startswith("http"):
                             product = p
                             print(f"[HERO MATCH: {hero_term}]", end=" ")
                             break
            
            # 2. STANDARD KEYWORD SEARCH (Backfill)
            if not product:
                candidate = self.find_best_image(spectrum_id, keywords)
                if candidate:
                     url = self.get_image_url(candidate)
                     if url and url.startswith("http"):
                         product = candidate
            
            # 3. FALLBACK
            used_fallback = False
            if not product:
                if fallback_product:
                    product = fallback_product
                    used_fallback = True
                    print("[FALLBACK]", end=" ")
                else:
                    print("❌ SKIPPING")
                    continue

            img_url = self.get_image_url(product)
            
            # Naming Logic matching frontend/src/lib/universalCategories.ts
            prefix = ""
            if spectrum_id in ["electric-guitars", "acoustic-guitars", "bass-guitars", "guitar-amps", "guitar-pedals", "folk-instruments", "guitar-accessories"]: prefix = "guitars-"
            elif spectrum_id in ["acoustic-drums", "electronic-drums", "cymbals", "snares", "sticks-heads", "percussion", "drum-hardware"]: prefix = "drums-"
            elif spectrum_id in ["synthesizers", "stage-pianos", "midi-controllers", "grooveboxes", "eurorack", "keys-accessories"]: prefix = "keys-"
            elif spectrum_id in ["audio-interfaces", "studio-monitors", "studio-microphones", "outboard-gear", "software-plugins", "studio-accessories"]: prefix = "studio-"
            elif spectrum_id in ["pa-systems", "live-mixers", "dj-equipment", "lighting", "live-mics", "live-accessories"]: prefix = "live-"
            else: prefix = "accessories-" 

            filename = f"{prefix}{spectrum_id}_thumb.webp"
            output_path = self.output_dir / filename
            
            # print(f"-> {filename}", end=" ")
            
            if self.process_image(img_url, output_path):
                print(f"✅")
                success_count += 1
            else:
                print(f"❌ Failed")


        print(f"\n✨ Generation Complete! Created {success_count} thumbnails.")

if __name__ == "__main__":
    generator = AutoThumbnailGenerator()
    generator.run()
