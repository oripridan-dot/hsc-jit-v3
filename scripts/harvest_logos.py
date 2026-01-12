import json
import os
from pathlib import Path
from bs4 import BeautifulSoup
from thefuzz import process, fuzz
import httpx
import asyncio
import re

# Constants
CATALOG_DIR = Path("/workspaces/hsc-jit-v3/backend/data/catalogs")
BRAND_ASSET_DIR = Path("/workspaces/hsc-jit-v3/backend/app/static/assets/brands")
HTML_FILE = Path("/workspaces/hsc-jit-v3/halilit_brands.html")

# Ensure dirs exist
BRAND_ASSET_DIR.mkdir(parents=True, exist_ok=True)

def load_brands():
    brands = []
    for f in CATALOG_DIR.glob("*_catalog.json"):
        try:
            with open(f, 'r') as json_file:
                data = json.load(json_file)
                identity = data.get('brand_identity', {})
                if identity.get('id'):
                    brands.append({
                        'id': identity['id'],
                        'name': identity.get('name', identity['id']),
                        'file': f
                    })
        except Exception as e:
            print(f"Error loading {f}: {e}")
    return brands

async def download_image(client, url, dest_path):
    try:
        print(f"Downloading {url}...")
        headers = { "User-Agent": "Mozilla/5.0" }
        resp = await client.get(url, headers=headers, follow_redirects=True, timeout=10.0)
        if resp.status_code == 200:
            with open(dest_path, 'wb') as f:
                f.write(resp.content)
            return True
        else:
            print(f"Failed: {resp.status_code}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

async def main():
    print("Loading brands...")
    my_brands = load_brands()
    brand_map = {b['name'].lower(): b for b in my_brands}
    brand_choices = list(brand_map.keys())
    
    print(f"Loaded {len(my_brands)} brands.")
    
    print("Parsing HTML...")
    with open(HTML_FILE, 'r') as f:
        soup = BeautifulSoup(f, 'html.parser')
    
    # Structure: <td> <a ...> <img ...> </a> </td>
    # Find all 'a' tags that wrap an 'img'
    
    links = soup.find_all('a')
    matches_found = 0
    
    async with httpx.AsyncClient() as client:
        for link in links:
            img = link.find('img')
            if not img: continue
            
            src = img.get('src')
            if not src: continue
            
            # Clean src
            src = src.strip().replace('\n', '').replace('\r', '')
            if src.startswith("//"): src = "https:" + src
            elif not src.startswith("http"): continue # Skip relative or weird
            
            # Identify Brand Name
            candidates = []
            if link.get('title'): candidates.append(link['title'])
            if img.get('alt'): candidates.append(img['alt'])
            if link.get('href'):
                # Extract slug from href
                # e.g. /g/5193-Brand/446539-Ashdown-Engineering
                href = link['href']
                parts = href.split('/')
                if len(parts) > 0:
                    candidates.append(parts[-1].replace('-', ' '))
            
            # Normalize and clean candidates
            cleaned_candidates = []
            for c in candidates:
                c = re.sub(r'[^\w\s]', '', c) # remove punctuation
                c = c.replace('לוגו', '') # remove hebrew 'logo'
                c = c.strip()
                if c: cleaned_candidates.append(c)
            
            if not cleaned_candidates: continue
            
            # Try to match
            best_score = 0
            best_brand = None
            
            for c in cleaned_candidates:
                # Use fuzz.token_sort_ratio for matching "Roland" with "Roland Corporation"
                extracted, score = process.extractOne(c.lower(), brand_choices, scorer=fuzz.token_set_ratio)
                if score > best_score:
                    best_score = score
                    best_brand = brand_map[extracted]
            
            if best_score >= 85: # High confidence threshold
                print(f"Found match: '{cleaned_candidates[0]}' -> {best_brand['name']} ({best_score}%)")
                
                # Check extension
                ext = 'png'
                if '.jpg' in src or '.jpeg' in src: ext = 'jpg'
                if '.svg' in src: ext = 'svg'
                
                dest_filename = f"{best_brand['id']}.{ext}"
                dest_path = BRAND_ASSET_DIR / dest_filename
                
                # Download
                if await download_image(client, src, dest_path):
                    # Verify size
                    if dest_path.stat().st_size > 1000:
                         # Update catalog
                         try:
                            with open(best_brand['file'], 'r+') as f:
                                data = json.load(f)
                                current_url = data['brand_identity'].get('logo_url', '')
                                new_url = f"/static/assets/brands/{dest_filename}"
                                
                                if current_url != new_url:
                                    data['brand_identity']['logo_url'] = new_url
                                    f.seek(0)
                                    json.dump(data, f, indent=2)
                                    f.truncate()
                                    print(f"  Updated catalog for {best_brand['id']}")
                                matches_found += 1
                         except Exception as e:
                             print(f"  Error updating JSON: {e}")
                    else:
                        print("  Image too small, skipping.")
                        dest_path.unlink()

    print(f"\nDone. Updated {matches_found} brands.")

if __name__ == "__main__":
    asyncio.run(main())
