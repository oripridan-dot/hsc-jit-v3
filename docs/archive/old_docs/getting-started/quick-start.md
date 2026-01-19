# 🚀 HSC-JIT v3.7 - Quick Reference

## Data Source Policy

**Primary Source: Brand Official Website** ✅

- ALL product data (name, description, specs, features, images, manuals)

**Secondary Source: Halilit** (ONLY for):

1. 💳 SKU number
2. 💰 Prices (3 types): regular, Eilat tax-free, crossed discount
3. 🖼️ Images (fallback only - since they're official brand images)

See [Data Source Policy](../operations/data-policy.md) for details.

---

## One-Command Setup

```bash
# 1. Navigate to backend
cd /workspaces/hsc-jit-v3/backend

# 2. Test the system (validates everything works)
python test_hierarchy.py

# 3. Run for one brand (Roland)
python orchestrate_brand.py --brand roland --max-products 50
```

---

## What You Get

### Product Hierarchy

```json
{
  "id": "roland-td-17kvx",
  "name": "TD-17KVX V-Drums", // ← From brand official
  "description": "Premium electronic...", // ← From brand official
  "category": "electronic_drums", // ← From brand official
  "sku": "ROLAND-TD17KVX-IL", // ← From Halilit
  "pricing": {
    // ← From Halilit
    "regular_price": 8500.0, // Black - official
    "eilat_price": 7225.0, // Red - tax-free
    "sale_price": 9500.0 // Grey crossed - before discount
  },
  "accessories": [
    {
      "name": "DAP-3X Accessory Package",
      "type": "accessory",
      "is_required": false
    }
  ],
  "related_products": [
    {
      "name": "PM-200 Monitor",
      "type": "related",
      "description": "Goes well with this drum kit"
    }
  ]
}
```

### JIT RAG (Optional)

```bash
# Enable RAG for documentation search
python orchestrate_brand.py --brand roland --with-rag
```

---

## Key Files

| File                            | What It Does                |
| ------------------------------- | --------------------------- |
| `test_hierarchy.py`             | ✅ Tests system (run first) |
| `orchestrate_brand.py`          | 🚀 Main pipeline            |
| `models/product_hierarchy.py`   | 📋 Data models              |
| `services/hierarchy_scraper.py` | 🔍 Scraper                  |
| `services/jit_rag.py`           | 🤖 RAG system               |
| `services/maintenance.py`       | 🔧 Maintenance              |

---

## Output Structure

```
data/
├── catalogs/
│   └── roland_catalog.json          ← Final catalog
├── catalogs_brand/
│   └── roland_brand.json            ← Raw scrape
├── rag_embeddings/
│   └── roland-*_embeddings.json     ← RAG data
├── system_analytics.json            ← Metrics
└── backup_20260116_*/               ← Old data
```

---

## Quick Commands

```bash
# Test system
python test_hierarchy.py

# Run pipeline (basic)
python orchestrate_brand.py --brand roland --max-products 50

# Run pipeline (with RAG)
python orchestrate_brand.py --brand roland --with-rag --max-products 100

# Run maintenance
python services/maintenance.py

# View analytics
cat data/system_analytics.json

# View catalog
cat data/catalogs/roland_catalog.json | head -200
```

---

## Status Check

```bash
# All tasks completed ✅
✅ Product hierarchy models
✅ Intelligent scraper
✅ JIT RAG system
✅ Complete pipeline
✅ Maintenance system
✅ Test suite
✅ Documentation
✅ Fresh database

# Test passed ✅
✅ Catalog generated: roland_catalog_test.json
✅ Product with 2 accessories, 2 related products
✅ JSON structure validated
```

---

## Next Action

**Run the full pipeline for Roland:**

```bash
cd /workspaces/hsc-jit-v3/backend
python orchestrate_brand.py --brand roland --max-products 50
```

This will:

1. Scrape Roland website
2. Detect accessories & related products
3. Match with Halilit pricing
4. Generate final catalog
5. Save to `data/catalogs/roland_catalog.json`

---

## Documentation

- **Data Policy**: [Data Source Policy](../operations/data-policy.md) ⭐ **READ FIRST**
- **Architecture Guide**: [Product Hierarchy](../architecture/product-hierarchy.md)
- **Implementation Status**: [Implementation Overview](v3.7-overview.md)

---

**v3.7.0** | **Jan 16, 2026** | **Ready for Production** ✅
