# HSC-JIT V3.7.0

**Product Hierarchy Navigation System**

> **System Status**: Production-Ready (Static Mode, Roland Brand) | **Last Updated**: 2026-01-19

A fast, hierarchical product navigation system with static catalog loading, instant client-side search, and AI-powered navigation assistance.

## 📚 Key Documents

- **[project_context.md](project_context.md)** — System architecture & data structures
- **[QUICK_START.md](QUICK_START.md)** — Developer quick-start guide
- **[Architecture Docs](docs/)** — Detailed system design

## 🚀 Quick Start

### Frontend (Required)

```bash
cd frontend
pnpm install
pnpm dev
# Open http://localhost:5173
```

**Current Features:**

- ✅ Static Roland catalog (29 products)
- ✅ Hierarchical tree navigation
- ✅ Client-side fuzzy search (<50ms)
- ✅ Product detail view with media gallery
- ✅ Halileo AI Navigator (text + voice stub)
- ✅ Dynamic brand theming (WCAG AA compliant)
- ✅ Context-aware insights panel

### Backend (Optional - Future Features)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements-v3.7.txt
python -m uvicorn app.main:app --reload
```

**Backend Status:**

- ✅ FastAPI REST API (serve static catalog)
- ✅ Brand scraper infrastructure
- ✅ JIT RAG system (unintegrated, roadmap)
- ⏳ WebSocket real-time predictions (roadmap)
- ⏳ Multi-brand support (planned)

## 🏗️ Architecture

### Components (v3.7)

| Component              | Purpose                     | Status    |
| ---------------------- | --------------------------- | --------- |
| **HalileoNavigator**   | AI co-pilot sidebar         | ✅ Active |
| **Navigator**          | Tree navigation             | ✅ Active |
| **Workbench**          | Product detail pane         | ✅ Active |
| **MediaBar**           | Images/videos/audio sidebar | ✅ Active |
| **ImageGallery**       | Cinema mode viewer          | ✅ Active |
| **HalileoContextRail** | Insights floating panel     | ✅ Active |

### Data Model

- **Source**: `frontend/public/data/catalogs_brand/` (static JSON)
- **Index**: `frontend/public/data/index.json` (brand list)
- **Current**: Roland (29 products) + framework for 90+ brands
- **Search**: Fuse.js fuzzy search on client

## 📋 Implementation Status

### ✅ Complete

- Static catalog system
- Instant search (<50ms)
- Product hierarchy (3-4 levels)
- Brand theming system (WCAG AA)
- Media gallery & detail views
- Context insights panel

### ⏳ Roadmap

- **Multi-brand**: Add Yamaha, Korg, Moog, Nord, etc. (2-3 weeks effort)
- **JIT RAG**: Wire embeddings retrieval + LLM insights (1-2 weeks)
- **WebSocket**: Implement real-time predictions (deferred)
- **Voice**: Complete speech-to-text integration (deferred)

### ❌ Removed / Archived

- Unused dependencies (redis, spacy, gsap)
- Dead code (AIAssistant import, unused state vars)
- Orphaned documentation (50+ analysis files → `/docs/archive/cleanup_v37/`)
- Duplicate scripts (skeleton scrapers, janitor)
- Orphaned folders (backend/backend, backend/frontend)

## 🛠️ Development

### Type Safety

```bash
cd frontend
npx tsc --noEmit  # Check types
npm run lint      # ESLint
```

### Testing

```bash
cd backend
pytest tests/ -v
```

### Scripts

```bash
# Scrape new brand data
cd backend
python orchestrate_brand.py --brand yamaha --max-products 50
```

## 🎯 Next Steps

1. **Multi-brand Support** — Uncomment brand scraper loops, test with Yamaha
2. **JIT RAG Integration** — Add `/api/rag/query` endpoint, connect embeddings
3. **Type Safety** — Fix remaining TypeScript `any` types (in progress)
4. **Voice Processing** — Add speech-to-text backend endpoint

## 📞 Support

See [project_context.md](project_context.md) for system design.
See [QUICK_START.md](QUICK_START.md) for common commands.

## 📊 Current Status

**Brands:** Roland (29 products)  
**Categories:** 5 (Electronic Drums, Digital Pianos, Synthesizers, Guitar Products, Wind Instruments)  
**Search:** <50ms instant fuzzy search  
**Design:** WCAG AA compliant with semantic tokens

## 🚀 Development

```bash
# Add new brand data
cd backend && python orchestrate_brand.py --brand yamaha --max-products 50

# Type check
cd frontend && npx tsc --noEmit

# Build production
cd frontend && pnpm build
```

## 🔧 Key Files

- `frontend/src/App.tsx` - Main application layout
- `frontend/src/components/HalileoNavigator.tsx` - AI navigation
- `frontend/src/components/Navigator.tsx` - Tree navigation
- `frontend/src/lib/catalogLoader.ts` - Static data loader
- `frontend/public/data/index.json` - Brand index
- `.github/copilot-instructions.md` - Development guidelines

## ⚠️ Migration from v3.6

v3.7 replaces the old unified architecture with a cleaner, faster approach:

**Removed:**

- UnifiedComponents.tsx
- TheStage.tsx
- DualSource verification UI
- WebSocket-first architecture (moved to optional)

**Added:**

- HalileoNavigator with AI guide mode
- Static catalog loading (no backend required)
- WCAG AA design system
- Voice command support

---

**Production Status:** Ready for Roland brand expansion  
**Next Steps:** Add more brands, implement JIT RAG backend
