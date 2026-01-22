# HSC-JIT v3 - Data Flow Architecture

## Single Source of Truth: `useCategoryCatalog` Hook

### The One Way Data Flows

```
User Clicks Category
        ↓
GalaxyDashboard → selectUniversalCategory(categoryId)
        ↓
NavigationStore → currentUniversalCategory = "keys"
        ↓
Workbench → routes to UniversalCategoryView
        ↓
UniversalCategoryView → useCategoryCatalog(currentUniversalCategory)
        ↓
useCategoryCatalog Hook:
  1. Fetches ALL 10 brand JSON files in parallel
  2. Flattens to single Product[] array (100 products)
  3. Filters by main_category field
  4. Returns filtered products
        ↓
UniversalCategoryView:
  1. Receives products array
  2. Groups by subcategory → shelves
  3. Renders TierBar for each shelf
        ↓
TierBar → displays products
```

## Key Components

### `useCategoryCatalog` Hook

**Location**: `frontend/src/hooks/useCategoryCatalog.ts`
**Purpose**: ONLY data loader for category views
**Input**: Category ID ("keys", "drums", "studio", etc.)
**Output**: `{ products: Product[], loading: boolean }`

**Process**:

1. Fetches `/data/roland.json`, `/data/boss.json`, etc. (10 brands)
2. Extracts `.products` array from each
3. Flattens into single array
4. Filters by `main_category` field matching the category ID
5. Returns filtered products

### `UniversalCategoryView` Component

**Location**: `frontend/src/components/views/UniversalCategoryView.tsx`
**Purpose**: Display products for a category
**Data Source**: `useCategoryCatalog` hook ONLY (no props)

**Responsibilities**:

- Calls `useCategoryCatalog(currentUniversalCategory)`
- Groups products by subcategory
- Renders shelves using TierBar

### `Workbench` Component

**Location**: `frontend/src/components/Workbench.tsx`
**Purpose**: Route between views
**Data Responsibility**: NONE for universal categories

**What it does**:

- Routes to `<UniversalCategoryView />` when `currentLevel === "universal"`
- Loads brand-specific data only for brand views
- Does NOT fetch, filter, or pass category data

## Deleted Legacy Paths

❌ **REMOVED**: `Workbench` loading `universalProducts` state
❌ **REMOVED**: `catalogLoader.loadAllProducts()` called from Workbench
❌ **REMOVED**: Manual filtering in Workbench
❌ **REMOVED**: Passing `products` and `categoryTitle` props to UniversalCategoryView

## Exception: Search

**`instantSearch.ts`** is allowed to use `catalogLoader.loadAllProducts()` for search indexing. This is a separate concern and does not affect category browsing.

## Data Verification

Run this in browser console to verify:

```javascript
// Should see 100 products loaded, then filtered count
// Check console for: "[useCategoryCatalog] Loaded 100 total products"
// Check console for: "[useCategoryCatalog] Filtered to X products for category: 'keys'"
```

## Category Matching Logic

Input: `category = "keys"` (from store)

Matching rules:

1. **Direct match**: `product.main_category.toLowerCase().includes("keys")`
2. **Composite match**: For "Keys & Pianos" → matches products with `main_category: "Keys"`
3. **Fallback**: Searches in `subcategory` field

Examples:

- Category "keys" → matches products with `main_category: "Keys"`
- Category "drums" → matches products with `main_category: "Drums"`
- Category "studio" → matches products with `main_category: "Studio"`

## Testing Data Flow

1. Click "Keys & Pianos" in GalaxyDashboard
2. Console shows: "Universal Category Selected: keys"
3. Console shows: "[useCategoryCatalog] Loaded 100 total products for category: 'keys'"
4. Console shows: "[useCategoryCatalog] Filtered to 32 products for category: 'keys'"
5. UniversalCategoryView displays products grouped by subcategory

## Brand Files Structure

Each brand file (`/data/roland.json`, etc.) contains:

```json
{
  "brand_name": "Roland",
  "brand_identity": { "id": "roland", "name": "Roland" },
  "products": [
    {
      "id": "roland-fantom-06",
      "name": "Fantom-06",
      "brand": "Roland",
      "main_category": "Keys",        ← Filtering field
      "subcategory": "Workstation",   ← Grouping field
      "category": "Keys"
    }
  ]
}
```

## Summary

✅ **One Way In**: `useCategoryCatalog` hook
✅ **One Format**: Static JSON files in `public/data/`
✅ **One Filter**: By `main_category` field
✅ **One View**: `UniversalCategoryView` component
✅ **Zero Duplication**: No parallel loading paths
