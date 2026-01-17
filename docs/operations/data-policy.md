# Data Source Policy - v3.7

## Primary Source: Brand Official Website

**ALL product data comes from brand official sources:**

✅ Product name  
✅ Description  
✅ Specifications  
✅ Features  
✅ Categories  
✅ Documentation  
✅ Manuals  
✅ Official product images  
✅ Product relationships (accessories, related items)  
✅ Technical details

**Source**: Brand's official website and documentation

---

## Secondary Source: Halilit (Limited Use)

**Halilit is used ONLY for the following 3 items:**

### 1. SKU Number

```json
{
  "sku": "42-ROLAND-TD17KVX-IL",
  "halilit_brand_code": "42"
}
```

- Halilit's internal SKU/item code
- First 2 digits = Brand's number in Halilit's system (e.g., "42" = Roland)
- Used for inventory tracking and brand identification

### 2. Pricing (3 Types)

```json
{
  "pricing": {
    "regular_price": 8500.0, // Black - Official price (ILS)
    "eilat_price": 7225.0, // Red - Tax-free Eilat price (ILS)
    "sale_price": 9500.0 // Grey crossed - Original price before discount
  }
}
```

**Price Types:**

- **Regular Price (Black)**: Current official price in Israel
- **Eilat Price (Red)**: Tax-free price for Eilat region
- **Sale Price (Grey Crossed)**: Original price before discount (if applicable)

### 3. Images (Fallback Only)

```json
{
  "images": [
    {
      "url": "https://halilit.co.il/.../product.jpg",
      "type": "main",
      "alt_text": "Product name - Official"
    }
  ]
}
```

**Image Policy:**

- Prefer brand official images
- Use Halilit images ONLY if brand images unavailable
- Halilit images are approved since they're official brand images provided by manufacturers

---

## Implementation

### In Scraper

```python
# Step 1: Scrape brand website (PRIMARY)
product = {
    'name': 'TD-17KVX',           # From brand
    'description': '...',          # From brand
    'specs': {...},               # From brand
    'images': [...],              # From brand
    'category': 'Drums',          # From brand
}

# Step 2: Enrich with Halilit (SKU & pricing ONLY)
product.sku = halilit_match['item_code']
product.pricing = {
    'regular_price': halilit_match['price'],
    'eilat_price': halilit_match['eilat_price'],
    'sale_price': halilit_match['original_price']
}
```

### Data Source Tracking

```json
{
  "id": "roland-td-17kvx",
  "name": "TD-17KVX V-Drums",
  "description": "Premium electronic drum kit...",
  "data_sources": [
    "brand_official", // Primary source
    "halilit" // Secondary (SKU & pricing only)
  ],
  "source_details": {
    "product_data": "brand_official",
    "pricing": "halilit",
    "sku": "halilit",
    "images": "brand_official"
  }
}
```

---

## Rationale

### Why Brand First?

1. **Accuracy**: Brand data is authoritative
2. **Completeness**: Full specs, features, documentation
3. **Consistency**: Standardized across brands
4. **Quality**: Professional descriptions and images

### Why Halilit for Pricing?

1. **Local Market**: Israeli pricing (ILS)
2. **Tax Context**: Eilat tax-free pricing
3. **Discounts**: Sale tracking
4. **Availability**: Local stock information

### Why Halilit for SKU?

1. **Inventory**: Internal tracking
2. **Integration**: Backend systems
3. **Order Management**: E-commerce

---

## Validation Rules

### During Scraping

```python
# ✅ Valid: Brand data takes priority
product.name = brand_scrape['name']  # Not Halilit name

# ✅ Valid: Add Halilit pricing
product.pricing = halilit_match['pricing']

# ❌ Invalid: Don't override brand data
product.description = halilit_match['description']  # NO!

# ✅ Valid: Add Halilit SKU
product.sku = halilit_match['item_code']
```

### Quality Checks

```python
# Ensure brand data is never overwritten
assert product.name == brand_name
assert product.description == brand_description
assert product.specs == brand_specs

# Ensure Halilit data is properly added
assert product.sku == halilit_sku
assert product.pricing.regular_price == halilit_price
```

---

## Example Product

```json
{
  "id": "roland-td-17kvx",
  "brand": "roland",

  // ====== FROM BRAND OFFICIAL SITE ======
  "name": "TD-17KVX V-Drums Electronic Drum Kit",
  "description": "Premium electronic drum kit with mesh heads...",
  "features": [
    "Full mesh heads for realistic feel",
    "TD-17 sound module with 310 sounds",
    "USB audio/MIDI connectivity"
  ],
  "specifications": [
    {
      "category": "audio",
      "key": "Sounds",
      "value": "310",
      "source": "brand_official"
    }
  ],
  "images": [
    {
      "url": "https://static.roland.com/.../td-17kvx.jpg",
      "type": "main"
    }
  ],
  "brand_product_url": "https://www.roland.com/global/products/td-17kvx/",
  "manual_urls": ["https://www.roland.com/.../td-17kvx_manual.pdf"],

  // ====== FROM HALILIT (SKU & PRICING ONLY) ======
  "sku": "ROLAND-TD17KVX-IL",
  "pricing": {
    "currency": "ILS",
    "regular_price": 8500.0,
    "eilat_price": 7225.0,
    "sale_price": 9500.0
  },

  // ====== SOURCE TRACKING ======
  "data_sources": ["brand_official", "halilit"],
  "source_details": {
    "content": "brand_official",
    "pricing": "halilit",
    "sku": "halilit"
  }
}
```

---

## Pipeline Flow

```
1. Scrape Brand Website (PRIMARY)
   ↓
   Get: Name, Description, Specs, Images, Manuals, etc.

2. Match with Halilit (SKU & Pricing)
   ↓
   Add: SKU, Regular Price, Eilat Price, Sale Price

3. Validate
   ↓
   Ensure: Brand data not overwritten

4. Output Final Catalog
   ↓
   Result: Brand data + Halilit pricing
```

---

## Summary

| Data Type             | Source            | Reason               |
| --------------------- | ----------------- | -------------------- |
| Name                  | Brand Official ✅ | Authoritative        |
| Description           | Brand Official ✅ | Complete             |
| Specs                 | Brand Official ✅ | Accurate             |
| Features              | Brand Official ✅ | Detailed             |
| Images                | Brand Official ✅ | High quality         |
| Manuals               | Brand Official ✅ | Official docs        |
| Categories            | Brand Official ✅ | Proper taxonomy      |
| **SKU**               | **Halilit** 📦    | Local inventory      |
| **Pricing**           | **Halilit** 💰    | Local market         |
| **Images (Fallback)** | **Halilit** 🖼️    | If brand unavailable |

---

**Policy Version**: 3.7.0  
**Last Updated**: January 16, 2026  
**Status**: ✅ Enforced in Code
