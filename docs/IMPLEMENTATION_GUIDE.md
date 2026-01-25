# Unified Ingestion Protocol - Implementation Guide

## Overview

The **Unified Ingestion Protocol** implements a "Split-Scrape" architecture that strictly separates data sources:

- **Source A (Halilit)**: Commercial data only (SKU, Price, Availability)
- **Source B (Brand Official Sites)**: Knowledge & Media only (Manuals, Images, Technical Specs)
- **Synthesis**: Merge both sources into unified `ProductBlueprint` objects
- **Output**: Static JSON files in `frontend/public/data/` with embedded official media

---

## Core Components Implemented

### 1. ✅ `backend/services/unified_ingestor.py`

**Purpose**: Core pipeline orchestrator and data models

**Key Classes**:

- `OfficialMedia` - Schema for documentation/media assets
- `ProductBlueprint` - Unified product data structure
- `MassIngestProtocol` - Main orchestrator for Split-Scrape pipeline

**Key Methods**:

```python
# Process a brand with split-scrape logic
blueprints = ingestor.process_brand(
    brand_name="Roland",
    halilit_data=commercial_data,  # From Halilit
    official_scraper=roland_scraper  # Official brand scraper
)

# Validate all blueprints before passing to Genesis
valid, invalid = ingestor.validate_blueprints()

# Export for consumption by GenesisBuilder
ingestor.export_for_genesis(output_file="backend/data/vault/unified_blueprints.json")
```

**Data Models**:

```python
class OfficialMedia(BaseModel):
    url: str                  # Direct link to asset
    type: str                 # 'pdf', 'image', 'video', 'specification'
    label: str                # Human-readable label
    source_domain: str        # e.g., "roland.com"
    extracted_at: str         # ISO timestamp

class ProductBlueprint(BaseModel):
    sku: str                  # From Halilit
    brand: str                # Brand identifier
    model_name: str           # Product model
    price: str                # From Halilit
    availability: bool        # From Halilit
    category: str             # Consolidated UI category
    official_manuals: List[OfficialMedia]  # From brand site ONLY
    official_gallery: List[str]  # From brand site ONLY
    official_specs: Dict      # From brand site ONLY
    halilit_url: str          # Source attribution
    id: str                   # Unique identifier
```

---

### 2. ✅ `backend/services/official_brand_base.py`

**Purpose**: Abstract base class that all brand scrapers must implement

**Usage**:

```python
from services.official_brand_base import OfficialBrandBase

class RolandScraper(OfficialBrandBase):
    def __init__(self):
        super().__init__(
            brand_name="Roland",
            brand_domain="roland.com",
            base_url="https://roland.com"
        )

    def extract_manuals(self, model_name: str, sku: str = "") -> List[OfficialMedia]:
        """Extract PDF manuals from roland.com ONLY"""
        # Implementation here
        pass

    def extract_official_gallery(self, model_name: str, sku: str = "") -> List[str]:
        """Extract high-res images from roland.com ONLY"""
        # Implementation here
        pass

    def extract_specs(self, model_name: str, sku: str = "") -> Dict:
        """Extract technical specifications from roland.com"""
        # Implementation here
        pass
```

**Key Features**:

- Forces domain validation (only official URLs allowed)
- Provides helper methods (`_create_official_media()`, `extract_from_html()`)
- Handles session setup with proper headers
- Graceful error handling with fallback empty lists

---

### 3. ✅ `backend/services/genesis_builder.py` (Updated)

**Changes Made**:

- Added `official_manuals` field to product entries
- Added `official_gallery` field to media section
- Added `official_specs` field to specs section

**Updated Code**:

```python
# In _update_catalog_index()
product_entry = {
    "id": safe_id,
    "name": item['name'],
    # ... existing fields ...

    # NEW: Official Media Assets (From brand official sites)
    "official_manuals": item.get('official_manuals', []),
    "official_gallery": item.get('official_gallery', []),
}

# In _build_node()
product_data = {
    # ... existing fields ...

    "media": {
        "thumbnail": public_url,
        "gallery": item.get('official_gallery', []),  # From official brand site
        "videos": []
    },

    # NEW: Official Media for MediaBar UI
    "official_manuals": item.get('official_manuals', []),
    "official_specs": item.get('official_specs', {}),
}
```

---

### 4. ✅ `frontend/src/components/views/ProductPopInterface.tsx` (Enhanced)

**New Features**:

#### A. Enhanced ProductPopInterface

- 3-column layout (Info | Details | MediaBar)
- Tabbed navigation for organization
- Product metadata display
- Better error states

#### B. New MediaBar Component

The `MediaBar` component displays official resources:

```typescript
interface MediaBarProps {
  manuals: OfficialMedia[];
  gallery: string[];
  productId: string;
}

const MediaBar = ({ manuals, gallery, productId }: MediaBarProps) => {
  // Tabs: Manuals | Gallery
  // - Manuals: Clickable PDFs with source attribution
  // - Gallery: Grid of images (up to 4 visible)
  // - Attribution: "Content from official manufacturer"
};
```

**UI Behaviors**:

- ✅ Click manual → Opens PDF in new tab (direct link, no proxy)
- ✅ Click gallery image → Opens full image in new tab
- ✅ Shows source domain for each asset
- ✅ Graceful fallback: "No official resources available"

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INGESTION PIPELINE                        │
└─────────────────────────────────────────────────────────────┘

1. HALILIT SCRAPER              2. OFFICIAL BRAND SCRAPERS
   (Commercial Data)              (Knowledge & Media)
   ↓                              ↓
   SKU, Price, Stock              Manuals, Gallery, Specs
   ↓                              ↓
   ┌──────────────────────────────────────────────────────┐
   │    MassIngestProtocol.process_brand()                │
   │    (Merge Sources)                                    │
   │                                                        │
   │    For each product:                                  │
   │    1. Start with Halilit data (authoritative)        │
   │    2. Enrich with Official brand data                │
   │    3. Create ProductBlueprint                         │
   └──────────────────────────────────────────────────────┘
   ↓
   ProductBlueprint[] (Unified Schema)
   ↓
   ┌──────────────────────────────────────────────────────┐
   │    MassIngestProtocol.validate_blueprints()          │
   │                                                        │
   │    Checks:                                            │
   │    ✓ Has SKU & model_name                            │
   │    ✓ Has price (from Halilit)                        │
   │    ✓ Category is valid (one of 8 UI categories)      │
   │    ✓ All URLs are official domain                    │
   └──────────────────────────────────────────────────────┘
   ↓
   ┌──────────────────────────────────────────────────────┐
   │    GenesisBuilder                                     │
   │    (Build Static JSON)                               │
   │                                                        │
   │    For each blueprint:                               │
   │    1. Create product JSON with official_manuals      │
   │    2. Store gallery URLs (no download needed)        │
   │    3. Embed official_specs for future use            │
   └──────────────────────────────────────────────────────┘
   ↓
   ┌──────────────────────────────────────────────────────┐
   │    frontend/public/data/*.json                        │
   │                                                        │
   │    Contains:                                          │
   │    - SKU, Price (from Halilit)                       │
   │    - Manuals, Gallery, Specs (from official sites)   │
   │    - Category (consolidated)                         │
   └──────────────────────────────────────────────────────┘
   ↓
   ┌──────────────────────────────────────────────────────┐
   │    Frontend (React)                                   │
   │                                                        │
   │    ProductPopInterface + MediaBar                     │
   │    - Loads data from public/data/                    │
   │    - Renders official_manuals as PDF buttons         │
   │    - Renders official_gallery as image grid          │
   │    - Shows source attribution                        │
   └──────────────────────────────────────────────────────┘
```

---

## How to Implement for a New Brand

### Step 1: Create the Official Brand Scraper

```python
# backend/services/yourband_scraper.py

from services.official_brand_base import OfficialBrandBase
from services.unified_ingestor import OfficialMedia
from typing import List, Dict

class YourBrandScraper(OfficialBrandBase):
    def __init__(self):
        super().__init__(
            brand_name="YourBrand",
            brand_domain="yourbrand.com",
            base_url="https://yourbrand.com"
        )

    def extract_manuals(self, model_name: str, sku: str = "") -> List[OfficialMedia]:
        """
        Extract PDF manuals from official site.

        Steps:
        1. Build product URL from model_name
        2. Fetch page
        3. Parse downloads section
        4. Extract PDF links
        5. Create OfficialMedia objects
        """
        manuals = []

        try:
            # Example: Build product URL
            product_url = f"{self.base_url}/products/{model_name.lower()}"
            response = self.session.get(product_url)

            if response.status_code == 200:
                # Use helper to extract PDFs
                pdf_urls = self.extract_from_html(
                    response.text,
                    'a[href*=".pdf"]'  # CSS selector for PDF links
                )

                for pdf_url in pdf_urls:
                    # Create OfficialMedia object
                    manual = self._create_official_media(
                        url=pdf_url,
                        media_type="pdf",
                        label="Product Manual"  # Customize based on parsing
                    )
                    manuals.append(manual)

        except Exception as e:
            print(f"Error extracting manuals: {e}")

        return manuals

    def extract_official_gallery(self, model_name: str, sku: str = "") -> List[str]:
        """Extract high-res images from official site."""
        gallery = []

        try:
            # Similar to extract_manuals but for images
            product_url = f"{self.base_url}/products/{model_name.lower()}"
            response = self.session.get(product_url)

            if response.status_code == 200:
                # Extract image URLs
                img_urls = self.extract_from_html(
                    response.text,
                    'img.product-gallery'  # CSS selector for gallery images
                )

                # Filter for high-res versions
                gallery = [url.replace('_thumb', '_full') for url in img_urls]

        except Exception as e:
            print(f"Error extracting gallery: {e}")

        return gallery

    def extract_specs(self, model_name: str, sku: str = "") -> Dict:
        """Extract technical specifications."""
        specs = {}

        try:
            product_url = f"{self.base_url}/products/{model_name.lower()}"
            response = self.session.get(product_url)

            if response.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(response.text, 'html.parser')

                # Parse specs table
                spec_rows = soup.select('table.specs tr')
                for row in spec_rows:
                    cells = row.find_all('td')
                    if len(cells) == 2:
                        key = cells[0].get_text().strip()
                        value = cells[1].get_text().strip()
                        specs[key.lower()] = value

        except Exception as e:
            print(f"Error extracting specs: {e}")

        return specs
```

### Step 2: Integrate with MassIngestProtocol

```python
# backend/your_brand_pipeline.py

from services.unified_ingestor import MassIngestProtocol
from services.yourband_scraper import YourBrandScraper
from services.halilit_client import HalilitBrandRegistry

# Step 1: Initialize ingestor
ingestor = MassIngestProtocol()

# Step 2: Get commercial data from Halilit
registry = HalilitBrandRegistry()
halilit_data = registry.get_brand_products("yourband")

# Step 3: Create brand scraper
scraper = YourBrandScraper()

# Step 4: Process brand (split-scrape)
blueprints = ingestor.process_brand(
    brand_name="YourBrand",
    halilit_data=halilit_data,
    official_scraper=scraper
)

# Step 5: Validate
valid, invalid = ingestor.validate_blueprints()
if invalid > 0:
    print(f"⚠️  {invalid} blueprints failed validation")

# Step 6: Export for Genesis
ingestor.export_for_genesis()

# Step 7: Pass to GenesisBuilder
from services.genesis_builder import GenesisBuilder
builder = GenesisBuilder("yourband")
builder.construct()

print("✨ Brand ingestion complete!")
```

### Step 3: Update GenesisBuilder Configuration (if needed)

The GenesisBuilder is already configured to handle `official_manuals`, `official_gallery`, and `official_specs`. No changes needed.

---

## File Structure Summary

```
backend/
├── services/
│   ├── unified_ingestor.py              ← NEW: Core pipeline
│   ├── official_brand_base.py           ← NEW: Abstract base class
│   ├── genesis_builder.py               ← UPDATED: Handles official media
│   ├── roland_scraper.py                ← Should inherit from OfficialBrandBase
│   ├── moog_scraper.py                  ← Should inherit from OfficialBrandBase
│   └── ... (other scrapers)

frontend/
├── src/
│   └── components/
│       └── views/
│           └── ProductPopInterface.tsx  ← UPDATED: Enhanced with MediaBar
└── public/
    └── data/
        ├── roland.json                  ← Contains official_manuals array
        ├── moog.json                    ← Contains official_manuals array
        └── ...

docs/
├── UNIFIED_INGESTION_PROTOCOL.md        ← NEW: This documentation
└── context/
    └── ... (context files for AI)
```

---

## Testing & Validation

### Test the Pipeline Locally

```bash
# From /workspaces/hsc-jit-v3/backend

# 1. Test individual scraper
python3 -c "
from services.yourband_scraper import YourBrandScraper
scraper = YourBrandScraper()
manuals = scraper.extract_manuals('PRODUCT_MODEL')
print(f'Found {len(manuals)} manuals')
for manual in manuals:
    print(f'  - {manual.label}: {manual.url}')
"

# 2. Run unified pipeline
python3 -c "
from services.unified_ingestor import MassIngestProtocol
from services.yourband_scraper import YourBrandScraper

ingestor = MassIngestProtocol()
# ... run pipeline ...
blueprints = ingestor.blueprints
print(f'Created {len(blueprints)} blueprints')
for bp in blueprints[:3]:
    print(f'  - {bp.model_name}: {len(bp.official_manuals)} manuals')
"

# 3. Check output JSON
python3 -c "
import json
with open('data/vault/blueprints/yourband_blueprints.json') as f:
    data = json.load(f)
    print(json.dumps(data[0], indent=2))  # First product
"
```

### Validate MediaBar in Frontend

```bash
# From /workspaces/hsc-jit-v3/frontend

# The ProductPopInterface should render:
# 1. Manuals Tab: Clickable PDF links
# 2. Gallery Tab: Image grid
# 3. Attribution: "Content from official manufacturer"

# Manual test:
# 1. Run `pnpm dev`
# 2. Click on a product
# 3. Look for PDF buttons and image gallery
# 4. Click PDF → should open in new tab
# 5. Click image → should open full image
```

---

## Key Principles

### 🔒 Data Sovereignty

- **Halilit owns commercial data** (Price, SKU, Stock)
- **Brands own knowledge** (Manuals, Specs, Images)
- **No mixing or re-hosting**

### 🎯 Source Attribution

Every asset includes:

- Direct URL to original source
- Source domain (e.g., "roland.com")
- Timestamp of extraction
- Asset type (pdf, image, etc.)

### ✅ Validation

Before reaching frontend:

- All URLs must be from official domains
- All required fields must be present
- Category must be consolidated
- Graceful fallback if data missing

### 🚀 Performance

- Static JSON files (no runtime API calls)
- Media URLs are direct links (no proxy)
- PDFs open in browser tabs (native experience)

---

## Troubleshooting

### "No official resources available"

**Cause**: `official_manuals` or `official_gallery` arrays are empty

**Solution**:

1. Check scraper implementation (does it reach the official site?)
2. Check CSS selectors (are they correct for the brand site?)
3. Check domain validation (is URL from official domain?)
4. Run scraper directly to debug: `python3 -c "from services.yourband_scraper import YourBrandScraper; ..."`

### Product missing from frontend

**Cause**: Blueprint validation failed

**Solution**:

1. Check validation errors in console output
2. Verify `sku` and `model_name` are present
3. Verify `category` is one of 8 UI categories
4. Check that `official_manuals` URLs are from official domains

### PDF not opening

**Cause**: URL is invalid or proxied

**Solution**:

1. Test URL in browser: Is it a valid PDF?
2. Check that URL starts with `https://` (not `/uploads/`)
3. Verify URL is from official brand domain
4. Check `source_domain` field matches URL

---

## Next Steps

1. **Update existing scrapers** to inherit from `OfficialBrandBase`
2. **Implement extraction methods** for each brand's official site
3. **Test with one brand** to verify pipeline works end-to-end
4. **Roll out to all brands** using same pattern
5. **Monitor** MediaBar UI to ensure PDFs open correctly

---

**Version**: 1.0
**Status**: ✅ Ready for implementation
**Last Updated**: January 2026
