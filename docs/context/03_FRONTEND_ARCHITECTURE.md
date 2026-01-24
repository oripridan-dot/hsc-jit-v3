# ⚛️ 03_FRONTEND_ARCHITECTURE.md

**Framework:** React 19 + TypeScript + Vite
**State:** Zustand
**Styling:** Tailwind CSS

## 🏛️ Core Architecture ("Static Logic")

### 1. Data Loading (`src/lib/catalogLoader.ts`)
- Fetches static JSON files from `/data/`
- Types data with Zod schemas
- **Pattern:** Load once -> Store in State

### 2. State Management (`src/store/navigationStore.ts`)
- Holds `products`, `activeCategory`, `searchQuery`
- **Pattern:** Single Source of Truth for Navigation

## 🧩 Component Registry
### UI Components
- `frontend/src/components/ui/ContextBadge.tsx`
- `frontend/src/components/views/GalaxyDashboard.tsx`
- `frontend/src/components/views/ProductPopInterface.tsx`
- `frontend/src/components/views/SpectrumModule.tsx`

### Logic Hooks
- `frontend/src/hooks/useBrandCatalog.ts`
- `frontend/src/hooks/useCategoryCatalog.ts`
- `frontend/src/hooks/useCategoryProducts.ts`
- `frontend/src/hooks/useTaxonomy.ts`

### Core Libraries
- `frontend/src/lib/brandColors.ts`
- `frontend/src/lib/brandConstants.ts`
- `frontend/src/lib/brandTaxonomy.ts`
- `frontend/src/lib/catalogLoader.ts`
- `frontend/src/lib/categoryConsolidator.ts`
- `frontend/src/lib/devTools.ts`
- `frontend/src/lib/dynamicThumbnails.ts`
- `frontend/src/lib/index.ts`
- `frontend/src/lib/instantSearch.ts`
- `frontend/src/lib/safeFetch.ts`
- `frontend/src/lib/schemas.ts`
- `frontend/src/lib/taxonomyLoader.ts`
- `frontend/src/lib/universalCategories.ts`
- `frontend/src/lib/utils.ts`

### State Stores
- `frontend/src/store/navigationStore.ts`

## 📡 Connectivity Rules
- **NO** WebSockets
- **NO** REST API Calls to Backend
- **NO** Server-Side Rendering
