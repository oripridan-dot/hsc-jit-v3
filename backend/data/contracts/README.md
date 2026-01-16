# Brand Contracts System

## Overview

The Brand Contracts system provides a **single source of truth** for each brand's:
- **Category hierarchy** (12 main categories → subcategories)
- **Visual assets** (logos, colors, typography)
- **Display rules** (UI presentation guidelines)
- **Metadata** (founding year, headquarters, tagline)

## Problem It Solves

**Before**: Products had 131+ fragmented categories (Boss) and 140+ (Roland) scraped from individual product pages.

**After**: Products map to **12 main categories** defined in official brand navigation, preserving subcategory detail.

## Contract Structure

```json
{
  "brand_id": "boss",
  "brand_name": "BOSS",
  "version": "1.0.0",
  
  "assets": {
    "logo": { "primary_svg": "..." },
    "colors": { "primary": "#000000", "secondary": "#FFD700" }
  },
  
  "categories": {
    "main_categories": [
      {
        "id": "effects-pedals",
        "name": "Effects Pedals",
        "slug": "effects-pedals",
        "subcategories": [
          {
            "id": "distortion",
            "name": "Distortion",
            "keywords": ["blues driver", "metal zone", "distortion"]
          }
        ]
      }
    ],
    "category_mapping": {
      "Blues Driver": "effects-pedals"
    }
  },
  
  "display_rules": {
    "product_card": { "show_brand_badge": true },
    "category_filter": { "collapse_subcategories": true }
  }
}
```

## Boss Categories (12)

1. **Effects Pedals** → Distortion, Modulation, Delay, Reverb, Dynamics, Filter/EQ, Pitch/Synth
2. **Multi-Effects** → Guitar Processors, Bass Processors
3. **Loop Station** → Loop Pedals
4. **Guitar Synthesizers** → Synth Pedals
5. **Mixers & Audio Solutions** → Streaming Mixers, Recorders
6. **Wireless** → Wireless Systems
7. **Vocal Effects** → Vocal Processors
8. **Acoustic** → Acoustic Amps, Acoustic Pedals
9. **Tuners/Metronomes** → Tuners, Metronomes
10. **BOSS Amplifiers** → Guitar Amps
11. **Roland Amplifiers** → (sold through Boss)
12. **Accessories** → Cables, Bags & Cases, Pedals & Switches, Power, Other

## Roland Categories (12)

1. **Pianos** → Digital Piano, Stage Piano, Artisan Series
2. **Synthesizers** → Synthesizers, GROOVEBOX, Desktop Synth, Analog, Bass Synth
3. **Keyboards** → MIDI Controllers, Performance Keyboards, Samplers
4. **Guitar & Bass** → Guitar Synthesizers, Guitar Amplifiers, Cabinets
5. **Drums & Percussion** → V-Drums, Electronic Percussion, Drum Accessories
6. **Wind Instruments** → Aerophone
7. **Production** → Samplers, Recorders, Rhythm Machines
8. **Amplifiers** → Instrument Amps, Speakers
9. **AIRA & DJ** → DJ Controllers, AIRA Compact
10. **Roland Cloud** → Membership, Software
11. **Professional A/V** → Streaming Mixers, Livestreaming, Audio Interfaces
12. **Accessories** → Pedals & Controllers, Cables, Bags & Cases, Stands, Power, Headphones, Other

## Usage

### Load Contract Manager

```python
from core.brand_contracts import BrandContractManager

manager = BrandContractManager()
```

### Enrich Product with Category Hierarchy

```python
product = {
    "brand": "boss",
    "name": "BD-2 Blues Driver",
    "category": "Blues Driver"  # From scraped data
}

enriched = manager.enrich_product(product)

# Result:
{
    "brand": "boss",
    "name": "BD-2 Blues Driver",
    "category": "Blues Driver",
    "original_category": "Blues Driver",
    "main_category": "effects-pedals",
    "main_category_name": "Effects Pedals",
    "subcategory": "distortion",
    "subcategory_name": "Distortion"
}
```

### Get Category Tree for UI

```python
tree = manager.get_category_tree("boss")

# Returns hierarchical structure for rendering filters:
{
    "brand_id": "boss",
    "categories": [
        {
            "id": "effects-pedals",
            "name": "Effects Pedals",
            "icon": "🎸",
            "subcategories": [
                {"id": "distortion", "name": "Distortion"},
                {"id": "modulation", "name": "Modulation"},
                ...
            ]
        },
        ...
    ]
}
```

### Get Brand Assets

```python
assets = manager.get_brand_assets("boss")

# Returns:
{
    "logo": {
        "primary_svg": "https://www.boss.info/static/boss_logo.svg"
    },
    "colors": {
        "primary": "#000000",
        "secondary": "#FFD700"
    }
}
```

## Integration with Build System

Update `build.py` to apply contracts during build:

```python
from core.brand_contracts import BrandContractManager

builder = CatalogBuilder()
contract_manager = BrandContractManager()

# Enrich products with category hierarchy
for product in products:
    product = contract_manager.enrich_product(product)

# Include category tree in output
category_tree = contract_manager.get_category_tree(brand_id)
output_data["category_tree"] = category_tree
```

## Frontend Usage

```typescript
interface Product {
  name: string;
  brand: string;
  // Original scraped category
  original_category: string;
  
  // Contract-based hierarchy
  main_category: string;        // "effects-pedals"
  main_category_name: string;   // "Effects Pedals"
  subcategory?: string;         // "distortion"
  subcategory_name?: string;    // "Distortion"
}

// Render category filter with 12 main categories
<CategoryFilter 
  mainCategories={catalog.category_tree.categories}
  collapsible={true}
/>
```

## Adding New Brand Contracts

1. Create `/backend/data/contracts/brands/{brand}_contract.json`
2. Define 12 main categories from brand's official navigation
3. Add subcategories with keyword mappings
4. Include brand assets (logo, colors)
5. Test with `python core/brand_contracts.py`

## Validation

```python
is_valid, errors = manager.validate_contract("boss")

if not is_valid:
    for error in errors:
        print(f"❌ {error}")
```

## Benefits

✅ **Consistent UI**: 12 main categories across all brands  
✅ **Preserves Detail**: Subcategories maintain specificity  
✅ **Brand Authentic**: Categories from official brand websites  
✅ **Easy Filtering**: Hierarchical structure for UI  
✅ **Type Safe**: JSON schema validation  
✅ **Maintainable**: Single source of truth per brand  

## Files

- `/backend/data/contracts/schema/brand_contract_schema.json` - JSON schema
- `/backend/data/contracts/brands/boss_contract.json` - Boss contract
- `/backend/data/contracts/brands/roland_contract.json` - Roland contract
- `/backend/core/brand_contracts.py` - Contract manager

## Next Steps

1. ✅ Create contracts for Boss and Roland
2. ⏳ Integrate with build.py
3. ⏳ Update frontend types and UI
4. ⏳ Create contracts for remaining 36 brands
5. ⏳ Add contract validation to CI/CD
