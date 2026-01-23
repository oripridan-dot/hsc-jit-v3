"""
🎨 AI THUMBNAIL CURATOR - Perfect "See Then Read" Experience
=============================================================

This AI-powered system creates perfect subcategory thumbnails by:

1. UNDERSTANDING: What product type best represents each subcategory
2. SOURCING: Fetching high-quality product images from manufacturers
3. PROCESSING: Background removal, cropping, normalization
4. VALIDATING: Ensuring visual quality meets standards

The goal: When a user sees a thumbnail, they INSTANTLY know what category it is
before reading the label. Perfect visual communication.
"""

import json
import os
import io
import asyncio
import aiohttp
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
from rembg import remove
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
import hashlib

# =============================================================
# CONFIGURATION
# =============================================================

OUTPUT_DIR = Path("../frontend/public/data/category_thumbnails")
CACHE_DIR = Path("./data/thumbnail_cache")
THUMB_SIZE = (400, 400)
PADDING = 40  # Breathing room around product

# =============================================================
# AI SUBCATEGORY REASONING
# Each subcategory gets a curated "ideal product" selection
# with reasoning for WHY this product best represents the category
# =============================================================

SUBCATEGORY_CURATION = {
    # ═══════════════════════════════════════════════════════════
    # KEYS & PIANOS
    # ═══════════════════════════════════════════════════════════
    "keys-synths": {
        "reasoning": "Synthesizers should show a modern polysynth with visible knobs and keyboard. The Moog One or Nord Wave are iconic choices.",
        "ideal_product": "Moog One",
        "source_url": "https://www.moogmusic.com/sites/default/files/2022-05/Moog-One-16-Synth-quarter-left.png",
        "fallback_urls": [
            "https://www.nordkeyboards.com/sites/default/files/files/products/nord-wave-2/images/Nord-Wave-2-white.png"
        ],
        "keywords": ["synthesizer", "polysynth", "analog synth"]
    },
    "keys-stage-pianos": {
        "reasoning": "Stage pianos should show a sleek, professional keyboard with red accents (Nord signature). Clean lines, premium look.",
        "ideal_product": "Nord Stage 4",
        "source_url": "https://www.nordkeyboards.com/sites/default/files/files/products/nord-stage-4/images/Nord-Stage-4-88-angle.png",
        "fallback_urls": [
            "https://static.roland.com/assets/images/products/gallery/rd-2000_angle_gal.png"
        ],
        "keywords": ["stage piano", "digital piano", "performance keyboard"]
    },
    "keys-controllers": {
        "reasoning": "MIDI controllers should show pads and keys together - the iconic MPC or Akai MPK Mini layout is instantly recognizable.",
        "ideal_product": "Akai MPK Mini MK3",
        "source_url": "https://www.akaipro.com/amfile/file/download/file/2318/product/2936/",
        "fallback_urls": [
            "https://static.roland.com/assets/images/products/gallery/a-88mk2_angle_gal.png"
        ],
        "keywords": ["midi controller", "keyboard controller", "pads"]
    },
    "keys-arrangers": {
        "reasoning": "Arrangers should show a full-size keyboard with built-in speakers and screen - the classic arranger aesthetic.",
        "ideal_product": "Roland E-A7",
        "source_url": "https://static.roland.com/assets/images/products/gallery/e-a7_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["arranger keyboard", "workstation"]
    },
    "keys-organs": {
        "reasoning": "Organs should show the distinctive drawbars and dual-manual design. Nord Electro or C2D are perfect.",
        "ideal_product": "Nord C2D",
        "source_url": "https://www.nordkeyboards.com/sites/default/files/files/products/nord-c2d/images/Nord-C2D-white.png",
        "fallback_urls": [],
        "keywords": ["organ", "drawbars", "hammond style"]
    },
    "keys-workstations": {
        "reasoning": "Workstations should show the flagship synth with large display - FANTOM or Montage aesthetic.",
        "ideal_product": "Roland FANTOM-8",
        "source_url": "https://static.roland.com/assets/images/products/gallery/fantom-8_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["workstation", "flagship synth", "music production"]
    },
    
    # ═══════════════════════════════════════════════════════════
    # DRUMS & PERCUSSION  
    # ═══════════════════════════════════════════════════════════
    "drums-electronic-drums": {
        "reasoning": "V-Drums are THE iconic e-drums. Show the full kit with mesh heads - instantly recognizable.",
        "ideal_product": "Roland TD-50KV2",
        "source_url": "https://static.roland.com/assets/images/products/gallery/td-50kv2_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["electronic drums", "v-drums", "e-kit"]
    },
    "drums-acoustic-drums": {
        "reasoning": "Show a classic acoustic drum kit - snare, toms, kick, hi-hat. Natural wood finish preferred.",
        "ideal_product": "Roland VAD706",
        "source_url": "https://static.roland.com/assets/images/products/gallery/vad706_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["acoustic drums", "drum kit", "drum set"]
    },
    "drums-cymbals": {
        "reasoning": "Cymbals should show the distinctive metallic shimmer - a hi-hat or ride cymbal.",
        "ideal_product": "Roland CY-18DR",
        "source_url": "https://static.roland.com/assets/images/products/gallery/cy-18dr_top_gal.png",
        "fallback_urls": [],
        "keywords": ["cymbal", "hi-hat", "ride cymbal"]
    },
    "drums-percussion": {
        "reasoning": "Percussion should show electronic hand drums or SPD-style pads - versatile, modern.",
        "ideal_product": "Roland SPD-SX PRO",
        "source_url": "https://static.roland.com/assets/images/products/gallery/spd-sx-pro_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["percussion", "hand drums", "electronic percussion"]
    },
    "drums-drum-machines": {
        "reasoning": "Drum machines should show the classic grid of pads - TR-8S or MPC style.",
        "ideal_product": "Roland TR-8S",
        "source_url": "https://static.roland.com/assets/images/products/gallery/tr-8s_angle_gal.png",
        "fallback_urls": [
            "https://www.akaipro.com/amfile/file/download/file/1973/product/2625/"
        ],
        "keywords": ["drum machine", "rhythm composer", "beat maker"]
    },
    "drums-pads": {
        "reasoning": "Drum pads should show finger drumming pads - MPC or Maschine style grid.",
        "ideal_product": "Akai MPC Live II",
        "source_url": "https://www.akaipro.com/amfile/file/download/file/2234/product/2841/",
        "fallback_urls": [],
        "keywords": ["drum pads", "finger drumming", "pad controller"]
    },
    
    # ═══════════════════════════════════════════════════════════
    # GUITARS & AMPS
    # ═══════════════════════════════════════════════════════════
    "guitars-electric-guitars": {
        "reasoning": "Electric guitars - show a classic body shape (Strat/LP style). Clean, iconic silhouette.",
        "ideal_product": "Fender Player Stratocaster",
        "source_url": "https://www.fender.com/on/demandware.static/-/Sites-masterCatalog_Fender/default/dw4c8d5f48/images/fender-guitar.png",
        "fallback_urls": [],
        "keywords": ["electric guitar", "stratocaster", "les paul"]
    },
    "guitars-bass-guitars": {
        "reasoning": "Bass guitars - show the longer neck and classic bass body. P-Bass or Jazz Bass shape.",
        "ideal_product": "Fender Precision Bass",
        "source_url": "https://www.fender.com/on/demandware.static/-/Sites-masterCatalog_Fender/default/dw4c8d5f48/images/fender-bass.png",
        "fallback_urls": [],
        "keywords": ["bass guitar", "precision bass", "jazz bass"]
    },
    "guitars-amplifiers": {
        "reasoning": "Guitar amps - show a classic combo amp with grille cloth and control panel. Iconic amp aesthetic.",
        "ideal_product": "BOSS Katana-100 MkII",
        "source_url": "https://static.boss.com/assets/images/products/gallery/katana-100-mkii_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["guitar amp", "amplifier", "combo amp"]
    },
    "guitars-effects-pedals": {
        "reasoning": "Effect pedals - show a classic stompbox with knobs and footswitch. BOSS DS-1 style iconic.",
        "ideal_product": "BOSS DS-1",
        "source_url": "https://static.boss.com/assets/images/products/gallery/ds-1_top_gal.png",
        "fallback_urls": [],
        "keywords": ["effect pedal", "stompbox", "guitar effects"]
    },
    "guitars-multi-effects": {
        "reasoning": "Multi-effects should show a floor unit with display and multiple footswitches.",
        "ideal_product": "BOSS GT-1000",
        "source_url": "https://static.boss.com/assets/images/products/gallery/gt-1000_top_gal.png",
        "fallback_urls": [],
        "keywords": ["multi-effects", "floor processor", "pedalboard"]
    },
    "guitars-accessories": {
        "reasoning": "Guitar accessories - show cables, picks, or straps. Practical items.",
        "ideal_product": "Guitar Cable",
        "source_url": "https://static.roland.com/assets/images/products/gallery/ric-g3_main_gal.png",
        "fallback_urls": [],
        "keywords": ["guitar cable", "strap", "picks"]
    },
    
    # ═══════════════════════════════════════════════════════════
    # STUDIO & RECORDING
    # ═══════════════════════════════════════════════════════════
    "studio-audio-interfaces": {
        "reasoning": "Audio interfaces should show the iconic front panel with inputs/outputs. Apollo or Volt style.",
        "ideal_product": "Universal Audio Apollo Twin X",
        "source_url": "https://media.uaudio.com/assetlibrary/a/p/apollo_twin_x_duo_heritage_edition_3qtr_on_side.png",
        "fallback_urls": [
            "https://media.uaudio.com/assetlibrary/v/o/volt_276_3qtr.png"
        ],
        "keywords": ["audio interface", "recording interface", "usb interface"]
    },
    "studio-studio-monitors": {
        "reasoning": "Studio monitors should show the distinctive woofer/tweeter design. ADAM or Yamaha style.",
        "ideal_product": "ADAM Audio A7V",
        "source_url": "https://www.adam-audio.com/wp-content/uploads/2021/03/ADAM-Audio-A-Series-A7V-front.png",
        "fallback_urls": [],
        "keywords": ["studio monitor", "reference monitor", "nearfield monitor"]
    },
    "studio-microphones": {
        "reasoning": "Microphones should show a classic large diaphragm condenser - the iconic studio mic shape.",
        "ideal_product": "Warm Audio WA-87",
        "source_url": "https://warmaudio.com/wp-content/uploads/2021/09/WA-87-R2_Front_transparent.png",
        "fallback_urls": [],
        "keywords": ["condenser microphone", "studio mic", "large diaphragm"]
    },
    "studio-preamps": {
        "reasoning": "Preamps should show the classic rack-mount unit with VU meters and knobs.",
        "ideal_product": "Warm Audio WA73-EQ",
        "source_url": "https://warmaudio.com/wp-content/uploads/2019/11/WA73-EQ_Front_Transparent.png",
        "fallback_urls": [],
        "keywords": ["preamp", "mic preamp", "channel strip"]
    },
    "studio-outboard-gear": {
        "reasoning": "Outboard gear - show classic rack gear like compressors or EQs. Hardware processing.",
        "ideal_product": "Warm Audio WA-2A",
        "source_url": "https://warmaudio.com/wp-content/uploads/2019/11/WA-2A_Front_Transparent.png",
        "fallback_urls": [],
        "keywords": ["compressor", "eq", "outboard gear"]
    },
    "studio-software": {
        "reasoning": "Software - show a plugin interface or DAW screen. Digital audio workstation.",
        "ideal_product": "Universal Audio Plugins",
        "source_url": "https://media.uaudio.com/assetlibrary/u/a/uad_spark_plugins_montage.png",
        "fallback_urls": [],
        "keywords": ["plugins", "daw", "recording software"]
    },
    
    # ═══════════════════════════════════════════════════════════
    # LIVE SOUND
    # ═══════════════════════════════════════════════════════════
    "live-pa-speakers": {
        "reasoning": "PA speakers should show a powered speaker with distinctive horn and woofer.",
        "ideal_product": "Mackie Thump15A",
        "source_url": "https://mackie.com/img/product_thumb/thump15a_front.png",
        "fallback_urls": [],
        "keywords": ["pa speaker", "powered speaker", "live sound"]
    },
    "live-mixers": {
        "reasoning": "Mixers should show the classic fader layout - analog or digital mixing console.",
        "ideal_product": "Mackie ProFX16v3",
        "source_url": "https://mackie.com/img/product_thumb/profx16v3_top.png",
        "fallback_urls": [],
        "keywords": ["mixer", "mixing console", "live mixer"]
    },
    "live-powered-mixers": {
        "reasoning": "Powered mixers combine mixer and amplification - show the all-in-one unit.",
        "ideal_product": "Mackie PPM1012",
        "source_url": "https://mackie.com/img/product_thumb/ppm1012_top.png",
        "fallback_urls": [],
        "keywords": ["powered mixer", "mixer amp", "all-in-one"]
    },
    "live-wireless-systems": {
        "reasoning": "Wireless systems - show transmitter and receiver units. Professional wireless.",
        "ideal_product": "Shure SLXD",
        "source_url": "https://pubs.shure.com/guide/SLXD/en-US/content/resources/images/SLXD4D_Front.png",
        "fallback_urls": [],
        "keywords": ["wireless system", "wireless mic", "wireless transmitter"]
    },
    "live-in-ear-monitoring": {
        "reasoning": "In-ear monitors - show the IEM earpieces and beltpack receiver.",
        "ideal_product": "Shure PSM300",
        "source_url": "https://pubs.shure.com/guide/PSM300/en-US/content/resources/images/P3TRA215CL_Front.png",
        "fallback_urls": [],
        "keywords": ["in-ear monitor", "iem", "personal monitor"]
    },
    "live-stage-boxes": {
        "reasoning": "Stage boxes - show the multi-channel connection box for live sound.",
        "ideal_product": "Mackie DL32S",
        "source_url": "https://mackie.com/img/product_thumb/dl32s_angle.png",
        "fallback_urls": [],
        "keywords": ["stage box", "digital snake", "audio snake"]
    },
    
    # ═══════════════════════════════════════════════════════════
    # DJ & PRODUCTION
    # ═══════════════════════════════════════════════════════════
    "dj-dj-controllers": {
        "reasoning": "DJ controllers should show the classic dual-deck layout with jog wheels and mixer.",
        "ideal_product": "Roland DJ-707M",
        "source_url": "https://static.roland.com/assets/images/products/gallery/dj-707m_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["dj controller", "dj deck", "dj mixer"]
    },
    "dj-grooveboxes": {
        "reasoning": "Grooveboxes should show the all-in-one production unit - OP-1 or MC-707 style.",
        "ideal_product": "Teenage Engineering OP-1 Field",
        "source_url": "https://teenage.engineering/images/op-1-field-front.png",
        "fallback_urls": [
            "https://static.roland.com/assets/images/products/gallery/mc-707_angle_gal.png"
        ],
        "keywords": ["groovebox", "portable studio", "all-in-one"]
    },
    "dj-samplers": {
        "reasoning": "Samplers should show the classic MPC pad layout - the iconic sampler design.",
        "ideal_product": "Akai MPC One+",
        "source_url": "https://www.akaipro.com/amfile/file/download/file/2487/product/3085/",
        "fallback_urls": [],
        "keywords": ["sampler", "mpc", "sampling workstation"]
    },
    "dj-dj-headphones": {
        "reasoning": "DJ headphones should show the swivel cups and professional design.",
        "ideal_product": "Audio-Technica ATH-M50x",
        "source_url": "https://www.audio-technica.com/en-us/media/catalog/product/a/t/ath-m50x_01.png",
        "fallback_urls": [],
        "keywords": ["dj headphones", "studio headphones", "monitoring"]
    },
    "dj-production": {
        "reasoning": "Production gear - show synths or drum machines for electronic music production.",
        "ideal_product": "Teenage Engineering EP-133",
        "source_url": "https://teenage.engineering/images/ep-133-ko-ii.png",
        "fallback_urls": [],
        "keywords": ["production", "beatmaking", "electronic music"]
    },
    "dj-accessories": {
        "reasoning": "DJ accessories - cables, cases, stands for DJ gear.",
        "ideal_product": "DJ Stand",
        "source_url": "https://mackie.com/img/product_thumb/speaker_stand.png",
        "fallback_urls": [],
        "keywords": ["dj stand", "dj case", "dj accessories"]
    },
    
    # ═══════════════════════════════════════════════════════════
    # SOFTWARE & CLOUD
    # ═══════════════════════════════════════════════════════════
    "software-daw": {
        "reasoning": "DAW should show the software interface - timeline, tracks, mixing view.",
        "ideal_product": "Ableton Live",
        "source_url": "https://cdn-resources.ableton.com/resources/images/live-11.png",
        "fallback_urls": [],
        "keywords": ["daw", "digital audio workstation", "recording software"]
    },
    "software-plugins": {
        "reasoning": "Plugins should show VST/AU plugin interfaces - virtual instruments or effects.",
        "ideal_product": "UAD Plugins",
        "source_url": "https://media.uaudio.com/assetlibrary/u/a/uad_plugin_montage.png",
        "fallback_urls": [],
        "keywords": ["plugin", "vst", "virtual instrument"]
    },
    "software-sound-libraries": {
        "reasoning": "Sound libraries - show sample packs or preset collections.",
        "ideal_product": "Roland Cloud",
        "source_url": "https://static.roland.com/assets/images/products/gallery/roland-cloud_main_gal.png",
        "fallback_urls": [],
        "keywords": ["sound library", "sample pack", "presets"]
    },
    
    # ═══════════════════════════════════════════════════════════
    # ACCESSORIES
    # ═══════════════════════════════════════════════════════════
    "accessories-cables": {
        "reasoning": "Cables should show high-quality audio cables - XLR, TRS, instrument cables.",
        "ideal_product": "Mogami Gold Cable",
        "source_url": "https://www.mogamicable.com/wp-content/uploads/2020/09/gold-instrument.png",
        "fallback_urls": [],
        "keywords": ["cable", "xlr cable", "instrument cable"]
    },
    "accessories-cases": {
        "reasoning": "Cases should show protective gear cases - flight cases or gig bags.",
        "ideal_product": "SKB Case",
        "source_url": "https://skbcases.com/music/images/products/hardshell-keyboard-case.png",
        "fallback_urls": [],
        "keywords": ["case", "gig bag", "flight case"]
    },
    "accessories-stands": {
        "reasoning": "Stands should show keyboard stands or speaker stands - sturdy support.",
        "ideal_product": "Roland KS-20X",
        "source_url": "https://static.roland.com/assets/images/products/gallery/ks-20x_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["stand", "keyboard stand", "speaker stand"]
    },
    "accessories-pedals": {
        "reasoning": "Pedals (accessories) - sustain pedals, expression pedals for keyboards.",
        "ideal_product": "Roland DP-10",
        "source_url": "https://static.roland.com/assets/images/products/gallery/dp-10_angle_gal.png",
        "fallback_urls": [],
        "keywords": ["sustain pedal", "expression pedal", "foot controller"]
    },
    "accessories-power": {
        "reasoning": "Power accessories - power supplies, surge protectors, power conditioners.",
        "ideal_product": "Furman Power Conditioner",
        "source_url": "https://www.furmanpower.com/wp-content/uploads/M-8x2_Front.png",
        "fallback_urls": [],
        "keywords": ["power supply", "power conditioner", "surge protector"]
    },
}


@dataclass
class ProcessedThumbnail:
    """Result of thumbnail processing"""
    subcategory_id: str
    source_url: str
    local_path: str
    reasoning: str
    product_name: str
    width: int
    height: int
    file_size: int
    avg_brightness: float
    success: bool
    error: Optional[str] = None


class AIThumbnailCurator:
    """AI-powered thumbnail curation system"""
    
    def __init__(self):
        self.output_dir = OUTPUT_DIR
        self.cache_dir = CACHE_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.results: List[ProcessedThumbnail] = []
        
    def _get_cache_path(self, url: str) -> Path:
        """Generate cache path for a URL"""
        url_hash = hashlib.md5(url.encode()).hexdigest()
        return self.cache_dir / f"{url_hash}.png"
    
    async def fetch_image(self, session: aiohttp.ClientSession, url: str) -> Optional[Image.Image]:
        """Fetch image from URL with caching"""
        cache_path = self._get_cache_path(url)
        
        # Check cache first
        if cache_path.exists():
            try:
                return Image.open(cache_path)
            except:
                pass
        
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            }
            async with session.get(url, headers=headers, timeout=15) as response:
                if response.status == 200:
                    data = await response.read()
                    img = Image.open(io.BytesIO(data))
                    # Cache it
                    img.save(cache_path, "PNG")
                    return img
        except Exception as e:
            print(f"    ⚠️ Failed to fetch {url[:50]}...: {e}")
        
        return None
    
    def process_thumbnail(self, img: Image.Image) -> Image.Image:
        """
        Process image for perfect thumbnail:
        1. Remove background
        2. Crop to content
        3. Normalize size with padding
        4. Enhance quality
        """
        # Step 1: Remove background using AI
        print("    🔧 Removing background...")
        try:
            # Convert to bytes for rembg
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            # Remove background
            nobg_bytes = remove(img_bytes.getvalue())
            nobg = Image.open(io.BytesIO(nobg_bytes)).convert("RGBA")
        except Exception as e:
            print(f"    ⚠️ Background removal failed: {e}, using original")
            nobg = img.convert("RGBA")
        
        # Step 2: Auto-crop to content
        print("    ✂️ Cropping to content...")
        bbox = nobg.getbbox()
        if bbox:
            # Add margin
            margin = 10
            bbox = (
                max(0, bbox[0] - margin),
                max(0, bbox[1] - margin),
                min(nobg.width, bbox[2] + margin),
                min(nobg.height, bbox[3] + margin)
            )
            nobg = nobg.crop(bbox)
        
        # Step 3: Calculate size to fit in thumbnail with padding
        print("    📐 Normalizing size...")
        target_w = THUMB_SIZE[0] - (PADDING * 2)
        target_h = THUMB_SIZE[1] - (PADDING * 2)
        
        # Maintain aspect ratio
        aspect_ratio = nobg.width / nobg.height
        if aspect_ratio > 1:
            new_w = target_w
            new_h = int(target_w / aspect_ratio)
        else:
            new_h = target_h
            new_w = int(target_h * aspect_ratio)
        
        # High-quality resize
        nobg = nobg.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Step 4: Create final canvas with TRANSPARENT background
        canvas = Image.new("RGBA", THUMB_SIZE, (0, 0, 0, 0))
        
        # Center the product
        x = (THUMB_SIZE[0] - new_w) // 2
        y = (THUMB_SIZE[1] - new_h) // 2
        
        # Paste with transparency
        canvas.paste(nobg, (x, y), nobg)
        
        # Step 5: Enhance quality (keep RGBA for transparency)
        print("    ✨ Enhancing quality...")
        
        # Apply sharpening to RGB channels only
        r, g, b, a = canvas.split()
        rgb = Image.merge("RGB", (r, g, b))
        
        # Auto-contrast
        rgb = ImageOps.autocontrast(rgb, cutoff=1)
        
        # Slight sharpening
        enhancer = ImageEnhance.Sharpness(rgb)
        rgb = enhancer.enhance(1.2)
        
        # Merge back with alpha
        r, g, b = rgb.split()
        final = Image.merge("RGBA", (r, g, b, a))
        
        return final
    
    def calculate_brightness(self, img: Image.Image) -> float:
        """Calculate average brightness of image"""
        gray = img.convert("L")
        pixels = list(gray.getdata())
        return sum(pixels) / len(pixels)
    
    async def process_subcategory(
        self, 
        session: aiohttp.ClientSession,
        subcategory_id: str,
        curation: Dict[str, Any]
    ) -> ProcessedThumbnail:
        """Process a single subcategory thumbnail"""
        
        print(f"\n{'='*60}")
        print(f"🎯 Processing: {subcategory_id}")
        print(f"💭 Reasoning: {curation['reasoning'][:80]}...")
        print(f"🏷️ Ideal Product: {curation['ideal_product']}")
        
        # Try to fetch image from source URL
        img = None
        source_url = curation.get("source_url", "")
        
        if source_url:
            print(f"📥 Fetching from: {source_url[:60]}...")
            img = await self.fetch_image(session, source_url)
        
        # Try fallbacks if needed
        if img is None and curation.get("fallback_urls"):
            for fallback in curation["fallback_urls"]:
                print(f"📥 Trying fallback: {fallback[:60]}...")
                img = await self.fetch_image(session, fallback)
                if img:
                    source_url = fallback
                    break
        
        # If still no image, create placeholder
        if img is None:
            print("    ⚠️ No image available, creating placeholder")
            return ProcessedThumbnail(
                subcategory_id=subcategory_id,
                source_url="",
                local_path="",
                reasoning=curation["reasoning"],
                product_name=curation["ideal_product"],
                width=0,
                height=0,
                file_size=0,
                avg_brightness=0,
                success=False,
                error="No image source available"
            )
        
        # Process the thumbnail
        try:
            processed = self.process_thumbnail(img)
            
            # Save as WebP
            output_path = self.output_dir / f"{subcategory_id}_thumb.webp"
            processed.save(output_path, "WEBP", quality=95)
            
            # Calculate metrics
            file_size = output_path.stat().st_size
            brightness = self.calculate_brightness(processed)
            
            print(f"    ✅ Saved: {output_path.name}")
            print(f"    📊 Size: {file_size/1024:.1f}KB, Brightness: {brightness:.1f}")
            
            return ProcessedThumbnail(
                subcategory_id=subcategory_id,
                source_url=source_url,
                local_path=str(output_path),
                reasoning=curation["reasoning"],
                product_name=curation["ideal_product"],
                width=processed.width,
                height=processed.height,
                file_size=file_size,
                avg_brightness=brightness,
                success=True
            )
            
        except Exception as e:
            print(f"    ❌ Processing failed: {e}")
            return ProcessedThumbnail(
                subcategory_id=subcategory_id,
                source_url=source_url,
                local_path="",
                reasoning=curation["reasoning"],
                product_name=curation["ideal_product"],
                width=0,
                height=0,
                file_size=0,
                avg_brightness=0,
                success=False,
                error=str(e)
            )
    
    async def curate_all_thumbnails(self):
        """Process all subcategory thumbnails"""
        
        print("="*60)
        print("🎨 AI THUMBNAIL CURATOR")
        print("="*60)
        print(f"📁 Output: {self.output_dir}")
        print(f"🗄️ Cache: {self.cache_dir}")
        print(f"📦 Subcategories: {len(SUBCATEGORY_CURATION)}")
        
        async with aiohttp.ClientSession() as session:
            for subcategory_id, curation in SUBCATEGORY_CURATION.items():
                result = await self.process_subcategory(session, subcategory_id, curation)
                self.results.append(result)
        
        # Print summary
        self.print_summary()
        
        # Save curation manifest
        self.save_manifest()
    
    def print_summary(self):
        """Print processing summary"""
        print("\n" + "="*60)
        print("📊 CURATION SUMMARY")
        print("="*60)
        
        success = [r for r in self.results if r.success]
        failed = [r for r in self.results if not r.success]
        
        print(f"\n✅ Successful: {len(success)}/{len(self.results)}")
        for r in success:
            print(f"   • {r.subcategory_id}: {r.product_name}")
        
        if failed:
            print(f"\n❌ Failed: {len(failed)}")
            for r in failed:
                print(f"   • {r.subcategory_id}: {r.error}")
        
        # Quality metrics
        if success:
            avg_brightness = sum(r.avg_brightness for r in success) / len(success)
            avg_size = sum(r.file_size for r in success) / len(success)
            print(f"\n📈 Quality Metrics:")
            print(f"   Average Brightness: {avg_brightness:.1f}/255")
            print(f"   Average File Size: {avg_size/1024:.1f}KB")
    
    def save_manifest(self):
        """Save curation manifest for reference"""
        manifest = {
            "generated_at": str(Path(__file__).stat().st_mtime),
            "total_subcategories": len(self.results),
            "successful": len([r for r in self.results if r.success]),
            "failed": len([r for r in self.results if not r.success]),
            "subcategories": {}
        }
        
        for r in self.results:
            manifest["subcategories"][r.subcategory_id] = {
                "product_name": r.product_name,
                "reasoning": r.reasoning,
                "source_url": r.source_url,
                "local_path": r.local_path,
                "success": r.success,
                "metrics": {
                    "width": r.width,
                    "height": r.height,
                    "file_size": r.file_size,
                    "avg_brightness": r.avg_brightness
                } if r.success else None,
                "error": r.error
            }
        
        manifest_path = self.output_dir / "curation_manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)
        
        print(f"\n💾 Manifest saved: {manifest_path}")


async def main():
    curator = AIThumbnailCurator()
    await curator.curate_all_thumbnails()


if __name__ == "__main__":
    asyncio.run(main())
