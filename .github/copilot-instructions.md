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

## 🌌 7. Galaxy View: The "Deep Slot" Lighting Engine

**Visual Directive:** The `CategoryShelf` must resemble a physical, deep industrial slot or server rack.
**Lighting Logic:** The "Light Rig" sits deep inside the slot (Z-axis depth) and casts a "Brand Aura" that manifests the colors of the specific brands contained in that catalog.

### **A. Spacial Rules (The "Deep Slot" CSS)**

Every shelf MUST follow this layer composition (Z-Index order):

1.  **Base (Z=0):** `bg-black` (The void).
2.  **The Light Rig (Z=1):** A dynamic `radial-gradient` located at `bottom center`.
    - _Rule:_ It simulates a light source on the "floor" of the slot, shining upward.
    - _Shape:_ `circle at 50% 100%`.
    - _Behavior:_ `opacity-40` (Ambient) -> `opacity-100` (Hover/Active).
3.  **The Depth Mask (Z=2):** An inset shadow overlay to create the 3D "walls".
    - _Style:_ `shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]`.
    - _Result:_ Darkens the edges, making the center light look "deep" inside.
4.  **The Grid (Z=3):** A subtle `scanline` or `grid` pattern (opacity 5%) to give texture to the light.
5.  **Content (Z=10):** Text and badges floating _above_ the light.

### **B. Brand Aura Logic (The Colors)**

Never hardcode colors. You MUST generate the gradient string dynamically based on the `products` prop:

1.  **Sampling:** Identify the Top 2 Brands in the product list by frequency.
2.  **Lookup:** Retrieve their HEX codes from `BRAND_COLORS`.
3.  **Synthesis:** Construct the `radial-gradient` string:
    - _Core (0%):_ Primary Brand Color (e.g., Nord Red).
    - _Mid (40%):_ Secondary Brand Color (e.g., Moog Black/Grey) OR blend with Primary.
    - _Edge (80%):_ `transparent` (fading into the black void).
    - _Fallback:_ If no products, use `zinc-800` to `transparent`.

**Example Copilot Prompt to use in code:**
`// GENERATE AURA: Calculate 'shelfAtmosphere' using radial-gradient(circle at bottom) blending top 2 brand colors from 'products'.`

---

## 🔗 8. Product Relationships: "God's View" Interface

**Architecture:** The `ProductPopInterface` implements "God's View" - a unified display of both commercial data (Halilit) and technical knowledge (Official Brand Sources) with intelligent product relationship discovery.

### **A. The Three Relationship Categories**

Every product MUST be analyzed for three types of relationships:

1. **Necessities** (Required for Operation)
   - Items without which the product cannot function
   - Examples: Power supplies for keyboards, cables for audio equipment, stands for microphones
   - **Visual Treatment**: Red border, AlertTriangle icon, "REQUIRED" label
   - **Scoring Rule**: Extracted via keyword matching (power, cables, stands) + category heuristics
   - **Confidence Threshold**: Must score > 0.6 to display

2. **Accessories** (Optional Enhancements)
   - Compatible add-ons that improve functionality
   - Examples: Cases for instruments, upgrades for synthesizers, extra straps
   - **Visual Treatment**: Green border, ShoppingCart icon, optional display
   - **Scoring Rule**: Same brand + accessory category OR explicit keywords
   - **Confidence Threshold**: Must score > 0.6 to display

3. **Related Products** (Similar Alternatives)
   - Products in the same category/price tier
   - Examples: Other keyboards in the same series, competing microphone models
   - **Visual Treatment**: Gray border, ChevronRight icon, "Similar Models" section
   - **Scoring Rule**: Category match + price similarity (within 50%) + brand/model name overlap
   - **Confidence Threshold**: Must score > 0.7 to display

### **B. Implementation in Backend (ProductRelationshipEngine)**

**Location**: `backend/services/relationship_engine.py`

**Key Methods**:

- `analyze_all_blueprints(products)` - Main entry point, scores all products for relationships
- `_score_necessity()` - Calculates necessity score (0.0-1.0)
- `_score_accessory()` - Calculates accessory score (0.0-1.0)
- `_score_related()` - Calculates related product score (0.0-1.0)

**Rules**:

- ✅ Must scan ALL products to build cross-brand compatibility matrix
- ✅ Scores are additive; higher scores = stronger signal
- ✅ Graceful degradation: If relationship analysis fails, products still display (without relationships)
- ✅ Domain-aware: Can match products across brands (e.g., RCF speaker + Bespeco cables)

### **C. Implementation in Frontend (ProductPopInterface)**

**Location**: `frontend/src/components/views/ProductPopInterface.tsx`

**Components**:

- `ProductPopInterface` - Main component with split-view (info | resources | relationships)
- `RelationshipSection` - Displays three relationship grids
- `RelationshipCardComponent` - Individual relationship card with variant styling

**Data Flow**:

```
Product JSON (with necessities/accessories/related arrays)
  ↓
<ProductPopInterface /> loads product
  ↓
Passes to <RelationshipSection necessities={} accessories={} related={} />
  ↓
RelationshipCardComponent renders with variant styling
```

**UI Behavior**:

- Necessity cards are highlighted prominently (red border, always visible)
- Accessory cards are green (optional, grid layout)
- Related cards are gray (secondary importance)
- Cards are clickable to navigate to the related product
- Stock status badge appears if product is out of stock
- Product images fade in on hover (background overlay effect)

### **D. Integration with GenesisBuilder**

**When**: During the `construct()` method, after all products are merged

**How**:

```python
# After merging commercial + global data
engine = ProductRelationshipEngine()
blueprint = list(engine.analyze_all_blueprints(blueprint).values())
```

**Result**: Each product in the blueprint now has:

- `necessities`: List[ProductRelationship]
- `accessories`: List[ProductRelationship]
- `related`: List[ProductRelationship]

### **E. Type Definitions**

**Updated**: `frontend/src/types/index.ts`

```typescript
interface ProductRelationship {
  id: string;
  name: string;
  type:
    | "accessory"
    | "related"
    | "alternative"
    | "upgrade"
    | "bundle"
    | "necessity";
  category?: string;
  relevance?: number;
  sku?: string;
  price?: number | string;
  image_url?: string;
  logo_url?: string;
  brand?: string;
  inStock?: boolean;
}

interface Product {
  // ... existing fields ...
  necessities?: ProductRelationship[];
  accessories?: ProductRelationship[];
  related?: ProductRelationship[];
  official_manuals?: OfficialMedia[];
  official_gallery?: string[];
  official_specs?: Record<string, string>;
}
```

### **F. Critical Rules for Implementation**

1. **No Hardcoded Relationships**: All relationships must be discovered algorithmically via scoring
2. **Cross-Brand Compatible**: A Moog synthesizer can have a Boss pedal as related, if they're in the same price/tier
3. **Graceful Degradation**: If relationship analysis fails, products still render (empty arrays)
4. **Lazy Loading**: Relationships are computed at build time, not runtime
5. **Source Attribution**: Each official media asset tracks `source_domain` for transparency

### **G. Extending for New Brands**

When adding a new brand scraper:

1. **Implement** official_manuals extraction (PDFs from brand site)
2. **Implement** official_gallery extraction (images from brand site)
3. **Implement** official_specs extraction (specs from brand site)
4. Run `GenesisBuilder` which auto-discovers relationships
5. Products automatically display in UI with relationship cards

**No manual relationship mapping needed** - it all comes from `ProductRelationshipEngine`.

# DATA INGESTION PROTOCOL (STRICT)

## Phase 1: AS-IS Scraping (The Raw Zone)
- **Rule**: Scrapers MUST NOT normalize or clean data. 
- **Action**: They must extract text, HTML blocks, and image links exactly as they appear on the brand's site.
- **Storage**: All scraped data must be passed to `RawCollector.save_as_is()` immediately.
- **Forbidden**: Do not rename keys (e.g., do not change "Technical Specifications" to "specs" inside the scraper). Keep the original keys.

## Phase 2: Processing (The Refinery)
- **Rule**: Processing only happens *after* the raw file is saved to disk.
- **Input**: Processors must accept the output of `RawCollector`.
- **Output**: Processors must output a standardized `ProductBlueprint` (JSON) compatible with `GenesisBuilder`.

## Phase 3: Frontend Execution (Genesis)
- **Rule**: The frontend never reads raw data. It only reads the final JSONs generated by `GenesisBuilder` from the blueprints.

# GAP ANALYSIS & DISCOVERY WORKFLOW

## 1. Radar Scanning (Light)
- **Goal**: Scrape ONLY Model Name, Category, and URL. Do not download images or manuals.
- **Service**: `backend/services/global_radar.py`
- **Output**: `backend/data/radar/{brand}_global.json`

## 2. Opportunity Reporting
- **Goal**: Compare "Global Radar" vs "Halilit Blueprints" to find missing products.
- **Service**: `backend/services/gap_analyzer.py`
- **Action**: Run `GapAnalyzer.run_analysis(brand)` after every ingestion cycle.
- **Output**: `backend/data/reports/opportunities/{brand}_opportunities.json`

## 3. UI Display
- The "Admin/Dashboard" should read from the `reports/opportunities` folder to display a "Potential New Products" grid.

# DATA QUALITY ASSURANCE (THE DELTA AUDITOR)

## The Audit Protocol
- Every time a blueprint is generated, it MUST be audited against the Raw Data.
- **Missing Data (Red Flags):** If `manuals` array is empty or `specs` object is empty, flag as critical.
- **Extra Data (Gold Flags):** If the Raw Data contains keywords like "firmware", "360", "driver", "software" that are NOT mapped to the blueprint, flag as "Unmapped Opportunity".

## Report Location
- All audit reports must be saved to `backend/data/reports/audit/{brand}_audit_report.json`.
- The frontend "Admin Dashboard" will consume these JSON files to show the "Ingestion Health" status.
