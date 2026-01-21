# 🏗️ HSC Mission Control v3.7.4 - Architecture Documentation

## 📋 Overview

HSC Mission Control is a **static-first, production-ready product catalog system** built with React, TypeScript, and Tailwind CSS. It follows the **ONE SOURCE OF TRUTH** principle: all data comes from pre-built JSON files with zero backend dependencies.

**Version**: 3.7.4  
**Status**: Production Ready  
**Architecture**: Static SPA (Single Page Application)

---

## 🎯 Core Principles

### 1. ONE SOURCE OF TRUTH

Every capability has exactly **one** way to execute:

| Capability       | ONE WAY                                |
| ---------------- | -------------------------------------- |
| Generate Data    | `python3 backend/forge_backbone.py`    |
| Load Catalog     | `catalogLoader.loadBrand(brandId)`     |
| Search Products  | `instantSearch.search(query, options)` |
| Manage State     | Zustand `navigationStore`              |
| Style Components | Tailwind CSS + CSS Variables           |

### 2. Static First

- ✅ All data pre-built at generation time
- ✅ No API calls at runtime
- ✅ No database connections
- ✅ No backend server dependency
- ✅ Deploy anywhere (CDN, S3, Netlify, Vercel)

### 3. Type Safety

- ✅ TypeScript 5 with strict mode
- ✅ Zod runtime validation
- ✅ No `any` types
- ✅ Compile-time error checking

---

## 📂 Directory Structure

```
hsc-jit-v3/
├── .github/
│   └── copilot-instructions.md    # Development guidelines
│
├── backend/                        # Data generation (offline)
│   ├── forge_backbone.py           # ⭐ ONE data generator
│   ├── requirements.txt            # Python dependencies
│   ├── services/                   # Brand scrapers
│   │   ├── roland_scraper.py
│   │   ├── boss_scraper.py
│   │   ├── nord_scraper.py
│   │   ├── moog_scraper.py
│   │   └── visual_factory.py       # Image processing
│   └── data/
│       └── catalogs_brand/         # Scraper intermediate output
│
├── frontend/                       # React application
│   ├── public/
│   │   ├── data/                   # ⭐ SOURCE OF TRUTH
│   │   │   ├── index.json          # Master catalog (40 products)
│   │   │   ├── roland.json         # 33 products
│   │   │   ├── boss.json           # 3 products
│   │   │   ├── nord.json           # 4 products
│   │   │   ├── logos/              # Brand logos
│   │   │   └── product_images/     # Product images
│   │   └── assets/                 # Static assets
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx             # Main application
│   │   │   ├── Navigator.tsx       # Category tree
│   │   │   ├── Workbench.tsx       # Product details
│   │   │   ├── ErrorBoundary.tsx   # Error handling
│   │   │   ├── ui/                 # Reusable components
│   │   │   └── smart-views/        # Feature components
│   │   │
│   │   ├── hooks/
│   │   │   ├── useBrandCatalog.ts  # Load brand data
│   │   │   ├── useRealtimeSearch.ts# Search integration
│   │   │   └── useCopilot.ts       # Copilot integration
│   │   │
│   │   ├── lib/
│   │   │   ├── catalogLoader.ts    # ⭐ Static JSON loader
│   │   │   ├── instantSearch.ts    # ⭐ Fuse.js wrapper
│   │   │   ├── devTools.ts         # Dev utilities
│   │   │   └── schemas.ts          # Zod schemas
│   │   │
│   │   ├── store/
│   │   │   └── navigationStore.ts  # Zustand state
│   │   │
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript types
│   │   │
│   │   └── styles/
│   │       └── index.css           # Global styles
│   │
│   ├── tests/                      # Test suites
│   │   ├── unit/                   # Vitest unit tests
│   │   ├── e2e/                    # Playwright E2E tests
│   │   └── integration/            # Integration tests
│   │
│   └── [config files]              # Vite, TypeScript, etc.
│
├── README.md                       # Main documentation
├── ARCHITECTURE.md                 # This file
└── CLEANUP_COMPLETE.md             # v3.7.4 cleanup summary
```

---

## 🔄 Data Flow

### Generation Phase (Offline)

```
Brand Websites
      ↓
Scrapers (Python/Playwright)
      ↓
Raw JSON (backend/data/catalogs_brand/)
      ↓
forge_backbone.py
      ↓
Validated & Refined
      ↓
frontend/public/data/*.json
```

**Command**: `python3 backend/forge_backbone.py`

### Runtime Phase (Frontend)

```
Static JSON Files
      ↓
catalogLoader.loadIndex()
      ↓
catalogLoader.loadBrand(brandId)
      ↓
instantSearch.initialize()
      ↓
Zustand State Updates
      ↓
React Component Re-renders
```

**NO API CALLS. NO DATABASE. PURE STATIC.**

---

## 🧩 Core Modules

### 1. Catalog Loader (`lib/catalogLoader.ts`)

**Purpose**: Load and cache static JSON catalogs

```typescript
class CatalogLoader {
  // Load master index
  async loadIndex(): Promise<CatalogIndex>;

  // Load specific brand catalog
  async loadBrand(brandId: string): Promise<BrandCatalog>;

  // Load all products
  async loadAllProducts(): Promise<Product[]>;

  // Get brand metadata
  getBrandInfo(brandId: string): BrandInfo | undefined;
}

export const catalogLoader = new CatalogLoader();
```

**Usage**:

```typescript
import { catalogLoader } from "./lib/catalogLoader";

const catalog = await catalogLoader.loadBrand("roland");
console.log(catalog.products); // 33 products
```

### 2. Instant Search (`lib/instantSearch.ts`)

**Purpose**: Client-side fuzzy search with Fuse.js

```typescript
class InstantSearch {
  // Initialize search index
  async initialize(): Promise<void>;

  // Search products
  search(query: string, options?: SearchOptions): Product[];

  // Search by category
  searchByCategory(category: string): Product[];

  // Search by brand
  searchByBrand(brandId: string): Product[];
}

export const instantSearch = new InstantSearch();
```

**Usage**:

```typescript
import { instantSearch } from "./lib/instantSearch";

const results = instantSearch.search("piano", {
  keys: ["name", "category", "description"],
  limit: 10,
});
```

### 3. Navigation Store (`store/navigationStore.ts`)

**Purpose**: Global state management with Zustand

```typescript
interface NavigationState {
  // Selected items
  selectedBrand: string | null;
  selectedCategory: string | null;
  selectedProduct: Product | null;

  // Navigation
  currentPath: string[];

  // Actions
  selectBrand: (brandId: string) => void;
  selectCategory: (category: string) => void;
  selectProduct: (product: Product) => void;
  navigateTo: (path: string[]) => void;
  reset: () => void;
}

export const useNavigationStore = create<NavigationState>(...);
```

**Usage**:

```typescript
import { useNavigationStore } from './store/navigationStore';

function Component() {
  const { selectedProduct, selectProduct } = useNavigationStore();

  return (
    <button onClick={() => selectProduct(product)}>
      {product.name}
    </button>
  );
}
```

---

## 🎨 Styling System

### Tailwind CSS + CSS Variables

```css
/* Global CSS Variables (dynamically set per brand) */
:root {
  --brand-primary: #f89a1c; /* Roland Orange */
  --brand-secondary: #18181b;
  --brand-accent: #ffffff;
  --bg-panel: #15171e;
  --text-primary: #f3f4f6;
  --border-subtle: #2d313a;
}
```

### Component Styling

```tsx
// Tailwind utility classes
<div className="bg-slate-900 text-slate-100 rounded-lg p-4">
  <h2 className="text-xl font-bold">Product Name</h2>
</div>

// CSS variables for brand theming
<div style={{
  color: 'var(--brand-primary)',
  borderColor: 'var(--brand-secondary)'
}}>
  Brand-themed content
</div>
```

### Brand Themes

| Brand  | Primary Color    | Secondary | Status    |
| ------ | ---------------- | --------- | --------- |
| Roland | #f89a1c (Orange) | #18181b   | ✅ Active |
| Boss   | #0055a4 (Blue)   | #0f172a   | ✅ Active |
| Nord   | #e31e24 (Red)    | #450a0a   | ✅ Active |
| Moog   | #000000 (Black)  | #5c4033   | 🔜 Ready  |

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

```bash
pnpm test
```

- Component logic
- Utility functions
- State management
- Data transformations

**Location**: `frontend/tests/unit/`

### Integration Tests (Vitest)

```bash
pnpm test
```

- Data loading flows
- Search functionality
- Navigation flows
- Error handling

**Location**: `frontend/tests/integration/`

### E2E Tests (Playwright)

```bash
pnpm test:e2e
```

- User workflows
- Cross-browser compatibility
- Performance metrics
- Visual regression

**Location**: `frontend/tests/e2e/`

---

## 🚀 Deployment

### Static Hosting (Recommended)

```bash
# Build
cd frontend
pnpm build

# Deploy to Netlify
netlify deploy --dir=dist --prod

# Deploy to Vercel
vercel --prod

# Deploy to AWS S3
aws s3 sync dist/ s3://your-bucket/ --acl public-read
```

### Requirements

- ✅ Serve `index.html` for all routes
- ✅ Enable gzip/brotli compression
- ✅ Set cache headers for assets
- ✅ HTTPS enabled

### Performance Targets

| Metric                 | Target | Current  |
| ---------------------- | ------ | -------- |
| First Contentful Paint | <1.5s  | ~1.2s    |
| Time to Interactive    | <2.5s  | ~1.8s    |
| Search Response        | <50ms  | ~15-30ms |
| Bundle Size (gzipped)  | <500KB | ~320KB   |

---

## 🔐 Security

### Content Security Policy

```http
Content-Security-Policy: default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
```

### No Backend = Minimal Attack Surface

- ❌ No API endpoints to attack
- ❌ No database to compromise
- ❌ No server-side logic vulnerabilities
- ✅ Static files only

---

## 📈 Performance Optimizations

### Code Splitting

```typescript
// Lazy load components
const Workbench = lazy(() => import('./components/Workbench'));

<Suspense fallback={<Loading />}>
  <Workbench />
</Suspense>
```

### Asset Optimization

- Images: WebP format, lazy loading
- Fonts: Subset, preload
- Scripts: Tree shaking, minification
- Styles: PurgeCSS via Tailwind

### Caching Strategy

```
index.html          → Cache-Control: no-cache
/assets/*.js        → Cache-Control: max-age=31536000, immutable
/assets/*.css       → Cache-Control: max-age=31536000, immutable
/data/*.json        → Cache-Control: max-age=3600
```

---

## 🛠️ Development Workflow

### 1. Generate New Data

```bash
cd backend
python3 forge_backbone.py
# → Updates frontend/public/data/*.json
```

### 2. Start Development

```bash
cd frontend
pnpm dev
# → http://localhost:5173
```

### 3. Make Changes

```bash
# Edit components in src/
# Hot reload automatically updates browser
```

### 4. Test

```bash
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm typecheck     # Type check
```

### 5. Build & Deploy

```bash
pnpm build
# → dist/ ready for deployment
```

---

## 📝 Key Design Decisions

### Why Static First?

1. **Performance**: No database latency, instant loading
2. **Simplicity**: No backend to maintain
3. **Cost**: CDN hosting is cheap
4. **Scalability**: Handles millions of requests
5. **Security**: Minimal attack surface

### Why Zustand over Redux?

1. **Size**: 1KB vs 10KB+
2. **Simplicity**: Less boilerplate
3. **Performance**: Direct state updates
4. **TypeScript**: Better type inference

### Why Fuse.js over Backend Search?

1. **Latency**: <50ms client-side vs 200ms+ server
2. **Offline**: Works without connection
3. **Cost**: No search infrastructure
4. **Control**: Full search customization

### Why Tailwind CSS?

1. **Development Speed**: Utility-first approach
2. **Consistency**: Design system baked in
3. **Performance**: PurgeCSS removes unused styles
4. **Customization**: Easy theme configuration

---

## 🔄 Version History

| Version | Date       | Changes                               |
| ------- | ---------- | ------------------------------------- |
| 3.7.4   | 2026-01-21 | Complete cleanup, ONE SOURCE OF TRUTH |
| 3.7.3   | 2026-01-19 | DNA extraction, connectivity data     |
| 3.7.2   | 2026-01-15 | Brand theming improvements            |
| 3.7.1   | 2026-01-10 | Initial catalog system                |

---

## 📚 Related Documentation

- [README.md](README.md) - Main documentation
- [CLEANUP_COMPLETE.md](CLEANUP_COMPLETE.md) - v3.7.4 cleanup summary
- [frontend/README.md](frontend/README.md) - Frontend-specific docs
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Development guidelines

---

**Maintained by**: Ori Pridan ([@oripridan-dot](https://github.com/oripridan-dot))  
**Organization**: Halilit Music  
**Last Updated**: January 21, 2026
