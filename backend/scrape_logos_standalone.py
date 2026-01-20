import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
DEST_DIR = Path("../frontend/public/assets/logos")
DEST_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

BRANDS = [
    {
        "name": "roland",
        "url": "https://www.roland.com/us/",
        "logo_selectors": ["a.navbar-brand img", ".header-logo img", "img[alt*='Roland']"]
    },
    {
        "name": "boss",
        "url": "https://www.boss.info/us/",
        "logo_selectors": ["a.navbar-brand img", ".header-logo img", "img[alt*='BOSS']"]
    },
    {
        "name": "nord",
        "url": "https://www.nordkeyboards.com",
        "logo_selectors": ["#logo img", ".logo img", "header img"]
    }
]

def download_file(url, filename):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        file_path = DEST_DIR / filename
        with open(file_path, "wb") as f:
            f.write(response.content)
        logger.info(f"✅ Downloaded {filename} from {url}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to download {url}: {e}")
        return False

def scrape_logos():
    logger.info("🚀 Starting Logo Scraper...")
    
    for brand in BRANDS:
        logger.info(f"🔍 Scanning {brand['name']} at {brand['url']}...")
        
        try:
            response = requests.get(brand['url'], headers=HEADERS, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            logo_url = None
            for selector in brand['logo_selectors']:
                img = soup.select_one(selector)
                if img and img.get('src'):
                    logo_url = urljoin(brand['url'], img['src'])
                    logger.info(f"   found logo candidate: {logo_url}")
                    break
            
            if logo_url:
                ext = logo_url.split('.')[-1].split('?')[0].lower()
                if ext not in ['svg', 'png', 'jpg', 'jpeg']:
                    ext = 'png' # Default fallback
                
                filename = f"{brand['name']}_logo.{ext}"
                download_file(logo_url, filename)
            else:
                logger.warning(f"⚠️  Could not find logo for {brand['name']}")
                
        except Exception as e:
            logger.error(f"❌ Error scraping {brand['name']}: {e}")

if __name__ == "__main__":
    scrape_logos()
