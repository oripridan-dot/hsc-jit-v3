# Getting Started with HSC-JIT v3.9.1

## ⚡ Quick Start (2 minutes)

### Start the Development Server

```bash
cd /workspaces/hsc-jit-v3/frontend
pnpm dev
```

The application will be available at **http://localhost:5173**

### What You'll See

1. **Galaxy Dashboard** - 8 product categories in a visual grid
2. **Spectrum Module** - Browse products by category
3. **Product Details** - View full product information, pricing, images, and specifications

---

## 🗂️ Project Structure

```
hsc-jit-v3/
├── frontend/                 ← React application (START HERE)
│   ├── src/
│   │   ├── components/      ← React components
│   │   ├── lib/             ← Utilities (catalogLoader, data normalization)
│   │   ├── hooks/           ← Custom React hooks
│   │   ├── store/           ← Zustand global state
│   │   └── types/           ← TypeScript type definitions
│   └── public/data/         ← Static JSON catalogs (5,268 products)
│
├── backend/                  ← Data generation pipeline (dev-only)
│   ├── forge_backbone.py     ← Main data generator
│   ├── services/             ← Brand scrapers (Roland, Boss, Nord, Moog)
│   └── models/               ← Data structures
│
└── docs/
    ├── context/              ← AI context files (auto-generated)
    ├── guides/               ← User-focused documentation
    └── archived/             ← Historical documentation
```

---

## 📊 Data Overview

The application loads data from **static JSON files** in `frontend/public/data/`:

- **Total Products**: 5,268 across 79 brands
- **Major Brands**:
  - Roland (500 products)
  - Boss (251 products)
  - Nord (34 products)
  - Moog (14 products)
  - - 75 other brands
- **Categories**: 8 consolidated categories (Keys, Drums, Guitars, Studio, Live, DJ, Software, Accessories)

### Key Files

| File                                | Purpose                                         |
| ----------------------------------- | ----------------------------------------------- |
| `frontend/public/data/index.json`   | Master catalog index (all products, all brands) |
| `frontend/public/data/roland.json`  | Roland brand catalog                            |
| `frontend/public/data/boss.json`    | Boss brand catalog                              |
| `frontend/public/data/nord.json`    | Nord brand catalog                              |
| `frontend/src/lib/catalogLoader.ts` | Data loading utility (singleton pattern)        |

---

## 🎯 Key Concepts

### Static Data Architecture

This is a **production static React application**. All data comes from pre-built JSON files. There is **NO runtime backend dependency**.

```typescript
// ✅ CORRECT: Load from static JSON
import { catalogLoader } from "./lib/catalogLoader";
const products = await catalogLoader.loadProductsByCategory("keys");

// ❌ WRONG: Don't call localhost:8000 in production
const products = await fetch("http://localhost:8000/api/products");
```

### Category Consolidation

Brand-specific taxonomies are translated into 8 universal categories:

| Category           | Products | Icon |
| ------------------ | -------- | ---- |
| Keys & Pianos      | 1,200+   | 🎹   |
| Drums & Percussion | 800+     | 🥁   |
| Guitars & Amps     | 600+     | 🎸   |
| Studio & Recording | 1,000+   | 🎙️   |
| Live Sound         | 700+     | 🔊   |
| DJ & Production    | 400+     | 🎧   |
| Software & Cloud   | 300+     | 💻   |
| Accessories        | 300+     | 🔧   |

### Data Normalization

Products from different brands have different schemas. The `dataNormalizer` makes them consistent:

```typescript
import { dataNormalizer } from "./lib/dataNormalizer";

// Before: { image: "url", pricing: { regular_price: 1000 } }
// After: { image_url: "url", pricing: 1000 }
const normalized = dataNormalizer.normalizeProduct(rawProduct);
```

---

## 🚀 Common Tasks

### Add a New Brand

1. Create a scraper in `backend/services/{brand}_scraper.py`
2. Register it in `backend/forge_backbone.py`
3. Run: `python3 backend/forge_backbone.py`
4. JSON automatically added to `frontend/public/data/{brand}.json`
5. Products appear in UI immediately (auto-discovery)

### Search Products

```typescript
import { instantSearch } from "./lib/instantSearch";

const results = instantSearch.search(query, {
  keys: ["name", "category", "description"],
  limit: 20,
});
```

### Filter by Category

```typescript
import { catalogLoader } from "./lib/catalogLoader";

// Get all products in "Keys & Pianos" category
const products = await catalogLoader.loadProductsByCategory("keys");
```

### Get Product Details

```typescript
import { catalogLoader } from "./lib/catalogLoader";

// Find specific product by ID
const product = await catalogLoader.findProductById("ROLAND-DP990F");
```

---

## 🔧 Development Commands

```bash
# Start development server
cd frontend && pnpm dev

# Build for production
cd frontend && pnpm build

# Type check TypeScript
cd frontend && npx tsc --noEmit

# Run tests
cd frontend && pnpm test

# Generate new catalog data (after scraping changes)
cd backend && python3 forge_backbone.py

# Verify system cleanliness
cd /workspaces/hsc-jit-v3 && python3 system_architect.py
```

---

## 📚 Documentation Index

| Document                                   | Purpose                                              |
| ------------------------------------------ | ---------------------------------------------------- |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)   | Architecture, code patterns, extending functionality |
| [API_REFERENCE.md](API_REFERENCE.md)       | catalogLoader, data utilities, type definitions      |
| [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) | Deployment, troubleshooting, monitoring              |
| [ARCHITECTURE.md](ARCHITECTURE.md)         | System design, data flow, component structure        |

---

## ❓ FAQ

**Q: Does the app need a backend to run?**
A: No. Everything is static JSON. The FastAPI backend in `backend/app/main.py` is dev-only for data validation.

**Q: Can I make real-time changes?**
A: Changes to product data require re-running `forge_backbone.py` and redeploying. Dynamic updates aren't currently supported.

**Q: Where do I add new features?**
A: Features go in `frontend/src/components/`. Data logic goes in `frontend/src/lib/`. State management uses Zustand in `frontend/src/store/`.

**Q: How are products organized?**
A: By brand (Roland, Boss, Nord) in static JSON files, but displayed by category (Keys, Drums, etc.) in the UI via `consolidateCategory()`.

---

## 🎓 Next Steps

- [ ] Run `pnpm dev` and explore the UI
- [ ] Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) to understand the architecture
- [ ] Check [API_REFERENCE.md](API_REFERENCE.md) for available functions
- [ ] Review [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) for deployment info

**Need help?** Check the relevant guide above or review code comments in `frontend/src/lib/` for detailed examples.

---

**Status**: ✅ Production Ready | v3.9.1 | Last Updated: January 2026
