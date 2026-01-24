import os
import json
from pathlib import Path

# Configuration
BLUEPRINTS_DIR = Path("backend/data/blueprints")
THUMBNAILS_DIR = Path("frontend/public/data/thumbnails")
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

def refine_skeleton():
    print("🔧 Starting Skeleton Refinement Protocol...")
    
    blueprints = list(BLUEPRINTS_DIR.glob("*_blueprint.json"))
    print(f"🔍 Found {len(blueprints)} blueprints to refine.")
    
    renamed_count = 0
    updated_blueprints = 0
    
    for bp_file in blueprints:
        print(f"Processing {bp_file.name}...")
        try:
            with open(bp_file, "r") as f:
                products = json.load(f)
        except Exception as e:
            print(f"ERROR loading {bp_file.name}: {e}")
            continue
            
        brand_name = bp_file.stem.replace("_blueprint", "")
        # Normalization: used for checking if ID already has brand prefix
        # e.g. "adam-audio" -> "adam_audio"
        normalized_brand = brand_name.replace("-", "_").replace(" ", "_")
        
        blueprint_changed = False
        if brand_name == "roland":
             print(f"DEBUG: Roland found. Checking products ({len(products)} products)...")
             for i, p in enumerate(products[:3]):
                  print(f"DEBUG: P{i} ID: {p.get('id')}")

        for p in products:
            p_id = p.get("id")
            if not p_id:
                continue
                
            # 1. Determine the Desired New Name
            # Calculate Safe ID
            safe_id = "".join([c if c.isalnum() else "_" for c in p_id])
            
            # If the ID itself starts with the brand (e.g. roland_vad716), use it directly.
            # Otherwise prepend brand.
            if safe_id.startswith(normalized_brand):
                new_filename = f"{safe_id}.jpg"
            else:
                new_filename = f"{brand_name}_{safe_id}.jpg"
                
            # 2. Calculate the "Old" (Messy) filename
            # The messed up logic was likely f"{brand_name}_{safe_id}.jpg"
            # BUT: If safe_id ALREADY had brand, this created "brand_brand_id.jpg"
            
            old_filename = f"{brand_name}_{safe_id}.jpg"
            
            # Paths
            old_path = THUMBNAILS_DIR / old_filename
            new_path = THUMBNAILS_DIR / new_filename
            
            if brand_name == "roland":
                # DEBUG for Roland
                if p_id == "roland_87_vad716sw":
                    print(f"DEBUG Roland Target:")
                    print(f"  ID: {p_id}")
                    print(f"  SafeID: {safe_id}")
                    print(f"  Starts with {normalized_brand}? {safe_id.startswith(normalized_brand)}")
                    print(f"  Old Filename: {old_filename}")
                    print(f"  New Filename: {new_filename}")
                    print(f"  Old Path Exists? {old_path.exists()}")
                    print(f"  New Path Exists? {new_path.exists()}")

            # 3. Rename File if needed
            # We only rename if old file exists AND it's different from new name
            if old_path.exists() and old_filename != new_filename:
                # If new path exists, we might have a collision or it was already done?
                if not new_path.exists():
                    os.rename(old_path, new_path)
                    print(f"  📝 Renamed: {old_filename} -> {new_filename}")
                    renamed_count += 1
                else:
                    # If new path exists, we assume we can just use it.
                    # But we might want to delete the old one to clean up?
                    pass
            
            # 4. Update Blueprint to point to NEW filename
            new_public_url = f"/data/thumbnails/{new_filename}"
            if p.get("image_url") != new_public_url:
                current_url = p.get("image_url", "")
                if current_url and "/data/thumbnails/" in current_url:
                    # Only update if it looks like a local thumbnail
                    p["image_url"] = new_public_url
                    blueprint_changed = True
        
        if blueprint_changed:
            with open(bp_file, "w") as f:
                json.dump(products, f, indent=2)
            updated_blueprints += 1
            
    print(f"✨ Refinement Complete.")
    print(f"   Files Renamed: {renamed_count}")
    print(f"   Blueprints Updated: {updated_blueprints}")

if __name__ == "__main__":
    refine_skeleton()
