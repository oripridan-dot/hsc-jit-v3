import json
import os
from pathlib import Path
import random

DATA_DIR = Path("./data/catalogs_brand")
DATA_DIR.mkdir(parents=True, exist_ok=True)

def generate_product(brand, name, category, subcategory, price, tier="Standard"):
    slug = name.lower().replace(" ", "-").replace(".", "")
    return {
      "id": f"{brand.lower()}-{slug}",
      "name": name,
      "brand": brand,
      "main_category": category,
      "subcategory": subcategory,
      "description": f"The {name} represents the {tier.lower()} tier of {brand}'s {subcategory} lineup. Designed for {category.lower()} professionals.",
      "image_url": f"/data/product_images/{brand.lower()}/{brand.lower()}-{slug}_thumb.webp",
      "images": [
        f"/data/product_images/{brand.lower()}/{brand.lower()}-{slug}_thumb.webp",
        f"/data/product_images/{brand.lower()}/{brand.lower()}-{slug}_main.webp"
      ],
      "pricing": {
        "regular_price": price,
        "currency": "ILS"
      },
      "halilit_price": price,
      "specifications": [
        { "key": "Tier", "value": tier },
        { "key": "Warranty", "value": "2 Years" }
      ],
      "availability": random.choice(["in-stock", "in-stock", "in-stock", "low-stock"]),
      "sku": f"HL-{brand[:2].upper()}-{random.randint(1000,9999)}",
      "verified": True
    }

BRANDS_DATA = [
    {
        "name": "Roland",
        "slug": "roland",
        "products": [
            ("Fantom-06", "Keys", "Workstation", 5900, "Entry"),
            ("Fantom-07", "Keys", "Workstation", 7400, "Standard"),
            ("Fantom-08", "Keys", "Workstation", 9900, "Flagship"),
            ("RD-88", "Keys", "Stage Piano", 4500, "Entry"),
            ("RD-2000", "Keys", "Stage Piano", 8900, "Flagship"),
            ("Jupiter-Xm", "Keys", "Synthesizer", 5400, "Standard"),
            ("Jupiter-X", "Keys", "Synthesizer", 9200, "Flagship"),
            ("TR-8S", "Drums", "Drum Machine", 3200, "Standard"),
            ("TD-07KV", "Drums", "V-Drums", 4200, "Entry"),
            ("TD-50KV2", "Drums", "V-Drums", 28000, "Flagship")
        ]
    },
    {
        "name": "Boss",
        "slug": "boss",
        "products": [
            ("Katana-50 Gen3", "Guitar", "Amplifier", 1200, "Entry"),
            ("Katana-100 Gen3", "Guitar", "Amplifier", 1800, "Standard"),
            ("Nextone Special", "Guitar", "Amplifier", 3500, "Flagship"),
            ("GT-1", "Guitar", "Multi-Effects", 900, "Entry"),
            ("GT-1000CORE", "Guitar", "Multi-Effects", 2400, "Standard"),
            ("GT-1000", "Guitar", "Multi-Effects", 4500, "Flagship"),
            ("RC-5", "Guitar", "Looper", 850, "Entry"),
            ("RC-505mkII", "Guitar", "Looper", 2600, "Flagship"),
            ("DM-101", "Guitar", "Delay", 1800, "Flagship"),
            ("GX-100", "Guitar", "Multi-Effects", 2200, "Standard")
        ]
    },
    {
        "name": "Nord",
        "slug": "nord",
        "products": [
            ("Nord Electro 6D 61", "Keys", "Stage Piano", 8500, "Entry"),
            ("Nord Electro 6D 73", "Keys", "Stage Piano", 9800, "Standard"),
            ("Nord Piano 5 73", "Keys", "Stage Piano", 11500, "Standard"),
            ("Nord Piano 5 88", "Keys", "Stage Piano", 12900, "Flagship"),
            ("Nord Stage 4 Compact", "Keys", "Stage Piano", 15500, "Standard"),
            ("Nord Stage 4 88", "Keys", "Stage Piano", 17900, "Flagship"),
            ("Nord Wave 2", "Keys", "Synthesizer", 9900, "Standard"),
            ("Nord Lead A1", "Keys", "Synthesizer", 6500, "Entry"),
            ("Nord Drum 3P", "Drums", "Percussion", 3200, "Standard"),
            ("Nord Grand", "Keys", "Stage Piano", 14500, "Flagship")
        ]
    },
    {
        "name": "Moog",
        "slug": "moog",
        "products": [
            ("Mavis", "Keys", "Synthesizer", 1200, "Entry"),
            ("Mother-32", "Keys", "Semi-Modular", 2900, "Standard"),
            ("DFAM", "Drums", "Percussion", 2900, "Standard"),
            ("Subharmonicon", "Keys", "Semi-Modular", 2900, "Standard"),
            ("Grandmother", "Keys", "Synthesizer", 4200, "Standard"),
            ("Matriarch", "Keys", "Synthesizer", 8500, "Flagship"),
            ("Minimoog Model D", "Keys", "Synthesizer", 22000, "Flagship"),
            ("Subsequent 37", "Keys", "Synthesizer", 6900, "Standard"),
            ("Subsequent 25", "Keys", "Synthesizer", 4500, "Entry"),
            ("Moog One 16", "Keys", "Synthesizer", 45000, "Flagship")
        ]
    },
    {
        "name": "Mackie",
        "slug": "mackie",
        "products": [
            ("CR3-X", "Studio", "Monitors", 500, "Entry"),
            ("CR5-X", "Studio", "Monitors", 800, "Entry"),
            ("MR524", "Studio", "Monitors", 1200, "Standard"),
            ("HR824mk2", "Studio", "Monitors", 3500, "Flagship"),
            ("Big Knob Studio", "Studio", "Controller", 1100, "Standard"),
            ("ProFX6v3", "PA", "Mixer", 800, "Entry"),
            ("ProFX12v3", "PA", "Mixer", 1600, "Standard"),
            ("DL16S", "PA", "Digital Mixer", 3500, "Standard"),
            ("DL32S", "PA", "Digital Mixer", 6500, "Flagship"),
            ("Thump215", "PA", "Speaker", 2200, "Standard")
        ]
    },
    {
        "name": "Adam Audio",
        "slug": "adam-audio",
        "products": [
            ("T5V", "Studio", "Monitors", 900, "Entry"),
            ("T7V", "Studio", "Monitors", 1100, "Entry"),
            ("T8V", "Studio", "Monitors", 1400, "Standard"),
            ("A4V", "Studio", "Monitors", 2500, "Standard"),
            ("A7V", "Studio", "Monitors", 3900, "Standard"),
            ("A77H", "Studio", "Monitors", 6500, "Flagship"),
            ("S2V", "Studio", "Monitors", 7500, "Flagship"),
            ("S3H", "Studio", "Monitors", 12000, "Flagship"),
            ("Sub8", "Studio", "Subwoofer", 2500, "Standard"),
            ("Sub12", "Studio", "Subwoofer", 4500, "Flagship")
        ]
    },
    {
        "name": "Akai Professional",
        "slug": "akai-professional",
        "products": [
            ("MPK Mini Mk3", "Keys", "Controller", 450, "Entry"),
            ("MPK249", "Keys", "Controller", 1800, "Standard"),
            ("MPK261", "Keys", "Controller", 2200, "Standard"),
            ("APC Mini Mk2", "DJ", "Controller", 500, "Entry"),
            ("APC40 Mk2", "DJ", "Controller", 1800, "Flagship"),
            ("MPC One+", "DJ", "Production", 3500, "Standard"),
            ("MPC Live II", "DJ", "Production", 5500, "Standard"),
            ("MPC X SE", "DJ", "Production", 9900, "Flagship"),
            ("Force", "DJ", "Production", 4900, "Standard"),
            ("Fire", "DJ", "Controller", 800, "Entry")
        ]
    },
    {
        "name": "Teenage Engineering",
        "slug": "teenage-engineering",
        "products": [
            ("PO-33 KO", "Keys", "Pocket Operator", 450, "Entry"),
            ("PO-32 Tonic", "Keys", "Pocket Operator", 450, "Entry"),
            ("OP-Z", "Keys", "Synthesizer", 2400, "Standard"),
            ("OP-1 Field", "Keys", "Synthesizer", 8900, "Flagship"),
            ("TX-6", "Studio", "Mixer", 5500, "Flagship"),
            ("CM-15", "Studio", "Microphone", 5500, "Flagship"),
            ("TP-7", "Studio", "Recorder", 6500, "Flagship"),
            ("EP-133 KO II", "DJ", "Sampler", 1400, "Standard"),
            ("OB-4", "PA", "Speaker", 2800, "Standard"),
            ("OD-11", "PA", "Speaker", 3500, "Flagship")
        ]
    },
    {
        "name": "Universal Audio",
        "slug": "universal-audio",
        "products": [
            ("Volt 1", "Studio", "Interface", 600, "Entry"),
            ("Volt 276", "Studio", "Interface", 1200, "Entry"),
            ("Apollo Solo", "Studio", "Interface", 2200, "Standard"),
            ("Apollo Twin X Duo", "Studio", "Interface", 4500, "Standard"),
            ("Apollo Twin X Quad", "Studio", "Interface", 6500, "Standard"),
            ("Apollo x4", "Studio", "Interface", 8900, "Flagship"),
            ("Apollo x8p", "Studio", "Interface", 14500, "Flagship"),
            ("Sphere DLX", "Studio", "Microphone", 6500, "Flagship"),
            ("SD-1", "Studio", "Microphone", 1400, "Entry"),
            ("UAFX Dream 65", "Guitar", "Pedal", 1800, "Standard")
        ]
    },
    {
        "name": "Warm Audio",
        "slug": "warm-audio",
        "products": [
            ("WA-87 R2", "Studio", "Microphone", 2800, "Standard"),
            ("WA-47", "Studio", "Microphone", 4200, "Flagship"),
            ("WA-14", "Studio", "Microphone", 2200, "Standard"),
            ("WA-251", "Studio", "Microphone", 3500, "Flagship"),
            ("WA-19", "Studio", "Microphone", 900, "Entry"),
            ("WA-2A", "Studio", "Outboard", 4500, "Standard"),
            ("WA-76", "Studio", "Outboard", 3200, "Standard"),
            ("WA-73-EQ", "Studio", "Preamp", 3500, "Standard"),
            ("Bus-Comp", "Studio", "Outboard", 3900, "Standard"),
            ("Centavo", "Guitar", "Pedal", 800, "Entry")
        ]
    }
]

def seed():
    print("🌱 Seeding 10 Brands x 10 Products...")
    
    for brand_data in BRANDS_DATA:
        name = brand_data["name"]
        slug = brand_data["slug"]
        
        products = []
        for p_data in brand_data["products"]:
            products.append(generate_product(
                name, 
                p_data[0], # Name 
                p_data[1], # Category
                p_data[2], # Subcategory
                p_data[3], # Price
                p_data[4]  # Tier
            ))
            
        dataset = {
            "brand_name": name,
            "brand_identity": {
                "id": slug,
                "name": name,
                "website": f"https://www.{slug}.com"
            },
            "products": products
        }
        
        path = DATA_DIR / f"{slug}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(dataset, f, indent=2)
            
        print(f"   ✓ {name}: {len(products)} items -> {path}")

if __name__ == "__main__":
    seed()
