# Dual-Source Product Synchronization System

## Architecture Overview

The system maintains **two parallel product sources** with Halilit as the primary source of truth:

```
┌─ Halilit Official (PRIMARY) ──────────┐
│  What Halilit Actually Sells           │
│  - Official images (approved by brands)│
│  - Pricing (Halilit's prices)         │
│  - Stock status                        │
│  Source: halilit.com                  │
└────────────────────────────────────────┘
                    ↓
        [SYNCHRONIZATION SYSTEM]
                    ↓
┌─ Brand Websites (REFERENCE) ──────────┐
│  Full Product Lines                    │
│  - Complete catalog                    │
│  - All models ever made                │
│  - Gap identification                  │
│  Source: brand official websites      │
└────────────────────────────────────────┘
                    ↓
        [UNIFIED CATALOG WITH GAPS]
                    ↓
┌─ Single Queryable Database ────────────┐
│  Products with dual-source metadata    │
│  - What Halilit sells (primary)        │
│  - What brand makes (reference)        │
│  - Gap analysis (what's missing)       │
│  - Coverage percentage                 │
└────────────────────────────────────────┘
```

## Key Files

### 1. Extraction & Scraping Scripts

| Script                      | Purpose                     | Input                         | Output                           |
| --------------------------- | --------------------------- | ----------------------------- | -------------------------------- |
| `extract_halilit_brands.py` | Extract official brand list | halilit.com/pages/4367        | `halilit_official_brands.json`   |
| `halilit_scraper.py`        | Scrape Halilit's inventory  | Brand URLs from official list | `catalogs_halilit/*.json`        |
| `diplomat.py`               | AI config generator         | Brand website URLs            | `brands/{id}/scrape_config.json` |
| `harvest_all_brands.py`     | Brand website scraper       | Scrape configs                | `catalogs/*.json`                |

### 2. Analysis & Unification

| Script                       | Purpose                        | Input                | Output                    |
| ---------------------------- | ------------------------------ | -------------------- | ------------------------- |
| `gap_analyzer.py`            | Compare Halilit vs brand sites | Both catalogs        | `gap_reports/*.json`      |
| `unified_catalog_builder.py` | Merge with metadata            | Both catalogs        | `catalogs_unified/*.json` |
| `master_sync.py`             | Orchestrate everything         | Official brands list | All outputs               |

### 3. Data Directories

```
backend/data/
├── halilit_official_brands.json          # Single source of truth
├── brands/
│   ├── roland/scrape_config.json
│   ├── nord/scrape_config.json
│   └── ...
├── catalogs/                              # Brand website products
│   ├── roland_catalog.json
│   ├── nord_catalog.json
│   └── ...
├── catalogs_halilit/                      # Halilit inventory
│   ├── roland_halilit.json
│   ├── nord_halilit.json
│   └── ...
├── catalogs_unified/                      # Merged catalogs
│   ├── roland_unified.json
│   ├── nord_unified.json
│   └── ...
├── gap_reports/                           # Gap analysis
│   ├── roland_gap_report.json
│   ├── summary_gap_report.json
│   └── ...
└── sync_results.json                      # Latest sync results
```

## Execution Flow

### Option 1: Full Synchronization (Recommended)

```bash
cd backend

# 1. Extract official Halilit brands
python scripts/extract_halilit_brands.py

# 2. Run master synchronizer (does everything)
python scripts/master_sync.py --priority

# 3. Build unified catalogs
python scripts/unified_catalog_builder.py --all
```

### Option 2: Step by Step

```bash
# Step 1: Scrape Halilit (primary source)
python scripts/halilit_scraper.py --brand-id roland --url "https://www.halilit.com/g/5193-Brand/33109-Roland"

# Step 2: Scrape brand website (reference)
python scripts/harvest_all_brands.py

# Step 3: Analyze gaps
python scripts/gap_analyzer.py --all

# Step 4: Build unified catalog
python scripts/unified_catalog_builder.py --brands roland nord boss
```

## Data Schema

### Halilit Catalog (`catalogs_halilit/*.json`)

```json
{
  "source": "halilit",
  "distributor": "Halilit Music Center",
  "brand_id": "roland",
  "total_products": 8,
  "products": [
    {
      "name": "FP-90X Digital Piano",
      "halilit_id": "12345",
      "url": "https://www.halilit.com/...",
      "image_url": "https://...",
      "price": "25,990",
      "currency": "ILS",
      "in_stock": true,
      "source": "halilit"
    }
  ]
}
```

### Brand Catalog (`catalogs/*.json`)

```json
{
  "brand_identity": {
    "id": "roland",
    "name": "Roland",
    "website": "https://www.roland.com"
  },
  "products": [
    {
      "id": "roland-fp-90x",
      "name": "FP-90X Digital Piano",
      "images": {
        "main": "https://...",
        "thumbnail": "https://..."
      },
      "documentation": {
        "url": "https://www.roland.com/products/fp-90x/",
        "type": "html"
      }
    }
  ]
}
```

### Unified Catalog (`catalogs_unified/*.json`)

```json
{
  "brand_id": "roland",
  "metadata": {
    "primary_source": "halilit",
    "includes_full_brand_line": true
  },
  "inventory": {
    "halilit": {
      "count": 8,
      "products": [...]
    },
    "brand_website": {
      "count": 42,
      "products": [...]
    }
  },
  "gap_analysis": {
    "total_halilit": 8,
    "total_brand": 42,
    "common_products": 8,
    "gap_count": 34,
    "coverage_percentage": 19.05,
    "gap_products": [...]
  }
}
```

### Gap Report (`gap_reports/*.json`)

```json
{
  "brand_id": "roland",
  "halilit_count": 8,
  "brand_website_count": 42,
  "common_count": 8,
  "gap_count": 34,
  "coverage_percentage": 19.05,
  "gap_products": [
    {
      "name": "TR-808 Rhythm Composer",
      "category": "drum-machines",
      "reason": "Vintage product - not in current Halilit inventory"
    }
  ]
}
```

## Key Metrics

### Coverage

- **Coverage %**: `(Common Products / Total Brand Products) × 100`
- Identifies which product lines Halilit carries vs doesn't

### Gap Analysis

- **Products in Halilit only**: Products not on brand website (rare)
- **Products in gap**: Products on brand site but not in Halilit inventory
- **Common products**: Products in both sources (should be identical)

## Important Notes

### Images & Content

- ✅ All images are **approved** - provided by brands to Halilit
- ✅ Safe to use in UI without additional licensing
- ✅ Halilit URL is source of truth for image licensing

### Data Freshness

- Update Halilit inventory: Weekly recommended
- Update brand websites: Monthly recommended
- Gap analysis: Run after each sync

### Sync Strategy

1. **Always sync Halilit first** (primary source)
2. **Then sync brand websites** (for reference/gaps)
3. **Generate gap analysis** to identify what's missing
4. **Create unified catalog** for UI consumption

## Usage in Application

### Frontend Query Example

```typescript
// Get Halilit's inventory for a brand
const halilit_products = await fetch(
  "/api/products?source=halilit&brand=roland"
);

// Get full product line for comparison
const all_products = await fetch("/api/products?source=brand&brand=roland");

// Get gap analysis
const gaps = await fetch("/api/gaps?brand=roland");
```

### Backend Integration

```python
# Load unified catalog
with open('data/catalogs_unified/roland_unified.json') as f:
    catalog = json.load(f)

# Primary source: Halilit
halilit_products = catalog['inventory']['halilit']['products']

# Reference: Full brand line
brand_products = catalog['inventory']['brand_website']['products']

# Gap info
gaps = catalog['gap_analysis']
```

## Troubleshooting

### No Halilit products found

- Check URL format: `https://www.halilit.com/g/5193-Brand/{brand-id}`
- Verify brand has products on Halilit website
- Check HTML structure hasn't changed

### Gap analysis shows 100% gap

- Brand website scrape may have failed
- Diplomat config may be incorrect
- Try regenerating with: `python diplomat.py --brand {id} --url {url}`

### Image URLs broken

- Halilit URLs are CDN cached - should be reliable
- Check CloudFront domain: `d3m9l0v76dty0.cloudfront.net`

## Performance

- Scraping all 18 priority brands: ~30-45 minutes
- Gap analysis: ~5-10 seconds per brand
- Building unified catalogs: ~30 seconds total

## Next Steps

1. **Run initial sync**: `python scripts/master_sync.py --priority`
2. **Verify outputs**: Check `data/gap_reports/summary_gap_report.json`
3. **Review gaps**: Identify priority products to add
4. **Update frontend**: Integrate unified catalogs into product search
5. **Schedule updates**: Set cron job for weekly Halilit sync

---

**Source of Truth**: https://www.halilit.com/pages/4367
**Last Updated**: January 15, 2026
**System**: Halilit Smart Catalog JIT v3.5
