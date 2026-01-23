#!/usr/bin/env python3
"""
Generate ALL Category Thumbnails from Real Products

Applies the refined approach from Keys & Pianos to all 8 categories.
One-time process to generate all category thumbnails through VisualFactory.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from services.visual_factory import VisualFactory

# All category → subcategory → keyword/brand mappings
ALL_CATEGORIES = {
    "keys": {
        "synths": {
            "keywords": ["synth", "synthesizer", "lead", "wave", "analog", "modular", "jupiter", "juno", "fantom"],
            "priority_brands": ["roland", "moog", "nord"],
        },
        "stage-pianos": {
            "keywords": ["stage", "piano", "electro", "grand", "rd-", "fp-", "nord stage", "go:piano"],
            "priority_brands": ["nord", "roland"],
        },
        "controllers": {
            "keywords": ["controller", "midi", "a-88", "a-49", "mpk", "launchpad", "mkii"],
            "priority_brands": ["roland", "akai"],
        },
        "arrangers": {
            "keywords": ["arranger", "e-x", "bk-", "e-x50", "e-a7", "e-x10"],
            "priority_brands": ["roland"],
        },
        "organs": {
            "keywords": ["organ", "combo", "vk-", "c3", "nord c"],
            "priority_brands": ["nord", "roland"],
        },
        "workstations": {
            "keywords": ["workstation", "fantom", "montage", "kronos", "motif"],
            "priority_brands": ["roland"],
        },
    },
    "drums": {
        "electronic-drums": {
            "keywords": ["v-drum", "td-", "electronic drum", "e-drum", "vad"],
            "priority_brands": ["roland"],
        },
        "acoustic-drums": {
            "keywords": ["acoustic", "shell", "kit", "snare", "drum set"],
            "priority_brands": ["roland"],
        },
        "cymbals": {
            "keywords": ["cymbal", "hi-hat", "crash", "ride", "cy-"],
            "priority_brands": ["roland", "zildjian"],
        },
        "percussion": {
            "keywords": ["percussion", "cajon", "bongo", "conga", "spd-", "ec-10"],
            "priority_brands": ["roland"],
        },
        "drum-machines": {
            "keywords": ["drum machine", "tr-", "rhythm", "beat", "tr-8", "tr-6"],
            "priority_brands": ["roland"],
        },
        "pads": {
            "keywords": ["pad", "spd", "sample pad", "mpc", "push", "octapad"],
            "priority_brands": ["roland", "akai"],
        },
    },
    "guitars": {
        "electric-guitars": {
            "keywords": ["guitar", "strat", "tele", "les paul", "eurus", "gc-1"],
            "priority_brands": ["boss", "roland"],
        },
        "bass-guitars": {
            "keywords": ["bass guitar", "bass", "b-"],
            "priority_brands": ["boss", "roland"],
        },
        "amplifiers": {
            "keywords": ["amp", "amplifier", "katana", "cube", "blues cube", "jc-", "ktn"],
            "priority_brands": ["boss", "roland"],
        },
        "effects-pedals": {
            "keywords": ["pedal", "effect", "distortion", "delay", "reverb", "od-", "ds-", "dd-", "rv-"],
            "priority_brands": ["boss"],
        },
        "multi-effects": {
            "keywords": ["multi-effect", "gt-", "gx-", "me-", "boss gt", "ge-"],
            "priority_brands": ["boss"],
        },
        "accessories": {
            "keywords": ["tuner", "metronome", "cable", "strap", "tu-"],
            "priority_brands": ["boss", "roland"],
        },
    },
    "studio": {
        "audio-interfaces": {
            "keywords": ["interface", "audio interface", "volt", "scarlett", "apollo", "rubix"],
            "priority_brands": ["roland"],
        },
        "studio-monitors": {
            "keywords": ["monitor", "speaker", "a7", "a5", "t5", "t7", "hs", "studio monitor"],
            "priority_brands": ["adam-audio", "roland"],
        },
        "microphones": {
            "keywords": ["microphone", "mic", "condenser", "dynamic", "ribbon", "wa-"],
            "priority_brands": ["warm-audio", "roland"],
        },
        "outboard-gear": {
            "keywords": ["outboard", "compressor", "eq", "channel strip", "rack"],
            "priority_brands": ["warm-audio"],
        },
        "preamps": {
            "keywords": ["preamp", "pre-amp", "tube", "solid state", "tone beast"],
            "priority_brands": ["warm-audio"],
        },
        "software": {
            "keywords": ["software", "plugin", "cloud", "daw", "zenology"],
            "priority_brands": ["roland"],
        },
    },
    "live": {
        "pa-speakers": {
            "keywords": ["pa speaker", "pa system", "srm", "thump", "eon", "ba-330"],
            "priority_brands": ["roland", "mackie"],
        },
        "mixers": {
            "keywords": ["mixer", "mixing console", "profx", "onyx", "v-mixer"],
            "priority_brands": ["roland", "mackie"],
        },
        "powered-mixers": {
            "keywords": ["powered mixer", "ppm", "power mixer"],
            "priority_brands": ["mackie"],
        },
        "wireless-systems": {
            "keywords": ["wireless", "transmitter", "receiver", "wl-"],
            "priority_brands": ["boss", "roland"],
        },
        "in-ear-monitoring": {
            "keywords": ["in-ear", "iem", "monitor system", "personal monitor"],
            "priority_brands": ["roland"],
        },
        "stage-boxes": {
            "keywords": ["stage box", "snake", "bridge cast", "s-1608"],
            "priority_brands": ["roland"],
        },
    },
    "dj": {
        "dj-controllers": {
            "keywords": ["dj controller", "ddj", "numark", "dj-"],
            "priority_brands": ["pioneer", "numark"],
        },
        "grooveboxes": {
            "keywords": ["groovebox", "op-", "sp-404", "mc-", "mc-101", "mc-707", "verselab"],
            "priority_brands": ["roland"],
        },
        "samplers": {
            "keywords": ["sampler", "mpc", "maschine", "octatrack", "sp-404"],
            "priority_brands": ["roland", "akai"],
        },
        "dj-headphones": {
            "keywords": ["dj headphone", "hdj", "rh-"],
            "priority_brands": ["roland", "pioneer"],
        },
        "production": {
            "keywords": ["production", "pocket operator", "op-1", "op-z", "aira"],
            "priority_brands": ["roland"],
        },
        "accessories": {
            "keywords": ["dj case", "dj stand", "headphone", "bag"],
            "priority_brands": ["roland"],
        },
    },
    "software": {
        "plugins": {
            "keywords": ["plugin", "vst", "au", "zenology", "cloud", "roland cloud"],
            "priority_brands": ["roland"],
        },
        "daw": {
            "keywords": ["daw", "ableton", "logic", "cubase", "zen-core"],
            "priority_brands": ["roland"],
        },
        "sound-libraries": {
            "keywords": ["library", "sound pack", "preset", "patch", "expansion"],
            "priority_brands": ["roland"],
        },
    },
    "accessories": {
        "cables": {
            "keywords": ["cable", "cord", "rmc", "ric", "interconnect"],
            "priority_brands": ["roland"],
        },
        "stands": {
            "keywords": ["stand", "ks-", "keyboard stand", "mds-"],
            "priority_brands": ["roland"],
        },
        "cases": {
            "keywords": ["case", "bag", "cb-", "gig bag", "carrying"],
            "priority_brands": ["roland"],
        },
        "pedals": {
            "keywords": ["sustain", "expression", "footswitch", "dp-", "ev-"],
            "priority_brands": ["roland"],
        },
        "power": {
            "keywords": ["power supply", "adapter", "psa", "brc"],
            "priority_brands": ["boss", "roland"],
        },
    },
}


def load_products() -> List[Dict]:
    """Load all products from original scraped catalogs."""
    scraped_data = Path(__file__).parent.parent / "data" / "catalogs_brand"
    all_products = []
    
    for catalog_file in scraped_data.glob("*.json"):
        try:
            with open(catalog_file, "r") as f:
                data = json.load(f)
                products = data.get("products", [])
                for p in products:
                    p["_source_brand"] = catalog_file.stem
                all_products.extend(products)
                print(f"📦 Loaded {len(products)} from {catalog_file.stem}")
        except Exception as e:
            print(f"⚠️ Error loading {catalog_file}: {e}")
    
    return all_products


def get_http_image_url(product: Dict) -> Optional[str]:
    """Extract HTTP image URL from product."""
    images = product.get("images", [])
    if isinstance(images, list):
        for img in images:
            if img.get("type") == "main" and img.get("url", "").startswith("http"):
                return img["url"]
        for img in images:
            if img.get("url", "").startswith("http"):
                return img["url"]
    
    for field in ["image_url", "image"]:
        url = product.get(field, "")
        if url and url.startswith("http"):
            return url
    
    return None


def score_product(product: Dict, keywords: List[str], priority_brands: List[str]) -> int:
    """Score a product based on keyword and brand matches."""
    name = (product.get("name") or "").lower()
    category = (product.get("main_category") or product.get("category") or "").lower()
    subcategory = (product.get("subcategory") or "").lower()
    description = (product.get("description") or "").lower()
    brand = (product.get("brand") or product.get("_source_brand") or "").lower()
    
    search_text = f"{name} {category} {subcategory} {description}"
    
    score = 0
    
    for keyword in keywords:
        kw = keyword.lower()
        if kw in search_text:
            score += 10
            if kw in name:
                score += 15
    
    for i, pb in enumerate(priority_brands):
        if pb.lower() in brand:
            score += 20 - (i * 5)
            break
    
    return score


def find_best_product(products: List[Dict], config: Dict) -> Tuple[Optional[Dict], Optional[str]]:
    """Find the best product for a subcategory."""
    keywords = config["keywords"]
    priority_brands = config.get("priority_brands", [])
    
    candidates = []
    
    for product in products:
        image_url = get_http_image_url(product)
        if not image_url:
            continue
        
        score = score_product(product, keywords, priority_brands)
        if score > 0:
            candidates.append((score, product, image_url))
    
    candidates.sort(key=lambda x: -x[0])
    
    if candidates:
        return candidates[0][1], candidates[0][2]
    
    return None, None


def main():
    print("🏭 ALL Category Thumbnails Generator")
    print("=" * 60)
    
    output_dir = Path(__file__).parent.parent / "frontend" / "public" / "data" / "category_thumbnails"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    products = load_products()
    with_urls = [p for p in products if get_http_image_url(p)]
    print(f"\nTotal: {len(products)} products, {len(with_urls)} with HTTP URLs")
    
    vf = VisualFactory()
    
    results = {}
    total_generated = 0
    total_failed = 0
    
    for category_id, subcategories in ALL_CATEGORIES.items():
        print(f"\n{'=' * 60}")
        print(f"📁 {category_id.upper()}")
        print(f"{'=' * 60}")
        
        results[category_id] = {}
        
        for subcategory_id, config in subcategories.items():
            print(f"\n📌 {subcategory_id}")
            
            product, image_url = find_best_product(products, config)
            
            if not product:
                print(f"   ⚠️ No matching product")
                total_failed += 1
                continue
            
            print(f"   → {product.get('name', '?')[:40]}")
            
            output_base = output_dir / f"{category_id}-{subcategory_id}"
            
            try:
                result = vf.process_product_asset(
                    image_url=image_url,
                    output_path_base=str(output_base),
                    force_reprocess=True
                )
                
                if result:
                    thumb_path = f"/data/category_thumbnails/{category_id}-{subcategory_id}_thumb.webp"
                    results[category_id][subcategory_id] = {
                        "product_id": product.get("id"),
                        "product_name": product.get("name"),
                        "brand": product.get("brand") or product.get("_source_brand"),
                        "thumbnail": thumb_path,
                    }
                    print(f"   ✅ Generated")
                    total_generated += 1
                else:
                    print(f"   ❌ VisualFactory returned None")
                    total_failed += 1
            except Exception as e:
                print(f"   ❌ Error: {e}")
                total_failed += 1
    
    # Save full mapping
    mapping_file = output_dir / "_category_mapping.json"
    with open(mapping_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"✨ ALL CATEGORIES COMPLETE")
    print(f"   ✅ Generated: {total_generated}")
    print(f"   ❌ Failed: {total_failed}")
    print(f"   📄 Mapping: {mapping_file}")
    
    # Summary by category
    print(f"\n📊 Summary:")
    for cat_id, subs in results.items():
        total_subs = len(ALL_CATEGORIES[cat_id])
        print(f"   {cat_id}: {len(subs)}/{total_subs}")


if __name__ == "__main__":
    main()
