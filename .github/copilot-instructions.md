# HSC-JIT v3.7 - Copilot System Instructions

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

- **Deprecated Scripts** (do not reference):
  - `backend/orchestrate_pipeline.py` — Legacy validation (use forge_backbone.py instead)

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

## 📂 File Structure (v3.7)

```
frontend/
├── public/data/              ← ⭐ SOURCE OF TRUTH
│   ├── index.json
│   ├── catalogs_brand/
│   │   ├── roland.json (99 products)
│   │   ├── boss.json (9 products)
│   │   ├── nord.json (9 products)
│   │   └── moog.json (0 products)
│   └── scrape_progress.json
│
├── src/
│   ├── components/
│   │   ├── App.tsx              ← Main app (NO WebSocket)
│   │   ├── HalileoNavigator.tsx (AI sidebar)
│   │   ├── Navigator.tsx        (tree nav)
│   │   ├── Workbench.tsx        (product detail)
│   │   └── ui/                  (reusable UI)
│   │
│   ├── hooks/
│   │   ├── useBrandTheme.ts
│   │   └── useHalileoTheme.ts
│   │
│   ├── lib/
│   │   ├── catalogLoader.ts     ← Load static JSON
│   │   ├── instantSearch.ts     ← Fuse.js wrapper
│   │   └── devTools.ts
│   │
│   ├── store/
│   │   └── navigationStore.ts   ← Zustand state
│   │
│   └── index.css

backend/
├── forge_backbone.py            ← ⭐ DATA GENERATOR (runs offline)
├── orchestrate_pipeline.py      ← DEPRECATED (validation only)
├── app/
│   └── main.py                  ← ⚠️ DEV TOOL ONLY (not deployed)
└── data/
    └── catalogs_brand/          ← Where scrapers output raw data
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
# Frontend development
cd frontend && pnpm dev

# Generate new catalog data (run offline)
cd backend && python3 forge_backbone.py

# Type check frontend
cd frontend && npx tsc --noEmit

# Build for production
cd frontend && pnpm build

# (Optional) Dev validation server
cd backend && uvicorn app.main:app --reload
```

---

## 📊 Status

| Feature                 | Status        | Notes                           |
| ----------------------- | ------------- | ------------------------------- |
| Static JSON catalogs    | ✅ Active     | Roland (99), Boss (9), Nord (9) |
| Client-side search      | ✅ Active     | Fuse.js, <50ms                  |
| Hierarchical navigation | ✅ Active     | 7 categories, 117 products      |
| Brand theming           | ✅ Active     | WCAG AA compliant               |
| FastAPI server          | ⚠️ Dev-only   | Not deployed; validation tool   |
| WebSocket               | ⚠️ Deprecated | Removed from production code    |

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

**Version:** 3.7.3-DNA (Connectivity Intelligence)  
**Last Updated:** January 2026  
**Status:** Production-Ready
