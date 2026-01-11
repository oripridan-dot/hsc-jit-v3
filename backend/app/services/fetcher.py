import httpx
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
import redis
import hashlib
import json
import logging
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Redis
# Use decode_responses=False to handle potential binary data if we were caching files,
# but we are caching extracted text (strings). So True is fine.
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

def cache_decorator(ttl_seconds: int = 600):
    def decorator(func):
        async def wrapper(self, url: str, *args, **kwargs):
            if not redis_client:
                return await func(self, url, *args, **kwargs)
            
            # Create a cache key based on the URL
            raw_key = f"fetch_cache:{url}"
            # Hash it to be safe and short
            cache_key = hashlib.md5(raw_key.encode()).hexdigest()
            
            cached_data = redis_client.get(cache_key)
            if cached_data:
                logger.info(f"⚡ [Cache Hit] {url}")
                return cached_data
            
            logger.info(f"🔌 [Cache Miss] Fetching {url}")
            result = await func(self, url, *args, **kwargs)
            
            if result:
                redis_client.setex(cache_key, ttl_seconds, result)
            
            return result
        return wrapper
    return decorator

class ContentFetcher:
    def __init__(self):
        self.headers = {
            "User-Agent": "HSC-JIT-Speedboat/3.0 (Psychic Engine)"
        }

    async def fetch(self, product_data: Dict[str, Any]) -> str:
        """
        Fetches and extracts text content based on product documentation type.
        """
        doc_info = product_data.get("documentation", {})
        doc_type = doc_info.get("type")
        url = doc_info.get("url")

        if not url:
            return ""

        if doc_type == "pdf":
            return await self._fetch_pdf(url)
        elif doc_type in ["html", "html_scrape"]:
            return await self._fetch_html(url)
        else:
            logger.warning(f"Unknown doc type: {doc_type} for {url}")
            return ""

    @cache_decorator(ttl_seconds=600)
    async def _fetch_pdf(self, url: str) -> str:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                # Load PDF from bytes
                # We need to do this synchronously as PyMuPDF is sync, or run in executor.
                # Since we are "Speedboat", simple sync block is acceptable if files aren't huge.
                # But it blocks the event loop.
                # For this implementation, I'll keep it simple as requested.
                
                doc = fitz.open(stream=response.content, filetype="pdf")
                text_content = []
                for page in doc:
                    text_content.append(page.get_text())
                
                return "\n".join(text_content)
                
            except Exception as e:
                logger.error(f"PDF Fetch Error {url}: {e}")
                return ""

    @cache_decorator(ttl_seconds=600)
    async def _fetch_html(self, url: str) -> str:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract text from main content if possible, or body
                # Simple heuristic: try 'main', 'article', then 'body'
                content = soup.find('main') or soup.find('article') or soup.body
                
                if content:
                    return content.get_text(separator=' ', strip=True)
                return ""
                
            except Exception as e:
                logger.error(f"HTML Fetch Error {url}: {e}")
                return ""
