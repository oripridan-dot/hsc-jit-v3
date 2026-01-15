"""
Image Optimization Service
Compresses images on storage and serves optimized versions on demand
"""

import io
import logging
from pathlib import Path
from typing import Optional, Literal
from PIL import Image
import hashlib

logger = logging.getLogger(__name__)


class ImageOptimizer:
    """Handles image compression and optimization"""

    def __init__(self, assets_dir: str = "app/static/assets"):
        self.assets_dir = Path(assets_dir)
        self.cache_dir = self.assets_dir / "cache"
        self.cache_dir.mkdir(exist_ok=True)

        # Compression presets
        self.presets = {
            "thumbnail": {"max_width": 400, "quality": 80},
            "medium": {"max_width": 800, "quality": 85},
            "large": {"max_width": 1600, "quality": 90},
            "original": {"max_width": None, "quality": 95}
        }

    def get_cache_key(self, image_path: str, preset: str) -> str:
        """Generate cache key for compressed image"""
        path_hash = hashlib.md5(image_path.encode()).hexdigest()[:8]
        return f"{path_hash}_{preset}.webp"

    async def compress_image(
        self,
        image_path: Path,
        preset: Literal["thumbnail", "medium", "large", "original"] = "medium",
        force: bool = False
    ) -> Optional[bytes]:
        """
        Compress an image using the specified preset

        Args:
            image_path: Path to the source image
            preset: Compression preset to use
            force: Force recompression even if cached

        Returns:
            Compressed image bytes or None if failed
        """
        try:
            if not image_path.exists():
                logger.warning(f"Image not found: {image_path}")
                return None

            # Skip SVG files - serve them as-is
            if image_path.suffix.lower() == '.svg':
                logger.debug(f"Serving SVG as-is: {image_path}")
                return image_path.read_bytes()

            # Check cache first
            cache_key = self.get_cache_key(str(image_path), preset)
            cache_path = self.cache_dir / cache_key

            if cache_path.exists() and not force:
                logger.debug(f"Serving from cache: {cache_key}")
                return cache_path.read_bytes()

            # Load and process image
            config = self.presets[preset]
            img = Image.open(image_path)

            # Convert to RGB if needed (for JPEG/WebP compatibility)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create white background for transparency
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()
                                 [-1] if 'A' in img.mode else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Resize if needed
            if config["max_width"] and img.width > config["max_width"]:
                ratio = config["max_width"] / img.width
                new_height = int(img.height * ratio)
                img = img.resize(
                    (config["max_width"], new_height), Image.Resampling.LANCZOS)
                logger.info(
                    f"Resized {image_path.name} to {config['max_width']}x{new_height}")

            # Compress to WebP
            buffer = io.BytesIO()
            img.save(
                buffer,
                format='WEBP',
                quality=config["quality"],
                method=6  # Best compression
            )
            compressed_bytes = buffer.getvalue()

            # Cache the result
            cache_path.write_bytes(compressed_bytes)

            original_size = image_path.stat().st_size
            compressed_size = len(compressed_bytes)
            reduction = (1 - compressed_size / original_size) * 100

            logger.info(
                f"Compressed {image_path.name}: "
                f"{original_size / 1024:.1f}KB → {compressed_size / 1024:.1f}KB "
                f"({reduction:.1f}% reduction)"
            )

            return compressed_bytes

        except Exception as e:
            logger.error(f"Failed to compress {image_path}: {e}")
            return None

    async def batch_compress_directory(
        self,
        directory: str = "products",
        preset: Literal["thumbnail", "medium", "large"] = "medium",
        dry_run: bool = False
    ) -> dict:
        """
        Batch compress all images in a directory

        Args:
            directory: Subdirectory under assets (e.g., "products", "brands")
            preset: Compression preset
            dry_run: If True, only report what would be done

        Returns:
            Dictionary with compression statistics
        """
        target_dir = self.assets_dir / directory
        if not target_dir.exists():
            return {"error": f"Directory not found: {target_dir}"}

        stats = {
            "total_files": 0,
            "compressed": 0,
            "failed": 0,
            "skipped": 0,
            "original_size": 0,
            "compressed_size": 0
        }

        image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}

        for image_path in target_dir.glob('*'):
            if image_path.suffix.lower() not in image_extensions:
                continue

            stats["total_files"] += 1
            stats["original_size"] += image_path.stat().st_size

            if dry_run:
                logger.info(f"Would compress: {image_path.name}")
                continue

            compressed = await self.compress_image(image_path, preset)

            if compressed:
                stats["compressed"] += 1
                stats["compressed_size"] += len(compressed)
            else:
                stats["failed"] += 1

        if not dry_run:
            reduction = (1 - stats["compressed_size"] / stats["original_size"]
                         ) * 100 if stats["original_size"] > 0 else 0
            logger.info(
                f"Batch compression complete: "
                f"{stats['compressed']}/{stats['total_files']} files, "
                f"{stats['original_size'] / 1024 / 1024:.1f}MB → "
                f"{stats['compressed_size'] / 1024 / 1024:.1f}MB "
                f"({reduction:.1f}% reduction)"
            )

        return stats

    def get_optimized_image_path(
        self,
        image_filename: str,
        preset: Literal["thumbnail", "medium", "large", "original"] = "medium"
    ) -> Optional[Path]:
        """Get the path to an optimized image, returns None if not cached"""
        cache_key = self.get_cache_key(image_filename, preset)
        cache_path = self.cache_dir / cache_key
        return cache_path if cache_path.exists() else None

    def clear_cache(self, pattern: str = "*") -> int:
        """Clear cached images matching pattern"""
        count = 0
        for cached_file in self.cache_dir.glob(pattern):
            cached_file.unlink()
            count += 1
        logger.info(f"Cleared {count} cached images")
        return count


# Global instance
_optimizer = ImageOptimizer()


def get_image_optimizer() -> ImageOptimizer:
    """Get the global image optimizer instance"""
    return _optimizer
