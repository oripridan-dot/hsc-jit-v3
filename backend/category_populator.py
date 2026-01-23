"""
🎯 CATEGORY POPULATOR - Systematic Category Thumbnail Scraper
=============================================================

Purpose: Populate ALL categories with 3 TOP products from EACH brand
This ensures we have proper contextual thumbnail images for the selection process.

Strategy:
1. Map each of the 8 UI categories to brand-specific category URLs
2. Scrape exactly 3 TOP/flagship products per brand (total, not per category)
3. Download high-quality product images (white background preferred)
4. Output structured JSON for the selection process

Result:
- Guaranteed coverage: 3 top products × N brands = flagship product representation
- Ready for thumbnail selection: Best image picked per category
- Full category tree population with flagship products

Usage:
    python3 category_populator.py

Output:
    data/category_population/
    ├── category_index.json      # Summary of all scraped categories
    ├── keys/                    # Each category gets its own folder
    │   ├── roland/
    │   │   └── products.json
    │   ├── boss/
    │   ├── nord/
    │   └── ...
    ├── drums/
    ├── guitars/
    └── ...
"""

import asyncio
import json
import logging
import os
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from playwright.async_api import async_playwright, Page, Browser
import aiohttp
import hashlib

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

OUTPUT_DIR = Path("./data/category_population")
IMAGE_DIR = Path("../frontend/public/data/product_images")
TOP_PRODUCTS_PER_BRAND = 3  # Scrape 3 TOP products from each brand (total)

# =============================================================================
# THE 8 UI CATEGORIES (Consolidated)
# =============================================================================

UI_CATEGORIES = [
    {"id": "keys", "label": "Keys & Pianos", "icon": "🎹"},
    {"id": "drums", "label": "Drums & Percussion", "icon": "🥁"},
    {"id": "guitars", "label": "Guitars & Amps", "icon": "🎸"},
    {"id": "studio", "label": "Studio & Recording", "icon": "🎙️"},
    {"id": "live", "label": "Live Sound", "icon": "🔊"},
    {"id": "dj", "label": "DJ & Production", "icon": "🎧"},
    {"id": "software", "label": "Software & Cloud", "icon": "💻"},
    {"id": "accessories", "label": "Accessories", "icon": "🔧"},
]

# =============================================================================
# FLAGSHIP PRODUCTS - Hardcoded top products per brand for reliable thumbnails
# These are the brand's most recognizable, flagship products
# Include direct image URLs where possible for 100% reliability
# =============================================================================

FLAGSHIP_PRODUCTS: Dict[str, List[Dict[str, Any]]] = {
    "roland": [
        {
            "name": "FANTOM-8", 
            "category": "keys", 
            "subcategory": "synthesizers", 
            "url": "/global/products/fantom-8/",
            "image": "https://static.roland.com/assets/images/products/gallery/fantom-8_top_gal.jpg"
        },
        {
            "name": "RD-2000", 
            "category": "keys", 
            "subcategory": "stage_pianos", 
            "url": "/global/products/rd-2000/",
            "image": "https://static.roland.com/assets/images/products/gallery/rd-2000_top_gal.jpg"
        },
        {
            "name": "TD-50K2", 
            "category": "drums", 
            "subcategory": "v_drums", 
            "url": "/global/products/td-50k2/",
            "image": "https://static.roland.com/assets/images/products/gallery/td-50k2_top_gal.jpg"
        },
    ],
    "boss": [
        {
            "name": "KATANA-100 MkII", 
            "category": "guitars", 
            "subcategory": "amplifiers", 
            "url": "/global/products/katana-100_mk2/",
            "image": "https://static.boss.info/global/products/katana-100_mk2/images/top/gal_01.jpg"
        },
        {
            "name": "GT-1000", 
            "category": "guitars", 
            "subcategory": "multi_effects", 
            "url": "/global/products/gt-1000/",
            "image": "https://static.boss.info/global/products/gt-1000/images/top/gal_01.jpg"
        },
        {
            "name": "RC-505mkII", 
            "category": "dj", 
            "subcategory": "loop_station", 
            "url": "/global/products/rc-505mkii/",
            "image": "https://static.boss.info/global/products/rc-505mkii/images/top/gal_01.jpg"
        },
    ],
    "nord": [
        {
            "name": "Nord Stage 4 88", 
            "category": "keys", 
            "subcategory": "stage", 
            "url": "/products/nord-stage-4/",
            "image": "https://assets.nordkeyboards.com/nord-assets-prod/media/images/products/nord-stage-4/nord-stage-4-88-side.png"
        },
        {
            "name": "Nord Piano 5 88", 
            "category": "keys", 
            "subcategory": "piano", 
            "url": "/products/nord-piano-5/",
            "image": "https://assets.nordkeyboards.com/nord-assets-prod/media/images/products/nord-piano-5/nord-piano-5-88-side.png"
        },
        {
            "name": "Nord Electro 7 HP", 
            "category": "keys", 
            "subcategory": "electro", 
            "url": "/products/nord-electro-7/",
            "image": "https://assets.nordkeyboards.com/nord-assets-prod/media/images/products/nord-electro-7/nord-electro-7-hp-side.png"
        },
    ],
    "moog": [
        {
            "name": "Moog One 16", 
            "category": "keys", 
            "subcategory": "synthesizers", 
            "url": "/products/moog-one/",
            "image": "https://www.moogmusic.com/sites/default/files/2022-05/Moog_One_16_Angled_2022.png"
        },
        {
            "name": "Subsequent 37", 
            "category": "keys", 
            "subcategory": "synthesizers", 
            "url": "/products/subsequent-37/",
            "image": "https://www.moogmusic.com/sites/default/files/2022-06/subsequent37_Top_2022.png"
        },
        {
            "name": "Matriarch", 
            "category": "keys", 
            "subcategory": "synthesizers", 
            "url": "/products/matriarch/",
            "image": "https://www.moogmusic.com/sites/default/files/2022-06/matriarch_Top_2022.png"
        },
    ],
    "universal-audio": [
        {
            "name": "Apollo Twin X", 
            "category": "studio", 
            "subcategory": "audio_interfaces", 
            "url": "/audio-interfaces/apollo-twin-x/",
            "image": "https://www.uaudio.com/cdn/shop/files/apollo_twin_x_gallery_1.jpg"
        },
        {
            "name": "Apollo x8p", 
            "category": "studio", 
            "subcategory": "audio_interfaces", 
            "url": "/audio-interfaces/apollo-x8p/",
            "image": "https://www.uaudio.com/cdn/shop/files/apollo_x8p_gallery_1.jpg"
        },
        {
            "name": "Volt 276", 
            "category": "studio", 
            "subcategory": "audio_interfaces", 
            "url": "/audio-interfaces/volt-276/",
            "image": "https://www.uaudio.com/cdn/shop/files/volt276_gallery_1.jpg"
        },
    ],
    "adam-audio": [
        {
            "name": "A77H", 
            "category": "studio", 
            "subcategory": "studio_monitors", 
            "url": "/en/studio-monitors/a-series/a77h/",
            "image": "https://www.adam-audio.com/content/uploads/2021/04/adam-audio-a77h-studio-monitor-front.jpg"
        },
        {
            "name": "T7V", 
            "category": "studio", 
            "subcategory": "studio_monitors", 
            "url": "/en/studio-monitors/t-series/t7v/",
            "image": "https://www.adam-audio.com/content/uploads/2021/04/adam-audio-t7v-studio-monitor-front.jpg"
        },
        {
            "name": "S3H", 
            "category": "studio", 
            "subcategory": "studio_monitors", 
            "url": "/en/studio-monitors/s-series/s3h/",
            "image": "https://www.adam-audio.com/content/uploads/2021/04/adam-audio-s3h-studio-monitor-front.jpg"
        },
    ],
    "akai-professional": [
        {
            "name": "MPC Live II", 
            "category": "dj", 
            "subcategory": "mpc", 
            "url": "/products/mpc-live-ii/",
            "image": "https://www.akaipro.com/assets/images/products/mpc-live-ii/mpc-live-ii-angle.png"
        },
        {
            "name": "MPC One+", 
            "category": "dj", 
            "subcategory": "mpc", 
            "url": "/products/mpc-one-plus/",
            "image": "https://www.akaipro.com/assets/images/products/mpc-one-plus/mpc-one-plus-angle.png"
        },
        {
            "name": "MPK Mini MK3", 
            "category": "keys", 
            "subcategory": "midi_controllers", 
            "url": "/products/mpk-mini-mk3/",
            "image": "https://www.akaipro.com/assets/images/products/mpk-mini-mk3/mpk-mini-mk3-angle.png"
        },
    ],
    "teenage-engineering": [
        {
            "name": "OP-1 Field", 
            "category": "keys", 
            "subcategory": "synthesizers", 
            "url": "/store/op-1-field/",
            "image": "https://teenage.engineering/_img/store/op-1-field/op-1-field-angle-1.png"
        },
        {
            "name": "EP-133 K.O. II", 
            "category": "dj", 
            "subcategory": "samplers", 
            "url": "/store/ep-133/",
            "image": "https://teenage.engineering/_img/store/ep-133/ep-133-angle-1.png"
        },
        {
            "name": "OP-Z", 
            "category": "dj", 
            "subcategory": "sequencers", 
            "url": "/store/op-z/",
            "image": "https://teenage.engineering/_img/store/op-z/op-z-angle-1.png"
        },
    ],
    "mackie": [
        {
            "name": "CR3-X", 
            "category": "studio", 
            "subcategory": "studio_monitors", 
            "url": "/products/cr3-x/",
            "image": "https://mackie.com/img/product_images/CR3-X_Front_Pair.png"
        },
        {
            "name": "ProFX12v3", 
            "category": "live", 
            "subcategory": "mixers", 
            "url": "/products/profx12v3/",
            "image": "https://mackie.com/img/product_images/ProFXv3_12ch_Top.png"
        },
        {
            "name": "Thump15A", 
            "category": "live", 
            "subcategory": "powered_speakers", 
            "url": "/products/thump15a/",
            "image": "https://mackie.com/img/product_images/Thump15A_Front.png"
        },
    ],
    "warm-audio": [
        {
            "name": "WA-87 R2", 
            "category": "studio", 
            "subcategory": "microphones", 
            "url": "/wa-87-r2/",
            "image": "https://warmaudio.com/wp-content/uploads/2022/01/WA-87-R2-Nickel-Front.png"
        },
        {
            "name": "WA-2A", 
            "category": "studio", 
            "subcategory": "compressors", 
            "url": "/wa-2a/",
            "image": "https://warmaudio.com/wp-content/uploads/2019/01/WA-2A-Front.png"
        },
        {
            "name": "WA73-EQ", 
            "category": "studio", 
            "subcategory": "preamps", 
            "url": "/wa73-eq/",
            "image": "https://warmaudio.com/wp-content/uploads/2019/01/WA73-EQ-Front.png"
        },
    ],
}

BRAND_CATEGORY_URLS: Dict[str, Dict[str, List[Dict[str, str]]]] = {
    # ─────────────────────────────────────────────────────────────────────────
    # ROLAND
    # ─────────────────────────────────────────────────────────────────────────
    "roland": {
        "base_url": "https://www.roland.com/global",
        "categories": {
            "keys": [
                {"url": "/categories/pianos/", "subcategory": "pianos"},
                {"url": "/categories/pianos/grand_pianos/", "subcategory": "grand_pianos"},
                {"url": "/categories/pianos/portable_pianos/", "subcategory": "portable_pianos"},
                {"url": "/categories/pianos/stage_pianos/", "subcategory": "stage_pianos"},
                {"url": "/categories/synthesizers/", "subcategory": "synthesizers"},
                {"url": "/categories/synthesizers/analog_modeling/", "subcategory": "analog_modeling"},
                {"url": "/categories/keyboards/", "subcategory": "keyboards"},
                {"url": "/categories/organs/", "subcategory": "organs"},
            ],
            "drums": [
                {"url": "/categories/drums_percussion/", "subcategory": "drums_percussion"},
                {"url": "/categories/drums_percussion/v_drums/", "subcategory": "v_drums"},
                {"url": "/categories/drums_percussion/electronic_percussion/", "subcategory": "electronic_percussion"},
                {"url": "/categories/drums_percussion/hybrid_drums/", "subcategory": "hybrid_drums"},
            ],
            "guitars": [
                {"url": "/categories/guitar_bass/", "subcategory": "guitar_bass"},
                {"url": "/categories/guitar_bass/effects_processors/", "subcategory": "effects_processors"},
                {"url": "/categories/amplifiers/", "subcategory": "amplifiers"},
                {"url": "/categories/amplifiers/guitar_amplifiers/", "subcategory": "guitar_amplifiers"},
            ],
            "studio": [
                {"url": "/categories/production/", "subcategory": "production"},
                {"url": "/categories/production/audio_interfaces/", "subcategory": "audio_interfaces"},
                {"url": "/categories/production/mixers/", "subcategory": "mixers"},
                {"url": "/categories/wind_instruments/", "subcategory": "wind_instruments"},
            ],
            "live": [
                {"url": "/categories/amplifiers/keyboard_amplifiers/", "subcategory": "keyboard_amplifiers"},
                {"url": "/categories/amplifiers/bass_amplifiers/", "subcategory": "bass_amplifiers"},
            ],
            "dj": [
                {"url": "/categories/aira/", "subcategory": "aira"},
                {"url": "/categories/aira/aira_compact/", "subcategory": "aira_compact"},
            ],
            "software": [
                {"url": "/categories/roland_cloud/", "subcategory": "roland_cloud"},
            ],
            "accessories": [
                {"url": "/categories/accessories/", "subcategory": "accessories"},
                {"url": "/categories/accessories/cables/", "subcategory": "cables"},
                {"url": "/categories/accessories/headphones/", "subcategory": "headphones"},
                {"url": "/categories/accessories/stands/", "subcategory": "stands"},
                {"url": "/categories/accessories/pedals/", "subcategory": "pedals"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # BOSS
    # ─────────────────────────────────────────────────────────────────────────
    "boss": {
        "base_url": "https://www.boss.info/global",
        "categories": {
            "guitars": [
                {"url": "/products/effects/", "subcategory": "effects_pedals"},
                {"url": "/products/effects/distortion_overdrive/", "subcategory": "distortion"},
                {"url": "/products/effects/modulation/", "subcategory": "modulation"},
                {"url": "/products/effects/delay_reverb/", "subcategory": "delay_reverb"},
                {"url": "/products/multi_effects/", "subcategory": "multi_effects"},
                {"url": "/products/guitar_synthesizers/", "subcategory": "guitar_synths"},
                {"url": "/products/amplifiers/", "subcategory": "amplifiers"},
            ],
            "keys": [
                {"url": "/products/keyboards/", "subcategory": "keyboards"},
            ],
            "studio": [
                {"url": "/products/mixers_audio_solutions/", "subcategory": "mixers_audio"},
                {"url": "/products/vocal_effects/", "subcategory": "vocal_effects"},
            ],
            "live": [
                {"url": "/products/wireless/", "subcategory": "wireless"},
            ],
            "dj": [
                {"url": "/products/loop_station/", "subcategory": "loop_station"},
            ],
            "accessories": [
                {"url": "/products/accessories/", "subcategory": "accessories"},
                {"url": "/products/tuners_metronomes/", "subcategory": "tuners"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # NORD
    # ─────────────────────────────────────────────────────────────────────────
    "nord": {
        "base_url": "https://www.nordkeyboards.com",
        "categories": {
            "keys": [
                {"url": "/products/nord-stage-4/", "subcategory": "stage"},
                {"url": "/products/nord-piano-5/", "subcategory": "piano"},
                {"url": "/products/nord-electro-6/", "subcategory": "electro"},
                {"url": "/products/nord-grand/", "subcategory": "grand"},
                {"url": "/products/nord-lead/", "subcategory": "lead"},
                {"url": "/products/nord-wave-2/", "subcategory": "wave"},
            ],
            "drums": [
                {"url": "/products/nord-drum-3p/", "subcategory": "drum"},
            ],
            "software": [
                {"url": "/software/", "subcategory": "software"},
            ],
            "accessories": [
                {"url": "/accessories/", "subcategory": "accessories"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MOOG
    # ─────────────────────────────────────────────────────────────────────────
    "moog": {
        "base_url": "https://www.moogmusic.com",
        "categories": {
            "keys": [
                {"url": "/synthesizers/", "subcategory": "synthesizers"},
                {"url": "/synthesizers/moog-one/", "subcategory": "moog_one"},
                {"url": "/synthesizers/matriarch/", "subcategory": "matriarch"},
                {"url": "/synthesizers/subsequent-37/", "subcategory": "subsequent"},
                {"url": "/synthesizers/grandmother/", "subcategory": "grandmother"},
            ],
            "dj": [
                {"url": "/semi-modular/", "subcategory": "semi_modular"},
            ],
            "accessories": [
                {"url": "/accessories/", "subcategory": "accessories"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # UNIVERSAL AUDIO
    # ─────────────────────────────────────────────────────────────────────────
    "universal-audio": {
        "base_url": "https://www.uaudio.com",
        "categories": {
            "studio": [
                {"url": "/audio-interfaces/", "subcategory": "audio_interfaces"},
                {"url": "/apollo-interfaces/", "subcategory": "apollo"},
            ],
            "software": [
                {"url": "/uad-plugins/", "subcategory": "plugins"},
            ],
            "accessories": [
                {"url": "/accessories/", "subcategory": "accessories"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # ADAM AUDIO
    # ─────────────────────────────────────────────────────────────────────────
    "adam-audio": {
        "base_url": "https://www.adam-audio.com",
        "categories": {
            "studio": [
                {"url": "/studio-monitors/", "subcategory": "studio_monitors"},
                {"url": "/a-series/", "subcategory": "a_series"},
                {"url": "/t-series/", "subcategory": "t_series"},
                {"url": "/s-series/", "subcategory": "s_series"},
            ],
            "accessories": [
                {"url": "/accessories/", "subcategory": "accessories"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # AKAI PROFESSIONAL
    # ─────────────────────────────────────────────────────────────────────────
    "akai-professional": {
        "base_url": "https://www.akaipro.com",
        "categories": {
            "dj": [
                {"url": "/mpc/", "subcategory": "mpc"},
                {"url": "/standalone/", "subcategory": "standalone"},
            ],
            "keys": [
                {"url": "/keyboard-controllers/", "subcategory": "midi_controllers"},
            ],
            "drums": [
                {"url": "/pad-controllers/", "subcategory": "pad_controllers"},
            ],
            "accessories": [
                {"url": "/accessories/", "subcategory": "accessories"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # TEENAGE ENGINEERING
    # ─────────────────────────────────────────────────────────────────────────
    "teenage-engineering": {
        "base_url": "https://teenage.engineering",
        "categories": {
            "keys": [
                {"url": "/products/op-1", "subcategory": "op1"},
            ],
            "dj": [
                {"url": "/products/ep-133", "subcategory": "ep133"},
                {"url": "/products/op-z", "subcategory": "opz"},
                {"url": "/products/po-series", "subcategory": "pocket_operators"},
            ],
            "accessories": [
                {"url": "/products/accessories", "subcategory": "accessories"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MACKIE
    # ─────────────────────────────────────────────────────────────────────────
    "mackie": {
        "base_url": "https://mackie.com",
        "categories": {
            "studio": [
                {"url": "/studio-monitors/", "subcategory": "studio_monitors"},
                {"url": "/mixers/", "subcategory": "mixers"},
            ],
            "live": [
                {"url": "/pa-systems/", "subcategory": "pa_systems"},
                {"url": "/powered-speakers/", "subcategory": "powered_speakers"},
            ],
            "accessories": [
                {"url": "/accessories/", "subcategory": "accessories"},
            ],
        }
    },

    # ─────────────────────────────────────────────────────────────────────────
    # WARM AUDIO
    # ─────────────────────────────────────────────────────────────────────────
    "warm-audio": {
        "base_url": "https://warmaudio.com",
        "categories": {
            "studio": [
                {"url": "/microphones/", "subcategory": "microphones"},
                {"url": "/preamps/", "subcategory": "preamps"},
                {"url": "/compressors/", "subcategory": "compressors"},
                {"url": "/eq/", "subcategory": "eq"},
            ],
            "accessories": [
                {"url": "/accessories/", "subcategory": "accessories"},
            ],
        }
    },
}


# =============================================================================
# DATA STRUCTURES
# =============================================================================

@dataclass
class ScrapedProduct:
    """A product scraped for category population"""
    id: str
    name: str
    brand: str
    category_ui: str  # The consolidated UI category (keys, drums, etc.)
    category_original: str  # The brand's original category
    subcategory: str
    description: str = ""
    image_url: str = ""
    image_local: str = ""
    product_url: str = ""
    price: Optional[str] = None
    is_flagship: bool = False  # Is this a top/flagship product?
    scraped_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class BrandPopulation:
    """Population status for a single brand"""
    brand_id: str
    brand_name: str
    top_products: List[ScrapedProduct] = field(default_factory=list)
    categories_covered: List[str] = field(default_factory=list)
    total_products: int = 0


# =============================================================================
# SCRAPER CLASS
# =============================================================================

class CategoryPopulator:
    """Main scraper for systematic category population - 3 TOP products per brand"""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.session: Optional[aiohttp.ClientSession] = None
        self.brand_results: Dict[str, BrandPopulation] = {}
        
        # Initialize results structure for each brand
        for brand_id in FLAGSHIP_PRODUCTS.keys():
            self.brand_results[brand_id] = BrandPopulation(
                brand_id=brand_id,
                brand_name=brand_id.replace("-", " ").title()
            )

    async def initialize(self):
        """Initialize browser and HTTP session"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu']
        )
        self.session = aiohttp.ClientSession()
        logger.info("✅ Browser and session initialized")

    async def cleanup(self):
        """Cleanup resources"""
        if self.browser:
            await self.browser.close()
        if self.session:
            await self.session.close()
        logger.info("✅ Resources cleaned up")

    async def scrape_flagship_products(
        self, 
        brand_id: str
    ) -> List[ScrapedProduct]:
        """
        Scrape the 3 flagship products from a brand.
        Uses direct image URLs when available, falls back to page scraping.
        """
        products: List[ScrapedProduct] = []
        flagship_list = FLAGSHIP_PRODUCTS.get(brand_id, [])
        brand_config = BRAND_CATEGORY_URLS.get(brand_id, {})
        base_url = brand_config.get("base_url", "")
        
        page = await self.browser.new_page()
        
        try:
            for flagship in flagship_list[:TOP_PRODUCTS_PER_BRAND]:
                product_url = base_url + flagship["url"]
                logger.info(f"  📦 Fetching: {flagship['name']}")
                
                # Check if we have a direct image URL
                direct_image = flagship.get("image", "")
                image_url = ""
                
                if direct_image:
                    # Use direct image URL - verify it's accessible
                    try:
                        async with self.session.head(direct_image, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                            if resp.status == 200:
                                image_url = direct_image
                                logger.info(f"     ✅ Direct image URL verified")
                            else:
                                logger.info(f"     ⚠️ Direct image returned {resp.status}, will try page scrape")
                    except Exception as e:
                        logger.info(f"     ⚠️ Direct image failed: {str(e)[:30]}, will try page scrape")
                
                # If no direct image or it failed, try scraping the page
                if not image_url:
                    try:
                        await page.goto(product_url, timeout=30000, wait_until="domcontentloaded")
                        await asyncio.sleep(1)
                        image_url = await self._extract_product_image(page, brand_id)
                    except Exception as e:
                        logger.warning(f"     ⚠️ Page scrape failed: {str(e)[:50]}")
                
                # Generate product ID
                product_id = self._generate_product_id(brand_id, flagship["name"])
                
                product = ScrapedProduct(
                    id=product_id,
                    name=flagship["name"],
                    brand=brand_id,
                    category_ui=flagship["category"],
                    category_original=flagship["subcategory"],
                    subcategory=flagship["subcategory"],
                    image_url=image_url,
                    product_url=product_url,
                    is_flagship=True
                )
                
                products.append(product)
                
                # Track category coverage
                if flagship["category"] not in self.brand_results[brand_id].categories_covered:
                    self.brand_results[brand_id].categories_covered.append(flagship["category"])
                
                if image_url:
                    logger.info(f"     ✅ Got image: {image_url[:60]}...")
                else:
                    logger.info(f"     ⚠️ No image found")
                    
        finally:
            await page.close()
            
        return products

    async def _extract_product_image(self, page: Page, brand_id: str) -> str:
        """Extract the main product image from a product page"""
        
        # Brand-specific image selectors (prioritized)
        IMAGE_SELECTORS = {
            "roland": [
                "img.product-main-image",
                ".product-hero img",
                ".product-gallery img:first-child",
                "[class*='product'] img[src*='roland']",
                "img[alt*='product']",
            ],
            "boss": [
                "img.product-image",
                ".product-hero img",
                "[class*='product'] img",
            ],
            "nord": [
                ".product-image img",
                "img[class*='product']",
                ".hero-image img",
            ],
            "moog": [
                ".product-image img",
                "img[class*='synth']",
                ".hero img",
            ],
            "universal-audio": [
                ".product-hero img",
                "img[class*='product']",
                ".product-image img",
            ],
            "adam-audio": [
                ".product-image img",
                "img[class*='product']",
            ],
            "akai-professional": [
                ".product-hero img",
                "img[class*='product']",
            ],
            "teenage-engineering": [
                "img[class*='product']",
                ".product-image img",
            ],
            "mackie": [
                ".product-image img",
                "img[class*='product']",
            ],
            "warm-audio": [
                ".product-image img",
                "img[class*='product']",
            ],
        }
        
        # Generic fallback selectors
        generic_selectors = [
            "main img:first-of-type",
            "article img:first-of-type",
            "[role='main'] img:first-of-type",
            "img[src*='product']",
            "img[src*='hero']",
            "img[width][height]",
        ]
        
        selectors = IMAGE_SELECTORS.get(brand_id, []) + generic_selectors
        
        for selector in selectors:
            try:
                img = await page.query_selector(selector)
                if img:
                    src = await img.get_attribute("src") or await img.get_attribute("data-src")
                    if src and len(src) > 10 and not src.endswith(".svg"):
                        # Make absolute URL if relative
                        if src.startswith("//"):
                            src = "https:" + src
                        elif src.startswith("/"):
                            base = BRAND_CATEGORY_URLS.get(brand_id, {}).get("base_url", "")
                            src = base + src
                        return src
            except:
                continue
        
        return ""

    def _generate_product_id(self, brand_id: str, name: str) -> str:
        """Generate a unique product ID"""
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        return f"{brand_id}-{slug}"

    async def download_product_image(self, product: ScrapedProduct) -> str:
        """Download product image and return local path"""
        if not product.image_url:
            return ""
            
        try:
            # Create brand directory
            brand_dir = IMAGE_DIR / product.brand
            brand_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate filename
            filename = f"{product.id}_thumb.jpg"
            local_path = brand_dir / filename
            
            # Skip if already exists
            if local_path.exists():
                return str(local_path.relative_to(IMAGE_DIR.parent.parent))
            
            # Download image
            async with self.session.get(product.image_url) as response:
                if response.status == 200:
                    content = await response.read()
                    with open(local_path, 'wb') as f:
                        f.write(content)
                    return f"/data/product_images/{product.brand}/{filename}"
                    
        except Exception as e:
            logger.warning(f"Failed to download image for {product.name}: {str(e)[:50]}")
            
        return ""

    async def populate_all_brands(self):
        """Main entry point: scrape 3 TOP flagship products from each brand"""
        logger.info("=" * 60)
        logger.info("🎯 CATEGORY POPULATOR - Scraping 3 TOP products per brand")
        logger.info(f"   Brands: {len(FLAGSHIP_PRODUCTS)}")
        logger.info(f"   Target: {TOP_PRODUCTS_PER_BRAND} flagship products per brand")
        logger.info("=" * 60)
        
        await self.initialize()
        
        try:
            for brand_id in FLAGSHIP_PRODUCTS.keys():
                logger.info(f"\n🏷️ Processing brand: {brand_id.upper()}")
                
                # Scrape flagship products for this brand
                products = await self.scrape_flagship_products(brand_id)
                
                # Download images for each product
                for product in products:
                    product.image_local = await self.download_product_image(product)
                
                # Store results
                self.brand_results[brand_id].top_products = products
                self.brand_results[brand_id].total_products = len(products)
                
                logger.info(f"  ✅ Got {len(products)} top products")
                for p in products:
                    logger.info(f"     • {p.name} ({p.category_ui})")
                
                # Delay between brands
                await asyncio.sleep(2)
                
        finally:
            await self.cleanup()
        
        # Save results
        self._save_results()
        self._print_summary()

    def _save_results(self):
        """Save all results to JSON files"""
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        # Build brand index
        index = {
            "version": "1.0.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "top_products_per_brand": TOP_PRODUCTS_PER_BRAND,
            "brands": {}
        }
        
        all_products_by_category: Dict[str, List[ScrapedProduct]] = {cat["id"]: [] for cat in UI_CATEGORIES}
        
        for brand_id, population in self.brand_results.items():
            # Create brand directory
            brand_dir = OUTPUT_DIR / brand_id
            brand_dir.mkdir(exist_ok=True)
            
            # Save brand's top products
            brand_file = brand_dir / "top_products.json"
            with open(brand_file, 'w') as f:
                json.dump({
                    "brand": brand_id,
                    "brand_name": population.brand_name,
                    "top_products": [asdict(p) for p in population.top_products],
                    "categories_covered": population.categories_covered
                }, f, indent=2)
            
            # Add to index
            index["brands"][brand_id] = {
                "name": population.brand_name,
                "total_products": population.total_products,
                "categories_covered": population.categories_covered,
                "products": [{"id": p.id, "name": p.name, "category": p.category_ui} for p in population.top_products]
            }
            
            # Group by category
            for product in population.top_products:
                all_products_by_category[product.category_ui].append(product)
        
        # Save category summary (for thumbnail selection)
        for cat_id, products in all_products_by_category.items():
            if products:
                cat_file = OUTPUT_DIR / f"category_{cat_id}.json"
                with open(cat_file, 'w') as f:
                    json.dump({
                        "category": cat_id,
                        "products": [asdict(p) for p in products]
                    }, f, indent=2)
        
        # Save main index
        with open(OUTPUT_DIR / "population_index.json", 'w') as f:
            json.dump(index, f, indent=2)
        
        logger.info(f"\n💾 Results saved to {OUTPUT_DIR}")

    def _print_summary(self):
        """Print a summary of the scraping results"""
        logger.info("\n" + "=" * 60)
        logger.info("📊 TOP PRODUCTS SUMMARY (3 per brand)")
        logger.info("=" * 60)
        
        total = 0
        category_counts: Dict[str, int] = {}
        
        for brand_id, population in self.brand_results.items():
            logger.info(f"\n{brand_id.upper()}:")
            for product in population.top_products:
                logger.info(f"  • {product.name} [{product.category_ui}]")
                category_counts[product.category_ui] = category_counts.get(product.category_ui, 0) + 1
            total += population.total_products
        
        logger.info(f"\n{'=' * 60}")
        logger.info("📊 CATEGORY COVERAGE:")
        for cat_id, count in sorted(category_counts.items()):
            cat_label = next((c["label"] for c in UI_CATEGORIES if c["id"] == cat_id), cat_id)
            logger.info(f"  • {cat_label}: {count} products")
        
        logger.info(f"\n{'=' * 60}")
        logger.info(f"📦 TOTAL TOP PRODUCTS SCRAPED: {total}")
        logger.info(f"📦 BRANDS COVERED: {len(self.brand_results)}")
        logger.info("=" * 60)


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

async def main():
    populator = CategoryPopulator()
    await populator.populate_all_brands()


if __name__ == "__main__":
    asyncio.run(main())
