#!/usr/bin/env python3
"""
BRAND-SPECIFIC SCRAPING CONFIGURATIONS
Each brand has custom selectors, pagination, and data extraction logic.
This is the definitive configuration for achieving 100% catalog coverage.
"""

# Brand-specific scraping configurations
BRAND_CONFIGS = {
    "roland": {
        "name": "Roland",
        "base_url": "https://www.roland.com",
        "products_url": "https://www.roland.com/us/products/",
        "method": "playwright",
        "selectors": {
            "product_grid": ".product-grid, .products-list, [data-products]",
            "product_item": ".product-item, .product-card, article[data-product]",
            "product_name": ".product-name, .product-title, h3.title, h2",
            "product_price": ".price, .product-price, [data-price], .msrp",
            "product_url": "a[href*='/products/']",
            "product_image": "img[src*='product'], .product-image img",
            "load_more": "button.load-more, .pagination a.next",
        },
        "wait_for": ".product-item, .product-card",
        "wait_time": 3,
        "scroll_to_load": True,
        "expected_min_products": 50,
    },

    "pearl": {
        "name": "Pearl Drums",
        "base_url": "https://www.pearldrum.com",
        "products_url": "https://www.pearldrum.com/products",
        "method": "playwright",
        "selectors": {
            "product_grid": ".product-grid, .products, #products",
            "product_item": ".product, .product-tile, [class*='ProductItem']",
            "product_name": ".product-name, .name, h2, h3",
            "product_price": ".price, .product-price",
            "product_url": "a[href*='/products/']",
            "product_image": "img",
        },
        "wait_for": ".product, .product-tile",
        "wait_time": 5,
        "scroll_to_load": True,
        "pagination": {
            "type": "infinite_scroll",
            "scroll_pause": 2,
        },
        "expected_min_products": 300,
    },

    "boss": {
        "name": "Boss",
        "base_url": "https://www.boss.info",
        "products_url": "https://www.boss.info/us/products/",
        "method": "playwright",
        "categories": [
            "https://www.boss.info/us/products/guitars/",
            "https://www.boss.info/us/products/synthesizers/",
            "https://www.boss.info/us/products/drums/",
            "https://www.boss.info/us/products/accessories/",
        ],
        "selectors": {
            "product_item": ".product-item, .product, article",
            "product_name": ".product-name, h3, h2",
            "product_price": ".price",
            "product_url": "a[href*='/products/']",
            "category_links": "a[href*='/products/']",
        },
        "wait_for": ".product-item, .product",
        "wait_time": 4,
        "expected_min_products": 200,
    },

    "m-audio": {
        "name": "M-Audio",
        "base_url": "https://www.m-audio.com",
        "products_url": "https://www.m-audio.com/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product-item, .product-card, [data-product-id]",
            "product_name": ".product-title, h3, h2.title",
            "product_price": ".price, .product-price",
            "product_url": "a.product-link, a[href*='/products/']",
        },
        "wait_for": ".product-item, .product-card",
        "wait_time": 8,  # Slow site
        "scroll_to_load": True,
        "expected_min_products": 250,
    },

    "akai-professional": {
        "name": "Akai Professional",
        "base_url": "https://www.akaipro.com",
        "products_url": "https://www.akaipro.com/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .product-item, [class*='product']",
            "product_name": ".product-name, h3, h2",
            "product_price": ".price",
            "product_url": "a[href*='/products/']",
        },
        "wait_for": ".product, .product-item",
        "wait_time": 6,
        "expected_min_products": 30,
    },

    "nord": {
        "name": "Nord Keyboards",
        "base_url": "https://www.nordkeyboards.com",
        "products_url": "https://www.nordkeyboards.com/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .nord-product, article",
            "product_name": ".product-name, h2, h3.title",
            "product_price": ".price, .msrp",
            "product_url": "a[href*='/products/']",
            "product_category": ".category, .product-category",
        },
        "wait_for": ".product, article",
        "wait_time": 3,
        "expected_min_products": 60,
    },

    "presonus": {
        "name": "PreSonus",
        "base_url": "https://www.presonus.com",
        "products_url": "https://www.presonus.com/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .product-card, [data-product]",
            "product_name": ".product-title, h3, h2",
            "product_price": ".price",
            "product_url": "a[href*='/products/']",
        },
        "wait_for": ".product, .product-card",
        "wait_time": 3,
        "scroll_to_load": True,
        "expected_min_products": 80,
    },

    "mackie": {
        "name": "Mackie",
        "base_url": "https://www.mackie.com",
        "products_url": "https://www.mackie.com/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .product-tile",
            "product_name": ".name, h3, h2.product-name",
            "product_price": ".price",
            "product_url": "a[href*='/products/']",
        },
        "wait_for": ".product",
        "wait_time": 3,
        "expected_min_products": 150,
    },

    "adam-audio": {
        "name": "Adam Audio",
        "base_url": "https://www.adam-audio.com",
        "products_url": "https://www.adam-audio.com/en/products/",
        "method": "playwright",
        "selectors": {
            "product_item": "[class*='product'], .product-item",
            "product_name": "h3, h2, .product-name",
            "product_price": ".price",
            "product_url": "a[href*='/products/']",
        },
        "wait_for": "[class*='product']",
        "wait_time": 3,
        "expected_min_products": 20,
    },

    "krk-systems": {
        "name": "KRK Systems",
        "base_url": "https://www.krksys.com",
        "products_url": "https://www.krksys.com/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .product-card",
            "product_name": ".product-name, h3, h2",
            "product_price": ".price",
        },
        "wait_for": ".product",
        "wait_time": 3,
        "expected_min_products": 15,
    },

    "dynaudio": {
        "name": "Dynaudio",
        "base_url": "https://www.dynaudio.com",
        "products_url": "https://www.dynaudio.com/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .product-item",
            "product_name": ".product-title, h3, h2",
            "product_price": ".price",
        },
        "wait_for": ".product",
        "wait_time": 4,
        "expected_min_products": 18,
    },

    "rcf": {
        "name": "RCF",
        "base_url": "https://www.rcf.it",
        "products_url": "https://www.rcf.it/en/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, article",
            "product_name": "h3, h2, .product-name",
            "product_price": ".price",
        },
        "wait_for": ".product, article",
        "wait_time": 3,
        "expected_min_products": 60,
    },

    "remo": {
        "name": "Remo",
        "base_url": "https://www.remo.com",
        "products_url": "https://www.remo.com/products/",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .product-item, [class*='Product']",
            "product_name": ".product-name, h3, h2",
            "product_price": ".price",
            "product_url": "a[href*='/products/']",
        },
        "wait_for": ".product, [class*='Product']",
        "wait_time": 4,
        "scroll_to_load": True,
        "expected_min_products": 180,
    },

    "paiste-cymbals": {
        "name": "Paiste",
        "base_url": "https://www.paiste.com",
        "products_url": "https://www.paiste.com/en/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .cymbal-item, article",
            "product_name": "h3, h2, .product-title",
            "product_price": ".price",
        },
        "wait_for": ".product, article",
        "wait_time": 4,
        "expected_min_products": 120,
    },

    "xotic": {
        "name": "Xotic Effects",
        "base_url": "https://www.xotic.us",
        "products_url": "https://www.xotic.us/",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .product-item",
            "product_name": ".product-name, h3, h2",
            "product_price": ".price",
        },
        "wait_for": ".product",
        "wait_time": 3,
        "expected_min_products": 20,
    },

    "oberheim": {
        "name": "Oberheim",
        "base_url": "https://www.uaudio.com",
        "products_url": "https://www.uaudio.com/synthesizers.html",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, [data-product]",
            "product_name": ".product-name, h3, h2",
            "product_price": ".price",
            "filter": "oberheim",  # Filter results to Oberheim only
        },
        "wait_for": ".product",
        "wait_time": 3,
        "expected_min_products": 4,
    },

    "rogers": {
        "name": "Rogers Drums",
        "base_url": "https://www.rogersdrums.com",
        "products_url": "https://www.rogersdrums.com/",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .drum-kit",
            "product_name": "h3, h2, .product-name",
            "product_price": ".price",
        },
        "wait_for": ".product, h2",
        "wait_time": 3,
        "expected_min_products": 6,
    },

    "headrush-fx": {
        "name": "HeadRush",
        "base_url": "https://www.headrush.com",
        "products_url": "https://www.headrush.com/products",
        "method": "playwright",
        "selectors": {
            "product_item": ".product, .product-card",
            "product_name": ".product-title, h3, h2",
            "product_price": ".price",
        },
        "wait_for": ".product",
        "wait_time": 3,
        "expected_min_products": 3,
    },
}

# Product count baselines from Halilit (for validation)
HALILIT_BASELINES = {
    "roland": 74,
    "pearl": 364,
    "boss": 260,
    "m-audio": 312,
    "akai-professional": 35,
    "nord": 74,
    "presonus": 106,
    "mackie": 219,
    "adam-audio": 26,
    "krk-systems": 17,
    "dynaudio": 22,
    "rcf": 74,
    "remo": 224,
    "paiste-cymbals": 151,
    "xotic": 28,
    "oberheim": 6,
    "rogers": 9,
    "headrush-fx": 4,
}
