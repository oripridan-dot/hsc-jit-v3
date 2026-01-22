
import json
import os
from pathlib import Path

DATA_DIR = Path("./data/catalogs_brand")

BRANDS = [
    {
        "name": "Roland",
        "slug": "roland",
        "description": "World leader in electronic musical instruments",
        "categories": ["Keys", "Drums", "Production"],
        "products": [
             {"name": "Fantom-06", "category": "Keys", "subcategory": "Workstation"},
             {"name": "Jupiter-X", "category": "Keys", "subcategory": "Synthesizer"},
             {"name": "TR-8S", "category": "Production", "subcategory": "Drum Machine"},
             {"name": "TD-50KV2", "category": "Drums", "subcategory": "V-Drums"},
             {"name": "SP-404MKII", "category": "Production", "subcategory": "Sampler"}
        ]
    },
    {
        "name": "Boss",
        "slug": "boss",
        "description": "Guitar effects and amplifiers",
        "categories": ["Guitar", "Effects"],
        "products": [
             {"name": "Katana-50", "category": "Guitar", "subcategory": "Amplifiers"},
             {"name": "GT-1000", "category": "Guitar", "subcategory": "Multi-Effects"},
             {"name": "RC-505mkII", "category": "Effects", "subcategory": "Loopers"},
             {"name": "DS-1W", "category": "Effects", "subcategory": "Distortion"},
             {"name": "DD-8", "category": "Effects", "subcategory": "Delay"}
        ]
    },
    {
        "name": "Nord",
        "slug": "nord",
        "description": "Handmade in Sweden",
        "categories": ["Keys", "Pianos"],
        "products": [
             {"name": "Nord Stage 4", "category": "Keys", "subcategory": "Stage Piano"},
             {"name": "Nord Piano 5", "category": "Keys", "subcategory": "Stage Piano"},
             {"name": "Nord Electro 6", "category": "Keys", "subcategory": "Stage Keyboard"},
             {"name": "Nord Wave 2", "category": "Keys", "subcategory": "Synthesizer"},
             {"name": "Nord Lead A1", "category": "Keys", "subcategory": "Synthesizer"}
        ]
    },
    {
        "name": "Moog",
        "slug": "moog",
        "description": "Analog synthesizers",
        "categories": ["Keys", "Synths"],
        "products": [
             {"name": "Minimoog Model D", "category": "Keys", "subcategory": "Synthesizer"},
             {"name": "Subsequent 37", "category": "Keys", "subcategory": "Synthesizer"},
             {"name": "Matriarch", "category": "Keys", "subcategory": "Semi-Modular"},
             {"name": "Grandmother", "category": "Keys", "subcategory": "Semi-Modular"},
             {"name": "Moog One", "category": "Keys", "subcategory": "Polyphonic"}
        ]
    },
    {
        "name": "Adam Audio",
        "slug": "adam-audio",
        "description": "Professional studio monitors",
        "categories": ["Studio", "Audio"],
        "products": [
             {"name": "A7V", "category": "Studio", "subcategory": "Monitors"},
             {"name": "A4V", "category": "Studio", "subcategory": "Monitors"},
             {"name": "S2V", "category": "Studio", "subcategory": "Monitors"},
             {"name": "T7V", "category": "Studio", "subcategory": "Monitors"},
             {"name": "Sub10 MK2", "category": "Studio", "subcategory": "Subwoofer"}
        ]
    },
    {
        "name": "Teenage Engineering",
        "slug": "teenage-engineering",
        "description": "Portable synthesizers and design audio",
        "categories": ["Keys", "Studio"],
        "products": [
             {"name": "OP-1 Field", "category": "Keys", "subcategory": "Synthesizer"},
             {"name": "OP-Z", "category": "Keys", "subcategory": "Synthesizer"},
             {"name": "TX-6", "category": "Studio", "subcategory": "Mixer"},
             {"name": "EP-133 K.O. II", "category": "Production", "subcategory": "Sampler"},
             {"name": "OB-4", "category": "Audio", "subcategory": "Speaker"}
        ]
    },
    {
        "name": "Universal Audio",
        "slug": "universal-audio",
        "description": "High-fidelity audio interfaces and plugins",
        "categories": ["Studio", "Audio"],
        "products": [
             {"name": "Apollo Twin X", "category": "Studio", "subcategory": "Interface"},
             {"name": "Apollo x4", "category": "Studio", "subcategory": "Interface"},
             {"name": "Volt 276", "category": "Studio", "subcategory": "Interface"},
             {"name": "UAFX Dream '65", "category": "Guitar", "subcategory": "Pedal"},
             {"name": "Sphere DLX", "category": "Studio", "subcategory": "Microphone"}
        ]
    },
    {
        "name": "Akai Professional",
        "slug": "akai-professional",
        "description": "Music production centers and keyboards",
        "categories": ["Production", "Keys"],
        "products": [
             {"name": "MPC One+", "category": "Production", "subcategory": "MPC"},
             {"name": "MPC Live II", "category": "Production", "subcategory": "MPC"},
             {"name": "MPK Mini MK3", "category": "Keys", "subcategory": "Controller"},
             {"name": "APC64", "category": "Production", "subcategory": "Controller"},
             {"name": "Force", "category": "Production", "subcategory": "Standalone"}
        ]
    },
    {
        "name": "Warm Audio",
        "slug": "warm-audio",
        "description": "Classic analog recording gear reproductions",
        "categories": ["Studio"],
        "products": [
             {"name": "WA-87 R2", "category": "Studio", "subcategory": "Microphone"},
             {"name": "WA-2A", "category": "Studio", "subcategory": "Compressor"},
             {"name": "WA76", "category": "Studio", "subcategory": "Compressor"},
             {"name": "WA-47", "category": "Studio", "subcategory": "Microphone"},
             {"name": "Bus-Comp", "category": "Studio", "subcategory": "Compressor"}
        ]
    },
    {
        "name": "Mackie",
        "slug": "mackie",
        "description": "Mixers, loudspeakers and studio monitors",
        "categories": ["Studio", "Audio"],
        "products": [
             {"name": "ProFX10v3", "category": "Studio", "subcategory": "Mixer"},
             {"name": "Thump215", "category": "Audio", "subcategory": "Speaker"},
             {"name": "CR3-X", "category": "Studio", "subcategory": "Monitors"},
             {"name": "Big Knob Passive", "category": "Studio", "subcategory": "Controller"},
             {"name": "MainStream", "category": "Studio", "subcategory": "Interface"}
        ]
    }
]

def generate_seed():
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True)
        print(f"Created {DATA_DIR}")

    for brand in BRANDS:
        slug = brand["slug"]
        
        # Build strict JSON structure that satisfies frontend/src/lib/schemas.ts
        brand_data = {
            "brand_name": brand["name"],
            "brand_identity": {
                "id": slug,
                "name": brand["name"],
                "description": brand["description"],
                "website": f"https://www.{slug}.com",
                "categories": brand["categories"]
                # brand_colors will be injected by forge_backbone.py based on slug lookup
            },
            "products": []
        }
        
        for i, prod in enumerate(brand["products"]):
            prod_id = f"{slug}-prod-{i+1}"
            brand_data["products"].append({
                "id": prod_id,
                "name": prod["name"],
                "brand": brand["name"],
                "main_category": prod["category"],
                "subcategory": prod["subcategory"],
                "description": f"The {prod['name']} is a premium {prod['subcategory']} from {brand['name']}. It features state-of-the-art technology and superior build quality.",
                "image_url": "https://placehold.co/600x400/png", # Placeholder
                "images": [
                     "https://placehold.co/600x400/png",
                     "https://placehold.co/150x150/png"
                ],
                "pricing": {
                    "regular_price": 1000 + (i * 100),
                    "currency": "USD"
                },
                "specifications": [
                    {"key": "Weight", "value": "10kg"},
                    {"key": "Dimensions", "value": "100x40x10 cm"}
                ],
                "verified": True
            })
            
        filename = DATA_DIR / f"{slug}.json"
        with open(filename, "w") as f:
            json.dump(brand_data, f, indent=2)
        print(f"Generated {filename} with {len(brand_data['products'])} products")

if __name__ == "__main__":
    generate_seed()
