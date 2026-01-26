# "God's View" - Product Relationships Implementation Guide

**Date**: January 25, 2026  
**Version**: 1.0  
**Status**: ✅ Implementation Complete

---

## Overview

The "God's View" is a unified product interface that merges **commercial data** (Halilit) with **technical knowledge** (Official Brand Sources) and intelligently discovers **product relationships** (Necessities, Accessories, Related Products).

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: ProductPopInterface                               │
│  ├─ Left: Product Info & Thumbnail                         │
│  ├─ Center: Details & Specifications                       │
│  ├─ Right: Official Resources (MediaBar)                   │
│  └─ Bottom: Relationships Grid                             │
│      ├─ Necessities (Red) - Required for operation         │
│      ├─ Accessories (Green) - Optional enhancements        │
│      └─ Related (Gray) - Similar alternatives              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: GenesisBuilder + RelationshipEngine                │
│  ├─ Merge: Halilit (commercial) + Official (knowledge)     │
│  ├─ Discover: Cross-product relationships via scoring      │
│  └─ Export: JSON with embedded relationship arrays         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DATA: frontend/public/data/{brand}.json                     │
│  └─ Each product includes:                                  │
│      - necessities: [{sku, name, price, ...}]             │
│      - accessories: [{sku, name, price, ...}]             │
│      - related: [{sku, name, price, ...}]                 │
│      - official_manuals: [{url, type, label, ...}]        │
│      - official_specs: {key: value, ...}                  │
└─────────────────────────────────────────────────────────────┘
```

---

## File Inventory

### Backend Files

#### 1. `backend/services/relationship_engine.py` (NEW)

**Purpose**: Discovers product relationships using intelligent scoring algorithm

**Key Classes**:

- `ProductRelationship` - Data class for single relationship
- `ProductRelationshipEngine` - Main orchestrator

**Key Methods**:

- `analyze_all_blueprints(all_products)` - Analyzes all products at once
- `discover_relationships(product)` - Analyzes one product
- `_score_necessity()` - Calculates "required for operation" score
- `_score_accessory()` - Calculates "optional enhancement" score
- `_score_related()` - Calculates "similar product" score

**Scoring Algorithm**:

```python
# Necessity Score (0.0-1.0)
- Power supply keywords + power-consuming category = +0.7
- Cable keywords + audio category = +0.5
- Stand/mount keywords + mount-requiring category = +0.6
- Custom specs matching = +0.4

# Accessory Score (0.0-1.0)
- Case/cover keywords + instrument category = +0.7
- Stand keywords + mounting-needing category = +0.6
- Same brand + explicit "accessories" category = +0.4

# Related Score (0.0-1.0)
- Same category = +0.5
- Price similarity (within 50%) = +0.3
- Same category family (e.g., "studio" includes recording, audio, mixing) = +0.4
- Same brand = +0.4
- Model name overlap (e.g., "Nord Lead" vs "Nord Lead A1") = +0.3
```

**Filtering**:

- Necessity: Score > 0.6 → Display
- Accessory: Score > 0.6 → Display
- Related: Score > 0.7 → Display (higher bar to reduce noise)

#### 2. `backend/services/genesis_builder.py` (MODIFIED)

**Changes**:

- Line 15-17: Added import for `ProductRelationshipEngine`
- Line 100-120: Added relationship analysis call in `construct()` method

**New Flow**:

```
1. Load blueprints (Halilit + Official)
2. Merge catalogs
3. Build product nodes
4. ANALYZE RELATIONSHIPS ← NEW STEP
5. Update catalog index
```

### Frontend Files

#### 3. `frontend/src/components/views/ProductPopInterface.tsx` (REWRITTEN)

**Purpose**: Main product detail interface with split-view and relationships

**New Components**:

- `ProductPopInterface` - Main component (3-column grid + relationships section)
- `MediaBar` - Official resources tab display (unchanged from previous)
- `RelationshipSection` - Container for relationship grids
- `RelationshipCardComponent` - Individual relationship card renderer

**Key Sections**:

```tsx
<ProductPopInterface>
  ├─ Header: Brand + Status + Price + Buy Button
  ├─ Main Content:
  │  ├─ Left (1/3): Product Info + Thumbnail
  │  ├─ Center (1/3): Details + Specs
  │  └─ Right (1/3): Official Resources (MediaBar)
  └─ Relationships Section:
     ├─ Necessities (Red Grid)
     ├─ Accessories (Green Grid)
     └─ Related (Gray Grid)
```

**Props**:

- `product`: Full product data with relationships
- `onSelectProduct`: Callback when user clicks related product

#### 4. `frontend/src/components/ui/RelationshipCard.tsx` (NEW)

**Purpose**: Individual card for displaying related products

**Variants**:

- `necessity` - Red border, AlertTriangle icon, "REQUIRED" label
- `accessory` - Green border, ShoppingCart icon
- `related` - Gray border, ChevronRight icon
- `ghost` - Minimal (for compact displays)

**Features**:

- Brand logo display
- Price display
- Stock status badge (red if out of stock)
- Product image hover overlay
- Click handler for selection
- Responsive grid layout

### Type Definition Files

#### 5. `frontend/src/types/index.ts` (UPDATED)

**Changes**:

- Added `necessity` to `ProductRelationship.type` union
- Added rich fields to `ProductRelationship` (sku, price, image_url, logo_url, brand, inStock)
- Added `OfficialMedia` interface for official resources
- Updated `Product` interface to include:
  - `necessities: ProductRelationship[]`
  - `accessories: ProductRelationship[]`
  - `related: ProductRelationship[]`
  - `official_manuals: OfficialMedia[]`
  - `official_gallery: string[]`
  - `official_specs: Record<string, string>`

### Documentation Files

#### 6. `.github/copilot-instructions.md` (UPDATED)

**New Section**: Section 8 - Product Relationships: "God's View" Interface

**Coverage**:

- Three relationship categories (Necessities, Accessories, Related)
- Implementation in backend and frontend
- Integration with GenesisBuilder
- Type definitions
- Critical rules and extensions

---

## How It Works: Step-by-Step

### Step 1: Data Generation (Backend)

**Trigger**: Running `GenesisBuilder` (via `forge_backbone.py` or manually)

**Process**:

```python
# 1. Load commercial + global blueprints
global_data = load_global_blueprint("roland")  # From official brand sites
commercial_data = load_commercial_blueprint("roland")  # From Halilit

# 2. Merge catalogs
blueprint = merge_catalogs(commercial_data, global_data)

# 3. Build product nodes (existing logic)
for product in blueprint:
    build_node(product)

# 4. ANALYZE RELATIONSHIPS (NEW)
engine = ProductRelationshipEngine()
blueprint = engine.analyze_all_blueprints(blueprint).values()
# Now each product has: necessities[], accessories[], related[]

# 5. Save to frontend data
update_catalog_index(blueprint)  # Saves to frontend/public/data/roland.json
```

**Output**:

```json
// frontend/public/data/roland.json
{
  "products": [
    {
      "id": "roland_fantom_06",
      "name": "FANTOM-06",
      "sku": "ROLAND-FANTOM-06",
      "price": "1999.00",

      "official_manuals": [
        {
          "url": "https://roland.com/assets/fantom_manual.pdf",
          "type": "pdf",
          "label": "User Manual",
          "source_domain": "roland.com"
        }
      ],
      "official_gallery": [
        "https://roland.com/images/fantom_01.jpg",
        "https://roland.com/images/fantom_02.jpg"
      ],

      "necessities": [
        {
          "sku": "ROLAND-PK-25",
          "name": "Roland PK-25 Pedal",
          "price": "199",
          "category": "Pedals & Controllers",
          "brand": "ROLAND"
        }
      ],

      "accessories": [
        {
          "sku": "BOSS-BCB-1",
          "name": "BOSS BCB-1 Pedalboard",
          "price": "349",
          "category": "Accessories",
          "brand": "BOSS"
        }
      ],

      "related": [
        {
          "sku": "ROLAND-FANTOM-08",
          "name": "FANTOM-08",
          "price": "2499",
          "category": "Keyboards & Synthesizers",
          "brand": "ROLAND"
        }
      ]
    }
  ]
}
```

### Step 2: Frontend Rendering

**Component Tree**:

```
App.tsx
  └─ ProductPopInterface.tsx
      ├─ [Header]
      ├─ [Main Grid]
      │  ├─ Left Column (Product Info)
      │  ├─ Center Column (Details)
      │  └─ Right Column (MediaBar)
      └─ [RelationshipSection]
         ├─ "Necessities" + grid of RelationshipCardComponent
         ├─ "Accessories" + grid of RelationshipCardComponent
         └─ "Related" + grid of RelationshipCardComponent
```

**Data Flow**:

```
1. ProductPopInterface loads product from JSON
   → product = {necessities: [...], accessories: [...], related: [...]}

2. Pass to RelationshipSection
   → <RelationshipSection necessities={product.necessities} ... />

3. RelationshipSection maps array to cards
   → {necessities.map(prod => <RelationshipCardComponent variant="necessity" />)}

4. User clicks card
   → onSelectProduct callback triggered
   → Load related product details
```

### Step 3: User Interactions

**Clicking a Necessity Card**:

1. User sees red "REQUIRED" card with PK-25 Pedal
2. Clicks the card
3. `onSelectProduct` callback fires with product data
4. App navigation updates to show PK-25 details
5. New ProductPopInterface opens with PK-25 as main product
6. Relationships re-discovered for PK-25 (what works with a pedal?)

**Clicking an Accessory Card**:

1. User sees green "ShoppingCart" card with pedalboard
2. Clicks the card
3. Similar flow as above, now showing pedalboard details

**Stock Status**:

1. If `inStock: false` on card
2. Red "Out of Stock" badge appears in top-right corner
3. Still clickable (link to product page)

---

## Configuration & Tuning

### Adjusting Scoring Thresholds

**Location**: `backend/services/relationship_engine.py`

**Currently**:

```python
NECESSITY_KEYWORDS = {
    "power": ["power supply", "adapter", ...],
    "cables": ["cable", "xlr", "usb", ...],
    "mounting": ["stand", "mount", ...],
}
```

**To Add New Keyword Category**:

```python
NECESSITY_KEYWORDS["cooling"] = ["heatsink", "fan", "cooling system"]
```

**To Change Confidence Thresholds**:

```python
# In discover_relationships()
if necessity_score > 0.5:  # Lower from 0.6 to 0.5 for more results
    results["necessities"].append(candidate)
```

### Adjusting Result Limits

**Location**: `backend/services/relationship_engine.py` → `discover_relationships()`

**Currently**:

```python
results["necessities"] = ... [:5]  # Show up to 5
results["accessories"] = ... [:8]  # Show up to 8
results["related"] = ... [:6]      # Show up to 6
```

**To Show More Related Products**:

```python
results["related"] = results["related"][:12]  # Show up to 12
```

### UI Styling Adjustments

**Location**: `frontend/src/components/views/ProductPopInterface.tsx`

**Change Grid Layout**:

```tsx
// Current: 4 columns for necessities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

// New: 3 columns for necessities
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
```

**Change Variant Colors**:

```tsx
// In RelationshipCardComponent getVariantStyles()
case "necessity":
  return `... border-orange-500/50 bg-orange-950/20`  // Orange instead of red
```

---

## Testing & Verification

### 1. Backend Verification

**Check relationship analysis works**:

```bash
cd backend
python3 -c "
from services.relationship_engine import ProductRelationshipEngine
from services.unified_ingestor import load_blueprints_from_disk

# Load test products
products = load_blueprints_from_disk('roland')

# Analyze
engine = ProductRelationshipEngine()
enriched = engine.analyze_all_blueprints(products)

# Print results
for sku, product in list(enriched.items())[:3]:
    print(f'{sku}: {len(product.get(\"necessities\", []))} necessities')
"
```

### 2. Frontend Verification

**Check relationships render**:

```bash
cd frontend
pnpm dev

# 1. Open browser to http://localhost:5173
# 2. Click on any product
# 3. Scroll down to Relationships section
# 4. Verify cards appear with correct colors/icons:
#    - Red cards = Necessities
#    - Green cards = Accessories
#    - Gray cards = Related
# 5. Click a card → Should navigate to that product
```

### 3. Type Checking

**Verify TypeScript compilation**:

```bash
cd frontend
npx tsc --noEmit

# Should have 0 errors
```

### 4. Data Validation

**Check JSON structure**:

```bash
# Verify necessities array exists
grep -A 5 "necessities" frontend/public/data/roland.json | head -20

# Validate JSON
python3 -c "import json; json.load(open('frontend/public/data/roland.json'))" && echo "✅ Valid"
```

---

## Troubleshooting

### Problem: No Relationships Appearing

**Check 1**: Are relationships computed?

```bash
grep -c "necessities" frontend/public/data/roland.json
# Should return > 0 if computed
```

**Check 2**: Is ProductPopInterface receiving data?

```tsx
// Add logging in component
useEffect(() => {
  console.log("Product data:", product);
  console.log("Necessities:", product?.necessities);
}, [product]);
```

**Check 3**: Is RelationshipSection visible?

```tsx
// Check if it's being rendered
{hasAnyRelationships && <RelationshipSection ... />}
```

**Solution**:

1. Re-run `forge_backbone.py` to regenerate JSON
2. Clear browser cache (DevTools → Application → Clear Storage)
3. Restart dev server (`pnpm dev`)

### Problem: Too Many/Too Few Relationships

**Edit thresholds** in `relationship_engine.py`:

```python
# Show more
if necessity_score > 0.5:  # Lower threshold

# Show less
if necessity_score > 0.8:  # Raise threshold
```

### Problem: Wrong Products Being Related

**Review scoring logic**:

```python
# For example, if a cable is showing as "related" instead of "necessity"
# Check _score_necessity() - may need keyword updates

NECESSITY_KEYWORDS["cables"].append("your-new-keyword")
```

---

## Integration with Other Systems

### With Unified Ingestion Protocol

The Unified Ingestion Protocol (Section 8 of copilot-instructions) provides:

- `OfficialMedia` interface for PDFs/images/specs
- `MassIngestProtocol` for split-source merging

**How they work together**:

```
Step 1: MassIngestProtocol merges Halilit + Official Brand sources
        → ProductBlueprint with official_manuals, official_specs

Step 2: GenesisBuilder calls ProductRelationshipEngine
        → Discovers necessities, accessories, related products
        → Enriches ProductBlueprint with relationship arrays

Step 3: Frontend ProductPopInterface receives enriched product
        → Displays official resources in MediaBar (top)
        → Displays relationships in grids (bottom)
```

### With Category Consolidation

All products are consolidated to 8 universal categories:

1. Keys & Pianos 🎹
2. Drums & Percussion 🥁
3. Guitars & Amps 🎸
4. Studio & Recording 🎙️
5. Live Sound 🔊
6. DJ & Production 🎧
7. Software & Cloud 💻
8. Accessories 🔧

**Impact on Relationships**:

- Relationship scoring uses BOTH original and consolidated categories
- Can match products across brands (e.g., RCF PA speaker + Bespeco cables)
- Increases discoverability without over-matching

---

## Extending for New Brands

When adding a new brand to the catalog:

### 1. Create Brand Scraper

```python
# backend/services/new_brand_scraper.py
from services.official_brand_base import OfficialBrandBase

class NewBrandScraper(OfficialBrandBase):
    def extract_manuals(self, model_name):
        # Scrape PDFs from new_brand.com
        pass

    def extract_official_gallery(self, model_name):
        # Scrape images from new_brand.com
        pass

    def extract_specs(self, model_name):
        # Extract specs from new_brand.com
        pass
```

### 2. Get Commercial Data

```python
# Get Halilit data
registry = HalilitBrandRegistry()
halilit_data = registry.get_brand_products("new_brand")
```

### 3. Run Genesis

```python
# This automatically discovers relationships
builder = GenesisBuilder("new_brand")
builder.construct()
```

### 4. Verify UI

```bash
# Products should appear with relationship cards automatically
# No manual relationship mapping needed!
```

---

## Performance Notes

### Scaling Characteristics

- **Time Complexity**: O(n²) where n = number of products
  - For 2,000 products = ~4 million comparisons
  - Mitigated by early exit on scoring threshold
- **Space Complexity**: O(n) for relationship arrays
  - Each product stores ~15-20 relationship references
  - Minimal overhead in JSON (~50KB per 1,000 products)

### Optimization Opportunities

1. **Batch Scoring**: Group similar products, score within groups first
2. **Caching**: Cache NECESSITY_KEYWORDS as compiled regex patterns
3. **Lazy Relationships**: Load relationship arrays only when ProductPopInterface mounts
4. **Pagination**: Show 5 cards, "Load More" button for additional cards

---

## Future Enhancements

### 1. Machine Learning Relationships

Replace keyword-based scoring with trained ML model:

- Fine-tune on actual user purchase history
- Learn from "frequently bought together" data
- Improve cross-brand compatibility detection

### 2. User Feedback Loop

Collect feedback on relationship quality:

- "Was this recommendation helpful?" buttons
- Retrain relationship engine based on feedback
- A/B test different scoring algorithms

### 3. Trending Relationships

Track popular related products:

- "Popular with this product" based on click counts
- Boost high-engagement relationships
- Seasonal variations (e.g., outdoor PA in summer)

### 4. Smart Bundling

Suggest product bundles:

- Keyboard + Pedal + Stand + Case = "Complete Studio Bundle"
- Discount calculation for bundle purchases
- One-click checkout

---

## Summary

The "God's View" implementation provides:

✅ **Unified Interface** - Commercial + Knowledge in one modal  
✅ **Smart Discovery** - Algorithmic relationship detection  
✅ **Cross-Brand Compatibility** - Products work together  
✅ **Scalable** - Works with thousands of products  
✅ **Extensible** - Easy to add new brands  
✅ **User-Friendly** - Clear visual hierarchy (red/green/gray)

---

**Version**: 1.0  
**Last Updated**: January 25, 2026  
**Status**: Production-Ready
