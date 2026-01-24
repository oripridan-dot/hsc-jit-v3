import os
import json
import requests
import time
from pathlib import Path
from PIL import Image
from io import BytesIO

# Configuration
BLUEPRINTS_DIR = Path("backend/data/blueprints")
THUMBNAILS_DIR = Path("frontend/public/data/thumbnails")
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

# Headers to act like a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
}

def process_all():
    print(f"🚀 Starting Thumbnail Pipeline")
    print(f"📂 Blueprints: {BLUEPRINTS_DIR}")
    print(f"📂 Output: {THUMBNAILS_DIR}")

    blueprints = list(BLUEPRINTS_DIR.glob("*_blueprint.json"))
    print(f"🔍 Found {len(blueprints)} blueprints.")
    
    total_downloaded = 0
    total_errors = 0
    
    for bp_file in blueprints:
        try:
            with open(bp_file, "r") as f:
                products = json.load(f)
        except json.JSONDecodeError:
            print(f"⚠️  Skipping invalid JSON: {bp_file}")
            continue
            
        updated = False
        brand_name = bp_file.stem.replace("_blueprint", "")
        
        print(f"🎨 Processing {brand_name} ({len(products)} products)...")
        
        for p in products:
            img_url = p.get("image_url")
            if not img_url:
                continue
                
            # If already local, skip downloading but ensure JSON path is correct
            if not img_url.startswith("http"):
                continue
                
            p_id = p.get("id")
            if not p_id:
                continue

            # Sanitize ID for filename
            safe_id = "".join([c if c.isalnum() else "_" for c in p_id])
            
            # Standardize Naming: Prevent double-branding (e.g. adam-audio_adam_audio_...)
            normalized_brand = brand_name.replace("-", "_").replace(" ", "_")
            if safe_id.startswith(normalized_brand):
                filename = f"{safe_id}.jpg"
            else:
                filename = f"{brand_name}_{safe_id}.jpg"

            local_path = THUMBNAILS_DIR / filename
            
            # The path to be stored in JSON (relative to web root)
            public_path = f"/data/thumbnails/{filename}"
            
            if local_path.exists():
                # Already downloaded, just update JSON if needed
                if p["image_url"] != public_path:
                    p["image_url"] = public_path
                    updated = True
                continue
            
            # Download
            try:
                # print(f"  ⬇️  Downloading {img_url}...") 
                resp = requests.get(img_url, headers=HEADERS, timeout=10)
                if resp.status_code == 200:
                    try:
                        img = Image.open(BytesIO(resp.content))
                        img = img.convert("RGB")
                        img.thumbnail((400, 400)) # 400x400 max
                        img.save(local_path, "JPEG", quality=85)
                        
                        p["image_url"] = public_path
                        updated = True
                        total_downloaded += 1
                        print(f"    ✅ {filename}")
                    except Exception as img_err:
                        print(f"    ❌ Image Error {filename}: {img_err}")
                        total_errors += 1
                else:
                    print(f"    ❌ HTTP {resp.status_code}: {img_url}")
                    total_errors += 1
            except Exception as e:
                print(f"    ❌ Download Error {img_url}: {e}")
                total_errors += 1
                
        if updated:
            with open(bp_file, "w") as f:
                json.dump(products, f, indent=2)
            # print(f"  💾 Updated {bp_file.name}")

    print("="*60)
    print(f"✨ Pipeline Complete")
    print(f"📥 Downloaded: {total_downloaded}")
    print(f"❌ Errors: {total_errors}")
    print("="*60)

if __name__ == "__main__":
    process_all()
