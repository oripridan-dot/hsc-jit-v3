# 🎯 V3.7 Consolidation Plan - Halilit Mission Control

**Objective:** Consolidate v3.7 branch into a clean, focused codebase with Mission Control layout and logic.

**Date:** January 19, 2026  
**Status:** Planning Phase

---

## 📋 Components to Keep

### Core UI Components (KEEP)

These form the Mission Control foundation:

1. **HalileoNavigator.tsx** ✅
   - Purpose: Left pane - AI-enhanced product browser
   - Features: Manual/Guide modes, search, voice input
   - Status: Fully functional

2. **Navigator.tsx** ✅
   - Purpose: Tree navigation inside HalileoNavigator
   - Features: Hierarchical browsing, search filter
   - Status: Fully functional

3. **Workbench.tsx** ✅
   - Purpose: Center pane - Product detail display
   - Features: Galaxy view, product cockpit, signal flow
   - Status: Fully functional

4. **MediaBar.tsx** ✅
   - Purpose: Media sidebar within Workbench
   - Features: Images, videos, audio, documents
   - Status: Fully functional

5. **InsightsTable.tsx** ✅
   - Purpose: Context insights/analytics panel
   - Features: Real-time product statistics
   - Status: Fully functional

6. **SystemHealthBadge.tsx** ✅
   - Purpose: Topbar health indicator
   - Features: Live/Static mode, system status
   - Status: Fully functional

### Core State & Logic (KEEP)

1. **navigationStore.ts** ✅
   - Purpose: Zustand navigation state management
   - Features: Hierarchy traversal, product selection
   - Status: Fully functional

2. **useWebSocketStore.ts** (Stub - Keep)
   - Purpose: WebSocket connection state
   - Status: Deferred feature (Phase 2+)

### Type System (KEEP)

1. **types/index.ts** ✅
   - Purpose: Unified TypeScript definitions
   - Status: Complete and production-ready

2. **types.ts.deprecated** - DELETE

### Libraries & Utils (KEEP)

1. **lib/catalogLoader.ts** ✅
   - Purpose: Static JSON data loading
   - Status: Type-safe implementation

2. **lib/instantSearch.ts** ✅
   - Purpose: Fuse.js fuzzy search wrapper
   - Status: Working with real data

3. **lib/index.ts** - Barrel export

### Hooks (KEEP)

1. **hooks/useBrandTheme.ts** ✅
   - Purpose: Dynamic theme switching
   - Status: Functional

2. **hooks/useHalileoTheme.ts** ✅
   - Purpose: AI theme state
   - Status: Functional

### Styling (KEEP)

1. **styles/brandThemes.ts** ✅
   - Purpose: Brand color definitions
   - Status: Roland theme active

2. **index.css** ✅
   - Purpose: Global styles and tokens
   - Status: Semantic tokens defined

3. **styles/** folder structure ✅

### Services (KEEP)

- **services/** folder (if any utility services exist)

### Configuration (KEEP)

1. **eslint.config.js** ✅
   - Strict typing rules active
   - Keep as-is

2. **tsconfig.json** ✅
   - Strict mode enabled
   - Keep as-is

---

## 🗑️ Components to Remove

### Dead/Orphaned Components

1. **AIAssistant.tsx** ❌
   - Never imported, unused
   - Replaced by HalileoNavigator

2. **SignalFlowMap.tsx** ❌ (if exists)
   - Integrated into Workbench
   - Can be removed if standalone

3. **ProductDetailView.tsx** ❌ (if exists)
   - Redundant with Workbench
   - Can be removed

4. **ImageGallery.tsx** ❌ (if exists)
   - Redundant with MediaBar
   - Can be removed

5. **MediaViewer.tsx** ❌ (if exists, check if used)
   - May be utility for MediaBar
   - Keep only if MediaBar depends on it

### Deprecated Files

1. **types.ts.deprecated** ❌
   - Delete

2. **Any archive/old files** ❌
   - Clean out

### Unused Dependencies

Check package.json and remove:

- `gsap` (animation - use Framer Motion instead)
- `redux` (if present - using Zustand)
- `react-redux` (if present)
- Any unused UI libraries
- Keep only: `framer-motion`, `lucide-react`, `tailwindcss`, `fuse.js`, `zustand`

---

## 📁 Consolidated File Structure

```
frontend/
├── src/
│   ├── App.tsx                          (2-pane + topbar layout)
│   ├── main.tsx                         (Entry point)
│   ├── index.css                        (Global styles + tokens)
│   │
│   ├── components/                      (CORE UI ONLY)
│   │   ├── HalileoNavigator.tsx         ✅ Left pane (AI + Manual)
│   │   ├── Navigator.tsx                ✅ Tree nav (inside HalileoNavigator)
│   │   ├── Workbench.tsx                ✅ Center pane (products)
│   │   ├── MediaBar.tsx                 ✅ Media sidebar
│   │   ├── InsightsTable.tsx            ✅ Context insights
│   │   ├── SystemHealthBadge.tsx        ✅ Health indicator
│   │   └── ui/                          (Reusable UI if exists)
│   │
│   ├── hooks/                           (REACT HOOKS)
│   │   ├── useBrandTheme.ts             ✅ Theme hook
│   │   └── useHalileoTheme.ts           ✅ AI theme hook
│   │
│   ├── store/                           (ZUSTAND STATE)
│   │   ├── navigationStore.ts           ✅ Navigation state
│   │   └── useWebSocketStore.ts         ⏳ Stub (defer Phase 2)
│   │
│   ├── types/                           (TYPESCRIPT TYPES)
│   │   └── index.ts                     ✅ All type definitions
│   │
│   ├── lib/                             (UTILITIES & LOADERS)
│   │   ├── catalogLoader.ts             ✅ Data loading
│   │   ├── instantSearch.ts             ✅ Search wrapper
│   │   └── index.ts                     (Barrel export)
│   │
│   ├── styles/                          (DESIGN SYSTEM)
│   │   ├── tokens.css                   ✅ Semantic tokens
│   │   └── brandThemes.ts               ✅ Brand colors
│   │
│   ├── services/                        (If any, keep minimal)
│   │   └── (Only keep if used)
│   │
│   └── utils/                           (Generic utilities if exist)
│       └── (Keep if used by components)
│
├── public/
│   └── data/
│       ├── index.json                   ✅ Brand index
│       └── catalogs_brand/
│           └── roland.json              ✅ Static catalog
│
├── vite.config.ts                       ✅ Keep
├── tsconfig.json                        ✅ Keep
├── package.json                         (Clean dependencies)
└── eslint.config.js                     ✅ Keep

backend/
├── services/
│   └── ecosystem_builder.py             ✅ Keep (generates hierarchy)
└── (other backend files - optional for v3.7)
```

---

## 🔄 Consolidation Steps

### Phase 1: Audit & Cleanup

- [ ] List all components in `frontend/src/components/`
- [ ] Identify which are actually imported
- [ ] Mark for deletion those not imported
- [ ] Check `package.json` for unused deps
- [ ] Create deletion list

### Phase 2: File Deletion

- [ ] Remove unused components
- [ ] Remove deprecated type files
- [ ] Delete orphaned utilities
- [ ] Clean up imports in remaining files

### Phase 3: Dependency Cleanup

- [ ] Remove unused npm packages
- [ ] Update `package.json`
- [ ] Run `npm prune` or `pnpm prune`

### Phase 4: Import Consolidation

- [ ] Review all imports across components
- [ ] Remove any dead imports
- [ ] Ensure barrel exports (lib/index.ts, etc.) work
- [ ] Fix any broken imports from deletions

### Phase 5: Store Consolidation

- [ ] Verify navigationStore has all needed actions
- [ ] Confirm useWebSocketStore is marked as "deferred"
- [ ] Add comments about Phase 2+ features

### Phase 6: Type Safety Check

- [ ] Run TypeScript compiler
- [ ] Ensure 0 errors in active code
- [ ] Mark stub errors as expected

### Phase 7: Build & Test

- [ ] `pnpm build` - should succeed
- [ ] `pnpm dev` - should run
- [ ] Verify 3-pane layout works
- [ ] Test all core features:
  - Navigator tree navigation
  - Product selection
  - Media display
  - Health badge
  - Search functionality

### Phase 8: Documentation

- [ ] Create CONSOLIDATED_README.md
- [ ] Document kept components
- [ ] Document removed items and why
- [ ] Add quick-start guide
- [ ] Update architecture diagrams

---

## 📊 Expected Outcomes

### Before Consolidation

```
Components: ~12 files
  - Some unused
  - Dead code scattered
  - Unclear purpose of some files
  - Dependencies: Full stack

Code Health: 85/100
```

### After Consolidation

```
Components: 6 core files
  - All actively used
  - Clear purpose
  - Mission Control focused
  - Dependencies: Clean, minimal

Code Health: 95/100
```

---

## 🎯 Mission Control Finalized

After consolidation, the system will have:

✅ **Clean Architecture**

- Only Mission Control components
- No dead code
- Clear component hierarchy

✅ **Focused Workflow**

- Workbench: Product display
- Navigator: Browsing
- MediaBar: Media exploration
- HalileoNavigator: AI-enhanced search
- InsightsTable: Context awareness
- SystemHealthBadge: Status monitoring

✅ **Production Ready**

- Type-safe throughout
- Zero unused dependencies
- Optimized bundle
- Ready for scaling

✅ **Well Documented**

- Purpose of each component clear
- Architecture documented
- Easy for new developers

---

## 🚀 Next Phases (After Consolidation)

**Phase 2 (Week 2):**

- Implement WebSocket streaming (unblock useWebSocketStore)
- Wire JIT RAG API (unblock unifiedRouter.ts)
- Add multi-brand support

**Phase 3 (Week 3):**

- Add voice processing
- Implement advanced search
- Product comparison features

**Phase 4 (Week 4):**

- Scale to 100+ brands
- Performance optimization
- Analytics dashboard

---

**Status:** Ready to execute ✅
