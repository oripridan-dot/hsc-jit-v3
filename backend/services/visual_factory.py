import io
from PIL import Image, ImageEnhance, ImageFilter
from rembg import remove  # Background removal AI
import requests

class VisualFactory:
    def __init__(self):
        # Configuration for "Perfect Visual Outcome"
        self.thumb_size = (300, 300)
        self.detail_max_dim = 2400 

    def process_product_asset(self, image_url: str, output_path_base: str):
        """
        Creates a 'System Ready' asset set:
        1. Optimized Thumbnail (No BG, Centered, Contrast Boosted)
        2. Inspection Asset (High Res, Sharpened for Silk Print/LCD reading)
        """
        try:
            # 1. Fetch
            response = requests.get(image_url, stream=True)
            response.raise_for_status()
            original = Image.open(io.BytesIO(response.content))

            # --- TIER 1: UI THUMBNAIL (Auto-Crop & Clean) ---
            # Remove background for that "floating" modern look
            nobg = remove(original)
            
            # Auto-Crop: Find the bounding box of the actual object
            bbox = nobg.getbbox()
            if bbox:
                nobg = nobg.crop(bbox)
            
            # Center in a square canvas (for the Tier Bar)
            thumb_canvas = Image.new('RGBA', self.thumb_size, (0, 0, 0, 0))
            
            # Smart Resize to fit
            nobg.thumbnail((self.thumb_size[0] - 40, self.thumb_size[1] - 40))
            
            # Paste centered
            offset = ((self.thumb_size[0] - nobg.width) // 2, (self.thumb_size[1] - nobg.height) // 2)
            thumb_canvas.paste(nobg, offset, nobg)
            
            # Save WebP (Low Memory, High Quality)
            thumb_path = f"{output_path_base}_thumb.webp"
            thumb_canvas.save(thumb_path, format="WEBP", quality=90)

            # --- TIER 2: INSPECTION ASSET (Visual Enhancement) ---
            # Prepare for "Deep Zoom"
            inspection = original.convert("RGB")
            
            # Visual Enhancement 1: Contrast Stretch (make LCDs pop)
            enhancer = ImageEnhance.Contrast(inspection)
            inspection = enhancer.enhance(1.2)
            
            # Visual Enhancement 2: Unsharp Mask (clarify text on silk prints)
            inspection = inspection.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
            
            inspect_path = f"{output_path_base}_inspect.webp"
            inspection.save(inspect_path, format="WEBP", quality=95)

            return {
                "thumbnail_url": thumb_path,
                "inspection_url": inspect_path
            }

        except Exception as e:
            print(f"Visual Factory Error for {image_url}: {e}")
            return None
