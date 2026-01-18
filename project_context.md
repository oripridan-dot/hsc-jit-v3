# 🧠 Project Memory & Context (The "Bible")

## 1. Current Goal (Updated: January 18, 2026)

- **Focus:** V3.7 Production-Ready - Product Hierarchy + Brand Theming
- **Active Branch:** v3.7-dev
- **Last Big Change:** Complete Navigator refactor with API integration + Roland brand theming
- **Status:** ✅ Core features working, ready for expansion

## 2. The "No-Go" Zone (Rules)

- Do not change the `backend/core` logic without asking.
- Always use English for code comments, but Hebrew is okay for user prompts.
- Never delete the 'docs' folder.
- Backend API must always run on port 8000
- Frontend dev server must always run on port 5173

## 3. Architecture Shortcut

- **Frontend:** React + Vite (`frontend/`)
  - Main: `src/App.tsx`
  - Navigator: `src/components/Navigator.tsx` (fetches from API)
  - Theme: `src/styles/brandThemes.ts`
- **Backend:** Python + FastAPI (`backend/`)
  - API: `app/main.py` (serves product data)
  - Orchestrator: `orchestrate_brand.py` (THE entry point for scraping)
- **Key Logic:**
  - `backend/app/main.py` (FastAPI REST API)
  - `backend/services/roland_scraper.py` (Web scraper)
  - `backend/models/product_hierarchy.py` (Data Models)
  - `frontend/src/styles/brandThemes.ts` (Brand theming system)

## 4. Quick Commands

```bash
# Start Backend API
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start Frontend
cd frontend && pnpm dev

# Scrape Products
cd backend && python orchestrate_brand.py --brand roland --max-products 50

# Health Check
curl http://localhost:8000/health

# Clean Everything
./deep_clean.sh

# Cleanup Branch
./cleanup_v3.7.sh
```

## 5. Current State (v3.7)

✅ **Working:**

- FastAPI backend serving 29 Roland products
- Product hierarchy (5 categories, 7 subcategories)
- Navigator with Roland branding
- Brand theme system
- Auto-expanding categories
- High-contrast UI

⏳ **In Progress:**

- WebSocket integration (unifiedRouter)
- More brand themes (Yamaha, Korg)
- Product images in Navigator

🔮 **Next:**

- JIT RAG system integration
- Price data from Halilit
- Multiple brand support
