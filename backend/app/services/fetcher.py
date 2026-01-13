import httpx
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
import hashlib
import json
import logging
import os
import time
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContentFetcher:
    """
    Simplified Stateless Content Fetcher.
    
    Uses Redis for TEXT caching (not vectors) to avoid:
    - CPU-intensive embedding calculations
    - Session state complexity
    - Latency on every question
    
    Strategy: Download → Cache TEXT → Feed to LLM's context window
    """
    
    def __init__(self, redis_client=None):
        self.headers = {
            "User-Agent": "HSC-JIT-Speedboat/3.0 (Psychic Engine)"
        }
        self.redis = redis_client  # Optional Redis for TEXT caching
        self.cache_ttl = 3600  # 1 hour text cache

    async def fetch(self, product_data: Dict[str, Any]) -> str:
        """
        Fetches content from various doc types.
        Tries multiple schema formats for backwards compatibility.
        """
        # Try multiple schema formats
        doc_info = product_data.get("documentation") or {}
        url = doc_info.get("url") or product_data.get("manual_url")
        doc_type = doc_info.get("type", "pdf")

        if not url:
            logger.warning(f"No documentation URL for {product_data.get('id')}")
            return ""

        # Check cache first
        cached_text = self._get_cached_text(url)
        if cached_text:
            logger.info(f"⚡ [TEXT CACHE HIT] {url}")
            return cached_text

        # Fetch based on type
        logger.info(f"🔌 [CACHE MISS] Fetching {url}")
        try:
            if doc_type == "pdf":
                text = await self._fetch_pdf(url)
            elif doc_type in ["html", "html_scrape"]:
                text = await self._fetch_html(url)
            else:
                text = await self._fetch_pdf(url)  # Default to PDF
            
            # Cache the TEXT (not vectors)
            if text:
                self._set_cached_text(url, text)
            
            return text
        except Exception as e:
            logger.error(f"Content fetch error: {url}: {e}")
            return ""

    def _get_cached_text(self, url: str) -> Optional[str]:
        """Get cached TEXT from Redis"""
        if not self.redis:
            return None
        try:
            cache_key = self._make_cache_key(url)
            return self.redis.get(cache_key)
        except Exception as e:
            logger.debug(f"Cache GET error: {e}")
            return None

    def _set_cached_text(self, url: str, text: str):
        """Cache TEXT in Redis"""
        if not self.redis:
            return
        try:
            cache_key = self._make_cache_key(url)
            self.redis.setex(cache_key, self.cache_ttl, text)
            logger.info(f"✅ [TEXT CACHED] {cache_key}")
        except Exception as e:
            logger.debug(f"Cache SET error: {e}")

    @staticmethod
    def _make_cache_key(url: str) -> str:
        """Create consistent cache key"""
        return f"doc_text:{hashlib.md5(url.encode()).hexdigest()}"
    async def _fetch_pdf(self, url: str) -> str:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=self.headers)
                if response.status_code == 403:
                    logger.warning(f"PDF access denied (403) {url} - Provider may block automated access")
                    return ""
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
                
                logger.info(f"✅ [PDF LOADED] {url} ({len(text_content)} pages)")
                return "\n".join(text_content)
                
            except Exception as e:
                logger.error(f"PDF Fetch Error {url}: {e}")
                return ""

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
                    text = content.get_text(separator=' ', strip=True)
                    logger.info(f"✅ [HTML LOADED] {url} ({len(text)} chars)")
                    return text
                return ""
                
            except Exception as e:
                logger.error(f"HTML Fetch Error {url}: {e}")
                return ""
