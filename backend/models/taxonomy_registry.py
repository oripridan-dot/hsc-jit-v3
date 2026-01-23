"""
Minimal Taxonomy Registry for Halilit Catalog
"""
from typing import Dict, List, Optional
from pathlib import Path
import json
from datetime import datetime, timezone


class Category:
    def __init__(self, id: str, label: str, icon: str = "", description: str = "", children: List = None):
        self.id = id
        self.label = label
        self.icon = icon
        self.description = description
        self.children = children or []


class BrandTaxonomy:
    def __init__(self, brand_id: str, categories: List[Category] = None):
        self.brand_id = brand_id
        self.categories = categories or []
    
    def get_root_categories(self):
        return self.categories


class TaxonomyRegistry:
    """Manages universal and brand-specific product categories"""
    
    # Universal categories - consistent across all brands
    UNIVERSAL_CATEGORIES = {
        "keys": Category("keys", "Keys & Pianos", "🎹", "Keyboards and pianos"),
        "drums": Category("drums", "Drums & Percussion", "🥁", "Drums and percussion"),
        "guitars": Category("guitars", "Guitars & Amps", "🎸", "Guitars and amplifiers"),
        "studio": Category("studio", "Studio & Recording", "🎙️", "Studio and recording gear"),
        "live": Category("live", "Live Sound", "🔊", "Live sound equipment"),
        "dj": Category("dj", "DJ & Production", "🎧", "DJ and production gear"),
        "software": Category("software", "Software & Cloud", "💻", "Software and cloud services"),
        "accessories": Category("accessories", "Accessories", "🔧", "Accessories and add-ons"),
    }
    
    # Brand-specific category mappings
    BRAND_TAXONOMIES = {
        "roland": {
            "Production": "studio",
            "Drums": "drums",
            "Keys": "keys",
            "Keyboards": "keys",
            "Synthesizers": "keys",
            "Pianos": "keys",
            "Controllers": "accessories",
            "Interfaces": "studio",
            "Software": "software",
            "Effects": "studio",
            "Amplifiers": "live",
            "Speakers": "live",
            "Uncategorized": "accessories",
        },
        "nord": {
            "Keyboards": "keys",
            "Synthesizers": "keys",
            "Controllers": "keys",
            "Pedals": "accessories",
            "Accessories": "accessories",
            "Software": "software",
            "Uncategorized": "accessories",
        },
        "boss": {
            "Effects": "studio",
            "Guitars": "guitars",
            "Drums": "drums",
            "Keyboards": "keys",
            "Controllers": "accessories",
            "Interfaces": "studio",
            "Uncategorized": "accessories",
        },
        "moog": {
            "Synthesizers": "keys",
            "Controllers": "keys",
            "Effects": "studio",
            "Accessories": "accessories",
            "Software": "software",
            "Uncategorized": "accessories",
        },
        "universal-audio": {
            "Plugins": "software",
            "Hardware": "studio",
            "Interfaces": "studio",
            "Accessories": "accessories",
            "Software": "software",
            "Uncategorized": "accessories",
        }
    }
    
    def __init__(self):
        self.brands = {}
        self._initialize_brands()
    
    def _initialize_brands(self):
        """Initialize brand taxonomies"""
        for brand_id in list(self.BRAND_TAXONOMIES.keys()):
            self.brands[brand_id] = BrandTaxonomy(brand_id, list(self.UNIVERSAL_CATEGORIES.values()))
    
    def normalize_category(self, brand_id: str, raw_category: str) -> Optional[str]:
        """Map brand-specific category to universal category"""
        if not raw_category:
            return None
        
        brand_map = self.BRAND_TAXONOMIES.get(brand_id, {})
        
        # Try exact match
        if raw_category in brand_map:
            return brand_map[raw_category]
        
        # Try case-insensitive match
        for key, value in brand_map.items():
            if key.lower() == raw_category.lower():
                return value
        
        # Try substring match
        raw_lower = raw_category.lower()
        for key, value in brand_map.items():
            if key.lower() in raw_lower or raw_lower in key.lower():
                return value
        
        # Default to accessories
        return "accessories"
    
    def get_brand(self, brand_id: str) -> Optional[BrandTaxonomy]:
        """Get taxonomy for a specific brand"""
        return self.brands.get(brand_id)
    
    def get_all_brands(self) -> List[str]:
        """Get all registered brands"""
        return list(self.brands.keys())
    
    def export_to_frontend(self, output_path: Path):
        """Export taxonomy to frontend JSON"""
        taxonomy_data = {
            "version": "1.0",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "universal_categories": [
                {
                    "id": cat.id,
                    "label": cat.label,
                    "icon": cat.icon,
                    "description": cat.description,
                }
                for cat in self.UNIVERSAL_CATEGORIES.values()
            ],
            "brand_mappings": self.BRAND_TAXONOMIES,
        }
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(taxonomy_data, f, indent=2)


# Global registry instance
_registry = None


def get_registry() -> TaxonomyRegistry:
    """Get the global taxonomy registry"""
    global _registry
    if _registry is None:
        _registry = TaxonomyRegistry()
    return _registry
