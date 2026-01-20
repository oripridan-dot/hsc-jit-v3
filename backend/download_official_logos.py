import os
import requests
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
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
}

# Official URLs from Wikimedia Commons (Reliable, Scrape-Friendly)
LOGOS = {
    "roland": [
        "https://upload.wikimedia.org/wikipedia/commons/2/29/Roland_logo.svg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Roland_logo.svg/2560px-Roland_logo.svg.png"
    ],
    "boss": [
        "https://upload.wikimedia.org/wikipedia/commons/c/c3/Boss_%28Roland%29_logo.svg", 
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Boss_%28Roland%29_logo.svg/2560px-Boss_%28Roland%29_logo.svg.png"
    ],
    "nord": [
        "https://upload.wikimedia.org/wikipedia/commons/d/d3/Nord_logo.svg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Nord_logo.svg/2560px-Nord_logo.svg.png"
    ],
    "moog": [
        "https://upload.wikimedia.org/wikipedia/commons/6/6f/Moog_Synthesizer_Logo.svg",
        "https://upload.wikimedia.org/wikipedia/commons/1/1b/Moog_Music_Logo.svg"
    ]
}

def download_file(url, filename):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            file_path = DEST_DIR / filename
            with open(file_path, "wb") as f:
                f.write(response.content)
            logger.info(f"✅ Downloaded {filename} from {url}")
            return True
        else:
            logger.warning(f"⚠️  {url} returned status {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Failed to download {url}: {e}")
        return False

def fetch_official_logos():
    logger.info("🚀 Starting Official Logo Fetcher...")
    
    for brand, urls in LOGOS.items():
        success = False
        for url in urls:
            logger.info(f"🔍 Trying {brand} at {url}...")
            
            # Determine extension from URL if possible, default to svg if unknown but url says svg
            ext = "svg"
            if ".png" in url.lower():
                ext = "png"
            elif ".jpg" in url.lower():
                ext = "jpg"
            
            filename = f"{brand}_logo.{ext}"
            
            if download_file(url, filename):
                success = True
                break
        
        if not success:
            logger.error(f"❌ Could not download ANY logo for {brand}")

if __name__ == "__main__":
    fetch_official_logos()
