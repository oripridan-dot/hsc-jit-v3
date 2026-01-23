#!/usr/bin/env python3
"""
Generate subcategory thumbnail images for the Galaxy Dashboard.
Creates SVG thumbnails for each subcategory defined in universalCategories.ts
"""

import json
from pathlib import Path
import hashlib

# Subcategory definitions matching universalCategories.ts
SUBCATEGORIES = {
    "keys": [
        {"id": "synths", "label": "Synthesizers", "icon": "🎛️", "color": "#f59e0b"},
        {"id": "stage-pianos", "label": "Stage Pianos", "icon": "🎹", "color": "#f59e0b"},
        {"id": "controllers", "label": "MIDI Controllers", "icon": "🎚️", "color": "#f59e0b"},
        {"id": "arrangers", "label": "Arrangers", "icon": "🎼", "color": "#f59e0b"},
        {"id": "organs", "label": "Organs", "icon": "⛪", "color": "#f59e0b"},
        {"id": "workstations", "label": "Workstations", "icon": "🖥️", "color": "#f59e0b"},
    ],
    "drums": [
        {"id": "electronic-drums", "label": "Electronic Drum Kits", "icon": "🥁", "color": "#ef4444"},
        {"id": "acoustic-drums", "label": "Acoustic Drums", "icon": "🪘", "color": "#ef4444"},
        {"id": "cymbals", "label": "Cymbals", "icon": "🔔", "color": "#ef4444"},
        {"id": "percussion", "label": "Percussion", "icon": "🎵", "color": "#ef4444"},
        {"id": "drum-machines", "label": "Drum Machines", "icon": "⚙️", "color": "#ef4444"},
        {"id": "pads", "label": "Drum Pads", "icon": "🔲", "color": "#ef4444"},
    ],
    "guitars": [
        {"id": "electric-guitars", "label": "Electric Guitars", "icon": "🎸", "color": "#a855f7"},
        {"id": "bass-guitars", "label": "Bass Guitars", "icon": "🎸", "color": "#a855f7"},
        {"id": "amplifiers", "label": "Amplifiers", "icon": "🔊", "color": "#a855f7"},
        {"id": "effects-pedals", "label": "Effects Pedals", "icon": "🦶", "color": "#a855f7"},
        {"id": "multi-effects", "label": "Multi-Effects", "icon": "🎛️", "color": "#a855f7"},
        {"id": "accessories", "label": "Accessories", "icon": "🔧", "color": "#a855f7"},
    ],
    "studio": [
        {"id": "audio-interfaces", "label": "Audio Interfaces", "icon": "🔌", "color": "#06b6d4"},
        {"id": "studio-monitors", "label": "Studio Monitors", "icon": "🔈", "color": "#06b6d4"},
        {"id": "microphones", "label": "Microphones", "icon": "🎙️", "color": "#06b6d4"},
        {"id": "outboard-gear", "label": "Outboard Gear", "icon": "🎚️", "color": "#06b6d4"},
        {"id": "preamps", "label": "Preamps", "icon": "📻", "color": "#06b6d4"},
        {"id": "software", "label": "Software", "icon": "💿", "color": "#06b6d4"},
    ],
    "live": [
        {"id": "pa-speakers", "label": "PA Speakers", "icon": "🔊", "color": "#22c55e"},
        {"id": "mixers", "label": "Mixers", "icon": "🎚️", "color": "#22c55e"},
        {"id": "powered-mixers", "label": "Powered Mixers", "icon": "⚡", "color": "#22c55e"},
        {"id": "wireless-systems", "label": "Wireless Systems", "icon": "📡", "color": "#22c55e"},
        {"id": "in-ear-monitoring", "label": "In-Ear Monitoring", "icon": "🎧", "color": "#22c55e"},
        {"id": "stage-boxes", "label": "Stage Boxes", "icon": "📦", "color": "#22c55e"},
    ],
    "dj": [
        {"id": "dj-controllers", "label": "DJ Controllers", "icon": "🎧", "color": "#ec4899"},
        {"id": "grooveboxes", "label": "Grooveboxes", "icon": "🎹", "color": "#ec4899"},
        {"id": "samplers", "label": "Samplers", "icon": "🔊", "color": "#ec4899"},
        {"id": "dj-headphones", "label": "DJ Headphones", "icon": "🎧", "color": "#ec4899"},
        {"id": "production", "label": "Production", "icon": "🎛️", "color": "#ec4899"},
        {"id": "accessories", "label": "Accessories", "icon": "🔧", "color": "#ec4899"},
    ],
}


def generate_subcategory_svg(subcat: dict, category_id: str) -> str:
    """Generate an SVG thumbnail for a subcategory."""
    label = subcat["label"]
    icon = subcat.get("icon", "🎵")
    color = subcat.get("color", "#6b7280")
    
    # Create a hash-based variation
    hash_val = int(hashlib.md5(label.encode()).hexdigest()[:6], 16)
    
    # Darker background 
    bg_color = "#1f2937"
    
    # Wrap long labels
    words = label.split()
    if len(words) > 2:
        line1 = " ".join(words[:2])
        line2 = " ".join(words[2:])
    else:
        line1 = label
        line2 = ""
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad-{hash_val}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{bg_color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f1419;stop-opacity:1" />
    </linearGradient>
    <filter id="glow-{hash_val}">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="128" height="128" fill="url(#grad-{hash_val})" rx="8"/>
  
  <!-- Icon circle -->
  <circle cx="64" cy="48" r="28" fill="{color}" opacity="0.15"/>
  <circle cx="64" cy="48" r="22" fill="{color}" opacity="0.25"/>
  
  <!-- Icon -->
  <text x="64" y="56" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="28" 
        fill="{color}" text-anchor="middle" 
        filter="url(#glow-{hash_val})">{icon}</text>
  
  <!-- Label line 1 -->
  <text x="64" y="95" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="10" font-weight="600" 
        fill="white" text-anchor="middle" 
        opacity="0.9">{line1[:18]}</text>
  
  <!-- Label line 2 -->
  <text x="64" y="108" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="10" font-weight="600" 
        fill="white" text-anchor="middle" 
        opacity="0.7">{line2[:18]}</text>
  
  <!-- Category indicator -->
  <rect x="0" y="122" width="128" height="6" fill="{color}" opacity="0.6" rx="0 0 8 8"/>
</svg>'''
    
    return svg


def main():
    # Output directory
    output_dir = Path(__file__).parent.parent / "frontend" / "public" / "data" / "subcategory_images"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    total = 0
    
    for category_id, subcats in SUBCATEGORIES.items():
        print(f"\n📁 {category_id}:")
        
        for subcat in subcats:
            svg = generate_subcategory_svg(subcat, category_id)
            filename = f"{category_id}-{subcat['id']}.svg"
            filepath = output_dir / filename
            
            with open(filepath, "w") as f:
                f.write(svg)
            
            print(f"   ✅ {filename}")
            total += 1
    
    print(f"\n🎉 Generated {total} subcategory thumbnails")
    print(f"   Location: {output_dir}")
    
    # Now update universalCategories.ts with correct paths
    print("\n📝 Generating updated universalCategories.ts image paths...")
    
    updates = []
    for category_id, subcats in SUBCATEGORIES.items():
        for subcat in subcats:
            old_pattern = f'"/data/product_images/'
            new_path = f'/data/subcategory_images/{category_id}-{subcat["id"]}.svg'
            updates.append({
                "category": category_id,
                "subcategory": subcat["id"],
                "path": new_path
            })
    
    # Write a JSON file with the correct paths for manual updating
    paths_file = output_dir / "_image_paths.json"
    with open(paths_file, "w") as f:
        json.dump(updates, f, indent=2)
    
    print(f"   ✅ Path mappings saved to {paths_file}")
    print("\n✨ Done! Now update universalCategories.ts with the new image paths.")


if __name__ == "__main__":
    main()
