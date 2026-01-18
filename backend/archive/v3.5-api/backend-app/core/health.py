"""Health check and readiness probe endpoints for Kubernetes integration."""

import logging
import time
import psutil
from typing import Optional, List, Dict
from fastapi import APIRouter, status, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class HealthStatus(BaseModel):
    """Health status response model"""

    status: str  # "healthy", "degraded", "unhealthy"
    redis_connected: bool
    memory_usage_percent: float
    cpu_usage_percent: float
    active_connections: int
    product_count: int
    brand_count: int
    uptime_seconds: float
    timestamp: str


class ReadinessStatus(BaseModel):
    """Readiness status response model"""

    ready: bool
    reason: Optional[str] = None


class EndpointInfo(BaseModel):
    """Endpoint information for full health report"""
    path: str
    name: str
    methods: List[str]


class HealthChecker:
    """Manages health and readiness checks"""

    def __init__(self):
        self.redis_manager = None
        self.connection_manager = None
        self.catalog_service = None
        self.start_time = time.time()

    def set_dependencies(self, redis_manager, connection_manager, catalog_service=None):
        """Inject dependencies"""
        self.redis_manager = redis_manager
        self.connection_manager = connection_manager
        self.catalog_service = catalog_service

    async def get_health_status(self) -> HealthStatus:
        """Get current health status"""
        redis_ok = False
        if self.redis_manager:
            redis_ok = await self.redis_manager.ping()

        memory_percent = psutil.virtual_memory().percent
        cpu_percent = psutil.cpu_percent(interval=0.1)
        active_connections = (
            len(self.connection_manager.active_connections)
            if self.connection_manager
            else 0
        )
        
        product_count = 0
        brand_count = 0
        if self.catalog_service and hasattr(self.catalog_service, 'products'):
             product_count = len(self.catalog_service.products)
             # Count unique brands
             brands = set()
             for product in self.catalog_service.products:
                 if product.get('brand'):
                     brands.add(product['brand'])
             brand_count = len(brands)
             
        uptime = time.time() - self.start_time

        # Determine overall status
        if memory_percent > 90 or cpu_percent > 95:
            status_str = "degraded"
        elif redis_ok and memory_percent < 80 and cpu_percent < 90:
            status_str = "healthy"
        else:
            status_str = "unhealthy"

        return HealthStatus(
            status=status_str,
            redis_connected=redis_ok,
            memory_usage_percent=memory_percent,
            cpu_usage_percent=cpu_percent,
            active_connections=active_connections,
            product_count=product_count,
            brand_count=brand_count,
            uptime_seconds=uptime,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        )

    async def get_readiness_status(self) -> tuple[bool, Optional[str]]:
        """Check if service is ready to accept traffic"""
        # Must have Redis connection
        if not self.redis_manager:
            return False, "Redis manager not initialized"

        redis_ok = await self.redis_manager.ping()
        if not redis_ok:
            return False, "Redis not connected"

        # Check memory
        memory_percent = psutil.virtual_memory().percent
        if memory_percent > 95:
            return False, f"Memory usage critical: {memory_percent}%"

        return True, None


# Global health checker instance
_health_checker = HealthChecker()


def get_health_checker() -> HealthChecker:
    """Get the global health checker instance"""
    return _health_checker


@router.get("/health", response_model=HealthStatus)
async def health_check():
    """
    Kubernetes liveness probe endpoint.
    Returns 200 if service is running, even if degraded.
    """
    return await _health_checker.get_health_status()


@router.get("/ready")
async def readiness_check():
    """
    Kubernetes readiness probe endpoint.
    Returns 200 only when ready to serve traffic.
    """
    ready, reason = await _health_checker.get_readiness_status()

    if ready:
        return {"status": "ready"}
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not ready", "reason": reason},
        )


@router.get("/health/full")
async def full_health_check(request: Request):
    """
    Full health report including:
    - core service statuses (redis, catalog, llm)
    - environment flags (api key presence)
    - resource metrics (cpu, memory, uptime)
    - registered endpoints list (path, methods, name)
    """
    # Base health metrics
    base: HealthStatus = await _health_checker.get_health_status()

    # App state services
    app = request.app
    llm_available = False
    model_name = None
    api_key_present = False
    try:
        llm = getattr(app.state, "llm", None)
        if llm is not None:
            llm_available = bool(getattr(llm, "client", None))
            model_name = getattr(llm, "model_name", None)
            api_key_present = bool(getattr(llm, "api_key", None))
    except Exception:
        llm_available = False

    catalog_products = 0
    brands_count = 0
    try:
        catalog = getattr(app.state, "catalog", None)
        catalog_products = len(getattr(catalog, "products", []) or [])
        # brand count already calculated in base, but compute explicitly here too
        brands = set()
        for p in getattr(catalog, "products", []) or []:
            b = p.get("brand")
            if b:
                brands.add(b)
        brands_count = len(brands)
    except Exception:
        pass

    # Registered endpoints
    endpoints: List[EndpointInfo] = []
    try:
        for route in request.app.router.routes:
            path = getattr(route, "path", getattr(route, "url_path", ""))
            name = getattr(route, "name", "")
            methods = list(getattr(route, "methods", set())) or []
            endpoints.append(EndpointInfo(path=path, name=name, methods=methods))
    except Exception:
        pass

    # Core endpoints expected
    expected_core = [
        "/health", "/ready", "/metrics", "/ws",
        "/api/products", "/api/brands", "/api/system-health"
    ]
    missing_core: List[str] = []
    present_paths = {e.path for e in endpoints}
    for p in expected_core:
        if p not in present_paths:
            missing_core.append(p)

    return {
        "status": base.status,
        "resources": {
            "redis_connected": base.redis_connected,
            "memory_usage_percent": base.memory_usage_percent,
            "cpu_usage_percent": base.cpu_usage_percent,
            "uptime_seconds": base.uptime_seconds,
        },
        "catalog": {
            "product_count": catalog_products,
            "brand_count": brands_count,
        },
        "llm": {
            "available": llm_available,
            "api_key_present": api_key_present,
            "model": model_name,
        },
        "endpoints": [e.model_dump() for e in endpoints],
        "missing_core_endpoints": missing_core,
        "timestamp": base.timestamp,
    }
