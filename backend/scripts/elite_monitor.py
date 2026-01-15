#!/usr/bin/env python3
"""
ELITE PERFORMANCE MONITORING & AUTO-RECOVERY
Handles health checks, alerting, and automatic recovery for Option 2 syncs.
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
import logging

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_DIR = DATA_DIR / "catalogs"
CATALOGS_UNIFIED_DIR = DATA_DIR / "catalogs_unified"
LOGS_DIR = BACKEND_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / 'hsc-jit-monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Elite monitoring with auto-recovery"""

    def __init__(self):
        self.status = {
            "timestamp": datetime.now().isoformat(),
            "halilit_sync": None,
            "brand_sync": None,
            "merge_status": None,
            "issues": [],
            "recovered": []
        }

    def check_halilit_sync(self):
        """Verify Halilit sync completed successfully"""
        log_file = LOGS_DIR / "halilit-sync.log"

        try:
            if not log_file.exists():
                self.status["issues"].append("Halilit: No log file found")
                return False

            with open(log_file) as f:
                content = f.read()

            # Check for errors
            if "ERROR" in content or "FAILED" in content:
                self.status["issues"].append("Halilit: Sync had errors")
                return False

            # Check product count
            brands_count = len(list(CATALOGS_DIR.glob("*.json")))
            if brands_count < 15:
                self.status["issues"].append(
                    f"Halilit: Only {brands_count} brands synced (expected 18)")
                return False

            self.status["halilit_sync"] = "✅ HEALTHY"
            logger.info("✅ Halilit sync verified")
            return True

        except Exception as e:
            self.status["issues"].append(f"Halilit: Check failed - {str(e)}")
            return False

    def check_brand_sync(self):
        """Verify brand website sync completed"""
        log_file = LOGS_DIR / "brand-sync.log"

        try:
            if not log_file.exists():
                self.status["brand_sync"] = "⏭️ NOT_RUN"
                return None

            with open(log_file) as f:
                lines = f.readlines()

            # Check last 50 lines for errors
            recent = ''.join(lines[-50:])
            if "ERROR" in recent or "FAILED" in recent:
                self.status["issues"].append("Brand: Sync had errors")
                return False

            # Check if any brands returned 0 products
            zero_count = recent.count("0 products")
            if zero_count > 3:
                self.status["issues"].append(
                    f"Brand: {zero_count} brands had 0 products")
                return False

            self.status["brand_sync"] = "✅ HEALTHY"
            logger.info("✅ Brand sync verified")
            return True

        except Exception as e:
            self.status["issues"].append(f"Brand: Check failed - {str(e)}")
            return False

    def check_merge_status(self):
        """Verify merge completed and PRIMARY/SECONDARY split is good"""
        summary_file = CATALOGS_UNIFIED_DIR / "summary.json"

        try:
            if not summary_file.exists():
                self.status["merge_status"] = "⏭️ NOT_RUN"
                return None

            with open(summary_file) as f:
                summary = json.load(f)

            stats = summary.get("statistics", {})

            # Check total products
            total = stats.get("total_products", 0)
            if total < 2000:
                self.status["issues"].append(
                    f"Merge: Only {total} total products (expected 10k+)")
                return False

            # Check PRIMARY/SECONDARY split
            primary = stats.get("primary_products", 0)
            secondary = stats.get("secondary_products", 0)

            if primary < 1500:
                self.status["issues"].append(
                    f"Merge: Low PRIMARY count ({primary}, expected 2000+)")
                return False

            self.status["merge_status"] = "✅ HEALTHY"
            logger.info(
                f"✅ Merge verified: {primary} PRIMARY, {secondary} SECONDARY")
            return True

        except Exception as e:
            self.status["issues"].append(f"Merge: Check failed - {str(e)}")
            return False

    def auto_recover_halilit(self):
        """Attempt to recover failed Halilit sync"""
        try:
            logger.warning("🔄 Attempting Halilit recovery...")
            result = subprocess.run(
                ["python", str(BACKEND_DIR / "scripts" /
                               "halilit_scraper.py")],
                capture_output=True,
                timeout=300,
                cwd=str(BACKEND_DIR)
            )

            if result.returncode == 0:
                self.status["recovered"].append("Halilit sync recovered")
                logger.info("✅ Halilit recovery successful")
                return True
            else:
                logger.error(
                    f"❌ Halilit recovery failed: {result.stderr.decode()}")
                return False

        except Exception as e:
            logger.error(f"❌ Halilit recovery error: {str(e)}")
            return False

    def auto_recover_brand_sync(self):
        """Attempt to recover failed brand sync"""
        try:
            logger.warning("🔄 Attempting brand sync recovery...")
            result = subprocess.run(
                ["python", str(BACKEND_DIR / "scripts" /
                               "brand_website_scraper.py")],
                capture_output=True,
                timeout=600,
                cwd=str(BACKEND_DIR)
            )

            if result.returncode == 0:
                self.status["recovered"].append("Brand sync recovered")
                logger.info("✅ Brand sync recovery successful")
                return True
            else:
                logger.error(
                    f"❌ Brand recovery failed: {result.stderr.decode()}")
                return False

        except Exception as e:
            logger.error(f"❌ Brand recovery error: {str(e)}")
            return False

    def run_full_check(self, auto_recover=True):
        """Run all health checks"""
        logger.info("=" * 60)
        logger.info("🔍 ELITE PERFORMANCE HEALTH CHECK")
        logger.info("=" * 60)

        # Check each system
        halilit_ok = self.check_halilit_sync()
        brand_ok = self.check_brand_sync()
        merge_ok = self.check_merge_status()

        # Auto-recovery if enabled
        if auto_recover:
            if halilit_ok is False:
                self.auto_recover_halilit()
            if brand_ok is False:
                self.auto_recover_brand_sync()

        # Generate summary
        self.print_summary()
        return self.status

    def print_summary(self):
        """Print health check summary"""
        print("\n" + "=" * 60)
        print("📊 HEALTH CHECK SUMMARY")
        print("=" * 60)
        print(f"Halilit:      {self.status['halilit_sync']}")
        print(f"Brand Sites:  {self.status['brand_sync']}")
        print(f"Merge:        {self.status['merge_status']}")

        if self.status["issues"]:
            print("\n⚠️  ISSUES DETECTED:")
            for issue in self.status["issues"]:
                print(f"  - {issue}")

        if self.status["recovered"]:
            print("\n✅ RECOVERED:")
            for recovery in self.status["recovered"]:
                print(f"  - {recovery}")

        print("=" * 60 + "\n")

    def save_status(self):
        """Save status report"""
        status_file = CATALOGS_UNIFIED_DIR / "health_check.json"
        status_file.parent.mkdir(parents=True, exist_ok=True)

        with open(status_file, 'w') as f:
            json.dump(self.status, f, indent=2)

        logger.info(f"📝 Status saved to {status_file}")


def send_alert(message, severity="ERROR"):
    """Send alert to monitoring system"""
    # TODO: Integrate with:
    # - Slack webhook
    # - Email
    # - PagerDuty
    # - Sentry

    logger.warning(f"🚨 [{severity}] {message}")


if __name__ == "__main__":
    monitor = PerformanceMonitor()

    # Full health check with auto-recovery
    status = monitor.run_full_check(auto_recover=True)
    monitor.save_status()

    # Exit with error if critical issues remain
    if status["issues"] and not status["recovered"]:
        send_alert(f"Critical issues: {status['issues']}", severity="CRITICAL")
        sys.exit(1)

    sys.exit(0)
