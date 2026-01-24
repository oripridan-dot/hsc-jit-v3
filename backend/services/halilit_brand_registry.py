import requests
from bs4 import BeautifulSoup
import re
import os

class HalilitBrandRegistry:
    """
    THE BIBLE: https://www.halilit.com/pages/4367
    This service defines the scope of the entire application.
    """
    BIBLE_URL = "https://www.halilit.com/pages/4367"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers = {'User-Agent': 'HSC-Master-Registry/1.0'}

    def fetch_official_roster(self):
        print(f"📜 Reading the Bible ({self.BIBLE_URL})...")
        try:
            res = self.session.get(self.BIBLE_URL)
            if res.status_code != 200:
                print(f"❌ Failed to read registry: {res.status_code}")
                return []

            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Selector derived from inspection: <div class="brands"> <ul> <li> ...
            brand_elements = soup.select('div.brands li')
            
            if not brand_elements:
                # Fallback to general link search if class not found
                print("⚠️  Specific selector 'div.brands li' failed. Trying fallback.")
                brand_elements = soup.select('a[href*="/brand/"]')

            roster = []
            
            for el in brand_elements:
                # The element might be an LI containing a Table containing an A
                # Or it might be just an A if fallback triggered.
                
                link_el = el.find('a') if el.name != 'a' else el
                if not link_el:
                    continue
                    
                href = link_el['href']
                
                # Filter out irrelevant links if using broad selector
                if '/g/' not in href and '/brand/' not in href and 'yatzran' not in str(href):
                    # Some hrefs are /g/5193-Brand/... or /g/5193-yatzran/...
                    # check if it looks like a brand link
                     pass 

                # Extract Slug and clean it (remove leading ID similar to "33109-")
                raw_slug = href.split('/')[-1].lower()
                # Remove leading numbers and dash (e.g. 33109-roland -> roland)
                slug = re.sub(r'^\d+-', '', raw_slug)

                # Extract Logo URL
                img = el.select_one('img')
                logo_url = img['src'] if img else None
                if logo_url and not logo_url.startswith('http'):
                    logo_url = f"https://www.halilit.com{logo_url}"

                # Extract Name
                # Priority: img alt -> derived from slug -> text
                name = ""
                if img and img.get('alt'):
                    name = img['alt'].strip()
                
                if not name:
                    name = slug.replace('-', ' ').title()
                    
                # Store
                if slug and name:
                     # Avoid duplicates if any
                     if not any(b['slug'] == slug for b in roster):
                        roster.append({
                            "name": name,
                            "slug": slug,
                            "halilit_url": href if href.startswith('http') else f"https://www.halilit.com{href}",
                            "logo_url": logo_url
                        })
                
            print(f"✅ Authenticated {len(roster)} Partners.")
            return roster

        except Exception as e:
            print(f"❌ Registry Protocol Failed: {e}")
            import traceback
            traceback.print_exc()
            return []

    def sync_logos(self, roster):
        """Ensures we have a local logo for every partner"""
        # Adjust path to be relative to where script is run (backend root typically)
        # If run from backend/, the path to frontend is ../frontend/
        save_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend/public/assets/logos")
        # However, cleaner to use relative paths if we know CWD. 
        # User specified: "../frontend/public/assets/logos"
        # Since we run from backend/, that works.
        
        save_dir = "../frontend/public/assets/logos"
        os.makedirs(save_dir, exist_ok=True)
        
        for brand in roster:
            if not brand['logo_url']: continue
            
            # Simple sanitization
            safe_name = brand['slug'].replace(' ', '-')
            ext = brand['logo_url'].split('.')[-1].split('?')[0] or 'png'
            local_path = os.path.join(save_dir, f"{safe_name}_logo.{ext}")
            
            if not os.path.exists(local_path):
                print(f"  ⬇️  Ingesting Logo: {brand['name']}")
                try:
                    img_data = requests.get(brand['logo_url'], timeout=10).content
                    with open(local_path, 'wb') as f:
                        f.write(img_data)
                except Exception as e:
                    print(f"  ⚠️  Failed to download logo for {brand['name']}: {e}")

if __name__ == "__main__":
    reg = HalilitBrandRegistry()
    roster = reg.fetch_official_roster()
    reg.sync_logos(roster)
