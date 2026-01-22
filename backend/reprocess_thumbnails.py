#!/usr/bin/env python3
"""
Visual Factory Batch Processor
Reprocess all product thumbnails with precise cropping and normalization
"""

import sys
import argparse
from pathlib import Path
from services.visual_factory import VisualFactory

def main():
    parser = argparse.ArgumentParser(description='Batch process product images through Visual Factory')
    parser.add_argument('--catalog', type=str, required=True, help='Path to catalog JSON file')
    parser.add_argument('--output', type=str, default='frontend/public/data/product_images', help='Output directory')
    parser.add_argument('--force', action='store_true', help='Force reprocess even if images exist')
    parser.add_argument('--brand', type=str, help='Process only specific brand')
    
    args = parser.parse_args()
    
    # Initialize Visual Factory
    factory = VisualFactory()
    
    print("\n" + "="*60)
    print("🏭 VISUAL FACTORY - BATCH PROCESSOR")
    print("="*60)
    
    # Process catalog
    result = factory.batch_reprocess_catalog(
        catalog_path=args.catalog,
        output_dir=args.output,
        force=args.force
    )
    
    print("\n" + "="*60)
    print("📊 FINAL STATISTICS")
    print("="*60)
    print(f"Total Products: {result['total']}")
    print(f"Successfully Processed: {result['processed']} ({result['processed']/result['total']*100:.1f}%)")
    print(f"Failed: {result['failed']}")
    print(f"\nUpdated Catalog: {result['output_catalog']}")
    print("="*60 + "\n")
    
    return 0 if result['failed'] == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
