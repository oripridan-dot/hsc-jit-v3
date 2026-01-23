#!/usr/bin/env python3
"""
Generate placeholder product images for all brands.
Creates simple colored SVG thumbnails with brand initial.
"""

import json
from pathlib import Path
import hashlib

# Color palette for each brand
BRAND_COLORS = {
    "roland": "#f89a1c",      # Orange
    "boss": "#ff0000",        # Red
    "nord": "#cc0000",        # Nord red
    "moog": "#4a9c4a",        # Moog green
    "adam-audio": "#00a8e8",  # Blue
    "mackie": "#00ff00",      # Mackie green
    "akai-professional": "#ff4444",  # Red
    "universal-audio": "#d4af37",    # Gold
    "warm-audio": "#ff6b35",  # Warm orange
    "teenage-engineering": "#ffffff"  # White
}

def generate_svg_thumbnail(product_name: str, brand: str, subcategory: str = "") -> str:
    """Generate an SVG placeholder with product name initial and brand color."""
    color = BRAND_COLORS.get(brand, "#6b7280")
    
    # Get initials (first 2 chars of first word)
    initial = product_name[:2].upper() if product_name else "??"
    
    # Create a hash-based secondary color for variety
    hash_val = int(hashlib.md5(product_name.encode()).hexdigest()[:6], 16)
    hue_shift = (hash_val % 60) - 30  # Shift hue slightly
    
    # Darker background based on brand color
    bg_color = "#1f2937"  # Dark slate
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="grad-{hash_val}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{bg_color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f1419;stop-opacity:1" />
    </linearGradient>
    <filter id="glow-{hash_val}">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="256" height="256" fill="url(#grad-{hash_val})" rx="8"/>
  
  <!-- Product icon circle -->
  <circle cx="128" cy="100" r="60" fill="{color}" opacity="0.15"/>
  <circle cx="128" cy="100" r="50" fill="{color}" opacity="0.25"/>
  <circle cx="128" cy="100" r="40" fill="{color}" opacity="0.4"/>
  
  <!-- Initial -->
  <text x="128" y="115" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="36" font-weight="bold" 
        fill="{color}" text-anchor="middle" 
        filter="url(#glow-{hash_val})">{initial}</text>
  
  <!-- Product name -->
  <text x="128" y="190" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="14" font-weight="600" 
        fill="white" text-anchor="middle" 
        opacity="0.9">{product_name[:20]}</text>
  
  <!-- Subcategory -->
  <text x="128" y="210" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="10" 
        fill="#9ca3af" text-anchor="middle">{subcategory[:25]}</text>
  
  <!-- Brand indicator -->
  <rect x="0" y="248" width="256" height="8" fill="{color}" opacity="0.8"/>
</svg>'''
    
    return svg


def main():
    frontend_data = Path(__file__).parent.parent / "frontend" / "public" / "data"
    images_dir = frontend_data / "product_images"
    
    # Find all brand JSON files
    brand_files = [f for f in frontend_data.glob("*.json") 
                   if f.name not in ["index.json", "taxonomy.json"]]
    
    total_images = 0
    
    for brand_file in brand_files:
        with open(brand_file) as f:
            data = json.load(f)
        
        brand_id = data.get("brand_identity", {}).get("id", brand_file.stem)
        products = data.get("products", [])
        
        # Create brand image directory
        brand_images = images_dir / brand_id
        brand_images.mkdir(parents=True, exist_ok=True)
        
        print(f"\n📁 {brand_id}: {len(products)} products")
        
        for product in products:
            product_id = product.get("id", "unknown")
            name = product.get("name", "Unknown")
            subcategory = product.get("subcategory", "")
            
            # Generate thumbnail SVG
            svg_content = generate_svg_thumbnail(name, brand_id, subcategory)
            
            # Write thumbnail
            thumb_path = brand_images / f"{product_id}_thumb.webp"
            # For now, save as SVG since we can't easily create webp
            svg_path = brand_images / f"{product_id}_thumb.svg"
            with open(svg_path, "w") as f:
                f.write(svg_content)
            
            total_images += 1
        
        print(f"   ✅ Created {len(products)} placeholder images")
    
    print(f"\n🎉 Total: {total_images} placeholder images generated")
    print(f"   Location: {images_dir}")
    
    # Update product JSONs to use .svg extension
    print("\n🔄 Updating product image URLs...")
    
    for brand_file in brand_files:
        with open(brand_file) as f:
            data = json.load(f)
        
        brand_id = data.get("brand_identity", {}).get("id", brand_file.stem)
        products = data.get("products", [])
        
        for product in products:
            product_id = product.get("id", "unknown")
            base_path = f"/data/product_images/{brand_id}/{product_id}"
            
            product["image_url"] = f"{base_path}_thumb.svg"
            product["images"] = {
                "main": f"{base_path}_thumb.svg",
                "thumbnail": f"{base_path}_thumb.svg",
                "high_res": f"{base_path}_thumb.svg",
                "original": f"{base_path}_thumb.svg"
            }
        
        with open(brand_file, "w") as f:
            json.dump(data, f, indent=2)
        
        print(f"   ✅ Updated {brand_id}.json")
    
    print("\n✅ All done! Product images now point to SVG placeholders.")


if __name__ == "__main__":
    main()
