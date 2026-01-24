import os
import sys
from pathlib import Path

# Add parent directory to path to allow imports from backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.genesis_builder import GenesisBuilder

BLUEPRINTS_DIR = Path("backend/data/blueprints")

def regenerate():
    if not BLUEPRINTS_DIR.exists():
        print(f"❌ Blueprints directory found at {BLUEPRINTS_DIR}")
        return

    blueprints = list(BLUEPRINTS_DIR.glob("*_blueprint.json"))
    print(f"Found {len(blueprints)} blueprints. Regenerating frontend JSONs...")

    for bp_file in blueprints:
        brand_name = bp_file.stem.replace("_blueprint", "")
        # print(f"🔨 Rebuilding {brand_name}...")
        try:
            builder = GenesisBuilder(brand_name)
            builder.construct()
        except Exception as e:
            print(f"❌ Error rebuilding {brand_name}: {e}")

if __name__ == "__main__":
    regenerate()
