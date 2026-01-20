# HSC-JIT v3.7.2 - CONSOLIDATED SYSTEM GUIDE

**⭐ THE ONLY SOURCE OF TRUTH**

**Version:** 3.7.2 | **Status:** Production-Ready | **Date:** January 20, 2026

---

## 📌 Quick Links (Everything You Need)

| Need              | Location                     |
| ----------------- | ---------------------------- |
| **Start Here**    | Section 1: Quick Start       |
| **Architecture**  | Section 2: System Overview   |
| **Development**   | Section 3: Development Guide |
| **Deployment**    | Section 4: Production        |
| **Copilot Rules** | Section 5: AI Development    |

---

# 🚀 1. QUICK START

### Installation

```bash
# Frontend
cd frontend && pnpm install && pnpm dev
# → http://localhost:5173

# Optional: Data regeneration
cd backend && python3 forge_backbone.py
```

### Key Facts

- **Framework:** React 19 + TypeScript 5 + Tailwind CSS
- **Data:** 117 products (Roland 99, Boss 9, Nord 9)
- **Search:** <50ms fuzzy search (Fuse.js, client-side)
- **Status:** ✅ Pure static SPA, zero backend required
- **Theming:** Per-brand colors, WCAG AA compliant

### File Structure (Essentials)

```
frontend/
├─ public/data/                    # ⭐ DATA SOURCE
│  ├─ index.json                   # Brand registry
│  └─ catalogs_brand/*.json        # Pre-built catalogs
├─ src/
│  ├─ lib/catalogLoader.ts         # Load JSON
│  ├─ lib/instantSearch.ts         # Fuse.js search
│  ├─ store/navigationStore.ts     # Zustand state
│  └─ components/App.tsx           # Main app
│
backend/
├─ forge_backbone.py               # ⭐ DATA GENERATOR
├─ orchestrate_brand.py            # Brand orchestration
├─ orchestrate_pipeline.py         # Legacy pipeline (deprecated)
├─ app/main.py                     # ⚠️ DEV TOOL ONLY
├─ services/                       # Scrapers & utilities
│  ├─ roland_scraper.py
│  ├─ boss_scraper.py
│  ├─ nord_scraper.py
│  ├─ moog_scraper.py
│  ├─ data_cleaner.py
│  ├─ hierarchy_scraper.py
│  └─ ecosystem_builder.py
├─ core/                           # Core logic
│  ├─ validator.py
│  ├─ matcher.py
│  ├─ cleaner.py
│  ├─ config.py
│  ├─ brand_contracts.py
│  ├─ progress_tracker.py
│  └─ metrics.py
├─ models/                         # Data models
│  └─ product_hierarchy.py
└─ tests/                          # Test suite
   ├─ unit/
   ├─ integration/
   └─ conftest.py
```

---

# 🏗️ 2. SYSTEM OVERVIEW

## The "Data Factory" Architecture

```
┌──────────────────┐
│   FACTORY        │  (Python, Offline)
│ ─────────────    │
│ forge_backbone.py│  Scrape → Clean → Enrich → Export
│ └─ Output: JSON  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   STATIC FILES   │  (Pre-built)
│ ─────────────    │
│ public/data/     │  index.json, catalogs_brand/*.json
│ *.json           │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   SHOWROOM       │  (React SPA)
│ ─────────────    │
│ Mission Control  │  Load JSON → Search → Navigate
│ Pure client-side │
└──────────────────┘
```

## Three Layers

### Layer 1: The Factory (Python Backend - Offline Only)

**Purpose:** Generate static data once, before deployment.

**Main Component:**

- `forge_backbone.py` - Master data generator
  - Scrapes product data from brand websites
  - Cleans invalid products/images
  - Enriches with metadata (pricing, SKU, embeddings)
  - Exports: `frontend/public/data/*.json`

**Quality Control (Dev-Only):**

- `backend/app/main.py` - Validation server
  - **⚠️ NOT DEPLOYED** (local dev only)
  - **Purpose:** Verify data during pipeline
  - Routes: `/health`, `/api/v1/brands`, `/api/v1/search`

**Key Principle:** Everything runs OFFLINE. No runtime API calls.

### Layer 2: Static Distribution (Pre-Built JSON)

**Location:** `frontend/public/data/`

**Files:**

- `index.json` - Brand registry + metadata
- `catalogs_brand/roland.json` - 99 products
- `catalogs_brand/boss.json` - 9 products
- `catalogs_brand/nord.json` - 9 products
- `catalogs_brand/moog.json` - 0 products

**Reality:** These are static, immutable files. Copied to CDN/static host as-is.

### Layer 3: The Showroom (React Frontend - Production SPA)

**Purpose:** Consume pre-built JSON, provide fast search/navigation.

**Key Files:**

- `App.tsx` - Loads JSON from `public/data/`
- `lib/catalogLoader.ts` - Fetches JSON files
- `lib/instantSearch.ts` - Fuse.js client-side search
- `store/navigationStore.ts` - Zustand state management

**Runtime Characteristics:**

- **100% client-side** (no backend calls)
- **Instant load:** <200ms (pure files)
- **Sub-50ms search:** Fuzzy matching in memory
- **Zero dependencies:** No API, database, or authentication

---

# 👨‍💻 3. DEVELOPMENT GUIDE

## Backend Structure (Production-Ready)

### Entry Points (Use These)

**`forge_backbone.py`** (CANONICAL)

- Master data generation pipeline
- **When:** Run offline before deployment
- **Command:** `python3 forge_backbone.py`
- **Output:** `frontend/public/data/*.json`
- **Modules used:**
  - `services/: Roland, Boss, Nord, Moog scrapers
  - `core/validator.py`: Data validation
  - `core/cleaner.py`: Invalid product removal
  - `core/matcher.py`: Product enrichment

**`orchestrate_brand.py`** (Utility)

- Brand-specific orchestration logic
- **When:** Customize brand-specific behavior
- **Used by:** `forge_backbone.py` internally

**`app/main.py`** (Dev-Only)

- FastAPI validation server
- **When:** Local testing during development
- **Command:** `uvicorn app.main:app --reload`
- **Routes:** `/health`, `/api/v1/brands`, `/api/v1/search`
- ⚠️ **NOT DEPLOYED** — dev-only quality control

### Modular Services (Internal)

**Scrapers** (`services/*_scraper.py`)

- `roland_scraper.py` - Roland product data
- `boss_scraper.py` - Boss product data
- `nord_scraper.py` - Nord product data
- `moog_scraper.py` - Moog product data (template)
- Each scraper: Independent, testable, reusable

**Data Processing** (`services/*_*.py`)

- `data_cleaner.py` - Remove invalid/missing data
- `hierarchy_scraper.py` - Category/hierarchy extraction
- `ecosystem_builder.py` - Cross-brand relationships

### Core Logic (Dependency Modules)

**Validation** (`core/validator.py`)

- Verify product completeness
- Check image/manual availability
- Ensure data quality

**Matching** (`core/matcher.py`)

- Match products across brands
- Enrich with metadata
- Prevent duplicates

**Configuration** (`core/config.py`)

- Brand URLs, selectors, settings
- Scraper configurations
- Output paths

### Test Suite (`tests/`)

- `unit/`: Individual component tests
- `integration/`: End-to-end pipeline tests
- `conftest.py`: Fixtures and setup

---

## Development Workflow

### Scenario A: Modify Frontend (UI/UX)

```bash
# 1. Edit React components
vim frontend/src/components/App.tsx

# 2. Test locally
cd frontend && pnpm dev
# → http://localhost:5173

# 3. Deploy
pnpm build
# → dist/ is ready for Vercel/Netlify
```

**✅ DO:**

- Use React hooks (useState, useEffect)
- Use Zustand for state (`navigationStore`)
- Use Tailwind CSS for styling
- Load data from `public/data/*.json`

**❌ DON'T:**

- Make fetch() calls to `localhost:8000`
- Use WebSocket connections
- Call backend APIs
- Create new CSS files (use Tailwind)

### Scenario B: Update Product Data

```bash
# 1. Update brand scrapers (if needed)
vim backend/services/hierarchy_scraper.py

# 2. Run data generator (OFFLINE)
cd backend && python3 forge_backbone.py

# 3. Verify
ls frontend/public/data/catalogs_brand/

# 4. Commit & deploy
git add frontend/public/data/
git commit -m "chore: Update product catalogs"
# → Redeploy frontend
```

**Important:** Data generation is COMPLETELY OFFLINE. No server needed.

### Scenario C: Debug Frontend

```bash
# Frontend loads data from public/data/
# If data is missing:

1. Check: ls frontend/public/data/index.json
2. Regenerate: cd backend && python3 forge_backbone.py
3. Restart: cd frontend && pnpm dev
```

## Development Tools

### Optional: Local Validation Server

```bash
cd backend && uvicorn app.main:app --reload
# http://localhost:8000/api/docs
```

**Use ONLY for:**

- Verifying API responses during scraping
- Testing endpoint logic
- **NOT for production** (this server is dev-only)

### Frontend Debugging

```bash
# Type check
cd frontend && npx tsc --noEmit

# Build test
cd frontend && pnpm build
```

---

# 🌍 4. PRODUCTION & DEPLOYMENT

## Deployment Architecture

**What Gets Deployed:**

```
frontend/dist/
├─ index.html
├─ assets/*.js (React app)
├─ assets/*.css (Tailwind styles)
└─ data/
   ├─ index.json
   └─ catalogs_brand/*.json
```

**What Doesn't:**

- ❌ `backend/` (dev-only, not needed)
- ❌ `.venv/` (Python venv)
- ❌ `node_modules/` (installed on deploy)

## Deployment Options (Free/Cheap)

| Platform                | Cost    | Setup   | Notes                 |
| ----------------------- | ------- | ------- | --------------------- |
| **Vercel**              | Free    | <2 min  | Recommended for React |
| **Netlify**             | Free    | <2 min  | Drag-and-drop         |
| **GitHub Pages**        | Free    | <5 min  | Subdomain only        |
| **AWS S3 + CloudFront** | $1-5/mo | <10 min | Most scalable         |
| **Cloudflare Pages**    | Free    | <2 min  | Global CDN            |

### Deploy to Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
cd frontend && vercel --prod

# 3. Done! https://hsc-jit.vercel.app
```

### Deploy to Netlify

```bash
# 1. Build
cd frontend && pnpm build

# 2. Deploy (drag dist/ to netlify.app)
# OR use CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Production Checklist

- [ ] Run `pnpm build` (no errors)
- [ ] Verify `dist/` has `data/` folder
- [ ] Test locally: serve dist/ with `npx http-server`
- [ ] Deploy to Vercel/Netlify
- [ ] Test: Open deployed URL, verify products load
- [ ] Test: Search works (client-side, no network)
- [ ] Monitor: Check browser DevTools console (no errors)

## Performance Targets

| Metric              | Target | Actual        |
| ------------------- | ------ | ------------- |
| Initial Load        | <1s    | ~200-300ms ✅ |
| Search Response     | <100ms | ~30-50ms ✅   |
| JSON Payload        | <500KB | ~150-200KB ✅ |
| Time to Interactive | <2s    | ~400-500ms ✅ |

---

# 🤖 5. COPILOT DEVELOPMENT RULES

## Core Principles

This is a **STATIC FIRST** application. All data is pre-built.

### ✅ What Copilot SHOULD Suggest

```typescript
// ✅ CORRECT: Load from static JSON
import { catalogLoader } from "./lib/catalogLoader";
const products = await catalogLoader.loadBrand("roland");

// ✅ CORRECT: Client-side search
import { instantSearch } from "./lib/instantSearch";
const results = instantSearch.search("synthesizer", { keys: ["name"] });

// ✅ CORRECT: Zustand state
import { useNavigationStore } from "./store/navigationStore";
const { selectProduct } = useNavigationStore();
```

### ❌ What Copilot MUST NEVER Suggest

```typescript
// ❌ WRONG: No API calls to backend
fetch("http://localhost:8000/api/products");

// ❌ WRONG: No WebSocket
new WebSocket("ws://localhost:8000/ws");

// ❌ WRONG: No database
db.query("SELECT * FROM products");

// ❌ WRONG: No server-side rendering
export async function getServerSideProps() {}
```

### Forbidden Patterns

| Anti-Pattern                         | Why                       | Solution                                     |
| ------------------------------------ | ------------------------- | -------------------------------------------- |
| `fetch('http://localhost:8000/...')` | Backend not in production | Load from `public/data/*.json`               |
| `new WebSocket()`                    | No real-time features     | Use static JSON + redeploy                   |
| `useEffect(() => fetch(...))`        | API calls block render    | Use pre-loaded data from loader              |
| Creating new CSS files               | Style system exists       | Use Tailwind + CSS variables                 |
| Mixing Python/TypeScript             | Architecture separation   | Keep Python in `backend/`, TS in `frontend/` |
| Calling `orchestrate_pipeline.py`    | Legacy script             | Use `forge_backbone.py`                      |

---

# 📋 6. DATA PIPELINE REFERENCE

## How Data Flows (Offline Process)

```
1. SCRAPING
   Input: Brand URLs (Roland, Boss, Nord)
   Process: hierarchy_scraper.py crawls websites
   Output: Raw JSON in backend/data/catalogs_brand/

2. CLEANING
   Input: Raw JSON
   Process: Remove invalid products, fix images
   Output: Cleaned JSON

3. ENRICHMENT
   Input: Clean JSON + Halilit Pricing Data
   Process: Match by Model Name, merge fields
   Output: Unified product objects

4. AI PROCESSING
   Input: Product text
   Process: Generate 384-dim embeddings (SentenceTransformers)
   Output: Vector metadata (for future semantic search)

5. EXPORT
   Input: Processed products
   Process: forge_backbone.py writes static JSON
   Output: frontend/public/data/catalogs_brand/*.json

6. DEPLOYMENT
   Input: Static JSON files
   Process: Deploy to Vercel/Netlify/S3
   Output: Live SPA served to users
```

## Key Data Files

**Frontend loads:**

- `public/data/index.json` - Brand registry
- `public/data/catalogs_brand/{brand}.json` - Product catalogs

**Structure Example:**

```json
{
  "brand_identity": { "id": "roland", "name": "Roland", ... },
  "products": [
    {
      "id": "roland-td-17kvx",
      "name": "TD-17KVX",
      "category": "V-Drums",
      "images": [...],
      "videos": [...],
      "manuals": [...]
    }
  ]
}
```

---

# 🔧 7. TROUBLESHOOTING

### Frontend: "No products showing"

**Steps:**

1. `ls frontend/public/data/index.json` (exists?)
2. `ls frontend/public/data/catalogs_brand/` (has JSON?)
3. `cd backend && python3 forge_backbone.py` (regenerate)
4. Browser: Refresh, check DevTools console

### Frontend: "Search is slow"

**Cause:** Fuse.js indexing on large dataset

**Solution:**

1. Check index size: DevTools → Performance
2. Reduce payload: Remove unused fields from JSON
3. Implement lazy loading if >500 products

### Data: "Products missing from catalog"

**Cause:** Scraper didn't find them

**Fix:**

```bash
# Check raw scraper output
ls backend/data/catalogs_brand/
# Regenerate
python3 forge_backbone.py
# Check logs for errors
```

### Deploy: "404 on /data/ files"

**Cause:** `public/data/` not copied to build

**Fix:**

1. Ensure `vite.config.ts` includes `public/`
2. Run: `pnpm build && ls dist/data/`
3. Verify in deploy: Check CDN headers

---

# 📊 8. SYSTEM STATISTICS

**Codebase:**

- Frontend: ~2,000 lines (React + TypeScript)
- Backend: ~1,500 lines (Python scrapers)
- Docs: Consolidated to 1 file (this one)

**Data:**

- Total Products: 117
- Brands: 4 (Roland, Boss, Nord, Moog)
- Images: 2,000+
- Manuals: 500+
- Categories: 7

**Performance:**

- Initial Load: 200-300ms
- Search: 30-50ms
- Memory: ~5MB (frontend)
- Disk: ~200MB (all data included)

---

# ✅ VERIFICATION SUMMARY

**v3.7.2 Status:**

✅ Frontend: 100% static SPA (no backend)  
✅ Backend: Dev-only quality control tool  
✅ Data: Pre-built, immutable JSON files  
✅ Architecture: Data Factory model confirmed  
✅ Code: All non-essential code removed  
✅ Documentation: Single source of truth (this file)  
✅ Deployment: Ready for production

**Ready to deploy.** 🚀

---

# 🎓 FREQUENTLY ASKED QUESTIONS

**Q: Why isn't the backend deployed?**  
A: It's a build-time tool. All data is pre-built into static JSON. No server needed in production.

**Q: Can I make real-time updates?**  
A: Currently no. To update products: Run `forge_backbone.py`, deploy new `public/data/` files.

**Q: What if the backend server fails?**  
A: It's dev-only. Frontend doesn't depend on it. Works perfectly offline.

**Q: How do I add a new brand?**  
A: Create scraper in `backend/services/`, run `forge_backbone.py`, deploy new JSON.

**Q: Can I add WebSocket for live updates?**  
A: Not recommended. App is designed to be static. Alternative: Add optional API layer (Phase 2+).

**Q: What database should I use?**  
A: None needed. All data is in JSON files. Scale infinitely with static hosting.

---

**THIS IS THE COMPLETE SYSTEM GUIDE.** All information consolidated into one authoritative source.

Reference these sections, not separate documents.

**Version:** 3.7.2  
**Last Updated:** January 20, 2026  
**Status:** ✅ Production-Ready
