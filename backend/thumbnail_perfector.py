"""
🎨 THUMBNAIL PERFECTOR - Polish existing images to perfection
=============================================================

Uses existing inspect images and applies:
1. AI Background Removal (rembg)
2. Auto-crop to content
3. Centered placement on white canvas
4. Quality enhancement

This creates the perfect "see then read" experience.
"""

import io
import os
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
from rembg import remove
from dataclasses import dataclass
from typing import Optional

# Configuration
THUMBS_DIR = Path("../frontend/public/data/category_thumbnails")
THUMB_SIZE = (400, 400)
PADDING = 50  # Generous padding for breathing room

@dataclass  
class ThumbnailResult:
    subcategory: str
    success: bool
    old_brightness: float
    new_brightness: float
    message: str


def process_thumbnail(inspect_path: Path, thumb_path: Path) -> ThumbnailResult:
    """
    Process a single thumbnail with AI background removal and normalization
    """
    subcategory = inspect_path.stem.replace("_inspect", "")
    
    try:
        # Load the inspect image
        original = Image.open(inspect_path)
        old_gray = original.convert("L")
        old_brightness = sum(old_gray.getdata()) / len(list(old_gray.getdata()))
        
        print(f"\n🔧 Processing: {subcategory}")
        print(f"   Source: {original.size}, brightness={old_brightness:.0f}")
        
        # Step 1: Remove background using AI
        print("   🤖 Removing background with AI...")
        
        # Convert to bytes for rembg
        img_buffer = io.BytesIO()
        original.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Apply rembg
        nobg_bytes = remove(img_buffer.getvalue())
        nobg = Image.open(io.BytesIO(nobg_bytes)).convert("RGBA")
        
        # Step 2: Auto-crop to content bounding box
        print("   ✂️ Cropping to content...")
        bbox = nobg.getbbox()
        if bbox:
            # Add small margin
            margin = 5
            bbox = (
                max(0, bbox[0] - margin),
                max(0, bbox[1] - margin),
                min(nobg.width, bbox[2] + margin),
                min(nobg.height, bbox[3] + margin)
            )
            nobg = nobg.crop(bbox)
        
        # Step 3: Calculate optimal size (fit within padded area)
        print("   📐 Normalizing size...")
        target_w = THUMB_SIZE[0] - (PADDING * 2)
        target_h = THUMB_SIZE[1] - (PADDING * 2)
        
        # Maintain aspect ratio
        aspect = nobg.width / nobg.height if nobg.height > 0 else 1
        
        if aspect > 1:
            # Wider than tall
            new_w = min(target_w, nobg.width)
            new_h = int(new_w / aspect)
        else:
            # Taller or square
            new_h = min(target_h, nobg.height)
            new_w = int(new_h * aspect)
        
        # Ensure minimum size for visibility
        min_size = 150
        if new_w < min_size and new_h < min_size:
            scale = min_size / min(new_w, new_h)
            new_w = int(new_w * scale)
            new_h = int(new_h * scale)
        
        # High-quality resize
        nobg = nobg.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Step 4: Create white canvas and center product
        print("   🎨 Creating final canvas...")
        canvas = Image.new("RGBA", THUMB_SIZE, (255, 255, 255, 255))
        
        # Center position
        x = (THUMB_SIZE[0] - new_w) // 2
        y = (THUMB_SIZE[1] - new_h) // 2
        
        # Paste with alpha channel
        canvas.paste(nobg, (x, y), nobg)
        
        # Step 5: Convert to RGB and enhance
        print("   ✨ Enhancing quality...")
        final = canvas.convert("RGB")
        
        # Auto-contrast for punch
        final = ImageOps.autocontrast(final, cutoff=0.5)
        
        # Slight sharpening
        enhancer = ImageEnhance.Sharpness(final)
        final = enhancer.enhance(1.15)
        
        # Boost saturation slightly
        enhancer = ImageEnhance.Color(final)
        final = enhancer.enhance(1.05)
        
        # Calculate new brightness
        new_gray = final.convert("L")
        new_brightness = sum(new_gray.getdata()) / len(list(new_gray.getdata()))
        
        # Step 6: Save as high-quality WebP
        final.save(thumb_path, "WEBP", quality=95)
        file_size = thumb_path.stat().st_size
        
        print(f"   ✅ Saved: {thumb_path.name}")
        print(f"   📊 {file_size/1024:.1f}KB, brightness: {old_brightness:.0f} → {new_brightness:.0f}")
        
        return ThumbnailResult(
            subcategory=subcategory,
            success=True,
            old_brightness=old_brightness,
            new_brightness=new_brightness,
            message=f"Processed successfully ({file_size/1024:.1f}KB)"
        )
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return ThumbnailResult(
            subcategory=subcategory,
            success=False,
            old_brightness=0,
            new_brightness=0,
            message=str(e)
        )


def main():
    print("=" * 60)
    print("🎨 THUMBNAIL PERFECTOR")
    print("=" * 60)
    print(f"📁 Directory: {THUMBS_DIR}")
    print(f"📐 Target Size: {THUMB_SIZE}")
    print(f"📏 Padding: {PADDING}px")
    
    results = []
    
    # Find all inspect images
    inspect_files = sorted(THUMBS_DIR.glob("*_inspect.webp"))
    print(f"\n📦 Found {len(inspect_files)} inspect images")
    
    for inspect_path in inspect_files:
        thumb_name = inspect_path.name.replace("_inspect.webp", "_thumb.webp")
        thumb_path = THUMBS_DIR / thumb_name
        
        result = process_thumbnail(inspect_path, thumb_path)
        results.append(result)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    success = [r for r in results if r.success]
    failed = [r for r in results if not r.success]
    
    print(f"\n✅ Successful: {len(success)}/{len(results)}")
    
    if success:
        avg_brightness = sum(r.new_brightness for r in success) / len(success)
        print(f"📈 Average Brightness: {avg_brightness:.1f}/255")
    
    if failed:
        print(f"\n❌ Failed: {len(failed)}")
        for r in failed:
            print(f"   • {r.subcategory}: {r.message}")
    
    print("\n✨ Thumbnails are ready for the UI!")


if __name__ == "__main__":
    main()
