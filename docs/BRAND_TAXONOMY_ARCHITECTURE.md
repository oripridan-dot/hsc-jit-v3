# 🏷️ Brand Taxonomy Architecture

## Core Principle

**The UI taxonomy must be 100% compatible with each brand's official taxonomy.**

We do NOT create abstract "universal" categories like "Keys & Pianos" that try to group products across brands. Instead, we display exactly what each brand uses on their website.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BRAND TAXONOMY SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │  Brand Website  │───▶│  brand_taxonomy.py          │    │
│  │  (Source of     │    │  (Python - Backend)         │    │
│  │   Truth)        │    │                             │    │
│  └─────────────────┘    │  • ROLAND_TAXONOMY          │    │
│                         │  • BOSS_TAXONOMY            │    │
│                         │  • NORD_TAXONOMY            │    │
│                         │  • MOOG_TAXONOMY            │    │
│                         │                             │    │
│                         │  Functions:                 │    │
│                         │  • normalize_category()     │    │
│                         │  • validate_category()      │    │
│                         │  • get_all_brand_categories│    │
│                         └──────────────┬──────────────┘    │
│                                        │                    │
│                                        ▼                    │
│                         ┌─────────────────────────────┐    │
│                         │  brandTaxonomy.ts           │    │
│                         │  (TypeScript - Frontend)    │    │
│                         │                             │    │
│                         │  • Same taxonomies          │    │
│                         │  • Same validation          │    │
│                         │  • Used by Navigator        │    │
│                         └──────────────┬──────────────┘    │
│                                        │                    │
│                                        ▼                    │
│                         ┌─────────────────────────────┐    │
│                         │  Navigator.tsx              │    │
│                         │                             │    │
│                         │  • Shows brand categories   │    │
│                         │  • Uses official labels     │    │
│                         │  • No remapping             │    │
│                         └─────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Brand Taxonomies

### Roland (40 categories)

**Source**: https://www.roland.com/global/categories/

| Root Category      | Icon | Subcategories                                          |
| ------------------ | ---- | ------------------------------------------------------ |
| Pianos             | 🎹   | Grand, Portable, Stage, Upright, Accessories           |
| Synthesizers       | 🎛️   | Analog Modeling, Performance Workstation, Patches      |
| Keyboards          | ⌨️   | -                                                      |
| Organs             | 🎹   | -                                                      |
| Drums & Percussion | 🥁   | V-Drums, Electronic Percussion, Hybrid, Accessories    |
| Guitar & Bass      | 🎸   | -                                                      |
| Amplifiers         | 🔊   | Keyboard Amps, Guitar Amps, Bass Amps                  |
| Production         | 🎚️   | -                                                      |
| AIRA               | 🔮   | -                                                      |
| Wind Instruments   | 🎷   | -                                                      |
| Roland Cloud       | ☁️   | -                                                      |
| Accessories        | 🔧   | Cables, Headphones, Stands, Cases, Pedals, MIDI Cables |

### BOSS (13 categories)

**Source**: https://www.boss.info/global/categories/

| Root Category            | Icon |
| ------------------------ | ---- |
| Effects Pedals           | 🎸   |
| Multi-Effects            | 🎛️   |
| Guitar Synthesizers      | 🎹   |
| Amplifiers               | 🔊   |
| Acoustic                 | 🪕   |
| Loop Station             | 🔁   |
| Vocal Effects            | 🎤   |
| Mixers & Audio Solutions | 🎚️   |
| Tuners & Metronomes      | 🎵   |
| Wireless                 | 📡   |
| Accessories              | 🔧   |

### Nord (9 categories)

**Source**: https://www.nordkeyboards.com/products

| Root Category | Icon | Description                  |
| ------------- | ---- | ---------------------------- |
| Stage         | 🎹   | Flagship Stage Keyboards     |
| Piano         | 🎹   | Stage Piano Series           |
| Electro       | 🎹   | Electro-Mechanical           |
| Lead          | 🎛️   | Virtual Analog Synths        |
| Wave          | 🌊   | Wavetable Synthesizers       |
| Drum          | 🥁   | Virtual Analog Drum Machines |
| C2D Organ     | 🎹   | Combo Organ                  |
| Accessories   | 🔧   | Pedals, Cases, Stands        |
| Software      | 💻   | Sound Manager, Sample Editor |

### Moog (9 categories)

**Source**: https://www.moogmusic.com/products

| Root Category | Icon | Subcategories                                 |
| ------------- | ---- | --------------------------------------------- |
| Synthesizers  | 🎛️   | Semi-Modular, Polyphonic, Monophonic, Modular |
| Effects       | 🎸   | Moogerfooger, Minifooger                      |
| Keyboards     | ⌨️   | Controllers                                   |
| Accessories   | 🔧   | Cables, Cases, Patch Cables                   |
| Apps          | 📱   | Animoog, Model D                              |

---

## How It Works

### 1. Scraper Extracts Category from URL

```python
# Example: https://www.roland.com/global/categories/pianos/stage_pianos/products/rd-2000

url_path = "/global/categories/pianos/stage_pianos/products/rd-2000"
# Extract: main_category = "Pianos", subcategory = "Stage Pianos"
```

### 2. Scraper Validates Against Taxonomy

```python
from models.brand_taxonomy import normalize_category, validate_category

# Raw category from breadcrumb
raw = "Digital Pianos"

# Normalize to official taxonomy
official = normalize_category("roland", raw)
# Returns: "Pianos" (the official Roland label)
```

### 3. Frontend Displays Brand Categories

```tsx
// When user selects Roland brand
const brandCategories = getRootCategories("roland");

// Returns: Pianos, Synthesizers, Keyboards, Organs, ...
// Displayed in Navigator with official labels and icons
```

---

## Validation Pipeline

The AI validation pipeline checks every product against its brand's official taxonomy:

```bash
cd /workspaces/hsc-jit-v3/backend
python3 services/ai_pipeline.py roland
```

Output:

```
📊 Validation Report: Roland
Status: ✅ READY
Products: 20
  ✅ Valid: 20
  ⚠️ Warnings: 13  # Categories needing normalization
  ❌ Errors: 0

📋 Issues:
  ⚠️ [roland-gopiano_go-61p-a] category: 'Digital Pianos' should be 'Pianos'
      → Fix: Use official label: Pianos
```

---

## Files

| File                                    | Purpose                       |
| --------------------------------------- | ----------------------------- |
| `backend/models/brand_taxonomy.py`      | Python taxonomy definitions   |
| `frontend/src/lib/brandTaxonomy.ts`     | TypeScript taxonomy (mirror)  |
| `frontend/src/components/Navigator.tsx` | Uses taxonomy for navigation  |
| `backend/services/ai_pipeline.py`       | Validates against taxonomy    |
| `backend/services/roland_scraper.py`    | Extracts categories from URLs |

---

## Key Decisions

### ❌ What We DON'T Do

1. **No "Universal Categories"** - We don't group "Roland Pianos" + "Nord Piano" into a fake "Keys & Pianos" category
2. **No Fuzzy Guessing** - We don't guess that "Digital Piano" means "Keys"
3. **No Cross-Brand Hierarchy** - Each brand has its own distinct taxonomy

### ✅ What We DO

1. **Exact Match** - Product category MUST match official brand taxonomy
2. **Normalization** - "Digital Pianos" → "Pianos" (official Roland label)
3. **Validation** - AI pipeline catches any non-taxonomy categories
4. **Brand-Specific Navigation** - When you select Roland, you see Roland's categories

---

## Adding a New Brand

1. **Research official taxonomy** from brand website
2. **Add to `backend/models/brand_taxonomy.py`**:

```python
NEW_BRAND_TAXONOMY = BrandTaxonomy(
    brand_id="new-brand",
    brand_name="New Brand",
    base_url="https://www.newbrand.com",
    categories={
        "category_slug": CategoryNode(
            id="category_slug",
            label="Category Label",
            url_path="/products/category/",
            parentId=None,
            icon="🎵",
            description="Description"
        ),
        # ... more categories
    }
)

BRAND_TAXONOMIES["new-brand"] = NEW_BRAND_TAXONOMY
```

3. **Mirror in `frontend/src/lib/brandTaxonomy.ts`**
4. **Create scraper using taxonomy URLs**
5. **Run validation**:

```bash
python3 services/ai_pipeline.py new-brand
```

---

**Version**: 3.7.7-taxonomy-aligned  
**Last Updated**: January 2026
