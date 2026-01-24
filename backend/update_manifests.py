import os
import json
from pathlib import Path

def generate_brand_manifest(brand):
    """Generates a manifest.json listing all product IDs in the brand's data folder."""
    base_dir = Path(f"../frontend/public/data/{brand}")
    
    if not base_dir.exists():
        print(f"Directory not found: {base_dir}")
        return

    # Find all product JSON files (excluding manifest.json itself if it exists)
    files = [f.stem for f in base_dir.glob("*.json") if f.name != "manifest.json" and f.name != "index.json"]
    files.sort()

    manifest_path = base_dir / "manifest.json"
    
    with open(manifest_path, "w") as f:
        json.dump({"products": files}, f, indent=2)
    
    print(f"✅ Generated manifest for {brand}: {len(files)} products")
    print(f"   Shape: {files[:3]}...")

if __name__ == "__main__":
    generate_brand_manifest("roland")
