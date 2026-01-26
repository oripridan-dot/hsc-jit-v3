## 📡 Section 8: Unified Ingestion Protocol - "Split-Scrape" Architecture

**CRITICAL: Strict Data Separation by Source**

The app uses a **Two-Source Data Model** to ensure data integrity and knowledge sovereignty:

### **Source A: Halilit (Commercial Data ONLY)**

- **What**: SKU, Price, Availability, Stock Status
- **Where**: halilit.com (verified retailer database)
- **How**: `HalilitBrandRegistry` + `HalilitDirectScraper`
- **Use in**: Product pricing, inventory management, commerce links

### **Source B: Brand Official Sites (Knowledge & Media ONLY)**

- **What**: Manuals (PDFs), High-res images, Technical specs, Documentation
- **Where**: Official brand domains (roland.com, moogmusic.com, nordinstruments.com, etc.)
- **How**: `OfficialBrandBase` scrapers + explicit domain validation
- **Use in**: Technical documentation, official media assets, deep specifications

### **The Synthesis Engine**

```
Halilit Data              Official Brand Data
(SKU, Price, Stock)  +    (Manuals, Images, Specs)
         ↓
   ProductBlueprint
   (Unified Schema)
         ↓
   GenesisBuilder
         ↓
frontend/public/data/*.json
```

### **ProductBlueprint Schema**

Every product flowing through the pipeline MUST conform to this schema:

```python
class ProductBlueprint(BaseModel):
    sku: str                           # From Halilit
    brand: str                          # Brand identifier
    model_name: str                     # Product model
    price: str                          # From Halilit
    availability: bool                  # From Halilit
    category: str                       # Consolidated UI category
    official_manuals: List[OfficialMedia]  # From brand site ONLY
    official_gallery: List[str]         # From brand site ONLY
    official_specs: Dict                # From brand site ONLY
    halilit_url: str                    # Source attribution
    id: str                             # Unique identifier
```

### **OfficialMedia Schema**

All documentation/media assets must follow this structure:

```typescript
interface OfficialMedia {
  url: string; // Direct URL (NO re-hosting)
  type: string; // 'pdf', 'image', 'video', 'specification'
  label: string; // Human-readable (e.g., "Operating Manual")
  source_domain: string; // e.g., "roland.com" (for attribution)
  extracted_at: string; // ISO timestamp
}
```

### **Implementation Files**

| File                                                    | Purpose                            | Status      |
| ------------------------------------------------------- | ---------------------------------- | ----------- |
| `backend/services/unified_ingestor.py`                  | Core pipeline + data models        | ✅ Active   |
| `backend/services/official_brand_base.py`               | Abstract base for brand scrapers   | ✅ Template |
| `backend/services/genesis_builder.py`                   | Updated to handle official_manuals | ✅ Updated  |
| `frontend/src/components/views/ProductPopInterface.tsx` | MediaBar UI component              | ✅ Enhanced |

### **How to Use in Scrapers**

Every brand scraper MUST inherit from `OfficialBrandBase`:

```python
from services.official_brand_base import OfficialBrandBase
from services.unified_ingestor import OfficialMedia

class RolandScraper(OfficialBrandBase):
    def __init__(self):
        super().__init__(
            brand_name="Roland",
            brand_domain="roland.com",
            base_url="https://roland.com"
        )

    def extract_manuals(self, model_name: str, sku: str = "") -> List[OfficialMedia]:
        """Extract PDFs from roland.com ONLY"""
        manuals = []
        # ... scraping logic ...
        return manuals

    def extract_official_gallery(self, model_name: str) -> List[str]:
        """Extract image URLs from roland.com ONLY"""
        return ["https://roland.com/assets/images/..."]

    def extract_specs(self, model_name: str) -> Dict:
        """Extract technical specifications from roland.com"""
        return {"polyphony": "128", "sounds": "1000+"}
```

### **How to Use in Frontend**

The `ProductPopInterface` now includes a `MediaBar` component for official resources:

```typescript
import { ProductPopInterface } from "./components/views/ProductPopInterface";

// ProductPopInterface automatically renders:
// - Official manuals as clickable PDFs (opens in new tab)
// - Official gallery as image previews
// - Source attribution for all assets
```

### **MediaBar UI Behavior**

The MediaBar displays:

1. **Manuals Tab**: PDF documents with download icon
   - Clicking opens in new tab (direct link, no proxy)
   - Shows document label and source domain
2. **Gallery Tab**: High-res images grid
   - Up to 4 images visible
   - Clicking opens full image in new tab

3. **Attribution**: Always shows "Content from official manufacturer"

### **Validation Rules**

**MANDATORY**: All blueprints must pass validation:

1. ✅ Must have `sku` and `model_name`
2. ✅ Must have `price` (from Halilit)
3. ✅ Should have at least 1 `official_manual` (if available)
4. ✅ Category must be one of the 8 UI categories
5. ✅ All URLs in `official_manuals` must be from official domains
6. ✅ No URLs should be proxied or re-hosted

### **Data Flow Checklist**

When implementing a new brand ingestion:

- [ ] Create scraper inheriting from `OfficialBrandBase`
- [ ] Implement `extract_manuals()` - PDFs from official site
- [ ] Implement `extract_official_gallery()` - Images from official site
- [ ] Implement `extract_specs()` - Tech specs from official site
- [ ] Fetch commercial data from Halilit via `HalilitBrandRegistry`
- [ ] Use `MassIngestProtocol.process_brand()` to merge sources
- [ ] Run `MassIngestProtocol.validate_blueprints()` to verify
- [ ] Export blueprints via `export_for_genesis()`
- [ ] Pass to `GenesisBuilder` for final JSON generation
- [ ] Verify `frontend/public/data/{brand}.json` contains `official_manuals` array

### **Error Handling**

If a brand scraper fails:

- `OfficialBrandBase.scrape_product()` returns empty lists (graceful degradation)
- Validation warns if no manuals/specs extracted, but doesn't fail
- Products are still built with Halilit data (commerce still works)
- MediaBar gracefully shows "No official resources available"

---

**Version:** 3.9.1 (Unified Ingestion Protocol)
**Last Updated:** January 2026
**Status:** Production-Ready with Split-Scrape Architecture
