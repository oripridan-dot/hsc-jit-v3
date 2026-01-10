from __future__ import annotations

import asyncio
import json
from typing import Any, Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .services.catalog import CatalogService
from .services.sniffer import SnifferService

app = FastAPI(title="HSC JIT v3 - Psychic Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    # Initialize catalog and sniffer services
    catalog = CatalogService()
    sniffer = SnifferService(catalog)
    app.state.catalog = catalog
    app.state.sniffer = sniffer
    print("[Startup] CatalogService and SnifferService initialized")


@app.websocket("/ws/predict")
async def ws_predict(ws: WebSocket) -> None:
    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            try:
                payload: Dict[str, Any] = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON"
                }))
                continue

            msg_type = payload.get("type")
            content = payload.get("content", "")

            # Only handle typing events for now
            if msg_type == "typing":
                sniffer: SnifferService = app.state.sniffer
                predictions = sniffer.predict(str(content), limit=3)
                await ws.send_text(json.dumps({
                    "type": "prediction",
                    "data": predictions,
                }, ensure_ascii=False))
            else:
                await ws.send_text(json.dumps({
                    "type": "error",
                    "message": f"Unsupported message type: {msg_type}",
                }))
    except WebSocketDisconnect:
        # Client disconnected gracefully
        return
    except Exception as e:
        # Unexpected error at connection level
        try:
            await ws.send_text(json.dumps({
                "type": "error",
                "message": f"Server error: {e}",
            }))
        except Exception:
            pass
        finally:
            await ws.close()
