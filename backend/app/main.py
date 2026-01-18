"""
HSC-JIT V3.7 FastAPI Backend
Product Hierarchy + JIT RAG System
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Get backend root directory
BACKEND_ROOT = Path(__file__).parent.parent
DATA_DIR = BACKEND_ROOT / "data"
CATALOGS_DIR = DATA_DIR / "catalogs"

# Global cache for catalogs
_catalog_cache: Dict[str, Any] = {}


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("🚀 HSC-JIT V3.7 Backend Starting...")
    print(f"📁 Data directory: {DATA_DIR}")
    print(f"📦 Catalogs directory: {CATALOGS_DIR}")
    
    # Load all catalogs on startup
    await load_all_catalogs()
    
    yield
    
    print("👋 HSC-JIT V3.7 Backend Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="HSC-JIT V3.7 API",
    description="Product Hierarchy + JIT RAG System",
    version="3.7.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Set to False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# --- Data Models ---

class BrandIdentity(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    categories: List[str] = []


class Product(BaseModel):
    id: str
    brand: str
    name: str
    model_number: Optional[str] = None
    sku: Optional[str] = None
    main_category: str
    subcategory: Optional[str] = None
    sub_subcategory: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    images: List[Dict[str, Any]] = []
    features: List[str] = []
    specifications: Dict[str, Any] = {}
    tags: List[str] = []
    price: Optional[Dict[str, Any]] = None


class CatalogIndex(BaseModel):
    brands: List[Dict[str, str]]
    total_brands: int
    last_updated: Optional[str] = None


# --- Helper Functions ---

async def load_all_catalogs():
    """Load all brand catalogs into memory"""
    global _catalog_cache
    
    if not CATALOGS_DIR.exists():
        print(f"⚠️  Catalogs directory not found: {CATALOGS_DIR}")
        return
    
    catalog_files = list(CATALOGS_DIR.glob("*_catalog.json"))
    print(f"📚 Found {len(catalog_files)} catalog files")
    
    for catalog_file in catalog_files:
        try:
            brand_id = catalog_file.stem.replace("_catalog", "")
            with open(catalog_file, "r", encoding="utf-8") as f:
                catalog_data = json.load(f)
                _catalog_cache[brand_id] = catalog_data
                
            product_count = len(catalog_data.get("products", []))
            print(f"  ✅ {brand_id}: {product_count} products")
        except Exception as e:
            print(f"  ❌ Error loading {catalog_file.name}: {e}")
    
    print(f"🎉 Loaded {len(_catalog_cache)} catalogs successfully!")


def get_catalog(brand_id: str) -> Dict[str, Any]:
    """Get catalog data for a specific brand"""
    if brand_id not in _catalog_cache:
        raise HTTPException(status_code=404, detail=f"Brand '{brand_id}' not found")
    return _catalog_cache[brand_id]


def build_product_hierarchy(products: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Build hierarchical category structure from products"""
    hierarchy = {}
    
    for product in products:
        main_cat = product.get("main_category", "Uncategorized")
        sub_cat = product.get("subcategory")
        sub_sub_cat = product.get("sub_subcategory")
        
        # Initialize main category
        if main_cat not in hierarchy:
            hierarchy[main_cat] = {
                "name": main_cat,
                "products": [],
                "subcategories": {}
            }
        
        # If no subcategory, add to main category
        if not sub_cat:
            hierarchy[main_cat]["products"].append(product)
            continue
        
        # Initialize subcategory
        if sub_cat not in hierarchy[main_cat]["subcategories"]:
            hierarchy[main_cat]["subcategories"][sub_cat] = {
                "name": sub_cat,
                "products": [],
                "sub_subcategories": {}
            }
        
        # If no sub-subcategory, add to subcategory
        if not sub_sub_cat:
            hierarchy[main_cat]["subcategories"][sub_cat]["products"].append(product)
            continue
        
        # Initialize sub-subcategory
        if sub_sub_cat not in hierarchy[main_cat]["subcategories"][sub_cat]["sub_subcategories"]:
            hierarchy[main_cat]["subcategories"][sub_cat]["sub_subcategories"][sub_sub_cat] = {
                "name": sub_sub_cat,
                "products": []
            }
        
        # Add to sub-subcategory
        hierarchy[main_cat]["subcategories"][sub_cat]["sub_subcategories"][sub_sub_cat]["products"].append(product)
    
    return hierarchy


# --- API Endpoints ---

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "HSC-JIT V3.7 API",
        "version": "3.7.0",
        "status": "active",
        "endpoints": {
            "brands": "/api/brands",
            "catalog": "/api/catalog/{brand_id}",
            "products": "/api/brands/{brand_id}/products",
            "hierarchy": "/api/brands/{brand_id}/hierarchy",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "3.7.0",
        "catalogs_loaded": len(_catalog_cache),
        "available_brands": list(_catalog_cache.keys())
    }


@app.get("/health/full")
async def full_health_check():
    """Detailed health check"""
    total_products = sum(
        len(catalog.get("products", [])) 
        for catalog in _catalog_cache.values()
    )
    
    return {
        "status": "healthy",
        "version": "3.7.0",
        "system": {
            "catalogs_loaded": len(_catalog_cache),
            "total_products": total_products,
            "data_directory": str(DATA_DIR),
            "catalogs_directory": str(CATALOGS_DIR)
        },
        "brands": [
            {
                "id": brand_id,
                "name": catalog.get("brand_identity", {}).get("name", brand_id),
                "products": len(catalog.get("products", []))
            }
            for brand_id, catalog in _catalog_cache.items()
        ]
    }


@app.get("/api/brands")
async def get_brands():
    """Get list of all available brands"""
    brands = []
    
    for brand_id, catalog in _catalog_cache.items():
        brand_info = catalog.get("brand_identity", {})
        brands.append({
            "id": brand_id,
            "name": brand_info.get("name", brand_id),
            "logo_url": brand_info.get("logo_url"),
            "website": brand_info.get("website"),
            "description": brand_info.get("description"),
            "categories": brand_info.get("categories", []),
            "product_count": len(catalog.get("products", []))
        })
    
    return {
        "brands": brands,
        "total": len(brands)
    }


@app.get("/api/catalog/{brand_id}")
async def get_brand_catalog(brand_id: str):
    """Get complete catalog for a brand"""
    catalog = get_catalog(brand_id)
    return catalog


@app.get("/api/brands/{brand_id}/products")
async def get_brand_products(
    brand_id: str,
    category: Optional[str] = Query(None, description="Filter by main category"),
    limit: Optional[int] = Query(None, description="Limit number of results")
):
    """Get products for a specific brand with optional filtering"""
    catalog = get_catalog(brand_id)
    products = catalog.get("products", [])
    
    # Filter by category if specified
    if category:
        products = [
            p for p in products 
            if p.get("main_category", "").lower() == category.lower()
        ]
    
    # Apply limit if specified
    if limit:
        products = products[:limit]
    
    return {
        "brand": brand_id,
        "total": len(products),
        "products": products
    }


@app.get("/api/brands/{brand_id}/hierarchy")
async def get_brand_hierarchy(brand_id: str):
    """Get hierarchical category structure for a brand"""
    catalog = get_catalog(brand_id)
    products = catalog.get("products", [])
    
    hierarchy = build_product_hierarchy(products)
    
    return {
        "brand": brand_id,
        "brand_identity": catalog.get("brand_identity", {}),
        "hierarchy": hierarchy,
        "stats": {
            "total_products": len(products),
            "main_categories": len(hierarchy),
            "subcategories": sum(
                len(cat["subcategories"]) 
                for cat in hierarchy.values()
            )
        }
    }


@app.get("/api/products/search")
async def search_products(
    q: str = Query(..., description="Search query"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    limit: int = Query(20, description="Maximum results")
):
    """Search products across all brands"""
    results = []
    query_lower = q.lower()
    
    catalogs_to_search = {}
    if brand:
        if brand in _catalog_cache:
            catalogs_to_search = {brand: _catalog_cache[brand]}
    else:
        catalogs_to_search = _catalog_cache
    
    for brand_id, catalog in catalogs_to_search.items():
        for product in catalog.get("products", []):
            # Simple text search in name, description, and tags
            searchable_text = " ".join([
                product.get("name", ""),
                product.get("description", ""),
                product.get("short_description", ""),
                " ".join(product.get("tags", []))
            ]).lower()
            
            if query_lower in searchable_text:
                results.append({
                    **product,
                    "brand_id": brand_id
                })
                
            if len(results) >= limit:
                break
        
        if len(results) >= limit:
            break
    
    return {
        "query": q,
        "total": len(results),
        "results": results[:limit]
    }


# Mount static files for data directory (for frontend to access JSON directly)
if DATA_DIR.exists():
    app.mount("/data", StaticFiles(directory=str(DATA_DIR)), name="data")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
