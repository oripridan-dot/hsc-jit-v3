# backend/heartbeat.py
import logging
import json
import time
from pathlib import Path
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor

# Import Core Services
from services.catalog_manager import MasterCatalogManager
from services.frontend_normalizer import FrontendNormalizer
from models.product_hierarchy import ProductCore
from models.category_consolidator import CONSOLIDATED_CATEGORIES

# Setup Paths
BASE_DIR = Path(__file__).parent
RAW_SCRAPE_DIR = BASE_DIR / "data/scraped_raw"
FRONTEND_DIR = BASE_DIR.parent / "frontend/public/data"
STATUS_FILE = BASE_DIR / "data/system_status.json"

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Heartbeat")

class HeartbeatMonitor:
    def __init__(self, hours_interval=12):
        self.interval = hours_interval
        self._ensure_status_file()

    def _ensure_status_file(self):
        if not STATUS_FILE.exists():
            STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
            self._save_status({"last_run": "2000-01-01T00:00:00", "status": "init"})

    def _load_status(self):
        with open(STATUS_FILE, 'r') as f:
            return json.load(f)

    def _save_status(self, data):
        with open(STATUS_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def should_run(self):
        status = self._load_status()
        last_run = datetime.fromisoformat(status.get("last_run", "2000-01-01T00:00:00"))
        if datetime.now() - last_run > timedelta(hours=self.interval):
            return True, "Time to update (Stale Data)"
        return False, f"Skipping (Data is fresh. Next update in {self.interval - ((datetime.now() - last_run).seconds // 3600)}h)"

    def mark_success(self, stats):
        self._save_status({
            "last_run": datetime.now().isoformat(),
            "status": "success",
            "stats": stats
        })

def process_brand(brand_id: str):
    """Loads and harmonizes a single brand."""
    try:
        manager = MasterCatalogManager(brand_id)
        # In a real scenario, you might trigger a scrape here if needed
        return manager.load_master().products
    except Exception as e:
        logger.error(f"Error processing brand {brand_id}: {e}")
        return []

def generate_manifest(total_products):
    """Creates the file the UI reads to show 'System Online'"""
    manifest = {
        "system_status": "ONLINE",
        "last_update": datetime.now().isoformat(),
        "total_products": total_products,
        "motd": "Catalog synced and normalized."
    }
    with open(FRONTEND_DIR / "system_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)

def run_smart_startup(force=False):
    monitor = HeartbeatMonitor(hours_interval=12)
    should_run, reason = monitor.should_run()

    if not should_run and not force:
        logger.info(f"🟢 HEARTBEAT: {reason}")
        return

    logger.info(f"🚀 HEARTBEAT: Initiating Update Sequence ({reason})")
    start_time = time.time()

    # 1. Harvest
    brand_files = list((BASE_DIR / "data/blueprints").glob("*_blueprint.json"))
    brands = [f.name.replace("_blueprint.json", "") for f in brand_files]
    
    all_products = []
    with ThreadPoolExecutor() as executor:
        results = executor.map(process_brand, brands)
        for res in results:
            all_products.extend(res)

    # 2. Normalize & Publish
    ui_buckets = {cat.id: [] for cat in CONSOLIDATED_CATEGORIES}
    ui_buckets["accessories"] = []

    for product in all_products:
        try:
            payload = FrontendNormalizer.normalize_product(product)
            tribe = payload.get("tribe_id", "accessories")
            if tribe in ui_buckets:
                ui_buckets[tribe].append(payload)
            else:
                ui_buckets["accessories"].append(payload)
        except:
            continue

    FRONTEND_DIR.mkdir(parents=True, exist_ok=True)
    for tribe, items in ui_buckets.items():
        with open(FRONTEND_DIR / f"{tribe}.json", 'w', encoding='utf-8') as f:
            json.dump(items, f, indent=2, ensure_ascii=False)

    # 3. Finalize
    total_count = len(all_products)
    generate_manifest(total_count)
    monitor.mark_success({"total": total_count})
    
    logger.info(f"✅ HEARTBEAT COMPLETE: {total_count} items processed in {time.time() - start_time:.2f}s")

if __name__ == "__main__":
    run_smart_startup(force=False)
