"""
Migrate legacy catalog files to new schema format.

Old schema: { "brand": "...", "brand_full_name": "...", ... }
New schema: { "brand_identity": { "id": "...", "name": "...", ... }, "products": [...] }
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional


def extract_brand_id(filename: str) -> str:
    """Extract brand ID from filename. E.g., 'roland_catalog.json' -> 'roland'"""
    return filename.replace("_catalog.json", "")


def map_old_to_new(data: Dict[str, Any], brand_id: str) -> Dict[str, Any]:
    """
    Convert old schema to new schema.
    Most old files don't have products, so we create an empty array.
    """
    
    # Extract brand info from old schema
    brand_name = data.get("brand_full_name", "")
    if not brand_name:
        brand_name = data.get("brand", "").replace("-", " ").title()
    
    website = data.get("official_site") or data.get("website", "")
    hq = data.get("hq", "Unknown")
    founded = data.get("founded")
    
    # Try to find logo or description
    logo_url = data.get("logo_url", "")
    description = data.get("description", "")
    
    brand_identity = {
        "id": brand_id,
        "name": brand_name,
        "hq": hq,
        "website": website,
        "logo_url": logo_url,
    }
    
    if founded:
        brand_identity["founded"] = founded
    if description:
        brand_identity["description"] = description
    
    # New schema
    return {
        "brand_identity": brand_identity,
        "products": data.get("products", [])  # Empty if not present
    }


def migrate_catalog_file(file_path: Path) -> bool:
    """
    Migrate a single catalog file. Returns True if successful.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"  ❌ Failed to read {file_path.name}: {e}")
        return False

    # Check if already migrated
    if isinstance(data, dict) and "brand_identity" in data:
        print(f"  ✓ {file_path.name} (already migrated)")
        return True
    
    # Skip if it's a list or doesn't have expected old fields
    if isinstance(data, list):
        print(f"  ⚠ {file_path.name} (is a list, skipping)")
        return True
    
    if not isinstance(data, dict):
        print(f"  ❌ {file_path.name} (unexpected format, skipping)")
        return True
    
    # Extract brand ID from filename
    brand_id = extract_brand_id(file_path.name)
    
    # Migrate
    try:
        new_data = map_old_to_new(data, brand_id)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
        
        print(f"  ✓ {file_path.name} -> new schema")
        return True
    except Exception as e:
        print(f"  ❌ {file_path.name} migration failed: {e}")
        return False


def main():
    current_file = Path(__file__).resolve()
    backend_dir = current_file.parents[1]
    catalogs_dir = backend_dir / "data" / "catalogs"
    
    if not catalogs_dir.exists():
        print(f"❌ Catalogs directory not found: {catalogs_dir}")
        sys.exit(1)
    
    print(f"🔄 Migrating catalogs in {catalogs_dir}")
    
    total = 0
    success = 0
    
    for json_file in sorted(catalogs_dir.glob("*.json")):
        total += 1
        if migrate_catalog_file(json_file):
            success += 1
    
    print(f"\n📊 Migration complete: {success}/{total} files migrated")
    sys.exit(0 if success == total else 1)


if __name__ == "__main__":
    main()
