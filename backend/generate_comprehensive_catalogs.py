"""
Comprehensive Product Scrape Simulator
Generates realistic product data for all brands to simulate actual scrapes
"""
import json
from pathlib import Path
from datetime import datetime, timezone


def create_comprehensive_catalog():
    """Create realistic product catalogs for all brands"""
    
    # ==================== ROLAND CATALOG ====================
    roland_products = [
        {
            "id": "roland-bridge-cast",
            "brand": "Roland",
            "name": "BRIDGE CAST",
            "model_number": "BRIDGE CAST",
            "main_category": "Production",
            "description": "All-in-one gaming audio mixer with dual sound mixing, vocal effects, and professional microphone input. Features BRIDGE CAST app integration with BGM CAST music library.",
            "short_description": "Dual-bus gaming mixer for professional livestream audio",
            "image_url": "https://static.roland.com/products/bridge_cast/images/bridge_cast_hero.jpg",
            "images": [
                {"url": "https://static.roland.com/products/bridge_cast/images/bridge_cast_hero.jpg", "type": "main"},
                {"url": "https://static.roland.com/products/bridge_cast/images/bridge_cast_overview.jpg", "type": "gallery"}
            ],
            "specifications": [
                {"key": "Inputs", "value": "XLR Microphone, Line In, USB"},
                {"key": "Outputs", "value": "Headphones, Line Out, USB"},
                {"key": "Effects", "value": "Voice Transformer, EQ, Compression, Noise Gate"},
                {"key": "Connectivity", "value": "USB-C, XLR, 3.5mm"}
            ],
            "tags": ["gaming", "audio", "mixer"],
            "price_ils": 2500
        },
        {
            "id": "roland-dp603",
            "brand": "Roland",
            "name": "DP603",
            "model_number": "DP603",
            "main_category": "Keys",
            "description": "Full-featured digital piano with authentic wooden key action and premium speaker system. Includes 38 high-quality piano tones and sophisticated sound processing.",
            "short_description": "Digital piano with wooden key action and premium sound",
            "image_url": "https://static.roland.com/products/dp603/images/dp603_hero.jpg",
            "images": [
                {"url": "https://static.roland.com/products/dp603/images/dp603_hero.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Keys", "value": "88 weighted wooden keys"},
                {"key": "Tones", "value": "38 high-quality piano tones"},
                {"key": "Pedals", "value": "3 pedals (sustain, soft, sostenuto)"},
                {"key": "Speakers", "value": "2x 40W + 1x 100W subwoofer"},
                {"key": "Connectivity", "value": "USB, MIDI, Audio In/Out"}
            ],
            "tags": ["piano", "digital", "weighted-keys"],
            "price_ils": 8500
        },
        {
            "id": "roland-f107",
            "brand": "Roland",
            "name": "F107 Digital Piano",
            "model_number": "F107",
            "main_category": "Keys",
            "description": "Compact portable digital piano with PureAcoustic modeling technology delivering authentic piano feel and sound. Perfect for students and professionals.",
            "short_description": "Portable digital piano with PureAcoustic sound",
            "image_url": "https://static.roland.com/products/f107/images/f107_hero.jpg",
            "images": [
                {"url": "https://static.roland.com/products/f107/images/f107_hero.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Keys", "value": "88 weighted keys"},
                {"key": "Tones", "value": "35 high-quality sounds"},
                {"key": "Recording", "value": "8 songs, 16-track MIDI"},
                {"key": "Speakers", "value": "2x 25W"},
                {"key": "Weight", "value": "42 kg"},
                {"key": "Connectivity", "value": "USB, MIDI"}
            ],
            "tags": ["piano", "portable", "student"],
            "price_ils": 4200
        },
        {
            "id": "roland-juno-106",
            "brand": "Roland",
            "name": "JUNO-106 Synthesizer",
            "model_number": "JUNO-106",
            "main_category": "Synthesizers",
            "description": "Classic 6-voice polyphonic synthesizer with lush chorus effect. One of the most iconic synthesizers in music history.",
            "short_description": "Classic 6-voice analog synthesizer",
            "image_url": "https://static.roland.com/products/juno-106/images/juno106_hero.jpg",
            "images": [
                {"url": "https://static.roland.com/products/juno-106/images/juno106_hero.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Voices", "value": "6-voice polyphony"},
                {"key": "Oscillators", "value": "1 VCO per voice"},
                {"key": "Filter", "value": "24dB/octave VCF"},
                {"key": "Effects", "value": "Chorus, Reverb"},
                {"key": "Connectivity", "value": "MIDI, CV/Gate"}
            ],
            "tags": ["synthesizer", "analog", "classic"],
            "price_ils": 5500
        },
        {
            "id": "roland-tr-808",
            "brand": "Roland",
            "name": "TR-808 Rhythm Composer",
            "model_number": "TR-808",
            "main_category": "Drums",
            "description": "The most influential drum machine in history. Legendary sounds used across hip-hop, electronic, and pop music.",
            "short_description": "Legendary drum machine",
            "image_url": "https://static.roland.com/products/tr-808/images/tr808_hero.jpg",
            "images": [
                {"url": "https://static.roland.com/products/tr-808/images/tr808_hero.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Sounds", "value": "8 drum sounds"},
                {"key": "Tempo", "value": "40-300 BPM"},
                {"key": "Storage", "value": "16 patterns"},
                {"key": "Connectivity", "value": "Sync, Audio Out"}
            ],
            "tags": ["drums", "drum-machine", "legendary"],
            "price_ils": 3200
        },
        {
            "id": "roland-tr-909",
            "brand": "Roland",
            "name": "TR-909 Rhythm Composer",
            "model_number": "TR-909",
            "main_category": "Drums",
            "description": "The drum machine that shaped house and techno music. Iconic 909 sounds heard in countless hit tracks.",
            "short_description": "House music drum machine icon",
            "image_url": "https://static.roland.com/products/tr-909/images/tr909_hero.jpg",
            "images": [
                {"url": "https://static.roland.com/products/tr-909/images/tr909_hero.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Sounds", "value": "16 drum sounds"},
                {"key": "Tempo", "value": "30-300 BPM"},
                {"key": "Sequencer", "value": "16-step"},
                {"key": "Connectivity", "value": "MIDI, Sync, Audio"}
            ],
            "tags": ["drums", "house-music", "iconic"],
            "price_ils": 3800
        },
        {
            "id": "roland-sph-440",
            "brand": "Roland",
            "name": "SPH-440 Sound Canvas Plus",
            "model_number": "SPH-440",
            "main_category": "Sound Module",
            "description": "Advanced MIDI sound module with over 1000 tones and 128 drum kits. Perfect for composition and production.",
            "short_description": "Advanced MIDI sound module",
            "image_url": "https://static.roland.com/products/sph440/images/sph440_hero.jpg",
            "images": [
                {"url": "https://static.roland.com/products/sph440/images/sph440_hero.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Tones", "value": "1000+"},
                {"key": "Drum Kits", "value": "128"},
                {"key": "Polyphony", "value": "64-voice"},
                {"key": "Connectivity", "value": "MIDI, USB, Audio"}
            ],
            "tags": ["sound-module", "midi", "production"],
            "price_ils": 2800
        },
        {
            "id": "roland-cr-78",
            "brand": "Roland",
            "name": "CR-78 Rhythm Composer",
            "model_number": "CR-78",
            "main_category": "Drums",
            "description": "Historic drum machine from 1978. First programmable rhythm composer, heard on countless classic tracks.",
            "short_description": "Historic programmable drum machine",
            "image_url": "https://static.roland.com/products/cr78/images/cr78_hero.jpg",
            "images": [
                {"url": "https://static.roland.com/products/cr78/images/cr78_hero.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Drum Sounds", "value": "13"},
                {"key": "Patterns", "value": "16"},
                {"key": "Tempo", "value": "40-200 BPM"},
                {"key": "Connectivity", "value": "Audio Out"}
            ],
            "tags": ["drums", "vintage", "classic"],
            "price_ils": 2200
        }
    ]
    
    # ==================== NORD CATALOG ====================
    nord_products = [
        {
            "id": "nord-lead-a1",
            "brand": "Nord",
            "name": "Nord Lead A1",
            "model_number": "Lead A1",
            "main_category": "Synthesizers",
            "description": "Four-part multi-timbral synthesizer with powerful sound synthesis and comprehensive control. Built-in sequencer for immediate music production.",
            "short_description": "Multi-timbral synthesizer with sequencer",
            "image_url": "https://www.nordkeyboards.com/images/nord-lead-a1.jpg",
            "images": [
                {"url": "https://www.nordkeyboards.com/images/nord-lead-a1.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Voices", "value": "4-part multi-timbral"},
                {"key": "Oscillators", "value": "3 per voice"},
                {"key": "Filter", "value": "3x 24dB/octave"},
                {"key": "Sequencer", "value": "Built-in 4-part"},
                {"key": "Connectivity", "value": "MIDI, Audio, USB"}
            ],
            "tags": ["synthesizer", "nordic", "production"],
            "price_ils": 9200
        },
        {
            "id": "nord-modular-g2",
            "brand": "Nord",
            "name": "Nord Modular G2",
            "model_number": "Modular G2",
            "main_category": "Synthesizers",
            "description": "Patching synthesizer with virtually unlimited sound design possibilities. Connect modules to create custom signal flows.",
            "short_description": "Patching synthesizer with modular architecture",
            "image_url": "https://www.nordkeyboards.com/images/nord-modular-g2.jpg",
            "images": [
                {"url": "https://www.nordkeyboards.com/images/nord-modular-g2.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Architecture", "value": "Modular patching"},
                {"key": "Modules", "value": "100+ available"},
                {"key": "Keys", "value": "88 velocity-sensitive"},
                {"key": "Sequencer", "value": "Integrated"},
                {"key": "Connectivity", "value": "MIDI, Audio, USB"}
            ],
            "tags": ["synthesizer", "modular", "experimental"],
            "price_ils": 12000
        },
        {
            "id": "nord-clavia-g2",
            "brand": "Nord",
            "name": "Nord Clavia G2",
            "model_number": "Clavia G2",
            "main_category": "Synthesizers",
            "description": "Desktop modular synthesis workstation with comprehensive sound design tools and integrated sequencer.",
            "short_description": "Desktop modular synthesis workstation",
            "image_url": "https://www.nordkeyboards.com/images/nord-g2.jpg",
            "images": [
                {"url": "https://www.nordkeyboards.com/images/nord-g2.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Architecture", "value": "Modular"},
                {"key": "Modules", "value": "80+ synth modules"},
                {"key": "Sequencer", "value": "Pattern-based"},
                {"key": "Connectivity", "value": "MIDI, Audio"}
            ],
            "tags": ["synthesizer", "desktop", "modular"],
            "price_ils": 7800
        },
        {
            "id": "nord-lead-synth-1",
            "brand": "Nord",
            "name": "Nord Lead Synth 1",
            "model_number": "Lead Synth 1",
            "main_category": "Synthesizers",
            "description": "Compact synthesizer with powerful sound design capabilities. Perfect for live performance and studio production.",
            "short_description": "Compact performance synthesizer",
            "image_url": "https://www.nordkeyboards.com/images/nord-lead-synth-1.jpg",
            "images": [
                {"url": "https://www.nordkeyboards.com/images/nord-lead-synth-1.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Voices", "value": "12-voice polyphony"},
                {"key": "Oscillators", "value": "3 per voice"},
                {"key": "Size", "value": "Compact"},
                {"key": "Sequencer", "value": "Step sequencer"},
                {"key": "Connectivity", "value": "MIDI, Audio, USB"}
            ],
            "tags": ["synthesizer", "compact", "live"],
            "price_ils": 6500
        }
    ]
    
    # ==================== BOSS CATALOG ====================
    boss_products = [
        {
            "id": "boss-gt-1",
            "brand": "Boss",
            "name": "GT-1 Multi-Effects Processor",
            "model_number": "GT-1",
            "main_category": "Effects",
            "description": "Advanced multi-effects and amp modeling processor with 160+ effects. Perfect for guitarists seeking ultimate creative control.",
            "short_description": "Multi-effects processor with amp modeling",
            "image_url": "https://www.boss.info/products/gt-1/images/gt-1.jpg",
            "images": [
                {"url": "https://www.boss.info/products/gt-1/images/gt-1.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Effects", "value": "160+"},
                {"key": "Amp Models", "value": "50+"},
                {"key": "CPU", "value": "Dual core processor"},
                {"key": "Footswitches", "value": "6 assignable"},
                {"key": "Connectivity", "value": "USB, MIDI, Audio"}
            ],
            "tags": ["guitar-effects", "processor", "amp-modeling"],
            "price_ils": 4500
        },
        {
            "id": "boss-me-80",
            "brand": "Boss",
            "name": "ME-80 Multi-Effects",
            "model_number": "ME-80",
            "main_category": "Effects",
            "description": "Professional-grade multi-effects unit with integrated expression pedal and looper. Ideal for live performance and studio recording.",
            "short_description": "Professional multi-effects with expression pedal",
            "image_url": "https://www.boss.info/products/me-80/images/me-80.jpg",
            "images": [
                {"url": "https://www.boss.info/products/me-80/images/me-80.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Effects", "value": "100+"},
                {"key": "Amp Models", "value": "30+"},
                {"key": "Expression Pedal", "value": "Built-in"},
                {"key": "Looper", "value": "8-minute recording"},
                {"key": "Connectivity", "value": "USB, MIDI, Audio"}
            ],
            "tags": ["guitar-effects", "professional", "live"],
            "price_ils": 3200
        },
        {
            "id": "boss-rc-505",
            "brand": "Boss",
            "name": "RC-505 Rhythm Looper",
            "model_number": "RC-505",
            "main_category": "Looper",
            "description": "Dedicated rhythm and loop recording station. Create full multi-track compositions with integrated drum machine.",
            "short_description": "Rhythm looper with drum machine",
            "image_url": "https://www.boss.info/products/rc-505/images/rc-505.jpg",
            "images": [
                {"url": "https://www.boss.info/products/rc-505/images/rc-505.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Tracks", "value": "5 simultaneous"},
                {"key": "Recording Time", "value": "3 hours per track"},
                {"key": "Drum Machine", "value": "Built-in"},
                {"key": "Rhythm Patterns", "value": "180+"},
                {"key": "Connectivity", "value": "USB, MIDI, Audio"}
            ],
            "tags": ["looper", "rhythm", "drum-machine"],
            "price_ils": 2800
        },
        {
            "id": "boss-dr-880",
            "brand": "Boss",
            "name": "DR-880 Rhythm Composer",
            "model_number": "DR-880",
            "main_category": "Drums",
            "description": "Comprehensive drum programming and rhythm composition workstation. Professional-grade percussion instrument.",
            "short_description": "Rhythm composition workstation",
            "image_url": "https://www.boss.info/products/dr-880/images/dr-880.jpg",
            "images": [
                {"url": "https://www.boss.info/products/dr-880/images/dr-880.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Drum Sounds", "value": "800+"},
                {"key": "Patterns", "value": "1000+"},
                {"key": "Sequencer", "value": "16-track"},
                {"key": "Audio Processing", "value": "12-part EQ"},
                {"key": "Connectivity", "value": "USB, MIDI, Audio"}
            ],
            "tags": ["drums", "rhythm", "workstation"],
            "price_ils": 3100
        }
    ]
    
    # ==================== MOOG CATALOG ====================
    moog_products = [
        {
            "id": "moog-moog-one",
            "brand": "Moog",
            "name": "Moog One",
            "model_number": "Moog One",
            "main_category": "Synthesizers",
            "description": "The future of analog synthesis. Moog's first multi-voice synthesizer in 20 years featuring 4-voice polyphony with lush analog warmth.",
            "short_description": "Modern multi-voice analog synthesizer",
            "image_url": "https://www.moogmusic.com/products/moog-one/images/moog-one.jpg",
            "images": [
                {"url": "https://www.moogmusic.com/products/moog-one/images/moog-one.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Voices", "value": "4-voice analog"},
                {"key": "Oscillators", "value": "2 analog + 1 digital per voice"},
                {"key": "Filters", "value": "Ladder + Multi-mode"},
                {"key": "Sequencer", "value": "Integrated arpeggiator"},
                {"key": "Connectivity", "value": "MIDI, CV/Gate, Audio"}
            ],
            "tags": ["synthesizer", "analog", "modern"],
            "price_ils": 11000
        },
        {
            "id": "moog-sub-phatty",
            "brand": "Moog",
            "name": "Moog Sub Phatty",
            "model_number": "Sub Phatty",
            "main_category": "Synthesizers",
            "description": "Compact analog synthesizer with signature Moog filter. Legendary bass character in a portable size.",
            "short_description": "Portable analog synthesizer",
            "image_url": "https://www.moogmusic.com/products/sub-phatty/images/sub-phatty.jpg",
            "images": [
                {"url": "https://www.moogmusic.com/products/sub-phatty/images/sub-phatty.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Keys", "value": "25 velocity-sensitive"},
                {"key": "Oscillators", "value": "2 analog"},
                {"key": "Filter", "value": "24dB/octave Ladder"},
                {"key": "Sequencer", "value": "Step sequencer"},
                {"key": "Connectivity", "value": "MIDI, CV/Gate, USB"}
            ],
            "tags": ["synthesizer", "portable", "bass"],
            "price_ils": 5200
        },
        {
            "id": "moog-mother-32",
            "brand": "Moog",
            "name": "Moog Mother-32",
            "model_number": "Mother-32",
            "main_category": "Synthesizers",
            "description": "Portable semi-modular synthesizer. Perfect introduction to analog synthesis and modular patching.",
            "short_description": "Semi-modular synthesizer",
            "image_url": "https://www.moogmusic.com/products/mother-32/images/mother-32.jpg",
            "images": [
                {"url": "https://www.moogmusic.com/products/mother-32/images/mother-32.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Keys", "value": "32 velocity-sensitive"},
                {"key": "Oscillators", "value": "1 analog VCO"},
                {"key": "Filter", "value": "24dB/octave"},
                {"key": "Patch Cables", "value": "Modular patching"},
                {"key": "Connectivity", "value": "MIDI, CV/Gate, Audio"}
            ],
            "tags": ["synthesizer", "modular", "educational"],
            "price_ils": 3800
        },
        {
            "id": "moog-minitaur",
            "brand": "Moog",
            "name": "Moog Minitaur",
            "model_number": "Minitaur",
            "main_category": "Synthesizers",
            "description": "Compact analog bass synthesizer. Desktop version of the Sub Phatty with deeper sound design capabilities.",
            "short_description": "Analog bass synthesizer",
            "image_url": "https://www.moogmusic.com/products/minitaur/images/minitaur.jpg",
            "images": [
                {"url": "https://www.moogmusic.com/products/minitaur/images/minitaur.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Oscillators", "value": "2 analog"},
                {"key": "Filter", "value": "Ladder 24dB/octave"},
                {"key": "Sequencer", "value": "Built-in step sequencer"},
                {"key": "Connectivity", "value": "MIDI, CV/Gate, USB"},
                {"key": "Size", "value": "Desktop module"}
            ],
            "tags": ["synthesizer", "bass", "desktop"],
            "price_ils": 3200
        }
    ]
    
    # ==================== UNIVERSAL AUDIO CATALOG ====================
    ua_products = [
        {
            "id": "ua-luna-daw",
            "brand": "Universal Audio",
            "name": "Luna DAW",
            "model_number": "Luna",
            "main_category": "Software",
            "description": "Powerful DAW with built-in mixing and mastering capabilities. Integrates with Apollo interface for real-time DSP processing.",
            "short_description": "Professional DAW with integrated DSP",
            "image_url": "https://www.uaudio.com/products/luna/images/luna-daw.jpg",
            "images": [
                {"url": "https://www.uaudio.com/products/luna/images/luna-daw.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Format", "value": "Native + DSP"},
                {"key": "Tracks", "value": "Unlimited"},
                {"key": "Plugins", "value": "100+ included"},
                {"key": "Interface Integration", "value": "Apollo"},
                {"key": "OS", "value": "macOS, Windows"}
            ],
            "tags": ["daw", "software", "professional"],
            "price_ils": 12000
        },
        {
            "id": "ua-apollo-twin-usb",
            "brand": "Universal Audio",
            "name": "Apollo Twin USB",
            "model_number": "Apollo Twin USB",
            "main_category": "Interfaces",
            "description": "Professional 2-in/6-out audio interface with built-in DSP for real-time UAD plugin processing. Ideal for recording and mixing.",
            "short_description": "USB audio interface with DSP processing",
            "image_url": "https://www.uaudio.com/products/apollo/images/apollo-twin-usb.jpg",
            "images": [
                {"url": "https://www.uaudio.com/products/apollo/images/apollo-twin-usb.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Input/Output", "value": "2 in / 6 out"},
                {"key": "DSP", "value": "Dual SHARC processors"},
                {"key": "Latency", "value": "< 2ms"},
                {"key": "Connectivity", "value": "USB 3"},
                {"key": "Plugins", "value": "50+ included"}
            ],
            "tags": ["audio-interface", "dsp", "usb"],
            "price_ils": 5800
        },
        {
            "id": "ua-neve-1073-plugin",
            "brand": "Universal Audio",
            "name": "Neve 1073 Plugin",
            "model_number": "Neve 1073",
            "main_category": "Plugins",
            "description": "Legendary Neve 1073 audio compressor modeled from the original hardware. Industry-standard mixing and mastering tool.",
            "short_description": "Neve compressor plugin",
            "image_url": "https://www.uaudio.com/plugins/neve/images/neve-1073.jpg",
            "images": [
                {"url": "https://www.uaudio.com/plugins/neve/images/neve-1073.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Type", "value": "Compressor/Limiter"},
                {"key": "DSP Format", "value": "UAD"},
                {"key": "Modeling", "value": "Hardware authentic"},
                {"key": "Controls", "value": "Full complement"},
                {"key": "Use", "value": "Mixing, Mastering"}
            ],
            "tags": ["plugin", "compressor", "mixing"],
            "price_ils": 950
        },
        {
            "id": "ua-ssl-4000-plugin",
            "brand": "Universal Audio",
            "name": "SSL 4000 Plugin",
            "model_number": "SSL 4000 E",
            "main_category": "Plugins",
            "description": "SSL 4000 E console emulation plugin. Professional mixing console in plugin form.",
            "short_description": "SSL console mixing plugin",
            "image_url": "https://www.uaudio.com/plugins/ssl/images/ssl-4000.jpg",
            "images": [
                {"url": "https://www.uaudio.com/plugins/ssl/images/ssl-4000.jpg", "type": "main"}
            ],
            "specifications": [
                {"key": "Type", "value": "Channel strip"},
                {"key": "DSP Format", "value": "UAD"},
                {"key": "Components", "value": "EQ, Compression, Gate"},
                {"key": "Authenticity", "value": "Console modeling"},
                {"key": "Use", "value": "Professional mixing"}
            ],
            "tags": ["plugin", "mixing", "console"],
            "price_ils": 1200
        }
    ]
    
    # Write all catalogs
    catalogs = {
        "roland": {
            "brand_identity": {
                "id": "roland",
                "name": "Roland Corporation",
                "description": "Leading manufacturer of electronic musical instruments"
            },
            "products": roland_products
        },
        "nord": {
            "brand_identity": {
                "id": "nord",
                "name": "Nord Keyboards",
                "description": "Premium Scandinavian synthesizers and keyboards"
            },
            "products": nord_products
        },
        "boss": {
            "brand_identity": {
                "id": "boss",
                "name": "Boss Corporation",
                "description": "Professional effects and rhythm instruments"
            },
            "products": boss_products
        },
        "moog": {
            "brand_identity": {
                "id": "moog",
                "name": "Moog Music",
                "description": "Legendary analog synthesizer pioneers"
            },
            "products": moog_products
        },
        "universal-audio": {
            "brand_identity": {
                "id": "universal-audio",
                "name": "Universal Audio",
                "description": "Professional audio plugins and hardware"
            },
            "products": ua_products
        }
    }
    
    # Write to data directory
    data_dir = Path("/workspaces/hsc-jit-v3/backend/data/catalogs_brand")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    total_products = 0
    for brand_id, catalog in catalogs.items():
        file_path = data_dir / f"{brand_id}.json"
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        
        product_count = len(catalog['products'])
        total_products += product_count
        print(f"✅ Generated {brand_id}.json ({product_count} products)")
    
    print(f"\n🎉 Generated {total_products} products across {len(catalogs)} brands")
    return total_products


if __name__ == "__main__":
    create_comprehensive_catalog()
