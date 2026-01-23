"""
Sample Data Generator for UI Testing
=====================================

Generates realistic product data across ALL 8 consolidated categories
for multiple brands. This populates the UI with a test sample.

Run: python3 generate_sample_data.py
"""

import json
import os
from pathlib import Path
from datetime import datetime
import random

# Output directory for brand catalogs
DATA_DIR = Path("./data/catalogs_brand")
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Image base path
IMG_BASE = "/data/product_images"


def generate_product(brand_id: str, name: str, category: str, subcategory: str, 
                     price: int, tier: str = "Standard", description: str = None):
    """Generate a properly formatted product matching frontend schema."""
    slug = name.lower().replace(" ", "-").replace(".", "").replace("/", "-").replace("(", "").replace(")", "")
    product_id = f"{brand_id}-{slug}"
    
    return {
        "id": product_id,
        "name": name,
        "brand": brand_id,  # STRING, not object - matches schema
        "category": category,
        "subcategory": subcategory,
        "main_category": category,  # For filtering
        "description": description or f"The {name} delivers professional-grade {subcategory.lower()} performance for {category.lower()} applications.",
        "short_description": f"{name} - {tier} tier {subcategory}",
        "image_url": f"{IMG_BASE}/{brand_id}/{product_id}_thumb.webp",
        "images": {
            "thumbnail": f"{IMG_BASE}/{brand_id}/{product_id}_thumb.webp",
            "main": f"{IMG_BASE}/{brand_id}/{product_id}_main.webp",
        },
        "pricing": {
            "regular_price": price,
            "currency": "ILS",
            "source": "halilit"
        },
        "specifications": [
            {"key": "Tier", "value": tier},
            {"key": "Category", "value": category},
            {"key": "Type", "value": subcategory},
            {"key": "Warranty", "value": "2 Years"},
        ],
        "availability": random.choice(["in-stock", "in-stock", "in-stock", "low-stock"]),
        "sku": f"HL-{brand_id[:3].upper()}-{random.randint(1000, 9999)}",
        "verified": True,
        "tags": [tier.lower(), category.lower(), subcategory.lower().replace(" ", "-")],
    }


# ============================================================================
# COMPREHENSIVE BRAND DATA - ALL 8 CONSOLIDATED CATEGORIES
# ============================================================================

BRANDS_DATA = [
    # =========================================================================
    # ROLAND - Keys, Drums, Guitars, DJ/Production, Accessories
    # =========================================================================
    {
        "id": "roland",
        "name": "Roland",
        "website": "https://www.roland.com",
        "logo_url": "/assets/logos/roland_logo.svg",
        "products": [
            # Keys & Pianos
            ("FANTOM-08", "Pianos", "Workstation", 12500, "Flagship", "Ultimate performance workstation with ZEN-Core synthesis"),
            ("FANTOM-06", "Pianos", "Workstation", 7500, "Entry", "Compact 61-key version of the FANTOM series"),
            ("RD-2000", "Pianos", "Stage Piano", 11000, "Flagship", "Professional stage piano with SuperNATURAL engine"),
            ("RD-88", "Pianos", "Stage Piano", 5500, "Standard", "Compact stage piano with premium sound"),
            ("FP-90X", "Pianos", "Digital Piano", 7000, "Flagship", "Premium portable digital piano"),
            ("FP-60X", "Pianos", "Digital Piano", 4500, "Standard", "Professional portable digital piano"),
            ("GO:PIANO", "Pianos", "Portable Piano", 1400, "Entry", "Affordable 88-key digital piano"),
            ("Jupiter-X", "Synthesizers", "Performance Synth", 11500, "Flagship", "Flagship analog modeling synthesizer"),
            ("Jupiter-Xm", "Synthesizers", "Performance Synth", 6500, "Standard", "Compact I-Arpeggio synthesizer"),
            ("JUNO-DS88", "Keyboards", "Arranger", 4200, "Standard", "88-key synthesizer with DS sound engine"),
            ("A-88MKII", "Keyboards", "MIDI Controller", 3500, "Standard", "Professional MIDI controller keyboard"),
            
            # Drums & Percussion
            ("TD-50KV2", "Drums & Percussion", "V-Drums", 32000, "Flagship", "Professional electronic drum kit"),
            ("TD-27KV2", "Drums & Percussion", "V-Drums", 15500, "Standard", "Premium electronic drum kit"),
            ("TD-17KVX2", "Drums & Percussion", "V-Drums", 8500, "Entry", "Mid-range electronic drum kit"),
            ("VAD507", "Drums & Percussion", "V-Drums Acoustic Design", 22000, "Flagship", "Acoustic design electronic drums"),
            ("SPD-SX PRO", "Drums & Percussion", "Sampling Pad", 5500, "Flagship", "Professional sampling percussion pad"),
            ("HandSonic HPD-20", "Drums & Percussion", "Hand Percussion", 6500, "Standard", "Digital hand percussion"),
            
            # Guitar & Bass (Guitars & Amps category)
            ("Katana-Artist MkII", "Amplifiers", "Guitar Amp", 4500, "Flagship", "Professional guitar amplifier"),
            ("JC-120", "Amplifiers", "Guitar Amp", 5500, "Flagship", "Legendary jazz chorus amp"),
            ("CUBE Street EX", "Amplifiers", "Portable Amp", 2200, "Standard", "Battery powered street amp"),
            
            # DJ & Production (AIRA)
            ("TR-8S", "AIRA", "Drum Machine", 3200, "Flagship", "Rhythm performer with analog modeling"),
            ("TB-03", "AIRA", "Bass Synth", 1800, "Standard", "Bass line synthesizer recreation"),
            ("MC-707", "AIRA", "Groovebox", 4500, "Flagship", "8-track groovebox for live production"),
            ("MV-1", "AIRA", "Production Controller", 2800, "Standard", "Verselab music production workstation"),
            
            # Accessories
            ("DP-10", "Accessories", "Pedal", 350, "Standard", "Damper pedal"),
            ("RH-5", "Accessories", "Headphones", 350, "Entry", "Monitor headphones"),
            ("PSB-1U", "Accessories", "Power Supply", 150, "Standard", "Universal power supply"),
            ("CB-88RL", "Accessories", "Case", 800, "Standard", "88-key keyboard bag"),
        ]
    },
    
    # =========================================================================
    # BOSS - Guitar effects (Guitars & Amps category)
    # =========================================================================
    {
        "id": "boss",
        "name": "BOSS",
        "website": "https://www.boss.info",
        "logo_url": "/assets/logos/boss_logo.svg",
        "products": [
            # Effects Pedals → Guitars & Amps
            ("DS-1", "Effects Pedals", "Distortion", 350, "Entry", "Classic distortion pedal"),
            ("OD-3", "Effects Pedals", "Overdrive", 450, "Standard", "Warm overdrive pedal"),
            ("DD-8", "Effects Pedals", "Delay", 900, "Standard", "Digital delay with multiple modes"),
            ("RV-6", "Effects Pedals", "Reverb", 700, "Standard", "Versatile reverb pedal"),
            ("RC-5", "Loop Station", "Looper", 1100, "Standard", "Compact loop station"),
            ("RC-505mkII", "Loop Station", "Looper", 3200, "Flagship", "Tabletop loop station"),
            
            # Multi-Effects → Guitars & Amps
            ("GT-1000", "Multi-Effects", "Multi-FX", 5500, "Flagship", "Flagship guitar processor"),
            ("GT-1000CORE", "Multi-Effects", "Multi-FX", 3200, "Standard", "Compact flagship processor"),
            ("GX-100", "Multi-Effects", "Multi-FX", 2800, "Standard", "Guitar effects processor with touchscreen"),
            ("ME-90", "Multi-Effects", "Multi-FX", 2200, "Entry", "Easy-to-use multi-effects"),
            
            # Amplifiers → Guitars & Amps
            ("Katana-50 Gen3", "Amplifiers", "Combo Amp", 1400, "Entry", "50W combo amplifier"),
            ("Katana-100 Gen3", "Amplifiers", "Combo Amp", 1900, "Standard", "100W combo amplifier"),
            ("Katana-Artist MkII", "Amplifiers", "Combo Amp", 4200, "Flagship", "Premium Waza amp"),
            
            # Vocal Effects → Studio & Recording
            ("VE-20", "Vocal Effects", "Vocal Processor", 1400, "Standard", "Vocal performer processor"),
            ("VE-500", "Vocal Effects", "Vocal Processor", 2200, "Flagship", "Professional vocal effects"),
            
            # Accessories
            ("PSA-230S", "Accessories", "Power Supply", 150, "Standard", "AC adapter"),
            ("FS-5U", "Accessories", "Footswitch", 200, "Standard", "Foot switch"),
        ]
    },
    
    # =========================================================================
    # NORD - Keys & Pianos
    # =========================================================================
    {
        "id": "nord",
        "name": "Nord",
        "website": "https://www.nordkeyboards.com",
        "logo_url": "/assets/logos/nord_logo.svg",
        "products": [
            # Stage Keyboards → Keys & Pianos
            ("Nord Stage 4 88", "Stage", "Stage Piano", 22000, "Flagship", "Ultimate stage keyboard"),
            ("Nord Stage 4 Compact", "Stage", "Stage Piano", 17500, "Standard", "Compact stage keyboard"),
            ("Nord Piano 5 88", "Piano", "Stage Piano", 14500, "Flagship", "Premium stage piano"),
            ("Nord Piano 5 73", "Piano", "Stage Piano", 12500, "Standard", "73-key stage piano"),
            ("Nord Electro 7D 73", "Electro", "Stage Piano", 11500, "Standard", "Electro-mechanical keyboard"),
            ("Nord Electro 7D 61", "Electro", "Stage Piano", 10500, "Entry", "Compact electro keyboard"),
            ("Nord Grand", "Piano", "Stage Piano", 18000, "Flagship", "Grand piano experience"),
            
            # Synthesizers → Keys & Pianos
            ("Nord Lead A1", "Lead", "Synthesizer", 7500, "Standard", "Virtual analog synthesizer"),
            ("Nord Wave 2", "Wave", "Synthesizer", 12500, "Flagship", "Wavetable synthesizer"),
            
            # Drums → Drums & Percussion
            ("Nord Drum 3P", "Drum", "Percussion", 4200, "Standard", "Virtual analog drum machine"),
            
            # Accessories
            ("Nord Triple Pedal", "Accessories", "Pedal", 800, "Standard", "Triple pedal unit"),
            ("Nord Soft Case Stage 88", "Accessories", "Case", 1200, "Standard", "Stage 88 soft case"),
            ("Nord Keyboard Stand EX", "Accessories", "Stand", 900, "Standard", "Professional keyboard stand"),
        ]
    },
    
    # =========================================================================
    # MOOG - Keys & Pianos (Synthesizers)
    # =========================================================================
    {
        "id": "moog",
        "name": "Moog",
        "website": "https://www.moogmusic.com",
        "logo_url": "/assets/logos/moog_logo.svg",
        "products": [
            # Synthesizers → Keys & Pianos
            ("Minimoog Model D", "Synthesizers", "Monophonic", 25000, "Flagship", "Legendary monophonic synthesizer"),
            ("Moog One 16-Voice", "Synthesizers", "Polyphonic", 55000, "Flagship", "16-voice polyphonic synthesizer"),
            ("Moog One 8-Voice", "Synthesizers", "Polyphonic", 42000, "Flagship", "8-voice polyphonic synthesizer"),
            ("Matriarch", "Synthesizers", "Semi-Modular", 11000, "Flagship", "4-note paraphonic semi-modular"),
            ("Grandmother", "Synthesizers", "Semi-Modular", 5500, "Standard", "Semi-modular analog synthesizer"),
            ("Subsequent 37", "Synthesizers", "Monophonic", 8500, "Standard", "Analog synthesizer"),
            ("Subsequent 25", "Synthesizers", "Monophonic", 5500, "Entry", "Compact analog synthesizer"),
            ("Mother-32", "Synthesizers", "Semi-Modular", 3500, "Standard", "Tabletop semi-modular synth"),
            ("DFAM", "Synthesizers", "Percussion", 3500, "Standard", "Drummer From Another Mother"),
            ("Subharmonicon", "Synthesizers", "Semi-Modular", 3500, "Standard", "Polyrhythmic synthesizer"),
            ("Mavis", "Synthesizers", "Build Kit", 1800, "Entry", "Analog synthesizer build kit"),
            
            # Effects → Guitars & Amps
            ("Moogerfooger MF-104M", "Effects", "Analog Delay", 3500, "Flagship", "Analog delay pedal"),
            
            # Accessories
            ("Minitaur Case", "Accessories", "Case", 600, "Standard", "Protective case"),
        ]
    },
    
    # =========================================================================
    # ADAM AUDIO - Studio & Recording (Monitors)
    # =========================================================================
    {
        "id": "adam-audio",
        "name": "Adam Audio",
        "website": "https://www.adam-audio.com",
        "logo_url": "/assets/logos/adam-audio_logo.svg",
        "products": [
            # Studio Monitors → Studio & Recording
            ("T5V", "Monitors", "Near-field Monitor", 1100, "Entry", "5-inch studio monitor"),
            ("T7V", "Monitors", "Near-field Monitor", 1400, "Entry", "7-inch studio monitor"),
            ("T8V", "Monitors", "Near-field Monitor", 1700, "Standard", "8-inch studio monitor"),
            ("A4V", "Monitors", "Near-field Monitor", 3200, "Standard", "4-inch premium monitor"),
            ("A7V", "Monitors", "Near-field Monitor", 4800, "Standard", "7-inch A Series monitor"),
            ("A77H", "Monitors", "Horizontal Monitor", 7500, "Flagship", "Horizontal A Series monitor"),
            ("S2V", "Monitors", "Premium Monitor", 9500, "Flagship", "S Series 2-way monitor"),
            ("S3H", "Monitors", "Main Monitor", 15000, "Flagship", "S Series 3-way horizontal"),
            ("S3V", "Monitors", "Main Monitor", 15000, "Flagship", "S Series 3-way vertical"),
            
            # Subwoofers → Studio & Recording
            ("T10S", "Subwoofers", "Subwoofer", 2500, "Standard", "T Series subwoofer"),
            ("Sub8", "Subwoofers", "Subwoofer", 3200, "Standard", "A Series subwoofer"),
            ("Sub12", "Subwoofers", "Subwoofer", 5500, "Flagship", "12-inch studio subwoofer"),
            ("Sub15", "Subwoofers", "Subwoofer", 7500, "Flagship", "15-inch studio subwoofer"),
        ]
    },
    
    # =========================================================================
    # MACKIE - Live Sound + Studio
    # =========================================================================
    {
        "id": "mackie",
        "name": "Mackie",
        "website": "https://www.mackie.com",
        "logo_url": "/assets/logos/mackie_logo.svg",
        "products": [
            # Studio Monitors → Studio & Recording
            ("CR3-X", "Monitors", "Multimedia Monitor", 550, "Entry", "3-inch creative reference"),
            ("CR4-X", "Monitors", "Multimedia Monitor", 750, "Entry", "4-inch creative reference"),
            ("CR5-X", "Monitors", "Multimedia Monitor", 950, "Standard", "5-inch creative reference"),
            ("MR524", "Monitors", "Studio Monitor", 1400, "Standard", "5-inch studio monitor"),
            ("MR624", "Monitors", "Studio Monitor", 1800, "Standard", "6-inch studio monitor"),
            ("HR824mk2", "Monitors", "Reference Monitor", 4200, "Flagship", "8-inch reference monitor"),
            
            # Mixers → Live Sound
            ("ProFX6v3", "Mixers", "Analog Mixer", 900, "Entry", "6-channel mixer"),
            ("ProFX10v3", "Mixers", "Analog Mixer", 1400, "Standard", "10-channel mixer"),
            ("ProFX16v3", "Mixers", "Analog Mixer", 2200, "Standard", "16-channel mixer"),
            ("DL16S", "Mixers", "Digital Mixer", 4500, "Standard", "16-channel digital mixer"),
            ("DL32S", "Mixers", "Digital Mixer", 7500, "Flagship", "32-channel digital mixer"),
            
            # PA Speakers → Live Sound
            ("Thump212", "PA Speakers", "Powered Speaker", 2200, "Entry", "12-inch powered speaker"),
            ("Thump215", "PA Speakers", "Powered Speaker", 2800, "Standard", "15-inch powered speaker"),
            ("Thump215XT", "PA Speakers", "Powered Speaker", 3200, "Standard", "15-inch enhanced speaker"),
            ("SRM210 V-Class", "PA Speakers", "Powered Speaker", 3500, "Flagship", "10-inch V-Class speaker"),
            ("SRM215 V-Class", "PA Speakers", "Powered Speaker", 4200, "Flagship", "15-inch V-Class speaker"),
            ("Thump118S", "PA Speakers", "Subwoofer", 2800, "Standard", "18-inch powered subwoofer"),
        ]
    },
    
    # =========================================================================
    # AKAI PROFESSIONAL - DJ & Production
    # =========================================================================
    {
        "id": "akai-professional",
        "name": "Akai Professional",
        "website": "https://www.akaipro.com",
        "logo_url": "/assets/logos/akai-professional_logo.svg",
        "products": [
            # MPC Series → DJ & Production
            ("MPC X SE", "MPC", "Production Center", 12500, "Flagship", "Flagship standalone MPC"),
            ("MPC Live II", "MPC", "Production Center", 7500, "Standard", "Portable standalone MPC"),
            ("MPC One+", "MPC", "Production Center", 4500, "Standard", "Compact standalone MPC"),
            ("MPC Key 61", "MPC", "Production Keyboard", 8500, "Flagship", "61-key production center"),
            
            # Controllers → DJ & Production
            ("APC64", "Controllers", "Ableton Controller", 3200, "Flagship", "64-pad Ableton controller"),
            ("APC40 Mk2", "Controllers", "Ableton Controller", 2200, "Standard", "Professional Ableton controller"),
            ("APC Mini Mk2", "Controllers", "Ableton Controller", 550, "Entry", "Compact Ableton controller"),
            ("Fire", "Controllers", "FL Studio Controller", 1100, "Entry", "FL Studio controller"),
            
            # MIDI Keyboards → Keys & Pianos
            ("MPK Mini Mk3", "Keyboards", "MIDI Controller", 550, "Entry", "25-key compact controller"),
            ("MPK249", "Keyboards", "MIDI Controller", 2200, "Standard", "49-key performance controller"),
            ("MPK261", "Keyboards", "MIDI Controller", 2800, "Standard", "61-key performance controller"),
            ("Advance 61", "Keyboards", "MIDI Controller", 3500, "Flagship", "Virtual instrument controller"),
        ]
    },
    
    # =========================================================================
    # UNIVERSAL AUDIO - Studio & Recording
    # =========================================================================
    {
        "id": "universal-audio",
        "name": "Universal Audio",
        "website": "https://www.uaudio.com",
        "logo_url": "/assets/logos/universal-audio_logo.svg",
        "products": [
            # Audio Interfaces → Studio & Recording
            ("Volt 1", "Interfaces", "Audio Interface", 700, "Entry", "1-in/2-out USB interface"),
            ("Volt 2", "Interfaces", "Audio Interface", 950, "Entry", "2-in/2-out USB interface"),
            ("Volt 276", "Interfaces", "Audio Interface", 1400, "Standard", "2-in/2-out with 76 compressor"),
            ("Volt 476", "Interfaces", "Audio Interface", 1800, "Standard", "4-in/4-out with 76 compressor"),
            ("Apollo Solo", "Apollo", "Audio Interface", 2800, "Standard", "Desktop Thunderbolt interface"),
            ("Apollo Twin X Duo", "Apollo", "Audio Interface", 5500, "Standard", "2x6 Thunderbolt 3 interface"),
            ("Apollo Twin X Quad", "Apollo", "Audio Interface", 7500, "Flagship", "2x6 with Quad processing"),
            ("Apollo x4", "Apollo", "Audio Interface", 11500, "Flagship", "12x18 Thunderbolt interface"),
            ("Apollo x6", "Apollo", "Audio Interface", 13500, "Flagship", "16x22 Thunderbolt interface"),
            ("Apollo x8p", "Apollo", "Audio Interface", 17500, "Flagship", "18x24 Thunderbolt interface"),
            
            # Microphones → Studio & Recording
            ("SD-1", "Microphones", "Dynamic Microphone", 1800, "Standard", "Standard dynamic microphone"),
            ("Sphere DLX", "Microphones", "Modeling Microphone", 8500, "Flagship", "Dual-capsule modeling microphone"),
            
            # UAFX Pedals → Guitars & Amps
            ("UAFX Dream 65", "UAFX", "Amp Pedal", 2200, "Standard", "Fender Deluxe emulation"),
            ("UAFX Ruby 63", "UAFX", "Amp Pedal", 2200, "Standard", "AC30 emulation"),
            ("UAFX Lion 68", "UAFX", "Amp Pedal", 2200, "Standard", "Plexi emulation"),
        ]
    },
    
    # =========================================================================
    # WARM AUDIO - Studio & Recording (Microphones, Preamps)
    # =========================================================================
    {
        "id": "warm-audio",
        "name": "Warm Audio",
        "website": "https://www.warmaudio.com",
        "logo_url": "/assets/logos/warm-audio_logo.svg",
        "products": [
            # Microphones → Studio & Recording
            ("WA-87 R2", "Microphones", "Condenser", 3500, "Standard", "FET condenser microphone"),
            ("WA-47", "Microphones", "Tube Condenser", 5500, "Flagship", "Tube condenser microphone"),
            ("WA-47Jr", "Microphones", "FET Condenser", 2800, "Standard", "FET version of WA-47"),
            ("WA-14", "Microphones", "Condenser", 2800, "Standard", "Large diaphragm condenser"),
            ("WA-251", "Microphones", "Tube Condenser", 4500, "Flagship", "Vintage tube emulation"),
            ("WA-84", "Microphones", "Small Diaphragm", 2200, "Standard", "Small diaphragm condenser"),
            ("WA-19", "Microphones", "Dynamic", 1100, "Entry", "Dynamic studio microphone"),
            
            # Preamps → Studio & Recording
            ("WA-73-EQ", "Preamps", "Preamp", 4500, "Standard", "1073 style preamp/EQ"),
            ("WA-412", "Preamps", "Preamp", 5500, "Flagship", "4-channel preamp"),
            ("WA-MPX", "Preamps", "Preamp", 2200, "Entry", "Tube mic preamp"),
            
            # Compressors/Outboard → Studio & Recording
            ("WA-2A", "Outboard", "Compressor", 5500, "Flagship", "Optical compressor"),
            ("WA-76", "Outboard", "Compressor", 4200, "Standard", "FET limiting amplifier"),
            ("Bus-Comp", "Outboard", "Compressor", 5200, "Flagship", "Stereo bus compressor"),
            
            # Guitar Pedals → Guitars & Amps
            ("Centavo", "Pedals", "Overdrive", 950, "Entry", "Professional overdrive"),
            ("Jet Phaser", "Pedals", "Phaser", 1100, "Standard", "Classic phaser recreation"),
        ]
    },
    
    # =========================================================================
    # TEENAGE ENGINEERING - DJ & Production + Accessories
    # =========================================================================
    {
        "id": "teenage-engineering",
        "name": "Teenage Engineering",
        "website": "https://teenage.engineering",
        "logo_url": "/assets/logos/teenage-engineering_logo.svg",
        "products": [
            # Synthesizers → Keys & Pianos
            ("OP-1 Field", "Synthesizers", "Portable Synth", 11500, "Flagship", "Portable synthesizer and sampler"),
            ("OP-Z", "Synthesizers", "Portable Synth", 3200, "Standard", "16-track sequencer synthesizer"),
            
            # Pocket Operators → DJ & Production
            ("PO-33 K.O!", "Pocket Operators", "Sampler", 550, "Entry", "Micro sampler"),
            ("PO-32 Tonic", "Pocket Operators", "Drum Synth", 550, "Entry", "Micro drum synth"),
            ("PO-35 Speak", "Pocket Operators", "Vocal Synth", 550, "Entry", "Micro vocal synth"),
            ("PO-128 Mega Man", "Pocket Operators", "Chiptune", 550, "Entry", "Chiptune synth"),
            
            # Samplers → DJ & Production
            ("EP-133 K.O. II", "Audio", "Sampler", 1800, "Standard", "Premium sampler workstation"),
            
            # Studio Gear → Studio & Recording
            ("TX-6", "Audio", "Mixer", 7500, "Flagship", "Ultra-portable pro mixer"),
            ("TP-7", "Audio", "Recorder", 8500, "Flagship", "Field recorder"),
            ("CM-15", "Audio", "Microphone", 7500, "Flagship", "Broadcast microphone"),
            
            # Speakers → Live Sound
            ("OB-4", "Audio", "Speaker", 3500, "Standard", "Magic radio speaker"),
            ("OD-11", "Audio", "Speaker", 4500, "Flagship", "Cloud speaker"),
            
            # Accessories
            ("Field Bag", "Accessories", "Case", 550, "Standard", "OP-1 Field bag"),
            ("Modular Cables", "Accessories", "Cables", 150, "Entry", "Modular patch cables"),
        ]
    },
]


def generate_brand_catalog(brand_data: dict) -> dict:
    """Generate a complete brand catalog with all products."""
    brand_id = brand_data["id"]
    products = []
    
    for p_data in brand_data["products"]:
        if len(p_data) >= 5:
            name, category, subcategory, price, tier = p_data[:5]
            description = p_data[5] if len(p_data) > 5 else None
            product = generate_product(brand_id, name, category, subcategory, price, tier, description)
            products.append(product)
    
    return {
        "brand_name": brand_data["name"],
        "brand_identity": {
            "id": brand_id,
            "name": brand_data["name"],
            "logo_url": brand_data.get("logo_url", f"/assets/logos/{brand_id}_logo.svg"),
            "website": brand_data.get("website"),
            "description": f"Official {brand_data['name']} products distributed by Halilit",
            "categories": []  # Will be populated from products
        },
        "products": products,
        "generated_at": datetime.now().isoformat(),
        "product_count": len(products)
    }


def main():
    print("=" * 60)
    print("🎹 SAMPLE DATA GENERATOR - Full UI Population")
    print("=" * 60)
    print()
    
    total_products = 0
    
    for brand_data in BRANDS_DATA:
        catalog = generate_brand_catalog(brand_data)
        
        # Save to file
        path = DATA_DIR / f"{brand_data['id']}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        
        product_count = len(catalog["products"])
        total_products += product_count
        print(f"   ✓ {brand_data['name']:25} {product_count:3} products → {path.name}")
    
    print()
    print("=" * 60)
    print(f"✅ COMPLETE: {len(BRANDS_DATA)} brands, {total_products} products")
    print(f"   Output: {DATA_DIR.absolute()}")
    print()
    print("📋 Next step: Run 'python3 forge_backbone.py' to build frontend catalogs")
    print("=" * 60)


if __name__ == "__main__":
    main()
