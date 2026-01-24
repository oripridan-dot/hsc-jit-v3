from services.halilit_direct_scraper import HalilitDirectScraper
from services.genesis_builder import GenesisBuilder
import sys
import os

# Add backend to path if needed (though running from inside backend should work)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def manual_moog():
    print("🎹 Manually Ingesting Moog from Halilit...")
    
    slug = "moog"
    url = "https://www.halilit.com/23648-synth/541634-Moogt"
    
    scraper = HalilitDirectScraper()
    blueprint_path = scraper.scrape_brand(slug, url)
    
    if blueprint_path:
        print(f"✅ Blueprint created: {blueprint_path}")
        
        # 2. Run GenesisBuilder
        builder = GenesisBuilder(slug)
        builder.construct()
        print("✅ Genesis Complete for Moog.")
    else:
        print("❌ Failed to scrape Moog from Halilit.")

if __name__ == "__main__":
    manual_moog()
