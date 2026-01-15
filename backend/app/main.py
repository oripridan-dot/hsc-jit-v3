from __future__ import annotations
from pydantic import ValidationError
from .core.validation import validate_websocket_message, safe_get_str
from .core.metrics import (
    websocket_active_connections,
    messages_processed,
    websocket_errors,
    get_prometheus_metrics,
)
from .core.health import get_health_checker, router as health_router
from .core.logging import setup_structured_logging, get_logger
from .core.cache import get_cache
from .core.redis_manager import RedisPubSubManager
from .services.llm import GeminiService
from .services.fetcher import ContentFetcher
from .services.sniffer import SnifferService
from .services.catalog import CatalogService
from .services.unified_router import UnifiedQueryRouter
from .services.harvester import HarvesterService
from .services.image_optimizer import get_image_optimizer
from .services.sync_status import SyncStatusService

import json
import uuid
import os
import io
import time
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from typing import Any, Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST
from starlette.requests import Request
from starlette.responses import Response

# Load environment variables (e.g. GEMINI_API_KEY)
load_dotenv()

# ruff: noqa: E402 - imports after load_dotenv() is intentional

# Setup structured logging
setup_structured_logging(level="INFO")
logger = get_logger(__name__)

# Global state
redis_manager = RedisPubSubManager(
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379")
)


class ConnectionManager:
    """Manages WebSocket connections for this instance"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_metadata: Dict[str, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        """Register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.session_metadata[client_id] = {
            "connected_at": time.time(),
            "messages_processed": 0,
        }
        websocket_active_connections.set(len(self.active_connections))
        logger.info(
            "WebSocket connected",
            client_id=client_id,
            total_connections=len(self.active_connections),
        )

    def disconnect(self, client_id: str):
        """Unregister a WebSocket connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            del self.session_metadata[client_id]
            websocket_active_connections.set(len(self.active_connections))
            logger.info(
                "WebSocket disconnected",
                client_id=client_id,
                total_connections=len(self.active_connections),
            )

    async def broadcast_to_client(self, client_id: str, message: dict):
        """Broadcast to a specific client via Redis Pub/Sub"""
        await redis_manager.publish(f"client:{client_id}", message)

    async def send_to_client(self, client_id: str, message: dict):
        """Send directly to client if connected to this instance"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(
                    message
                )
            except Exception as e:
                logger.error(
                    "Failed to send to client",
                    client_id=client_id,
                    error=str(e),
                )


connection_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown"""
    # Startup
    logger.info("Starting HSC-JIT backend...")

    # Initialize Redis
    await redis_manager.connect()

    # Initialize cache with Redis client
    cache = get_cache()
    cache.set_redis(redis_manager.redis)

    # Initialize health checker
    health_checker = get_health_checker()

    # Initialize services
    app.state.catalog = CatalogService()
    app.state.sniffer = SnifferService(app.state.catalog)
    # Initialize ContentFetcher with Redis for TEXT caching
    app.state.fetcher = ContentFetcher()  # Redis optional, fetcher works standalone
    # RAG removed - using direct context window approach
    app.state.llm = GeminiService()
    app.state.start_time = time.time()

    # Initialize unified router for Explorer/PromptBar integration
    app.state.unified_router = UnifiedQueryRouter(
        sniffer_service=app.state.sniffer,
        catalog_service=app.state.catalog,
        fetcher_service=app.state.fetcher,
        llm_service=app.state.llm,
        cache=cache
    )

    # Set dependencies for health check (now that catalog is ready)
    health_checker.set_dependencies(
        redis_manager, connection_manager, app.state.catalog)

    # Create quick lookup map
    app.state.product_map = {
        p.get("id"): p
        for p in app.state.catalog.products
        if p.get("id")
    }

    logger.info(
        "All services initialized",
        products_loaded=len(app.state.product_map),
    )

    yield

    # Shutdown
    logger.info("Shutting down HSC-JIT backend...")
    await redis_manager.disconnect()


app = FastAPI(title="HSC JIT v3 - Psychic Engine", lifespan=lifespan)

# Configure MIME types for static files (especially WebP)
import mimetypes  # noqa: E402
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/svg+xml', '.svg')

# Serve self-hosted assets (logos, product shots)
# Use absolute path to ensure it works regardless of CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Add health check router
app.include_router(health_router)

# ============ Products Endpoint ============


@app.get("/api/products")
async def get_all_products():
    """
    Get all products from the catalog.
    Used for full hydration of the frontend file system.
    """
    catalog = CatalogService()
    return {
        "count": len(catalog.products),
        "products": catalog.products
    }

# ============ Sync Status Endpoint ============


@app.get("/api/sync-status")
async def get_sync_status():
    """
    Get real-time sync progress and status.
    Used for monitoring dashboard in the UI.
    """
    sync_service = SyncStatusService()
    return sync_service.get_sync_status()


# ============ System Health for Frontend Badge ============


@app.get("/api/system-health")
async def get_system_health():
    """
    Get system health status for frontend badge.
    Returns simplified health status for UI display.
    """
    from pathlib import Path
    import json
    from datetime import datetime

    # Try to read the health check file from elite monitor
    backend_dir = Path(__file__).parent.parent
    health_file = backend_dir / "data" / "catalogs_unified" / "health_check.json"

    if health_file.exists():
        try:
            with open(health_file) as f:
                health_data = json.load(f)

            # Convert to frontend format
            status = "healthy"
            if health_data.get("issues"):
                status = "error" if len(
                    health_data["issues"]) > 2 else "degraded"
            elif health_data.get("merge_status") == "⏭️ NOT_RUN":
                status = "checking"

            return {
                "status": status,
                "last_audit": health_data.get("timestamp", datetime.now().isoformat()),
                "metrics": {
                    "total": health_data.get("total_products", 0),
                    "broken": len(health_data.get("issues", [])),
                    "ok": health_data.get("total_products", 0) - len(health_data.get("issues", []))
                }
            }
        except Exception as e:
            logger.error(f"Error reading health file: {e}")

    # Fallback: use catalog count
    catalog = app.state.catalog
    product_count = len(catalog.products) if hasattr(
        catalog, 'products') else 0

    return {
        "status": "healthy" if product_count > 0 else "missing",
        "last_audit": datetime.now().isoformat(),
        "metrics": {
            "total": product_count,
            "broken": 0,
            "ok": product_count
        }
    }

# ============ Brands Endpoint ============


@app.get("/api/brands")
async def get_all_brands():
    """
    Get all brand identities with product counts.
    Returns: [{ "id": "moog", "name": "Moog Music", "product_count": 8, "logo_url": "...", ... }]
    """
    catalog = CatalogService()
    brands = catalog.get_all_brands()
    return {
        "total_brands": len(brands),
        "brands": brands
    }

# ============ Price Endpoint ============


# Price endpoint removed - stub service deleted


# ============ Image Optimization Endpoints ============


@app.get("/api/images/proxy")
async def proxy_external_image(url: str):
    """
    Proxy external images to bypass CORS restrictions

    Example: GET /api/images/proxy?url=https://example.com/image.png
    """
    import httpx
    from starlette.responses import StreamingResponse

    if not url or not (url.startswith('http://') or url.startswith('https://')):
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid URL"}
        )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)

            if response.status_code != 200:
                return JSONResponse(
                    status_code=response.status_code,
                    content={
                        "error": f"Failed to fetch image: {response.status_code}"}
                )

            # Determine content type from response or URL
            content_type = response.headers.get('content-type', 'image/png')

            return StreamingResponse(
                io.BytesIO(response.content),
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",  # 1 day
                    "Access-Control-Allow-Origin": "*"
                }
            )
    except Exception as e:
        logger.error(f"Failed to proxy image: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to fetch image: {str(e)}"}
        )


@app.get("/api/images/optimize/{image_name}")
async def get_optimized_image(
    image_name: str,
    preset: str = "medium"
):
    """
    Get an optimized version of an image

    Presets:
    - thumbnail: 400px wide, 80% quality
    - medium: 800px wide, 85% quality (default)
    - large: 1600px wide, 90% quality
    - original: full size, 95% quality

    Example: GET /api/images/optimize/nord-wave-2.webp?preset=thumbnail
    """
    from pathlib import Path
    from starlette.responses import StreamingResponse

    optimizer = get_image_optimizer()
    image_path = Path(f"app/static/assets/products/{image_name}")

    if not image_path.exists():
        return JSONResponse(
            status_code=404,
            content={"error": "Image not found"}
        )

    if preset not in ["thumbnail", "medium", "large", "original"]:
        preset = "medium"

    compressed = await optimizer.compress_image(image_path, preset=preset)

    if not compressed:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to optimize image"}
        )

    return StreamingResponse(
        io.BytesIO(compressed),
        media_type="image/webp",
        headers={
            "Cache-Control": "public, max-age=31536000",  # 1 year
            "X-Image-Preset": preset
        }
    )


@app.post("/api/images/batch-optimize")
async def batch_optimize_images(directory: str = "products", preset: str = "medium", dry_run: bool = False):
    """
    Batch optimize all images in a directory

    Example: POST /api/images/batch-optimize?directory=products&preset=medium&dry_run=true
    """
    optimizer = get_image_optimizer()
    stats = await optimizer.batch_compress_directory(directory, preset, dry_run)
    return stats


@app.delete("/api/images/cache")
async def clear_image_cache(pattern: str = "*"):
    """Clear the image cache"""
    optimizer = get_image_optimizer()
    count = optimizer.clear_cache(pattern)
    return {"cleared": count}


# ============ Harvester Endpoints (The Fuel Pump) ============


@app.post("/api/harvest/{brand_id}")
async def trigger_harvest(brand_id: str, max_pages: int = 5):
    """
    Trigger the harvester to scrape and populate catalog for a brand.
    Requires that the brand already has a scrape_config.json (generated by diplomat.py).

    Example: POST /api/harvest/roland?max_pages=3
    """
    harvester = HarvesterService()
    result = await harvester.harvest_brand(brand_id, max_pages=max_pages)

    if result["success"]:
        return {
            "success": True,
            "message": f"Harvested {result['products_found']} products for {brand_id}",
            "products_found": result["products_found"],
            "catalog_path": result["catalog_path"]
        }
    else:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": result.get("error", "Unknown error")
            }
        )


@app.get("/api/harvest/status/{brand_id}")
async def get_harvest_status(brand_id: str):
    """
    Check harvest status for a brand:
    - Does it have a scrape config (from diplomat)?
    - Does it have a populated catalog?
    - How many products?

    Example: GET /api/harvest/status/roland
    """
    harvester = HarvesterService()
    status = harvester.get_harvest_status(brand_id)
    return status


@app.get("/api/harvest/status")
async def get_all_harvest_status():
    """
    Get harvest status for all brands in the system.
    Shows which brands are ready to harvest vs already harvested.
    """
    catalog = CatalogService()
    harvester = HarvesterService()

    brands = catalog.get_all_brands()
    statuses = []

    for brand in brands:
        brand_id = brand["id"]
        harvest_status = harvester.get_harvest_status(brand_id)
        statuses.append({
            **brand,
            "harvest_status": harvest_status
        })

    return {
        "total_brands": len(statuses),
        "brands": statuses
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    response: Response = await call_next(request)
    if request.url.path.startswith("/static/") and response.status_code == 200:
        response.headers.setdefault(
            "Cache-Control", "public, max-age=31536000, immutable"
        )
    return response


# ============ Metrics Endpoint ============
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=get_prometheus_metrics(),
        media_type=CONTENT_TYPE_LATEST,
    )


# ============ WebSocket Endpoint ============
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, client_id: str = None) -> None:
    """
    Main WebSocket endpoint for real-time chat and predictions.
    Handles typing events, queries, and streams responses.
    """
    client_id = client_id or str(uuid.uuid4())
    await connection_manager.connect(ws, client_id)

    logger.info(
        "WebSocket connection established",
        client_id=client_id,
    )

    try:
        while True:
            raw = await ws.receive_text()

            try:
                payload: Dict[str, Any] = json.loads(raw)
            except json.JSONDecodeError:
                messages_processed.labels(message_type="error").inc()
                await ws.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            # Validate message structure and content
            try:
                validated_msg = validate_websocket_message(payload)
                if validated_msg is None:
                    raise ValidationError("Invalid message structure")
            except ValidationError as e:
                messages_processed.labels(message_type="error").inc()
                logger.warning(
                    "Invalid WebSocket message",
                    client_id=client_id,
                    error=str(e),
                    payload=payload
                )
                await ws.send_json({
                    "type": "error",
                    "message": f"Invalid message format: {str(e)}"
                })
                continue

            msg_type = payload.get("type")
            connection_manager.session_metadata[client_id]["messages_processed"] += 1

            if msg_type == "typing":
                await handle_typing_event(
                    ws, app, payload, client_id
                )

            elif msg_type == "unified_query":
                # New unified handler for Explorer/PromptBar
                await handle_unified_query_event(
                    ws, app, payload, client_id
                )

            elif msg_type in ["query", "lock_and_query"]:
                await handle_query_event(
                    ws, app, payload, client_id
                )

            else:
                logger.warning(
                    "Unknown message type",
                    client_id=client_id,
                    msg_type=msg_type,
                )

    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
        logger.info("WebSocket disconnected gracefully", client_id=client_id)

    except Exception as e:
        websocket_errors.labels(error_type=type(e).__name__).inc()
        logger.error(
            "WebSocket error",
            client_id=client_id,
            error=str(e),
            exc_info=True,
        )
        connection_manager.disconnect(client_id)
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


async def handle_typing_event(
    ws: WebSocket, app: FastAPI, payload: Dict[str, Any], client_id: str
):
    """Handle typing/prediction event"""
    content = safe_get_str(payload, "content", "", max_length=1000)
    messages_processed.labels(message_type="typing").inc()

    try:
        sniffer: SnifferService = app.state.sniffer

        # Predict products - use higher limit for empty searches to populate catalog
        search_limit = 50 if not content or len(content.strip()) == 0 else 10
        predictions = sniffer.predict(str(content), limit=search_limit)

        # Hydrate with full context
        enriched_predictions = []
        for pred in predictions:
            product_id = pred.get("product", {}).get("id")
            if product_id:
                full_context = app.state.catalog.get_product_with_context(
                    product_id
                )
                if full_context:
                    enriched_pred = {
                        "product": full_context.get("product"),
                        "brand": full_context.get("brand"),
                        "context": full_context.get("context"),
                        "confidence": pred.get("confidence"),
                        "match_text": pred.get("match_text"),
                    }
                    enriched_predictions.append(enriched_pred)
            else:
                enriched_predictions.append(pred)

        # Send predictions
        await ws.send_json({"type": "prediction", "data": enriched_predictions})

    except Exception as e:
        logger.error(
            "Error in typing handler",
            client_id=client_id,
            error=str(e),
        )
        await ws.send_json({"type": "error", "message": str(e)})


async def handle_query_event(
    ws: WebSocket,
    app: FastAPI,
    payload: Dict[str, Any],
    client_id: str,
):
    """Handle query/lock_and_query event"""
    product_id = payload.get("product_id")
    query_text = payload.get("query") or payload.get("content") or ""
    image_data = payload.get("image")
    scenario = payload.get("scenario", "general")  # New: scenario mode

    messages_processed.labels(message_type="query").inc()

    if not product_id:
        await ws.send_json(
            {"type": "status", "msg": "Error: No product selected."}
        )
        return

    try:
        # Send status
        await ws.send_json(
            {"type": "status", "msg": "Reading Official Manual..."}
        )

        # Get product with context
        product_with_context = (
            app.state.catalog.get_product_with_context(product_id)
        )
        if not product_with_context:
            await ws.send_json(
                {"type": "status", "msg": "Error: Product not found."}
            )
            return

        product = product_with_context.get("product", {})

        # Get LLM and fetcher services
        llm: GeminiService = app.state.llm
        fetcher: ContentFetcher = app.state.fetcher

        # Direct manual fetch (MCP Skills stub removed)
        manual_text = await fetcher.fetch(product)

        if not manual_text:
            await ws.send_json(
                {
                    "type": "answer_chunk",
                    "content": "Manual unavailable for this product.",
                }
            )
            return

        # Trim to reasonable size for LLM (Gemini handles ~100k tokens)
        retrieved_context = manual_text[:50000]

        # Generate answer with LLM
        await ws.send_json({"type": "status", "msg": "Thinking..."})

        brand = product_with_context.get("brand", {})
        related_items = (
            product_with_context.get("context", {}).get("related_items", [])
        )

        # Build enriched context
        brand_context = ""
        if brand:
            brand_context = (
                f"\n**Brand Context:**\n"
                f"- Brand: {brand.get('name', '')} "
                f"(HQ: {brand.get('hq', '')})\n"
                f"- Product: {product.get('name', '')} "
                f"(Origin: {product.get('production_country', '')})"
            )

        related_context = ""
        if related_items:
            related_names = [
                item.get("name") for item in related_items if item.get("name")
            ]
            if related_names:
                related_context = (
                    f"\n**Official Accessories:** "
                    f"{', '.join(related_names[:5])}"
                )

        full_context = retrieved_context + brand_context + related_context

        # Stream answer with scenario context
        has_answers = False
        async for chunk in llm.stream_answer(
            full_context, query_text, image_data=image_data, scenario=scenario
        ):
            has_answers = True
            await ws.send_json(
                {"type": "answer_chunk", "content": chunk}
            )

        if not has_answers:
            await ws.send_json(
                {"type": "answer_chunk", "content": "No answer generated."}
            )

        # Send context with scenario metadata
        await ws.send_json(
            {
                "type": "context",
                "data": {
                    "brand": product_with_context.get("brand"),
                    "related_items": product_with_context.get(
                        "context", {}
                    ).get("related_items", []),
                    "scenario": scenario,
                },
            }
        )

        # Stream response
        await ws.send_json({"type": "final_answer", "content": ""})

    except Exception as e:
        logger.error(
            "Error in query handler",
            client_id=client_id,
            product_id=product_id,
            error=str(e),
        )
        await ws.send_json({"type": "error", "message": str(e)})


async def handle_unified_query_event(
    ws: WebSocket,
    app: FastAPI,
    payload: Dict[str, Any],
    client_id: str,
):
    """
    Handle unified query from Explorer or PromptBar

    Expected payload:
    {
        "type": "unified_query",
        "query": "user query text",
        "source": "explorer" | "promptbar",
        "filters": {"brand": "...", "category": "..."} (optional)
    }
    """
    query = payload.get("query", "")
    source = payload.get("source", "promptbar")
    filters = payload.get("filters")

    messages_processed.labels(message_type="unified_query").inc()

    if not query:
        await ws.send_json({
            "type": "error",
            "message": "Query text is required"
        })
        return

    try:
        router: UnifiedQueryRouter = app.state.unified_router
        await router.process_query(
            query=query,
            websocket=ws,
            session_id=client_id,
            source=source,
            filters=filters
        )
    except Exception as e:
        logger.error(
            "Error in unified query handler",
            client_id=client_id,
            query=query,
            source=source,
            error=str(e),
        )
        await ws.send_json({"type": "error", "message": str(e)})
