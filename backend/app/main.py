from __future__ import annotations

import asyncio
import json
import uuid
import logging
import os
from dotenv import load_dotenv
from typing import Any, Dict, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.responses import Response

# Load environment variables (e.g. GEMINI_API_KEY)
load_dotenv()

from .services.catalog import CatalogService
from .services.sniffer import SnifferService
from .services.fetcher import ContentFetcher
from .services.rag import EphemeralRAG
from .services.llm import GeminiService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HSC JIT v3 - Psychic Engine")

# Serve self-hosted assets (logos, product shots)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

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
    if request.url.path.startswith("/static/"):
        response.headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
    return response

@app.on_event("startup")
async def startup_event() -> None:
    # Initialize services
    app.state.catalog = CatalogService()
    app.state.sniffer = SnifferService(app.state.catalog)
    app.state.fetcher = ContentFetcher()
    app.state.rag = EphemeralRAG()
    app.state.llm = GeminiService()
    
    # Create a quick lookup map for products
    # CatalogService loads everything into self.products
    app.state.product_map = {
        p.get("id"): p for p in app.state.catalog.products if p.get("id")
    }
    
    logger.info("[Startup] All Services Initialized")

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    # Unique session ID for RAG isolation
    session_id = str(uuid.uuid4())
    logger.info(f"New WebSocket connection: {session_id}")
    
    try:
        while True:
            raw = await ws.receive_text()
            try:
                payload: Dict[str, Any] = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = payload.get("type")
            
            if msg_type == "typing":
                content = payload.get("content", "")
                sniffer: SnifferService = app.state.sniffer
                # Predict
                predictions = sniffer.predict(str(content), limit=3)
                
                # Hydrate predictions with context (brand identity + related items)
                enriched_predictions = []
                for pred in predictions:
                    product_id = pred.get("product", {}).get("id")
                    if product_id:
                        full_product_context = app.state.catalog.get_product_with_context(product_id)
                        if full_product_context:
                            # Merge the prediction with rich context
                            enriched_pred = {
                                "product": full_product_context.get("product"),
                                "brand": full_product_context.get("brand"),
                                "context": full_product_context.get("context"),
                                "confidence": pred.get("confidence"),
                                "match_text": pred.get("match_text")
                            }
                            enriched_predictions.append(enriched_pred)
                    else:
                        enriched_predictions.append(pred)
                
                # Send prediction event with rich context
                await ws.send_json({
                    "type": "prediction",
                    "data": enriched_predictions
                })
                
            elif msg_type in ["query", "lock_and_query"]:
                product_id = payload.get("product_id")
                query_text = payload.get("query") or payload.get("content") or ""
                image_data = payload.get("image")

                if not product_id:
                    await ws.send_json({
                        "type": "status",
                        "msg": "Error: No product selected."
                    })
                    continue
                
                # 1. Send status: fetching
                await ws.send_json({
                    "type": "status",
                    "msg": "Reading Official Manual..."
                })
                
                # Retrieve product data WITH context
                product_with_context = app.state.catalog.get_product_with_context(product_id)
                if not product_with_context:
                    await ws.send_json({
                        "type": "status", 
                        "msg": "Error: Product not found."
                    })
                    continue
                
                # Extract the actual product for fetching
                product = product_with_context.get("product", {})
                
                # 2. Call Fetcher.fetch
                fetcher: ContentFetcher = app.state.fetcher
                manual_text = await fetcher.fetch(product)
                
                if not manual_text:
                    await ws.send_json({
                        "type": "status",
                        "msg": "Manual unavailable or empty."
                    })
                    # Use fallback or just continue with empty context?
                    # Better to inform user.
                    await ws.send_json({
                        "type": "answer_chunk",
                        "content": "I couldn't find the manual for this product to answer your question."
                    })
                    continue

                # 3. Call EphemeralRAG.index
                rag: EphemeralRAG = app.state.rag
                await ws.send_json({"type": "status", "msg": "Analyzing content..."})
                
                success = rag.index(session_id, manual_text)
                if not success:
                    # Fallback if RAG fails (e.g. no ML libs)
                    logger.warning("RAG indexing failed/disabled, using raw text truncation.")
                    retrieved_context = manual_text[:8000] # simple truncation
                else:
                    # Retrieve relevant context
                    retrieved_context = rag.query(session_id, query_text)
                
                # 4. Call Gemini with enriched context (brand + manual)
                llm: GeminiService = app.state.llm
                await ws.send_json({"type": "status", "msg": "Thinking..."})
                
                # Build enriched context with brand information
                brand = product_with_context.get("brand", {})
                related_items = product_with_context.get("context", {}).get("related_items", [])
                
                # Create a context string that includes brand and related products for reference
                brand_context = ""
                if brand:
                    brand_context = f"\n**Brand Context:**\n- Brand: {brand.get('name', '')} (HQ: {brand.get('hq', '')})\n- Product: {product.get('name', '')} (Origin: {product.get('production_country', '')})"
                
                related_context = ""
                if related_items:
                    related_names = [item.get("name") for item in related_items if item.get("name")]
                    if related_names:
                        related_context = f"\n**Related Products Available:** {', '.join(related_names[:3])}"
                
                # Combine all context
                full_context = retrieved_context + brand_context + related_context
                
                has_answers = False
                async for chunk in llm.stream_answer(full_context, query_text, image_data=image_data):
                    has_answers = True
                    await ws.send_json({
                        "type": "answer_chunk",
                        "content": chunk
                    })
                
                if not has_answers:
                     await ws.send_json({
                        "type": "answer_chunk",
                        "content": "No answer generated."
                    })

                # Send relations if present - ENRICHED with full context
                await ws.send_json({
                    "type": "context",
                    "data": {
                        "brand": product_with_context.get("brand"),
                        "related_items": product_with_context.get("context", {}).get("related_items", [])
                    }
                })
                    
                await ws.send_json({"type": "final_answer", "content": ""})

    except WebSocketDisconnect:
        logger.info(f"Disconnected: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except:
            pass
