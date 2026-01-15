#!/usr/bin/env python3
"""
Extract the official Halilit brand list from their website.
This becomes the single source of truth for all brands.
"""

import re
import json
import httpx
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Dict
import asyncio


async def fetch_halilit_brands() -> List[Dict[str, str]]:
    """Fetch and parse Halilit's official brands page."""

    url = "https://www.halilit.com/pages/4367"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        html = response.text

    soup = BeautifulSoup(html, 'html.parser')
    brands = []

    # Find all brand links - they follow pattern: href contains "/g/5193-Brand/"
    # or Hebrew pattern "/g/5193-יצרן/"
    brand_links = soup.find_all('a', href=re.compile(
        r'/g/5193-(Brand|%D7%99%D7%A6%D7%A8%D7%9F)/'))

    print(f"Found {len(brand_links)} potential brand links...")

    seen_brands = set()

    for link in brand_links:
        try:
            # Get brand URL
            href = link.get('href', '')
            if not href:
                continue

            # Extract brand name from URL - last part after last /
            # Pattern: /g/5193-Brand/123456-Brand-Name or /g/5193-יצרן/123456-Brand-Name
            url_parts = href.split('/')
            if len(url_parts) < 2:
                continue

            # Get last part (Brand-Name)
            brand_part = url_parts[-1]

            # Extract just the brand name after the number-
            match = re.search(r'^\d+-([\w-]+)', brand_part)
            if not match:
                continue

            brand_id_raw = match.group(1)
            brand_id = brand_id_raw.lower().strip()

            # Skip if already seen
            if brand_id in seen_brands:
                continue

            # Find image in link
            img = link.find('img')
            logo_url = None
            if img:
                logo_url = img.get('src', '') or img.get('data-src', '')

            # Get brand display name - clean it up
            brand_name = brand_id.replace('-', ' ').title()

            # Common name fixes
            brand_name_map = {
                'Rcf': 'RCF',
                'Krk Systems': 'KRK Systems',
                'Esp': 'ESP',
                'Akd': 'AKD',
                'M Audio': 'M-Audio',
                'V Moda': 'V-MODA',
                'Akg': 'AKG',
                'Eaw': 'EAW',
                'Kmi': 'KMI',
                'Asi': 'ASI'
            }
            brand_name = brand_name_map.get(brand_name, brand_name)

            # Build full URL
            if href and not href.startswith('http'):
                href = f"https://www.halilit.com{href}"

            if logo_url and not logo_url.startswith('http'):
                logo_url = f"https:{logo_url}" if logo_url.startswith(
                    '//') else f"https://www.halilit.com{logo_url}"

            brands.append({
                "id": brand_id,
                "name": brand_name,
                "url": href,
                "logo_url": logo_url,
                "authorized": True,
                "distributor": "Halilit"
            })

            seen_brands.add(brand_id)

        except Exception as e:
            print(f"Error processing brand link: {e}")
            continue

    # Sort by name
    brands.sort(key=lambda x: x['name'])

    return brands


async def main():
    print("🌐 Fetching Halilit official brands page...")
    brands = await fetch_halilit_brands()

    print(f"\n✅ Extracted {len(brands)} official Halilit brands\n")

    # Save to file
    output_path = Path(__file__).parent.parent / "data" / \
        "halilit_official_brands.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "source": "https://www.halilit.com/pages/4367",
            "distributor": "Halilit",
            "count": len(brands),
            "brands": brands
        }, f, indent=2, ensure_ascii=False)

    print(f"💾 Saved to: {output_path}\n")

    # Show first 20 brands as preview
    print("📋 First 20 brands:")
    print("-" * 80)
    for i, brand in enumerate(brands[:20], 1):
        logo = "✓" if brand['logo_url'] else "✗"
        print(f"{i:2}. {logo} {brand['name']:30} ({brand['id']})")

    if len(brands) > 20:
        print(f"... and {len(brands) - 20} more")

    print("\n🎯 This is now your single source of truth for all brands!")


if __name__ == "__main__":
    asyncio.run(main())
