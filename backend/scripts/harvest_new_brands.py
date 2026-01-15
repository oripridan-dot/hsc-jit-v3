#!/usr/bin/env python3
"""
Harvest Halilit data for 20 additional brands
"""

import json
import asyncio
import aiohttp
from pathlib import Path
from bs4 import BeautifulSoup
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).parent.parent
DATA_DIR = BACKEND_DIR / "data"
CATALOGS_HALILIT_DIR = DATA_DIR / "catalogs_halilit"

NEW_BRANDS = {
    "allen-heath": "Allen+Heath",
    "ampeg": "Ampeg",
    "esp": "ESP",
    "eden": "Eden",
    "eve-audio": "Eve+Audio",
    "guild": "Guild",
    "heritage-audio": "Heritage+Audio",
    "hiwatt": "Hiwatt",
    "keith-mcmillen": "Keith+Mcmillen+Instruments+Kmi",
    "lag-guitars": "Lag+Guitars",
    "lynx": "Lynx",
    "maestro": "Maestro+Guitar+Pedals+And+Effects",
    "maton": "Maton+Guitars",
    "medeli": "Medeli",
    "montarbo": "Montarbo",
    "oscar-schmidt": "Oscar+Schmidt+Acoustic+Guitars",
    "perris-leathers": "Perri+S+Leathers",
    "on-stage": "On+Stage",
    "ashdown": "Ashdown+Engineering",
    "tc-electronic": "Tc+Electronic",
}

async def scrape_halilit_brand(session, brand_id, brand_search_name):
    """Scrape Halilit catalog for a brand."""
    products = []
    base_url = f"https://www.halilit.com/search?brand={brand_search_name}"
    
    try:
        async with session.get(base_url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
            if resp.status == 200:
                html = await resp.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract products
                product_items = soup.find_all(['div', 'article'], class_=lambda x: x and ('product' in x.lower() or 'item' in x.lower()))
                
                for item in product_items:
                    try:
                        name_elem = item.find(['h2', 'h3', 'h4', 'a'])
                        if name_elem:
                            name = name_elem.get_text(strip=True)
                            
                            # Extract price if available
                            price_elem = item.find(class_=lambda x: x and 'price' in x.lower())
                            price = price_elem.get_text(strip=True) if price_elem else ""
                            
                            if name and len(name) > 2:
                                products.append({
                                    "name": name,
                                    "price": price,
                                    "brand_id": brand_id,
                                    "source": "halilit"
                                })
                    except:
                        continue
                
                logger.info(f"✅ {brand_id:25} │ {len(products):3} products from Halilit")
            else:
                logger.warning(f"⚠️  {brand_id:25} │ HTTP {resp.status}")
    except Exception as e:
        logger.error(f"❌ {brand_id:25} │ {str(e)[:50]}")
    
    return brand_id, products

async def main():
    """Harvest all new brands from Halilit."""
    logger.info("="*70)
    logger.info("📥 HARVESTING 20 NEW BRANDS FROM HALILIT")
    logger.info("="*70 + "\n")
    
    CATALOGS_HALILIT_DIR.mkdir(parents=True, exist_ok=True)
    
    async with aiohttp.ClientSession() as session:
        tasks = [
            scrape_halilit_brand(session, brand_id, search_name)
            for brand_id, search_name in NEW_BRANDS.items()
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Save catalogs
        total_products = 0
        for brand_id, products in results:
            if products:
                catalog = {
                    "brand_id": brand_id,
                    "products": products,
                    "product_count": len(products),
                    "source": "halilit",
                    "timestamp": "2026-01-15T20:10:00Z"
                }
                
                output_file = CATALOGS_HALILIT_DIR / f"{brand_id}_halilit.json"
                with open(output_file, 'w') as f:
                    json.dump(catalog, f, indent=2)
                
                total_products += len(products)
        
        logger.info("\n" + "="*70)
        logger.info(f"✅ Harvested {total_products} products from 20 new brands")
        logger.info("="*70)

if __name__ == "__main__":
    asyncio.run(main())
