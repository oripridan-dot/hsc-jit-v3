#!/usr/bin/env python3
"""
PRODUCTION MONITORING & ALERTING SYSTEM v3.5
Real-time health checks, anomaly detection, and auto-recovery
"""

import json
import subprocess
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import argparse

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
        logging.FileHandler(LOGS_DIR / 'production_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ProductionMonitor:
    """Production monitoring with alerting and auto-recovery."""

    def __init__(self):
        self.alerts = []
        self.status = {
            "timestamp": datetime.now().isoformat(),
            "overall_health": "HEALTHY",
            "checks": {},
            "alerts": [],
            "recommendations": []
        }

    # ════════════════════════════════════════════════════════════
    # HEALTH CHECKS
    # ════════════════════════════════════════════════════════════

    def check_api_connectivity(self) -> bool:
        """Check if API is responding."""
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                 "http://localhost:8000/health"],
                capture_output=True,
                timeout=5
            )
            status_code = int(result.stdout.decode().strip())
            is_healthy = status_code == 200
            self.status["checks"]["api"] = {
                "status": "✅ HEALTHY" if is_healthy else "❌ DOWN",
                "status_code": status_code
            }
            return is_healthy
        except Exception as e:
            self.status["checks"]["api"] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
            self.alerts.append(f"API connectivity check failed: {e}")
            return False

    def check_catalog_freshness(self) -> bool:
        """Check if catalogs have been updated recently."""
        try:
            if not CATALOGS_UNIFIED_DIR.exists():
                self.alerts.append("Unified catalogs directory missing")
                return False

            catalog_files = list(CATALOGS_UNIFIED_DIR.glob("*_catalog.json"))
            if not catalog_files:
                self.alerts.append("No unified catalogs found")
                return False

            now = datetime.now()
            stale_files = []

            for catalog_file in catalog_files:
                mtime = datetime.fromtimestamp(catalog_file.stat().st_mtime)
                age_hours = (now - mtime).total_seconds() / 3600

                # Alert if catalog older than 48 hours
                if age_hours > 48:
                    stale_files.append(
                        f"{catalog_file.name} ({age_hours:.1f}h old)")

            if stale_files:
                self.alerts.append(
                    f"Stale catalogs (>48h): {', '.join(stale_files)}")
                self.status["checks"]["catalog_freshness"] = {
                    "status": "⚠️  STALE",
                    "stale_count": len(stale_files),
                    "latest_age_hours": min((now - datetime.fromtimestamp(cf.stat().st_mtime)).total_seconds() / 3600 for cf in catalog_files)
                }
                return False
            else:
                latest = max(catalog_files, key=lambda f: f.stat().st_mtime)
                latest_age = (now - datetime.fromtimestamp(
                    latest.stat().st_mtime)).total_seconds() / 3600
                self.status["checks"]["catalog_freshness"] = {
                    "status": "✅ FRESH",
                    "latest_age_hours": round(latest_age, 1),
                    "total_catalogs": len(catalog_files)
                }
                return True

        except Exception as e:
            self.alerts.append(f"Catalog freshness check failed: {e}")
            return False

    def check_primary_coverage(self) -> bool:
        """Check PRIMARY product coverage."""
        try:
            summary_file = CATALOGS_UNIFIED_DIR / "summary.json"

            if not summary_file.exists():
                logger.info(
                    "  Summary not yet generated, skipping coverage check")
                return None

            with open(summary_file) as f:
                summary = json.load(f)

            stats = summary.get("statistics", {})
            total = stats.get("total_products", 0)
            primary = stats.get("primary_products", 0)

            if total == 0:
                self.alerts.append("No products in catalog")
                return False

            coverage_pct = (primary / total) * 100

            self.status["checks"]["primary_coverage"] = {
                "status": "✅ ON_TRACK" if coverage_pct >= 80 else "⚠️  BELOW_TARGET",
                "primary_products": primary,
                "total_products": total,
                "coverage_percentage": round(coverage_pct, 2),
                "target": 80
            }

            if coverage_pct < 80:
                self.alerts.append(
                    f"PRIMARY coverage below target: {coverage_pct:.1f}% (target 80%)")
                self.status["recommendations"].append(
                    "Run enhanced brand scraper: python scripts/playwright_brand_scraper.py")
                return False
            else:
                logger.info(f"✅ PRIMARY coverage at {coverage_pct:.1f}%")
                return True

        except Exception as e:
            self.alerts.append(f"Coverage check failed: {e}")
            return False

    def check_data_integrity(self) -> bool:
        """Check data integrity and consistency."""
        try:
            issues = []
            checked_catalogs = 0

            for catalog_file in CATALOGS_UNIFIED_DIR.glob("*_catalog.json"):
                checked_catalogs += 1
                with open(catalog_file) as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError as e:
                        issues.append(
                            f"{catalog_file.name}: Invalid JSON - {e}")
                        continue

                # Check required fields
                if "products" not in data:
                    issues.append(
                        f"{catalog_file.name}: Missing 'products' field")
                    continue

                # Check product schema
                # Sample first 10
                for i, product in enumerate(data["products"][:10]):
                    if "name" not in product:
                        issues.append(
                            f"{catalog_file.name}: Product {i} missing 'name'")
                        break

            self.status["checks"]["data_integrity"] = {
                "status": "✅ OK" if not issues else "❌ ISSUES",
                "catalogs_checked": checked_catalogs,
                "issues_found": len(issues)
            }

            if issues:
                self.alerts.extend(issues)
                return False
            else:
                logger.info(
                    f"✅ Data integrity check passed ({checked_catalogs} catalogs)")
                return True

        except Exception as e:
            self.alerts.append(f"Data integrity check failed: {e}")
            return False

    def check_sync_logs(self) -> bool:
        """Check sync logs for errors."""
        try:
            log_dir = LOGS_DIR / "automation"
            if not log_dir.exists():
                logger.info(
                    "  Log directory not found, skipping sync log check")
                return None

            log_files = list(log_dir.glob("*.log"))
            recent_hours = 24
            error_count = 0
            warning_count = 0

            cutoff_time = datetime.now() - timedelta(hours=recent_hours)

            for log_file in log_files:
                mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
                if mtime < cutoff_time:
                    continue

                try:
                    with open(log_file) as f:
                        content = f.read()
                        error_count += content.count("ERROR")
                        error_count += content.count("FAILED")
                        warning_count += content.count("WARNING")
                except:
                    pass

            self.status["checks"]["sync_logs"] = {
                "status": "✅ CLEAN" if error_count == 0 else "⚠️  HAS_ERRORS",
                "errors_24h": error_count,
                "warnings_24h": warning_count
            }

            if error_count > 0:
                self.alerts.append(
                    f"Found {error_count} errors in sync logs (last 24h)")
                return False
            else:
                logger.info("✅ Sync logs clean")
                return True

        except Exception as e:
            self.alerts.append(f"Sync log check failed: {e}")
            return False

    def check_disk_space(self) -> bool:
        """Check available disk space."""
        try:
            import shutil
            stat = shutil.disk_usage(BACKEND_DIR)
            free_gb = stat.free / (1024**3)
            total_gb = stat.total / (1024**3)
            used_pct = (stat.used / stat.total) * 100

            self.status["checks"]["disk_space"] = {
                "status": "✅ OK" if free_gb > 5 else "⚠️  LOW",
                "free_gb": round(free_gb, 2),
                "total_gb": round(total_gb, 2),
                "used_percent": round(used_pct, 2)
            }

            if free_gb < 5:
                self.alerts.append(f"Low disk space: {free_gb:.1f} GB free")
                return False
            else:
                logger.info(f"✅ Disk space OK: {free_gb:.1f} GB free")
                return True

        except Exception as e:
            self.alerts.append(f"Disk space check failed: {e}")
            return False

    # ════════════════════════════════════════════════════════════
    # AUTO-RECOVERY ACTIONS
    # ════════════════════════════════════════════════════════════

    def auto_recover(self) -> bool:
        """Attempt automatic recovery from detected issues."""
        recovered = []

        # If API is down, try to restart it
        if self.status["checks"].get("api", {}).get("status") == "❌ DOWN":
            logger.info("🔄 Attempting to restart API...")
            try:
                subprocess.run([
                    "bash", "-c",
                    f"cd {BACKEND_DIR} && lsof -ti:8000 | xargs kill -9 2>/dev/null || true && sleep 2 && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &"
                ], timeout=10)
                recovered.append("API restarted")
            except Exception as e:
                logger.error(f"Failed to restart API: {e}")

        # If catalogs are stale, trigger a full sync
        if self.status["checks"].get("catalog_freshness", {}).get("status") == "⚠️  STALE":
            logger.info("🔄 Triggering full ecosystem sync...")
            try:
                subprocess.Popen([
                    self.status.get("python_bin", "python3"),
                    f"{BACKEND_DIR}/scripts/ecosystem_orchestrator.py",
                    "--mode=full"
                ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                recovered.append("Full sync triggered")
            except Exception as e:
                logger.error(f"Failed to trigger sync: {e}")

        self.status["recovery_actions"] = recovered
        return len(recovered) > 0

    # ════════════════════════════════════════════════════════════
    # ALERTING
    # ════════════════════════════════════════════════════════════

    def send_alerts(self, email_enabled: bool = False):
        """Send alerts via logging and optionally email."""
        if not self.alerts:
            return

        alert_message = "\n".join([f"  • {alert}" for alert in self.alerts])

        logger.warning(f"\n⚠️  ALERTS DETECTED ({len(self.alerts)}):")
        logger.warning(alert_message)

        # Save alerts to file
        alerts_file = LOGS_DIR / "alerts.json"
        with open(alerts_file, 'a') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "alerts": self.alerts,
                "checks": self.status["checks"]
            }, f)
            f.write("\n")

        # Email alerts if enabled
        if email_enabled and os.getenv("ALERT_EMAIL"):
            self._send_email_alert(alert_message)

    def _send_email_alert(self, message: str):
        """Send email alert."""
        try:
            email_to = os.getenv("ALERT_EMAIL")
            email_from = os.getenv("SMTP_FROM", "noreply@hsc-jit.local")
            smtp_server = os.getenv("SMTP_SERVER", "localhost")
            smtp_port = int(os.getenv("SMTP_PORT", "25"))

            msg = MIMEMultipart()
            msg['From'] = email_from
            msg['To'] = email_to
            msg['Subject'] = f"🚨 HSC-JIT Alert - {len(self.alerts)} issue(s)"

            body = f"""
            HSC-JIT PRODUCTION ALERT
            
            Time: {datetime.now().isoformat()}
            
            Issues Detected:
            {message}
            
            Recommendations:
            {chr(10).join([f"  • {rec}" for rec in self.status.get("recommendations", [])])}
            
            Check logs: {LOGS_DIR}/production_monitor.log
            """

            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.send_message(msg)
            logger.info("✉️  Alert email sent")
        except Exception as e:
            logger.error(f"Failed to send alert email: {e}")

    # ════════════════════════════════════════════════════════════
    # REPORTING
    # ════════════════════════════════════════════════════════════

    def generate_report(self) -> dict:
        """Generate comprehensive health report."""
        # Calculate overall health
        critical_checks = [
            self.status["checks"].get("api", {}).get("status") != "❌ DOWN",
            self.status["checks"].get("data_integrity", {}).get(
                "status") != "❌ ISSUES",
            self.status["checks"].get(
                "disk_space", {}).get("status") != "⚠️  LOW"
        ]

        warning_checks = [
            self.status["checks"].get("catalog_freshness", {}).get(
                "status") != "⚠️  STALE",
            self.status["checks"].get("primary_coverage", {}).get(
                "status") != "⚠️  BELOW_TARGET",
            self.status["checks"].get("sync_logs", {}).get(
                "status") != "⚠️  HAS_ERRORS"
        ]

        if not all(critical_checks):
            self.status["overall_health"] = "CRITICAL"
        elif not all(warning_checks):
            self.status["overall_health"] = "WARNING"
        else:
            self.status["overall_health"] = "HEALTHY"

        self.status["alerts"] = self.alerts
        return self.status

    def run_all_checks(self, auto_recover_enabled: bool = False, email_alerts: bool = False) -> dict:
        """Run all health checks."""
        logger.info(
            "════════════════════════════════════════════════════════════")
        logger.info("🏥 PRODUCTION HEALTH CHECK")
        logger.info(
            "════════════════════════════════════════════════════════════")

        # Run all checks
        checks_run = 0
        checks_passed = 0

        logger.info("\n1️⃣  API Connectivity...")
        if self.check_api_connectivity():
            checks_passed += 1
        checks_run += 1

        logger.info("\n2️⃣  Catalog Freshness...")
        result = self.check_catalog_freshness()
        if result is True:
            checks_passed += 1
        if result is not None:
            checks_run += 1

        logger.info("\n3️⃣  PRIMARY Coverage...")
        result = self.check_primary_coverage()
        if result is True:
            checks_passed += 1
        if result is not None:
            checks_run += 1

        logger.info("\n4️⃣  Data Integrity...")
        if self.check_data_integrity():
            checks_passed += 1
        checks_run += 1

        logger.info("\n5️⃣  Sync Logs...")
        result = self.check_sync_logs()
        if result is True:
            checks_passed += 1
        if result is not None:
            checks_run += 1

        logger.info("\n6️⃣  Disk Space...")
        if self.check_disk_space():
            checks_passed += 1
        checks_run += 1

        # Generate report
        report = self.generate_report()

        # Send alerts
        if self.alerts:
            logger.info("\n" + "="*60)
            self.send_alerts(email_enabled=email_alerts)

        # Auto-recovery
        if auto_recover_enabled and self.alerts:
            logger.info("\n" + "="*60)
            logger.info("🔧 AUTO-RECOVERY")
            logger.info("="*60)
            if self.auto_recover():
                logger.info("✅ Auto-recovery actions completed")
                logger.info("   Monitor the system over next 5 minutes")

        # Summary
        logger.info("\n" + "="*60)
        logger.info("📊 HEALTH CHECK SUMMARY")
        logger.info("="*60)
        logger.info(f"Checks Run: {checks_run}")
        logger.info(f"Checks Passed: {checks_passed}")
        logger.info(f"Overall Status: {report['overall_health']}")
        if self.alerts:
            logger.info(f"Alerts: {len(self.alerts)}")
        logger.info("="*60)

        # Save report
        report_file = LOGS_DIR / "health_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        return report


def main():
    parser = argparse.ArgumentParser(
        description='Production Monitoring System v3.5')
    parser.add_argument('--auto-recover', action='store_true',
                        help='Enable automatic recovery')
    parser.add_argument('--email-alerts', action='store_true',
                        help='Enable email alerting (requires env vars)')

    args = parser.parse_args()

    monitor = ProductionMonitor()
    report = monitor.run_all_checks(
        auto_recover_enabled=args.auto_recover,
        email_alerts=args.email_alerts
    )

    sys.exit(0 if report['overall_health'] == 'HEALTHY' else 1)


if __name__ == "__main__":
    main()
