# Scraper Data Requirements - Full Circle Implementation

## Overview

To achieve "full circle" implementation with complete data integration, the scraping pipeline must extract and populate all fields required by the enhanced product display component.

---

## 📋 Required Data Fields

### Phase 1: Core Product Data (Already Implemented)

```json
{
  "id": "brand-product-name",
  "brand": "Brand Name",
  "name": "Product Name",
  "category": "Product Category",
  "short_description": "Brief description",
  "description": "Full product description",
  "image_url": "https://...",
  "images": [...],
  "specifications": [...]
}
```

### Phase 2: Enhanced Media (NEW - Must Add)

```json
{
  "videos": [
    "https://www.youtube.com/watch?v=...",
    "https://vimeo.com/...",
    "https://brand.com/product.mp4"
  ]
}
```

**Scraping Strategy**:

- Look for video embeds in product pages (`<iframe>`, `<video>`)
- Check for video links in galleries or multimedia sections
- Extract from brand's video hosting (YouTube, Vimeo, etc.)
- Priority: Demo videos → Product reviews → Tutorial videos

**CSS Selectors to Try**:

```javascript
[
  'iframe[src*="youtube"]',
  'iframe[src*="vimeo"]',
  "video source",
  'a[href*="youtube.com"]',
  'a[href*="vimeo.com"]',
  'a[href*=".mp4"]',
  'a[href*=".webm"]',
  '[class*="video"] iframe',
  "[data-video-url]",
];
```

### Phase 3: Documentation (NEW - Must Add)

```json
{
  "manuals": [
    {
      "title": "User Manual - EN",
      "name": "user_manual.pdf",
      "url": "https://brand.com/manuals/product.pdf"
    },
    {
      "title": "Quick Start Guide",
      "url": "https://brand.com/guides/quick-start.pdf"
    }
  ]
}
```

**Scraping Strategy**:

- Look for "Download" sections on product pages
- Find links with PDF/documentation keywords
- Check for resource/support centers
- Extract manual URLs for indexing

**CSS Selectors**:

```javascript
[
  'a[href$=".pdf"]',
  'a[href*="manual"]',
  'a[href*="guide"]',
  'a[href*="documentation"]',
  'a[href*="download"]',
  '[class*="download"] a',
  '[class*="manual"] a',
  '[class*="resources"] a[href*=".pdf"]',
];
```

### Phase 4: Knowledge Base (NEW - Must Add)

```json
{
  "knowledgebase": [
    {
      "title": "How to set up product",
      "url": "https://brand.com/kb/setup",
      "category": "Getting Started"
    },
    {
      "title": "Troubleshooting guide",
      "url": "https://brand.com/kb/troubleshooting",
      "category": "Support"
    },
    {
      "title": "Advanced features",
      "url": "https://brand.com/kb/features",
      "category": "Techniques"
    }
  ]
}
```

**Scraping Strategy**:

- Parse brand's knowledge base/FAQ sections
- Extract help center articles
- Link KB articles to specific products
- Categorize by topic (Setup, Troubleshooting, Features, etc.)

**Common KB Patterns**:

```
/kb/product-name/...
/help/product-name/...
/support/articles/product...
/faq/product...
/knowledge-base/product...
```

### Phase 5: Resources (NEW - Must Add)

```json
{
  "resources": [
    {
      "title": "Official Product Page",
      "url": "https://brand.com/products/item",
      "icon": "🌐"
    },
    {
      "title": "Video Tutorials",
      "url": "https://brand.com/tutorials/product",
      "icon": "▶️"
    },
    {
      "title": "Community Forum",
      "url": "https://forum.brand.com/product",
      "icon": "💬"
    }
  ]
}
```

**Resource Types**:

- Official product page
- Tutorial/Demo videos
- Community forums
- Support contact
- Accessories/add-ons page
- Comparison with similar products

### Phase 6: Halilit Integration (Backend Match)

```json
{
  "halilit_data": {
    "sku": "RD-AIRA-01",
    "price": 4999,
    "currency": "ILS",
    "availability": "In Stock",
    "match_quality": "92%",
    "source": "PRIMARY",
    "halilit_name": "Roland AIRA Compact"
  }
}
```

**Matcher Logic**:

1. Fuzzy match brand product with Halilit item (85%+ threshold)
2. If match found:
   - Extract SKU and price from Halilit
   - Set source = "PRIMARY"
   - Calculate match quality
3. If no match but product from brand site:
   - Set source = "SECONDARY"
   - Leave SKU/price empty
4. If only in Halilit:
   - Set source = "HALILIT_ONLY"

---

## 🔄 Scraper Implementation Roadmap

### Step 1: Video Extraction (High Priority)

**File**: `backend/services/roland_scraper.py` (and all brand scrapers)

```python
async def _extract_videos(self, page: Page, url: str) -> List[str]:
    """Extract video URLs from product page"""
    videos = []

    # Try iframe embeds
    iframes = await page.locator('iframe').all()
    for iframe in iframes:
        src = await iframe.get_attribute('src')
        if src and ('youtube' in src or 'vimeo' in src):
            videos.append(src)

    # Try video tags
    video_srcs = await page.locator('video source').all()
    for src in video_srcs:
        url = await src.get_attribute('src')
        if url:
            videos.append(url)

    # Try download/media links
    links = await page.locator('a[href*="video"], a[href*="watch"]').all()
    for link in links:
        href = await link.get_attribute('href')
        if href and any(x in href for x in ['youtube.com', 'youtu.be', 'vimeo.com']):
            videos.append(href)

    return list(set(videos))  # Deduplicate
```

### Step 2: Manual/KB Extraction (High Priority)

**File**: `backend/services/content_fetcher.py`

```python
async def extract_documentation(self, page: Page, product_url: str) -> dict:
    """Extract manuals and knowledge base links"""
    docs = {
        'manuals': [],
        'knowledgebase': [],
        'resources': []
    }

    # Extract PDF links (manuals)
    pdf_links = await page.locator('a[href$=".pdf"]').all()
    for link in pdf_links:
        href = await link.get_attribute('href')
        text = await link.inner_text()
        if href and text:
            docs['manuals'].append({
                'title': text.strip(),
                'url': href.strip()
            })

    # Extract KB links
    kb_links = await page.locator('a[href*="kb"], a[href*="knowledge"], a[href*="help"]').all()
    for link in kb_links:
        href = await link.get_attribute('href')
        text = await link.inner_text()
        if href and text:
            docs['knowledgebase'].append({
                'title': text.strip(),
                'url': href.strip(),
                'category': self._infer_category(text)
            })

    return docs

def _infer_category(self, text: str) -> str:
    """Infer KB category from title"""
    lower = text.lower()
    if any(x in lower for x in ['setup', 'install', 'getting started']):
        return 'Getting Started'
    elif any(x in lower for x in ['trouble', 'error', 'problem']):
        return 'Support'
    elif any(x in lower for x in ['feature', 'guide', 'tutorial']):
        return 'Techniques'
    else:
        return 'Documentation'
```

### Step 3: Halilit Matching (Backend Integration)

**File**: `backend/services/dual_source_merger.py`

```python
def enrich_with_halilit(self, brand_product: dict, halilit_match: dict) -> dict:
    """Add Halilit data to brand product"""

    if not halilit_match:
        brand_product['halilit_data'] = {
            'source': 'SECONDARY'
        }
        return brand_product

    # Calculate match quality
    match_score = self._calculate_similarity(
        brand_product.get('name', ''),
        halilit_match.get('name', '')
    )

    brand_product['halilit_data'] = {
        'sku': halilit_match.get('sku'),
        'price': halilit_match.get('price'),
        'currency': halilit_match.get('currency', 'ILS'),
        'availability': halilit_match.get('availability', 'Unknown'),
        'match_quality': f"{match_score}%",
        'source': 'PRIMARY' if match_score >= 85 else 'SECONDARY',
        'halilit_name': halilit_match.get('name')
    }

    return brand_product
```

### Step 4: Output Validation

**File**: `backend/utils/product_validator.py`

```python
def validate_complete_product(product: dict) -> dict:
    """Validate product has all required fields"""
    required = ['id', 'name', 'brand', 'category']
    optional_new = ['videos', 'manuals', 'knowledgebase', 'resources', 'halilit_data']

    # Check required
    for field in required:
        if not product.get(field):
            raise ValueError(f"Missing required field: {field}")

    # Initialize optional fields if missing
    for field in optional_new:
        if field not in product:
            product[field] = [] if field != 'halilit_data' else {}

    return product
```

---

## 📊 Data Collection Checklist

### For Each Brand Scraper

- [ ] **Videos**: Extract from product pages (YouTube, Vimeo, demo videos)
- [ ] **Manuals**: Find PDF downloads, user guides, quick start guides
- [ ] **Knowledge Base**: Link to brand's help center, FAQ, tutorials
- [ ] **Resources**: Product page, video tutorials, support links
- [ ] **Validation**: All fields populated, no empty arrays for required sections

### Example - Roland Scraper

```
Product: TR-808
✅ Videos:
   - https://youtube.com/watch?v=... (Demo)
   - https://youtube.com/watch?v=... (Review)

✅ Manuals:
   - User Manual PDF
   - Quick Start Guide

✅ Knowledge Base:
   - How to use TR-808
   - Sound Design Tips
   - Troubleshooting

✅ Resources:
   - Official product page
   - Video tutorials
   - Community forum links

✅ Halilit Data:
   - SKU: RD-TR808
   - Price: 1,999 ILS
   - Match Quality: 98%
```

---

## 🎯 Priority Order

1. **Phase 2 (Videos)** - CRITICAL: High value, visible UI
2. **Phase 3 (Manuals)** - CRITICAL: Essential documentation
3. **Phase 4 (Knowledge Base)** - IMPORTANT: Support information
4. **Phase 5 (Resources)** - NICE-TO-HAVE: Enhancement
5. **Phase 6 (Halilit)** - CRITICAL: Pricing & inventory

---

## 📈 Success Metrics

### Data Completeness

- ✅ 100% of products have descriptions
- ✅ 90%+ have at least one video
- ✅ 85%+ have manuals
- ✅ 80%+ have KB articles
- ✅ 95%+ matched with Halilit

### Frontend Display

- ✅ No broken video embeds
- ✅ No 404 links in manuals/KB
- ✅ Proper source attribution
- ✅ Fast page load (< 3s)

---

## 🔗 Related Files

- **Frontend**: `/workspaces/hsc-jit-v3/frontend/src/components/TheStage.tsx`
- **Documentation**: `/workspaces/hsc-jit-v3/docs/PRODUCT_DISPLAY_ENHANCEMENT.md`
- **Scrapers**: `/workspaces/hsc-jit-v3/backend/services/roland_scraper.py`
- **Matcher**: `/workspaces/hsc-jit-v3/backend/services/dual_source_merger.py`

---

**Status**: Ready for implementation  
**Priority**: Phase 2 & 3 first (Videos + Manuals)  
**Timeline**: 2-3 weeks for full implementation
