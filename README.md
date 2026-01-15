# Halilit Smart Catalog JIT v3.5 - Dual-Source Intelligence

A production-grade, real-time product discovery system with intelligent dual-source synchronization. Combines Halilit distributor inventory (primary, pricing/availability) with brand website data (reference, specifications) through unified query router and WebSocket architecture.

## Architecture Overview

```
┌─ Frontend (React + TypeScript) ─────────────────────┐
│ Explorer + PromptBar + ChatView                      │
│ └─→ unifiedRouter WebSocket                          │
│                                                       │
├─ Backend (FastAPI + Python) ─────────────────────────┤
│ Unified Query Router                                 │
│ ├─ CatalogService (1,860+ products, 90 brands)      │
│ ├─ Dual-Source Orchestrator                         │
│ │  ├─ Halilit Scraper (PRIMARY - pricing/stock)    │
│ │  └─ Brand Website Scraper (REFERENCE - specs)    │
│ ├─ Product Merger (intelligent matching)            │
│ ├─ SnifferService (predictions)                    │
│ ├─ ContentFetcher (manuals)                         │
│ └─ GeminiService (LLM)                              │
└──────────────────────────────────────────────────────┘
```

**Dual-Source Strategy**:
- **Halilit (Primary)**: Real-time product availability, pricing, stock levels
- **Brand Websites**: Product specifications, features, model variants
- **Unified Catalog**: Merged view with intelligent matching (0.85+ similarity threshold)
- **Coverage Classification**: PRIMARY (matched on both), SECONDARY (website-only), HALILIT_ONLY (accessories)

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

- `GET /api/products` - 1,860+ unified products (dual-source merged)
- `GET /api/brands` - 90 brands with coverage stats
- `GET /api/catalogs/{brand}` - Brand-specific unified catalog with source attribution

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

## v3.5 Enhancements

### Core Improvements

- **Smart Deduplication**: Halilit scraper with intelligent page tracking to prevent duplicate product counting
- **Multi-Language Matching**: Hebrew/English product name normalization for accurate cross-source matching
- **URL Pattern Fixes**: Corrected Halilit search endpoints (`?q=` instead of `?brand=`) for accurate inventory retrieval
- **Product Merge Intelligence**: Similarity-based matching (0.85+ threshold) with source attribution
- **Catalog Persistence**: Automatic catalog caching for brand website and Halilit sources
- **Coverage Analytics**: Detailed source classification (PRIMARY/SECONDARY/HALILIT_ONLY) for inventory planning

### Data Quality

- **Nord Validation**: 37 Halilit products + 13 website products = 38 unified (12 PRIMARY, 1 SECONDARY, 26 accessories)
- **Accurate Counts**: Fixed pagination issues that previously inflated product counts (1480→37)
- **Real-time Updates**: Continuous syncing via orchestrated dual-source pipeline

## Status

✅ **Production Ready - v3.5**

- Dual-source synchronization fully integrated and tested
- Halilit scraper with deduplication and improved matching
- Real-time predictions and WebSocket communication working
- 1,860+ products across 90 brands with source attribution
- Unified catalog merge with quality validation
- All paths and endpoints verified

See [INTEGRATION_VERIFICATION.md](./INTEGRATION_VERIFICATION.md) for detailed verification.
