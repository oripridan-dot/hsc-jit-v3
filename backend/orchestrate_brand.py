import argparse
import asyncio
import sys
from pathlib import Path

# Add backend to path so we can import modules
sys.path.append(str(Path(__file__).parent))

from services.hierarchy_scraper import HierarchyScraper

async def main():
    parser = argparse.ArgumentParser(description="HSC-JIT V3.7 Brand Orchestrator")
    parser.add_argument("--brand", type=str, required=True, help="Brand name to process (e.g., 'roland')")
    parser.add_argument("--max-products", type=int, default=10, help="Max products to process (default: 10)")
    # Add other flags as needed based on jit/orchestrator.py capabilities
    
    args = parser.parse_args()
    
    print(f"🚀 Starting V3.7 Orchestration for: {args.brand}")
    print(f"📦 Limit: {args.max_products} products")
    
    try:
        scraper = HierarchyScraper()
        # Using process_brand (or equivalent method from HierarchyScraper)
        await scraper.scrape_brand_hierarchy(args.brand, max_products=args.max_products)
        
    except Exception as e:
        print(f"❌ Error during orchestration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
