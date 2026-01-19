# HSC JIT v3.7 - Copilot System Instructions

## 🎯 Core Philosophy: "Mission Control"

We are building a production-grade **Product Hierarchy Navigation System** with:

1. **Static Catalog** ✅ - Pre-built JSON from scraped brand data (fast, no backend dependency)
2. **Instant Search** ✅ - Client-side fuzzy search with Fuse.js (<50ms)
3. **Hierarchical Navigation** ✅ - Domain → Brand → Category → Product
4. **Dynamic Theming** ✅ - Per-brand color schemes with WCAG AA compliance
5. **Halileo AI Co-Pilot** ⏳ - Text-enabled navigation; voice stub (TBD)

---

## ⚠️ CRITICAL: v3.7 System State (As of 2026-01-19)

**Status: PRODUCTION-READY (Static Mode, Single Brand)**

### ✅ COMPLETE & ACTIVE
- Static Roland catalog (29 products)
- Hierarchical navigation (3-4 levels)
- Client-side fuzzy search
- Product detail views with media
- Brand theming system (WCAG AA)
- Context insights panel
- All active components below

### ⏳ ROADMAP (NOT IMPLEMENTED YET)
- **Multi-brand Support**: Framework exists; only Roland scraped
- **JIT RAG System**: `jit_rag.py` written but not wired to API
- **WebSocket Streaming**: Stub in `useWebSocketStore`; no server endpoint
- **Voice Processing**: `SpeechRecognition` stub; no backend transcription
- **Embeddings Retrieval**: SentenceTransformers installed; no API endpoint

### 🗑️ REMOVED (CLEANUP 2026-01-19)
- **Dead Code**: Unused imports, state vars from App.tsx
- **Orphaned Scripts**: `janitor.py`, skeleton scrapers, cleanup shells
- **Unused Dependencies**: redis, spacy, gsap
- **Orphaned Folders**: `backend/backend`, `backend/frontend`
- **Documentation Bloat**: 50+ analysis files → `/docs/archive/cleanup_v37/`

---

## 🏗️ v3.7 Architecture (CURRENT)

### 1. Data Source of Truth

- **Primary:** `frontend/public/data/catalogs_brand/roland.json` (static catalog)
- **Index:** `frontend/public/data/index.json` (brand list, 1 entry)
- **Backend (optional):** FastAPI at `localhost:8000` for future JIT RAG
- **Current brands:** Roland (29 products)
- **Future brands:** Yamaha, Korg, Moog, Nord, etc. (framework ready)

### 2. Component Architecture

**Active Components (v3.7):**

- `App.tsx` - Main layout (cleaned: removed dead imports/state)
- `HalileoNavigator.tsx` - AI co-pilot sidebar (text mode active)
- `Navigator.tsx` - Tree navigation with hierarchy
- `Workbench.tsx` - Product detail pane
- `MediaBar.tsx` - Images/videos/audio sidebar
- `ImageGallery.tsx` - Cinema mode viewer
- `HalileoContextRail.tsx` - Floating insights panel
- `ProductDetailView.tsx` - Modal detail view

**NOT RENDERED (But Exist):**

- `AIAssistant.tsx` - Chat interface (never imported)
- `SignalFlowMap.tsx` - Signal flow diagram (never integrated)

### 3. State Management

- **Navigation:** `useNavigationStore` (Zustand)
  - Current level, active path, selected product, tree state
- **WebSocket:** `useWebSocketStore` (Zustand)
  - Stub interfaces defined; actual WS logic not implemented
  - Falls back to static mode gracefully
- **Theme:** CSS variables + `useBrandTheme`/`useHalileoTheme` hooks

### 4. Design System

**Semantic Tokens (WCAG AA):**

```css
--bg-app: #0b0c0f (dark) | #f9fafb (light)
--bg-panel: #15171e (dark) | #ffffff (light)
--text-primary: #f3f4f6 (dark) | #111827 (light)
--text-secondary: #9ca3af (dark) | #374151 (light)
--halileo-primary: #6366f1 (indigo)
--border-subtle: #2d313a (dark) | #e5e7eb (light)
```

**Brand Colors (WCAG compliant):**

- Roland: `#ef4444` (red) ✅ active
- Yamaha: `#a855f7` (purple) — ready
- Korg: `#fb923c` (orange) — ready
- Moog: `#22d3ee` (cyan) — ready
- Nord: `#f87171` (red-light) — ready

---

## 🛠️ Tech Stack

### Frontend (React 18 + TypeScript)

- **Build:** Vite 5
- **Styling:** Tailwind CSS + CSS variables
- **Animation:** Framer Motion (gsap removed)
- **Search:** Fuse.js (instant, <50ms)
- **State:** Zustand
- **Icons:** Lucide-react
- **Graphs:** Reactflow (SignalFlowMap)

### Backend (Optional)

- **Framework:** FastAPI + Uvicorn
- **AI/ML:** SentenceTransformers (installed, not used)
- **Scraper:** Playwright + BeautifulSoup
- **Search:** Fuse.js (Python version for backend fallback)

---

## 📋 Development Guidelines

### Code Style

```typescript
// Always use explicit types
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  images?: ProductImages;
}

// Use semantic tokens for styling
<div style={{
  background: 'var(--bg-panel)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-subtle)'
}}>
```

### File Organization

```
frontend/
├── src/
│   ├── components/
│   │   ├── HalileoNavigator.tsx (AI navigation)
│   │   ├── Navigator.tsx (tree navigation)
│   │   ├── Workbench.tsx (main display)
│   │   ├── ProductDetailView.tsx (product modal)
│   │   └── ui/ (reusable UI components)
│   ├── hooks/
│   │   ├── useBrandTheme.ts (dynamic brand colors)
│   │   └── useHalileoTheme.ts (AI active state)
│   ├── lib/
│   │   ├── catalogLoader.ts (load static JSON)
│   │   └── instantSearch.ts (Fuse.js wrapper)
│   ├── store/
│   │   ├── navigationStore.ts (hierarchy state)
│   │   └── useWebSocketStore.ts (future)
│   └── styles/
│       ├── tokens.css (design system)
│       └── brandThemes.ts (brand colors)
└── public/
    └── data/
        ├── index.json (brand index)
        └── catalogs_brand/*.json (product catalogs)
```

---

## ✅ v3.7 Implementation Status

**Completed:**

- ✅ Static catalog loading (catalogLoader)
- ✅ Hierarchical navigation (Navigator)
- ✅ Instant search (Fuse.js)
- ✅ Halileo AI navigator (voice + text)
- ✅ Brand theming system (WCAG AA)
- ✅ Product detail view
- ✅ Cinema mode image gallery
- ✅ Context insights rail
- ✅ Analytics tracking

**In Progress:**

- 🔄 Backend API integration (optional)
- 🔄 JIT RAG system
- 🔄 Multi-brand support (currently Roland-only)

**Deprecated (DO NOT DEVELOP):**

- ❌ UnifiedComponents architecture
- ❌ DualSource verification UI
- ❌ ScenarioToggle
- ❌ SyncMonitor

---

## 🚀 Quick Commands

```bash
# Frontend development
cd frontend && pnpm dev

# Backend (optional)
cd backend && uvicorn app.main:app --reload

# Scrape new brands
cd backend && python orchestrate_brand.py --brand roland --max-products 50

# Type check
cd frontend && npx tsc --noEmit

# Build production
cd frontend && pnpm build
```

---

## 🔧 Common Patterns

### Loading Products

```typescript
// Use catalogLoader for static data
const catalog = await catalogLoader.loadBrand("roland");

// Use instantSearch for filtering
const results = instantSearch.search("synthesizer", { limit: 10 });
```

### Applying Brand Theme

```typescript
// Component-level
useBrandTheme("roland");

// Global (in App.tsx)
applyBrandTheme("roland");
```

### Navigation

```typescript
// Navigate to product
const { selectProduct } = useNavigationStore();
selectProduct(productNode);

// Navigate to level
const { warpTo } = useNavigationStore();
warpTo("family", ["Roland", "Synthesizers"]);
```

---

**Version:** 3.7.0 (Product Hierarchy)  
**Last Updated:** January 2026  
**Status:** Production-Ready (Roland brand)

- **Cache:** Redis 6+ (Pub/Sub + multi-layer caching)
- **AI/ML:** Google Gemini API (LLM), SentenceTransformers (embeddings)
- **Search:** TheFuzz (fuzzy matching)
- **HTTP:** HTTPX (async client for PDF/HTML fetching)
- **Parsing:** PyMuPDF (PDF), BeautifulSoup4 (HTML)

### Frontend

- **Framework:** React 18 + TypeScript
- **Build:** Vite 5 (fast dev server, HMR)
- **Styling:** Tailwind CSS (utility-first)
- **State:** Zustand (lightweight store)
- **WebSocket:** Native WebSocket API

### Infrastructure

- **Container:** Docker + Docker Compose
- **Orchestration:** Kubernetes (production)
- **Monitoring:** Prometheus + Grafana
- **Logging:** Structured JSON logs
- **CI/CD:** GitHub Actions

---

## 📋 Development Guidelines

### Code Style

```python
# Backend - Always use type hints
async def predict_product(
    self,
    query: str,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Predict products from partial query.

    Args:
        query: User input text
        limit: Maximum results to return

    Returns:
        List of product dictionaries with scores
    """
    pass
```

```typescript
// Frontend - Explicit types
interface PredictionEvent {
  type: "prediction";
  products: Product[];
  confidence: number;
}

const handlePrediction = (event: PredictionEvent): void => {
  // Handle prediction
};
```

### File Organization

```
backend/
├── app/
│   ├── core/              # Infrastructure (cache, health, metrics, logging)
│   ├── services/          # Business logic (sniffer, rag, llm, fetcher)
│   └── main.py            # FastAPI app + WebSocket endpoint

frontend/
├── src/
│   ├── components/        # React components
│   ├── store/             # State management (WebSocket)
│   └── App.tsx            # Main app

docs/
├── architecture/          # System design
├── deployment/            # Production guides
├── operations/            # Runbook, troubleshooting
└── testing/               # Test reports
```

### WebSocket Message Format

```json
{
  "type": "prediction|query|status|answer_chunk|error",
  "data": {
    // Type-specific payload
  },
  "timestamp": "2026-01-11T12:00:00Z",
  "session_id": "uuid-v4"
}
```

### Error Handling

- **Always** catch exceptions at service boundaries
- **Always** log errors with context
- **Never** expose internal errors to frontend
- **Always** send user-friendly error messages

---

## 🚀 Performance Targets

| Metric                   | Target  | Current   |
| ------------------------ | ------- | --------- |
| Prediction latency (P95) | <200ms  | ~50-100ms |
| LLM answer (P95)         | <5s     | ~2-4s     |
| Cache hit rate           | >60%    | ~70-85%   |
| Memory per pod           | <1GB    | ~600MB    |
| CPU per pod              | <1 core | ~0.5 core |

---

## ✅ Before Committing

1. **Tests** - Run `pytest tests/ -v` (all must pass)
2. **Type checks** - No type errors in Python/TypeScript
3. **Linting** - Code follows style guidelines
4. **Documentation** - Update relevant docs in `docs/`
5. **No secrets** - No API keys or credentials in code

---

## 📚 Key Documentation

- **Architecture:** `docs/architecture/ARCHITECTURE.md`
- **Development:** `docs/development/IMPLEMENTATION_SUMMARY.md`
- **Operations:** `docs/operations/RUNBOOK.md`
- **Testing:** `docs/testing/TESTING_GUIDE.md`

---

## 🔧 Common Commands

```bash
# Start local development
./start.sh

# Run tests
pytest tests/ -v

# Check health
curl http://localhost:8000/health

# View metrics
curl http://localhost:8000/metrics

# Clean cache
redis-cli FLUSHDB
```

---

**Version:** 3.7 (JIT RAG & Hierarchy)  
**Last Updated:** January 2026
