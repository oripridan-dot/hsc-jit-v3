#!/usr/bin/env python3
"""
Seed Catalog Generator

Creates realistic product entries for brands based on their metadata.
This fills the empty catalogs so the system has substantial search content.

Strategy:
1. Read brand_catalogs/ to get brand metadata and discovery URLs
2. Use heuristics + LLM prompts to generate plausible products
3. Output to backend/data/catalogs/ with v3.1 schema

For now, we'll use deterministic product suggestions based on category metadata.
"""

import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
import sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
BACKEND_CATALOGS_DIR = BASE_DIR / "data" / "catalogs"
# Use backend catalogs as the single source of truth for brand metadata
BRAND_CATALOGS_DIR = BACKEND_CATALOGS_DIR


# Product templates by category - used to generate plausible products
CATEGORY_TEMPLATES = {
    "Keyboards": [
        {"name": "{brand} Stage Keyboard 88", "category": "Stage Keyboard", "type": "main"},
        {"name": "{brand} Portable Keyboard", "category": "Portable Keyboard", "type": "main"},
        {"name": "{brand} Controller Keyboard", "category": "Controller Keyboard", "type": "accessory"},
    ],
    "Synthesizers": [
        {"name": "{brand} Analog Synthesizer", "category": "Synthesizer", "type": "main"},
        {"name": "{brand} Digital Synthesizer", "category": "Synthesizer", "type": "main"},
        {"name": "{brand} Synthesis Module", "category": "Synthesizer Module", "type": "main"},
    ],
    "Drum Machines": [
        {"name": "{brand} Drum Machine", "category": "Drum Machine", "type": "main"},
        {"name": "{brand} Drum Sequencer", "category": "Drum Machine", "type": "main"},
        {"name": "{brand} Percussion Pad", "category": "Percussion Pad", "type": "accessory"},
    ],
    "Guitar Effects": [
        {"name": "{brand} Effects Pedal", "category": "Effects Pedal", "type": "main"},
        {"name": "{brand} Effects Processor", "category": "Effects Processor", "type": "main"},
        {"name": "{brand} Amp Simulator", "category": "Amp Simulator", "type": "main"},
    ],
    "Audio Interfaces": [
        {"name": "{brand} Audio Interface 2x2", "category": "Audio Interface", "type": "main"},
        {"name": "{brand} Audio Interface 4x4", "category": "Audio Interface", "type": "main"},
        {"name": "{brand} USB Audio Interface", "category": "Audio Interface", "type": "main"},
    ],
    "Studio Monitors": [
        {"name": "{brand} Studio Monitor 5\"", "category": "Studio Monitor", "type": "main"},
        {"name": "{brand} Studio Monitor 8\"", "category": "Studio Monitor", "type": "main"},
        {"name": "{brand} Nearfield Monitor", "category": "Studio Monitor", "type": "main"},
    ],
    "Microphones": [
        {"name": "{brand} Condenser Microphone", "category": "Microphone", "type": "main"},
        {"name": "{brand} Dynamic Microphone", "category": "Microphone", "type": "main"},
        {"name": "{brand} Ribbon Microphone", "category": "Microphone", "type": "main"},
    ],
    "Guitars": [
        {"name": "{brand} Electric Guitar", "category": "Electric Guitar", "type": "main"},
        {"name": "{brand} Acoustic Guitar", "category": "Acoustic Guitar", "type": "main"},
        {"name": "{brand} Bass Guitar", "category": "Bass Guitar", "type": "main"},
    ],
    "Bass": [
        {"name": "{brand} Bass Amplifier", "category": "Bass Amplifier", "type": "main"},
        {"name": "{brand} Bass Cabinet", "category": "Bass Cabinet", "type": "accessory"},
    ],
    "Drums": [
        {"name": "{brand} Drum Kit 5-Piece", "category": "Drum Kit", "type": "main"},
        {"name": "{brand} Electronic Drum Kit", "category": "Electronic Drum Kit", "type": "main"},
        {"name": "{brand} Snare Drum", "category": "Drum", "type": "main"},
    ],
    "Percussion": [
        {"name": "{brand} Cymbal Pack", "category": "Cymbal", "type": "main"},
        {"name": "{brand} Percussion Pad", "category": "Percussion Pad", "type": "main"},
    ],
    "DJ Equipment": [
        {"name": "{brand} DJ Controller", "category": "DJ Controller", "type": "main"},
        {"name": "{brand} DJ Mixer", "category": "DJ Mixer", "type": "main"},
        {"name": "{brand} Turntable", "category": "Turntable", "type": "main"},
    ],
}


def get_country_for_brand(brand_id: str) -> str:
    """Map known brands to their country of origin."""
    country_map = {
        "roland": "Japan 🇯🇵",
        "nord": "Sweden 🇸🇪",
        "boss": "Japan 🇯🇵",
        "yamaha": "Japan 🇯🇵",
        "korg": "Japan 🇯🇵",
        "moog": "USA 🇺🇸",
        "ableton": "Germany 🇩🇪",
        "native-instruments": "Germany 🇩🇪",
        "berringer": "Germany 🇩🇪",
        "behringer": "Germany 🇩🇪",
        "akai-professional": "Japan 🇯🇵",
        "elektron": "Sweden 🇸🇪",
        "teenage-engineering": "Sweden 🇸🇪",
        "oberheim": "USA 🇺🇸",
        "dave-smith": "USA 🇺🇸",
        "sequential": "USA 🇺🇸",
        "focusrite": "UK 🇬🇧",
        "audient": "UK 🇬🇧",
        "ssl": "UK 🇬🇧",
        "neve": "UK 🇬🇧",
        "adam-audio": "Germany 🇩🇪",
        "neumann": "Germany 🇩🇪",
        "sennheiser": "Germany 🇩🇪",
        "shure": "USA 🇺🇸",
        "blue-microphones": "USA 🇺🇸",
        "rode": "Australia 🇦🇺",
        "zildjian": "USA 🇺🇸",
        "sabian": "Canada 🇨🇦",
        "paiste": "Switzerland 🇨🇭",
        "pearl": "Japan 🇯🇵",
        "ludwig": "USA 🇺🇸",
        "gretsch": "USA 🇺🇸",
        "remo": "USA 🇺🇸",
        "evans": "USA 🇺🇸",
        "fender": "USA 🇺🇸",
        "gibson": "USA 🇺🇸",
        "ibanez": "Japan 🇯🇵",
        "prs": "USA 🇺🇸",
        "taylor": "USA 🇺🇸",
        "martin": "USA 🇺🇸",
        "martin-guitars": "USA 🇺🇸",
        "takamine": "Japan 🇯🇵",
        "daw": "France 🇫🇷",
        "presonus": "USA 🇺🇸",
        "mackie": "USA 🇺🇸",
        "allen-and-heath": "UK 🇬🇧",
        "soundcraft": "UK 🇬🇧",
        "tc-electronic": "Denmark 🇩🇰",
        "line6": "USA 🇺🇸",
    }
    return country_map.get(brand_id.lower(), "Unknown 🌍")


def _slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def generate_product_id(
    brand_id: str,
    product_name: str,
    category: str,
    used_ids: Set[str],
    index: int,
) -> str:
    """Generate a unique, stable product ID from brand + product name + category."""
    base_parts = [brand_id]

    # Derive a slug from the product name; fall back to category/index if needed
    name_slug = _slugify(product_name.replace(brand_id, "").strip())
    if not name_slug:
        name_slug = _slugify(product_name)
    if not name_slug:
        name_slug = f"product-{index}"

    base_parts.append(name_slug)

    category_slug = _slugify(category) if category else ""
    if category_slug:
        base_parts.append(category_slug.split("-")[0])

    base = "-".join(part for part in base_parts if part)

    candidate = base
    suffix = 2
    while candidate in used_ids:
        candidate = f"{base}-{suffix}"
        suffix += 1

    used_ids.add(candidate)
    return candidate


def generate_product(
    brand_id: str,
    brand_name: str,
    template: Dict[str, Any],
    index: int,
    used_ids: Set[str],
) -> Dict[str, Any]:
    """Generate a product entry from a template."""
    name = template["name"].format(brand=brand_name)
    product_id = generate_product_id(brand_id, name, template.get("category", ""), used_ids, index)
    country = get_country_for_brand(brand_id)
    
    return {
        "id": product_id,
        "name": name,
        "brand": brand_id,
        "category": template["category"],
        "production_country": country,
        "images": {
            "main": f"/static/assets/products/{product_id}.webp",
            "thumbnail": f"/static/assets/products/{product_id}.webp",
        },
        "documentation": {
            "type": "pdf",
            "url": f"https://example.com/docs/{product_id}.pdf",
        },
        "relationships": [],
    }


def load_brand_catalog(brand_catalog_path: Path) -> Optional[Dict[str, Any]]:
    """Load metadata from brand_catalogs/."""
    try:
        return json.loads(brand_catalog_path.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning(f"Failed to load {brand_catalog_path.name}: {e}")
        return None


def get_categories_for_brand(brand_meta: Dict[str, Any]) -> List[str]:
    """Extract product categories from brand metadata."""
    categories = brand_meta.get("categories", [])
    if categories:
        return categories
    
    # Infer from brand name or URLs
    brand_name = (
        (brand_meta.get("brand_full_name") or "")
        or (isinstance(brand_meta.get("brand_identity"), dict) and brand_meta["brand_identity"].get("name") or "")
    ).lower()
    
    # Simple heuristics
    if "guitar" in brand_name or "fender" in brand_name:
        return ["Guitars"]
    if "drum" in brand_name or "pearl" in brand_name:
        return ["Drums", "Percussion"]
    if "keyboard" in brand_name or "nord" in brand_name:
        return ["Keyboards", "Synthesizers"]
    if "audio" in brand_name or "interface" in brand_name:
        return ["Audio Interfaces"]
    if "monitor" in brand_name or "speaker" in brand_name:
        return ["Studio Monitors"]
    
    # Default: offer diverse product types
    return ["Synthesizers", "Keyboards", "Audio Equipment"]


def seed_brand_catalog(brand_id: str) -> bool:
    """Generate products for a single brand."""
    brand_catalog_path = BRAND_CATALOGS_DIR / f"{brand_id}_catalog.json"
    backend_catalog_path = BACKEND_CATALOGS_DIR / f"{brand_id}_catalog.json"
    
    # Load existing backend catalog
    try:
        backend_catalog = json.loads(backend_catalog_path.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning(f"Failed to load backend catalog {backend_catalog_path.name}: {e}")
        return False

    existing_products = backend_catalog.get("products") or []
    existing_ids = [p.get("id") for p in existing_products if isinstance(p, dict) and p.get("id")]
    has_duplicates = len(existing_ids) != len(set(existing_ids))

    # Skip if already populated and clean
    if existing_products and not has_duplicates:
        logger.info(f"  ✓ {brand_id}: already has {len(existing_products)} products")
        return True

    if has_duplicates:
        logger.info(f"  ↻ {brand_id}: regenerating to fix duplicate product IDs")
    else:
        logger.info(f"  ↻ {brand_id}: generating products (empty catalog)")
    
    # Load brand metadata
    brand_meta = load_brand_catalog(brand_catalog_path)
    if not brand_meta:
        return False
    
    brand_name = (
        brand_meta.get("brand_full_name")
        or (isinstance(brand_meta.get("brand_identity"), dict) and brand_meta["brand_identity"].get("name"))
        or brand_id.replace("-", " ").title()
    )
    categories = get_categories_for_brand(brand_meta)
    
    # Generate products
    products = []
    product_index = 1
    used_ids: Set[str] = set()
    
    for category in categories[:2]:  # Limit to 2 categories per brand
        templates = CATEGORY_TEMPLATES.get(category, [])
        for template in templates[:2]:  # Limit to 2 products per category
            product = generate_product(brand_id, brand_name, template, product_index, used_ids)
            products.append(product)
            product_index += 1
    
    if products:
        backend_catalog["products"] = products
        try:
            backend_catalog_path.write_text(
                json.dumps(backend_catalog, indent=2, ensure_ascii=False),
                encoding="utf-8"
            )
            logger.info(f"  ✓ {brand_id}: seeded with {len(products)} products")
            return True
        except Exception as e:
            logger.error(f"  ❌ {brand_id}: failed to write catalog: {e}")
            return False
    else:
        logger.warning(f"  ⚠ {brand_id}: no products generated")
        return False


def main():
    """Seed all empty catalogs."""
    logger.info("🌱 Seeding empty brand catalogs...")
    
    if not BRAND_CATALOGS_DIR.exists():
        logger.error(f"Brand catalogs directory not found: {BRAND_CATALOGS_DIR}")
        sys.exit(1)
    
    if not BACKEND_CATALOGS_DIR.exists():
        logger.error(f"Backend catalogs directory not found: {BACKEND_CATALOGS_DIR}")
        sys.exit(1)
    
    # Get list of brand IDs
    brand_ids = set()
    for brand_catalog in sorted(BRAND_CATALOGS_DIR.glob("*_catalog.json")):
        brand_id = brand_catalog.name.replace("_catalog.json", "")
        brand_ids.add(brand_id)
    
    logger.info(f"Found {len(brand_ids)} brands to process")
    
    success = 0
    for brand_id in sorted(brand_ids):
        if seed_brand_catalog(brand_id):
            success += 1
    
    logger.info(f"\n✅ Seeding complete: {success}/{len(brand_ids)} brands seeded")
    
    # Verify
    from app.services.catalog import CatalogService
    catalog = CatalogService()
    logger.info(f"📊 System now has {len(catalog.products)} products across {len(catalog.brands)} brands")


if __name__ == "__main__":
    main()
