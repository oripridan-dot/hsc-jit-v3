# Quick Reference: Brand-First Product System

## One-Command Full Sync

```bash
python backend/scripts/dual_source_orchestrator.py
```

## System Architecture (Simple)

```
Brand Websites          +          Halilit
  (Content)                     (Commerce)
    ↓                              ↓
 • Names                      • Pricing
 • Specs                       • SKU
 • Descriptions                • Stock
 • Images (HiRes)             • Images (Fallback)
 • Docs
    ↓                              ↓
    └──────── Dual-Source Merger ────────┘
                      ↓
            Unified Catalogs
                      ↓
            Frontend API
```

## Product Sources

| Source           | Content  | Pricing     | Images          | Note                 |
| ---------------- | -------- | ----------- | --------------- | -------------------- |
| **PRIMARY**      | Brand ✅ | Halilit ✅  | Brand + Halilit | Best coverage        |
| **SECONDARY**    | Brand ✅ | Check brand | Brand           | Direct from brand    |
| **HALILIT_ONLY** | Halilit  | Halilit     | Halilit         | Archive/discontinued |

## Image Priority

1. Brand website high-res ⭐
2. Brand website gallery ⭐
3. Halilit images
4. Placeholder (rare)

**Guarantee:** All products have images

## Key Files

| File                          | Purpose             |
| ----------------------------- | ------------------- |
| `dual_source_orchestrator.py` | Run everything      |
| `dual_source_merger.py`       | Match & merge logic |
| `brand_website_scraper.py`    | Capture brand data  |
| `dual_source_strategy.json`   | Configuration       |

## Product Schema

```json
{
  "source": "PRIMARY|SECONDARY|HALILIT_ONLY",
  "name": "From brand website",
  "specs": "From brand website",
  "price": "From Halilit",
  "sku": "From Halilit",
  "images": {
    "main": "From brand (high-res)",
    "gallery": "From brand",
    "fallback": "From Halilit"
  },
  "documentation": "From brand"
}
```

## Verification

```bash
# Check source distribution
python -c "
import json
with open('backend/data/catalogs/roland_catalog.json') as f:
    data = json.load(f)
    sources = {}
    for p in data['products']:
        s = p.get('source', 'unknown')
        sources[s] = sources.get(s, 0) + 1
    print(f'Distribution: {sources}')
"

# Check image coverage
python -c "
import json
from pathlib import Path
missing = sum(1 for catalog in Path('backend/data/catalogs').glob('*_catalog.json')
              for p in json.load(open(catalog))['products']
              if not p.get('images', {}).get('main'))
print(f'Products without images: {missing}')
"
```

## Matching Logic

1. If SKU matches → PRIMARY ✅
2. If name similarity > 70% → PRIMARY ✅
3. If no match → SECONDARY (brand only)
4. In Halilit only → HALILIT_ONLY

## What Happened to Old System

- ❌ Halilit was primary source (limited info)
- ✅ Brand websites now primary (complete info)
- ❌ Hebrew product names
- ✅ English product names from brands
- ❌ Basic images
- ✅ High-res images from brands
- ✅ Pricing still from Halilit (unchanged)
- ✅ SKU still from Halilit (unchanged)

## Frontend Impact

Products now have:

- `source` field (PRIMARY/SECONDARY/HALILIT_ONLY)
- `source_details` (which data came from where)
- Better `specs` object
- Better `images` with gallery
- `documentation` links

Display suggestions:

- PRIMARY: ✅ Green badge
- SECONDARY: ℹ️ Blue badge
- HALILIT_ONLY: ⚠️ Yellow badge

## Common Tasks

### Run full sync

```bash
python backend/scripts/dual_source_orchestrator.py
```

### Just merge (if brand data already scraped)

```bash
python backend/scripts/dual_source_merger.py
```

### Check one brand's status

```bash
python -c "
import json
with open('backend/data/catalogs/roland_catalog.json') as f:
    data = json.load(f)
    m = data['metadata']
    print(f'Primary: {m[\"primary_count\"]}')
    print(f'Secondary: {m[\"secondary_count\"]}')
    print(f'Halilit-only: {m[\"halilit_only_count\"]}')
    print(f'Total: {m[\"unified_products\"]}')
"
```

## Troubleshooting

| Problem          | Solution                                       |
| ---------------- | ---------------------------------------------- |
| No images        | Ensure Halilit images exist as fallback        |
| Wrong prices     | Verify Halilit data is loaded correctly        |
| Missing products | Check if brand website scraper failed          |
| Bad matches      | Review name similarity threshold (70% default) |

## Documentation

- Full guide: `BRAND_FIRST_IMPLEMENTATION.md`
- Architecture: `DUAL_SOURCE_SYSTEM.md`
- Config: `backend/data/dual_source_strategy.json`
- Status: `IMPLEMENTATION_COMPLETE.md`

## Status ✅

- Dual-source merger: READY
- Brand scraper enhancement: READY
- Orchestrator: READY
- Documentation: READY
- Awaiting: Full sync execution
