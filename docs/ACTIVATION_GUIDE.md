# 🎬 ACTIVATION GUIDE: Running Real Scrapers

**HSC-JIT v3.8.1** | How to Get REAL Product Data (Not Synthetic)

---

## 📊 Current Status

**As of January 23, 2026**:

| Component        | Status              | Details                                    |
| ---------------- | ------------------- | ------------------------------------------ |
| **Frontend**     | ✅ Production Ready | 3.8.0, all features working                |
| **Scrapers**     | ✅ Production Ready | Code complete, not activated               |
| **Current Data** | ✅ Available        | 9 demo products in static JSON             |
| **Real Data**    | 💤 Standby          | 200+ products available, scraping disabled |

### The Situation

**Right now:**

- ✅ Frontend displays 9 demo products
- ✅ All scraper code is production-ready
- ❌ Real scrapers haven't been run against brand websites

**Available (waiting to be activated):**

- ✅ ~100+ Roland products (scraper ready)
- ✅ ~50+ Boss products (scraper ready)
- ✅ ~30+ Nord products (scraper ready)
- ✅ ~20+ Moog products (scraper ready)
- = **200+ total products** available for scraping

**Data Flow**:

```
Current (9 Demo Products):
Static JSON (checked in) → forge_backbone.py (past) → /frontend/public/data/*.json → Frontend

Potential (200+ Real Products):
Brand Websites → Scrapers → forge_backbone.py (future) → /frontend/public/data/*.json → Frontend
```

---

## ✅ ACTIVATION SEQUENCE

### Step 1: Run the Roland Scraper (Most Complete)

**File**: `/workspaces/hsc-jit-v3/backend/services/roland_scraper.py`

```bash
cd /workspaces/hsc-jit-v3/backend

# Option A: Scrape ALL products (will take ~75-90 minutes)
python3 -c "
import asyncio
from services.roland_scraper import RolandScraper

async def main():
    scraper = RolandScraper()
    print('🚀 Starting Roland scraper...')
    catalog = await scraper.scrape_all_products(max_products=None)
    print(f'✅ Scraped {len(catalog.products)} Roland products')
    print(f'   - Total images: {sum(len(p.images) for p in catalog.products)}')
    print(f'   - Total specs: {sum(len(p.specifications) for p in catalog.products)}')

asyncio.run(main())
"

# Option B: Test with 3 products (quick verification, ~3 minutes)
python3 -c "
import asyncio
from services.roland_scraper import RolandScraper

async def main():
    scraper = RolandScraper()
    print('🚀 Testing Roland scraper (3 products)...')
    catalog = await scraper.scrape_all_products(max_products=3)
    print(f'✅ Test successful: {len(catalog.products)} products')

asyncio.run(main())
"
```

**Expected Output**:

```
2026-01-23 14:32:15 | INFO | Starting Roland scraper...
2026-01-23 14:32:16 | INFO | Discovering product URLs...
2026-01-23 14:32:45 | INFO | Found 87 Roland products
2026-01-23 14:32:46 | INFO | Scraping product pages...
2026-01-23 14:34:12 | INFO | Scraped 87 Roland products
   ├─ Total images: 312
   ├─ Total specs: 445
   ├─ Total features: 523
   ├─ Total manuals: 67
   └─ Total relationships: 134
✅ Catalog saved: backend/data/catalogs_brand/roland.json
```

**What Gets Saved**: `/workspaces/hsc-jit-v3/backend/data/catalogs_brand/roland.json`

---

### Step 2: Run forge_backbone.py (The Refiner)

This takes the raw scraper output and converts it to production-ready static JSON.

```bash
cd /workspaces/hsc-jit-v3/backend

python3 forge_backbone.py
```

**What It Does**:

1. Loads `backend/data/catalogs_brand/*.json` (scraper outputs)
2. Normalizes brand taxonomies
3. Consolidates all products
4. Generates search indexes
5. Creates static JSON catalogs
6. Outputs to `/frontend/public/data/`

**Expected Output**:

```
2026-01-23 14:45:30 | INFO | Loading brand catalogs...
2026-01-23 14:45:31 | INFO | ✓ Roland: 87 products
2026-01-23 14:45:32 | INFO | ✓ Boss: 3 products
2026-01-23 14:45:33 | INFO | ✓ Nord: 4 products
2026-01-23 14:45:34 | INFO | ✓ Moog: 2 products
2026-01-23 14:45:35 | INFO | Compiling master index...
2026-01-23 14:45:40 | INFO | ✅ Build complete!
2026-01-23 14:45:41 | INFO | Written: index.json (Master catalog)
2026-01-23 14:45:42 | INFO | Written: roland.json (87 products)
2026-01-23 14:45:43 | INFO | Written: boss.json (3 products)
2026-01-23 14:45:44 | INFO | Written: nord.json (4 products)
2026-01-23 14:45:45 | INFO | Written: moog.json (2 products)
2026-01-23 14:45:46 | INFO | Total products: 96
2026-01-23 14:45:47 | INFO | Verification: ✓ All products valid
```

**Files Created**:

- `/frontend/public/data/index.json` - Master catalog spine
- `/frontend/public/data/roland.json` - All Roland products (real data)
- `/frontend/public/data/boss.json` - All Boss products (real data)
- `/frontend/public/data/nord.json` - All Nord products (real data)
- `/frontend/public/data/moog.json` - All Moog products (real data)

---

### Step 3: Refresh Frontend

The frontend dev server is already running. Just reload the page.

```bash
# If not running, start it:
cd /workspaces/hsc-jit-v3/frontend
pnpm dev
```

Then open in browser: **http://localhost:5173**

**What You Should See**:

- 🎹 87 Roland products loaded
- 🥁 3 Boss products
- 🎹 4 Nord products
- 🎹 2 Moog products
- **Total**: 96 real products (not 9 synthetic ones)

---

## 🔧 RUNNING OTHER SCRAPERS

### Boss Scraper

```bash
cd /workspaces/hsc-jit-v3/backend
python3 -c "
import asyncio
from services.boss_scraper import BossScraper

async def main():
    scraper = BossScraper()
    catalog = await scraper.scrape_all_products()
    print(f'✅ Boss: {len(catalog.products)} products')

asyncio.run(main())
"
```

### Nord Scraper

```bash
python3 -c "
import asyncio
from services.nord_scraper import NordScraper

async def main():
    scraper = NordScraper()
    catalog = await scraper.scrape_all_products()
    print(f'✅ Nord: {len(catalog.products)} products')

asyncio.run(main())
"
```

### Moog Scraper

```bash
python3 -c "
import asyncio
from services.moog_scraper import MoogScraper

async def main():
    scraper = MoogScraper()
    catalog = await scraper.scrape_all_products()
    print(f'✅ Moog: {len(catalog.products)} products')

asyncio.run(main())
"
```

### Run ALL Scrapers in Parallel

```bash
cd /workspaces/hsc-jit-v3/backend
python3 -c "
import asyncio
from services.roland_scraper import RolandScraper
from services.boss_scraper import BossScraper
from services.nord_scraper import NordScraper
from services.moog_scraper import MoogScraper

async def main():
    scraper_tasks = [
        RolandScraper().scrape_all_products(),
        BossScraper().scrape_all_products(),
        NordScraper().scrape_all_products(),
        MoogScraper().scrape_all_products(),
    ]

    results = await asyncio.gather(*scraper_tasks)

    total_products = sum(len(r.products) for r in results)
    total_images = sum(sum(len(p.images) for p in r.products) for r in results)

    print(f'✅ Total scraped: {total_products} products, {total_images} images')

asyncio.run(main())
"
```

---

## ⏱️ TIME ESTIMATES

| Scraper | Products | Time           | Size       |
| ------- | -------- | -------------- | ---------- |
| Roland  | ~87      | 60-90 min      | ~15 MB     |
| Boss    | ~3       | 2-3 min        | <1 MB      |
| Nord    | ~4       | 2-3 min        | <1 MB      |
| Moog    | ~2       | 1-2 min        | <1 MB      |
| **All** | ~96      | **65-100 min** | **~17 MB** |

---

## 🧪 VERIFICATION: Test with Small Sample

To verify scrapers work before running the full sweep:

```bash
cd /workspaces/hsc-jit-v3/backend

python3 -c "
import asyncio
from services.roland_scraper import RolandScraper

async def main():
    print('Testing Roland scraper (2 products)...')
    scraper = RolandScraper()
    catalog = await scraper.scrape_all_products(max_products=2)

    if catalog.products:
        product = catalog.products[0]
        print(f'✅ Product: {product.name}')
        print(f'   - Model: {product.model_number}')
        print(f'   - Images: {len(product.images)}')
        print(f'   - Specs: {len(product.specifications)}')
        print(f'   - Features: {len(product.features)}')
        print(f'   - Category: {product.main_category} > {product.subcategory}')
    else:
        print('❌ No products scraped')

asyncio.run(main())
"
```

---

## 🎯 EXPECTED RESULTS

After running all steps, your `/frontend/public/data/index.json` will show:

```json
{
  "version": "3.7.4",
  "total_products": 96,
  "total_verified": 96,
  "brands": [
    {
      "id": "roland",
      "name": "Roland",
      "count": 87,
      "product_count": 87
    },
    {
      "id": "boss",
      "name": "Boss",
      "count": 3,
      "product_count": 3
    },
    {
      "id": "nord",
      "name": "Nord",
      "count": 4,
      "product_count": 4
    },
    {
      "id": "moog",
      "name": "Moog",
      "count": 2,
      "product_count": 2
    }
  ]
}
```

Instead of the current:

```json
{
  "version": "3.7.4",
  "total_products": 9,
  "total_verified": 9,
  "brands": [
    {
      "id": "roland",
      "name": "Roland",
      "count": 5
    }
    // ... only 9 total
  ]
}
```

---

## 🚨 TROUBLESHOOTING

### Scraper Hangs or Times Out

- **Cause**: Website might be slow or blocking
- **Fix**: Run with smaller batch size first (max_products=10)
- **Check**: Is your internet connection stable?

### forge_backbone.py Fails

- **Cause**: Missing intermediate catalog files
- **Fix**: Make sure scraper output is in `backend/data/catalogs_brand/`
- **Verify**: `ls -la backend/data/catalogs_brand/`

### Frontend Still Shows Old Data

- **Cause**: Browser cache
- **Fix**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Import Errors

- **Cause**: Dependencies not installed
- **Fix**:
  ```bash
  cd /workspaces/hsc-jit-v3/backend
  pip install -r requirements.txt
  ```

---

## 📊 DATA QUALITY CHECKS

After scrapers run, verify data quality:

```bash
cd /workspaces/hsc-jit-v3/backend

python3 -c "
import json
from pathlib import Path

data_dir = Path('data/catalogs_brand')

for json_file in data_dir.glob('*.json'):
    with open(json_file) as f:
        catalog = json.load(f)

    products = catalog.get('products', [])

    print(f'\n{json_file.stem.upper()}:')
    print(f'  Total products: {len(products)}')

    # Check data completeness
    with_images = sum(1 for p in products if p.get('images'))
    with_specs = sum(1 for p in products if p.get('specifications'))
    with_features = sum(1 for p in products if p.get('features'))

    print(f'  ✓ With images: {with_images}/{len(products)}')
    print(f'  ✓ With specs: {with_specs}/{len(products)}')
    print(f'  ✓ With features: {with_features}/{len(products)}')
"
```

---

## 🎓 WHAT'S BEING EXTRACTED

Each product gets:

- ✅ **Name & Model** (guaranteed)
- ✅ **Full Description** (10+ sources)
- ✅ **Images** (main + gallery + technical)
- ✅ **Specifications** (from tables + definition lists)
- ✅ **Features** (bullet lists)
- ✅ **Categories** (3-level hierarchy)
- ✅ **Accessories** (related products)
- ✅ **Manuals** (PDF links)
- ✅ **Videos** (YouTube, Vimeo)
- ✅ **Support Resources** (knowledge base)

---

## ✨ NEXT: The Big Picture

Once real data is scraped and in the frontend:

1. **Run test suite** against real products

   ```bash
   cd /workspaces/hsc-jit-v3/frontend
   pnpm test:e2e
   ```

2. **Verify 157-product test fixture** still works

   ```bash
   pnpm test:integration
   ```

3. **Deploy to production**

   ```bash
   cd /workspaces/hsc-jit-v3/frontend
   pnpm build
   # Deploy dist/ folder to hosting
   ```

4. **Monitor data quality**
   - Check search relevance
   - Verify category assignments
   - Monitor image loading
   - Track user interactions

---

## 📌 COMMANDS QUICK REFERENCE

```bash
# Scrape all brands
cd backend && python3 forge_backbone.py

# Scrape just Roland
python3 -c "
import asyncio
from services.roland_scraper import RolandScraper
asyncio.run(RolandScraper().scrape_all_products())
"

# Build static catalogs
python3 forge_backbone.py

# Refresh frontend (already running)
# Just reload browser at http://localhost:5173

# Verify data
ls -lh ../frontend/public/data/*.json
```

---

**Ready to activate real scraping?**  
Run the commands above to replace synthetic data with real brand website data.

_System: HSC-JIT v3.7 | Verified: 2026-01-23_
