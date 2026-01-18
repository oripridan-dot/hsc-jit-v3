#!/usr/bin/env python3
"""
Comprehensive Roland Scraper Test Suite
========================================
Tests all critical components with proper timeout handling
"""

import asyncio
import logging
import sys
from pathlib import Path
from datetime import datetime

# Add paths
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / 'models'))

from services.roland_scraper import RolandScraper
from core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_navigation():
    """Test 1: Basic navigation with timeout"""
    logger.info("🧪 TEST 1: Basic Navigation with Timeout")
    
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # Test navigation to main page
            await page.goto("https://www.roland.com/global/products/", 
                          wait_until='domcontentloaded', 
                          timeout=15000)
            logger.info("   ✅ Main products page accessible")
            
            # Test navigation to a category
            await page.goto("https://www.roland.com/global/categories/pianos/", 
                          wait_until='domcontentloaded', 
                          timeout=15000)
            logger.info("   ✅ Category page accessible")
            
            return True
        except Exception as e:
            logger.error(f"   ❌ Navigation test failed: {e}")
            return False
        finally:
            await browser.close()


async def test_product_url_discovery():
    """Test 2: Product URL discovery with strict timeout"""
    logger.info("🧪 TEST 2: Product URL Discovery (Limited)")
    
    scraper = RolandScraper()
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # Test with max_products=3 and strict timeout
            start_time = datetime.now()
            
            # Use timeout wrapper
            try:
                urls = await asyncio.wait_for(
                    scraper._get_product_urls(page, max_products=3),
                    timeout=60  # 60 second hard limit
                )
                
                elapsed = (datetime.now() - start_time).total_seconds()
                logger.info(f"   ✅ Found {len(urls)} URLs in {elapsed:.2f}s")
                
                if len(urls) > 0:
                    logger.info(f"   Sample URL: {urls[0]}")
                return True
                
            except asyncio.TimeoutError:
                logger.error("   ❌ Product discovery timed out after 60s")
                return False
                
        except Exception as e:
            logger.error(f"   ❌ Product discovery failed: {e}")
            return False
        finally:
            await browser.close()


async def test_single_product_scrape():
    """Test 3: Single product page scraping"""
    logger.info("🧪 TEST 3: Single Product Page Scraping")
    
    scraper = RolandScraper()
    from playwright.async_api import async_playwright
    
    # Test with a known Roland product
    test_url = "https://www.roland.com/global/products/aerophone_ae-10/"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            start_time = datetime.now()
            
            # Wrap in timeout
            try:
                product = await asyncio.wait_for(
                    scraper._scrape_product_page(page, test_url),
                    timeout=30  # 30 second limit per product
                )
                
                elapsed = (datetime.now() - start_time).total_seconds()
                
                if product:
                    logger.info(f"   ✅ Scraped product in {elapsed:.2f}s")
                    logger.info(f"   Name: {product.name}")
                    logger.info(f"   Category: {product.main_category}")
                    logger.info(f"   Images: {len(product.images)}")
                    return True
                else:
                    logger.error("   ❌ No product data extracted")
                    return False
                    
            except asyncio.TimeoutError:
                logger.error("   ❌ Product scrape timed out after 30s")
                return False
                
        except Exception as e:
            logger.error(f"   ❌ Product scrape failed: {e}")
            return False
        finally:
            await browser.close()


async def test_full_pipeline():
    """Test 4: Full scraping pipeline with 3 products"""
    logger.info("🧪 TEST 4: Full Pipeline (3 Products)")
    
    scraper = RolandScraper()
    
    try:
        start_time = datetime.now()
        
        # Wrap entire scrape in timeout
        try:
            catalog = await asyncio.wait_for(
                scraper.scrape_all_products(max_products=3),
                timeout=120  # 2 minute hard limit
            )
            
            elapsed = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"   ✅ Pipeline completed in {elapsed:.2f}s")
            logger.info(f"   Products: {len(catalog.products)}")
            logger.info(f"   Brand: {catalog.brand_identity.name}")
            
            if catalog.products:
                for i, p in enumerate(catalog.products[:3], 1):
                    logger.info(f"   [{i}] {p.name} ({p.main_category})")
            
            return True
            
        except asyncio.TimeoutError:
            logger.error("   ❌ Full pipeline timed out after 120s")
            return False
            
    except Exception as e:
        logger.error(f"   ❌ Full pipeline failed: {e}")
        return False


async def main():
    """Run all tests"""
    logger.info("=" * 60)
    logger.info("🚀 ROLAND SCRAPER COMPREHENSIVE TEST SUITE")
    logger.info("=" * 60)
    
    tests = [
        ("Navigation", test_navigation),
        ("Product URL Discovery", test_product_url_discovery),
        ("Single Product Scrape", test_single_product_scrape),
        ("Full Pipeline", test_full_pipeline),
    ]
    
    results = []
    
    for name, test_func in tests:
        logger.info(f"\n{'=' * 60}")
        try:
            result = await test_func()
            results.append((name, result))
        except Exception as e:
            logger.error(f"Test '{name}' crashed: {e}")
            results.append((name, False))
        
        await asyncio.sleep(2)  # Cool down between tests
    
    # Summary
    logger.info(f"\n{'=' * 60}")
    logger.info("📊 TEST SUMMARY")
    logger.info("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"{status} - {name}")
    
    logger.info(f"\nTotal: {passed}/{total} tests passed")
    logger.info("=" * 60)
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
