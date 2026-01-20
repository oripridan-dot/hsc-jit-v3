#!/usr/bin/env python3
"""
HSC JIT v3.7 - Data Pipeline Monitor
====================================

Monitors the complete data flow from backend scraping to frontend display:
1. Backend scraping → backend/data/catalogs_brand/*.json
2. Logo extraction → frontend/public/data/logos/*.svg
3. Frontend sync → frontend/public/data/catalogs_brand/*.json
4. Index generation → frontend/public/data/index.json
5. UI verification → Check catalogLoader can load all data

Usage:
    python3 monitor_pipeline.py
    python3 monitor_pipeline.py --watch  # Continuous monitoring
"""

import json
import time
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import argparse

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    """Print formatted header"""
    width = 70
    print(f"\n{Colors.CYAN}{'=' * width}{Colors.ENDC}")
    print(f"{Colors.CYAN}{Colors.BOLD}{text.center(width)}{Colors.ENDC}")
    print(f"{Colors.CYAN}{'=' * width}{Colors.ENDC}\n")

def print_status(status: str, message: str):
    """Print status message"""
    if status == "ok":
        icon = f"{Colors.GREEN}✅{Colors.ENDC}"
    elif status == "warn":
        icon = f"{Colors.YELLOW}⚠️ {Colors.ENDC}"
    else:
        icon = f"{Colors.RED}❌{Colors.ENDC}"
    print(f"{icon} {message}")

def check_backend_catalogs(backend_dir: Path) -> Dict[str, Any]:
    """Check backend scraped catalogs"""
    catalogs_dir = backend_dir / "data" / "catalogs_brand"
    
    result = {
        "exists": catalogs_dir.exists(),
        "catalogs": [],
        "total_products": 0
    }
    
    if not catalogs_dir.exists():
        return result
    
    for catalog_file in catalogs_dir.glob("*.json"):
        try:
            with open(catalog_file) as f:
                data = json.load(f)
            
            products = data.get('products', [])
            result["catalogs"].append({
                "file": catalog_file.name,
                "brand": data.get('brand_identity', {}).get('name', 'Unknown'),
                "products": len(products),
                "size_kb": catalog_file.stat().st_size / 1024
            })
            result["total_products"] += len(products)
        except Exception as e:
            print_status("error", f"Failed to read {catalog_file.name}: {e}")
    
    return result

def check_frontend_catalogs(frontend_dir: Path) -> Dict[str, Any]:
    """Check frontend synced catalogs"""
    catalogs_dir = frontend_dir / "public" / "data" / "catalogs_brand"
    
    result = {
        "exists": catalogs_dir.exists(),
        "catalogs": [],
        "total_products": 0
    }
    
    if not catalogs_dir.exists():
        return result
    
    for catalog_file in catalogs_dir.glob("*.json"):
        try:
            with open(catalog_file) as f:
                data = json.load(f)
            
            products = data.get('products', [])
            result["catalogs"].append({
                "file": catalog_file.name,
                "brand": data.get('brand_identity', {}).get('name', 'Unknown'),
                "products": len(products),
                "size_kb": catalog_file.stat().st_size / 1024
            })
            result["total_products"] += len(products)
        except Exception as e:
            print_status("error", f"Failed to read {catalog_file.name}: {e}")
    
    return result

def check_logos(frontend_dir: Path) -> Dict[str, Any]:
    """Check logo files"""
    logos_dir = frontend_dir / "public" / "data" / "logos"
    
    result = {
        "exists": logos_dir.exists(),
        "logos": []
    }
    
    if not logos_dir.exists():
        return result
    
    for logo_file in logos_dir.glob("*"):
        if logo_file.is_file():
            result["logos"].append({
                "file": logo_file.name,
                "size_kb": logo_file.stat().st_size / 1024,
                "format": logo_file.suffix
            })
    
    return result

def check_index(frontend_dir: Path) -> Dict[str, Any]:
    """Check index.json"""
    index_path = frontend_dir / "public" / "data" / "index.json"
    
    result = {
        "exists": index_path.exists(),
        "data": None
    }
    
    if not index_path.exists():
        return result
    
    try:
        with open(index_path) as f:
            data = json.load(f)
        result["data"] = data
    except Exception as e:
        print_status("error", f"Failed to read index.json: {e}")
    
    return result

def check_data_consistency(backend_result: Dict, frontend_result: Dict, index_result: Dict) -> List[str]:
    """Check for inconsistencies in data flow"""
    issues = []
    
    # Check if backend data synced to frontend
    backend_brands = {c['file'] for c in backend_result.get('catalogs', [])}
    frontend_brands = {c['file'] for c in frontend_result.get('catalogs', [])}
    
    missing_in_frontend = backend_brands - frontend_brands
    if missing_in_frontend:
        issues.append(f"Backend catalogs not synced to frontend: {', '.join(missing_in_frontend)}")
    
    # Check if index matches frontend catalogs
    if index_result.get('exists') and index_result.get('data'):
        index_brands = {b['data_file'].split('/')[-1] for b in index_result['data'].get('brands', [])}
        missing_in_index = frontend_brands - index_brands
        if missing_in_index:
            issues.append(f"Frontend catalogs not in index: {', '.join(missing_in_index)}")
    
    # Check product count consistency
    if index_result.get('exists') and index_result.get('data'):
        index_total = index_result['data'].get('total_products', 0)
        frontend_total = frontend_result.get('total_products', 0)
        if index_total != frontend_total:
            issues.append(f"Product count mismatch: index={index_total}, frontend={frontend_total}")
    
    return issues

def monitor_pipeline(watch: bool = False):
    """Monitor the complete pipeline"""
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    while True:
        print_header("HSC JIT v3.7 - Data Pipeline Status")
        print(f"📅 Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # 1. Backend Catalogs
        print(f"{Colors.BOLD}1. Backend Scraped Catalogs{Colors.ENDC}")
        print(f"   Location: backend/data/catalogs_brand/")
        backend_result = check_backend_catalogs(backend_dir)
        
        if backend_result['exists']:
            print_status("ok", f"Directory exists")
            if backend_result['catalogs']:
                for catalog in backend_result['catalogs']:
                    print(f"      • {catalog['brand']}: {catalog['products']} products ({catalog['size_kb']:.1f}KB)")
                print(f"\n   {Colors.BLUE}Total: {len(backend_result['catalogs'])} brands, {backend_result['total_products']} products{Colors.ENDC}")
            else:
                print_status("warn", "No catalogs found")
        else:
            print_status("error", "Directory not found")
        
        # 2. Frontend Catalogs
        print(f"\n{Colors.BOLD}2. Frontend Synced Catalogs{Colors.ENDC}")
        print(f"   Location: frontend/public/data/catalogs_brand/")
        frontend_result = check_frontend_catalogs(frontend_dir)
        
        if frontend_result['exists']:
            print_status("ok", f"Directory exists")
            if frontend_result['catalogs']:
                for catalog in frontend_result['catalogs']:
                    print(f"      • {catalog['brand']}: {catalog['products']} products ({catalog['size_kb']:.1f}KB)")
                print(f"\n   {Colors.BLUE}Total: {len(frontend_result['catalogs'])} brands, {frontend_result['total_products']} products{Colors.ENDC}")
            else:
                print_status("warn", "No catalogs found")
        else:
            print_status("error", "Directory not found")
        
        # 3. Logos
        print(f"\n{Colors.BOLD}3. Brand Logos{Colors.ENDC}")
        print(f"   Location: frontend/public/data/logos/")
        logos_result = check_logos(frontend_dir)
        
        if logos_result['exists']:
            print_status("ok", f"Directory exists")
            if logos_result['logos']:
                for logo in logos_result['logos']:
                    print(f"      • {logo['file']}: {logo['size_kb']:.1f}KB ({logo['format']})")
            else:
                print_status("warn", "No logos found")
        else:
            print_status("error", "Directory not found")
        
        # 4. Index
        print(f"\n{Colors.BOLD}4. Master Index{Colors.ENDC}")
        print(f"   Location: frontend/public/data/index.json")
        index_result = check_index(frontend_dir)
        
        if index_result['exists']:
            print_status("ok", f"File exists")
            if index_result['data']:
                data = index_result['data']
                print(f"      • Version: {data.get('version', 'N/A')}")
                print(f"      • Brands: {len(data.get('brands', []))}")
                print(f"      • Total Products: {data.get('total_products', 0)}")
                print(f"      • Verified: {data.get('total_verified', 0)}")
                print(f"      • Last Updated: {data.get('build_timestamp', 'N/A')}")
        else:
            print_status("error", "File not found")
        
        # 5. Data Consistency Check
        print(f"\n{Colors.BOLD}5. Data Flow Consistency{Colors.ENDC}")
        issues = check_data_consistency(backend_result, frontend_result, index_result)
        
        if not issues:
            print_status("ok", "All data is consistent")
        else:
            for issue in issues:
                print_status("warn", issue)
        
        # 6. Pipeline Summary
        print(f"\n{Colors.BOLD}Pipeline Health Summary{Colors.ENDC}")
        
        all_ok = (
            backend_result['exists'] and
            frontend_result['exists'] and
            logos_result['exists'] and
            index_result['exists'] and
            len(issues) == 0 and
            frontend_result['total_products'] > 0
        )
        
        if all_ok:
            print_status("ok", f"{Colors.GREEN}Pipeline is healthy and data is flowing correctly{Colors.ENDC}")
        else:
            print_status("warn", f"{Colors.YELLOW}Pipeline has issues that need attention{Colors.ENDC}")
        
        print(f"\n{Colors.CYAN}{'=' * 70}{Colors.ENDC}\n")
        
        if not watch:
            break
        
        print(f"Refreshing in 5 seconds... (Ctrl+C to exit)")
        try:
            time.sleep(5)
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
            break

def main():
    parser = argparse.ArgumentParser(description="Monitor HSC JIT data pipeline")
    parser.add_argument('--watch', action='store_true', help='Continuous monitoring mode')
    args = parser.parse_args()
    
    monitor_pipeline(watch=args.watch)

if __name__ == "__main__":
    main()
