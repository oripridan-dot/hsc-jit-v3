#!/usr/bin/env python3
"""
Batch Image Optimization Script
Optimizes all product images to reduce storage and improve loading times
"""

from app.services.image_optimizer import get_image_optimizer
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


async def main():
    """Run batch optimization"""
    print("🖼️  HSC JIT Image Optimizer")
    print("=" * 60)

    optimizer = get_image_optimizer()

    # First, do a dry run
    print("\n📊 Analyzing images...")
    dry_stats = await optimizer.batch_compress_directory(
        directory="products",
        preset="medium",
        dry_run=True
    )

    print(f"\nFound {dry_stats['total_files']} images")
    print(f"Total size: {dry_stats['original_size'] / 1024 / 1024:.1f} MB")

    # Ask for confirmation
    response = input("\n⚠️  Proceed with optimization? (y/N): ").lower()

    if response != 'y':
        print("❌ Cancelled")
        return

    # Run actual optimization
    print("\n🔄 Optimizing images...")
    stats = await optimizer.batch_compress_directory(
        directory="products",
        preset="medium",
        dry_run=False
    )

    print("\n✅ Optimization Complete!")
    print(f"   Compressed: {stats['compressed']}/{stats['total_files']} files")
    print(f"   Failed: {stats['failed']}")

    if stats['original_size'] > 0:
        compressed_mb = stats['compressed_size'] / 1024 / 1024
        original_mb = stats['original_size'] / 1024 / 1024
        savings = original_mb - compressed_mb
        reduction = (1 - stats['compressed_size'] /
                     stats['original_size']) * 100

        print(f"\n   Original: {original_mb:.1f} MB")
        print(f"   Compressed: {compressed_mb:.1f} MB")
        print(f"   Saved: {savings:.1f} MB ({reduction:.1f}% reduction)")

        print("\n💡 Tip: Update your frontend to use the optimization endpoint:")
        print("   /api/images/optimize/image-name.webp?preset=thumbnail")


if __name__ == "__main__":
    asyncio.run(main())
