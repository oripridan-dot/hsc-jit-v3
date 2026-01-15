#!/usr/bin/env python3
"""
REAL-TIME SYNC MONITORING
Watch sync progress, gap analysis, and system health in real-time.
"""

import sys
import time
import json
from pathlib import Path
from datetime import datetime
import subprocess
import os

BACKEND_DIR = Path(__file__).parent.parent
LOGS_DIR = BACKEND_DIR / "logs"
DATA_DIR = BACKEND_DIR / "data"


class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def clear_screen():
    """Clear terminal screen"""
    os.system('clear' if os.name != 'nt' else 'cls')


def print_header():
    """Print monitoring header"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}🔄 REAL-TIME SYNC MONITORING{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.ENDC}\n")


def get_file_tail(file_path, lines=5):
    """Get last N lines of a file"""
    try:
        if file_path.exists():
            with open(file_path) as f:
                all_lines = f.readlines()
                return all_lines[-lines:] if all_lines else []
    except:
        pass
    return []


def parse_sync_status():
    """Parse current sync status from logs"""
    status = {
        "halilit": {"running": False, "products": 0, "brands": 0, "errors": []},
        "brand_scraper": {"running": False, "products": 0, "brands": 0, "errors": []},
        "merge": {"running": False, "total": 0, "primary": 0, "secondary": 0},
        "gap_analysis": {"running": False, "brands_analyzed": 0}
    }

    # Check orchestrator log
    orchestrator_log = LOGS_DIR / "hsc-sync-orchestrator.log"
    if orchestrator_log.exists():
        with open(orchestrator_log) as f:
            content = f.read()
            if "HALILIT" in content and "Starting" in content:
                status["halilit"]["running"] = True
            if "BRAND_WEBSITES" in content and "Starting" in content:
                status["brand_scraper"]["running"] = True
            if "MERGE" in content and "Starting" in content:
                status["merge"]["running"] = True

    # Check Halilit log
    halilit_log = LOGS_DIR / "halilit-sync.log"
    if halilit_log.exists():
        with open(halilit_log) as f:
            for line in f:
                if "Scraped" in line or "products found" in line:
                    try:
                        # Extract product count
                        parts = line.split()
                        for i, part in enumerate(parts):
                            if part.isdigit() and int(part) > 0:
                                status["halilit"]["products"] += int(part)
                                status["halilit"]["brands"] += 1
                                break
                    except:
                        pass
                if "ERROR" in line or "FAILED" in line:
                    status["halilit"]["errors"].append(line.strip()[-50:])

    # Check brand scraper log
    brand_log = LOGS_DIR / "brand-sync.log"
    if brand_log.exists():
        with open(brand_log) as f:
            for line in f:
                if "products found" in line:
                    try:
                        parts = line.split()
                        if parts[0].isdigit():
                            status["brand_scraper"]["products"] += int(
                                parts[0])
                            status["brand_scraper"]["brands"] += 1
                    except:
                        pass
                if "ERROR" in line or "FAILED" in line:
                    status["brand_scraper"]["errors"].append(
                        line.strip()[-50:])

    # Check merge summary
    summary_file = DATA_DIR / "catalogs_unified" / "summary.json"
    if summary_file.exists():
        try:
            with open(summary_file) as f:
                summary = json.load(f)
                stats = summary.get("statistics", {})
                status["merge"]["total"] = stats.get("total_products", 0)
                status["merge"]["primary"] = stats.get("primary_products", 0)
                status["merge"]["secondary"] = stats.get(
                    "secondary_products", 0)
        except:
            pass

    # Check for gap analysis
    gap_files = list((DATA_DIR / "gap_analysis").glob("*_gap.json")
                     ) if (DATA_DIR / "gap_analysis").exists() else []
    status["gap_analysis"]["brands_analyzed"] = len(gap_files)

    return status


def print_phase_status(name, data, is_running):
    """Print status for a single phase"""
    if is_running:
        symbol = f"{Colors.OKCYAN}⏳{Colors.ENDC}"
        status_text = f"{Colors.OKCYAN}RUNNING{Colors.ENDC}"
    elif data.get("products", 0) > 0 or data.get("total", 0) > 0:
        symbol = f"{Colors.OKGREEN}✅{Colors.ENDC}"
        status_text = f"{Colors.OKGREEN}COMPLETE{Colors.ENDC}"
    else:
        symbol = "⏹️ "
        status_text = "PENDING"

    print(f"{symbol} {Colors.BOLD}{name:20}{Colors.ENDC} {status_text}")

    if name == "Halilit Sync":
        if data["products"] > 0:
            print(
                f"   ├─ Products: {Colors.OKGREEN}{data['products']:,}{Colors.ENDC}")
            print(
                f"   └─ Brands: {Colors.OKGREEN}{data['brands']}{Colors.ENDC}")
        if data["errors"]:
            print(
                f"   └─ {Colors.FAIL}Errors: {len(data['errors'])}{Colors.ENDC}")

    elif name == "Brand Scraper":
        if data["products"] > 0:
            print(
                f"   ├─ Products: {Colors.OKGREEN}{data['products']:,}{Colors.ENDC}")
            print(
                f"   └─ Brands: {Colors.OKGREEN}{data['brands']}{Colors.ENDC}")
        if data["errors"]:
            print(
                f"   └─ {Colors.FAIL}Errors: {len(data['errors'])}{Colors.ENDC}")

    elif name == "Merge":
        if data["total"] > 0:
            print(
                f"   ├─ Total: {Colors.OKGREEN}{data['total']:,}{Colors.ENDC}")
            print(
                f"   ├─ PRIMARY: {Colors.OKCYAN}{data['primary']:,}{Colors.ENDC}")
            print(
                f"   └─ SECONDARY: {Colors.WARNING}{data['secondary']:,}{Colors.ENDC}")

    elif name == "Gap Analysis":
        if data["brands_analyzed"] > 0:
            print(
                f"   └─ Brands: {Colors.OKGREEN}{data['brands_analyzed']}{Colors.ENDC}")


def print_recent_logs():
    """Print recent log entries"""
    print(f"\n{Colors.BOLD}📋 Recent Log Entries:{Colors.ENDC}")
    print("-" * 80)

    # Orchestrator
    orchestrator_lines = get_file_tail(
        LOGS_DIR / "hsc-sync-orchestrator.log", 3)
    if orchestrator_lines:
        print(f"\n{Colors.OKBLUE}Orchestrator:{Colors.ENDC}")
        for line in orchestrator_lines:
            print(f"  {line.rstrip()}")

    # Halilit
    halilit_lines = get_file_tail(LOGS_DIR / "halilit-sync.log", 2)
    if halilit_lines:
        print(f"\n{Colors.OKBLUE}Halilit:{Colors.ENDC}")
        for line in halilit_lines:
            if line.strip():
                print(f"  {line.rstrip()}")

    # Brand scraper
    brand_lines = get_file_tail(LOGS_DIR / "brand-sync.log", 2)
    if brand_lines:
        print(f"\n{Colors.OKBLUE}Brand Scraper:{Colors.ENDC}")
        for line in brand_lines:
            if line.strip():
                print(f"  {line.rstrip()}")


def check_sync_running():
    """Check if sync is currently running"""
    try:
        result = subprocess.run(
            ["ps", "aux"],
            capture_output=True,
            text=True
        )
        return "sync_orchestrator" in result.stdout or "master_sync" in result.stdout
    except:
        return False


def watch_sync(refresh_interval=3):
    """Watch sync progress in real-time"""
    try:
        while True:
            clear_screen()
            print_header()

            # Parse current status
            status = parse_sync_status()
            sync_running = check_sync_running()

            # Print sync status
            print(f"{Colors.BOLD}🔄 Sync Phases:{Colors.ENDC}")
            print("-" * 80)
            print_phase_status(
                "Halilit Sync", status["halilit"], status["halilit"]["running"])
            print_phase_status(
                "Brand Scraper", status["brand_scraper"], status["brand_scraper"]["running"])
            print_phase_status(
                "Merge", status["merge"], status["merge"]["running"])
            print_phase_status(
                "Gap Analysis", status["gap_analysis"], status["gap_analysis"]["running"])

            # Print recent logs
            print_recent_logs()

            # Print sync status
            print(f"\n{Colors.BOLD}Status:{Colors.ENDC}", end=" ")
            if sync_running:
                print(f"{Colors.OKCYAN}Sync process is RUNNING{Colors.ENDC}")
            else:
                if status["halilit"]["products"] > 0 or status["merge"]["total"] > 0:
                    print(f"{Colors.OKGREEN}Sync COMPLETED{Colors.ENDC}")
                else:
                    print(f"{Colors.WARNING}No active sync{Colors.ENDC}")

            # Print footer
            print(f"\n{Colors.BOLD}{'='*80}{Colors.ENDC}")
            print(
                f"Last updated: {datetime.now().strftime('%H:%M:%S')} | Press Ctrl+C to exit")
            print(f"Refreshing every {refresh_interval} seconds...")

            time.sleep(refresh_interval)

    except KeyboardInterrupt:
        print(f"\n\n{Colors.OKGREEN}Monitoring stopped.{Colors.ENDC}\n")
        sys.exit(0)


def tail_logs(log_file, lines=50):
    """Tail specific log file"""
    file_path = LOGS_DIR / log_file
    if not file_path.exists():
        print(f"{Colors.FAIL}Log file not found: {log_file}{Colors.ENDC}")
        return

    print(f"\n{Colors.BOLD}📋 Tailing {log_file}:{Colors.ENDC}")
    print("=" * 80)

    # Show last N lines
    recent_lines = get_file_tail(file_path, lines)
    for line in recent_lines:
        print(line.rstrip())

    print("\n" + "=" * 80)
    print(f"{Colors.OKGREEN}Following live updates... (Ctrl+C to stop){Colors.ENDC}\n")

    # Follow new lines
    try:
        with open(file_path) as f:
            f.seek(0, 2)  # Go to end
            while True:
                line = f.readline()
                if line:
                    print(line.rstrip())
                else:
                    time.sleep(0.5)
    except KeyboardInterrupt:
        print(f"\n{Colors.OKGREEN}Stopped tailing.{Colors.ENDC}\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Real-time sync monitoring")
    parser.add_argument("--tail", help="Tail specific log file", choices=[
        "hsc-sync-orchestrator.log",
        "halilit-sync.log",
        "brand-sync.log",
        "merge-sync.log",
        "hsc-jit-monitor.log"
    ])
    parser.add_argument("--lines", type=int, default=50,
                        help="Number of lines to show in tail mode")
    parser.add_argument("--refresh", type=int, default=3,
                        help="Refresh interval in seconds")

    args = parser.parse_args()

    if args.tail:
        tail_logs(args.tail, args.lines)
    else:
        watch_sync(args.refresh)
