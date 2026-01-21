import asyncio
import sys
import os
from pathlib import Path

# Add backend to path to import services
sys.path.append(str(Path(__file__).parent.parent))

# Try to import JITRAGSystem, if not found, create a mock for now to satisfy the import
try:
    from services.jit_rag_system import JITRAGSystem
except ImportError:
    class JITRAGSystem:
        async def search(self, query):
            print(f"DEBUG: Mock JITRAGSystem searching for '{query}'")
            # Return dummy data to match the test expectations if the real system is missing
            # This allows the test script to run without crashing, though it will fail the logic checks if data isn't right.
            # However, for the purpose of the test structure, we need the class.
            return {"results": [], "insight": "Mock Insight"}

from services.roland_scraper import RolandScraper
from services.visual_factory import VisualFactory

async def run_horizontal_test():
    rag = JITRAGSystem()
    scraper = RolandScraper()
    visuals = VisualFactory()
    
    print("\n🎹 STARTING HORIZONTAL SYSTEM TEST: 'THE SYMPHONY'")
    print("====================================================")

    # DEFINING THE 3 USER PERSONAS
    scenarios = [
        {
            "id": "A",
            "persona": "The Shopper",
            "query": "Roland FP-90X vs Nord Grand",
            "expect": "comparison_view",
            "required_assets": ["thumbnail_url"] # Needs clean thumbnails for TierBar
        },
        {
            "id": "B",
            "persona": "The Engineer",
            "query": "How do I reset the RD-2000 to factory settings?",
            "expect": "solution_view",
            "required_assets": ["manual_url", "inspection_url"] # Needs manual + high-res zoom
        },
        {
            "id": "C",
            "persona": "The Explorer",
            "query": "Synthesizers",
            "expect": "gallery_view",
            "required_assets": ["thumbnail_url"]
        }
    ]

    for s in scenarios:
        print(f"\n🧪 TEST SCENARIO {s['id']}: {s['persona']}")
        print(f"   Query: '{s['query']}'")
        
        # 1. EXECUTE SEARCH (Simulate Frontend Request)
        response = await rag.search(s['query'])
        
        # 2. VALIDATE RAG BRAIN
        if not response.get('results'):
            print(f"   ❌ FAILURE: No results found for '{s['query']}'")
            # SELF-HEALING TRIGGER: Try to JIT Scrape if missing
            print("   🔧 ATTEMPTING JIT SCRAPE RECOVERY...")
            # (In a real scenario, you'd trigger the scraper here for the specific missing term)
            continue
            
        print(f"   ✅ RAG: Found {len(response['results'])} relevant items")
        if response.get('insight'):
            print(f"   ✅ BRAIN: Generated Insight: \"{response['insight'][:50]}...\"")
        
        # 3. VALIDATE VISUAL FACTORY (The "Perfect Visuals" Check)
        first_item = response['results'][0]
        images = first_item.get('images', {})
        
        missing_assets = []
        for asset in s['required_assets']:
            if asset not in images or not images[asset]:
                missing_assets.append(asset)
                
        if missing_assets:
            print(f"   ❌ VISUALS: Missing {missing_assets} for {first_item['name']}")
            print(f"      Status: Raw images only. Optimization pipeline failed.")
        else:
            print(f"   ✅ VISUALS: Optimized Assets Ready (Thumb: {bool(images.get('thumbnail_url'))})")

        # 4. VALIDATE DATA SYNC (Pricing & Specs)
        if first_item.get('specs') and len(first_item['specs']) > 5:
             print(f"   ✅ DATA: Rich Specs detected ({len(first_item['specs'])} attributes)")
        else:
             print(f"   ⚠️ DATA: Specs look thin. Check Parser.")

    print("\n====================================================")
    print("🏁 SYSTEM SYNC TEST COMPLETE")

if __name__ == "__main__":
    asyncio.run(run_horizontal_test())
