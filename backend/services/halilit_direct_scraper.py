import requests
from bs4 import BeautifulSoup
import json
import os
import re
import time
from typing import List, Dict, Optional

class HalilitDirectScraper:
    """
    Directly scrapes product listings from Halilit's brand pages.
    Used as a fallback when no deep scraper is available or for "No Deep Map" brands.
    """
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.cdn_base = "https://d3m9l0v76dty0.cloudfront.net" # Fallback if needed
        # Ensure output directory exists
        os.makedirs("backend/data/blueprints", exist_ok=True)

    def scrape_brand(self, brand_slug: str, brand_url: str) -> Optional[str]:
        print(f"📡 Establishing Direct Uplink: {brand_slug.upper()} ({brand_url})")
        
        all_products = []
        page = 1
        has_next_page = True
        
        # Safety limit for pagination
        max_pages = 20 
        
        while has_next_page and page <= max_pages:
            paged_url = f"{brand_url}?page={page}" if page > 1 else brand_url
            if page > 1:
                print(f"   Scanning page {page}...")
            
            try:
                res = self.session.get(paged_url)
                if res.status_code != 200:
                    print(f"   ❌ Failed to load page {page}: {res.status_code}")
                    break
                
                soup = BeautifulSoup(res.text, 'html.parser')
                
                # Check pagination
                next_btn = soup.select_one('.pagination a.next_page')
                has_next_page = bool(next_btn)
                
                # Extract products
                product_nodes = soup.select('.layout_list_item')
                
                if not product_nodes:
                    if page == 1:
                        print(f"   ⚠️  No products found on page 1.")
                    break
                
                initial_count = len(all_products)
                for node in product_nodes:
                    product_data = self._parse_node(node, brand_slug)
                    # Deduplication check
                    if product_data and not any(p['id'] == product_data['id'] for p in all_products):
                        all_products.append(product_data)
                
                if len(all_products) == initial_count:
                     # No new products found on this page? Suspicious.
                     # But maybe duplicates within page.
                     pass

                page += 1
                time.sleep(0.5) # Be nice
                
            except Exception as e:
                print(f"   ❌ Error on page {page}: {e}")
                break
        
        if not all_products:
            print(f"   ❌ {brand_slug.upper()}: No products found.")
            return None
            
        print(f"✅ Mission Complete: {len(all_products)} Lifeforms Mapped.")
        
        # Save Blueprint
        output_path = f"backend/data/blueprints/{brand_slug}_blueprint.json"
        
        # Ensure directory exists (just in case)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(all_products, f, indent=2)
            
        print(f"   Blueprint saved to: {output_path}")
        return output_path

    def _parse_node(self, node, brand_slug) -> Optional[Dict]:
        try:
            # unique ID from data attribute
            item_code = node.get('data-item-code')
            
            # The 'class="title_with_brand"' element usually contains the name
            name_el = node.select_one('.title_with_brand')
            name = name_el.text.strip() if name_el else "Unknown Product"
            
            # Image
            img_el = node.select_one('.img_wrapper img')
            img_url = img_el['src'] if img_el else ""
            if img_url and not img_url.startswith('http'):
                 img_url = f"{self.cdn_base}{img_url}"
            
            # Price
            price = 0.0
            # Price is usually in span.price -> text like "3,422 ₪"
            # It might have child elements like "show_eilat_price"
            price_el = node.select_one('.price')
            if price_el:
                # Get only the direct text or clean it up
                # sometimes price structure is complex. 
                # Simplest: extract all text and find numbers.
                price_text = price_el.get_text(strip=True)
                # Regex to find the first large number
                # "מחיר 3,422 ₪"
                match = re.search(r'([\d,]+)', price_text)
                if match:
                    clean_price = match.group(1).replace(',', '')
                    try:
                        price = float(clean_price)
                    except:
                        pass
            
            # Link
            link_el = node.find('a', href=True)
            rel_url = link_el['href'].strip() if link_el else ""
            # Ensure rel_url starts with / if not empty, or handled by join
            if rel_url and not rel_url.startswith('/'):
                 rel_url = f"/{rel_url}"

            full_url = f"https://www.halilit.com{rel_url}" if rel_url else ""
            
            # Construct ID
            if not item_code:
                # fallback ID from URL
                 # /items/123456-roland-xy
                 if rel_url:
                     item_code = rel_url.split('/')[-1]
                 else:
                     item_code = f"unknown_{int(time.time())}"

            # Sanitize ID
            safe_id = f"{brand_slug}_{item_code}".lower()
            safe_id = re.sub(r'[^a-z0-9_]', '_', safe_id)
            
            return {
                "id": safe_id,
                "name": name,
                "description": name, # No deep desc, use name
                "category": "general", # Tag as general, consolidation logic will handle or default
                "image_url": img_url,
                "product_url": full_url,
                "is_sold": True,
                "price": price,
                "halilit_url": full_url,
                "status": "IN_STOCK"
            }
            
        except Exception as e:
            # print(f"Error parsing node: {e}")
            return None
