"""
⚠️ DEV TOOL ONLY - HSC-JIT V3.7 "Data Factory" Quality Control Server

This server is a LOCAL DEVELOPMENT HELPER for data validation during the offline data pipeline.
It is NOT deployed to production. It exists ONLY during development.

Architecture: "Data Factory" Model
─────────────────────────────────
1. Backend (The Factory): Offline Python pipeline that scrapes, cleans, enriches data
2. Frontend (The Showroom): Pure React SPA that consumes pre-built static JSON files
3. This Server (Quality Control): Validates data during the factory pipeline

Production Flow:
  Scrape → Clean → Enrich → Generate Embeddings → Export Static JSON → Deploy Frontend

This server provides:
  - Data validation endpoints (for developers during scraping)
  - Optional real-time progress tracking during the factory pipeline
  - API documentation for understanding the data structure
  
Production Reality:
  - NO backend API calls from frontend code
  - ALL data comes from: frontend/public/data/*.json
  - Data generation happens OFFLINE via: backend/forge_backbone.py
  - This server is NOT started in production

If you see this server being called from frontend code, REMOVE those calls.
The frontend must work with static JSON files only.

API Routes:
  GET /health              - Health check (dev verification)
  GET /api/v1/brands       - List available brands (dev reference)
  GET /api/v1/brands/{id}  - Get brand catalog (dev reference)
  GET /api/v1/search       - Search products (dev reference)
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from contextlib import asynccontextmanager
from datetime import datetime
import uuid

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Get backend root directory
BACKEND_ROOT = Path(__file__).parent.parent
DATA_DIR = BACKEND_ROOT / "data"
CATALOGS_DIR = DATA_DIR / "catalogs_brand"

# Global cache for catalogs
_catalog_cache: Dict[str, Any] = {}


# ============================================================================
# DATA MODELS - Aligned with ProductCore schema
# ============================================================================

class APIResponse(BaseModel):
    """Unified API response wrapper"""
    status: str = Field(..., description="success|error")
    data: Any = Field(None, description="Response data")
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {
            "version": "3.7.0",
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": str(uuid.uuid4())
        }
    )
    error: Optional[Dict[str, Any]] = None


class ProductImage(BaseModel):
    """Product image metadata"""
    url: str
    type: str = Field(default="gallery", description="main|gallery|technical")
    alt_text: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class BrandIdentity(BaseModel):
    """Brand metadata"""
    id: str = Field(..., description="Brand ID (lowercase, hyphenated)")
    name: str = Field(..., description="Display name")
    website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    categories: List[str] = Field(default_factory=list)


class ProductCore(BaseModel):
    """Product core data - matches scraper output"""
    id: str = Field(..., description="Product ID (brand-slug format)")
    brand: str = Field(..., description="Brand name (e.g., 'Roland')")
    name: str = Field(..., description="Product name")
    model_number: Optional[str] = None
    sku: Optional[str] = None
    main_category: str = Field(..., description="Primary category")
    categories: List[str] = Field(default_factory=list)
    subcategory: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    images: List[ProductImage] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    specifications: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    price_nis: Optional[float] = None
    halilit_brand_code: Optional[str] = None


class ProductCatalog(BaseModel):
    """Complete brand catalog"""
    brand_identity: BrandIdentity
    products: List[ProductCore]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BrandListItem(BaseModel):
    """Brand item for listing"""
    id: str
    name: str
    product_count: int
    website: Optional[str] = None
    logo_url: Optional[str] = None


class SearchResult(BaseModel):
    """Product search result"""
    products: List[ProductCore]
    total: int
    query: str
    brand: Optional[str] = None


# ============================================================================
# LIFESPAN & APP INITIALIZATION
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("\n" + "="*70)
    print("🚀 HSC-JIT V3.7 Backend Starting...")
    print("="*70)
    print(f"📁 Data directory: {DATA_DIR}")
    print(f"📦 Catalogs directory: {CATALOGS_DIR}")
    
    # Load all catalogs on startup
    await load_all_catalogs()
    print(f"✅ Loaded {len(_catalog_cache)} brand catalog(s)")
    print("="*70 + "\n")
    
    yield
    
    print("👋 HSC-JIT V3.7 Backend Shutting down...")


# Create FastAPI app with proper metadata
app = FastAPI(
    title="HSC-JIT V3.7 Data Factory Quality Control",
    description="⚠️ DEV TOOL ONLY: Data validation server for offline pipeline",
    version="3.7.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

# CORS Configuration - Development friendly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 🔓 ALLOW ALL ORIGINS for Codespaces/Dev Environment
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"], # Allow all headers
    expose_headers=["X-Total-Count", "X-Request-ID"],
    max_age=3600  # 1 hour
)


# Request ID middleware for tracing
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to all responses"""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def load_all_catalogs():
    """Load all brand catalogs into memory from JSON files"""
    global _catalog_cache
    
    if not CATALOGS_DIR.exists():
        print(f"⚠️  Catalogs directory not found: {CATALOGS_DIR}")
        return
    
    for catalog_file in CATALOGS_DIR.glob("*_catalog.json"):
        try:
            with open(catalog_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            brand_id = catalog_file.stem.replace("_catalog", "").lower()
            _catalog_cache[brand_id] = data
            print(f"  ✅ Loaded {brand_id} catalog ({len(data.get('products', []))} products)")
        
        except Exception as e:
            print(f"  ❌ Failed to load {catalog_file.name}: {e}")


def get_catalog(brand_id: str) -> Dict[str, Any]:
    """Get catalog data for a specific brand"""
    brand_key = brand_id.lower()
    
    if brand_key not in _catalog_cache:
        raise HTTPException(
            status_code=404,
            detail=f"Brand '{brand_id}' not found. Available brands: {list(_catalog_cache.keys())}"
        )
    
    return _catalog_cache[brand_key]


def build_product_hierarchy(products: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Build hierarchical category structure from products"""
    hierarchy = {}
    
    for product in products:
        main_cat = product.get("main_category", "Uncategorized")
        
        if main_cat not in hierarchy:
            hierarchy[main_cat] = []
        
        subcat = product.get("subcategory")
        if subcat and subcat not in hierarchy[main_cat]:
            hierarchy[main_cat].append(subcat)
    
    return hierarchy


# ============================================================================
# API ENDPOINTS - v1 routes
# ============================================================================

# --- Root & Health Endpoints ---

@app.get("/")
async def root():
    """API root endpoint - Data Factory Quality Control"""
    return APIResponse(
        status="success",
        data={
            "name": "HSC-JIT V3.7 Data Factory Quality Control",
            "version": "3.7.0",
            "mode": "⚠️ DEV TOOL ONLY - Not for production",
            "description": "This server validates data during the offline pipeline. All frontend data comes from public/data/*.json",
            "endpoints": {
                "health": "/health",
                "brands": "/api/v1/brands",
                "catalog": "/api/v1/brands/{brand_id}",
                "products": "/api/v1/brands/{brand_id}/products",
                "hierarchy": "/api/v1/brands/{brand_id}/hierarchy",
                "search": "/api/v1/search",
                "docs": "/api/docs"
            }
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return APIResponse(
        status="success",
        data={
            "status": "healthy",
            "version": "3.7.0",
            "catalogs_loaded": len(_catalog_cache),
            "available_brands": list(_catalog_cache.keys())
        }
    )


# --- Brand Endpoints ---

@app.get("/api/v1/brands")
async def list_brands() -> APIResponse:
    """
    Get list of all available brands.
    
    Returns:
        List of brands with metadata
    """
    brands = []
    
    for brand_id, catalog in _catalog_cache.items():
        brand_info = catalog.get("brand_identity", {})
        brands.append(BrandListItem(
            id=brand_id,
            name=brand_info.get("name", brand_id),
            product_count=len(catalog.get("products", [])),
            website=brand_info.get("website"),
            logo_url=brand_info.get("logo_url")
        ))
    
    return APIResponse(
        status="success",
        data={
            "brands": brands,
            "total": len(brands)
        }
    )


@app.get("/api/v1/brands/{brand_id}")
async def get_brand(brand_id: str) -> APIResponse:
    """
    Get complete brand catalog.
    
    Args:
        brand_id: Brand identifier (e.g., 'roland', 'boss')
    
    Returns:
        Complete ProductCatalog object
    """
    try:
        catalog = get_catalog(brand_id)
        return APIResponse(
            status="success",
            data=catalog
        )
    except HTTPException as e:
        raise e


@app.get("/api/v1/brands/{brand_id}/products")
async def get_brand_products(
    brand_id: str,
    category: Optional[str] = Query(None, description="Filter by main_category"),
    limit: Optional[int] = Query(None, description="Limit results"),
    offset: int = Query(0, description="Pagination offset")
) -> APIResponse:
    """
    Get products for a specific brand.
    
    Args:
        brand_id: Brand identifier
        category: Optional category filter
        limit: Maximum results
        offset: Pagination offset
    
    Returns:
        List of ProductCore objects
    """
    try:
        catalog = get_catalog(brand_id)
        products = catalog.get("products", [])
        
        # Filter by category if provided
        if category:
            products = [
                p for p in products
                if p.get("main_category", "").lower() == category.lower()
            ]
        
        # Apply pagination
        total = len(products)
        if limit:
            products = products[offset:offset + limit]
        elif offset:
            products = products[offset:]
        
        return APIResponse(
            status="success",
            data={
                "products": products,
                "total": total,
                "limit": limit,
                "offset": offset,
                "count": len(products)
            }
        )
    except HTTPException as e:
        raise e


@app.get("/api/v1/brands/{brand_id}/products/{product_id}")
async def get_product(brand_id: str, product_id: str) -> APIResponse:
    """
    Get specific product by ID.
    
    Args:
        brand_id: Brand identifier
        product_id: Product identifier
    
    Returns:
        ProductCore object
    """
    try:
        catalog = get_catalog(brand_id)
        
        for product in catalog.get("products", []):
            if product.get("id") == product_id:
                return APIResponse(
                    status="success",
                    data=product
                )
        
        raise HTTPException(
            status_code=404,
            detail=f"Product '{product_id}' not found in brand '{brand_id}'"
        )
    except HTTPException as e:
        raise e


@app.get("/api/v1/brands/{brand_id}/hierarchy")
async def get_brand_hierarchy(brand_id: str) -> APIResponse:
    """
    Get hierarchical category structure for a brand.
    
    Args:
        brand_id: Brand identifier
    
    Returns:
        Dictionary of main categories with subcategories
    """
    try:
        catalog = get_catalog(brand_id)
        products = catalog.get("products", [])
        hierarchy = build_product_hierarchy(products)
        
        return APIResponse(
            status="success",
            data={
                "hierarchy": hierarchy,
                "total_categories": len(hierarchy)
            }
        )
    except HTTPException as e:
        raise e


# --- Search Endpoint ---

@app.get("/api/v1/search")
async def search_products(
    q: str = Query(..., description="Search query", min_length=1),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, description="Maximum results", ge=1, le=100)
) -> APIResponse:
    """
    Search products across all brands.
    
    Uses simple string matching on product name and description.
    For advanced search, use RAG endpoints.
    
    Args:
        q: Search query
        brand: Optional brand filter
        category: Optional category filter
        limit: Maximum results
    
    Returns:
        SearchResult with matching products
    """
    results = []
    
    # Search in all catalogs (or filtered brand)
    search_catalogs = {}
    if brand:
        try:
            search_catalogs[brand.lower()] = get_catalog(brand)
        except HTTPException:
            return APIResponse(
                status="error",
                data=None,
                error={"code": "BRAND_NOT_FOUND", "message": f"Brand '{brand}' not found"}
            )
    else:
        search_catalogs = _catalog_cache
    
    query_lower = q.lower()
    
    for brand_id, catalog in search_catalogs.items():
        for product in catalog.get("products", []):
            # Check filters
            if category and product.get("main_category", "").lower() != category.lower():
                continue
            
            # Check if matches
            name_match = query_lower in product.get("name", "").lower()
            desc_match = query_lower in product.get("description", "").lower()
            tags_match = any(query_lower in tag.lower() for tag in product.get("tags", []))
            
            if name_match or desc_match or tags_match:
                results.append(product)
            
            if len(results) >= limit:
                break
        
        if len(results) >= limit:
            break
    
    return APIResponse(
        status="success",
        data={
            "products": results[:limit],
            "total": len(results),
            "query": q,
            "brand": brand,
            "category": category
        }
    )


# ============================================================================
# STATIC FILES & SHUTDOWN
# ============================================================================

# Mount static files for data directory (optional, if needed for direct access)
frontend_public_dir = BACKEND_ROOT.parent / "frontend" / "public"
if frontend_public_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_public_dir)), name="static")


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse(
            status="error",
            data=None,
            error={
                "code": "HTTP_ERROR",
                "message": exc.detail,
                "status_code": exc.status_code
            }
        ).model_dump()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Generic exception handler"""
    return JSONResponse(
        status_code=500,
        content=APIResponse(
            status="error",
            data=None,
            error={
                "code": "INTERNAL_ERROR",
                "message": str(exc)
            }
        ).model_dump()
    )


# ============================================================================
# APPLICATION STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(BACKEND_ROOT)]
    )
