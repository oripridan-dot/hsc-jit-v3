# Backend Pipeline Alignment Plan v3.7

## 🎯 Naming Conventions & Standards

### Route Naming

- **Format**: `/api/{resource}/{id}/{action}`
- **Case**: lowercase with hyphens
- **Prefix**: All API routes start with `/api/v1/` for versioning
- **Examples**:
  - `/api/v1/brands` - list all brands
  - `/api/v1/brands/{brand_id}` - get specific brand
  - `/api/v1/brands/{brand_id}/products` - list products for brand
  - `/api/v1/brands/{brand_id}/products/{product_id}` - get specific product
  - `/api/v1/search?q={query}` - search products
  - `/api/v1/rag/query` - RAG query endpoint

### Data Model Alignment

- **ProductCore**: Main product data model (required fields: id, name, brand, main_category)
- **ProductCatalog**: Collection of ProductCore objects for a brand
- **BrandIdentity**: Brand metadata (id, name, website, description, categories, logo_url)
- **ValidationIssue**: Data quality issues (level, scope, category, message)
- **ValidationReport**: Summary of validation for a catalog

### Scraper Data Model Alignment

- **RolandScraper**: Produces ProductCore objects with:
  - `id`: slug format (e.g., "roland-aerophone_brisa")
  - `name`: product name with model info
  - `brand`: "Roland"
  - `main_category`: inferred from page structure
  - `description`: from product page
  - `images`: list of ProductImage objects (url, type, alt_text)
- **BossScraper**: Must match Roland structure exactly
  - Same field names and types
  - Same image extraction logic
  - Same category inference
  - Same validation expectations

### API Response Format

```json
{
  "status": "success|error",
  "data": {...},
  "meta": {
    "version": "3.7.0",
    "timestamp": "2026-01-19T...",
    "request_id": "uuid"
  }
}
```

### CORS Configuration

- **Development**: Allow all (`*`)
- **Production**: Specific origins only
- **Methods**: GET, POST, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credentials**: true if needed

## 📋 Pipeline Stages

### Stage 1: Scraping ✅

- RolandScraper: Working
- BossScraper: Needs data model alignment
- Output: ProductCatalog object

### Stage 2: Validation ✅

- ProductValidator: Checks individual products
- CatalogValidator: Checks complete catalog
- Output: ValidationReport

### Stage 3: Filtering (MISSING)

- Remove invalid products
- Filter invalid images
- Normalize data

### Stage 4: Publishing

- Save to JSON files
- Update frontend data directory
- Cache in memory

### Stage 5: API Serving

- FastAPI endpoints
- Proper response wrapping
- Error handling

### Stage 6: RAG Integration

- Embeddings generation
- Document indexing
- Query answering

## 🔍 Required Fixes

1. **BossScraper** - Ensure it returns same structure as Roland
2. **Data Filter** - Remove invalid products/images before publishing
3. **API Endpoints** - Wrap all responses consistently
4. **Error Handling** - Proper error codes and messages
5. **RAG API** - Integrate with validation pipeline
