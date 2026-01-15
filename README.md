# HSC-JIT v3.5 - Dual-Source Intelligence System

A production-ready product intelligence platform that combines brand website data with distributor pricing through intelligent synchronization.

## Overview

**Dual-Source Intelligence** merges two complementary data streams:

- **Brand Websites (PRIMARY)**: Product specifications, features, images, documentation
- **Halilit Distributor (SECONDARY)**: Real-time pricing, SKUs, stock availability

The system automatically synchronizes and classifies products into three categories:
- **PRIMARY**: Found on both brand website AND Halilit (complete product intelligence)
- **SECONDARY**: Brand website only (comprehensive specs, pending distributor)
- **HALILIT_ONLY**: Distributor only (accessories, legacy products)

## Quick Start

### Prerequisites

```bash
# Backend dependencies
pip install -r backend/requirements.txt

# Frontend dependencies (Node 18+)
cd frontend && pnpm install
```

### Run Development Environment

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend && pnpm dev
```

Access at: `http://localhost:5173`

## System Architecture

```
┌─ Frontend (React + TypeScript) ─────────────────────────────┐
│ • DualSourceIntelligence Panel (analytics dashboard)         │
│ • Product Classification Badges (visual indicators)          │
│ • Brand Explorer + Product Browser                           │
│ • WebSocket real-time search                                 │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌─ Backend (FastAPI + Python) ────────────────────────────────┐
│ API Endpoints:                                                │
│  • /api/dual-source-intelligence - Ecosystem analytics       │
│  • /api/products - Unified product catalog                   │
│  • /api/brands - Brand coverage statistics                   │
│  • /ws - Real-time search predictions                        │
│                                                               │
│ Core Services:                                                │
│  • ecosystem_orchestrator.py - Master sync engine            │
│  • halilit_scraper.py - Distributor data integration         │
│  • brand_website_scraper.py - Brand content extraction       │
│  • CatalogService - Unified catalog management               │
└───────────────────────────────────────────────────────────────┘
                              ↓
┌─ Data Layer ─────────────────────────────────────────────────┐
│ • catalogs_unified/ - Merged product catalogs (18 brands)    │
│ • catalogs_brand/ - Brand website scraped data               │
│ • catalogs_halilit/ - Distributor pricing data               │
│ • dual_source_strategy.json - Classification rules           │
│ • ecosystem_sync_report.json - Sync status and metrics       │
└───────────────────────────────────────────────────────────────┘
```

## Key Features

### 🔄 Intelligent Synchronization
- Automated brand website scraping with multi-page support
- Real-time Halilit distributor integration
- Fuzzy matching (85% similarity threshold) for product pairing
- Automatic duplicate detection and deduplication

### 📊 Dual-Source Analytics
- Real-time coverage dashboard showing PRIMARY/SECONDARY/HALILIT_ONLY distribution
- Per-brand synchronization metrics
- Global statistics across entire ecosystem
- Source attribution for every product

### 🎯 Visual Classification
- Product badges showing data source (emerald/violet/amber color coding)
- Tooltip explanations for each classification
- Inline indicators in product listings and detail views

### 🚀 Production Ready
- 262 total products across 18 brands
- 12 PRIMARY products (4.6% dual-source matched)
- 1 SECONDARY product (brand website exclusive)
- 249 HALILIT_ONLY products (distributor catalog)

## Project Structure

```
hsc-jit-v3/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app + dual-source endpoint
│   │   ├── services/
│   │   │   ├── catalog.py             # Unified catalog service
│   │   │   ├── unified_router.py      # Query routing
│   │   │   └── ...
│   │   └── ...
│   ├── scripts/
│   │   ├── ecosystem_orchestrator.py  # Master sync automation
│   │   ├── halilit_scraper.py         # Distributor scraper
│   │   └── brand_website_scraper.py   # Brand website scraper
│   ├── data/
│   │   ├── brands/                    # Brand configurations (18 brands)
│   │   ├── catalogs_unified/          # Merged catalogs
│   │   ├── catalogs_brand/            # Brand website data
│   │   ├── catalogs_halilit/          # Distributor data
│   │   ├── dual_source_strategy.json  # Classification rules
│   │   └── ecosystem_sync_report.json # Sync metrics
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Main app with dual-source button
│   │   ├── components/
│   │   │   ├── DualSourceIntelligence.tsx  # Analytics dashboard
│   │   │   ├── ui/
│   │   │   │   └── DualSourceBadge.tsx     # Classification badge
│   │   │   ├── ProductDetailView.tsx       # Product detail with badge
│   │   │   └── FolderView.tsx              # Product grid with badges
│   │   ├── utils/
│   │   │   └── productClassification.ts    # Classification logic
│   │   └── ...
│   └── package.json
│
├── README.md                          # This file
├── START_HERE.md                      # Quick start guide
├── DUAL_SOURCE_SYSTEM.md              # System architecture details
├── V3.5_DOCUMENTATION_INDEX.md        # Documentation map
├── V3.5_ECOSYSTEM_INTELLIGENCE.md     # Technical architecture
├── V3.5_OPERATIONS_GUIDE.md           # Operations manual
├── V3.5_OFFICIAL_RELEASE.md           # Release notes
├── V3.5_RELEASE_NOTES.md              # Detailed changes
└── V3.5_START_HERE.md                 # v3.5 quick start
```

## API Reference

### REST Endpoints

**`GET /api/dual-source-intelligence`**
```json
{
  "strategy": "dual-source-brand-first",
  "version": "3.5",
  "global_stats": {
    "total_products": 262,
    "primary_products": 12,
    "secondary_products": 1,
    "halilit_only_products": 249,
    "dual_source_coverage": 4.6
  },
  "brands": [/* brand-level metrics */],
  "source_breakdown": {/* classification details */}
}
```

**`GET /api/products`**
Returns unified product catalog with source attribution.

**`GET /api/brands`**
Returns all brands with product counts and coverage stats.

### WebSocket

**`/ws`** - Real-time product search and predictions

```json
{"type": "typing", "content": "nord piano"}
→ {"type": "prediction", "data": [/* matching products */]}
```

## Operations

### Run Full Ecosystem Sync

```bash
cd backend
python scripts/ecosystem_orchestrator.py --mode=full
```

**Output**: 18 unified catalogs with full brand + distributor merge

### Run Single Brand Sync

```bash
cd backend
python scripts/ecosystem_orchestrator.py --brand=nord
```

**Output**: Nord catalog with PRIMARY/SECONDARY/HALILIT_ONLY classification

### View Dual-Source Intelligence

Open the UI and click the **"🔀 Dual-Source"** button in the top bar to see:
- Global statistics across all brands
- Source breakdown (PRIMARY/SECONDARY/HALILIT_ONLY)
- Per-brand coverage analysis with percentages

### Monitor Logs

```bash
tail -f backend/logs/ecosystem/automation.log
```

## Documentation

- **[START_HERE.md](START_HERE.md)** - Quick orientation
- **[DUAL_SOURCE_SYSTEM.md](DUAL_SOURCE_SYSTEM.md)** - System architecture
- **[V3.5_DOCUMENTATION_INDEX.md](V3.5_DOCUMENTATION_INDEX.md)** - Complete doc map
- **[V3.5_START_HERE.md](V3.5_START_HERE.md)** - v3.5 quick start
- **[V3.5_ECOSYSTEM_INTELLIGENCE.md](V3.5_ECOSYSTEM_INTELLIGENCE.md)** - Technical details
- **[V3.5_OPERATIONS_GUIDE.md](V3.5_OPERATIONS_GUIDE.md)** - Operations manual
- **[V3.5_OFFICIAL_RELEASE.md](V3.5_OFFICIAL_RELEASE.md)** - Release overview
- **[V3.5_RELEASE_NOTES.md](V3.5_RELEASE_NOTES.md)** - Detailed changelog

## Current Status

✅ **Production Ready - v3.5**

- Dual-source synchronization operational
- 18 brands configured and tracked
- 262 total products unified
- Frontend UI integrated with analytics dashboard
- Product classification badges deployed
- Real-time search and predictions working
- All API endpoints validated

**Next Optimization Targets:**
- Increase PRIMARY coverage (currently 4.6% → target 80%+)
- Enhance brand website scrapers for Roland, Pearl, Mackie, Remo, Paiste
- Automated daily synchronization via cron
- Ecosystem relationship mapping

## Deployment

### Docker Compose (Production)

```bash
docker-compose up -d
```

### Environment Variables

Create `.env` file:
```
GEMINI_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379
```

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend build
cd frontend
pnpm run build

# Integration test
curl http://localhost:8000/api/dual-source-intelligence
```

## Contributing

This is the official dual-source intelligence implementation for HSC-JIT v3.5.  
All components are production-ready and actively maintained.

## License

Proprietary - Halilit Smart Catalog JIT v3.5

---

**Version**: 3.5.0  
**Last Updated**: January 15, 2026  
**Status**: 🟢 Production Ready
