#!/usr/bin/env python3
"""
Fresh Scrape Pipeline
====================
Complete pipeline reset and re-scrape for testing:
1. Delete all existing catalogs (backend + frontend)
2. Scrape fresh 30 products from Roland
3. Scrape fresh 30 products from Boss
4. Sync to frontend with logos
5. Verify entire pipeline
"""

import sys
import json
import shutil
from pathlib import Path
from datetime import datetime
import subprocess

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from backend.core.config import settings

# Use settings object
CATALOGS_DIR = settings.CATALOGS_DIR
FRONTEND_CATALOGS_DIR = settings.FRONTEND_CATALOGS_DIR
FRONTEND_LOGOS_DIR = settings.FRONTEND_LOGOS_DIR
FRONTEND_DATA_DIR = settings.FRONTEND_DATA_DIR

def log(msg: str, level: str = "INFO"):
    """Colored logging"""
    colors = {
        "INFO": "\033[36m",  # Cyan
        "SUCCESS": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
    }
    reset = "\033[0m"
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{colors.get(level, '')}{level:8} [{timestamp}] {msg}{reset}")


def clean_catalogs():
    """Delete all existing catalogs from backend and frontend"""
    log("🧹 CLEANING ALL EXISTING CATALOGS...", "WARNING")
    
    # Backend catalogs
    if CATALOGS_DIR.exists():
        for file in CATALOGS_DIR.glob("*.json"):
            log(f"  Deleting backend/{file.name}")
            file.unlink()
    
    # Frontend catalogs
    if FRONTEND_CATALOGS_DIR.exists():
        for file in FRONTEND_CATALOGS_DIR.glob("*.json"):
            log(f"  Deleting frontend/{file.name}")
            file.unlink()
    
    # Frontend logos
    if FRONTEND_LOGOS_DIR.exists():
        for file in FRONTEND_LOGOS_DIR.glob("*"):
            log(f"  Deleting logo/{file.name}")
            file.unlink()
    
    # Reset index.json
    index_path = FRONTEND_DATA_DIR / "index.json"
    if index_path.exists():
        log(f"  Resetting {index_path.name}")
        index_path.write_text(json.dumps({
            "version": "3.7-Halilit",
            "build_timestamp": datetime.utcnow().isoformat() + "Z",
            "total_products": 0,
            "brands": []
        }, indent=2))
    
    log("✅ Cleanup complete", "SUCCESS")


def scrape_brand(brand: str, max_products: int = 30):
    """Scrape products from a brand"""
    log(f"\n🤖 SCRAPING {brand.upper()} ({max_products} products)...", "INFO")
    
    cmd = [
        "python3",
        "backend/orchestrate_brand.py",
        "--brand", brand,
        "--max-products", str(max_products)
    ]
    
    try:
        result = subprocess.run(
            cmd,
            cwd=Path(__file__).parent,
            capture_output=False,
            text=True,
            check=True
        )
        log(f"✅ {brand.upper()} scraping complete", "SUCCESS")
        return True
    except subprocess.CalledProcessError as e:
        log(f"❌ {brand.upper()} scraping failed: {e}", "ERROR")
        return False


def sync_to_frontend():
    """Sync scraped data to frontend"""
    log("\n📦 SYNCING TO FRONTEND...", "INFO")
    
    cmd = ["python3", "sync_pipeline.py", "--download-logos"]
    
    try:
        subprocess.run(
            cmd,
            cwd=Path(__file__).parent,
            capture_output=False,
            text=True,
            check=True
        )
        log("✅ Frontend sync complete", "SUCCESS")
        return True
    except subprocess.CalledProcessError as e:
        log(f"❌ Frontend sync failed: {e}", "ERROR")
        return False


def verify_pipeline():
    """Verify the entire pipeline"""
    log("\n🔍 VERIFYING PIPELINE...", "INFO")
    
    cmd = ["python3", "monitor_pipeline.py"]
    
    try:
        subprocess.run(
            cmd,
            cwd=Path(__file__).parent,
            capture_output=False,
            text=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        log(f"❌ Pipeline verification failed: {e}", "ERROR")
        return False


def main():
    """Run complete fresh scrape pipeline"""
    log("=" * 60, "INFO")
    log("🚀 FRESH SCRAPE PIPELINE - COMPLETE RESET & TEST", "INFO")
    log("=" * 60, "INFO")
    
    # Step 1: Clean all existing data
    clean_catalogs()
    
    # Step 2: Scrape Roland (30 products)
    if not scrape_brand("roland", 30):
        log("❌ Pipeline aborted - Roland scraping failed", "ERROR")
        return 1
    
    # Step 3: Scrape Boss (30 products)
    if not scrape_brand("boss", 30):
        log("⚠️  Boss scraping failed but continuing...", "WARNING")
    
    # Step 4: Sync to frontend
    if not sync_to_frontend():
        log("❌ Pipeline aborted - Sync failed", "ERROR")
        return 1
    
    # Step 5: Verify pipeline
    log("\n" + "=" * 60, "INFO")
    if verify_pipeline():
        log("🎉 FRESH SCRAPE PIPELINE COMPLETE!", "SUCCESS")
        log("=" * 60, "INFO")
        log("\n👉 Check UI at http://localhost:5173", "INFO")
        return 0
    else:
        log("⚠️  Pipeline complete with warnings", "WARNING")
        return 0


if __name__ == "__main__":
    sys.exit(main())
