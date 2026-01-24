# HSC-JIT v3.9.0 - Copilot System Instructions

## 🛡️ MANDATORY CONTEXT PROTOCOL (READ FIRST)

**The "Context Forge" system is critical for consistency.**

1. **CHECK CONTEXT**: Before answering complex questions, check `docs/context/*.md`.
2. **UPDATE CONTEXT**: If you make _structural_ changes (new tech, new folders, file renames), you MUST remind the user to run:
   > "Please run `python3 context_forge.py` to update the AI context files."
3. **USE CONTEXT**: When the user provides the files from `docs/context/`, treat them as the **absolute source of truth**.

---

## 🎯 Core Architecture: "Static First"

**This is a PRODUCTION STATIC REACT APPLICATION.**

All data comes from pre-built JSON files in `frontend/public/data/`. There is NO runtime backend dependency.

The FastAPI server in `backend/app/main.py` exists ONLY for local development validation. It is NOT deployed to production.

---

## ⚠️ CRITICAL: Architecture Rules (READ FIRST)

### 1. **Static Data Only**

- ✅ **DO**: Load data from `frontend/public/data/*.json`
- ✅ **DO**: Use `catalogLoader.loadBrand()` to fetch catalogs
- ❌ **DO NOT**: Make API calls to `localhost:8000` in production code
- ❌ **DO NOT**: Suggest adding `fetch()` calls to backend endpoints
- ❌ **DO NOT**: Suggest connecting to WebSocket for real data

### 2. **Frontend is Pure React**

- ✅ **DO**: Use React hooks (useState, useEffect, useMemo)
- ✅ **DO**: Use Zustand for global state (`useNavigationStore`)
- ✅ **DO**: Use Tailwind CSS for styling
- ✅ **DO**: Use Fuse.js for client-side search
- ❌ **DO NOT**: Suggest server-side rendering (SSR)
- ❌ **DO NOT**: Suggest Node.js backend routes
- ❌ **DO NOT**: Add Python imports to TypeScript files

### 3. **The Backend is Dev-Only**

```
backend/app/main.py
├─ Status: DEVELOPMENT TOOL ONLY
├─ Deployment: NOT DEPLOYED TO PRODUCTION
├─ Purpose: Local data validation during scraping
└─ When to use: Never reference in frontend code
```

If you see API calls to `localhost:8000` in the codebase, **remove them**.

### 4. **Data Generation Pipeline**

- **Generator Script**: `backend/forge_backbone.py`
  - Runs offline to build static catalogs
  - Output: `frontend/public/data/*.json`
  - Result: Pre-built, verified JSON files
  - **NOT**: A runtime server

- **Brand Scrapers**:
  - `backend/services/roland_scraper.py`
  - `backend/services/boss_scraper.py`
  - `backend/services/nord_scraper.py`
  - `backend/services/moog_scraper.py`
  - Called by `forge_backbone.py` during data generation

---

## 📋 Forbidden Patterns

**NEVER suggest these:**

1. **WebSocket connections in frontend**

   ```typescript
   // ❌ WRONG - No WebSocket in production
   const ws = new WebSocket("ws://localhost:8000/ws");
   ```

2. **useEffect loops fetching from localhost**

   ```typescript
   // ❌ WRONG
   useEffect(() => {
     fetch('http://localhost:8000/api/v1/products').then(...)
   }, []);
   ```

3. **Python backend logic in TypeScript**

   ```typescript
   // ❌ WRONG - Don't suggest embedding Python in TypeScript
   import { someBackendFunction } from "../backend/services/rag";
   ```

4. **Database calls**

   ```typescript
   // ❌ WRONG - No database in production
   const db = new Database("products.db");
   ```

5. **Server-side rendering**
   ```typescript
   // ❌ WRONG - This is a static SPA
   export async function getServerSideProps() { ... }
   ```

---

## 🏷️ Category Consolidation ("Steady UI")

**The UI ALWAYS shows the same 8 categories in the same order.**

Brand-specific taxonomies (Roland's "Pianos", Nord's "Stage", etc.) are translated into universal UI categories.

### The 8 Universal Categories (FIXED ORDER)

| #   | ID            | Label              | Icon |
| --- | ------------- | ------------------ | ---- |
| 1   | `keys`        | Keys & Pianos      | 🎹   |
| 2   | `drums`       | Drums & Percussion | 🥁   |
| 3   | `guitars`     | Guitars & Amps     | 🎸   |
| 4   | `studio`      | Studio & Recording | 🎙️   |
| 5   | `live`        | Live Sound         | 🔊   |
| 6   | `dj`          | DJ & Production    | 🎧   |
| 7   | `software`    | Software & Cloud   | 💻   |
| 8   | `accessories` | Accessories        | 🔧   |

### How to Use Category Consolidation

```typescript
// ✅ CORRECT: Use consolidateCategory for UI display
import {
  consolidateCategory,
  getConsolidatedCategory,
} from "./lib/categoryConsolidator";

// Roland says "Pianos", UI shows "Keys & Pianos"
const uiCategoryId = consolidateCategory("roland", "Pianos");
// Returns: "keys"

const category = getConsolidatedCategory(uiCategoryId);
// Returns: { id: "keys", label: "Keys & Pianos", icon: "🎹", color: "#f59e0b" }
```

### Key Files

| File                                          | Purpose                        |
| --------------------------------------------- | ------------------------------ |
| `frontend/src/lib/categoryConsolidator.ts`    | TypeScript consolidation logic |
| `backend/models/category_consolidator.py`     | Python equivalent for backend  |
| `docs/CATEGORY_CONSOLIDATION_ARCHITECTURE.md` | Full documentation             |

---

## ✅ How to Build Features

### Example: Add a new search filter

```typescript
// ✅ CORRECT: Use Zustand + Fuse.js
import { useNavigationStore } from './store/navigationStore';
import { instantSearch } from './lib/instantSearch';

function SearchComponent() {
  const { products } = useNavigationStore();
  const [query, setQuery] = useState('');

  const results = instantSearch.search(query, {
    keys: ['name', 'category'],
    limit: 10
  });

  return <div>{/* render results */}</div>;
}
```

### Example: Load product catalog

```typescript
// ✅ CORRECT: Use catalogLoader for static JSON
import { catalogLoader } from "./lib/catalogLoader";

async function loadBrandProducts(brandName: string) {
  const catalog = await catalogLoader.loadBrand(brandName);
  return catalog.products;
}
```

### Example: Apply brand theming

```typescript
// ✅ CORRECT: Use CSS variables + hooks
import { useBrandTheme } from './hooks/useBrandTheme';

function BrandedPanel({ brand }: Props) {
  const theme = useBrandTheme(brand);

  return (
    <div style={{
      background: 'var(--bg-panel)',
      borderColor: 'var(--border-subtle)',
      color: 'var(--text-primary)'
    }}>
      {/* Content */}
    </div>
  );
}
```

---

## 📂 File Structure (v3.7.4 - Cleaned)

```
frontend/
├── public/data/              ← ⭐ SOURCE OF TRUTH (Production Static Data)
│   ├── index.json            ← Master catalog spine
│   ├── roland.json           ← Brand catalogs (static)
│   ├── boss.json
│   ├── nord.json
│   ├── scrape_progress.json
│   └── logos/                ← Brand logo assets
│
├── src/
│   ├── components/
│   │   ├── App.tsx              ← Main app (NO WebSocket)
│   │   ├── Navigator.tsx        ← Tree navigation
│   │   ├── Workbench.tsx        ← Product detail view
│   │   └── ui/                  ← Reusable UI components
│   │
│   ├── hooks/
│   │   ├── useBrandCatalog.ts   ← Load brand data
│   │   ├── useBrandTheme.ts     ← Brand theming
│   │   └── useRealtimeSearch.ts ← Client-side search
│   │
│   ├── lib/
│   │   ├── catalogLoader.ts     ← ⭐ Load static JSON
│   │   ├── categoryConsolidator.ts ← ⭐ Brand→UI category translation
│   │   ├── instantSearch.ts     ← ⭐ Fuse.js search engine
│   │   └── devTools.ts          ← Dev utilities
│   │
│   ├── store/
│   │   └── navigationStore.ts   ← Zustand global state
│   │
│   └── index.css
│
├── tests/                    ← Test suites (e2e, unit, integration)
├── package.json
└── vite.config.ts

backend/
├── forge_backbone.py         ← ⭐ SINGLE SOURCE: Data generator (runs offline)
├── services/
│   ├── roland_scraper.py     ← Brand-specific scrapers
│   ├── boss_scraper.py
│   ├── nord_scraper.py
│   ├── moog_scraper.py
│   └── visual_factory.py     ← Image processing
└── data/
    └── catalogs_brand/       ← Scraper output (intermediate, not for production)
```

---

## 🔧 Common Patterns

### Pattern 1: Load and Display Products

```typescript
// Use catalogLoader for static JSON
const [products, setProducts] = useState<Product[]>([]);

useEffect(() => {
  (async () => {
    const catalog = await catalogLoader.loadBrand("roland");
    setProducts(catalog.products || []);
  })();
}, []);

return (
  <div>
    {products.map(p => <ProductCard key={p.id} product={p} />)}
  </div>
);
```

### Pattern 2: Search Client-Side

```typescript
// Use instantSearch for filtering
const [query, setQuery] = useState("");

const results = useMemo(() => {
  if (!query) return products;
  return instantSearch.search(query, {
    keys: ["name", "category", "description"],
    limit: 20,
  });
}, [query, products]);
```

### Pattern 3: Global Navigation State

```typescript
// Use Zustand for navigation
const { selectProduct, currentPath } = useNavigationStore();

const handleProductClick = (product: Product) => {
  selectProduct(product);
  // UI updates automatically
};
```

---

## ✅ Implementation Checklist

When adding a feature:

- [ ] Data comes from `public/data/*.json` (not API)
- [ ] No fetch/axios calls to `localhost:8000`
- [ ] Uses Zustand for state (not Redux/Context)
- [ ] Uses Tailwind + CSS variables (not new CSS files)
- [ ] TypeScript types are explicit (no `any`)
- [ ] Component is pure React (no backend dependencies)

---

## 🚫 What NOT to Do

| ❌ Do NOT...                                        | ✅ Instead...                                           |
| --------------------------------------------------- | ------------------------------------------------------- |
| Suggest WebSocket connections                       | Use static JSON + re-fetch when needed                  |
| Add `fetch('http://localhost:8000/...')`            | Load from `public/data/*.json`                          |
| Create new CSS files                                | Use Tailwind + CSS variables                            |
| Mix Python/TypeScript logic                         | Keep Python in `backend/`, TypeScript in `frontend/`    |
| Reference `docs/archive/`                           | Use current documentation only                          |
| Suggest running `backend/app/main.py` in production | It's dev-only; use `forge_backbone.py` to generate data |

---

## 📚 Key Concepts

### "Halilit Catalog"

The static data generation system. Scrapes → Raw Data → Refiner → Golden Record (JSON) → Frontend.
Run `forge_backbone.py` to generate static catalogs.

### "Mission Control"

The React frontend interface. Pure client-side, no backend dependency.
Load data with `catalogLoader`, search with Fuse.js, navigate with Zustand.

### "Dev Mode"

Optional: Run `backend/app/main.py` locally for data validation during development.
Do NOT deploy to production. Do NOT call from frontend in production code.

---

## 🚀 Commands

```bash
# Frontend development (from /workspaces/hsc-jit-v3/frontend)
pnpm dev

# Generate new catalog data (from /workspaces/hsc-jit-v3/backend)
python3 forge_backbone.py

# Type check frontend
cd frontend && npx tsc --noEmit

# Build for production
cd frontend && pnpm build
```

---

## 📊 Status

| Feature                 | Status    | Notes                           |
| ----------------------- | --------- | ------------------------------- |
| Static JSON catalogs    | ✅ Active | Roland (33), Boss (3), Nord (4) |
| Client-side search      | ✅ Active | Fuse.js, <50ms                  |
| Hierarchical navigation | ✅ Active | 7 categories, 40 products       |
| Brand theming           | ✅ Active | WCAG AA compliant               |
| Data generator          | ✅ Active | `forge_backbone.py`             |

---

## ❓ FAQ

**Q: Why does `backend/app/main.py` exist if it's not used?**
A: It's a local development validation tool. It helps verify data during the scraping process but is never called from production frontend code.

**Q: Can I make API calls to `localhost:8000` in the frontend?**
A: No. All production data comes from `public/data/*.json`. The backend is dev-only.

**Q: Should I run the FastAPI server when deploying?**
A: No. Just deploy the `frontend/` folder. Data is pre-built in `public/data/`.

**Q: What if I need real-time data updates?**
A: Currently not supported. Regenerate `public/data/` using `forge_backbone.py` and redeploy.

**Q: Can I add WebSocket for live updates?**
A: Not in production. The app is static. If you need live updates, redesign the architecture and document it clearly.

---

**Version:** 3.9.0
**Last Updated:** January 2026
**Status:** Production-Ready
