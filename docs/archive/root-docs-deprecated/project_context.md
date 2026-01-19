# 🧠 Project Memory & Context (The "Bible")

## 1. Current Goal (Updated: January 18, 2026)

- **Focus:** V3.7 Production-Ready - Static Catalog + Hierarchical Navigation
- **Active Branch:** v3.7-dev
- **Last Big Change:** Complete architecture refactor with static catalog loading + Halileo AI navigator
- **Status:** ✅ Production-ready for Roland brand, ready for expansion

## 2. The "No-Go" Zone (Rules)

- Do not use deprecated components (UnifiedComponents, TheStage, BrandExplorer, ZenFinder)
- Always use semantic tokens (`var(--text-primary)`) instead of hardcoded colors
- Never bypass catalogLoader - it's the single source of truth for product data
- Backend API is OPTIONAL - frontend must work standalone with static files
- Frontend dev server must always run on port 5173
- Backend API (when used) must always run on port 8000

## 3. Architecture Shortcut

- **Frontend:** React + Vite (`frontend/`)
  - Main: `src/App.tsx` (layout orchestrator)
  - Navigation: `src/components/HalileoNavigator.tsx` (AI + manual modes)
  - Standard Nav: `src/components/Navigator.tsx` (tree view)
  - Display: `src/components/Workbench.tsx` (center pane)
  - Details: `src/components/ProductDetailView.tsx` (modal)
  - Data: `public/data/catalogs_brand/*.json` (static catalogs)
  - Search: `src/lib/instantSearch.ts` (Fuse.js wrapper)
  - Theme: `src/styles/tokens.css` + `brandThemes.ts`
- **Backend:** Python + FastAPI (`backend/`) - OPTIONAL
  - API: `app/main.py` (REST endpoints)
  - Orchestrator: `orchestrate_brand.py` (scraper entry point)
  - Models: `models/product_hierarchy.py`
- **Key Patterns:**
  - Static-first: Load from `catalogLoader.loadBrand('roland')`
  - Search: `instantSearch.search(query, { limit: 10 })`
  - Theme: `useBrandTheme('roland')` for brand colors
  - Navigation: `useNavigationStore` for hierarchy state

## 4. Quick Commands

```bash
# Start Frontend (PRIMARY)
cd frontend && pnpm dev

# Start Backend (OPTIONAL)
cd backend && uvicorn app.main:app --reload

# Scrape New Brand
cd backend && python orchestrate_brand.py --brand yamaha --max-products 50

# Type Check
cd frontend && npx tsc --noEmit

# Build Static Site
cd frontend && pnpm build
```

## 5. Current State (v3.7)

✅ **Working:**

- Static catalog loading (29 Roland products)
- Hierarchical navigation (5 categories, 7 subcategories)
- Instant search (<50ms with Fuse.js)
- Halileo AI navigator (manual + AI guide modes)
- Voice commands (Web Speech API)
- Brand theming (WCAG AA compliant)
- Context insights rail
- Product detail modal
- Cinema mode image gallery
- Analytics tracking (localStorage)

🗑️ **Removed/Deprecated:**

- UnifiedComponents architecture
- TheStage component
- DualSource verification UI
- ScenarioToggle
- SyncMonitor
- BrandExplorer
- ZenFinder
- ContextRail (replaced by HalileoContextRail)
- FolderView

🔮 **Next:**

- Add more brands (Yamaha, Korg, Moog)
- Implement JIT RAG backend
- Add product comparison
- Multi-language support

## 6. Component Hierarchy (v3.7)

```
App.tsx
├── HalileoNavigator (right sidebar)
│   ├── Navigator (Browse mode - tree view)
│   └── AI Guide mode (search + suggestions)
├── Workbench (center pane)
│   ├── Galaxy View (domain selection)
│   ├── Intermediate View (breadcrumb navigation)
│   └── Product View (via ProductDetailView modal)
├── HalileoContextRail (floating insights)
└── AIAssistant (optional analyst panel)
```

## 7. Data Flow

```
1. App.tsx loads:
   → catalogLoader.loadAllProducts()
   → instantSearch.initialize()
   → Builds product index

2. Navigator.tsx displays:
   → Loads from catalogLoader.loadBrand('roland')
   → Builds hierarchy: categories → subcategories → products
   → Auto-expands first 4 categories

3. User searches:
   → HalileoNavigator AI mode OR Navigator search
   → instantSearch.search(query) (<50ms)
   → Results displayed

4. User selects product:
   → useNavigationStore.selectProduct()
   → Workbench shows product via ProductDetailView modal
```

## 8. Design System

**Semantic Tokens (tokens.css):**

- `--bg-app`, `--bg-panel` - Backgrounds
- `--text-primary`, `--text-secondary` - Text colors
- `--halileo-primary` - AI accent color (#6366f1)
- `--border-subtle` - Borders

**Brand Themes (brandThemes.ts):**

- Roland: #ef4444 (red)
- Yamaha: #a855f7 (purple)
- Korg: #fb923c (orange)
- All WCAG AA compliant (4.5:1 contrast)

**Usage:**

```tsx
// Apply brand theme
useBrandTheme('roland');

// Use semantic tokens
<div style={{
  background: 'var(--bg-panel)',
  color: 'var(--text-primary)'
}}>
```
