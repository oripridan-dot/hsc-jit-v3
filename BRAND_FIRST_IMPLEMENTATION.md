# Implementation Guide: Brand-Website-First Product System

## Overview

The system has been restructured to prioritize **brand official websites** as the primary source for product content, with **Halilit** providing commerce data (pricing & SKU).

## What Changed

### Before (Halilit-First)

```
Halilit.com → Product Data → Frontend
```

- ❌ Limited product information
- ❌ Hebrew product names/descriptions
- ❌ Basic images
- ✅ Current pricing
- ✅ SKU codes

### Now (Brand-Website-First)

```
Brand Website → Content Data
                    ↓
              Dual-Source Merger
                    ↓
              Halilit → Pricing & SKU
                    ↓
           Unified Catalog → Frontend
```

- ✅ Complete product specifications
- ✅ English product names and descriptions
- ✅ High-resolution images from brands
- ✅ Product manuals and documentation
- ✅ Current pricing from Halilit
- ✅ SKU codes from Halilit
- ✅ Source attribution (PRIMARY/SECONDARY/HALILIT_ONLY)

## New Components

### 1. Enhanced Brand Website Scraper

**File:** `backend/scripts/brand_website_scraper.py` (UPDATED)

Now captures:

- High-resolution product images
- Complete product specifications
- Product descriptions
- Documentation URLs
- Gallery images
- SKU/Model numbers
- Category information

### 2. Dual-Source Merger

**File:** `backend/scripts/dual_source_merger.py` (NEW)

Merges brand website + Halilit data with strategy:

- **PRIMARY:** Products found in both sources (best coverage)
- **SECONDARY:** Brand-only products (brand direct)
- **HALILIT_ONLY:** Halilit archive products (verify availability)

### 3. Dual-Source Orchestrator

**File:** `backend/scripts/dual_source_orchestrator.py` (NEW)

Orchestrates complete workflow:

1. Scrape brand websites
2. Load Halilit data
3. Run merger
4. Generate unified catalogs

### 4. Strategy Configuration

**File:** `backend/data/dual_source_strategy.json` (NEW)

Documents source strategy and data field assignments

## How to Use

### Option 1: Full Sync

```bash
cd /workspaces/hsc-jit-v3
python backend/scripts/dual_source_orchestrator.py
```

This will:

- Scrape all brand websites
- Load all Halilit data
- Merge everything
- Generate unified catalogs

### Option 2: Step-by-Step

```bash
# Step 1: Scrape brand websites
python backend/scripts/brand_website_scraper.py

# Step 2: Run merger (uses existing Halilit data)
python backend/scripts/dual_source_merger.py
```

## Product Classification in Output

Each product now includes source information:

```json
{
  "id": "roland-td-17kvx",
  "name": "TD-17KVX Electronic Drum Kit",
  "price": "7890",
  "currency": "ILS",
  "source": "PRIMARY",
  "source_details": {
    "content": "brand_website",
    "pricing": "halilit",
    "sku": "halilit"
  },
  "specs": {
    "pads": 12,
    "sounds": 452,
    "recording_tracks": 99
  },
  "images": {
    "main": "https://brand.com/highres.jpg",
    "gallery": ["..."]
  },
  "documentation": {
    "manual_url": "https://brand.com/manual.pdf",
    "type": "pdf"
  }
}
```

## Image Handling

### Priority Order

1. Brand website high-resolution images (PREFERRED)
2. Brand website gallery images
3. Halilit images (fallback)
4. Placeholder (last resort)

### Guarantee

- Every product MUST have at least a thumbnail image
- Main image: minimum 600x600px
- Thumbnail: minimum 150x150px

## Data Sources Explained

### Brand Websites (PRIMARY for Content)

- ✅ Official product specifications
- ✅ Complete product descriptions
- ✅ High-quality product images
- ✅ Manuals and technical documentation
- ✅ Accurate product names and features
- ❌ Usually no pricing (regional market variation)
- ❌ No SKU codes (brand uses different numbering)

### Halilit.com (PRIMARY for Commerce)

- ✅ Current pricing in Israeli Shekel
- ✅ SKU/Item codes for ordering
- ✅ Stock availability status
- ✅ Payment and shipping information
- ✅ Product images (official/approved)
- ❌ Limited product specifications
- ❌ May lack latest models
- ❌ Hebrew-only product descriptions

## Matching Algorithm

Products are matched across sources using:

1. **Exact SKU Match** (if available)

   - Highest confidence

2. **Name Similarity** (70%+ threshold)

   - Normalized names without special characters
   - Handles variations like "TD-17" vs "TD17"

3. **Manual Override** (future enhancement)
   - For edge cases and difficult matches

## Frontend Impact

### API Response Changes

Products now include:

- `source`: "PRIMARY" | "SECONDARY" | "HALILIT_ONLY"
- `source_details`: {content, pricing, sku sources}
- `documentation`: {manual_url, type}
- Enhanced `specs` object
- Better `images` object with gallery

### Display Strategy (Recommendation)

```
PRIMARY:      ✅ Full green badge "Official + Price Available"
SECONDARY:    ℹ️ Blue badge "From Brand - Check Pricing"
HALILIT_ONLY: ⚠️ Yellow badge "Available from Distributor"
```

## Verification

### Check Implementation

```bash
# See how many products in each category
python -c "
import json
with open('backend/data/catalogs/roland_catalog.json') as f:
    data = json.load(f)
    sources = {}
    for p in data['products']:
        s = p.get('source', 'unknown')
        sources[s] = sources.get(s, 0) + 1
    print(f'Source distribution: {sources}')
    print(f'Total: {len(data[\"products\"])} products')
"

# Check image coverage
python -c "
import json
from pathlib import Path
missing = []
for catalog in Path('backend/data/catalogs').glob('*_catalog.json'):
    with open(catalog) as f:
        data = json.load(f)
        for p in data['products']:
            if not p.get('images', {}).get('main'):
                missing.append(p['name'][:20])
if missing:
    print(f'❌ {len(missing)} products missing images')
    print(f'   Examples: {missing[:3]}')
else:
    print('✅ All products have images')
"
```

## Key Differences from Old System

| Aspect         | Old System             | New System              |
| -------------- | ---------------------- | ----------------------- |
| Primary Source | Halilit                | Brand Website           |
| Product Name   | Halilit (Hebrew)       | Brand Website (English) |
| Specifications | Minimal                | Complete                |
| Images         | From Halilit           | From Brand (high-res)   |
| Pricing        | From Halilit           | From Halilit            |
| SKU            | From Halilit           | From Halilit            |
| Documentation  | None                   | From Brand              |
| Coverage       | Halilit Inventory Only | Both Sources            |
| User Trust     | Distributor Only       | Brand + Distributor     |

## Troubleshooting

### Issue: Products have no images

**Solution:** Halilit fallback may have failed. Check if Halilit images exist:

```bash
ls -la backend/data/catalogs_halilit/
```

Ensure image URLs are valid and accessible.

### Issue: Product matches seem wrong

**Check:**

- SKU codes match correctly
- Name normalization is working
- Similarity threshold (default 70%) is appropriate

### Issue: Missing products from brand website

**Check:**

- Brand website scraper config exists
- Website structure hasn't changed
- Playwright is installed: `pip install -r requirements-playwright.txt`

## Next Steps

1. ✅ **System Created:** Dual-source merger implemented
2. ✅ **Brand Scraper Enhanced:** Now captures high-res images and specs
3. ⏳ **Populate Brand Data:** Run scrapers for each brand
4. ⏳ **Validate Matches:** Verify product matching accuracy
5. ⏳ **Frontend Updates:** Display source information
6. ⏳ **User Testing:** Verify improved product information

## Configuration Files

All configuration is in these files:

- `backend/data/dual_source_strategy.json` - Strategy documentation
- `backend/scripts/dual_source_merger.py` - Merger logic
- `backend/scripts/brand_website_scraper.py` - Scraper logic
- `backend/scripts/dual_source_orchestrator.py` - Orchestration

To modify strategy, edit `dual_source_strategy.json` and rebuild catalogs.
