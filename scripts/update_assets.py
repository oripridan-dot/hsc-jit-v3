import asyncio
import httpx
import json
import os
from pathlib import Path
from bs4 import BeautifulSoup
import shutil
from urllib.parse import urlparse

# Constants
CATALOG_DIR = Path("/workspaces/hsc-jit-v3/backend/data/catalogs")
BRAND_ASSET_DIR = Path("/workspaces/hsc-jit-v3/backend/app/static/assets/brands")
PRODUCT_ASSET_DIR = Path("/workspaces/hsc-jit-v3/backend/app/static/assets/products")

# Ensure dirs exist
BRAND_ASSET_DIR.mkdir(parents=True, exist_ok=True)
PRODUCT_ASSET_DIR.mkdir(parents=True, exist_ok=True)

async def fetch_file(client, url, dest_path):
    try:
        print(f"Downloading {url} to {dest_path.name}...")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = await client.get(url, follow_redirects=True, timeout=10.0, headers=headers)
        if response.status_code == 200:
            with open(dest_path, 'wb') as f:
                f.write(response.content)
            print(f"✓ Success")
            return True
        else:
            print(f"✗ Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

async def fetch_og_image(client, doc_url):
    try:
        if not doc_url or not doc_url.startswith('http'): return None
        print(f"  Scraping {doc_url} for og:image...")
        # Use a real user agent
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        resp = await client.get(doc_url, headers=headers, follow_redirects=True, timeout=10.0)
        if resp.status_code != 200:
            print(f"  Failed: {resp.status_code}")
            return None
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        og_img = soup.find('meta', property='og:image')
        if og_img and og_img.get('content'):
            return og_img['content']
        return None
    except Exception as e:
        print(f"  Scrape Error: {e}")
        return None


async def process_catalog(client, file_path):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return

    changed = False
    
    brand_data = data.get('brand_identity', {})
    brand_id = brand_data.get('id')
    
    if not brand_id:
        return

    print(f"\nProcessing {brand_id}...")

    # --- 1. Brand Logo Strategy ---
    # Priority 1: Check if any product has a 'logo' image (official source found in data)
    official_logo_url = None
    products = data.get('products', [])
    
    # Remove hardcode, use standard logic with fallback
    # BUT SPECIAL CASE ROLAND because official sources block us or are 404
    if brand_id == 'roland':
         official_logo_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Roland_logo.svg/800px-Roland_logo.svg.png"
    else:
        for p in products:
            p_imgs = p.get('images', {})
            if p_imgs.get('logo') and p_imgs['logo'].startswith('http'):
                official_logo_url = p_imgs['logo']
                break
    
    # helper to try download
    async def try_download(url, dest):
        if not url: return False
        return await fetch_file(client, url, dest)

    success = False
    
    # Try Priority 1
    if official_logo_url:
        ext = 'png'
        if official_logo_url.endswith('.svg'): ext = 'svg'
        elif official_logo_url.endswith('.jpg') or official_logo_url.endswith('.jpeg'): ext = 'jpg'
        
        dest_filename = f"{brand_id}.{ext}"
        dest_path = BRAND_ASSET_DIR / dest_filename
        
        if await try_download(official_logo_url, dest_path):
            success = True
            new_local_url = f"/static/assets/brands/{dest_filename}"
            if brand_data.get('logo_url') != new_local_url:
                brand_data['logo_url'] = new_local_url
                changed = True

    # Priority 2: DuckDuckGo Icons (proven to work in restricted env)
    if not success and brand_data.get('website'):
        domain = urlparse(brand_data['website']).netloc.replace("www.", "")
        
        dest_path = BRAND_ASSET_DIR / f"{brand_id}.png"
        
        # https://icons.duckduckgo.com/ip3/brand.com.ico (returns PNG often despite .ico)
        ddg_url = f"https://icons.duckduckgo.com/ip3/{domain}.ico"
        
        if await try_download(ddg_url, dest_path):
             # Verify file size > 100 bytes (avoid garbage 95 byte files if any)
             if dest_path.stat().st_size > 100:
                success = True
             else:
                print(f"✗ Garbage file downloaded ({dest_path.stat().st_size} bytes)")
                dest_path.unlink()

        if not success:
             # Fallback to Google
             google_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=256"
             if await try_download(google_url, dest_path):
                if dest_path.stat().st_size > 100:
                    success = True
                else:
                    dest_path.unlink()

        if success:
            new_local_url = f"/static/assets/brands/{brand_id}.png"
            if brand_data.get('logo_url') != new_local_url:
                brand_data['logo_url'] = new_local_url
                changed = True
    
    # --- 2. Product Images Strategy ---
    # "same goes for images"
    for product in products:
        images = product.get('images', {})
        main_img = images.get('main', '')
        thumb_img = images.get('thumbnail', '')
        
        # Determine if we need to fix this image
        needs_fix = False
        target_filename = None
        
        # 1. Check if local file exists and is valid size
        if main_img and main_img.startswith('/static/assets/products/'):
            fname = main_img.split('/')[-1]
            fpath = PRODUCT_ASSET_DIR / fname
            if not fpath.exists() or fpath.stat().st_size < 5000: # Re-download if < 5KB (suspicious)
                needs_fix = True
                target_filename = fname
        
        # 2. If no main image or needs fix
        if not main_img or needs_fix:
            if not target_filename:
                target_filename = f"{product['id']}.webp" # default
            
            # Source 1: Thumbnail URL from catalog
            source_url = thumb_img if thumb_img and thumb_img.startswith('http') else None
            
            # Source 2: Scrape documentation URL
            if not source_url and product.get('documentation', {}).get('url'):
                source_url = await fetch_og_image(client, product['documentation']['url'])
                
            if source_url:
                dest_path = PRODUCT_ASSET_DIR / target_filename
                if await fetch_file(client, source_url, dest_path):
                    # verify size
                    if dest_path.stat().st_size > 1000:
                        images['main'] = f"/static/assets/products/{target_filename}"
                        changed = True
                    else:
                        print(f"  Downloaded file too small {dest_path.stat().st_size}, ignoring.")
                        dest_path.unlink() # delete garbage

    if changed:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

async def main():
    async with httpx.AsyncClient() as client:
        # Only process Roland first to verify fix, then all
        # Or just all. The user asked for "verify we have the right logo... same goes for images"
        # Since I want to fix Roland specifically first, I'll ensure it's processed.
        
        # Process Roland specifically first and force it
        roland_path = CATALOG_DIR / "roland_catalog.json"
        if roland_path.exists():
            await process_catalog(client, roland_path)
            
        # Process others?
        # The user's request implies a general policy "I want only the official logos".
        # So I should run for all.
        files = sorted(CATALOG_DIR.glob("*_catalog.json"))
        for file_path in files:
            if file_path.name == "roland_catalog.json": continue # already done
            await process_catalog(client, file_path)

if __name__ == "__main__":
    asyncio.run(main())
