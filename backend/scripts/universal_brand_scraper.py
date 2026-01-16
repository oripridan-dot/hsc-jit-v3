#!/usr/bin/env python3
"""
UNIVERSAL BRAND SCRAPER (OG-TAG BASED)
Iterates through links on a landing page and scrapes Open Graph metadata from child pages.
This avoids the need for specific CSS selectors for product listings.
"""

import asyncio
import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Set, Optional
from urllib.parse import urljoin, urlparse

try:
    from playwright.async_api import async_playwright, Page
except ImportError:
    async_playwright = None

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Config for brands to scrape
BRANDS_TO_SCRAPE = {
    "roland": "https://www.roland.com/us/products/",
    "boss": "https://www.boss.info/us/products/",
    "pearl": "https://pearldrum.com/products",  # Updated URL guess
    "nord": "https://www.nordkeyboards.com/products",
    "mackie": "https://mackie.com/en/products",
    "presonus": "https://www.presonus.com/en-US/products",
    "korg": "https://www.korg.com/us/products/",
    "yamaha": "https://usa.yamaha.com/products/musical_instruments/index.html"
}

# Heuristics to identify product links
# We allow '/products/' OR '/categories/' for discovery, but enforce more strict rules later if needed.
LINK_PATTERNS = {
    "roland": r"/(products|categories)/.+",
    "boss": r"/(products|categories)/.+",
    "pearl": r"/products/[^/]+/[^/]+",
    "nord": r"/products/[^/]+",
    "mackie": r"/products/[^/]+",
    "presonus": r"/products/[^/]+",
    "korg": r"/products/[^/]+/[^/]+",
    "yamaha": r"/products/musical_instruments/[^/]+/[^/]+/[^/]+"
}


class UniversalScraper:
    def __init__(self):
        self.data_dir = Path(__file__).resolve(
        ).parents[1] / "data" / "catalogs_brand"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.browser = None
        self.context = None

    async def start(self):
        if not async_playwright:
            logger.error("Playwright not installed.")
            return

        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)
        # Use a real user agent
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

    async def stop(self):
        if self.browser:
            await self.browser.close()

    async def get_page_links(self, url: str) -> Set[str]:
        """Extracts all internal links from a page."""
        page = await self.context.new_page()
        try:
            logger.debug(f"Scanning {url} for links...")
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)

            # Scroll to bottom to trigger lazy loads
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1000)

            links = await page.evaluate("""
                () => {
                    return Array.from(document.querySelectorAll('a'))
                        .map(a => a.href)
                        .filter(href => href && href.startsWith('http'));
                }
            """)
            return set(links)
        except Exception as e:
            logger.warning(f"Error getting links from {url}: {e}")
            return set()
        finally:
            await page.close()

    async def scrape_product_page(self, url: str, brand_id: str) -> Optional[Dict[str, Any]]:
        """Scrapes OG tags, H1, and intelligently extracts Category/Specs."""
        # Fast fail if URL looks like a category listing (Roland specific)
        if "/categories/" in url:
            return None

        page = await self.context.new_page()
        try:
            logger.info(f"  Scraping product: {url}")
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)

            # Extract Data
            data = await page.evaluate("""
                () => {
                    const getMeta = (prop) => {
                        const el = document.querySelector(`meta[property='${prop}']`) || document.querySelector(`meta[name='${prop}']`);
                        return el ? el.content : '';
                    };
                    const h1 = document.querySelector('h1');
                    
                    // Breadcrumb extraction attempts
                    let breadcrumb = '';
                    const bcEl = document.querySelector('.breadcrumb') || 
                                 document.querySelector('[aria-label="breadcrumb"]') || 
                                 document.querySelector('.breadcrumbs');
                                 
                    if (bcEl) {
                        breadcrumb = bcEl.innerText.replace(/[\\n\\r]+/g, ' ').trim();
                    }
                    
                    // Detect if this is a Listing Page (e.g. valid OG tags but is a list)
                    // Check for "View Details" buttons or typical grid structures
                    const isListing = document.querySelectorAll('.product-tile, .card, .grid-item').length > 5;

                    return {
                        title: getMeta('og:title') || document.title,
                        image: getMeta('og:image'),
                        description: getMeta('og:description') || getMeta('description'),
                        h1: h1 ? h1.innerText : '',
                        breadcrumb: breadcrumb,
                        isListing: isListing
                    };
                }
            """)

            # Validation: Must have an image to be useful (title we can construct)
            if not data['image'] or data['isListing']:
                return None

            # --- Name Logic ---
            raw_title = data['title']
            h1_title = data['h1']
            final_title = h1_title.strip() if h1_title and h1_title.strip() else raw_title

            # Cleaning Logic
            brand_name = brand_id.lower()
            cleanup_pattern = re.compile(
                f"\\s*[-|:]\\s*{brand_name}", re.IGNORECASE)
            final_title = cleanup_pattern.sub("", final_title)

            if final_title.lower().strip() == brand_name:
                try:
                    path_parts = [p for p in urlparse(
                        url).path.split('/') if p]
                    if path_parts:
                        potential = path_parts[-1].replace(
                            '_', ' ').replace('-', ' ').title()
                        if potential.lower() != brand_name:
                            final_title = potential
                except:
                    pass

            # If still just brand name, examine description for "Model: ..." format
            if final_title.lower().strip() == brand_name and data['description']:
                if ':' in data['description']:
                    potential = data['description'].split(':')[0].strip()
                    if potential and len(potential) < 30:
                        final_title = potential

            # --- Category & Metadata Extraction Logic ---
            category = "General"
            specs = {}
            description = data['description']

            # Heuristic 1: Pattern extraction from Description
            # Roland/Boss often use: "Model: Category - Tagline"
            if description and ':' in description:
                parts = description.split(':', 1)
                left_part = parts[0].strip()
                if final_title.lower() in left_part.lower() or left_part.lower() in final_title.lower() or len(left_part) < len(final_title) + 5:
                    right_part = parts[1].strip()
                    if ' - ' in right_part:
                        cat_parts = right_part.split(' - ', 1)
                        category = cat_parts[0].strip()
                        specs['tagline'] = cat_parts[1].strip()
                    else:
                        category = right_part

            # Heuristic 2: Breadcrumbs (fallback)
            if category == "General" and data['breadcrumb']:
                bc_text = data['breadcrumb']
                sep = '>' if '>' in bc_text else '/'
                if sep in bc_text:
                    segments = [s.strip() for s in bc_text.split(sep)]
                    if len(segments) >= 2:
                        candidate = segments[-2]
                        if candidate.lower() not in ['products', 'home', brand_id]:
                            category = candidate

            # Heuristic 3: URL Path (last resort)
            if category == "General":
                path_parts = [p for p in urlparse(url).path.split('/') if p]
                if len(path_parts) >= 2:
                    candidate = path_parts[-2].replace(
                        '-', ' ').replace('_', ' ').title()
                    if candidate.lower() not in ['products', 'musical instruments', 'en-us']:
                        category = candidate

            # Cleaning
            category = category.replace('®', '').replace('™', '').strip()

            return {
                "name": final_title.strip(),
                "url": url,
                "image_url": data['image'],
                "description": description,
                "brand": brand_id,
                "category": category,
                "specs": specs,
                "source": "brand_website"
            }

        except Exception as e:
            logger.warning(f"  Failed to scrape {url}: {e}")
            return None
        finally:
            await page.close()

    async def run_brand(self, brand_id: str, start_url: str):
        logger.info(f"--- Processing {brand_id} with Deep Crawl ---")

        pattern = LINK_PATTERNS.get(brand_id, r"/products/")
        start_domain = urlparse(start_url).netloc

        # BFS Queue for Discovery
        # (url, depth)
        queue = [(start_url, 0)]
        visited_urls = set()
        product_candidates = set()

        # Limit safety
        MAX_DEPTH = 3
        MAX_PAGES_TO_SCAN = 100

        scanned_count = 0

        while queue and scanned_count < MAX_PAGES_TO_SCAN:
            current_url, depth = queue.pop(0)

            # Normalize URL (strip trailing slash for consistent visited check)
            normalized_url = current_url.rstrip('/')
            if normalized_url in visited_urls:
                continue
            visited_urls.add(normalized_url)

            # Determine if we should scan this page for more links
            # We scan if depth < MAX_DEPTH
            # And we only scan if it matches pattern OR is start_url

            scanned_count += 1
            if depth > 0:
                logger.info(f"Scanning [D{depth}] {current_url} ...")

            new_links = await self.get_page_links(current_url)

            for link in new_links:
                # Domain check
                if urlparse(link).netloc != start_domain:
                    continue

                # Pattern check
                if not re.search(pattern, link, re.IGNORECASE):
                    continue

                # Add to candidates (potential products)
                # We consider EVERYTHING matching pattern a candidate for scraping OR scanning
                product_candidates.add(link)

                # Add to queue for deeper scanning if not visited
                # Logic: If it's a category page, we want to scan it.
                # If it's a product page, links inside might be "related products", which is also good.
                if depth + 1 <= MAX_DEPTH:
                    norm_link = link.rstrip('/')
                    if norm_link not in visited_urls:
                        # Append to queue. BUT, try to prioritize categories?
                        # BFS is fine.
                        queue.append((link, depth + 1))

        logger.info(
            f"Discovery complete. Found {len(product_candidates)} unique product/category pages.")

        # Phase 3: Scrape
        products = []
        sem_scrape = asyncio.Semaphore(5)

        async def _worker(link):
            async with sem_scrape:
                return await self.scrape_product_page(link, brand_id)

        # Scrape everything found
        scrape_tasks = [_worker(link) for link in list(product_candidates)]
        scrape_results = await asyncio.gather(*scrape_tasks)

        for p in scrape_results:
            if p:
                products.append(p)

        logger.info(
            f"✅ Successfully scraped {len(products)} products for {brand_id}")

        # 4. Save
        if products:
            output_file = self.data_dir / f"{brand_id}_brand.json"
            output_data = {
                "brand_id": brand_id,
                "brand_name": brand_id.title(),
                "website": start_url,
                "products": products
            }
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(output_data, f, indent=2)


async def main():
    scraper = UniversalScraper()
    await scraper.start()

    # Run for top prioritized brands first
    target_brands = ["roland", "pearl", "boss"]  # Start small to verify

    for brand in target_brands:
        if brand in BRANDS_TO_SCRAPE:
            await scraper.run_brand(brand, BRANDS_TO_SCRAPE[brand])

    await scraper.stop()

if __name__ == "__main__":
    asyncio.run(main())
