#!/usr/bin/env python3
"""
Generate Category & Subcategory Thumbnails from REAL Products

This script:
1. Scans all brand catalogs for real products
2. For each subcategory, finds the BEST matching product
3. Processes that product's image through VisualFactory
4. Saves as the subcategory thumbnail

ONE-TIME PROCESS - Run once to generate all category thumbnails.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from services.visual_factory import VisualFactory

# Category → Subcategory → Keywords for matching products
CATEGORY_SUBCATEGORY_KEYWORDS = {
    "keys": {
        "synths": ["synth", "synthesizer", "lead", "wave", "analog", "modular"],
        "stage-pianos": ["stage", "piano", "electro", "grand"],
        "controllers": ["controller", "midi", "a-88", "a-49", "mpk", "launchpad"],
        "arrangers": ["arranger", "e-x", "bk-", "ea-"],
        "organs": ["organ", "combo", "vk-", "c3"],
        "workstations": ["workstation", "fantom", "montage", "kronos", "motif"],
    },
    "drums": {
        "electronic-drums": ["v-drum", "td-", "electronic drum", "e-drum"],
        "acoustic-drums": ["acoustic", "shell", "kit"],
        "cymbals": ["cymbal", "hi-hat", "crash", "ride"],
        "percussion": ["percussion", "cajon", "bongo", "conga", "spd-"],
        "drum-machines": ["drum machine", "tr-", "rhythm", "beat"],
        "pads": ["pad", "spd", "sample pad", "mpc", "push"],
    },
    "guitars": {
        "electric-guitars": ["guitar", "strat", "tele", "les paul", "eurus"],
        "bass-guitars": ["bass guitar", "bass"],
        "amplifiers": ["amp", "amplifier", "katana", "cube", "blues"],
        "effects-pedals": ["pedal", "effect", "distortion", "delay", "reverb", "od-", "ds-", "dd-"],
        "multi-effects": ["multi-effect", "gt-", "gx-", "me-", "boss gt"],
        "accessories": ["tuner", "metronome", "cable", "strap"],
    },
    "studio": {
        "audio-interfaces": ["interface", "audio interface", "volt", "scarlett", "apollo"],
        "studio-monitors": ["monitor", "speaker", "a7", "a5", "t5", "t7", "hs"],
        "microphones": ["microphone", "mic", "condenser", "dynamic", "ribbon", "wa-"],
        "outboard-gear": ["outboard", "compressor", "eq", "channel strip"],
        "preamps": ["preamp", "pre-amp", "tube", "solid state"],
        "software": ["software", "plugin", "cloud", "daw"],
    },
    "live": {
        "pa-speakers": ["pa speaker", "pa system", "srm", "thump", "eon"],
        "mixers": ["mixer", "mixing console", "profx", "onyx"],
        "powered-mixers": ["powered mixer", "ppm"],
        "wireless-systems": ["wireless", "transmitter", "receiver"],
        "in-ear-monitoring": ["in-ear", "iem", "monitor system"],
        "stage-boxes": ["stage box", "snake", "bridge cast"],
    },
    "dj": {
        "dj-controllers": ["dj controller", "ddj", "numark"],
        "grooveboxes": ["groovebox", "op-", "sp-404", "mc-"],
        "samplers": ["sampler", "mpc", "maschine", "octatrack"],
        "dj-headphones": ["dj headphone", "hdj"],
        "production": ["production", "pocket operator", "op-1", "op-z"],
        "accessories": ["dj case", "dj stand", "headphone"],
    },
    "software": {
        "plugins": ["plugin", "vst", "au", "zenology", "cloud"],
        "daw": ["daw", "ableton", "logic", "cubase"],
        "sound-libraries": ["library", "sound pack", "preset", "patch"],
    },
    "accessories": {
        "cables": ["cable", "cord", "rmc", "ric"],
        "stands": ["stand", "ks-", "keyboard stand"],
        "cases": ["case", "bag", "cb-", "gig bag"],
        "pedals": ["sustain", "expression", "footswitch", "dp-"],
        "power": ["power supply", "adapter", "psa"],
    },
}


def load_all_products() -> List[Dict]:
    """Load all products from ORIGINAL scraped catalogs with HTTP URLs."""
    # Use the original scraped data which has real HTTP image URLs
    scraped_data = Path(__file__).parent.parent / "data" / "catalogs_brand"
    all_products = []
    
    for catalog_file in scraped_data.glob("*.json"):
        try:
            with open(catalog_file, "r") as f:
                data = json.load(f)
                products = data.get("products", [])
                for p in products:
                    p["_source_brand"] = catalog_file.stem
                    # Extract main image URL from images array if available
                    if isinstance(p.get("images"), list) and p["images"]:
                        for img in p["images"]:
                            if img.get("type") == "main" and img.get("url", "").startswith("http"):
                                p["_main_image_url"] = img["url"]
                                break
                        if not p.get("_main_image_url") and p["images"][0].get("url", "").startswith("http"):
                            p["_main_image_url"] = p["images"][0]["url"]
                all_products.extend(products)
                print(f"   📦 Loaded {len(products)} products from {catalog_file.stem}")
        except Exception as e:
            print(f"⚠️ Error loading {catalog_file}: {e}")
    
    return all_products


def find_best_product_for_subcategory(
    products: List[Dict], 
    category_id: str, 
    subcategory_id: str,
    keywords: List[str]
) -> Optional[Dict]:
    """Find the best matching product for a subcategory based on keywords."""
    
    candidates = []
    
    for product in products:
        name = (product.get("name") or "").lower()
        category = (product.get("main_category") or product.get("category") or "").lower()
        subcategory = (product.get("subcategory") or "").lower()
        description = (product.get("description") or "").lower()
        
        # Check if product has a valid HTTP image URL
        image_url = get_image_url(product)
        if not image_url or not image_url.startswith("http"):
            continue
        
        # Score based on keyword matches
        score = 0
        search_text = f"{name} {category} {subcategory} {description}"
        
        for keyword in keywords:
            if keyword.lower() in search_text:
                score += 10
                # Bonus for name match
                if keyword.lower() in name:
                    score += 5
        
        if score > 0:
            candidates.append((score, product))
    
    # Sort by score (highest first)
    candidates.sort(key=lambda x: -x[0])
    
    if candidates:
        return candidates[0][1]
    
    return None


def get_image_url(product: Dict) -> Optional[str]:
    """Extract the best HTTP image URL from a product."""
    # Prefer the extracted main image URL
    if product.get("_main_image_url"):
        return product["_main_image_url"]
    
    # Try images array for HTTP URLs
    if isinstance(product.get("images"), list):
        for img in product["images"]:
            url = img.get("url", "")
            if url.startswith("http") and img.get("type") == "main":
                return url
        # Fallback to first HTTP URL
        for img in product["images"]:
            url = img.get("url", "")
            if url.startswith("http"):
                return url
    
    # Try direct URL fields
    for field in ["image_url", "image"]:
        url = product.get(field, "")
        if url and url.startswith("http"):
            return url
    
    return None


def main():
    print("🏭 Category Thumbnail Generator")
    print("=" * 50)
    
    # Initialize VisualFactory
    vf = VisualFactory()
    
    # Output directory
    output_dir = Path(__file__).parent.parent / "frontend" / "public" / "data" / "category_thumbnails"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Load all products
    print("\n📦 Loading products from all catalogs...")
    all_products = load_all_products()
    print(f"   Found {len(all_products)} total products")
    
    # Track results
    results = {}
    processed = 0
    failed = 0
    
    # Process each category and subcategory
    for category_id, subcategories in CATEGORY_SUBCATEGORY_KEYWORDS.items():
        print(f"\n📁 {category_id.upper()}")
        results[category_id] = {}
        
        for subcategory_id, keywords in subcategories.items():
            # Find best matching product
            product = find_best_product_for_subcategory(
                all_products, category_id, subcategory_id, keywords
            )
            
            if not product:
                print(f"   ⚠️ {subcategory_id}: No matching product found")
                failed += 1
                continue
            
            image_url = get_image_url(product)
            if not image_url or not image_url.startswith("http"):
                print(f"   ⚠️ {subcategory_id}: Product has no HTTP image URL")
                failed += 1
                continue
            
            # Output path
            output_base = output_dir / f"{category_id}-{subcategory_id}"
            
            print(f"   🖼️ {subcategory_id}: {product.get('name', 'Unknown')[:30]}...")
            print(f"      URL: {image_url[:60]}...")
            
            # Process through VisualFactory
            try:
                result = vf.process_product_asset(
                    image_url=image_url,
                    output_path_base=str(output_base),
                    force_reprocess=True
                )
                
                if result:
                    results[category_id][subcategory_id] = {
                        "product_id": product.get("id"),
                        "product_name": product.get("name"),
                        "brand": product.get("brand") or product.get("_source_brand"),
                        "thumbnail": f"/data/category_thumbnails/{category_id}-{subcategory_id}_thumb.webp",
                    }
                    print(f"      ✅ Generated thumbnail")
                    processed += 1
                else:
                    print(f"      ❌ VisualFactory returned None")
                    failed += 1
            except Exception as e:
                print(f"      ❌ Error: {e}")
                failed += 1
    
    # Save mapping file
    mapping_file = output_dir / "_category_mapping.json"
    with open(mapping_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'=' * 50}")
    print(f"✨ COMPLETE")
    print(f"   ✅ Processed: {processed}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📄 Mapping: {mapping_file}")
    print(f"\n📝 Next: Update universalCategories.ts with new paths")


if __name__ == "__main__":
    main()
