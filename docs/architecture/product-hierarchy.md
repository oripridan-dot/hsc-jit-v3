# HSC-JIT v3.7 - Product Hierarchy System

# ========================================

**Complete product relationship management with JIT RAG**

## 🎯 What's New in v3.7

### Product Hierarchy System

1. **Product Core** - Main product with all data
2. **Bound Accessories** - Must-have accessories (cables, cases, stands)
3. **Related Products** - Complementary items (subwoofers, pedals, etc.)

### JIT RAG System

- Official documentation snippet extraction
- Semantic search with embeddings
- AI-powered insights generation
- Context-aware responses

### Fresh Start

- All old data backed up to `data/backup_*`
- Clean slate with new architecture
- Optimized for scalability

---

## 🚀 Quick Start (Single Brand)

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements-v3.7.txt

# Install Playwright browsers
playwright install chromium
```

### 2. Run Pipeline for One Brand

```bash
# Basic scraping (no RAG)
python orchestrate_brand.py --brand roland --max-products 50

# With RAG processing
python orchestrate_brand.py --brand roland --with-rag --max-products 50
```

### 3. View Results

```bash
# Check generated catalog
cat data/catalogs/roland_catalog.json | head -200

# Check analytics
cat data/system_analytics.json
```

---

## 📁 New Directory Structure

```
backend/
├── models/
│   └── product_hierarchy.py          # Complete data models
├── services/
│   ├── hierarchy_scraper.py          # Intelligent scraper
│   ├── jit_rag.py                    # RAG system
│   └── maintenance.py                # Automated maintenance
├── orchestrate_brand.py              # Main pipeline script
└── data/
    ├── catalogs/                     # Final unified catalogs
    ├── catalogs_brand/               # Raw brand scrapes
    ├── catalogs_halilit/             # Halilit pricing data
    ├── manuals/                      # Downloaded PDFs
    ├── rag_embeddings/               # Vector embeddings
    ├── backup_YYYYMMDD_HHMMSS/       # Backup of old data
    ├── system_analytics.json         # System metrics
    └── maintenance_log.json          # Maintenance history
```

---

## 🏗️ Architecture

### Data Flow

```
1. Brand Configuration (JSON contract)
   ↓
2. Hierarchy Scraper
   - Scrapes brand website
   - Classifies products (main vs accessories)
   - Maps relationships
   ↓
3. Halilit Matcher
   - Matches with local distributor
   - Adds pricing & SKUs
   ↓
4. RAG Processor (optional)
   - Downloads manuals
   - Extracts chunks
   - Generates embeddings
   ↓
5. Final Catalog
   - Complete product hierarchy
   - RAG-ready documentation
   - Optimized for frontend
```

### Product Relationships

```python
ProductCore
├── id: "roland-td-17kvx"
├── name: "TD-17KVX V-Drums"
├── main_category: "electronic_drums"
├── accessories: [
│   {
│     relationship_type: "accessory",
│     target_product_id: "roland-dap-3x",
│     target_product_name: "DAP-3X Accessory Package",
│     is_required: false,
│     priority: 0
│   }
│ ]
└── related_products: [
    {
      relationship_type: "related",
      target_product_id: "roland-pm-100",
      target_product_name: "PM-100 Monitor",
      description: "Recommended monitor for electronic drums"
    }
  ]
```

---

## 🎨 Key Features

### 1. Intelligent Accessory Detection

The scraper automatically identifies accessories based on:

- **Keywords**: cable, case, bag, stand, pedal, etc.
- **Product name patterns**: "TD-17 Stand" matches "TD-17KVX"
- **Category relationships**: Drum accessories for drum kits

### 2. Related Product Suggestions

Smart recommendations based on:

- **Category matching**: Keyboards → Sustain pedals
- **Use case**: Drum kits → Extra cymbals
- **Brand ecosystem**: Roland products work together

### 3. RAG Documentation Processing

```python
# Each manual becomes searchable snippets
DocumentationSnippet
├── id: "roland-td-17kvx-snippet-0001"
├── content: "To connect MIDI devices..."
├── page_number: 15
├── section: "MIDI Setup"
├── embedding_vector: [0.123, -0.456, ...]  # 384-dim
└── relevance_keywords: ["MIDI", "USB", "Connect"]
```

### 4. AI Insights Generation

```python
# RAG generates contextual answers
RAGResponse
├── answer: "Based on the manual, connect MIDI via..."
├── sources: [snippet_1, snippet_2, snippet_3]
├── ai_insights: [
│   {
│     insight_type: "usage_tip",
│     content: "Pro tip: Use USB for lower latency",
│     confidence: 0.85
│   }
│ ]
└── suggested_accessories: ["roland-um-one-mk2"]
```

---

## 🔧 Maintenance & Optimization

### Run Automated Maintenance

```bash
cd backend
python services/maintenance.py
```

**Tasks performed:**

1. ✅ Check data freshness (flag stale brands)
2. ✅ Optimize embeddings (remove duplicates)
3. ✅ Clean orphaned files
4. ✅ Generate system analytics

### Schedule Automatic Updates

```bash
# Add to crontab for weekly updates
0 2 * * 0 cd /path/to/backend && python services/maintenance.py
```

---

## 📊 Monitoring & Analytics

### View System Status

```bash
# Quick overview
cat data/system_analytics.json | jq '.totals'

# Output:
# {
#   "brands": 1,
#   "products": 50,
#   "with_pricing": 35,
#   "with_rag": 20,
#   "with_accessories": 45,
#   "documentation_snippets": 2450
# }
```

### Check Brand Coverage

```bash
cat data/catalogs/roland_catalog.json | jq '.coverage_stats'

# Output:
# {
#   "total_products": 50,
#   "with_images": 50,
#   "with_pricing": 35,
#   "with_manuals": 25,
#   "with_rag": 20,
#   "with_accessories": 45,
#   "with_related": 30
# }
```

---

## 🧪 Testing

### Test Individual Components

```bash
# Test scraper
cd backend
python services/hierarchy_scraper.py

# Test RAG system
python services/jit_rag.py

# Test maintenance
python services/maintenance.py
```

### Validate Catalog Structure

```bash
# Check if catalog follows new schema
python -c "
from models.product_hierarchy import ProductCatalog
import json

with open('data/catalogs/roland_catalog.json') as f:
    data = json.load(f)
    catalog = ProductCatalog(**data)
    print(f'✅ Valid catalog: {catalog.total_products} products')
"
```

---

## 🎯 Next Steps

### For Single Brand (Roland)

1. **Scrape & Build**

   ```bash
   python orchestrate_brand.py --brand roland --max-products 100
   ```

2. **Add RAG (if manuals available)**

   ```bash
   # Place manuals in data/manuals/
   # Then run:
   python orchestrate_brand.py --brand roland --with-rag
   ```

3. **Integrate with Frontend**
   ```bash
   # Catalog is auto-saved to frontend/public/data/
   cd frontend
   pnpm dev
   # Visit http://localhost:5173
   ```

### For Multiple Brands

```bash
# Create a batch script
for brand in roland boss yamaha; do
  echo "Processing $brand..."
  python orchestrate_brand.py --brand $brand --max-products 100
done
```

---

## 🔑 Key Files

| File                            | Purpose               |
| ------------------------------- | --------------------- |
| `models/product_hierarchy.py`   | Complete data models  |
| `services/hierarchy_scraper.py` | Intelligent scraper   |
| `services/jit_rag.py`           | RAG system            |
| `orchestrate_brand.py`          | Main pipeline         |
| `services/maintenance.py`       | Automated maintenance |
| `data/catalogs/*.json`          | Final catalogs        |
| `data/system_analytics.json`    | System metrics        |

---

## 💡 Pro Tips

1. **Start Small**: Test with `--max-products 10` first
2. **Manual Collection**: Download PDFs manually for better RAG
3. **Incremental Updates**: Run maintenance weekly
4. **Monitor Freshness**: Check `system_analytics.json` regularly
5. **Backup Strategy**: Old data is in `backup_*` directories

---

## 🐛 Troubleshooting

### Scraping Issues

```bash
# Check if website is accessible
curl -I https://www.roland.com/global/products/

# Try with lower max-products
python orchestrate_brand.py --brand roland --max-products 10
```

### RAG Issues

```bash
# Check if sentence-transformers is installed
python -c "from sentence_transformers import SentenceTransformer; print('✅ OK')"

# Check if manuals exist
ls -lh data/manuals/
```

### Missing Dependencies

```bash
# Reinstall everything
pip install -r requirements-v3.7.txt
playwright install chromium
```

---

## 📈 Expected Results (Roland Example)

After running the pipeline:

```
✅ Roland Pipeline Complete
   Duration: 145.2s
   Products: 50
   With accessories: 45
   With pricing: 35
   RAG snippets: 2,450
```

**Data Generated:**

- `roland_catalog.json` (2.1 MB)
- 20 product manuals processed
- 2,450 documentation snippets
- 45 products with accessory relationships
- 30 products with related product suggestions

---

## 🚀 Production Deployment

### Static Build

```bash
# Generate static frontend
cd frontend
pnpm build

# Deploy to Netlify/Vercel
# Catalogs are in public/data/*.json
```

### Keep Data Fresh

```bash
# Weekly cron job
0 2 * * 0 python orchestrate_brand.py --brand roland --with-rag
```

---

## 📞 Support

For issues or questions:

1. Check `data/maintenance_log.json` for errors
2. Review `system_analytics.json` for coverage
3. Inspect individual catalog files

---

**Version**: 3.7.0  
**Date**: January 16, 2026  
**Status**: ✅ Ready for Production
