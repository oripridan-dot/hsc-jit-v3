#!/usr/bin/env python3
"""
ELITE PERFORMANCE DASHBOARD
Real-time monitoring view with auto-refresh showing system health.
"""

import json
import subprocess
from pathlib import Path
from datetime import datetime
import time

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
LOGS_DIR = BACKEND_DIR / "logs"


class EliteDashboard:
    """Real-time system health dashboard"""

    def __init__(self):
        self.backend_dir = BACKEND_DIR
        self.data_dir = DATA_DIR
        self.logs_dir = LOGS_DIR

    def get_last_sync(self):
        """Get last sync results"""
        sync_results = DATA_DIR / "sync_results.json"
        if sync_results.exists():
            with open(sync_results) as f:
                return json.load(f)
        return None

    def get_health_status(self):
        """Get current health status"""
        health_file = DATA_DIR / "catalogs_unified" / "health_check.json"
        if health_file.exists():
            with open(health_file) as f:
                return json.load(f)
        return None

    def get_catalog_stats(self):
        """Get unified catalog statistics"""
        summary_file = DATA_DIR / "catalogs_unified" / "summary.json"
        if summary_file.exists():
            with open(summary_file) as f:
                return json.load(f)
        return None

    def get_log_tail(self, log_file, lines=5):
        """Get last N lines of a log file"""
        try:
            log_path = LOGS_DIR / log_file
            if log_path.exists():
                with open(log_path) as f:
                    content = f.readlines()
                    return content[-lines:]
        except:
            pass
        return []

    def print_header(self):
        """Print dashboard header"""
        print("\n" + "=" * 100)
        print("🎯 ELITE PERFORMANCE DASHBOARD")
        print("=" * 100)

    def print_sync_status(self, sync_results):
        """Print last sync results"""
        if not sync_results:
            print("\n📊 SYNC STATUS: No sync data yet")
            return

        print("\n📊 LAST SYNC RESULTS")
        print("-" * 100)

        phases = sync_results.get("phases", {})
        print(f"Started:  {sync_results.get('start_time', 'N/A')}")
        print(f"Ended:    {sync_results.get('end_time', 'N/A')}")
        print(
            f"Duration: {sync_results.get('duration_seconds', 0):.1f} seconds")

        print("\nPhase Results:")
        for phase, data in phases.items():
            status = data.get("status", "unknown").upper()
            duration = data.get("duration", 0)
            products = data.get("product_count", data.get("total_products", 0))

            status_emoji = {
                "COMPLETED": "✅",
                "FAILED": "❌",
                "TIMEOUT": "⏱️ ",
                "PENDING": "⏳",
                "ERROR": "❌"
            }.get(status, "❓")

            print(
                f"  {status_emoji} {phase:20} {status:10} ({products:,} products, {duration:.1f}s)")

        summary = sync_results.get("summary", {})
        if summary:
            print(f"\nFinal Catalog:")
            print(
                f"  📦 Total:     {summary.get('total_products', 0):,} products")
            print(
                f"  🌟 PRIMARY:   {summary.get('primary', 0):,} (both sources)")
            print(
                f"  📌 SECONDARY: {summary.get('secondary', 0):,} (brand-only)")
            print(f"  📈 Coverage:  {summary.get('coverage', 'N/A')}")

        errors = sync_results.get("errors", [])
        if errors:
            print(f"\n⚠️  ERRORS ({len(errors)}):")
            for error in errors[:5]:
                print(f"  - {error}")

    def print_health_status(self, health):
        """Print health check results"""
        if not health:
            print("\n🔍 HEALTH STATUS: No health data yet")
            return

        print("\n🏥 HEALTH CHECK STATUS")
        print("-" * 100)

        print(f"Halilit:      {health.get('halilit_sync', 'UNKNOWN')}")
        print(f"Brand Sites:  {health.get('brand_sync', 'UNKNOWN')}")
        print(f"Merge:        {health.get('merge_status', 'UNKNOWN')}")

        issues = health.get("issues", [])
        if issues:
            print(f"\n⚠️  DETECTED ISSUES ({len(issues)}):")
            for issue in issues:
                print(f"  - {issue}")

        recovered = health.get("recovered", [])
        if recovered:
            print(f"\n✅ AUTO-RECOVERED ({len(recovered)}):")
            for recovery in recovered:
                print(f"  - {recovery}")

    def print_catalog_stats(self, stats):
        """Print catalog statistics"""
        if not stats:
            print("\n📦 CATALOG STATS: No catalog data yet")
            return

        print("\n📦 CATALOG STATISTICS")
        print("-" * 100)

        catalog_stats = stats.get("statistics", {})
        print(f"Total Products:    {catalog_stats.get('total_products', 0):,}")
        print(
            f"PRIMARY Products:  {catalog_stats.get('primary_products', 0):,}")
        print(
            f"SECONDARY Products: {catalog_stats.get('secondary_products', 0):,}")

        brands = stats.get("brands", {})
        if brands:
            print(f"\nBrand Coverage ({len(brands)} brands):")
            for brand, data in sorted(brands.items(), key=lambda x: x[1].get("total", 0), reverse=True)[:10]:
                primary = data.get("primary", 0)
                secondary = data.get("secondary", 0)
                total = data.get("total", 0)
                print(
                    f"  {brand:20} {total:,} total (PRIMARY: {primary:,}, SECONDARY: {secondary:,})")

    def print_logs_preview(self):
        """Print preview of recent logs"""
        print("\n📋 RECENT LOG ENTRIES")
        print("-" * 100)

        print("\nOrchestrator Log (last 3 lines):")
        for line in self.get_log_tail("hsc-sync-orchestrator.log", 3):
            print(f"  {line.rstrip()}")

        print("\nMonitor Log (last 3 lines):")
        for line in self.get_log_tail("hsc-jit-monitor.log", 3):
            print(f"  {line.rstrip()}")

    def print_commands(self):
        """Print helpful commands"""
        print("\n🎮 QUICK COMMANDS")
        print("-" * 100)
        print("Monitor health (with auto-recovery):")
        print("  python scripts/elite_monitor.py")
        print("")
        print("Run full sync cycle manually:")
        print("  python scripts/sync_orchestrator.py")
        print("")
        print("View log files:")
        print("  tail -f logs/hsc-sync-orchestrator.log")
        print("  tail -f logs/hsc-jit-monitor.log")
        print("")
        print("Check cron schedule:")
        print("  crontab -l | grep 'sync\\|harvest\\|merge'")

    def render(self):
        """Render full dashboard"""
        self.print_header()

        sync_results = self.get_last_sync()
        health = self.get_health_status()
        stats = self.get_catalog_stats()

        self.print_sync_status(sync_results)
        self.print_health_status(health)
        self.print_catalog_stats(stats)
        self.print_logs_preview()
        self.print_commands()

        print("\n" + "=" * 100)
        print(f"Last Updated: {datetime.now().isoformat()}")
        print("=" * 100 + "\n")


if __name__ == "__main__":
    dashboard = EliteDashboard()
    dashboard.render()
