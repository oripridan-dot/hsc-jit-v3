import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.halilit_direct_scraper import HalilitDirectScraper

scraper = HalilitDirectScraper()
brand_url = "https://www.halilit.com/g/5193-%D7%99%D7%A6%D7%A8%D7%9F/33109-Roland"
print(f"Scraping Roland from {brand_url}")
scraper.scrape_brand("roland", brand_url)
