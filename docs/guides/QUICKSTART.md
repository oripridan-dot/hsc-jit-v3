# 🚦 Quick Start: HSC JIT v3.1

## ✅ What's Ready

All upgrades are complete and tested:
- ✅ Backend rich context system
- ✅ Frontend hyperlink navigation
- ✅ Sample Roland catalog with relationships
- ✅ Brand identity support
- ✅ Guardian validation

## 🎬 Start the System

### Option 1: VS Code Tasks (Recommended)
```
Press: Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows)
Type: "Tasks: Run Task"
Select: "backend: dev"

Then repeat for: "frontend: dev"
```

### Option 2: Manual Terminals
```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend  
cd frontend
pnpm dev
```

## 🧪 Test It

1. **Open**: http://localhost:5173
2. **Type**: "Roland TD" in the search bar
3. **See**: Product prediction with brand logo
4. **Press Enter**: To lock and query
5. **Check Bottom**: ContextRail with 5 related items
6. **Click**: Any related item to navigate (hyperlink)

## 📊 Verify Backend

```bash
cd backend
python3 -c "
from app.services.catalog import CatalogService
c = CatalogService()
result = c.get_product_with_context('roland-td17kvx')
print(f\"Product: {result['product']['name']}\")
print(f\"Brand: {result['brand']['name']}\")
print(f\"Related: {len(result['context']['related_items'])} items\")
"
```

Expected output:
```
Product: Roland TD-17KVX Gen 2
Brand: Roland Corporation
Related: 5 items
```

## 📝 Next: Add More Catalogs

### 1. Update an Existing Catalog

Edit any `brand_catalogs/*_catalog.json` file to add relationships:

```json
{
  "brand_identity": {
    "id": "yamaha",
    "name": "Yamaha Corporation",
    "hq": "Hamamatsu, Japan 🇯🇵",
    "founded": 1887,
    "website": "https://www.yamaha.com",
    "logo_url": "https://...",
    "description": "..."
  },
  "products": [
    {
      "id": "yamaha-dtx6",
      "name": "Yamaha DTX6",
      "relationships": [
        { "type": "related", "target_id": "roland-td17kvx", "label": "Competitor" }
      ]
    }
  ]
}
```

### 2. Validate the Catalog

```bash
cd backend
python scripts/guardian.py
```

### 3. Restart Backend

The catalog will auto-reload if using `--reload` flag.

## 🎯 Architecture Summary

```
User types "Roland" 
  ↓
Frontend sends: { type: "typing", content: "Roland" }
  ↓
Backend fuzzy matches → "roland-td17kvx"
  ↓
CatalogService.get_product_with_context()
  ↓
Returns: { product, brand, context: { related_items: [...] } }
  ↓
Frontend renders:
  - GhostCard (product preview)
  - ContextRail (related items)
  - BrandCard (on click)
```

## 🐛 Troubleshooting

### Backend won't start
```bash
cd backend
pip install -r requirements.txt
```

### Frontend errors
```bash
cd frontend
pnpm install
```

### No products showing
Check that `backend/data/catalogs/` has JSON files with the new schema.

### Related items not showing
Verify the `relationships` array in your product has valid `target_id` values that exist in the catalog.

## 📚 Key Files

| File | Purpose |
|------|---------|
| [`backend/app/services/catalog.py`](backend/app/services/catalog.py) | Product + relationship resolver |
| [`backend/app/main.py`](backend/app/main.py) | WebSocket handler |
| [`backend/data/catalogs/`](backend/data/catalogs/) | JSON product data |
| [`frontend/src/components/ContextRail.tsx`](frontend/src/components/ContextRail.tsx) | Related items UI |
| [`frontend/src/store/useWebSocketStore.ts`](frontend/src/store/useWebSocketStore.ts) | State management |

## 🎉 Done!

You now have a fully functional JIT Technical Support System with:
- Zero-latency predictions
- Rich product context
- Hyperlink navigation
- Brand awareness
- Declarative data model

**The system is ready for production data.**
