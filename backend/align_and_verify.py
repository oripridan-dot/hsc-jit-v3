import json
import os
from pathlib import Path

# --- Configuration ---
FRONTEND_DATA_DIR = Path("../frontend/public/data")
IMAGES_REL_DIR = "product_images"
# List of active brands (those with both JSON and image directories)
BRANDS = [
    "adam-audio",
    "akai-professional",
    "boss",
    "mackie",
    "moog",
    "nord",
    "roland",
    "teenage-engineering",
    "universal-audio",
    "warm-audio"
]

def align_and_verify():
    print("🚀 STARTING VISUAL FACTORY ALIGNMENT & VERIFICATION\n")
    
    total_aligned = 0
    total_errors = 0
    total_products = 0

    for brand in BRANDS:
        json_path = FRONTEND_DATA_DIR / f"{brand}.json"
        img_dir = FRONTEND_DATA_DIR / IMAGES_REL_DIR / brand

        if not json_path.exists():
            print(f"⚠️  Skipping {brand}: Catalog JSON not found.")
            continue
        
        if not img_dir.exists():
            print(f"⚠️  Skipping {brand}: Image directory not found.")
            continue

        # 1. Load the Map (JSON)
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"❌ Error loading {brand}.json: {e}")
            total_errors += 1
            continue

        # 2. Scan the Territory (Disk)
        # Find all valid webp thumbnails
        valid_images = sorted([f.name for f in img_dir.glob("*_thumb.webp")])
        
        if not valid_images:
            print(f"❌ {brand}: No processed thumbnails found in {img_dir}")
            total_errors += 1
            continue

        products = data.get('products', [])
        total_products += len(products)
        print(f"🔵 {brand}: Found {len(valid_images)} valid images for {len(products)} products.")

        # 3. Align & Verify
        for i, product in enumerate(products):
            # Round-robin assignment: Loop through images if we have more products than images
            assigned_img = valid_images[i % len(valid_images)]
            
            # Construct the web-accessible URL
            web_path = f"/data/{IMAGES_REL_DIR}/{brand}/{assigned_img}"
            
            # Verify Physical Existence (The "Verification" Step)
            physical_path = FRONTEND_DATA_DIR / IMAGES_REL_DIR / brand / assigned_img
            
            if physical_path.exists():
                # Apply to JSON
                product['image_url'] = web_path
                if 'images' not in product:
                    product['images'] = {}
                product['images']['thumbnail'] = web_path
                
                # Assume matching main/inspect image exists if thumb exists
                inspect_name = assigned_img.replace('_thumb', '_inspect')
                inspect_path = web_path.replace('_thumb', '_inspect')
                product['images']['main'] = inspect_path
                
                total_aligned += 1
            else:
                print(f"   🚩 CRITICAL FAIL: {web_path} does not exist on disk!")
                total_errors += 1

        # 4. Save the Corrected Map
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"   ✅ {brand}.json aligned successfully.\n")
        except Exception as e:
            print(f"   ❌ Error saving {brand}.json: {e}\n")
            total_errors += 1

    print("---------------------------------------------------")
    print(f"🏁 COMPLETION REPORT")
    print(f"   Total Products Processed:    {total_products}")
    print(f"   Products Aligned & Verified: {total_aligned}")
    print(f"   Broken Links Detected:       {total_errors}")
    if total_errors == 0:
        print("   STATUS: SYSTEM FLOW CLEAR 🟢")
    else:
        print("   STATUS: CLOG DETECTED 🔴")

if __name__ == "__main__":
    align_and_verify()
