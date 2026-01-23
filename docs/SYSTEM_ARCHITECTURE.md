# 🏗️ HSC-JIT v3.8.1 - System Architecture Overview

**Complete Technical Documentation**  
**Date**: January 23, 2026  
**Status**: ✅ Production Ready  
**Version**: 3.8.1-galaxy

---

## 📋 Quick Navigation

- [Architecture Principles](#architecture-principles)
- [System Components](#system-components)
- [Data Pipeline](#data-pipeline)
- [Deployment Architecture](#deployment-architecture)
- [Technology Stack](#technology-stack)
- [Development Workflow](#development-workflow)
- [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 Architecture Principles

### Static First, Always

This is a **100% static, zero-backend application**. All production data is pre-built into JSON files deployed with the frontend.

```
┌─────────────────────────────────────────┐
│    FRONTEND APPLICATION (Static)        │
│                                         │
│  React 19 + TypeScript 5 + Tailwind    │
│                                         │
│  Loads: /public/data/*.json             │
│  Search: Client-side Fuse.js            │
│  State: Zustand (browser memory only)   │
│                                         │
│  ❌ No API calls                        │
│  ❌ No server dependency                │
│  ❌ No database                         │
│  ✅ Deploy as static files              │
└─────────────────────────────────────────┘
       ↑
       │ (at build time)
       │
┌─────────────────────────────────────────┐
│   /frontend/public/data/ (Static JSON)  │
│                                         │
│   ├─ index.json (catalog metadata)      │
│   ├─ roland.json (products)             │
│   ├─ boss.json                          │
│   ├─ nord.json                          │
│   ├─ moog.json                          │
│   └─ logos/ (brand assets)              │
└─────────────────────────────────────────┘
```

### Everything is Pre-Built

No runtime processing. All data, images, and indexes are generated offline and deployed as static files.

```
Data Generation (Offline - not deployed):
┌──────────────────────────┐
│   Brand Websites         │
└──────────────┬───────────┘
               │ (scrape)
┌──────────────▼───────────┐
│  Scrapers (Python)       │
│  - roland_scraper.py     │
│  - boss_scraper.py       │
│  - nord_scraper.py       │
│  - moog_scraper.py       │
└──────────────┬───────────┘
               │ (raw JSON)
┌──────────────▼───────────────────┐
│  forge_backbone.py (Refiner)    │
│  - Normalize taxonomies          │
│  - Process images               │
│  - Generate search indexes      │
│  - Consolidate catalogs         │
└──────────────┬───────────────────┘
               │ (production JSON)
┌──────────────▼───────────┐
│  /frontend/public/data/  │
│  (Static JSON files)     │
└──────────────┬───────────┘
               │ (deployed)
┌──────────────▼──────────────────────┐
│  Browser / CDN / Static Host        │
│  (Final production deployment)      │
└───────────────────────────────────────┘
```

---

## 🔧 System Components

### 1. Frontend Application

**Location**: `/frontend/`  
**Language**: TypeScript + React  
**Build Tool**: Vite  
**Package Manager**: pnpm

**Key Directories**:

```
frontend/
├── src/
│   ├── App.tsx                          # Main app component
│   ├── main.tsx                         # Entry point
│   ├── index.css                        # Global styles
│   │
│   ├── components/
│   │   ├── App.tsx                      # App layout
│   │   ├── Navigator.tsx                # Sidebar navigation
│   │   ├── Workbench.tsx                # Product detail view
│   │   ├── ErrorBoundary.tsx            # Error handling
│   │   ├── smart-views/
│   │   │   ├── GalaxyDashboard.tsx      # Category overview
│   │   │   ├── SpectrumView.tsx         # Hierarchical nav
│   │   │   └── ...
│   │   └── ui/                          # Reusable components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── SearchInput.tsx
│   │       └── ...
│   │
│   ├── hooks/
│   │   ├── useBrandCatalog.ts           # Load brand data
│   │   ├── useRealtimeSearch.ts         # Search hook
│   │   ├── useBrandTheme.ts             # Theme hook
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── catalogLoader.ts             # ⭐ Load JSON files
│   │   ├── instantSearch.ts             # ⭐ Fuse.js search
│   │   ├── categoryConsolidator.ts      # Brand→UI mapping
│   │   ├── safeFetch.ts                 # Error handling
│   │   ├── schemas.ts                   # Zod validation
│   │   └── ...
│   │
│   ├── store/
│   │   └── navigationStore.ts           # ⭐ Zustand state
│   │
│   ├── types/
│   │   ├── productClassification.ts
│   │   ├── catalog.ts
│   │   └── ...
│   │
│   ├── styles/
│   │   ├── variables.css                # CSS variables
│   │   ├── theme.css
│   │   └── ...
│   │
│   └── assets/                          # Static assets
│       └── logos/
│
├── public/
│   ├── data/                            # ⭐ SOURCE OF TRUTH
│   │   ├── index.json
│   │   ├── roland.json
│   │   ├── boss.json
│   │   ├── nord.json
│   │   ├── moog.json
│   │   ├── taxonomy.json
│   │   ├── logos/                       # Brand logos
│   │   ├── product_images/              # Processed images
│   │   └── ...
│   └── manuals/                         # Product manuals
│
├── tests/
│   ├── unit/                            # Unit tests
│   ├── integration/                     # Integration tests
│   └── e2e/                             # E2E with Playwright
│
├── vite.config.ts                       # Vite configuration
├── tsconfig.json                        # TypeScript config
├── tailwind.config.js                   # Tailwind config
├── package.json
└── ...
```

### 2. Backend (Development-Only)

**Location**: `/backend/`  
**Language**: Python 3.9+  
**Purpose**: Data generation pipeline (offline only)

**Key Files**:

```
backend/
├── forge_backbone.py                    # ⭐ Main data generator
│   ├─ Loads scraper outputs
│   ├─ Normalizes taxonomies
│   ├─ Processes images
│   ├─ Generates indexes
│   └─ Outputs static JSON
│
├── services/
│   ├── roland_scraper.py                # Roland data extraction
│   │   ├─ Discovers product URLs
│   │   ├─ Extracts name, model, specs
│   │   ├─ Downloads images
│   │   ├─ Parses specifications
│   │   └─ Returns structured JSON
│   │
│   ├── boss_scraper.py                  # Boss data extraction
│   ├── nord_scraper.py                  # Nord data extraction
│   ├── moog_scraper.py                  # Moog data extraction
│   │
│   ├── visual_factory.py                # Image processing
│   │   ├─ Resize images
│   │   ├─ Convert to WebP
│   │   ├─ Remove backgrounds
│   │   └─ Generate thumbnails
│   │
│   ├── catalog_manager.py               # Catalog utilities
│   └── scraper_enhancements.py          # Shared logic
│
├── models/
│   ├── product_hierarchy.py             # Data models
│   ├── brand_taxonomy.py                # Brand taxonomies
│   ├── category_consolidator.py         # Brand→UI mapping
│   └── taxonomy_registry.py             # Taxonomy utilities
│
├── core/
│   ├── config.py                        # Configuration
│   └── ...
│
├── data/
│   ├── catalogs_brand/                  # Scraper outputs
│   │   ├─ roland.json
│   │   ├─ boss.json
│   │   └─ ...
│   └── ...
│
└── requirements.txt                     # Python dependencies
```

### 3. Data Files

**Location**: `/frontend/public/data/`

```
data/
├── index.json                           # Catalog metadata
│   ├─ version (3.7.4)
│   ├─ build_timestamp
│   ├─ total_products
│   ├─ brands[]
│   │   ├─ id, name, slug
│   │   ├─ product_count
│   │   ├─ logo_url
│   │   └─ file
│   └─ categories
│
├── roland.json                          # Brand catalogs
│   ├─ metadata (brand info)
│   └─ products[]
│       ├─ id, name, model
│       ├─ description, images
│       ├─ specifications
│       ├─ features
│       ├─ categories
│       └─ ...
│
├── boss.json
├── nord.json
├── moog.json
│
├── taxonomy.json                        # Consolidated taxonomy
│   ├─ categories (8 universal)
│   ├─ brand_mappings
│   └─ ...
│
├── logos/                               # Brand logos (SVG/PNG)
│   ├─ roland_logo.svg
│   ├─ boss_logo.png
│   └─ ...
│
└── product_images/                      # Product photos (WebP)
    ├─ [product_id]/
    │   ├─ main.webp
    │   ├─ gallery_[n].webp
    │   └─ ...
    └─ ...
```

---

## 📊 Data Pipeline

### Full Scrape → Production Cycle

```
1. DISCOVERY PHASE
   ├─ Brand website browsing
   ├─ Product URL collection
   └─ Catalog structure analysis

2. EXTRACTION PHASE (Scrapers)
   ├─ Product names & models
   ├─ Full descriptions
   ├─ Image URLs
   ├─ Specifications (tables/lists)
   ├─ Features (bullet points)
   ├─ Videos (YouTube/Vimeo)
   ├─ Manuals/docs
   └─ Category hierarchy

3. PROCESSING PHASE (Visual Factory)
   ├─ Image download
   ├─ Format conversion (WebP)
   ├─ Size optimization
   ├─ Background removal (AI)
   ├─ Thumbnail generation
   └─ CDN upload (optional)

4. REFINEMENT PHASE (forge_backbone.py)
   ├─ Schema validation (Zod)
   ├─ Duplicate removal
   ├─ Specification normalization
   ├─ Category consolidation (Brand→UI)
   ├─ Cross-reference linking
   └─ Search index generation

5. CONSOLIDATION PHASE
   ├─ Merge all brand catalogs
   ├─ Generate master index
   ├─ Create taxonomy manifest
   └─ Output final JSON

6. DEPLOYMENT PHASE
   ├─ Move JSON to /frontend/public/data/
   ├─ Optimize bundle size
   ├─ Build frontend (pnpm build)
   └─ Deploy to production
```

### Data Flow at Runtime

```
Browser Loads App
         ↓
App.tsx mounts
         ↓
useEffect triggers
         ↓
catalogLoader.loadBrand("roland")
         ↓
fetch("/data/roland.json")
         ↓
JSON parsed & validated
         ↓
Zustand store updates
         ↓
Components re-render
         ↓
UI displays products
         ↓
User interacts
         ↓
State updates (Zustand)
         ↓
Components re-render
         ↓
All client-side (no network)
```

---

## 🎨 Category Consolidation

The system translates brand-specific categories into 8 universal UI categories.

### The 8 Universal Categories

| ID            | Label              | Icon | Color   |
| ------------- | ------------------ | ---- | ------- |
| `keys`        | Keys & Pianos      | 🎹   | #f59e0b |
| `drums`       | Drums & Percussion | 🥁   | #ec4899 |
| `guitars`     | Guitars & Amps     | 🎸   | #8b5cf6 |
| `studio`      | Studio & Recording | 🎙️   | #06b6d4 |
| `live`        | Live Sound         | 🔊   | #ef4444 |
| `dj`          | DJ & Production    | 🎧   | #6366f1 |
| `software`    | Software & Cloud   | 💻   | #10b981 |
| `accessories` | Accessories        | 🔧   | #64748b |

### Brand → UI Mapping

Example: Roland categories → UI categories

```
Roland "Keyboards"    → UI "Keys & Pianos"
Roland "Synths"       → UI "Keys & Pianos"
Roland "Drums"        → UI "Drums & Percussion"
Roland "Recorders"    → UI "Studio & Recording"
Roland "Interfaces"   → UI "Studio & Recording"
Roland "Accessories"  → UI "Accessories"
```

**Implementation**:

```typescript
// Frontend usage
import { consolidateCategory } from "./lib/categoryConsolidator";

const uiCategory = consolidateCategory("roland", "Keyboards");
// Returns: 'keys'
```

---

## 🚀 Deployment Architecture

### Production Deployment (Static-Only)

```
Source Code (GitHub)
         ↓
┌─────────────────┐
│  pnpm build     │  (TypeScript → JavaScript)
└────────┬────────┘
         ↓
   /dist folder
   ├── index.html
   ├── assets/
   │   ├── *.js (bundled React)
   │   └── *.css (tailwind)
   └── data/
       ├── *.json (catalogs)
       └── logos/
         ↓
┌─────────────────────────┐
│  Static Hosting Options │
├─────────────────────────┤
│ ✅ Netlify              │
│ ✅ Vercel               │
│ ✅ AWS S3 + CloudFront  │
│ ✅ GitHub Pages         │
│ ✅ Any web server       │
└─────────────────────────┘
         ↓
    Production Site
    (No backend needed)
```

### No Server Runtime

```
❌ NOT DEPLOYED
backend/
├── app/main.py          # FastAPI server
├── services/            # Scrapers
└── models/              # Data models

✅ DEPLOYED
frontend/dist/
├── index.html
├── assets/
└── data/
```

---

## 💻 Technology Stack

### Frontend

| Technology        | Version | Purpose            |
| ----------------- | ------- | ------------------ |
| **React**         | 19      | UI framework       |
| **TypeScript**    | 5       | Type safety        |
| **Tailwind CSS**  | Latest  | Styling            |
| **Zustand**       | ^4      | State management   |
| **Fuse.js**       | ^7      | Client-side search |
| **Vite**          | Latest  | Build tool         |
| **Zod**           | Latest  | Runtime validation |
| **Framer Motion** | ^12     | Animations         |
| **Lucide React**  | Latest  | Icons              |
| **Playwright**    | Latest  | E2E testing        |
| **Vitest**        | Latest  | Unit testing       |

### Backend (Development-Only)

| Technology             | Purpose             |
| ---------------------- | ------------------- |
| **Python 3.9+**        | Scrapers & data gen |
| **aiohttp**            | Async HTTP client   |
| **BeautifulSoup4**     | HTML parsing        |
| **Pillow**             | Image processing    |
| **Zod (via pydantic)** | Data validation     |
| **aiosqlite**          | Caching (optional)  |

---

## 🔄 Development Workflow

### Local Development

```bash
# 1. Start dev server
cd frontend
pnpm install
pnpm dev
# Opens http://localhost:5173

# 2. Make changes
# Edit src/components/, lib/, etc.
# Hot reload automatically applies changes

# 3. Test changes
npm run test
npm run test:e2e

# 4. Type check
npm run quality:types

# 5. Lint
npm run lint

# 6. Build for production
npm run build
npm run preview  # Test production build locally
```

### Data Regeneration

```bash
# 1. Update scrapers if needed
# Edit backend/services/

# 2. Run scrapers (optional - only if activating real data)
cd backend
python3 -c "
import asyncio
from services.roland_scraper import RolandScraper

async def main():
    scraper = RolandScraper()
    catalog = await scraper.scrape_all_products(max_products=10)
    print(f'Scraped {len(catalog.products)} products')

asyncio.run(main())
"

# 3. Run data generator
python3 forge_backbone.py

# 4. Verify output
ls -la ../frontend/public/data/

# 5. Rebuild frontend
cd ../frontend
pnpm build
```

### Git Workflow

```
Main Branch (v3.8.1-galaxy)
├── Latest production code
├── All tests passing
└── Ready for deployment

Feature Branches
└── Work in isolation
    └── Merge to main when ready
```

---

## 🧪 Testing Strategy

### Unit Tests

```
frontend/tests/unit/
├── lib/
│   ├── catalogLoader.test.ts
│   ├── instantSearch.test.ts
│   └── ...
└── hooks/
    ├── useBrandCatalog.test.ts
    └── ...
```

### Integration Tests

```
frontend/tests/integration/
├── dataFlow.test.ts
├── stateManagement.test.ts
└── ...
```

### E2E Tests

```
frontend/tests/e2e/
├── navigation.spec.ts
├── search.spec.ts
├── productDisplay.spec.ts
└── ...
```

### Run Tests

```bash
npm run test                  # Watch mode
npm run test:run             # Single run
npm run test:coverage        # Coverage report
npm run test:e2e             # E2E with Playwright
npm run quality              # All quality gates
```

---

## 🔐 Security Architecture

### Data Security

- ✅ No sensitive data in JSON
- ✅ No authentication required
- ✅ Public brand information only
- ✅ No user data collection

### Code Security

- ✅ TypeScript strict mode
- ✅ Runtime validation (Zod)
- ✅ No third-party scripts
- ✅ No external API calls
- ✅ Content Security Policy ready

### Deployment Security

- ✅ Static files only (no code execution)
- ✅ HTTPS-ready (any hosting provider)
- ✅ No secrets in code
- ✅ No environment dependencies

---

## 📈 Performance Characteristics

### Load Time

- **Initial Load**: <1 second (minimal JS)
- **Search Response**: <50ms (Fuse.js)
- **Category Switch**: <100ms (JSON in memory)

### Build Metrics

- **Bundle Size**: 434 KB (optimized)
- **Main JS**: <200 KB (gzipped)
- **CSS**: ~50 KB (minified)
- **Build Time**: <5 seconds

### Network

- **Initial Request**: 1 (HTML)
- **Subsequent Requests**: ~3 (JS, CSS, JSON)
- **Total Requests**: <10 (minimal)
- **API Calls**: 0 (static-first)

---

## 🐛 Troubleshooting Guide

### Dev Server Issues

**Port already in use**:

```bash
lsof -i :5173
kill -9 <PID>
pnpm dev
```

**Module not found**:

```bash
rm -rf node_modules
pnpm install
pnpm dev
```

**Vite cache issues**:

```bash
rm -rf node_modules/.vite
pnpm dev
```

### Data Loading Issues

**JSON not loading**:

- Check `frontend/public/data/index.json` exists
- Verify file permissions
- Check browser Network tab for errors

**Products not showing**:

- Open DevTools console
- Check for fetch errors
- Verify `catalogLoader.loadBrand()` is called
- Check Zustand state with Redux DevTools

**Search not working**:

- Verify `instantSearch` is initialized
- Check Fuse.js index generation
- Verify product data schema

### Build Issues

**TypeScript errors**:

```bash
npm run quality:types
# Shows all type errors
```

**Lint errors**:

```bash
npm run lint -- --fix
# Auto-fix lint issues
```

**Build fails**:

```bash
rm -rf dist
pnpm build --verbose
```

---

## 📚 Key Concepts

### Catalog

A brand's complete product data in JSON format. Includes all products, metadata, and hierarchy.

### Product

An individual product with name, model, specs, images, features, and category information.

### Category (UI)

One of 8 universal categories all products map to (Keys, Drums, Guitars, etc.)

### Taxonomy

The mapping system that translates brand-specific categories to UI categories.

### Search Index

Pre-built Fuse.js index enabling <50ms client-side search.

### Static JSON

Production data files deployed with frontend. No server processing.

---

## 📋 Maintenance Checklist

- [ ] Weekly: Check data freshness (all files present?)
- [ ] Weekly: Monitor build size (stays < 500 KB?)
- [ ] Monthly: Update dependencies (`pnpm update`)
- [ ] Monthly: Run full test suite
- [ ] Quarterly: Review scraper health (if real data activated)
- [ ] Quarterly: Audit type safety (`npm run quality:types`)
- [ ] As-needed: Update data by re-running scraper & forge_backbone

---

## ✅ Verification Checklist

Before deploying:

- [x] `pnpm build` succeeds
- [x] `npm run quality:types` passes
- [x] `npm run lint` passes with 0 warnings
- [x] `npm run test:run` passes
- [x] No console errors in DevTools
- [x] `/frontend/public/data/` has all JSON files
- [x] Images load in browser
- [x] Search works
- [x] Navigation works
- [x] Category filtering works

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-23 19:15 UTC  
**Status**: ✅ Current & Accurate
