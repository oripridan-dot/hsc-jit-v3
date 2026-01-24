"""
Map real products from catalog to category thumbnails.
Identifies most recognizable products for each category.
"""

import json
from pathlib import Path

# Best recognizable products for each category (famous models)
CATEGORY_PRODUCT_MAPPING = {
    # Keys & Pianos
    "keys-synths": {
        "products": ["nord_lead_a1", "moog_sub_phatty"],
        "description": "Synthesizers - Pick Nord Lead A1 or Moog Sub Phatty"
    },
    "keys-stage-pianos": {
        "products": ["nord_stage_3", "roland_rd2000"],
        "description": "Stage Pianos - Nord Stage 3 or Roland RD-2000"
    },
    "keys-controllers": {
        "products": ["akai_pro_mk3", "roland_a88mkii"],
        "description": "MIDI Controllers - Akai APC or Roland A-88"
    },
    "keys-arrangers": {
        "products": ["roland_gw8", "roland_e09"],
        "description": "Arrangers - Roland GW series"
    },
    "keys-organs": {
        "products": ["nord_c2d", "nord_lead"],
        "description": "Organs - Nord C2D"
    },
    "keys-workstations": {
        "products": ["roland_fantom", "roland_juno"],
        "description": "Workstations - Roland Fantom or Juno"
    },
    
    # Drums & Percussion
    "drums-electronic-drums": {
        "products": ["roland_td27", "roland_vad706"],
        "description": "Electronic Drum Kits - Roland V-Drums"
    },
    "drums-acoustic-drums": {
        "products": ["pearl_export", "roland_acoustic"],
        "description": "Acoustic Drums - Pearl Export or Yamaha"
    },
    "drums-cymbals": {
        "products": ["paiste_pst", "zildjian"],
        "description": "Cymbals - Paiste PST or Zildjian"
    },
    "drums-percussion": {
        "products": ["roland_percussion", "remo_tom"],
        "description": "Percussion - Roland or Remo"
    },
    "drums-drum-machines": {
        "products": ["akai_mpc", "roland_tr808"],
        "description": "Drum Machines - Akai MPC or Roland TR-808"
    },
    "drums-pads": {
        "products": ["akai_apc40", "akai_lpd8"],
        "description": "Pads - Akai APC40 or LPD8"
    },
    
    # Guitars & Amps
    "guitars-electric-guitars": {
        "products": ["fender_stratocaster", "gibson_lespaul"],
        "description": "Electric Guitars - Fender or Gibson classic"
    },
    "guitars-bass-guitars": {
        "products": ["fender_bass", "warwick_bass"],
        "description": "Bass Guitars - Fender Jazz Bass or Warwick"
    },
    "guitars-amplifiers": {
        "products": ["marshall_amp", "fender_amp"],
        "description": "Amplifiers - Marshall or Fender classic"
    },
    "guitars-effects-pedals": {
        "products": ["boss_ds1", "boss_ce5"],
        "description": "Effects Pedals - Boss DS-1 or CE-5"
    },
    "guitars-multi-effects": {
        "products": ["boss_me80", "line6_helix"],
        "description": "Multi-Effects - Boss ME-80 or Line 6 Helix"
    },
    "guitars-accessories": {
        "products": ["fender_cable", "ernie_ball_string"],
        "description": "Accessories - Cables, strings, stands"
    },
    
    # Studio & Recording
    "studio-audio-interfaces": {
        "products": ["focusrite_scarlett", "universal_audio_apollo"],
        "description": "Audio Interfaces - Focusrite Scarlett or UA Apollo"
    },
    "studio-studio-monitors": {
        "products": ["yamaha_hs8", "eve_audio_sc207"],
        "description": "Studio Monitors - Yamaha HS8 or Eve Audio"
    },
    "studio-microphones": {
        "products": ["neumann_u87", "rode_nt1"],
        "description": "Microphones - Neumann U87 or Rode NT1"
    },
    "studio-outboard-gear": {
        "products": ["universal_audio_1176", "neve_1073"],
        "description": "Outboard Gear - UA 1176 Compressor or Neve"
    },
    "studio-preamps": {
        "products": ["universal_audio_1073", "neve_1081"],
        "description": "Preamps - UA 1073 or Neve 1081"
    },
    "studio-software": {
        "products": ["ableton_live", "logic_pro"],
        "description": "DAW Software - Ableton Live or Logic Pro UI"
    },
    
    # Live Sound
    "live-pa-speakers": {
        "products": ["meyer_sound_cq1", "rcf_speaker"],
        "description": "PA Speakers - Meyer Sound or RCF"
    },
    "live-mixers": {
        "products": ["allen_heath_qu", "yamaha_mgx"],
        "description": "Live Mixers - Allen & Heath or Yamaha"
    },
    "live-stage-boxes": {
        "products": ["presonus_studiolive", "allen_heath_dlive"],
        "description": "Stage Boxes - PreSonus StudioLive or A&H dLive"
    },
    "live-wireless-systems": {
        "products": ["shure_ulxd", "sennheiser_ew"],
        "description": "Wireless Systems - Shure ULXD or Sennheiser"
    },
    "live-in-ear-monitoring": {
        "products": ["shure_psm", "in_ear_monitor"],
        "description": "IEM Systems - Shure PSM or similar"
    },
    
    # DJ & Production
    "dj-production": {
        "products": ["pioneer_ddj1000", "numark_mixtrack"],
        "description": "DJ Controllers - Pioneer DDJ or Numark"
    },
    "dj-dj-headphones": {
        "products": ["pioneer_hdj2000", "technics_dj100"],
        "description": "DJ Headphones - Pioneer HDJ or Technics"
    },
    "dj-samplers": {
        "products": ["akai_mpc_sampler", "elektron_analog"],
        "description": "Samplers - Akai MPC or Elektron"
    },
    "dj-grooveboxes": {
        "products": ["elektron_analog4", "teenage_eng_op1"],
        "description": "Grooveboxes - Elektron or Teenage Engineering"
    },
    "dj-accessories": {
        "products": ["pioneer_case", "dj_cable"],
        "description": "DJ Accessories - Cases, cables, accessories"
    },
    
    # Software & Cloud
    "software-daw": {
        "products": ["ableton_live_ui", "logic_pro_ui"],
        "description": "DAW - Ableton Live or Logic Pro screenshot"
    },
    "software-plugins": {
        "products": ["vst_plugin_ui", "fabfilter_pro"],
        "description": "Plugins - VST/AU plugin UI"
    },
    "software-sound-libraries": {
        "products": ["spectrasonics_omnisphere", "xfer_serum"],
        "description": "Sound Libraries - Omnisphere or Serum UI"
    },
    
    # Accessories
    "accessories-cables": {
        "products": ["mogami_cable", "evidence_audio_cable"],
        "description": "Cables - High-quality audio cables coiled"
    },
    "accessories-cases": {
        "products": ["pedalboard_case", "keyboard_case"],
        "description": "Cases - Hard cases or pedalboards"
    },
    "accessories-pedals": {
        "products": ["boss_pedalboard", "pedal_platform"],
        "description": "Pedal Platforms - Pedalboard or platform"
    },
    "accessories-power": {
        "products": ["power_supply_unit", "pdu"],
        "description": "Power Supplies - Professional power distribution"
    },
    "accessories-stands": {
        "products": ["k_m_stand", "speaker_stand"],
        "description": "Stands - Music stands or equipment stands"
    },
}


def analyze_catalog():
    """Analyze available products to match with categories"""
    data_dir = Path(__file__).parent.parent / "frontend" / "public" / "data"
    
    # Load major brand catalogs
    brands = ["roland", "boss", "nord", "moog", "akai-professional", "universal-audio"]
    
    all_products = {}
    
    for brand in brands:
        json_file = data_dir / f"{brand}.json"
        if json_file.exists():
            with open(json_file, 'r') as f:
                try:
                    catalog = json.load(f)
                    products = catalog.get("products", [])
                    print(f"\n{brand.upper()}: {len(products)} products")
                    
                    # Show first 3 products to understand structure
                    for prod in products[:3]:
                        name = prod.get("name", "Unknown")
                        category = prod.get("category", "uncategorized")
                        image = prod.get("image_url") or prod.get("image")
                        print(f"  - {name} ({category}) -> {image[:50]}..." if image else f"  - {name} (NO IMAGE)")
                    
                    all_products[brand] = products
                except Exception as e:
                    print(f"  Error reading {brand}: {e}")
    
    return all_products


def print_mapping_guide():
    """Print guide for manual mapping"""
    print("\n" + "="*70)
    print("CATEGORY THUMBNAIL MAPPING GUIDE")
    print("="*70)
    
    for category, info in CATEGORY_PRODUCT_MAPPING.items():
        print(f"\n✓ {category}")
        print(f"  Description: {info['description']}")
        print(f"  Suggested: {', '.join(info['products'])}")
        print(f"  Action: Find image URL from catalog and set in mapping")


if __name__ == "__main__":
    print("\n🔍 ANALYZING PRODUCT CATALOGS\n")
    products = analyze_catalog()
    
    print("\n" + "="*70)
    print("NEXT STEPS:")
    print("="*70)
    print("""
1. Review the product list above for each brand
2. Identify the MOST RECOGNIZABLE products for each category
3. Find their image_url in the JSON files
4. Create mapping file with: category -> product_image_url
5. Use visual_factory.py to process images into thumbnails
6. Save final thumbnails to: frontend/public/data/category_thumbnails/

EXAMPLE MAPPING:
{
  "keys-synths": "https://...(nord-lead-a1-image-url)...",
  "keys-stage-pianos": "https://...(nord-stage-3-image-url)...",
  ...
}
""")
    
    print_mapping_guide()
