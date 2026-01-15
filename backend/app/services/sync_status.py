"""
Sync Status Service - Provides real-time sync monitoring data for the UI
"""
from pathlib import Path
import json
import re
from datetime import datetime
from typing import Dict, Any, Optional


class SyncStatusService:
    """Service to track and report sync progress"""

    def __init__(self, base_dir: Path = None):
        if base_dir is None:
            # Default to workspace backend directory
            self.base_dir = Path(__file__).parent.parent.parent
        else:
            self.base_dir = Path(base_dir)

        self.logs_dir = self.base_dir / "logs" / "elite"
        self.data_dir = self.base_dir / "data"

    def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status across all phases"""

        status = {
            "last_updated": datetime.now().isoformat(),
            "sync_running": self._is_sync_running(),
            "phases": {
                "halilit": self._parse_halilit_status(),
                "brand_scraper": self._parse_brand_scraper_status(),
                "merge": self._parse_merge_status(),
                "gap_analysis": self._parse_gap_analysis_status()
            },
            "recent_logs": self._get_recent_logs(20)
        }

        return status

    def _is_sync_running(self) -> bool:
        """Check if sync orchestrator is currently running"""
        import subprocess
        try:
            result = subprocess.run(
                ["pgrep", "-f", "sync_orchestrator.py"],
                capture_output=True,
                text=True
            )
            return bool(result.stdout.strip())
        except Exception:
            return False

    def _parse_halilit_status(self) -> Dict[str, Any]:
        """Get Halilit sync status from actual catalog files (real-time)"""
        halilit_dir = self.data_dir / "catalogs_halilit"

        status = {
            "status": "pending",
            "products": 0,
            "brands": 0,
            "last_run": None,
            "errors": []
        }

        if not halilit_dir.exists():
            return status

        try:
            product_count = 0
            brand_count = 0
            latest_mtime = 0

            # Count products from actual catalog files
            for catalog_file in halilit_dir.glob("*_halilit.json"):
                try:
                    with open(catalog_file, 'r') as f:
                        data = json.load(f)
                        products = data.get('products', [])
                        product_count += len(products)
                        brand_count += 1

                        # Track latest modification time
                        mtime = catalog_file.stat().st_mtime
                        if mtime > latest_mtime:
                            latest_mtime = mtime
                except Exception as e:
                    status["errors"].append(
                        f"Error reading {catalog_file.name}: {str(e)}")

            status["products"] = product_count
            status["brands"] = brand_count
            status["status"] = "complete" if brand_count > 0 else "pending"

            if latest_mtime > 0:
                status["last_run"] = datetime.fromtimestamp(
                    latest_mtime).isoformat()

        except Exception as e:
            status["errors"].append(f"Error reading catalogs: {str(e)}")

        return status

    def _parse_brand_scraper_status(self) -> Dict[str, Any]:
        """Get brand website scraper status from unified catalogs"""
        unified_dir = self.data_dir / "catalogs_unified"

        status = {
            "status": "complete",
            "products": 0,
            "brands": 0,
            "current_brand": None,
            "last_run": None,
            "errors": []
        }

        try:
            brand_product_count = 0
            brands_with_data = 0
            latest_mtime = 0

            # Count brand website products from unified catalogs
            if unified_dir.exists():
                for unified_file in unified_dir.glob("*_unified.json"):
                    try:
                        with open(unified_file, 'r') as f:
                            data = json.load(f)
                            brand_count = data.get('inventory', {}).get(
                                'brand_website', {}).get('count', 0)
                            if brand_count > 0:
                                brand_product_count += brand_count
                                brands_with_data += 1

                            mtime = unified_file.stat().st_mtime
                            if mtime > latest_mtime:
                                latest_mtime = mtime
                    except Exception:
                        continue

            status["products"] = brand_product_count
            status["brands"] = brands_with_data

            if latest_mtime > 0:
                status["last_run"] = datetime.fromtimestamp(
                    latest_mtime).isoformat()

        except Exception as e:
            status["errors"].append(f"Error reading catalogs: {str(e)}")

        return status

    def _parse_merge_status(self) -> Dict[str, Any]:
        """Get catalog merge status from actual unified catalog files"""
        unified_dir = self.data_dir / "catalogs_unified"
        catalogs_dir = self.data_dir / "catalogs"

        status = {
            "status": "pending",
            "total_products": 0,
            "primary_products": 0,
            "secondary_products": 0,
            "last_run": None,
            "errors": []
        }

        try:
            total_products = 0
            primary_count = 0
            latest_mtime = 0

            # Count from flattened catalogs
            if catalogs_dir.exists():
                for catalog_file in catalogs_dir.glob("*_catalog.json"):
                    try:
                        with open(catalog_file, 'r') as f:
                            data = json.load(f)
                            products = data.get('products', [])
                            total_products += len(products)

                            # Track latest modification time
                            mtime = catalog_file.stat().st_mtime
                            if mtime > latest_mtime:
                                latest_mtime = mtime
                    except Exception as e:
                        status["errors"].append(
                            f"Error reading {catalog_file.name}: {str(e)}")

            # Get primary/secondary split from unified catalogs
            if unified_dir.exists():
                for unified_file in unified_dir.glob("*_unified.json"):
                    try:
                        with open(unified_file, 'r') as f:
                            data = json.load(f)
                            halilit_count = data.get('inventory', {}).get(
                                'halilit', {}).get('count', 0)
                            primary_count += halilit_count
                    except Exception:
                        pass

            status["total_products"] = total_products
            status["primary_products"] = primary_count
            status["secondary_products"] = total_products - primary_count
            status["status"] = "complete" if total_products > 0 else "pending"

            if latest_mtime > 0:
                status["last_run"] = datetime.fromtimestamp(
                    latest_mtime).isoformat()

        except Exception as e:
            status["errors"].append(f"Error reading catalogs: {str(e)}")

        return status

        return status

    def _parse_gap_analysis_status(self) -> Dict[str, Any]:
        """Parse gap analysis for status"""
        gap_dir = self.data_dir / "gap_analysis"

        status = {
            "status": "pending",
            "brands_analyzed": 0,
            "total_gaps": 0,
            "last_run": None,
            "errors": []
        }

        if not gap_dir.exists():
            return status

        try:
            # Count gap analysis files
            gap_files = list(gap_dir.glob("*_gap_analysis.json"))
            status["brands_analyzed"] = len(gap_files)

            # Count total gaps
            total_gaps = 0
            for gap_file in gap_files:
                try:
                    with open(gap_file, 'r') as f:
                        data = json.load(f)
                        if isinstance(data, dict) and "gaps" in data:
                            total_gaps += len(data["gaps"])
                except Exception:
                    continue

            status["total_gaps"] = total_gaps

            if gap_files:
                status["status"] = "complete"
                # Get most recent file modification time
                latest_file = max(gap_files, key=lambda f: f.stat().st_mtime)
                status["last_run"] = datetime.fromtimestamp(
                    latest_file.stat().st_mtime
                ).isoformat()

        except Exception as e:
            status["errors"].append(f"Error parsing gap analysis: {str(e)}")

        return status

    def _get_recent_logs(self, num_lines: int = 20) -> list:
        """Get recent log entries from orchestrator"""
        log_file = self.logs_dir / "sync_orchestrator.log"

        if not log_file.exists():
            return []

        try:
            with open(log_file, 'r') as f:
                lines = f.readlines()

            # Return last N lines
            return [line.strip() for line in lines[-num_lines:] if line.strip()]

        except Exception:
            return []
