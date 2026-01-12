"""Health check and readiness probe endpoints for Kubernetes integration."""

import logging
import time
import psutil
from typing import Optional
from fastapi import APIRouter, status
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
    uptime_seconds: float
    timestamp: str


class ReadinessStatus(BaseModel):
    """Readiness status response model"""

    ready: bool
    reason: Optional[str] = None


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
        if self.catalog_service and hasattr(self.catalog_service, 'products'):
             product_count = len(self.catalog_service.products)
             
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


@router.get("/ping")
async def ping():
    """Simple ping endpoint"""
    return {"pong": True}
