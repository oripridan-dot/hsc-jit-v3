# Backend Implementation Examples - Full Circle Data Integration

## Overview

Code examples and patterns for the scraping pipeline to populate all new data fields in TheStage component.

---

## 🎥 Video Extraction Example

### Pattern 1: Playwright Video Detection

```python
# File: backend/services/roland_scraper.py

async def _extract_videos(self, page: Page, product_url: str) -> List[str]:
    """Extract video URLs from Roland product page"""
    videos = set()

    try:
        # 1. Extract YouTube/Vimeo embeds
        iframes = await page.locator('iframe').all()
        for iframe in iframes:
            src = await iframe.get_attribute('src') or ''
            if 'youtube' in src or 'vimeo' in src:
                videos.add(src)
                logger.info(f"✅ Found iframe video: {src[:50]}...")

        # 2. Extract native video tags
        video_srcs = await page.locator('video source').all()
        for src_elem in video_srcs:
            src = await src_elem.get_attribute('src')
            if src and src.endswith(('.mp4', '.webm', '.ogg')):
                videos.add(src)
                logger.info(f"✅ Found video tag: {src[:50]}...")

        # 3. Extract video links from page
        video_links = await page.locator(
            'a[href*="youtube.com"],'
            'a[href*="youtu.be"],'
            'a[href*="vimeo.com"],'
            'a[href*=".mp4"]'
        ).all()

        for link in video_links:
            href = await link.get_attribute('href')
            if href:
                videos.add(href)
                logger.info(f"✅ Found video link: {href[:50]}...")

        # 4. Look for data attributes
        media_elements = await page.locator('[data-video-url]').all()
        for elem in media_elements:
            video_url = await elem.get_attribute('data-video-url')
            if video_url:
                videos.add(video_url)

        logger.info(f"📹 Total videos found: {len(videos)}")
        return list(videos)

    except Exception as e:
        logger.warning(f"Error extracting videos: {e}")
        return []
```

### Pattern 2: Simple Regex for URLs

```python
import re

def extract_videos_from_html(html: str) -> List[str]:
    """Extract video URLs from HTML using regex"""
    videos = []

    # YouTube URLs
    youtube_pattern = r'(?:https?://)?(?:www\.)?(?:youtube\.com|youtu\.be)/[^\s<>"{}|\\^`\[\]]*'
    youtube_matches = re.findall(youtube_pattern, html)
    videos.extend(youtube_matches)

    # Vimeo URLs
    vimeo_pattern = r'https://(?:www\.)?vimeo\.com/\d+'
    vimeo_matches = re.findall(vimeo_pattern, html)
    videos.extend(vimeo_matches)

    # MP4/video files
    video_pattern = r'https?://[^\s<>"]*\.(?:mp4|webm|ogg)'
    video_matches = re.findall(video_pattern, html)
    videos.extend(video_matches)

    # iframe src attributes
    iframe_pattern = r'src="([^"]*(?:youtube|vimeo)[^"]*)"'
    iframe_matches = re.findall(iframe_pattern, html)
    videos.extend(iframe_matches)

    return list(set(videos))  # Deduplicate
```

---

## 📄 Manual & KB Extraction Example

### Pattern 1: PDF/Manual Discovery

```python
# File: backend/services/content_fetcher.py

async def extract_documentation(
    self,
    page: Page,
    product_url: str
) -> Dict[str, List[Dict]]:
    """Extract manuals and knowledge base articles"""

    docs = {
        'manuals': [],
        'knowledgebase': [],
        'resources': []
    }

    try:
        # 1. Find PDF downloads (manuals)
        pdf_selectors = [
            'a[href$=".pdf"]',
            'a[href*="manual"][href*=".pdf"]',
            'a[href*="guide"][href*=".pdf"]',
            'a[href*="documentation"][href*=".pdf"]',
            '[class*="download"] a[href*=".pdf"]',
            '[class*="resources"] a[href*=".pdf"]'
        ]

        for selector in pdf_selectors:
            try:
                pdf_links = await page.locator(selector).all()
                for link in pdf_links:
                    href = await link.get_attribute('href')
                    text = await link.inner_text()

                    if href and text.strip():
                        manual = {
                            'title': text.strip(),
                            'url': self._make_absolute_url(href, product_url),
                            'name': text.strip().lower().replace(' ', '_')
                        }

                        if manual not in docs['manuals']:
                            docs['manuals'].append(manual)
                            logger.info(f"📄 Found manual: {manual['title']}")
            except:
                continue

        # 2. Find knowledge base articles
        kb_selectors = [
            'a[href*="/kb/"]',
            'a[href*="/help/"]',
            'a[href*="/knowledge"]',
            'a[href*="/support/"]',
            'a[href*="/faq/"]',
            '[class*="knowledge"] a',
            '[class*="help-center"] a'
        ]

        for selector in kb_selectors:
            try:
                kb_links = await page.locator(selector).all()
                for link in kb_links:
                    href = await link.get_attribute('href')
                    text = await link.inner_text()

                    if href and text.strip() and 'pdf' not in href.lower():
                        kb = {
                            'title': text.strip(),
                            'url': self._make_absolute_url(href, product_url),
                            'category': self._infer_category(text)
                        }

                        if kb not in docs['knowledgebase']:
                            docs['knowledgebase'].append(kb)
                            logger.info(f"💡 Found KB: {kb['title']} ({kb['category']})")
            except:
                continue

        logger.info(f"📚 Extracted: {len(docs['manuals'])} manuals, "
                   f"{len(docs['knowledgebase'])} KB articles")

        return docs

    except Exception as e:
        logger.error(f"Error extracting documentation: {e}")
        return docs

def _infer_category(self, text: str) -> str:
    """Infer KB article category from title"""
    lower = text.lower()

    categories = {
        'Getting Started': ['setup', 'install', 'getting started', 'quickstart', 'quick start'],
        'Support': ['troubleshoot', 'error', 'problem', 'issue', 'fix', 'debug'],
        'Techniques': ['feature', 'guide', 'tutorial', 'how to', 'tips', 'advanced'],
        'Maintenance': ['clean', 'maintain', 'repair', 'service', 'care'],
        'FAQ': ['faq', 'frequently asked', 'q&a']
    }

    for category, keywords in categories.items():
        if any(kw in lower for kw in keywords):
            return category

    return 'Documentation'

def _make_absolute_url(self, url: str, base_url: str) -> str:
    """Convert relative URLs to absolute"""
    from urllib.parse import urljoin
    return urljoin(base_url, url)
```

### Pattern 2: Scrape Brand's Help Center

```python
async def scrape_help_center(self, brand_id: str, product_name: str) -> List[Dict]:
    """Scrape knowledge base from brand's help center"""

    help_center_urls = {
        'roland': 'https://www.roland.com/support/',
        'yamaha': 'https://www.yamaha.com/en/support/',
        'korg': 'https://www.korg.com/us/support/',
    }

    base_url = help_center_urls.get(brand_id.lower())
    if not base_url:
        return []

    kb_articles = []

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto(base_url)

            # Search for product-specific articles
            search_box = await page.locator('input[placeholder*="Search"]')
            if search_box:
                await search_box.fill(product_name)
                await search_box.press('Enter')
                await page.wait_for_load_state('networkidle')

            # Extract results
            results = await page.locator('[class*="result"]').all()
            for result in results:
                title = await result.locator('a').first.inner_text()
                href = await result.locator('a').first.get_attribute('href')

                if title and href:
                    kb_articles.append({
                        'title': title.strip(),
                        'url': href,
                        'category': 'Support'
                    })

        finally:
            await browser.close()

    return kb_articles
```

---

## 🔗 Halilit Integration Example

### Pattern 1: Match & Enrich Products

```python
# File: backend/services/halilit_matcher.py

from difflib import SequenceMatcher

class HalalitMatcher:
    def match_products(
        self,
        brand_products: List[Dict],
        halilit_products: List[Dict],
        min_threshold: float = 0.85
    ) -> List[Dict]:
        """Match brand products with Halilit catalog"""

        enriched = []

        for brand_prod in brand_products:
            best_match = None
            best_score = 0

            # Find best match in Halilit
            for halilit_prod in halilit_products:
                score = self._calculate_similarity(
                    brand_prod.get('name', ''),
                    halilit_prod.get('name', '')
                )

                if score > best_score:
                    best_score = score
                    best_match = halilit_prod

            # Add Halilit data to product
            if best_match and best_score >= min_threshold:
                brand_prod['halilit_data'] = {
                    'sku': best_match.get('sku'),
                    'price': best_match.get('price'),
                    'currency': best_match.get('currency', 'ILS'),
                    'availability': best_match.get('availability', 'Unknown'),
                    'match_quality': f"{int(best_score * 100)}%",
                    'source': 'PRIMARY',
                    'halilit_name': best_match.get('name')
                }
                logger.info(f"✅ PRIMARY: {brand_prod['name']} "
                           f"({int(best_score * 100)}% match)")
            else:
                brand_prod['halilit_data'] = {
                    'source': 'SECONDARY'
                }
                logger.info(f"📡 SECONDARY: {brand_prod['name']} (no match)")

            enriched.append(brand_prod)

        return enriched

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity (0-1)"""
        # Normalize strings
        s1 = str1.lower().strip()
        s2 = str2.lower().strip()

        # Exact match
        if s1 == s2:
            return 1.0

        # Use SequenceMatcher
        matcher = SequenceMatcher(None, s1, s2)
        return matcher.ratio()
```

### Pattern 2: Full Integration in Orchestrator

```python
# File: backend/services/orchestrator.py

async def orchestrate_brand(brand_id: str) -> Dict:
    """Complete pipeline: scrape → enrich → validate"""

    logger.info(f"🚀 Starting orchestration for {brand_id}")

    # Step 1: Scrape brand website
    logger.info("📝 Step 1: Scraping brand website...")
    brand_products = await self.brand_scraper.scrape(brand_id)
    logger.info(f"   ✅ Found {len(brand_products)} products")

    # Step 2: Extract rich media & documentation
    logger.info("📹 Step 2: Extracting videos, manuals, KB...")
    for product in brand_products:
        docs = await self.content_fetcher.extract_documentation(
            product.get('url'),
            product.get('name')
        )
        product['videos'] = docs.get('videos', [])
        product['manuals'] = docs.get('manuals', [])
        product['knowledgebase'] = docs.get('knowledgebase', [])
    logger.info(f"   ✅ Enriched products with media data")

    # Step 3: Match with Halilit
    logger.info("🔗 Step 3: Matching with Halilit catalog...")
    halilit_products = await self.halilit_api.get_products(brand_id)
    enriched_products = self.halilit_matcher.match_products(
        brand_products,
        halilit_products
    )
    logger.info(f"   ✅ Matched {len([p for p in enriched_products "
               f"if p['halilit_data'].get('source') == 'PRIMARY'])} "
               f"products to Halilit")

    # Step 4: Validate completeness
    logger.info("✅ Step 4: Validating data completeness...")
    stats = {
        'total': len(enriched_products),
        'with_videos': len([p for p in enriched_products if p.get('videos')]),
        'with_manuals': len([p for p in enriched_products if p.get('manuals')]),
        'with_kb': len([p for p in enriched_products if p.get('knowledgebase')]),
        'matched_halilit': len([p for p in enriched_products
                               if p['halilit_data'].get('source') == 'PRIMARY']),
    }

    logger.info(f"   📊 Statistics:")
    logger.info(f"      Videos: {stats['with_videos']}/{stats['total']} "
               f"({stats['with_videos']*100//stats['total']}%)")
    logger.info(f"      Manuals: {stats['with_manuals']}/{stats['total']} "
               f"({stats['with_manuals']*100//stats['total']}%)")
    logger.info(f"      KB: {stats['with_kb']}/{stats['total']} "
               f"({stats['with_kb']*100//stats['total']}%)")
    logger.info(f"      Halilit Match: {stats['matched_halilit']}/{stats['total']} "
               f"({stats['matched_halilit']*100//stats['total']}%)")

    # Step 5: Save to JSON
    logger.info("💾 Step 5: Saving to catalog JSON...")
    output_file = f"backend/data/catalogs/{brand_id}.json"
    with open(output_file, 'w') as f:
        json.dump({
            'brand_id': brand_id,
            'products': enriched_products,
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ Orchestration complete! Saved to {output_file}")
    return {'brand_id': brand_id, 'stats': stats, 'products': enriched_products}
```

---

## 🧪 Testing & Validation

### Validation Utility

```python
# File: backend/utils/product_validator.py

class ProductValidator:
    @staticmethod
    def validate_product(product: Dict) -> Tuple[bool, List[str]]:
        """Validate product has required fields"""
        errors = []

        # Required fields
        required_fields = ['id', 'name', 'brand', 'category']
        for field in required_fields:
            if not product.get(field):
                errors.append(f"Missing required field: {field}")

        # Recommended fields
        recommended = {
            'description': 'Product description helps with search',
            'images': 'At least one product image',
            'specifications': 'Product specifications for details',
            'videos': 'Product videos increase engagement',
            'manuals': 'User manuals for support',
            'knowledgebase': 'KB articles help users',
            'halilit_data': 'Pricing and inventory data'
        }

        warnings = []
        for field, reason in recommended.items():
            if not product.get(field):
                warnings.append(f"Missing {field}: {reason}")

        # Validate links
        for manual in product.get('manuals', []):
            if not ProductValidator._is_valid_url(manual.get('url')):
                errors.append(f"Invalid manual URL: {manual.get('url')}")

        for kb in product.get('knowledgebase', []):
            if not ProductValidator._is_valid_url(kb.get('url')):
                errors.append(f"Invalid KB URL: {kb.get('url')}")

        is_valid = len(errors) == 0
        return is_valid, errors + warnings

    @staticmethod
    def _is_valid_url(url: str) -> bool:
        """Check if URL is valid"""
        import re
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return bool(url_pattern.match(url)) if url else False
```

### Test Suite

```python
# File: tests/test_data_extraction.py

import pytest

@pytest.mark.asyncio
async def test_video_extraction():
    """Test video extraction from Roland products"""
    scraper = RolandScraper()
    videos = await scraper._extract_videos(page, "https://example.com")

    # Should find at least one video
    assert len(videos) > 0

    # All should be valid URLs
    for video in videos:
        assert video.startswith('http')

@pytest.mark.asyncio
async def test_documentation_extraction():
    """Test manual/KB extraction"""
    fetcher = ContentFetcher()
    docs = await fetcher.extract_documentation(page, "https://example.com")

    # Should have at least some documentation
    assert docs['manuals'] or docs['knowledgebase']

    # Validate structure
    for manual in docs['manuals']:
        assert 'title' in manual
        assert 'url' in manual

def test_halilit_matching():
    """Test Halilit product matching"""
    matcher = HalalitMatcher()
    brand_products = [
        {'name': 'TR-808 Rhythm Composer', 'id': 'tr808'}
    ]
    halilit_products = [
        {'name': 'TR-808', 'sku': 'RD-TR808', 'price': 1999}
    ]

    result = matcher.match_products(brand_products, halilit_products)

    assert result[0]['halilit_data']['source'] == 'PRIMARY'
    assert result[0]['halilit_data']['sku'] == 'RD-TR808'
    assert result[0]['halilit_data']['price'] == 1999
```

---

## 📋 Implementation Checklist

- [ ] Clone video extraction to all brand scrapers
- [ ] Update manual/KB extraction for all brands
- [ ] Implement Halilit matching logic
- [ ] Add product validation
- [ ] Create test suite
- [ ] Document new fields in API spec
- [ ] Deploy scraper updates
- [ ] Monitor data quality metrics
- [ ] Get feedback from frontend team
- [ ] Iterate based on real data

---

**Ready to implement**: Copy these patterns into your scrapers and matcher!
