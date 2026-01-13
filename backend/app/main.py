from __future__ import annotations

import asyncio
import json
import uuid
import logging
import os
import time
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from typing import Any, Dict, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.staticfiles import StaticFiles as StarletteStaticFiles
from prometheus_client import CONTENT_TYPE_LATEST
from starlette.requests import Request
from starlette.responses import Response

# Load environment variables (e.g. GEMINI_API_KEY)
load_dotenv()

from .services.catalog import CatalogService
from .services.sniffer import SnifferService
from .services.fetcher import ContentFetcher
from .services.rag import EphemeralRAG
from .services.llm import GeminiService
from .services.price import PriceService
from .services.image_enhancer import get_image_enhancer
from .core.redis_manager import RedisPubSubManager
from .core.cache import get_cache
from .core.logging import setup_structured_logging, get_logger
from .core.health import get_health_checker, router as health_router
from .core.metrics import (
    websocket_active_connections,
    messages_processed,
    websocket_errors,
    get_prometheus_metrics,
)
from .core.tasks import celery_app
from .core.validation import validate_websocket_message, safe_get_str
from pydantic import ValidationError

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
    app.state.fetcher = ContentFetcher()
    app.state.rag = EphemeralRAG()
    app.state.llm = GeminiService()
    app.state.start_time = time.time()
    
    # Set dependencies for health check (now that catalog is ready)
    health_checker.set_dependencies(redis_manager, connection_manager, app.state.catalog)

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
import mimetypes
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/svg+xml', '.svg')

# Serve self-hosted assets (logos, product shots)
# Use absolute path to ensure it works regardless of CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Add health check router
app.include_router(health_router)

# ============ Price Endpoint ============
@app.get("/api/price/{query}")
async def get_price(query: str):
    """
    Get price and availability for a product.
    """
    result = await PriceService.get_price(query)
    if not result:
        return JSONResponse(status_code=404, content={"message": "Product not found or price unavailable"})
    return result

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

    # Session ID for RAG isolation
    session_id = str(uuid.uuid4())
    logger.info(
        "WebSocket connection established",
        client_id=client_id,
        session_id=session_id,
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

            elif msg_type in ["query", "lock_and_query"]:
                await handle_query_event(
                    ws, app, payload, client_id, session_id
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

        # Speculative prefetch if high confidence
        high_confidence_pred = next(
            (p for p in predictions if p.get("confidence", 0) > 0.85),
            None,
        )
        if high_confidence_pred:
            product_id = high_confidence_pred.get("product", {}).get("id")
            product = app.state.product_map.get(product_id)
            if product and product.get("manual_url"):
                from .core.tasks import prefetch_manual

                prefetch_manual.delay(
                    product_id, product.get("manual_url"), session_id=client_id
                )
                logger.debug(
                    "Prefetch queued",
                    product_id=product_id,
                    client_id=client_id,
                )

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
    session_id: str,
):
    """Handle query/lock_and_query event"""
    product_id = payload.get("product_id")
    query_text = payload.get("query") or payload.get("content") or ""
    image_data = payload.get("image")

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

        # Fetch manual
        fetcher: ContentFetcher = app.state.fetcher
        manual_text = await fetcher.fetch(product)

        if not manual_text:
            await ws.send_json(
                {
                    "type": "answer_chunk",
                    "content": "Manual unavailable for this product.",
                }
            )
            return

        # Index in RAG
        await ws.send_json({"type": "status", "msg": "Analyzing content..."})
        rag: EphemeralRAG = app.state.rag
        success = rag.index(session_id, manual_text)

        # Retrieve context
        if success:
            retrieved_context = rag.query(session_id, query_text)
        else:
            retrieved_context = manual_text[:8000]

        # Generate answer with LLM
        await ws.send_json({"type": "status", "msg": "Thinking..."})

        llm: GeminiService = app.state.llm
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
                    f"\n**Related Products Available:** "
                    f"{', '.join(related_names[:3])}"
                )

        full_context = retrieved_context + brand_context + related_context

        # Stream answer
        has_answers = False
        async for chunk in llm.stream_answer(
            full_context, query_text, image_data=image_data
        ):
            has_answers = True
            await ws.send_json(
                {"type": "answer_chunk", "content": chunk}
            )

        if not has_answers:
            await ws.send_json(
                {"type": "answer_chunk", "content": "No answer generated."}
            )

        # Send context
        await ws.send_json(
            {
                "type": "context",
                "data": {
                    "brand": product_with_context.get("brand"),
                    "related_items": product_with_context.get(
                        "context", {}
                    ).get("related_items", []),
                },
            }
        )

        # Generate image enhancements with validation
        try:
            enhancer = get_image_enhancer()
            enhancements = await enhancer.generate_enhancement_data(
                product, manual_text
            )
            
            # Validate enhancement data structure before sending
            if enhancements.get("has_enhancements"):
                # Ensure all required fields are present and valid
                if (
                    isinstance(enhancements.get("annotations"), list) and
                    isinstance(enhancements.get("display_content"), dict) and
                    enhancements.get("product_id") and
                    enhancements.get("product_name")
                ):
                    await ws.send_json(
                        {
                            "type": "image_enhancements",
                            "data": enhancements
                        }
                    )
                    logger.info(
                        "Image enhancements sent",
                        product_id=product_id,
                        annotations=len(enhancements.get("annotations", [])),
                        has_text=enhancements.get("has_text_content", False),
                    )
                else:
                    logger.warning(
                        "Invalid enhancement data structure",
                        product_id=product_id,
                        keys=list(enhancements.keys())
                    )
        except Exception as e:
            logger.warning(
                "Failed to generate image enhancements",
                product_id=product_id,
                error=str(e)
            )

        await ws.send_json({"type": "final_answer", "content": ""})

    except Exception as e:
        logger.error(
            "Error in query handler",
            client_id=client_id,
            product_id=product_id,
            error=str(e),
        )
        await ws.send_json({"type": "error", "message": str(e)})
