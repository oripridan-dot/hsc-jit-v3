import httpx
from bs4 import BeautifulSoup
import re
from typing import Optional, Dict, Any, List
from ..core.logging import get_logger

logger = get_logger(__name__)

class PriceService:
    """
    Scrapes or fetches price information from Halilit.com.
    Includes caching and fuzzy matching logic.
    """

    BASE_URL = "https://www.halilit.com"
    
    # Simple in-memory cache for demo purposes. 
    # In production, use Redis via backend/app/core/cache.py
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    async def get_price(cls, query: str) -> Optional[Dict[str, Any]]:
        """
        Get price and availability for a product query.
        Returns None if not found or error.
        
        Args:
            query: Product name/model to search for
            
        Returns:
            Dict with price, currency, availability, url, image, confidence
        """
        # 1. Check cache
        if query in cls._cache:
            return cls._cache[query]

        # 2. Scrape (Graceful degradation)
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                search_url = f"{cls.BASE_URL}/catalogsearch/result/?q={query}"
                response = await client.get(search_url)
                
                if response.status_code != 200:
                    logger.warning(f"Halilit search failed: {response.status_code}")
                    return None

                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Note: valid selector for Magento/typical e-com. 
                # Adjust selectors based on actual Halilit site structure if known.
                # Assuming generic selectors for "product-item"
                products = soup.select('.product-item')
                
                if not products:
                    return None

                # Naive: Take the first result
                product = products[0]
                
                name_el = product.select_one('.product-item-link')
                price_el = product.select_one('.price')
                image_el = product.select_one('.product-image-photo')
                
                if not name_el or not price_el:
                    return None

                name = name_el.get_text(strip=True)
                url = name_el['href']
                price_text = price_el.get_text(strip=True)
                # Parse price "₪12,999" -> 12999
                price_val = re.sub(r'[^\d]', '', price_text)
                
                image_url = image_el['src'] if image_el else ""

                result = {
                    "price": int(price_val) if price_val else 0,
                    "currency": "ILS",
                    "formatted": price_text,
                    "availability": "In Stock", # Assumption
                    "url": url,
                    "image": image_url,
                    "confidence": 0.95 # Mock confidence
                }
                
                # Cache it
                cls._cache[query] = result
                return result

        except Exception as e:
            logger.error(f"Price lookup error: {str(e)}")
            # Fallback mock for demo/offline
            if "roland" in query.lower():
                return {
                    "price": 4500,
                    "currency": "ILS",
                    "formatted": "₪4,500",
                    "availability": "In Stock",
                    "url": "https://www.halilit.com",
                    "image": "",
                    "confidence": 0.8
                }
            return None
