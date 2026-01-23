"""
🔧 FIX THUMBNAILS - Replace dark thumbnails with visible ones
=============================================================

The _thumb.webp files are dark placeholders with low brightness.
The _inspect.webp files have actual product imagery.

This script:
1. Uses _inspect.webp images and resizes to 400x400 thumbnails
2. Adds a light background to make products visible
3. Falls back to scraped product images where available
"""

from PIL import Image
import os
from pathlib import Path

CATEGORY_THUMBS_DIR = Path("../frontend/public/data/category_thumbnails")
PRODUCT_IMAGES_DIR = Path("../frontend/public/data/product_images")

# Target size for thumbnails
THUMB_SIZE = (400, 400)

# Background color (light gray for visibility)
BG_COLOR = (245, 245, 245, 255)  # Near white


def create_thumbnail_from_inspect(inspect_path: Path, thumb_path: Path):
    """Create a proper thumbnail from an inspect image"""
    try:
        img = Image.open(inspect_path)
        
        # Create a new white background image
        new_img = Image.new("RGBA", THUMB_SIZE, BG_COLOR)
        
        # Calculate scaling to fit the product in the center
        img_ratio = img.width / img.height
        target_ratio = THUMB_SIZE[0] / THUMB_SIZE[1]
        
        if img_ratio > target_ratio:
            # Image is wider - fit by width
            new_width = int(THUMB_SIZE[0] * 0.9)  # 90% of width for padding
            new_height = int(new_width / img_ratio)
        else:
            # Image is taller - fit by height
            new_height = int(THUMB_SIZE[1] * 0.9)
            new_width = int(new_height * img_ratio)
        
        # Resize the product image
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        img_resized = img.resize((new_width, new_height), Image.LANCZOS)
        
        # Center it on the background
        x = (THUMB_SIZE[0] - new_width) // 2
        y = (THUMB_SIZE[1] - new_height) // 2
        
        new_img.paste(img_resized, (x, y), img_resized if img_resized.mode == "RGBA" else None)
        
        # Save as WebP
        new_img.save(thumb_path, "WEBP", quality=90)
        return True
    except Exception as e:
        print(f"  ❌ Error processing {inspect_path}: {e}")
        return False


def main():
    print("=" * 60)
    print("🔧 FIX THUMBNAILS - Creating visible category thumbnails")
    print("=" * 60)
    
    fixed_count = 0
    failed_count = 0
    
    # Find all _inspect.webp files and create corresponding _thumb.webp
    for inspect_file in CATEGORY_THUMBS_DIR.glob("*_inspect.webp"):
        thumb_name = inspect_file.name.replace("_inspect.webp", "_thumb.webp")
        thumb_path = CATEGORY_THUMBS_DIR / thumb_name
        
        print(f"\n📸 Processing: {thumb_name}")
        
        # Check current thumb brightness
        if thumb_path.exists():
            try:
                current = Image.open(thumb_path)
                current_gray = current.convert("L")
                avg_brightness = sum(current_gray.getdata()) / len(list(current_gray.getdata()))
                print(f"   Current brightness: {avg_brightness:.1f}")
                
                if avg_brightness > 100:
                    print(f"   ✅ Already bright enough, skipping")
                    continue
            except:
                pass
        
        # Create new thumbnail from inspect
        if create_thumbnail_from_inspect(inspect_file, thumb_path):
            # Verify new brightness
            new_img = Image.open(thumb_path)
            new_gray = new_img.convert("L")
            new_brightness = sum(new_gray.getdata()) / len(list(new_gray.getdata()))
            print(f"   ✅ New brightness: {new_brightness:.1f}")
            fixed_count += 1
        else:
            failed_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Fixed: {fixed_count} thumbnails")
    print(f"❌ Failed: {failed_count} thumbnails")
    print("=" * 60)


if __name__ == "__main__":
    main()
