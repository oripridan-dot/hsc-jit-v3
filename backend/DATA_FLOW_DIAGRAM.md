# Data Flow Architecture - v3.7

## Visual Data Source Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BRAND OFFICIAL WEBSITE                    │
│                      (PRIMARY SOURCE)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ SCRAPE ALL PRODUCT DATA
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │        Product Core Data             │
        │                                      │
        │  ✅ Name: "TD-17KVX V-Drums"        │
        │  ✅ Description: "Premium..."        │
        │  ✅ Specs: { ... }                  │
        │  ✅ Features: [ ... ]               │
        │  ✅ Images: [ ... ]                 │
        │  ✅ Manuals: [ ... ]                │
        │  ✅ Category: "electronic_drums"    │
        │  ✅ Brand URL: "https://..."        │
        └──────────────────┬───────────────────┘
                           │
                           │ MATCH BY NAME/MODEL
                           │
        ┌──────────────────▼───────────────────┐
        │         HALILIT CATALOG              │
        │       (SECONDARY SOURCE)             │
        │                                      │
        │  ADD ONLY:                          │
        │  💳 SKU: "ROLAND-TD17KVX-IL"        │
        │  💰 Prices:                         │
        │     • Regular: ₪8,500 (black)       │
        │     • Eilat: ₪7,225 (red)           │
        │     • Sale: ₪9,500 (crossed)        │
        │  🖼️ Images: (if brand missing)      │
        └──────────────────┬───────────────────┘
                           │
                           │ MERGE (PRESERVE BRAND DATA)
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │       FINAL UNIFIED PRODUCT          │
        │                                      │
        │  FROM BRAND (PRIMARY):               │
        │  ✅ name                             │
        │  ✅ description                      │
        │  ✅ specs                            │
        │  ✅ features                         │
        │  ✅ images                           │
        │  ✅ manuals                          │
        │  ✅ category                         │
        │  ✅ accessories                      │
        │  ✅ related_products                 │
        │                                      │
        │  FROM HALILIT (SECONDARY):          │
        │  💳 sku                              │
        │  💰 pricing (3 types)                │
        │  🖼️ images (fallback)                │
        │                                      │
        │  data_sources: [                    │
        │    "brand_official",                │
        │    "halilit"                        │
        │  ]                                  │
        └──────────────────┬───────────────────┘
                           │
                           │ SAVE TO CATALOG
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │      frontend/public/data/           │
        │       roland_catalog.json            │
        │                                      │
        │  Ready for instant static loading    │
        │  <50ms search with Fuse.js          │
        └──────────────────────────────────────┘
```

---

## Pipeline Stages

### Stage 1: Brand Official Scraping

```python
# From: https://www.roland.com/global/products/
result = {
    'name': 'TD-17KVX V-Drums',           # ✅ Keep
    'description': 'Premium kit...',       # ✅ Keep
    'specs': {                            # ✅ Keep
        'sounds': '310',
        'pads': 'mesh heads'
    },
    'features': [                         # ✅ Keep
        'USB connectivity',
        'Bluetooth audio'
    ],
    'images': [                           # ✅ Keep
        'https://static.roland.com/...'
    ],
    'manual_url': 'https://...',          # ✅ Keep
    'category': 'electronic_drums',       # ✅ Keep
}
```

### Stage 2: Halilit Matching

```python
# From: https://halilit.co.il/product/...
# ONLY extract:
halilit_data = {
    'item_code': 'ROLAND-TD17KVX-IL',     # 💳 Add SKU
    'price': 8500.00,                      # 💰 Add regular price
    'eilat_price': 7225.00,                # 💰 Add Eilat price
    'original_price': 9500.00,             # 💰 Add sale price
    'image_url': 'https://...',            # 🖼️ Fallback only
}

# ❌ IGNORE (don't use from Halilit):
# - name (use brand name)
# - description (use brand description)
# - specs (use brand specs)
```

### Stage 3: Merge (Brand Priority)

```python
final_product = {
    # Brand data (PRIMARY - never override)
    **brand_scrape,

    # Halilit data (SECONDARY - add only)
    'sku': halilit_data['item_code'],
    'pricing': {
        'regular_price': halilit_data['price'],
        'eilat_price': halilit_data['eilat_price'],
        'sale_price': halilit_data['original_price']
    },

    # Source tracking
    'data_sources': ['brand_official', 'halilit'],
    'source_details': {
        'content': 'brand_official',
        'pricing': 'halilit',
        'sku': 'halilit'
    }
}
```

---

## Code Implementation

### In hierarchy_scraper.py

```python
def _build_product_core(self, brand_id, product_raw, accessories):
    """
    Build product from BRAND OFFICIAL DATA only
    Halilit data added later in orchestrator
    """
    return ProductCore(
        # ALL from brand official
        id=f"{brand_id}-{slug}",
        brand=brand_id,
        name=product_raw['name'],              # Brand
        description=product_raw['description'], # Brand
        images=[...],                          # Brand
        features=[...],                        # Brand

        # Halilit fields initialized as None
        sku=None,                              # Added later
        pricing=None,                          # Added later

        data_sources=[SourceType.BRAND_OFFICIAL]
    )
```

### In orchestrate_brand.py

```python
async def _enrich_catalog(self, catalog, halilit_matches):
    """
    Add ONLY SKU and pricing from Halilit
    NEVER override brand official data
    """
    for product in catalog.products:
        if product.id in halilit_matches:
            match = halilit_matches[product.id]

            # 1. Add SKU (Halilit only)
            product.sku = match['item_code']

            # 2. Add Pricing (Halilit only)
            product.pricing = PriceInfo(
                regular_price=match['price'],
                eilat_price=match['eilat_price'],
                sale_price=match['original_price']
            )

            # 3. Add image ONLY if brand image missing
            if not product.images and match.get('image_url'):
                product.images.append(
                    ProductImage(url=match['image_url'])
                )

            # Mark Halilit as secondary source
            product.data_sources.append(SourceType.HALILIT)

    # Validation: Ensure brand data not overwritten
    assert all(SourceType.BRAND_OFFICIAL in p.data_sources
               for p in catalog.products)

    return catalog
```

---

## Validation Rules

### ✅ Valid Operations

```python
# Add Halilit SKU
product.sku = halilit['item_code']

# Add Halilit pricing
product.pricing = PriceInfo(
    regular_price=halilit['price'],
    eilat_price=halilit['eilat_price'],
    sale_price=halilit['original_price']
)

# Add Halilit image as fallback
if not product.images:
    product.images.append(halilit_image)
```

### ❌ Invalid Operations

```python
# DON'T override brand name
product.name = halilit['name']  # ❌ NO!

# DON'T override brand description
product.description = halilit['description']  # ❌ NO!

# DON'T override brand specs
product.specs = halilit['specs']  # ❌ NO!

# DON'T replace brand images
product.images = [halilit_image]  # ❌ NO!
```

---

## Example: Full Product Flow

### Input: Brand Website

```json
{
  "name": "TD-17KVX V-Drums Electronic Drum Kit",
  "description": "Premium electronic drum kit with mesh heads and superior sound engine featuring 310 sounds, USB connectivity, and Bluetooth audio streaming.",
  "specs": {
    "sounds": "310",
    "pads": "Mesh heads",
    "connectivity": "USB, MIDI, Bluetooth"
  },
  "features": [
    "Full mesh heads for realistic feel",
    "TD-17 sound module with 310 sounds",
    "USB audio/MIDI connectivity",
    "Bluetooth audio streaming"
  ],
  "images": ["https://static.roland.com/.../td-17kvx.jpg"],
  "manual_url": "https://www.roland.com/.../manual.pdf",
  "category": "Electronic Drums"
}
```

### Input: Halilit

```json
{
  "item_code": "ROLAND-TD17KVX-IL",
  "price": 8500.0,
  "eilat_price": 7225.0,
  "original_price": 9500.0,
  "image_url": "https://halilit.co.il/.../td17kvx.jpg"
}
```

### Output: Final Product

```json
{
  "id": "roland-td-17kvx",
  "brand": "roland",

  // ===== FROM BRAND (PRIMARY) =====
  "name": "TD-17KVX V-Drums Electronic Drum Kit",
  "description": "Premium electronic drum kit with mesh heads...",
  "specs": {
    "sounds": "310",
    "pads": "Mesh heads",
    "connectivity": "USB, MIDI, Bluetooth"
  },
  "features": [
    "Full mesh heads for realistic feel",
    "TD-17 sound module with 310 sounds",
    "USB audio/MIDI connectivity",
    "Bluetooth audio streaming"
  ],
  "images": [
    {
      "url": "https://static.roland.com/.../td-17kvx.jpg",
      "type": "main",
      "source": "brand_official"
    }
  ],
  "manual_urls": ["https://www.roland.com/.../manual.pdf"],
  "category": "Electronic Drums",
  "brand_product_url": "https://www.roland.com/global/products/td-17kvx/",

  // ===== FROM HALILIT (SECONDARY) =====
  "sku": "ROLAND-TD17KVX-IL",
  "pricing": {
    "currency": "ILS",
    "regular_price": 8500.0,
    "eilat_price": 7225.0,
    "sale_price": 9500.0
  },
  "distributor_url": "https://halilit.co.il/product/...",

  // ===== SOURCE TRACKING =====
  "data_sources": ["brand_official", "halilit"],
  "source_details": {
    "content": "brand_official",
    "pricing": "halilit",
    "sku": "halilit",
    "images": "brand_official"
  }
}
```

---

## Summary

| Field          | Source     | Why                  |
| -------------- | ---------- | -------------------- |
| Name           | Brand ✅   | Authoritative        |
| Description    | Brand ✅   | Complete & accurate  |
| Specs          | Brand ✅   | Technical authority  |
| Features       | Brand ✅   | Official features    |
| Images         | Brand ✅   | High quality         |
| Manuals        | Brand ✅   | Official docs        |
| Category       | Brand ✅   | Proper taxonomy      |
| SKU            | Halilit 💳 | Local inventory code |
| Regular Price  | Halilit 💰 | Israeli market       |
| Eilat Price    | Halilit 💰 | Tax-free region      |
| Sale Price     | Halilit 💰 | Discount tracking    |
| Image Fallback | Halilit 🖼️ | If brand missing     |

**Policy**: Brand official data is NEVER overwritten by Halilit data.

---

**Architecture Version**: 3.7.0  
**Last Updated**: January 16, 2026  
**Status**: ✅ Implemented & Enforced
