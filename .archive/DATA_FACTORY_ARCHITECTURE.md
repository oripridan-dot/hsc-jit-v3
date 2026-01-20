# HSC-JIT v3.7.2 - "Data Factory" Architecture

**Date:** January 20, 2026  
**Status:** ✅ **PRODUCTION-READY**

---

## 🏗️ The Data Factory Model

HSC-JIT v3.7 operates as a **Data Factory**, not a traditional client-server application:

```
┌─────────────────────────────────────┐
│   THE FACTORY (Python Offline)      │
├─────────────────────────────────────┤
│                                     │
│  Scrape → Clean → Enrich → Export   │
│                                     │
│  forge_backbone.py                  │
│  └─ Generates: public/data/*.json   │
│                                     │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  DISTRIBUTION (Static Files)        │
├─────────────────────────────────────┤
│  frontend/public/data/*.json        │
│  • index.json (brand registry)      │
│  • roland.json (products)           │
│  • boss.json (products)             │
│  • nord.json (products)             │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  THE SHOWROOM (React Frontend)      │
├─────────────────────────────────────┤
│                                     │
│  100% Static SPA                    │
│  No backend API calls               │
│  Pure client-side search/nav        │
│  Instant load (<100ms)              │
│                                     │
└─────────────────────────────────────┘
```

---

## 📊 System Components

### **The Factory (Backend)**

**Purpose:** Build static data offline, before deployment.

**Main Script:**

```bash
backend/forge_backbone.py
├─ Scrapes: Brand websites (Roland, Boss, Nord)
├─ Cleans: Invalid products, images, data
├─ Enriches: Adds pricing, SKU, embeddings
├─ Validates: Ensures data quality
└─ Exports: → frontend/public/data/*.json
```

**Quality Control Server (Dev-Only):**

```bash
backend/app/main.py
├─ Status: ⚠️ DEV TOOL ONLY
├─ Purpose: Validate data during pipeline
├─ Routes: /health, /api/v1/brands, /api/v1/search
└─ NOT DEPLOYED: Not in production
```

**Services:**

```bash
backend/services/
├─ jit_rag_system.py       (AI embeddings, NOT runtime)
├─ data_cleaner.py          (Data validation)
├─ hierarchy_scraper.py     (Product scraping)
└─ (All run OFFLINE, outputs static files)
```

### **The Showroom (Frontend)**

**Purpose:** Serve pre-built static assets instantly.

**Architecture:**

```bash
frontend/
├─ public/data/                (⭐ Source of Truth)
│  ├─ index.json             (Brand registry)
│  └─ catalogs_brand/
│     ├─ roland.json         (99 products)
│     ├─ boss.json           (9 products)
│     ├─ nord.json           (9 products)
│     └─ moog.json           (0 products)
│
├─ src/lib/
│  ├─ catalogLoader.ts       (Load static JSON)
│  └─ instantSearch.ts       (Fuse.js search)
│
├─ src/components/
│  ├─ App.tsx                (Pure static loading)
│  ├─ HalileoNavigator.tsx   (Search UI)
│  └─ Workbench.tsx          (Product detail)
│
└─ vite.config.ts            (NO API proxies)
```

---

## 🔄 Workflow: The Data Pipeline

### **Phase 1: Offline Generation (Before Deployment)**

```
1. SCRAPING (Web crawlers)
   └─ Input: Brand URLs (Roland, Boss, Nord)
   └─ Output: Raw JSON files

2. CLEANING (Data validation)
   └─ Input: Raw JSON
   └─ Logic: Remove invalid products, fix images
   └─ Output: Clean JSON

3. ENRICHMENT (Data merging)
   └─ Input: Clean JSON + Halilit Pricing Data
   └─ Logic: Match by Model Name
   └─ Rule: "Brand is King" (keep brand descriptions)
   └─ Output: Unified product objects with data_sources

4. AI PROCESSING (Embedding generation)
   └─ Input: Product text (name, description, tags)
   └─ Logic: Generate 384-dim vector embeddings
   └─ Output: Metadata for semantic search (not used in v3.7)

5. EXPORT (Static file generation)
   └─ Input: Processed product data
   └─ Process: forge_backbone.py writes JSON files
   └─ Output: frontend/public/data/*.json
```

### **Phase 2: Runtime (After Deployment)**

**Frontend Loading:**

```
1. User opens http://domain.com/
2. Browser loads index.html
3. React App loads catalogLoader.ts
4. catalogLoader fetches public/data/index.json (<10ms)
5. catalogLoader determines available brands
6. App fetches public/data/catalogs_brand/{brand}.json (~50-150ms)
7. instantSearch.ts indexes data in memory (Fuse.js)
8. UI is ready for search/navigation
```

**Search Action:**

```
User types → instantSearch.search() → Fuse.js fuzzy matching
→ Results stream instantly (< 50ms) → UI updates
```

**Detail View:**

```
User clicks product → Workbench receives product ID
→ Renders from loaded catalog data
→ No API calls, instant display
```

---

## 🎯 Key Design Decisions

### ✅ Why "Data Factory" Model?

| Aspect          | Traditional API                  | Data Factory                          |
| --------------- | -------------------------------- | ------------------------------------- |
| **Build Time**  | Every request builds response    | All responses built before deployment |
| **Performance** | API latency + network            | Instant (pre-computed)                |
| **Reliability** | Backend failure = app broken     | Static files never fail               |
| **Scalability** | Server load increases with users | No server load (just files)           |
| **Simplicity**  | Frontend-Backend coupling        | Pure frontend, independent build      |
| **Cost**        | Server resources needed          | Static hosting only ($0-5/mo)         |

### ✅ Why No Backend API Calls?

The frontend **never calls the backend in production** because:

1. **Data is pre-built** → No need for dynamic queries
2. **Instant search** → Fuse.js is faster than network round-trip
3. **Reliability** → No server failures
4. **Simplicity** → No CORS, authentication, or API versioning issues
5. **Cost** → No server infrastructure needed

### ✅ What About Real-Time Updates?

Currently **not supported**. To add real-time updates:

```
Option 1: Rebuild & redeploy
  - Run forge_backbone.py
  - Deploy new public/data/*.json files
  - Users refresh → new data loads

Option 2: Hybrid approach (Phase 2+)
  - Keep static core data (products, specs)
  - Add optional API for dynamic data (pricing, availability)
  - Frontend gracefully handles API failure → falls back to static
```

---

## 🧪 Development vs Production

### **Development (Optional Backend)**

```bash
# Generate data offline
cd backend && python3 forge_backbone.py

# Optionally validate with server
cd backend && uvicorn app.main:app --reload
# → http://localhost:8000/api/docs

# Run frontend
cd frontend && pnpm dev
# → http://localhost:5173
```

### **Production**

```bash
# Only need to deploy frontend
cd frontend && pnpm build
# Output: dist/ folder (static files)

# Upload dist/ to static hosting:
# - Vercel (free)
# - Netlify (free)
# - AWS S3 + CloudFront
# - GitHub Pages
# - Any static host

# NO backend server needed
# NO environment variables
# NO database
```

---

## 📋 API Reference (Dev-Only)

The backend server (main.py) is **development-only**. These endpoints exist for validation, not production use.

### Health Check

```bash
GET /health
→ {"status": "healthy", "catalogs_loaded": 3, "available_brands": ["roland", "boss", "nord"]}
```

### Brand Management

```bash
GET /api/v1/brands
→ Lists all available brands

GET /api/v1/brands/{brand_id}
→ Gets complete brand catalog with all products

GET /api/v1/brands/{brand_id}/products
→ Lists products for a brand (with optional filters)

GET /api/v1/brands/{brand_id}/products/{product_id}
→ Gets single product details

GET /api/v1/brands/{brand_id}/hierarchy
→ Gets category tree structure
```

### Search

```bash
GET /api/v1/search?q={query}&brand={brand}&category={category}&limit=20
→ Searches products (for dev reference only)
```

---

## ✅ Production Checklist

- [ ] `forge_backbone.py` runs successfully
- [ ] `frontend/public/data/` contains all JSON files
- [ ] `frontend/src/App.tsx` has NO backend imports
- [ ] `frontend/vite.config.ts` has NO API proxies
- [ ] Frontend builds without errors: `pnpm build`
- [ ] `dist/` folder is deployment-ready
- [ ] No WebSocket code in production builds
- [ ] Static files compress well (gzip)
- [ ] CDN configured for fast delivery
- [ ] No backend server infrastructure needed

---

## 🚀 Deployment Options

### **Zero-Cost Options**

1. **Vercel** (Recommended for React)

   ```bash
   npm install -g vercel
   vercel --prod
   ```

   - Free tier: 100GB bandwidth/month
   - Automatic deploys on git push
   - CDN included

2. **Netlify**

   ```bash
   netlify deploy --prod --dir=dist
   ```

   - Free tier: 300 mins/month
   - Easy drag-and-drop deploys

3. **GitHub Pages**
   ```bash
   # Add to package.json:
   "deploy": "pnpm build && gh-pages -d dist"
   ```

   - Free, but subdomain only

### **Scalable Options**

- **AWS S3 + CloudFront** (~$1-5/mo)
- **DigitalOcean Static Site Hosting** (~$5/mo)
- **Cloudflare Pages** (Free)

---

## 🔧 Troubleshooting

### **Problem: "Frontend shows no products"**

**Solution:**

1. Check `frontend/public/data/index.json` exists
2. Check `frontend/public/data/catalogs_brand/` has JSON files
3. Regenerate: `cd backend && python3 forge_backbone.py`
4. Refresh browser

### **Problem: "Search is slow"**

**Solution:** Fuse.js search should be <50ms. If slower:

1. Check browser DevTools Performance tab
2. Reduce index size (remove unused fields)
3. Use browser cache: set Cache-Control headers

### **Problem: "Want to add real-time data updates"**

**Solution:** This requires redesigning the architecture. Currently static:

- Keep core data static (products, specs)
- Add optional API for dynamic data
- Frontend falls back to static if API fails

---

## 📚 Key Files

| File                                | Purpose             | Static?        |
| ----------------------------------- | ------------------- | -------------- |
| `backend/forge_backbone.py`         | Data generator      | N/A (offline)  |
| `backend/app/main.py`               | Dev quality control | N/A (dev-only) |
| `frontend/src/lib/catalogLoader.ts` | Load static JSON    | ✅ Production  |
| `frontend/src/lib/instantSearch.ts` | Client-side search  | ✅ Production  |
| `frontend/public/data/*.json`       | Pre-built catalogs  | ✅ Production  |
| `frontend/src/App.tsx`              | Main app            | ✅ Production  |

---

## 🎓 Terminology

- **The Factory**: Backend pipeline that generates static data (`forge_backbone.py`)
- **The Showroom**: Frontend that displays static data (React SPA)
- **Data Factory**: The complete offline-then-serve architecture
- **Mission Control**: The React frontend interface
- **Quality Control Server**: The optional `main.py` dev tool

---

## 🌟 Architecture Benefits

1. **Lightning Fast** ⚡
   - No server latency
   - Pre-computed responses
   - Client-side search <50ms

2. **Reliable** 🛡️
   - No backend failures
   - Static files never break
   - Works offline (with cached data)

3. **Scalable** 📈
   - No server load
   - Scales to millions of users
   - Same cost regardless of traffic

4. **Simple** 🎯
   - No backend complexity
   - No database management
   - No authentication needed

5. **Affordable** 💰
   - Free static hosting
   - No server costs
   - Minimal CDN costs

---

## 📞 Summary

**HSC-JIT v3.7** is a **Data Factory** architecture where:

- **Backend** (Python) runs OFFLINE to generate static JSON files
- **Frontend** (React) loads those files and provides instant search/navigation
- **No backend API calls** in production
- **No server infrastructure** needed for deployment
- **Results**: Lightning-fast, reliable, scalable, affordable app

**Status:** ✅ Production-Ready (Static SPA)

---

**Version:** 3.7.2  
**Last Updated:** January 20, 2026  
**Architecture:** Data Factory (Offline Generation + Static Distribution)
