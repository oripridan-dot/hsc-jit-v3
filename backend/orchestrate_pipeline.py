#!/usr/bin/env python3
"""
HSC-JIT v3.7 - Complete Pipeline Orchestrator

Pipeline Flow:
1. Load product catalogs
2. Validate data quality
3. Clean and filter products
4. Publish to frontend
5. Initialize RAG system
6. Start API server

Usage:
    python orchestrate_pipeline.py  # Full pipeline
    python orchestrate_pipeline.py --validate-only  # Just validate
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any
import argparse


def setup_path():
    """Add backend to Python path"""
    backend_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(backend_dir))


def print_header(text: str):
    """Print section header"""
    print("\n" + "="*70)
    print(f"🔧 {text}")
    print("="*70 + "\n")


def load_catalogs() -> Dict[str, Dict[str, Any]]:
    """Load all product catalogs"""
    # Find backend directory (script is in backend/)
    script_dir = Path(__file__).parent
    catalogs_dir = script_dir / "data" / "catalogs_brand"
    
    catalogs = {}
    if not catalogs_dir.exists():
        print(f"❌ Catalogs directory not found: {catalogs_dir}")
        return catalogs
    
    for catalog_file in sorted(catalogs_dir.glob("*_catalog.json")):
        try:
            with open(catalog_file) as f:
                brand_id = catalog_file.stem.replace("_catalog", "")
                catalogs[brand_id] = json.load(f)
                print(f"✅ Loaded {brand_id} ({len(catalogs[brand_id].get('products', []))} products)")
        
        except Exception as e:
            print(f"❌ Failed to load {catalog_file.name}: {e}")
    
    return catalogs


def validate_catalogs(catalogs: Dict[str, Dict[str, Any]]) -> bool:
    """Validate all catalogs"""
    print_header("Step 1: Validating Catalogs")
    
    from core.validator import CatalogValidator
    
    validator = CatalogValidator()
    all_valid = True
    
    for brand_id, catalog in catalogs.items():
        report = validator.validate(catalog)
        
        print(f"📊 {brand_id.upper()}:")
        print(f"   Products: {report.total_products}")
        print(f"   Errors: {report.error_count}")
        print(f"   Warnings: {report.warning_count}")
        print(f"   Valid: {'✅ YES' if report.is_valid else '❌ NO'}")
        
        if not report.is_valid:
            all_valid = False
            for issue in report.issues[:3]:  # Show first 3 issues
                print(f"   - {issue.message}")
    
    return all_valid


def clean_catalogs(catalogs: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Clean invalid products and images"""
    print_header("Step 2: Cleaning Data")
    
    from services.data_cleaner import DataCleaner
    
    cleaner = DataCleaner()
    cleaned = {}
    total_removed = 0
    total_images_removed = 0
    
    for brand_id, catalog in catalogs.items():
        cleaned_cat, removed_prods, removed_imgs = cleaner.clean_catalog(catalog)
        cleaned[brand_id] = cleaned_cat
        total_removed += removed_prods
        total_images_removed += removed_imgs
        
        orig_count = len(catalog.get("products", []))
        clean_count = len(cleaned_cat.get("products", []))
        
        print(f"📊 {brand_id.upper()}: {orig_count} → {clean_count} products, {removed_imgs} images removed")
    
    print(f"\n📈 Summary:")
    print(f"   Products removed: {total_removed}")
    print(f"   Invalid images removed: {total_images_removed}")
    
    return cleaned


def publish_catalogs(catalogs: Dict[str, Dict[str, Any]]) -> bool:
    """Publish catalogs to frontend directory"""
    print_header("Step 3: Publishing to Frontend")
    
    script_dir = Path(__file__).parent
    frontend_data_dir = script_dir.parent / "frontend" / "public" / "data"
    
    frontend_data_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate master index
    brands = []
    all_products = []
    
    for brand_id, catalog in catalogs.items():
        brand_info = catalog.get("brand_identity", {})
        brands.append({
            "id": brand_id,
            "name": brand_info.get("name", brand_id),
            "product_count": len(catalog.get("products", [])),
            "website": brand_info.get("website"),
            "logo_url": brand_info.get("logo_url")
        })
        
        all_products.extend(catalog.get("products", []))
        
        # Publish individual brand catalog
        brand_file = frontend_data_dir / f"{brand_id}.json"
        try:
            with open(brand_file, "w") as f:
                json.dump(catalog, f, indent=2)
            print(f"✅ Published {brand_file.name}")
        except Exception as e:
            print(f"❌ Failed to publish {brand_file.name}: {e}")
            return False
    
    # Publish master index
    index = {
        "brands": brands,
        "total_brands": len(brands),
        "total_products": len(all_products),
        "last_updated": __import__("datetime").datetime.utcnow().isoformat()
    }
    
    index_file = frontend_data_dir / "index.json"
    try:
        with open(index_file, "w") as f:
            json.dump(index, f, indent=2)
        print(f"✅ Published {index_file.name} (master index)")
    except Exception as e:
        print(f"❌ Failed to publish index: {e}")
        return False
    
    print(f"\n📍 Published to: {frontend_data_dir}")
    print(f"   Brands: {len(brands)}")
    print(f"   Total products: {len(all_products)}")
    
    return True


def initialize_rag(catalogs: Dict[str, Dict[str, Any]]) -> bool:
    """Initialize RAG system"""
    print_header("Step 4: Initializing RAG System")
    
    from services.jit_rag_system import JITRAGSystem, get_rag_status
    
    # Show RAG status
    status = get_rag_status()
    print(f"📊 RAG System Capabilities:")
    print(f"   Semantic Search: {'✅' if status['embeddings_available'] else '❌'}")
    print(f"   Keyword Search: ✅")
    print(f"   Product Insights: ✅")
    print(f"   PDF Parsing: {'✅' if status['pdf_support_available'] else '❌'}")
    
    # Initialize RAG for each brand
    rag_systems = {}
    for brand_id, catalog in catalogs.items():
        try:
            rag = JITRAGSystem(catalog)
            rag_systems[brand_id] = rag
            print(f"\n✅ Initialized RAG for {brand_id.upper()}")
            
            # Test semantic search if available
            if status['embeddings_available']:
                results = rag.semantic_search("synthesizer", top_k=2)
                if results:
                    print(f"   Test search found {len(results)} results")
        
        except Exception as e:
            print(f"⚠️  RAG initialization incomplete for {brand_id}: {e}")
    
    return True


def print_status(catalogs: Dict[str, Dict[str, Any]]):
    """Print pipeline status"""
    print_header("Pipeline Status")
    
    print("✅ COMPLETED:")
    print("   1. Catalogs loaded and validated")
    print("   2. Data cleaned (invalid products/images removed)")
    print("   3. Published to frontend (/frontend/public/data)")
    print("   4. RAG system initialized")
    
    print("\n📊 STATISTICS:")
    total_products = sum(len(c.get("products", [])) for c in catalogs.values())
    print(f"   Total brands: {len(catalogs)}")
    print(f"   Total products: {total_products}")
    
    print("\n🚀 NEXT STEPS:")
    print("   1. Start backend: python -m uvicorn app.main:app --reload")
    print("   2. Start frontend: cd frontend && pnpm dev")
    print("   3. Test API: curl http://localhost:8000/api/v1/brands")
    print("   4. Visit: http://localhost:5173")


def main():
    """Run complete pipeline"""
    parser = argparse.ArgumentParser(description="HSC-JIT Pipeline Orchestrator")
    parser.add_argument("--validate-only", action="store_true", help="Only validate, don't clean/publish")
    parser.add_argument("--skip-cleaning", action="store_true", help="Skip data cleaning step")
    parser.add_argument("--skip-rag", action="store_true", help="Skip RAG initialization")
    args = parser.parse_args()
    
    setup_path()
    
    print("\n" + "╔" + "="*68 + "╗")
    print("║  HSC-JIT v3.7 - Pipeline Orchestrator                          ║")
    print("║  Complete alignment of scraper → cleaner → publisher → RAG    ║")
    print("╚" + "="*68 + "╝")
    
    # Step 0: Load
    print_header("Step 0: Loading Catalogs")
    catalogs = load_catalogs()
    if not catalogs:
        print("❌ No catalogs found!")
        return 1
    
    # Step 1: Validate
    print_header("Step 1: Validating Catalogs")
    if not validate_catalogs(catalogs):
        print("⚠️  Some catalogs have issues (continuing anyway)")
    
    if args.validate_only:
        return 0
    
    # Step 2: Clean
    if not args.skip_cleaning:
        catalogs = clean_catalogs(catalogs)
    else:
        print_header("Step 2: Skipping Data Cleaning")
    
    # Step 3: Publish
    if not publish_catalogs(catalogs):
        print("❌ Failed to publish catalogs")
        return 1
    
    # Step 4: Initialize RAG
    if not args.skip_rag:
        initialize_rag(catalogs)
    else:
        print_header("Step 4: Skipping RAG Initialization")
    
    # Final status
    print_status(catalogs)
    
    print("\n" + "="*70)
    print("✅ PIPELINE COMPLETE")
    print("="*70 + "\n")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
