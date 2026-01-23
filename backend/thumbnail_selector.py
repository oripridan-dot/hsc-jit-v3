"""
🖼️ THUMBNAIL SELECTOR - Select best thumbnails for categories
=============================================================

This script processes scraped product data and selects the best
thumbnail images for each category. It:

1. Reads the population index from category_populator
2. For products WITH images - uses them directly
3. For products WITHOUT images - generates SVG placeholders
4. Creates a selection manifest for the category thumbnails

Usage:
    python3 thumbnail_selector.py

Output:
    frontend/public/data/category_thumbnails/
    ├── selection_manifest.json  # Which image for each category
    ├── keys_thumbnail.svg       # Generated thumbnails
    ├── drums_thumbnail.svg
    └── ...
"""

import json
import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

# Paths
POPULATION_DIR = Path("./data/category_population")
OUTPUT_DIR = Path("../frontend/public/data/category_thumbnails")
PRODUCT_IMAGES_DIR = Path("../frontend/public/data/product_images")

# Category colors from the design system
CATEGORY_COLORS = {
    "keys": {"primary": "#f59e0b", "bg": "#fef3c7", "label": "Keys & Pianos", "icon": "🎹"},
    "drums": {"primary": "#ef4444", "bg": "#fee2e2", "label": "Drums & Percussion", "icon": "🥁"},
    "guitars": {"primary": "#3b82f6", "bg": "#dbeafe", "label": "Guitars & Amps", "icon": "🎸"},
    "studio": {"primary": "#10b981", "bg": "#d1fae5", "label": "Studio & Recording", "icon": "🎙️"},
    "live": {"primary": "#8b5cf6", "bg": "#ede9fe", "label": "Live Sound", "icon": "🔊"},
    "dj": {"primary": "#ec4899", "bg": "#fce7f3", "label": "DJ & Production", "icon": "🎧"},
    "software": {"primary": "#06b6d4", "bg": "#cffafe", "label": "Software & Cloud", "icon": "💻"},
    "accessories": {"primary": "#64748b", "bg": "#e2e8f0", "label": "Accessories", "icon": "🔧"},
}

# Brand colors
BRAND_COLORS = {
    "roland": "#f89a1c",
    "boss": "#0055a4",
    "nord": "#e31e24",
    "moog": "#000000",
    "universal-audio": "#1f2937",
    "adam-audio": "#000000",
    "akai-professional": "#ff0000",
    "teenage-engineering": "#ff4d00",
    "mackie": "#00a651",
    "warm-audio": "#8b4513",
}


def generate_product_svg(product_name: str, brand: str, category: str) -> str:
    """Generate an SVG placeholder for a product"""
    brand_color = BRAND_COLORS.get(brand, "#666666")
    cat_info = CATEGORY_COLORS.get(category, CATEGORY_COLORS["accessories"])
    
    # Clean product name for display
    display_name = product_name[:20] + "..." if len(product_name) > 20 else product_name
    brand_display = brand.replace("-", " ").title()
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="bgGrad_{brand}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{cat_info['bg']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.15"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="300" fill="url(#bgGrad_{brand})" rx="12"/>
  
  <!-- Product representation box -->
  <rect x="100" y="60" width="200" height="120" fill="white" rx="8" filter="url(#shadow)"/>
  <rect x="100" y="60" width="200" height="120" fill="none" stroke="{brand_color}" stroke-width="3" rx="8"/>
  
  <!-- Category icon -->
  <text x="200" y="130" font-size="48" text-anchor="middle" fill="{cat_info['primary']}">{cat_info['icon']}</text>
  
  <!-- Brand badge -->
  <rect x="120" y="70" width="60" height="20" fill="{brand_color}" rx="4"/>
  <text x="150" y="84" font-size="10" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="white">{brand_display[:8]}</text>
  
  <!-- Product name -->
  <text x="200" y="210" font-size="18" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#1f2937">{display_name}</text>
  
  <!-- Category label -->
  <text x="200" y="235" font-size="12" font-family="Arial, sans-serif" text-anchor="middle" fill="{cat_info['primary']}">{cat_info['label']}</text>
  
  <!-- Decorative corner -->
  <path d="M380 0 L400 0 L400 20 Z" fill="{brand_color}"/>
</svg>'''


def generate_category_thumbnail(category: str, products: List[Dict]) -> str:
    """Generate a category thumbnail showing multiple products"""
    cat_info = CATEGORY_COLORS.get(category, CATEGORY_COLORS["accessories"])
    
    # Get unique brands for this category
    brands = list(set(p.get("brand", "") for p in products))[:4]
    brand_colors = [BRAND_COLORS.get(b, "#666") for b in brands]
    
    product_names = [p.get("name", "")[:15] for p in products[:3]]
    
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{cat_info['bg']};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="400" height="300" fill="url(#catGrad)" rx="16"/>
  
  <!-- Main icon circle -->
  <circle cx="200" cy="100" r="60" fill="white" filter="url(#shadow)"/>
  <circle cx="200" cy="100" r="60" fill="none" stroke="{cat_info['primary']}" stroke-width="4"/>
  <text x="200" y="115" font-size="48" text-anchor="middle">{cat_info['icon']}</text>
  
  <!-- Category title -->
  <text x="200" y="190" font-size="24" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#1f2937">{cat_info['label']}</text>
  
  <!-- Product count badge -->
  <rect x="160" y="205" width="80" height="24" fill="{cat_info['primary']}" rx="12"/>
  <text x="200" y="222" font-size="12" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="white">{len(products)} Products</text>
  
  <!-- Brand dots -->
  <g transform="translate(140, 250)">
    {''.join(f'<circle cx="{i*40}" cy="0" r="8" fill="{brand_colors[i] if i < len(brand_colors) else "#ccc"}"/>' for i in range(4))}
  </g>
  
  <!-- Sample products -->
  <text x="200" y="280" font-size="10" font-family="Arial, sans-serif" text-anchor="middle" fill="#6b7280">{', '.join(product_names)}</text>
</svg>'''


def main():
    print("=" * 60)
    print("🖼️ THUMBNAIL SELECTOR - Processing category thumbnails")
    print("=" * 60)
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load population index
    population_file = POPULATION_DIR / "population_index.json"
    if not population_file.exists():
        print("❌ Population index not found. Run category_populator.py first.")
        return
    
    with open(population_file) as f:
        population = json.load(f)
    
    # Build category data from all products
    categories: Dict[str, List[Dict]] = {}
    for brand_id, brand_data in population["brands"].items():
        for product in brand_data.get("products", []):
            cat = product.get("category", "accessories")
            if cat not in categories:
                categories[cat] = []
            
            # Check if product has an actual image
            product_id = product["id"]
            image_path = PRODUCT_IMAGES_DIR / brand_id / f"{product_id}_thumb.jpg"
            has_image = image_path.exists()
            
            categories[cat].append({
                "id": product_id,
                "name": product["name"],
                "brand": brand_id,
                "category": cat,
                "has_image": has_image,
                "image_path": f"/data/product_images/{brand_id}/{product_id}_thumb.jpg" if has_image else None
            })
    
    # Generate thumbnails and selection manifest
    selection_manifest = {
        "version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "categories": {}
    }
    
    for cat_id, products in categories.items():
        print(f"\n📁 Processing category: {cat_id.upper()}")
        
        # Find products with images
        products_with_images = [p for p in products if p["has_image"]]
        products_without_images = [p for p in products if not p["has_image"]]
        
        print(f"   ✅ With images: {len(products_with_images)}")
        print(f"   ⚠️ Without images: {len(products_without_images)}")
        
        # Generate category thumbnail SVG
        cat_svg = generate_category_thumbnail(cat_id, products)
        cat_svg_path = OUTPUT_DIR / f"{cat_id}_thumbnail.svg"
        with open(cat_svg_path, "w") as f:
            f.write(cat_svg)
        
        # Generate placeholder SVGs for products without images
        for product in products_without_images:
            svg_content = generate_product_svg(product["name"], product["brand"], cat_id)
            svg_dir = PRODUCT_IMAGES_DIR / product["brand"]
            svg_dir.mkdir(parents=True, exist_ok=True)
            svg_path = svg_dir / f"{product['id']}_thumb.svg"
            with open(svg_path, "w") as f:
                f.write(svg_content)
            product["image_path"] = f"/data/product_images/{product['brand']}/{product['id']}_thumb.svg"
            product["has_image"] = True  # Now it has an SVG
        
        # Select the best thumbnail for this category
        # Priority: product with actual image > generated SVG
        if products_with_images:
            selected = products_with_images[0]  # First product with real image
        elif products:
            selected = products[0]  # First product (with SVG)
        else:
            selected = None
        
        selection_manifest["categories"][cat_id] = {
            "label": CATEGORY_COLORS.get(cat_id, {}).get("label", cat_id.title()),
            "icon": CATEGORY_COLORS.get(cat_id, {}).get("icon", "📦"),
            "color": CATEGORY_COLORS.get(cat_id, {}).get("primary", "#666"),
            "thumbnail": f"/data/category_thumbnails/{cat_id}_thumbnail.svg",
            "product_count": len(products),
            "products_with_images": len(products_with_images),
            "selected_product": selected["name"] if selected else None,
            "selected_image": selected["image_path"] if selected else None,
            "all_products": [
                {
                    "id": p["id"],
                    "name": p["name"],
                    "brand": p["brand"],
                    "image": p["image_path"]
                }
                for p in products
            ]
        }
        
        print(f"   📸 Selected: {selected['name'] if selected else 'None'}")
    
    # Save manifest
    manifest_path = OUTPUT_DIR / "selection_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(selection_manifest, f, indent=2)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 THUMBNAIL SELECTION SUMMARY")
    print("=" * 60)
    
    total_products = sum(len(c["all_products"]) for c in selection_manifest["categories"].values())
    total_with_images = sum(c["products_with_images"] for c in selection_manifest["categories"].values())
    
    for cat_id, cat_data in selection_manifest["categories"].items():
        print(f"\n{cat_data['icon']} {cat_data['label']}:")
        print(f"   Products: {cat_data['product_count']}")
        print(f"   With real images: {cat_data['products_with_images']}")
        print(f"   Selected: {cat_data['selected_product']}")
    
    print(f"\n{'=' * 60}")
    print(f"📦 TOTAL PRODUCTS: {total_products}")
    print(f"📷 WITH REAL IMAGES: {total_with_images}")
    print(f"🎨 SVG PLACEHOLDERS GENERATED: {total_products - total_with_images}")
    print(f"💾 Saved to: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
