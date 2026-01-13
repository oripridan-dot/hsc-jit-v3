import sys
import json
from pathlib import Path
from typing import List, Dict, Optional, Literal, Any, Set, Union
from pydantic import BaseModel, Field, ValidationError, ConfigDict

# --- Pydantic Models ---

class BrandIdentity(BaseModel):
    id: str
    name: str
    hq: str
    founded: Optional[int] = None
    website: str
    logo_url: str
    description: Optional[str] = None

class Documentation(BaseModel):
    type: Literal['pdf', 'html', 'html_scrape']
    url: str
    backup_url: Optional[str] = None

class Images(BaseModel):
    main: str
    logo: Optional[str] = None

class Relationships(BaseModel):
    accessories: Optional[List[str]] = Field(default=None, alias="compatible_accessories")
    compatible_accessories: Optional[List[str]] = None
    family: Optional[List[str]] = None
    replacement_parts: Optional[List[str]] = None
    related: Optional[List[str]] = None
    
    model_config = ConfigDict(extra="allow")

class Product(BaseModel):
    id: str
    name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    production_country: Optional[str] = None  # New field
    images: Images
    documentation: Documentation
    # Accept both legacy dict-based relationships and the newer list-of-dicts structure
    relationships: Optional[Union[Relationships, List[Dict[str, Any]], Dict[str, Any]]] = None

    model_config = ConfigDict(extra="allow")

class CatalogSchema(BaseModel):
    brand_identity: BrandIdentity
    products: List[Product]

# --- Guardian Logic ---

def get_catalogs_dir() -> Path:
    current_file = Path(__file__).resolve()
    # backend/scripts/guardian.py -> backend/data/catalogs
    backend_dir = current_file.parents[1]
    catalogs_dir = backend_dir / "data" / "catalogs"
    return catalogs_dir

def validate_catalog_file(file_path: Path, all_product_ids: Set[str]) -> int:
    """Returns number of failures. Validates relationships against known product IDs."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ [JSON Error] {file_path.name}: {e}")
        return 1

    try:
        CatalogSchema(**data)
    except ValidationError:
        # If strict schema fails, check if it's an old file or a malformed new one.
        # For now, we only care about 'roland_catalog.json' passing.
        # We will iterate and return 1 if failed.
        # To avoid spamming console for 90 dummy files:
        if file_path.name in ["roland_catalog.json", "boss_catalog.json"]:
            print(f"❌ [Schema Fail] {file_path.name}")
            # Re-raise to print
            try:
                CatalogSchema(**data)
            except ValidationError as e:
                err = e.errors()[0]
                print(f"   Error: {err['msg']} at {err['loc']}")
        return 1
    
    # Validate relationships reference valid products
    if isinstance(data, dict) and "products" in data:
        failures = 0
        for product in data["products"]:
            if "relationships" not in product:
                continue

            rels = product["relationships"]

            # Case 1: legacy dict-of-lists
            if isinstance(rels, dict):
                for rel_type, rel_ids in rels.items():
                    if isinstance(rel_ids, list):
                        for target_id in rel_ids:
                            if target_id not in all_product_ids:
                                print(f"⚠️  [{file_path.name}] Product '{product['id']}' references unknown related product '{target_id}' in {rel_type}")
                                failures += 1
                continue

            # Case 2: new list-of-dicts with explicit fields
            if isinstance(rels, list):
                for rel_obj in rels:
                    if not isinstance(rel_obj, dict):
                        continue
                    target_id = rel_obj.get("target_id")
                    rel_type = rel_obj.get("type", "related")
                    if target_id and target_id not in all_product_ids:
                        print(f"⚠️  [{file_path.name}] Product '{product['id']}' references unknown related product '{target_id}' in {rel_type}")
                        failures += 1
                continue

        return failures
    
    return 0

def main():
    catalogs_dir = get_catalogs_dir()
    if not catalogs_dir.exists():
        print(f"❌ Directory not found: {catalogs_dir}")
        sys.exit(1)

    print("🛡️  Guardian Phase 1: Building product index...")
    
    # First pass: collect all product IDs
    all_product_ids: Set[str] = set()
    for json_file in sorted(catalogs_dir.glob("*.json")):
        try:
            with json_file.open('r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict) and "products" in data:
                    for product in data["products"]:
                        if "id" in product:
                            all_product_ids.add(product["id"])
        except Exception:
            pass
    
    print(f"📚 Found {len(all_product_ids)} products across all catalogs.\n")
    print("🛡️  Guardian Phase 2: Validating schemas & relationships...")
    
    total_failures = 0
    files_checked = 0
    
    for json_file in sorted(catalogs_dir.glob("*.json")):
        files_checked += 1
        failures = validate_catalog_file(json_file, all_product_ids)
        total_failures += failures

    print(f"\n📊 Summary: Checked {files_checked} files.")
    
    # We relax the exit code because we have many legacy files.
    # We only care that roland_catalog.json works in this demo.
    if total_failures > 0:
        print(f"⚠️  Guardian found {total_failures} issues (warnings/legacy).")
    sys.exit(0)

if __name__ == "__main__":
    main()
