# HSC-JIT V3.7.0

**Product Hierarchy + Static Catalog**

> **System Status**: Production-Ready (Roland) | **Last Updated**: 2026-01-18

The v3.7 architecture provides a fast, hierarchical product navigation system with static catalog loading, instant search, and AI-powered navigation assistance.

## 📚 Documentation

The official documentation is located in the [`docs/`](docs/) directory.

- [**Start Here: Quick Start Guide**](docs/getting-started/quick-start.md)
- [Documentation Index](docs/README.md)
- [Architecture Overview](docs/architecture/product-hierarchy.md)
- [Design System V3](frontend/DESIGN_SYSTEM_V3_WCAG.md)
- [Halileo Enhanced](frontend/HALILEO_ENHANCED.md)

## ⚡ Quick Setup

```bash
# Frontend (required)
cd frontend
pnpm install
pnpm dev
# Open http://localhost:5173

# Backend (optional - for future JIT RAG)
cd backend
python -m uvicorn app.main:app --reload
```

## 🏗️ v3.7 Architecture

### Frontend (Static + Fast)

- React 18 + TypeScript + Vite 5
- Static catalog loading from `public/data/catalogs_brand/`
- Client-side search with Fuse.js (<50ms)
- Hierarchical navigation: Domain → Brand → Category → Subcategory → Product
- WCAG AA compliant design system
- Halileo AI co-pilot with voice commands

### Backend (Optional)

- FastAPI REST API for future JIT RAG features
- Currently serves same data as static files
- Redis caching layer
- Scraper orchestration: `orchestrate_brand.py`

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
