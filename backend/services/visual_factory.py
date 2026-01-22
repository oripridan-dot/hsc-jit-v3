import io
import json
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from rembg import remove  # Background removal AI
import requests

class VisualFactory:
    def __init__(self):
        # Enhanced Configuration for "Perfect Visual Outcome"
        self.thumb_size = (400, 400)  # Larger thumbnails for prominence
        self.detail_max_dim = 2400 
        self.padding = 50  # More padding for breathing room
        
    def normalize_and_enhance(self, image: Image.Image) -> Image.Image:
        """
        Normalize product image for consistent quality and appearance
        """
        # Convert to RGB if needed
        if image.mode != 'RGB':
            if image.mode == 'RGBA':
                # Create white background for transparent images
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[3] if len(image.split()) == 4 else None)
                image = background
            else:
                image = image.convert('RGB')
        
        # Auto-level for consistent brightness
        image = ImageOps.autocontrast(image, cutoff=1)
        
        # Enhance sharpness slightly
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.3)
        
        # Boost color saturation for visual appeal
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.1)
        
        return image 

    def process_product_asset(self, image_url: str, output_path_base: str, force_reprocess: bool = False):
        """
        Creates a 'System Ready' asset set with precise cropping and normalization:
        1. Optimized Thumbnail (Precise Crop, Centered, Normalized)
        2. Inspection Asset (High Res, Enhanced for Detail)
        """
        try:
            # Skip if already processed and not forcing reprocess
            thumb_path = f"{output_path_base}_thumb.webp"
            if not force_reprocess and Path(thumb_path).exists():
                return {
                    "thumbnail_url": thumb_path,
                    "inspection_url": f"{output_path_base}_inspect.webp"
                }
            
            # 1. Fetch original image
            response = requests.get(image_url, stream=True, timeout=10)
            response.raise_for_status()
            original = Image.open(io.BytesIO(response.content))

            # --- TIER 1: UI THUMBNAIL (Precise Auto-Crop & Normalize) ---
            # Remove background for clean floating look
            nobg = remove(original)
            
            # Convert to RGBA if not already
            if nobg.mode != 'RGBA':
                nobg = nobg.convert('RGBA')
            
            # Precise Auto-Crop: Find tight bounding box
            bbox = nobg.getbbox()
            if bbox:
                # Add small margin to bbox for breathing room
                margin = 10
                bbox = (
                    max(0, bbox[0] - margin),
                    max(0, bbox[1] - margin),
                    min(nobg.width, bbox[2] + margin),
                    min(nobg.height, bbox[3] + margin)
                )
                nobg = nobg.crop(bbox)
            
            # Calculate optimal size maintaining aspect ratio
            aspect_ratio = nobg.width / nobg.height
            target_w = self.thumb_size[0] - self.padding
            target_h = self.thumb_size[1] - self.padding
            
            if aspect_ratio > 1:
                # Wider than tall
                new_w = target_w
                new_h = int(target_w / aspect_ratio)
            else:
                # Taller than wide
                new_h = target_h
                new_w = int(target_h * aspect_ratio)
            
            # High-quality resize with antialiasing
            nobg = nobg.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Create canvas with transparent background
            thumb_canvas = Image.new('RGBA', self.thumb_size, (0, 0, 0, 0))
            
            # Center perfectly on canvas
            offset_x = (self.thumb_size[0] - new_w) // 2
            offset_y = (self.thumb_size[1] - new_h) // 2
            thumb_canvas.paste(nobg, (offset_x, offset_y), nobg)
            
            # Apply subtle drop shadow for depth
            # (Optional: can be done in CSS, but baked-in for consistency)
            
            # Save as optimized WebP
            thumb_canvas.save(thumb_path, format="WEBP", quality=92, method=6)

            # --- TIER 2: INSPECTION ASSET (Enhanced Detail) ---
            inspection = self.normalize_and_enhance(original)
            
            # Resize to max dimension while maintaining aspect ratio
            inspection.thumbnail((self.detail_max_dim, self.detail_max_dim), Image.Resampling.LANCZOS)
            
            # Apply unsharp mask for clarity
            inspection = inspection.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
            
            inspect_path = f"{output_path_base}_inspect.webp"
            inspection.save(inspect_path, format="WEBP", quality=95, method=6)

            return {
                "thumbnail_url": thumb_path,
                "inspection_url": inspect_path,
                "dimensions": {
                    "thumb": {"width": new_w, "height": new_h},
                    "original": {"width": original.width, "height": original.height}
                }
            }

        except Exception as e:
            print(f"⚠️ Visual Factory Error for {image_url}: {e}")
            return None
    
    def batch_reprocess_catalog(self, catalog_path: str, output_dir: str, force: bool = False):
        """
        Reprocess all products in a catalog with normalized thumbnails
        """
        with open(catalog_path, 'r') as f:
            catalog = json.load(f)
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        processed_count = 0
        failed_count = 0
        
        products = catalog.get('products', [])
        total = len(products)
        
        print(f"\n🏭 Visual Factory: Processing {total} products...")
        print(f"📁 Output: {output_dir}")
        print(f"🔄 Force reprocess: {force}\n")
        
        for idx, product in enumerate(products, 1):
            product_id = product.get('id', f'product_{idx}')
            image_url = product.get('image_url') or product.get('image')
            
            if not image_url:
                print(f"⏭️  [{idx}/{total}] {product.get('name', 'Unknown')}: No image URL")
                continue
            
            # Handle images object
            if isinstance(product.get('images'), dict):
                image_url = product['images'].get('main') or product['images'].get('thumbnail') or image_url
            elif isinstance(product.get('images'), list) and product['images']:
                image_url = product['images'][0].get('url', image_url)
            
            output_base = output_path / product_id
            
            print(f"🖼️  [{idx}/{total}] {product.get('name', 'Unknown')[:40]}...")
            
            result = self.process_product_asset(str(image_url), str(output_base), force_reprocess=force)
            
            if result:
                # Update product with new paths
                product['thumbnail_processed'] = result['thumbnail_url']
                product['inspection_image'] = result['inspection_url']
                if 'dimensions' in result:
                    product['image_dimensions'] = result['dimensions']
                processed_count += 1
                print(f"   ✅ Generated thumbnail & inspection image")
            else:
                failed_count += 1
                print(f"   ❌ Failed")
        
        # Save updated catalog
        output_catalog_path = output_path / 'catalog_processed.json'
        with open(output_catalog_path, 'w') as f:
            json.dump(catalog, f, indent=2)
        
        print(f"\n✨ Complete!")
        print(f"   ✅ Processed: {processed_count}/{total}")
        print(f"   ❌ Failed: {failed_count}/{total}")
        print(f"   📄 Updated catalog: {output_catalog_path}")
        
        return {
            "processed": processed_count,
            "failed": failed_count,
            "total": total,
            "output_catalog": str(output_catalog_path)
        }
