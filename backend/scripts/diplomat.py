"""
THE DIPLOMAT: AI-Powered Scraping Config Generator

Purpose: Analyze a brand's website and generate extraction rules automatically.
This eliminates the need to manually write scrapers for each brand.

Usage:
    python scripts/diplomat.py --url "https://www.roland.com/us/products/" --brand "roland"

Output:
    backend/data/brands/roland/scrape_config.json
"""

from app.services.llm import GeminiService
import argparse
import asyncio
import json
from pathlib import Path
from typing import Any, Dict, Optional
import httpx
from bs4 import BeautifulSoup
import sys
import os

# Add backend to path for imports
backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))


class Diplomat:
    """AI agent that learns website structure and generates scraping configs."""

    def __init__(self):
        self.llm = GeminiService()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (compatible; HSC-JIT-Diplomat/3.4)"
        }

    async def analyze_website(self, url: str, brand_name: str) -> Dict[str, Any]:
        """
        Step 1: Fetch the page
        Step 2: Extract sample HTML structure
        Step 3: Ask AI to generate CSS selectors/XPath rules
        """
        print(f"\n🔍 [DIPLOMAT] Analyzing {url}...")

        # Fetch the page
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                html = response.text
            except Exception as e:
                print(f"❌ Failed to fetch {url}: {e}")
                return None

        # Parse with BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')

        # Extract sample structure (first 5 product-like elements)
        sample_html = self._extract_sample_structure(soup)

        # Ask AI to generate config
        config = await self._generate_config_with_ai(sample_html, url, brand_name)

        return config

    def _extract_sample_structure(self, soup: BeautifulSoup) -> str:
        """
        Extract representative HTML snippets that likely contain products.
        Look for common patterns: grids, lists, cards, etc.
        """
        # Common selectors for product listings
        candidates = (
            soup.select('.product-item')[:3] or
            soup.select('.product-card')[:3] or
            soup.select('[class*="product"]')[:5] or
            soup.select('.item')[:3] or
            soup.select('article')[:3]
        )

        if not candidates:
            # Fallback: grab first 500 lines of body
            body = soup.find('body')
            return str(body)[:5000] if body else str(soup)[:5000]

        # Return prettified HTML of candidates
        sample = "\n\n".join([str(elem) for elem in candidates[:5]])
        return sample[:8000]  # Limit to prevent token overflow

    async def _generate_config_with_ai(self, sample_html: str, url: str, brand_name: str) -> Dict[str, Any]:
        """
        Use LLM to analyze HTML and generate scraping config.
        """
        prompt = f"""You are a web scraping expert. Analyze this HTML sample from {url} and generate a JSON configuration for extracting product data.

HTML Sample:
```html
{sample_html}
```

Your task: Identify the CSS selectors or patterns to extract:
1. **product_list_selector**: CSS selector for the container holding all products (e.g., ".product-grid")
2. **product_item_selector**: CSS selector for individual product items (e.g., ".product-card")
3. **fields**: Mapping of field names to CSS selectors relative to each product item:
   - name: Product title/name
   - image_url: Product image URL (check both src and data-src attributes)
   - detail_url: Link to product detail page
   - price: Price if visible on listing (optional)
   - category: Category if visible (optional)

Return ONLY valid JSON in this format:
{{
  "brand_id": "{brand_name}",
  "base_url": "{url}",
  "product_list_selector": "...",
  "product_item_selector": "...",
  "pagination": {{
    "type": "none",
    "next_button_selector": null
  }},
  "fields": {{
    "name": {{"selector": "...", "attribute": "text"}},
    "image_url": {{"selector": "...", "attribute": "src"}},
    "detail_url": {{"selector": "...", "attribute": "href"}},
    "price": {{"selector": "...", "attribute": "text"}},
    "category": {{"selector": "...", "attribute": "text"}}
  }}
}}

If pagination exists (e.g., "Load More" button or numbered pages), set pagination type to "button" or "numbered" and provide the selector.
Be specific and accurate. Return ONLY the JSON, no explanation."""

        print(f"🤖 [AI] Generating scraping config...")

        # Use GeminiService to get response (collect streaming chunks)
        response_chunks = []
        try:
            async for chunk in self.llm.stream_answer(context="", query=prompt, scenario="general"):
                response_chunks.append(chunk)

            response_text = "".join(response_chunks)
        except Exception as e:
            print(f"❌ [AI] Error calling Gemini: {e}")
            return None

        # Parse JSON from response
        try:
            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                json_str = response_text.split(
                    "```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split(
                    "```")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()

            config = json.loads(json_str)
            print(f"✅ [AI] Config generated successfully")
            return config

        except json.JSONDecodeError as e:
            print(f"❌ [AI] Failed to parse JSON: {e}")
            print(f"Response was: {response_text[:500]}...")
            return None

    def save_config(self, config: Dict[str, Any], brand_name: str) -> Path:
        """
        Save the generated config to backend/data/brands/{brand}/scrape_config.json
        """
        brand_dir = backend_dir / "data" / "brands" / brand_name
        brand_dir.mkdir(parents=True, exist_ok=True)

        config_path = brand_dir / "scrape_config.json"
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)

        print(f"💾 [DIPLOMAT] Config saved to {config_path}")
        return config_path


async def main():
    parser = argparse.ArgumentParser(
        description="Generate scraping config for a brand")
    parser.add_argument("--url", required=True,
                        help="URL of the brand's product listing page")
    parser.add_argument("--brand", required=True,
                        help="Brand identifier (e.g., roland, moog)")
    args = parser.parse_args()

    diplomat = Diplomat()
    config = await diplomat.analyze_website(args.url, args.brand)

    if config:
        diplomat.save_config(config, args.brand)
        print(f"\n✨ [SUCCESS] Scraping config created for {args.brand}")
        print(f"Next step: Run the harvester to populate the catalog")
        print(f"  python scripts/harvester.py --brand {args.brand}")
    else:
        print(f"\n❌ [FAILED] Could not generate config for {args.brand}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
