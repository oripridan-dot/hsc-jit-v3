# Backend Pipeline Validation & Verification Checklist - v3.7

Complete inspection, adjustment, and verification plan for HSC JIT v3.7 backend data flow from scraping through API serving.

**Version:** 3.7.0  
**Created:** 2026-01-19  
**Status:** Implementation Guide

---

## 📋 Table of Contents

1. [Pre-Scraping Inspection](#pre-scraping-inspection)
2. [Scraping Execution & Monitoring](#scraping-execution--monitoring)
3. [Data Transformation Pipeline](#data-transformation-pipeline)
4. [Quality Assurance & Validation](#quality-assurance--validation)
5. [API Serving & Verification](#api-serving--verification)
6. [Multi-Brand Verification](#multi-brand-verification)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting & Recovery](#troubleshooting--recovery)

---

## 🔍 Pre-Scraping Inspection

### Configuration Verification

- [ ] **Brand Recipe Validation**

  ```bash
  # Verify brand_recipes.json has both Roland and Boss with correct structure
  python -c "
  import json
  with open('backend/data/brand_recipes.json') as f:
    recipes = json.load(f)
    for brand in ['roland', 'boss']:
      assert brand in recipes, f'{brand} not found'
      assert 'start_url' in recipes[brand]
      assert 'selectors' in recipes[brand]
  print('✅ Brand recipes validated')
  "
  ```

- [ ] **Brands Metadata Check**

  ```bash
  # Verify both brands in metadata
  python -c "
  import json
  with open('backend/data/brands_metadata.json') as f:
    metadata = json.load(f)
    for brand in ['roland', 'boss']:
      assert any(b['id'] == brand for b in metadata), f'{brand} not in metadata'
  print('✅ Brands metadata complete')
  "
  ```

- [ ] **Output Directory Structure**

  ```bash
  # Ensure catalogs directory exists
  mkdir -p backend/data/catalogs
  mkdir -p backend/data/rag_embeddings
  mkdir -p frontend/public/data/catalogs_brand
  echo "✅ Output directories ready"
  ```

- [ ] **Python Dependencies Check**
  ```bash
  cd backend
  pip list | grep -E "playwright|tenacity|pydantic|fastapi"
  # Should show all installed
  ```

### Selector Validation

- [ ] **Roland Selector Test**

  ```bash
  # Manually verify Roland product page structure
  python -c "
  from backend.services.roland_scraper import RolandScraper
  import asyncio

  async def test():
    scraper = RolandScraper()
    print(f'Base URL: {scraper.base_url}')
    print(f'Products URL: {scraper.products_url}')
    print(f'Categories to explore: {len(scraper.category_urls)}')

  asyncio.run(test())
  "
  ```

- [ ] **Boss Selector Test**

  ```bash
  # Verify Boss product page structure
  python -c "
  from backend.services.boss_scraper import BossScraper
  import asyncio

  async def test():
    scraper = BossScraper()
    print(f'Base URL: {scraper.base_url}')
    print(f'Products URL: {scraper.products_url}')
    print(f'Categories to explore: {len(scraper.category_urls)}')

  asyncio.run(test())
  "
  ```

---

## 🚀 Scraping Execution & Monitoring

### Roland Scraping

- [ ] **Dry Run (5 products)**

  ```bash
  cd backend
  python orchestrate_brand.py --brand roland --max-products 5
  # ⏱️ Expected: ~2-3 minutes
  # ✅ Should output: 5 products with images, specs, features
  ```

- [ ] **Check Output**

  ```bash
  # Verify catalog was created
  ls -lah backend/data/catalogs/roland_catalog.json

  # Check product count
  python -c "
  import json
  with open('backend/data/catalogs/roland_catalog.json') as f:
    cat = json.load(f)
    print(f'Products: {len(cat[\"products\"])}')
    print(f'Brand: {cat[\"brand_identity\"][\"name\"]}')
  "
  ```

- [ ] **Full Scrape (all products)**
  ```bash
  cd backend
  python orchestrate_brand.py --brand roland
  # ⏱️ Expected: 30-45 minutes (depends on product count)
  # Monitor output for errors
  ```

### Boss Scraping

- [ ] **Dry Run (5 products)**

  ```bash
  cd backend
  python orchestrate_brand.py --brand boss --max-products 5
  # ⏱️ Expected: ~2-3 minutes
  # ✅ Should output: 5 Boss products
  ```

- [ ] **Compare Structure**

  ```bash
  # Verify Boss and Roland have same structure
  python -c "
  import json

  with open('backend/data/catalogs/roland_catalog.json') as f:
    roland = json.load(f)
  with open('backend/data/catalogs/boss_catalog.json') as f:
    boss = json.load(f)

  # Check matching keys
  roland_keys = set(roland.keys())
  boss_keys = set(boss.keys())
  print(f'Matching top-level keys: {roland_keys == boss_keys}')
  print(f'Keys: {roland_keys}')

  # Check product field consistency
  roland_prod_keys = set(roland['products'][0].keys())
  boss_prod_keys = set(boss['products'][0].keys())
  common_keys = roland_prod_keys & boss_prod_keys
  print(f'Common product fields: {common_keys}')
  "
  ```

- [ ] **Full Scrape (all products)**
  ```bash
  cd backend
  python orchestrate_brand.py --brand boss
  # ⏱️ Expected: Similar to Roland (same CMS structure)
  ```

---

## 📊 Data Transformation Pipeline

### Orchestration Check

- [ ] **Catalog Generation**

  ```bash
  # Verify orchestrator creates proper ProductCatalog objects
  python -c "
  from backend.models.product_hierarchy import ProductCatalog
  import json

  with open('backend/data/catalogs/roland_catalog.json') as f:
    data = json.load(f)
    # Validate schema
    assert data['brand_identity']['id'] == 'roland'
    assert 'products' in data
    assert len(data['products']) > 0
  print('✅ Roland catalog schema valid')
  "
  ```

- [ ] **Frontend Sync**

  ```bash
  # Check if catalogs copied to frontend
  ls -lah frontend/public/data/catalogs_brand/
  # Should have roland*.json and boss*.json

  # Verify index.json updated
  python -c "
  import json
  with open('frontend/public/data/index.json') as f:
    index = json.load(f)
    brands = {b['id'] for b in index['brands']}
    print(f'Brands in index: {brands}')
    assert 'roland' in brands
  "
  ```

- [ ] **Forge Backbone Optional**
  ```bash
  # Optional: Run forge_backbone to refine catalogs
  cd backend
  python forge_backbone.py
  # Adds: themes, logo caching, search graph, hierarchy
  ```

---

## ✅ Quality Assurance & Validation

### Unit Tests

- [ ] **Run Validator Tests**

  ```bash
  cd backend
  pytest tests/unit/test_validator.py -v
  # Should pass all tests:
  # - test_valid_product_no_issues ✅
  # - test_missing_required_field_* ✅
  # - test_invalid_* ✅
  # - test_valid_*_catalog ✅
  ```

- [ ] **Fix Any Test Failures**
  ```bash
  # Debug failed tests
  pytest tests/unit/test_validator.py::TestProductValidator::test_valid_product_no_issues -v -s
  ```

### Integration Tests

- [ ] **Run Pipeline Tests**
  ```bash
  cd backend
  pytest tests/integration/test_roland_boss_pipeline.py -v
  # Should verify:
  # - Catalog structure consistency ✅
  # - Data quality checks ✅
  # - Multi-brand compatibility ✅
  ```

### Data Validation

- [ ] **Validate Roland Catalog**

  ```bash
  python -c "
  from backend.core.validator import validate_catalog_file
  from pathlib import Path

  report = validate_catalog_file(Path('backend/data/catalogs/roland_catalog.json'))
  print(report.summary())

  if not report.is_valid:
    print(f'❌ {report.error_count} errors found')
    for issue in report.issues:
      print(f'  - {issue.level.value}: {issue.message}')
  "
  ```

- [ ] **Validate Boss Catalog**

  ```bash
  python -c "
  from backend.core.validator import validate_catalog_file
  from pathlib import Path

  report = validate_catalog_file(Path('backend/data/catalogs/boss_catalog.json'))
  print(report.summary())

  if not report.is_valid:
    print(f'❌ {report.error_count} errors found')
  "
  ```

- [ ] **Check Image URL Validity**

  ```bash
  # Verify all image URLs are accessible
  python -c "
  import json
  import re

  for brand in ['roland', 'boss']:
    with open(f'backend/data/catalogs/{brand}_catalog.json') as f:
      cat = json.load(f)

    broken = []
    for prod in cat['products'][:5]:  # Test first 5
      img_url = prod.get('image_url', '')
      if not re.match(r'^https?://', img_url):
        broken.append(prod['id'])

    print(f'{brand}: {len(broken)} broken image URLs')
    if broken:
      print(f'  Broken: {broken}')
  "
  ```

- [ ] **Verify Category Consistency**

  ```bash
  python -c "
  import json

  for brand in ['roland', 'boss']:
    with open(f'backend/data/catalogs/{brand}_catalog.json') as f:
      cat = json.load(f)

    categories = set()
    for prod in cat['products']:
      categories.update(prod.get('categories', []))

    print(f'{brand} categories: {sorted(categories)}')
    assert len(categories) > 0, f'{brand} has no categories'
  "
  ```

---

## 🌐 API Serving & Verification

### FastAPI Server

- [ ] **Start Backend Server**

  ```bash
  cd backend
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  # Should output: Uvicorn running on http://0.0.0.0:8000
  # Should load all catalogs at startup
  ```

- [ ] **Health Check**

  ```bash
  curl http://localhost:8000/health
  # Should return: {"status": "ok"}
  ```

- [ ] **List Brands API**

  ```bash
  curl http://localhost:8000/api/brands
  # Should list Roland and Boss
  curl http://localhost:8000/api/brands | python -m json.tool
  ```

- [ ] **Get Roland Catalog**

  ```bash
  curl http://localhost:8000/api/catalog/roland | python -m json.tool | head -50
  # Should return full catalog with products
  ```

- [ ] **Get Boss Catalog**

  ```bash
  curl http://localhost:8000/api/catalog/boss | python -m json.tool | head -50
  # Should return Boss catalog
  ```

- [ ] **Product Search**

  ```bash
  # Search across all products
  curl "http://localhost:8000/api/products/search?q=drum"
  curl "http://localhost:8000/api/products/search?q=effect"
  ```

- [ ] **RAG Status**
  ```bash
  curl http://localhost:8000/api/rag/status | python -m json.tool
  # Should show RAG system availability
  ```

### Frontend Integration

- [ ] **Start Frontend**

  ```bash
  cd frontend
  pnpm dev
  # Should start on http://localhost:5173
  # Should load Roland catalog by default
  ```

- [ ] **Test Brand Selection**

  ```bash
  # Using browser DevTools or API:
  # 1. Select Roland → should load ~29 products
  # 2. Select Boss → should load Boss products
  # 3. Verify product details display correctly
  ```

- [ ] **Test Search**
  ```bash
  # In frontend:
  # 1. Search "drum" → should find products
  # 2. Search "effect" → should find products
  # 3. Verify results from both brands if multi-brand
  ```

---

## 🔀 Multi-Brand Verification

### Structural Compatibility

- [ ] **Product Field Parity**

  ```bash
  python -c "
  import json

  with open('backend/data/catalogs/roland_catalog.json') as f:
    roland_fields = set(f.json.load(f)['products'][0].keys())
  with open('backend/data/catalogs/boss_catalog.json') as f:
    boss_fields = set(json.load(f)['products'][0].keys())

  missing_in_boss = roland_fields - boss_fields
  missing_in_roland = boss_fields - roland_fields

  if missing_in_boss:
    print(f'Fields in Roland but not Boss: {missing_in_boss}')
  if missing_in_roland:
    print(f'Fields in Boss but not Roland: {missing_in_roland}')

  if not missing_in_boss and not missing_in_roland:
    print('✅ Perfect field parity')
  "
  ```

- [ ] **Same Validation Rules**
  ```bash
  cd backend
  # Run validation on both brands
  pytest tests/integration/test_roland_boss_pipeline.py::TestDataQualityChecks -v
  ```

### Brand-Specific Testing

- [ ] **Roland-Specific Validation**

  ```bash
  python -c "
  from backend.core.validator import validate_catalog_file
  report = validate_catalog_file(Path('backend/data/catalogs/roland_catalog.json'))
  assert report.is_valid, 'Roland catalog failed validation'
  print(f'✅ Roland: {report.total_products} products, all valid')
  "
  ```

- [ ] **Boss-Specific Validation**
  ```bash
  python -c "
  from backend.core.validator import validate_catalog_file
  report = validate_catalog_file(Path('backend/data/catalogs/boss_catalog.json'))
  assert report.is_valid, 'Boss catalog failed validation'
  print(f'✅ Boss: {report.total_products} products, all valid')
  "
  ```

---

## ⚡ Performance Optimization

### Scraping Performance

- [ ] **Measure Scraping Duration**

  ```bash
  # Time the scraping process
  time python orchestrate_brand.py --brand roland --max-products 10
  # Note the real time for throughput calculation
  ```

- [ ] **Scraping Metrics**

  ```bash
  # Check scraper logs for metrics
  # Should see in output:
  # - Products scraped: X
  # - Total images: Y
  # - Total specifications: Z
  # - Average images per product: N
  ```

- [ ] **Parallel Processing Check**
  ```bash
  # Verify scraper uses async/concurrent processing
  grep -n "asyncio\|concurrent" backend/services/roland_scraper.py backend/services/boss_scraper.py
  # Should show async_playwright usage
  ```

### API Performance

- [ ] **Response Time Measurement**

  ```bash
  # Time API responses
  time curl http://localhost:8000/api/catalog/roland > /dev/null
  # Should be <1s for loaded catalogs

  time curl "http://localhost:8000/api/products/search?q=test" > /dev/null
  # Should be <100ms for search
  ```

- [ ] **Cache Verification**
  ```bash
  # First call loads, second should be instant
  curl http://localhost:8000/api/brands >/dev/null 2>&1
  time curl http://localhost:8000/api/brands > /dev/null
  # Second should be significantly faster
  ```

---

## 🛠️ Troubleshooting & Recovery

### Common Issues

#### Scraper Timeout

**Symptom:** "Timeout scraping <url> (45s limit)"

```bash
# Increase timeout in backend/core/config.py
# Or adjust wait_until strategy: 'domcontentloaded' vs 'networkidle'

# Check if page has heavy scripts
# Workaround: --no-sandbox, --disable-gpu flags already in use
```

#### Missing Images

**Symptom:** "missing_image_url warning"

```bash
# Verify image selectors are correct in brand_recipes.json
# Check if page loads images dynamically (requires waitForLoadState)

# Test selector manually:
python -c "
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
  browser = p.chromium.launch(headless=True)
  page = browser.new_page()
  page.goto('https://www.boss.info/us/products/me_80/')

  # Find all img tags
  imgs = page.locator('img').all()
  for img in imgs[:5]:
    src = img.get_attribute('src')
    print(f'{src}')
"
```

#### Validation Failures

**Symptom:** "Product has no categories" or "Invalid URL"

```bash
# Check individual product in catalog
python -c "
import json
with open('backend/data/catalogs/boss_catalog.json') as f:
  cat = json.load(f)

# Find products with issues
from backend.core.validator import ProductValidator
validator = ProductValidator()

for prod in cat['products'][:5]:
  is_valid, issues = validator.validate(prod, 'Boss')
  if not is_valid:
    print(f'{prod[\"id\"]}: {len(issues)} issues')
    for issue in issues:
      print(f'  - {issue.message}')
"
```

#### Data Not Syncing to Frontend

**Symptom:** Frontend shows old data

```bash
# Clear frontend cache
rm -rf frontend/public/data/catalogs_brand/*.json

# Re-run orchestrator with sync
cd backend
python orchestrate_brand.py --brand roland

# Check if sync happened
ls -la frontend/public/data/catalogs_brand/
```

### Recovery Procedures

#### Reset All Data

```bash
# Backup first
cp -r backend/data/catalogs backend/data/catalogs_backup_$(date +%s)

# Clean
rm backend/data/catalogs/*catalog*.json
rm frontend/public/data/catalogs_brand/*.json

# Re-scrape
cd backend
python orchestrate_brand.py --brand roland
python orchestrate_brand.py --brand boss
```

#### Test with Fresh Data

```bash
# Minimal test: Scrape 5 products only
cd backend
python orchestrate_brand.py --brand roland --max-products 5 --clean

# Validate
python -c "
from backend.core.validator import validate_catalog_file
report = validate_catalog_file('backend/data/catalogs/roland_catalog.json')
print(report.summary())
"
```

---

## 📈 Success Criteria

✅ **Pipeline is Production-Ready when:**

1. **Scraping**
   - [x] Roland scraper completes without errors
   - [x] Boss scraper completes without errors
   - [x] Metrics show success rate >95%

2. **Data Quality**
   - [x] All products pass validation (zero errors)
   - [x] <5% warnings acceptable
   - [x] All image URLs valid
   - [x] All categories assigned

3. **API**
   - [x] Catalog endpoints respond <1s
   - [x] Search endpoints respond <100ms
   - [x] RAG endpoints available (optional)

4. **Frontend**
   - [x] Both brands load correctly
   - [x] Product details display
   - [x] Search works across brands
   - [x] No console errors

5. **Tests**
   - [x] All unit tests pass
   - [x] All integration tests pass
   - [x] Validation tests pass

---

## 📝 Monitoring Checklist

Run this regularly:

```bash
#!/bin/bash
# backend-health-check.sh

echo "🔍 Backend Health Check"
echo "======================="

# Test catalogs exist and are valid
echo "📋 Checking catalogs..."
for brand in roland boss; do
  if [ -f "backend/data/catalogs/${brand}_catalog.json" ]; then
    count=$(python -c "import json; f=open('backend/data/catalogs/${brand}_catalog.json'); d=json.load(f); print(len(d['products']))")
    echo "✅ $brand: $count products"
  else
    echo "❌ $brand: catalog missing"
  fi
done

# Test API endpoints
echo ""
echo "🌐 Testing API..."
curl -s http://localhost:8000/health && echo "✅ Health check passed"
curl -s http://localhost:8000/api/brands | python -c "import json,sys; data=json.load(sys.stdin); print(f'✅ {len(data[\"brands\"])} brands available')"

# Test validation
echo ""
echo "✔️  All checks complete"
```

---

**Next Steps:**

1. Run through complete checklist
2. Address any failures
3. Run full integration tests
4. Deploy to production
5. Monitor with metrics

**Questions?** Review copilot-instructions.md for architecture details.
