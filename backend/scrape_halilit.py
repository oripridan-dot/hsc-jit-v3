import asyncio
from playwright.async_api import async_playwright
from pathlib import Path
import logging
import aiohttp
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
TARGET_URL = "https://www.halilit.com/pages/4367"
DEST_DIR = Path("../frontend/public/assets/logos")
DEST_DIR.mkdir(parents=True, exist_ok=True)

TARGET_BRANDS = ["roland", "boss", "nord", "moog"]

async def download_image(session, url, filename):
    try:
        async with session.get(url) as resp:
            if resp.status == 200:
                content = await resp.read()
                file_path = DEST_DIR / filename
                file_path.write_bytes(content)
                logger.info(f"✅ Downloaded {filename}")
                return True
            else:
                logger.warning(f"⚠️  Failed to download {url}: Status {resp.status}")
                return False
    except Exception as e:
        logger.error(f"❌ Error downloading {url}: {e}")
        return False

async def scrape_halilit():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        logger.info(f"🚀 Navigating to {TARGET_URL}...")
        try:
            await page.goto(TARGET_URL, timeout=60000)
            await page.wait_for_load_state('networkidle')
        except Exception as e:
            logger.error(f"❌ Navigation failed: {e}")
            await browser.close()
            return

        # Find all images
        images = await page.locator('img').all()
        logger.info(f"🔍 Found {len(images)} images on page. Scanning for target brands...")

        async with aiohttp.ClientSession() as session:
            for i, img in enumerate(images):
                src = await img.get_attribute('src')
                alt = (await img.get_attribute('alt') or "").lower()
                
                # Check parent link
                parent_href = ""
                try:
                    # Get parent element
                    parent = await img.locator('..').element_handle()
                    if parent:
                        tag = await parent.evaluate("el => el.tagName")
                        if tag == 'A':
                            parent_href = (await parent.get_attribute('href') or "").lower()
                except Exception as e:
                    # logger.error(f"Error getting parent: {e}")
                    pass
                
                if i < 20: 
                    logger.info(f"   [Img {i}] Link: {parent_href} | Alt: {alt}")

                if not src:
                    continue
                
                # Fix relative URLs
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = 'https://www.halilit.com' + src
                
                src_lower = src.lower()
                
                # Check against target brands
                for brand in TARGET_BRANDS:
                    is_match = False
                    
                    # Match patterns for URL slugs like ".../33109-roland" or ".../nord"
                    match_patterns = [
                        f"-{brand}",
                        f"/{brand}",
                        f"={brand}",
                        f"manufacturer={brand}"
                    ]
                    
                    if any(p in parent_href for p in match_patterns):
                         is_match = True
                         logger.info(f"   🎯 LINK MATCH for {brand} in {parent_href}")
                    elif f"{brand}" in alt:
                         is_match = True
                         logger.info(f"   🎯 ALT MATCH for {brand}")

                    if is_match:
                        # Determine extension
                        ext = "png"
                        if ".svg" in src_lower:
                            ext = "svg"
                        elif ".jpg" in src_lower or ".jpeg" in src_lower:
                            ext = "jpg"
                        elif ".webp" in src_lower:
                            ext = "webp"
                            
                        filename = f"{brand}_logo.{ext}"
                        
                        logger.info(f"⬇️  Downloading {brand} logo from {src}")
                        await download_image(session, src, filename)
                        
        await browser.close()
        logger.info("🏁 Scraping complete.")

if __name__ == "__main__":
    asyncio.run(scrape_halilit())
