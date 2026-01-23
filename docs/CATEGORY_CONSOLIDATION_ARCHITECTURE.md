# 🏷️ Category Consolidation Architecture

## Core Principle

**"Accept what brands give us exactly, translate to steady UI categories."**

The UI ALWAYS displays the same 8 universal categories in the same order. Brand-specific taxonomies are preserved in product data but translated for display.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CATEGORY CONSOLIDATION SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DATA LAYER (Source of Truth)                                           │
│  ─────────────────────────────                                          │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────────────────┐                 │
│  │  Brand Website  │───▶│  brand_taxonomy.py          │                 │
│  │  (Roland says   │    │  (Preserves EXACT labels)   │                 │
│  │  "Pianos")      │    │                             │                 │
│  └─────────────────┘    │  • ROLAND_TAXONOMY          │                 │
│                         │  • BOSS_TAXONOMY            │                 │
│  ┌─────────────────┐    │  • NORD_TAXONOMY            │                 │
│  │  Nord Website   │───▶│  • MOOG_TAXONOMY            │                 │
│  │  (Nord says     │    │                             │                 │
│  │  "Piano")       │    │  Output: product.category   │                 │
│  └─────────────────┘    │  = original brand label     │                 │
│                         └──────────────┬──────────────┘                 │
│                                        │                                 │
│                                        ▼                                 │
│  TRANSLATION LAYER (Steady UI)                                          │
│  ─────────────────────────────────                                      │
│                                                                          │
│                         ┌─────────────────────────────┐                 │
│                         │  category_consolidator.py   │                 │
│                         │  categoryConsolidator.ts    │                 │
│                         │                             │                 │
│                         │  Roland "Pianos" ──────────┐│                 │
│                         │  Nord "Piano" ─────────────┼┼─▶ 🎹 Keys       │
│                         │  Moog "Synthesizers" ──────┘│                 │
│                         │                             │                 │
│                         │  Boss "Effects Pedals" ────┐│                 │
│                         │  Roland "Guitar & Bass" ───┼┼─▶ 🎸 Guitars    │
│                         │  Roland "Amplifiers" ──────┘│                 │
│                         └──────────────┬──────────────┘                 │
│                                        │                                 │
│                                        ▼                                 │
│  UI LAYER (Always Steady)                                               │
│  ─────────────────────────                                              │
│                                                                          │
│                         ┌─────────────────────────────┐                 │
│                         │  Navigator.tsx              │                 │
│                         │                             │                 │
│                         │  🎹 Keys & Pianos      [1]  │                 │
│                         │  🥁 Drums & Percussion [2]  │                 │
│                         │  🎸 Guitars & Amps     [3]  │  ◀── FIXED     │
│                         │  🎙️ Studio & Recording [4]  │      ORDER     │
│                         │  🔊 Live Sound         [5]  │      ALWAYS    │
│                         │  🎧 DJ & Production    [6]  │                 │
│                         │  💻 Software & Cloud   [7]  │                 │
│                         │  🔧 Accessories        [8]  │                 │
│                         └─────────────────────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The 8 Universal UI Categories

| #   | ID            | Label              | Icon | Color   | Description                         |
| --- | ------------- | ------------------ | ---- | ------- | ----------------------------------- |
| 1   | `keys`        | Keys & Pianos      | 🎹   | Amber   | Synths, Pianos, Controllers, Organs |
| 2   | `drums`       | Drums & Percussion | 🥁   | Red     | Electronic & Acoustic Drums         |
| 3   | `guitars`     | Guitars & Amps     | 🎸   | Blue    | Electric, Bass, Effects, Amps       |
| 4   | `studio`      | Studio & Recording | 🎙️   | Emerald | Interfaces, Monitors, Mics          |
| 5   | `live`        | Live Sound         | 🔊   | Violet  | PA Systems, Mixers, Wireless        |
| 6   | `dj`          | DJ & Production    | 🎧   | Pink    | Controllers, Samplers, Grooveboxes  |
| 7   | `software`    | Software & Cloud   | 💻   | Cyan    | Plugins, Apps, Cloud Services       |
| 8   | `accessories` | Accessories        | 🔧   | Slate   | Cables, Stands, Cases, Pedals       |

**These categories NEVER change.** They are always displayed in the same order.

---

## How It Works

### 1. Scraper Preserves Original Category

```python
# Scraper extracts EXACT brand terminology
product = {
    "id": "nord-stage-4",
    "name": "Nord Stage 4",
    "brand": "nord",
    "category": "Stage",          # ← Original Nord label preserved!
    "subcategory": "73HP Compact"
}
```

### 2. Consolidator Translates for UI

```typescript
import { consolidateCategory } from "./categoryConsolidator";

// Nord says "Stage", UI shows "Keys & Pianos"
const uiCategory = consolidateCategory("nord", "Stage");
// Returns: "keys"
```

### 3. Navigator Displays Steady Categories

```tsx
// Navigator ALWAYS shows the same 8 categories
{
  consolidatedCategories.map((cat) => (
    <button onClick={() => selectUniversalCategory(cat.id)}>
      {cat.icon} {cat.label} {/* 🎹 Keys & Pianos */}
    </button>
  ));
}
```

### 4. Product Details Show Original

```tsx
// When showing product details, display original brand category
<ProductCard>
  <Badge>Stage</Badge> {/* Original Nord label */}
  <h2>Nord Stage 4</h2>
</ProductCard>
```

---

## Brand Mapping Examples

| Brand  | Original Category  | →   | Consolidated Category |
| ------ | ------------------ | --- | --------------------- |
| Roland | Pianos             | →   | 🎹 Keys & Pianos      |
| Roland | Synthesizers       | →   | 🎹 Keys & Pianos      |
| Roland | Drums & Percussion | →   | 🥁 Drums & Percussion |
| Roland | Guitar & Bass      | →   | 🎸 Guitars & Amps     |
| Roland | Amplifiers         | →   | 🎸 Guitars & Amps     |
| Roland | Production         | →   | 🎙️ Studio & Recording |
| Roland | AIRA               | →   | 🎧 DJ & Production    |
| Roland | Roland Cloud       | →   | 💻 Software & Cloud   |
| Nord   | Stage              | →   | 🎹 Keys & Pianos      |
| Nord   | Piano              | →   | 🎹 Keys & Pianos      |
| Nord   | Electro            | →   | 🎹 Keys & Pianos      |
| Nord   | Drum               | →   | 🥁 Drums & Percussion |
| Boss   | Effects Pedals     | →   | 🎸 Guitars & Amps     |
| Boss   | Multi-Effects      | →   | 🎸 Guitars & Amps     |
| Boss   | Loop Station       | →   | 🎧 DJ & Production    |
| Boss   | Vocal Effects      | →   | 🎙️ Studio & Recording |
| Moog   | Synthesizers       | →   | 🎹 Keys & Pianos      |
| Moog   | Effects            | →   | 🎸 Guitars & Amps     |
| Moog   | Apps               | →   | 💻 Software & Cloud   |

---

## Files

| File                                       | Purpose                          |
| ------------------------------------------ | -------------------------------- |
| `backend/models/category_consolidator.py`  | Python consolidation logic       |
| `frontend/src/lib/categoryConsolidator.ts` | TypeScript consolidation logic   |
| `frontend/src/components/Navigator.tsx`    | Uses consolidated categories     |
| `backend/models/brand_taxonomy.py`         | Preserves original brand labels  |
| `frontend/src/lib/brandTaxonomy.ts`        | TypeScript brand taxonomy mirror |

---

## Key Decisions

### ✅ What We DO

1. **Preserve Original** - Product data contains exact brand terminology
2. **Translate for UI** - Consolidator maps to 8 steady categories
3. **Fixed Order** - Categories always in the same position
4. **Color Coded** - Each category has consistent color anchor
5. **Brand Filter** - Users can filter by brand within any category

### ❌ What We DON'T Do

1. **Lose Data** - Original brand categories are always preserved
2. **Move Categories** - Position 1 is always Keys, Position 2 is always Drums
3. **Show Brand-Specific Nav** - We don't switch Navigator based on brand
4. **Confuse Users** - Same UI regardless of which brand they're exploring

---

## Adding a New Brand

1. **Add mappings to `category_consolidator.py`**:

```python
BRAND_MAPPINGS["new-brand"] = {
    "their_synth_category": "keys",
    "their_drum_category": "drums",
    "their_guitar_category": "guitars",
    # ... etc
}
```

2. **Mirror in `categoryConsolidator.ts`**:

```typescript
"new-brand": {
  their_synth_category: "keys",
  their_drum_category: "drums",
  their_guitar_category: "guitars",
  // ... etc
},
```

3. **Test with validation**:

```bash
cd /workspaces/hsc-jit-v3/backend
python3 models/category_consolidator.py
```

---

## Validation

Run the consolidator to see coverage report:

```bash
cd /workspaces/hsc-jit-v3/backend
python3 models/category_consolidator.py
```

Output:

```
Category Consolidator - Validation Report
============================================================
{
  "total_brands": 10,
  "total_mappings": 102,
  "consolidated_categories": ["keys", "drums", "guitars", ...],
  "coverage": {
    "keys": { "brands_with_mappings": 5, "total_brand_categories": 28 },
    "drums": { "brands_with_mappings": 2, "total_brand_categories": 6 },
    ...
  }
}

Example Translations:
============================================================
  roland   | Pianos             → 🎹 Keys & Pianos
  nord     | Stage              → 🎹 Keys & Pianos
  boss     | Effects Pedals     → 🎸 Guitars & Amps
```

---

## Benefits

| Benefit                 | Description                                     |
| ----------------------- | ----------------------------------------------- |
| **Predictable**         | Users always know where to find things          |
| **Zero Learning Curve** | No need to learn each brand's taxonomy          |
| **Fast Navigation**     | Muscle memory works - Keys is always position 1 |
| **Data Integrity**      | Original brand labels preserved for accuracy    |
| **Easy Extension**      | Add new brands with just mapping definitions    |
| **Color Anchors**       | Categories have consistent visual identity      |

---

**Version**: 3.7.7-consolidation  
**Last Updated**: January 2026
