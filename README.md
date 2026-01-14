# Unified Router - Halilit Smart Catalog JIT v3

A production-grade, real-time product discovery system powered by a unified query router architecture. Seamless integration of Explorer and PromptBar interfaces through single WebSocket connection.

## Architecture Overview

```
┌─ Frontend (React + TypeScript) ─┐
│ Explorer + PromptBar + ChatView  │
│ └─→ unifiedRouter WebSocket      │
│                                   │
└─ Backend (FastAPI + Python) ──────┤
  │ Unified Query Router             │
  ├─ CatalogService (90 brands)     │
  ├─ SnifferService (predictions)   │
  ├─ ContentFetcher (manuals)       │
  └─ GeminiService (LLM)             │
```

## Quick Start

### Prerequisites
```bash
# Backend
pip install -r backend/requirements.txt

# Frontend (Node 18+)
cd frontend && pnpm install
```

### Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend && pnpm dev
```

Access at: `http://localhost:5174`

## API Reference

### WebSocket `/ws`

**Typing (Real-time predictions)**
```json
{"type": "typing", "content": "moog"}
→ {"type": "prediction", "data": [products]}
```

**Unified Query**
```json
{"type": "unified_query", "query": "How to use filter?", "source": "explorer"}
→ LLM-powered response via ChatView
```

### REST Endpoints

- `GET /api/products` - 1,860 products
- `GET /api/brands` - 90 brands

## Project Structure

```
hsc-jit-v3/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI + WebSocket
│   │   ├── services/         
│   │   │   ├── unified_router.py ← Core logic
│   │   │   ├── catalog.py
│   │   │   ├── sniffer.py
│   │   │   └── ...
│   │   └── core/validation.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── store/
│   │   │   ├── unifiedRouter.ts  ← Core logic
│   │   │   └── useWebSocketStore.ts
│   │   ├── components/
│   │   │   ├── ZenFinder.tsx
│   │   │   ├── FolderView.tsx
│   │   │   └── ChatView.tsx
│   │   └── ...
│   └── vite.config.ts
│
├── INTEGRATION_VERIFICATION.md
├── docker-compose.yml
└── README.md (this file)
```

## Status

✅ **Production Ready**
- Unified router fully integrated
- Real-time predictions working
- 1,860 products across 90 brands
- All paths and endpoints verified
- Clean, focused codebase

See [INTEGRATION_VERIFICATION.md](./INTEGRATION_VERIFICATION.md) for detailed verification.
