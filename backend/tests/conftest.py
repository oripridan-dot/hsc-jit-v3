"""
Pytest configuration and shared fixtures for backend tests
"""

import pytest
import json
from pathlib import Path
from typing import Dict, Any
from pydantic import BaseModel

# Test data directory
TEST_FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def sample_roland_product_dict() -> Dict[str, Any]:
    """Sample Roland product data structure"""
    return {
        "id": "td-17",
        "name": "TD-17",
        "brand": "Roland",
        "model": "TD-17",
        "description": "Compact electronic drum kit for practice and performance",
        "categories": ["Drums", "Electronic Drums"],
        "image_url": "https://www.roland.com/global/products/td_17/images/header.png",
        "images": [
            {
                "url": "https://www.roland.com/global/products/td_17/images/main.png",
                "type": "main",
                "alt_text": "TD-17 front view"
            },
            {
                "url": "https://www.roland.com/global/products/td_17/images/side.png",
                "type": "gallery",
                "alt_text": "TD-17 side view"
            }
        ],
        "price_nis": 4999.0,
        "status": "in_stock",
        "specifications": [
            {
                "category": "Dimensions",
                "specs": [
                    {"key": "Width", "value": "800mm"},
                    {"key": "Depth", "value": "600mm"},
                    {"key": "Height", "value": "1200mm"}
                ]
            }
        ],
        "features": [
            "9 drum/cymbal pads",
            "Rich onboard sounds",
            "Quick-start presets"
        ],
        "related_accessories": [
            {
                "id": "mds-9-compact",
                "name": "MDS-9 Compact Stand",
                "relationship_type": "accessory",
                "brand_product_url": "https://www.roland.com/global/products/mds_9_compact/"
            }
        ]
    }


@pytest.fixture
def sample_boss_product_dict() -> Dict[str, Any]:
    """Sample Boss product data structure (same format as Roland)"""
    return {
        "id": "me-80",
        "name": "ME-80",
        "brand": "Boss",
        "model": "ME-80",
        "description": "Guitar effects processor and workstation",
        "categories": ["Guitar", "Effects"],
        "image_url": "https://www.boss.info/us/products/me_80/images/header.png",
        "images": [
            {
                "url": "https://www.boss.info/us/products/me_80/images/main.png",
                "type": "main",
                "alt_text": "ME-80 front view"
            }
        ],
        "price_nis": 3999.0,
        "status": "in_stock",
        "specifications": [
            {
                "category": "Dimensions",
                "specs": [
                    {"key": "Width", "value": "900mm"},
                    {"key": "Depth", "value": "250mm"},
                    {"key": "Height", "value": "100mm"}
                ]
            }
        ],
        "features": [
            "Multi-effects processor",
            "Expression pedal",
            "Looper functionality"
        ],
        "related_accessories": [
            {
                "id": "fs-6",
                "name": "FS-6 Footswitch",
                "relationship_type": "accessory",
                "brand_product_url": "https://www.boss.info/us/products/fs_6/"
            }
        ]
    }


@pytest.fixture
def sample_roland_catalog_dict() -> Dict[str, Any]:
    """Sample complete Roland catalog structure"""
    return {
        "brand_identity": {
            "id": "roland",
            "name": "Roland",
            "logo_url": "https://www.roland.com/global/images/roland_logo.svg",
            "website": "https://www.roland.com/global/",
            "description": "World-leading manufacturer of digital musical instruments",
            "founded": 1972,
            "hq": "Hamamatsu, Japan",
            "brand_color": "#ef4444",
            "text_color": "#ffffff"
        },
        "products": [
            {
                "id": "td-17",
                "name": "TD-17",
                "brand": "Roland",
                "model": "TD-17",
                "description": "Compact electronic drum kit",
                "categories": ["Drums", "Electronic Drums"],
                "image_url": "https://www.roland.com/global/products/td_17/images/header.png",
                "images": [],
                "price_nis": 4999.0,
                "status": "in_stock"
            },
            {
                "id": "fa-08",
                "name": "FA-08",
                "brand": "Roland",
                "model": "FA-08",
                "description": "Synthesizer workstation",
                "categories": ["Synthesizers", "Workstations"],
                "image_url": "https://www.roland.com/global/products/fa_08/images/header.png",
                "images": [],
                "price_nis": 7999.0,
                "status": "in_stock"
            }
        ],
        "metadata": {
            "scrape_date": "2026-01-19",
            "total_products": 2,
            "version": "3.7.3-DNA"
        }
    }


@pytest.fixture
def sample_boss_catalog_dict() -> Dict[str, Any]:
    """Sample complete Boss catalog structure"""
    return {
        "brand_identity": {
            "id": "boss",
            "name": "Boss",
            "logo_url": "https://www.boss.info/us/images/boss_logo.svg",
            "website": "https://www.boss.info/us/",
            "description": "Leading manufacturer of guitar effects and audio equipment",
            "founded": 1973,
            "hq": "Suzhou, China",
            "brand_color": "#000000",
            "text_color": "#ffffff"
        },
        "products": [
            {
                "id": "me-80",
                "name": "ME-80",
                "brand": "Boss",
                "model": "ME-80",
                "description": "Guitar effects processor",
                "categories": ["Guitar", "Effects"],
                "image_url": "https://www.boss.info/us/products/me_80/images/header.png",
                "images": [],
                "price_nis": 3999.0,
                "status": "in_stock"
            }
        ],
        "metadata": {
            "scrape_date": "2026-01-19",
            "total_products": 1,
            "version": "3.7.3-DNA"
        }
    }


@pytest.fixture
def fixtures_dir() -> Path:
    """Return path to fixtures directory"""
    return TEST_FIXTURES_DIR


@pytest.fixture
def temp_json_file(tmp_path: Path) -> Path:
    """Create temporary JSON file for testing"""
    test_file = tmp_path / "test_catalog.json"
    return test_file
