#!/usr/bin/env python3
"""
AUTOMATED SYNC ORCHESTRATOR
Coordinates Halilit sync → Brand sync → Merge in a single command.
Logs everything, tracks timing, reports statistics.
"""

import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
import logging
import time
from typing import Dict, List, Optional

BACKEND_DIR = Path(__file__).parent.parent
SCRIPTS_DIR = BACKEND_DIR / "scripts"
DATA_DIR = BACKEND_DIR / "data"
LOGS_DIR = BACKEND_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Setup logging with detailed formatting
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / 'hsc-sync-orchestrator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class SyncOrchestrator:
    """Elite-performance automated sync orchestrator"""

    def __init__(self):
        self.start_time = datetime.now()
        self.results = {
            "start_time": self.start_time.isoformat(),
            "end_time": None,
            "duration_seconds": 0,
            "phases": {
                "halilit": {"status": "pending", "duration": 0, "product_count": 0},
                "brand_websites": {"status": "pending", "duration": 0, "product_count": 0},
                "merge": {"status": "pending", "duration": 0, "total_products": 0}
            },
            "summary": {},
            "errors": []
        }

    def log_phase(self, phase: str, message: str, level: str = "INFO"):
        """Log with phase prefix"""
        prefix = f"[{phase.upper():15}]"
        getattr(logger, level.lower())(f"{prefix} {message}")

    def run_halilit_sync(self) -> bool:
        """Phase 1: Halilit official distributor sync"""
        self.log_phase("halilit", "Starting Halilit sync...")
        phase_start = time.time()

        try:
            result = subprocess.run(
                ["python", str(SCRIPTS_DIR / "master_sync.py"), "--priority"],
                capture_output=True,
                timeout=3600,
                cwd=str(BACKEND_DIR),
                text=True
            )

            if result.returncode != 0:
                error_msg = result.stderr or result.stdout
                self.log_phase("halilit", f"FAILED: {error_msg}", "ERROR")
                self.results["errors"].append(
                    f"Halilit sync failed: {error_msg}")
                self.results["phases"]["halilit"]["status"] = "failed"
                return False

            # Parse results
            output = result.stdout
            if "Scraped" in output:
                # Extract product count from output
                for line in output.split('\n'):
                    if "Total products:" in line:
                        count = int(''.join(filter(str.isdigit, line)))
                        self.results["phases"]["halilit"]["product_count"] = count
                        self.log_phase(
                            "halilit", f"✅ Completed: {count} products", "INFO")

            duration = time.time() - phase_start
            self.results["phases"]["halilit"]["duration"] = duration
            self.results["phases"]["halilit"]["status"] = "completed"
            self.log_phase("halilit", f"Duration: {duration:.1f}s")
            return True

        except subprocess.TimeoutExpired:
            self.log_phase("halilit", "TIMEOUT (>60 min)", "ERROR")
            self.results["errors"].append("Halilit sync timed out")
            self.results["phases"]["halilit"]["status"] = "timeout"
            return False

        except Exception as e:
            self.log_phase("halilit", f"ERROR: {str(e)}", "ERROR")
            self.results["errors"].append(f"Halilit error: {str(e)}")
            self.results["phases"]["halilit"]["status"] = "error"
            return False

    def run_brand_sync(self) -> bool:
        """Phase 2: Brand website scraping with Playwright"""
        self.log_phase("brand_websites", "Starting brand website scraping...")
        phase_start = time.time()

        try:
            result = subprocess.run(
                ["python", str(SCRIPTS_DIR / "brand_website_scraper.py")],
                capture_output=True,
                timeout=1800,  # 30 min max
                cwd=str(BACKEND_DIR),
                text=True
            )

            if result.returncode != 0:
                error_msg = result.stderr or result.stdout
                self.log_phase("brand_websites",
                               f"FAILED: {error_msg}", "ERROR")
                self.results["errors"].append(
                    f"Brand sync failed: {error_msg}")
                self.results["phases"]["brand_websites"]["status"] = "failed"
                return False

            # Parse results
            output = result.stdout
            count = 0
            for line in output.split('\n'):
                if "products found" in line.lower():
                    try:
                        count = int(
                            ''.join(filter(str.isdigit, line.split()[0])))
                    except:
                        pass

            self.results["phases"]["brand_websites"]["product_count"] = count
            self.log_phase("brand_websites",
                           f"✅ Completed: {count} products", "INFO")

            duration = time.time() - phase_start
            self.results["phases"]["brand_websites"]["duration"] = duration
            self.results["phases"]["brand_websites"]["status"] = "completed"
            self.log_phase("brand_websites", f"Duration: {duration:.1f}s")
            return True

        except subprocess.TimeoutExpired:
            self.log_phase("brand_websites", "TIMEOUT (>30 min)", "ERROR")
            self.results["errors"].append("Brand sync timed out")
            self.results["phases"]["brand_websites"]["status"] = "timeout"
            return False

        except Exception as e:
            self.log_phase("brand_websites", f"ERROR: {str(e)}", "ERROR")
            self.results["errors"].append(f"Brand error: {str(e)}")
            self.results["phases"]["brand_websites"]["status"] = "error"
            return False

    def run_merge(self) -> bool:
        """Phase 3: Merge Halilit + Brand catalogs"""
        self.log_phase("merge", "Starting catalog merge...")
        phase_start = time.time()

        try:
            result = subprocess.run(
                ["python", str(SCRIPTS_DIR / "merge_catalog.py")],
                capture_output=True,
                timeout=300,  # 5 min max
                cwd=str(BACKEND_DIR),
                text=True
            )

            if result.returncode != 0:
                error_msg = result.stderr or result.stdout
                self.log_phase("merge", f"FAILED: {error_msg}", "ERROR")
                self.results["errors"].append(f"Merge failed: {error_msg}")
                self.results["phases"]["merge"]["status"] = "failed"
                return False

            # Parse summary
            summary_file = DATA_DIR / "catalogs_unified" / "summary.json"
            if summary_file.exists():
                with open(summary_file) as f:
                    summary = json.load(f)

                stats = summary.get("statistics", {})
                total = stats.get("total_products", 0)
                primary = stats.get("primary_products", 0)
                secondary = stats.get("secondary_products", 0)

                self.results["phases"]["merge"]["total_products"] = total
                self.results["summary"] = {
                    "total_products": total,
                    "primary": primary,
                    "secondary": secondary,
                    "coverage": f"{(primary/total*100):.1f}%" if total > 0 else "0%"
                }

                self.log_phase(
                    "merge", f"✅ Completed: {total} total (PRIMARY: {primary}, SECONDARY: {secondary})")

            duration = time.time() - phase_start
            self.results["phases"]["merge"]["duration"] = duration
            self.results["phases"]["merge"]["status"] = "completed"
            self.log_phase("merge", f"Duration: {duration:.1f}s")
            return True

        except subprocess.TimeoutExpired:
            self.log_phase("merge", "TIMEOUT (>5 min)", "ERROR")
            self.results["errors"].append("Merge timed out")
            self.results["phases"]["merge"]["status"] = "timeout"
            return False

        except Exception as e:
            self.log_phase("merge", f"ERROR: {str(e)}", "ERROR")
            self.results["errors"].append(f"Merge error: {str(e)}")
            self.results["phases"]["merge"]["status"] = "error"
            return False

    def run_orchestration(self) -> Dict:
        """Run all three phases in sequence"""
        logger.info("=" * 80)
        logger.info("🚀 ELITE SYNC ORCHESTRATION STARTING")
        logger.info("=" * 80)

        # Phase 1: Halilit
        if not self.run_halilit_sync():
            logger.error("❌ Halilit sync failed, aborting")
            self.finalize()
            return self.results

        # Phase 2: Brand websites
        if not self.run_brand_sync():
            logger.warning(
                "⚠️ Brand sync failed, but continuing to merge available data")

        # Phase 3: Merge
        if not self.run_merge():
            logger.error("❌ Merge failed")
            self.finalize()
            return self.results

        self.finalize()
        return self.results

    def finalize(self):
        """Finalize and save results"""
        self.results["end_time"] = datetime.now().isoformat()
        total_duration = datetime.now() - self.start_time
        self.results["duration_seconds"] = total_duration.total_seconds()

        # Save results
        results_file = DATA_DIR / "sync_results.json"
        results_file.parent.mkdir(parents=True, exist_ok=True)
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print final summary"""
        logger.info("=" * 80)
        logger.info("📊 SYNC ORCHESTRATION COMPLETE")
        logger.info("=" * 80)
        logger.info(f"Total Duration: {self.results['duration_seconds']:.1f}s")
        logger.info(
            f"Halilit:       {self.results['phases']['halilit']['status'].upper()} ({self.results['phases']['halilit']['product_count']} products)")
        logger.info(
            f"Brand Sites:   {self.results['phases']['brand_websites']['status'].upper()} ({self.results['phases']['brand_websites']['product_count']} products)")
        logger.info(
            f"Merge:         {self.results['phases']['merge']['status'].upper()}")

        if self.results['summary']:
            summary = self.results['summary']
            logger.info(f"")
            logger.info(f"Final Catalog: {summary['total_products']} products")
            logger.info(
                f"  - PRIMARY:   {summary['primary']} ({summary['coverage']})")
            logger.info(f"  - SECONDARY: {summary['secondary']}")

        if self.results['errors']:
            logger.warning(f"")
            logger.warning(f"❌ ERRORS ({len(self.results['errors'])}):")
            for error in self.results['errors']:
                logger.warning(f"  - {error}")

        logger.info("=" * 80)


if __name__ == "__main__":
    orchestrator = SyncOrchestrator()
    results = orchestrator.run_orchestration()

    # Exit with error code if critical failures
    failed_phases = [p for p, data in results["phases"].items()
                     if data["status"] == "failed"]
    if failed_phases:
        sys.exit(1)

    sys.exit(0)
