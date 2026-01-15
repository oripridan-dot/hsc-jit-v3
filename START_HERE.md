# 🚀 START HERE - Dual-Source Intelligence System

Welcome to HSC-JIT v3.5 - the production-ready dual-source intelligence platform.

## What is Dual-Source Intelligence?

**Dual-Source Intelligence** combines two complementary data streams to create complete product intelligence:

```
Brand Website Content    +    Halilit Distributor Data    =    Complete Intelligence
(specs, features, docs)       (pricing, SKU, stock)            (unified catalog)
```

### Product Classification

Every product is automatically classified:

- **🟢 PRIMARY**: Found on both brand website AND Halilit → Complete data (specs + pricing)
- **🟣 SECONDARY**: Brand website only → Full specs, pending distributor integration
- **🟡 HALILIT_ONLY**: Distributor only → Accessories, legacy items, distributor-specific products

## 5-Minute Quick Start

### 1. Start the System

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
cd frontend && pnpm dev
```

### 2. Open the UI

Navigate to `http://localhost:5173`

### 3. Explore Dual-Source Intelligence

Click the **"🔀 Dual-Source"** button in the top bar to see:
- **Global Statistics**: Total products, PRIMARY/SECONDARY/HALILIT_ONLY counts, coverage percentage
- **Source Breakdown**: Visual cards showing classification details
- **Brand Coverage**: Per-brand analysis with coverage percentages

### 4. Check Product Classifications

- Browse products in the main view
- Notice the colored badges on each product thumbnail (emerald/violet/amber)
- Click any product to see its detailed classification in the header

## Current System Status

As of January 15, 2026:

```
Total Products: 262
├─ PRIMARY (🟢):      12 (4.6%)  - Both sources matched
├─ SECONDARY (🟣):     1 (0.4%)  - Brand website only
└─ HALILIT_ONLY (🟡): 249 (95.0%) - Distributor only

Brands Tracked: 18
Coverage Target: 80%+ PRIMARY (work in progress)
```

## Key Features You Can Use Now

### 1. Real-Time Product Search
Type in the search box to get instant predictions with WebSocket-powered matching.

### 2. Dual-Source Analytics Dashboard
- Click "🔀 Dual-Source" button
- View global and per-brand metrics
- Track synchronization health
- Identify coverage gaps

### 3. Visual Product Classification
- Every product shows its source with color-coded badges
- Hover badges for detailed tooltips
- Quickly identify which products have complete intelligence

### 4. Brand Explorer
- Click "🎯 Brands" to see all 18 brands
- View product counts and coverage per brand
- Navigate into brand-specific catalogs

### 5. Product Coverage Stats
- Click "📊 Coverage" for detailed statistics
- See top brands by product count
- Monitor empty/developing brands

## API Endpoints You Can Test

### Dual-Source Intelligence
```bash
curl http://localhost:8000/api/dual-source-intelligence | jq
```

Returns comprehensive ecosystem analytics including:
- Global statistics
- Brand-level coverage data
- Source breakdown details
- Last sync timestamps

### All Products
```bash
curl http://localhost:8000/api/products | jq
```

Returns the unified catalog with source attribution.

### All Brands
```bash
curl http://localhost:8000/api/brands | jq
```

Returns brand metadata with product counts.

## Running Synchronization

### Full Ecosystem Sync (All 18 Brands)
```bash
cd backend
python scripts/ecosystem_orchestrator.py --mode=full
```

**Time**: ~15-20 minutes  
**Output**: 18 unified catalogs in `backend/data/catalogs_unified/`

### Single Brand Sync (e.g., Nord)
```bash
cd backend
python scripts/ecosystem_orchestrator.py --brand=nord
```

**Time**: ~2-3 minutes  
**Output**: `backend/data/catalogs_unified/nord_catalog.json`

### View Logs
```bash
tail -f backend/logs/ecosystem/automation.log
```

## Understanding the Data Flow

```
1. SCRAPING
   ├─ Brand Website → backend/data/catalogs_brand/
   └─ Halilit Distributor → backend/data/catalogs_halilit/

2. MERGING
   • Fuzzy name matching (85% similarity threshold)
   • Source attribution (PRIMARY/SECONDARY/HALILIT_ONLY)
   • Duplicate detection and deduplication
   └─ Output → backend/data/catalogs_unified/

3. API SERVING
   • CatalogService loads unified catalogs
   • WebSocket for real-time search
   • REST endpoints for analytics
   └─ Frontend displays with classification badges
```

## Project Structure

```
hsc-jit-v3/
├── backend/
│   ├── app/
│   │   ├── main.py                      # Dual-source API endpoint
│   │   └── services/catalog.py          # Unified catalog service
│   ├── scripts/
│   │   ├── ecosystem_orchestrator.py    # Master sync engine
│   │   ├── halilit_scraper.py           # Distributor scraper
│   │   └── brand_website_scraper.py     # Brand scraper
│   └── data/
│       ├── brands/                      # 18 brand configs
│       ├── catalogs_unified/            # Merged catalogs
│       ├── catalogs_brand/              # Brand website data
│       ├── catalogs_halilit/            # Distributor data
│       ├── dual_source_strategy.json    # Classification rules
│       └── ecosystem_sync_report.json   # Sync metrics
│
└── frontend/
    └── src/
        ├── App.tsx                      # Dual-Source button
        ├── components/
        │   ├── DualSourceIntelligence.tsx   # Analytics dashboard
        │   ├── ui/DualSourceBadge.tsx       # Classification badge
        │   ├── ProductDetailView.tsx         # Product detail with badge
        │   └── FolderView.tsx                # Product grid with badges
        └── utils/productClassification.ts   # Classification logic
```

## Next Steps

### For Users
1. ✅ Explore the Dual-Source Intelligence dashboard
2. ✅ Browse products and check their classifications
3. ✅ Try searching for products (e.g., "nord piano", "roland keyboard")
4. ✅ View brand-specific catalogs

### For Developers
1. 📖 Read [DUAL_SOURCE_SYSTEM.md](DUAL_SOURCE_SYSTEM.md) for architecture details
2. 📖 Read [V3.5_OPERATIONS_GUIDE.md](V3.5_OPERATIONS_GUIDE.md) for operations
3. 🔧 Enhance brand website scrapers to increase PRIMARY coverage
4. 🔧 Set up automated synchronization via cron

### For Optimization
1. **Target**: Increase PRIMARY coverage from 4.6% to 80%+
2. **Focus Brands**: Roland (500 products), Pearl (364), Mackie (219)
3. **Strategy**: Fix website scrapers, improve CSS selectors
4. **Timeline**: 2-4 weeks for full coverage

## Documentation

- **[README.md](README.md)** - Complete system overview
- **[DUAL_SOURCE_SYSTEM.md](DUAL_SOURCE_SYSTEM.md)** - Architecture deep dive
- **[V3.5_START_HERE.md](V3.5_START_HERE.md)** - v3.5 specific guide
- **[V3.5_DOCUMENTATION_INDEX.md](V3.5_DOCUMENTATION_INDEX.md)** - Documentation map
- **[V3.5_OPERATIONS_GUIDE.md](V3.5_OPERATIONS_GUIDE.md)** - Operations manual
- **[V3.5_ECOSYSTEM_INTELLIGENCE.md](V3.5_ECOSYSTEM_INTELLIGENCE.md)** - Technical architecture

## Troubleshooting

### Frontend won't start
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Backend API errors
```bash
cd backend
pip install -r requirements.txt
# Check if Redis is running (optional for caching)
# Start backend
uvicorn app.main:app --reload
```

### No products showing
1. Check if backend is running: `curl http://localhost:8000/api/products`
2. Check unified catalogs exist: `ls -la backend/data/catalogs_unified/`
3. If empty, run sync: `python backend/scripts/ecosystem_orchestrator.py --brand=nord`

### Dual-Source endpoint returns errors
1. Verify data files exist:
   - `backend/data/dual_source_strategy.json`
   - `backend/data/ecosystem_sync_report.json`
2. Run a sync to generate data: `python backend/scripts/ecosystem_orchestrator.py --brand=nord`

## Questions?

1. Check the [V3.5_DOCUMENTATION_INDEX.md](V3.5_DOCUMENTATION_INDEX.md) for the right doc
2. Review [V3.5_OPERATIONS_GUIDE.md](V3.5_OPERATIONS_GUIDE.md) for operations
3. Read [DUAL_SOURCE_SYSTEM.md](DUAL_SOURCE_SYSTEM.md) for architecture

---

**Version**: 3.5.0  
**Status**: 🟢 Production Ready  
**Last Updated**: January 15, 2026
