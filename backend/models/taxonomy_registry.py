"""
TAXONOMY REGISTRY - Master Brand Category Registry
===================================================

The SINGLE SOURCE OF TRUTH for all brand taxonomies.

This registry:
1. Holds all official brand taxonomies (scraped from brand websites)
2. Exports to frontend as static JSON for category navigation
3. Validates product categories during scraping
4. Provides category normalization for data quality

Usage in scrapers:
    from models.taxonomy_registry import TaxonomyRegistry
    
    registry = TaxonomyRegistry()
    normalized = registry.normalize_category("roland", "digital pianos")
    # Returns: "Pianos"  (official taxonomy)
    
    categories = registry.get_brand_categories("roland")
    # Returns all categories for Navigator

Usage in forge_backbone.py:
    registry.export_to_frontend()
    # Writes frontend/public/data/taxonomy.json
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


@dataclass
class CategoryNode:
    """A single category in the brand's taxonomy tree"""
    id: str                          # URL slug: "drums_percussion"
    label: str                       # Display name: "Drums & Percussion"
    parent_id: Optional[str] = None  # Parent category ID, None if root
    children: List[str] = field(default_factory=list)  # Child category IDs
    icon: Optional[str] = None       # Emoji icon
    description: Optional[str] = None
    url_path: Optional[str] = None   # Full URL path for scraping


@dataclass
class BrandTaxonomy:
    """Complete taxonomy for a single brand"""
    brand_id: str
    brand_name: str
    base_url: str
    categories: Dict[str, CategoryNode]
    last_verified: str = ""
    
    def get_root_categories(self) -> List[CategoryNode]:
        """Return only top-level categories"""
        return [cat for cat in self.categories.values() if cat.parent_id is None]
    
    def get_children(self, parent_id: str) -> List[CategoryNode]:
        """Return all direct children of a category"""
        parent = self.categories.get(parent_id)
        if not parent:
            return []
        return [self.categories[child_id] for child_id in parent.children if child_id in self.categories]
    
    def get_all_category_labels(self) -> List[str]:
        """Return all category labels (for TierBar filter)"""
        return [cat.label for cat in self.categories.values()]


# =============================================================================
# ROLAND OFFICIAL TAXONOMY
# Source: https://www.roland.com/global/categories/
# Last verified: January 2026
# =============================================================================

ROLAND_TAXONOMY = BrandTaxonomy(
    brand_id="roland",
    brand_name="Roland",
    base_url="https://www.roland.com/global",
    last_verified="2026-01-23",
    categories={
        # Root categories
        "pianos": CategoryNode(
            id="pianos",
            label="Pianos",
            url_path="/global/categories/pianos/",
            icon="🎹",
            description="Digital Pianos, Stage Pianos, Grand Pianos",
            children=["grand_pianos", "portable_pianos", "stage_pianos", "upright_pianos", "pianos_accessories"]
        ),
        "synthesizers": CategoryNode(
            id="synthesizers",
            label="Synthesizers",
            url_path="/global/categories/synthesizers/",
            icon="🎛️",
            description="Analog Modeling, Performance Workstations",
            children=["analog_modeling", "performance_workstation", "sound_expansion_patches", "synths_accessories"]
        ),
        "keyboards": CategoryNode(
            id="keyboards",
            label="Keyboards",
            url_path="/global/categories/keyboards/",
            icon="⌨️",
            description="Arrangers, Controllers, Portable Keyboards",
            children=["arrangers", "midi_controllers", "portable_keyboards"]
        ),
        "organs": CategoryNode(
            id="organs",
            label="Organs",
            url_path="/global/categories/organs/",
            icon="🎹",
            description="Combo Organs, Organ Accessories",
            children=["combo_organs", "organ_accessories"]
        ),
        "drums_percussion": CategoryNode(
            id="drums_percussion",
            label="Drums & Percussion",
            url_path="/global/categories/drums_percussion/",
            icon="🥁",
            description="V-Drums, Electronic Percussion, Hybrid Drums",
            children=["v_drums", "electronic_percussion", "hybrid_drums", "drums_accessories"]
        ),
        "guitar_bass": CategoryNode(
            id="guitar_bass",
            label="Guitar & Bass",
            url_path="/global/categories/guitar_bass/",
            icon="🎸",
            description="Effects, Processors, Guitar Synths",
            children=["effects_processors", "guitar_synthesizers", "guitar_accessories"]
        ),
        "amplifiers": CategoryNode(
            id="amplifiers",
            label="Amplifiers",
            url_path="/global/categories/amplifiers/",
            icon="🔊",
            description="Guitar Amps, Keyboard Amps, Bass Amps",
            children=["keyboard_amplifiers", "guitar_amplifiers", "bass_amplifiers"]
        ),
        "production": CategoryNode(
            id="production",
            label="Production",
            url_path="/global/categories/production/",
            icon="🎚️",
            description="Audio Interfaces, Mixers, Video",
            children=["audio_interfaces", "mixers", "video"]
        ),
        "aira": CategoryNode(
            id="aira",
            label="AIRA",
            url_path="/global/categories/aira/",
            icon="🔮",
            description="TR, TB, System-1, AIRA Compact",
            children=["aira_compact", "aira_modular"]
        ),
        "wind_instruments": CategoryNode(
            id="wind_instruments",
            label="Wind Instruments",
            url_path="/global/categories/wind_instruments/",
            icon="🎷",
            description="Aerophone, Digital Wind Instruments",
            children=["aerophone"]
        ),
        "roland_cloud": CategoryNode(
            id="roland_cloud",
            label="Roland Cloud",
            url_path="/global/categories/roland_cloud/",
            icon="☁️",
            description="Software, Plugins, Sound Libraries",
            children=["plugins", "sound_libraries"]
        ),
        "accessories": CategoryNode(
            id="accessories",
            label="Accessories",
            url_path="/global/categories/accessories/",
            icon="🔧",
            description="Cables, Stands, Cases, Pedals",
            children=["cables", "headphones", "stands", "cases_bags", "pedals", "power_supplies"]
        ),
        "featured_products": CategoryNode(
            id="featured_products",
            label="Featured Products",
            url_path="/global/categories/featured_products/",
            icon="⭐",
            description="New & Featured"
        ),
        "apps": CategoryNode(
            id="apps",
            label="Apps",
            url_path="/global/categories/apps/",
            icon="📱",
            description="iOS & Android Apps"
        ),
        
        # --- SUBCATEGORIES ---
        # Pianos subcategories
        "grand_pianos": CategoryNode(id="grand_pianos", label="Grand Pianos", parent_id="pianos"),
        "portable_pianos": CategoryNode(id="portable_pianos", label="Portable Pianos", parent_id="pianos"),
        "stage_pianos": CategoryNode(id="stage_pianos", label="Stage Pianos", parent_id="pianos"),
        "upright_pianos": CategoryNode(id="upright_pianos", label="Upright Pianos", parent_id="pianos"),
        "pianos_accessories": CategoryNode(id="pianos_accessories", label="Piano Accessories", parent_id="pianos"),
        
        # Synthesizer subcategories
        "analog_modeling": CategoryNode(id="analog_modeling", label="Analog Modeling", parent_id="synthesizers"),
        "performance_workstation": CategoryNode(id="performance_workstation", label="Performance Workstation", parent_id="synthesizers"),
        "sound_expansion_patches": CategoryNode(id="sound_expansion_patches", label="Sound Expansion & Patches", parent_id="synthesizers"),
        "synths_accessories": CategoryNode(id="synths_accessories", label="Synthesizer Accessories", parent_id="synthesizers"),
        
        # Keyboard subcategories
        "arrangers": CategoryNode(id="arrangers", label="Arrangers", parent_id="keyboards"),
        "midi_controllers": CategoryNode(id="midi_controllers", label="MIDI Controllers", parent_id="keyboards"),
        "portable_keyboards": CategoryNode(id="portable_keyboards", label="Portable Keyboards", parent_id="keyboards"),
        
        # Organ subcategories
        "combo_organs": CategoryNode(id="combo_organs", label="Combo Organs", parent_id="organs"),
        "organ_accessories": CategoryNode(id="organ_accessories", label="Organ Accessories", parent_id="organs"),
        
        # Drums subcategories
        "v_drums": CategoryNode(id="v_drums", label="V-Drums", parent_id="drums_percussion"),
        "electronic_percussion": CategoryNode(id="electronic_percussion", label="Electronic Percussion", parent_id="drums_percussion"),
        "hybrid_drums": CategoryNode(id="hybrid_drums", label="Hybrid Drums", parent_id="drums_percussion"),
        "drums_accessories": CategoryNode(id="drums_accessories", label="Drums Accessories", parent_id="drums_percussion"),
        
        # Amplifier subcategories
        "keyboard_amplifiers": CategoryNode(id="keyboard_amplifiers", label="Keyboard Amplifiers", parent_id="amplifiers"),
        "guitar_amplifiers": CategoryNode(id="guitar_amplifiers", label="Guitar Amplifiers", parent_id="amplifiers"),
        "bass_amplifiers": CategoryNode(id="bass_amplifiers", label="Bass Amplifiers", parent_id="amplifiers"),
        
        # Guitar & Bass subcategories
        "effects_processors": CategoryNode(id="effects_processors", label="Effects & Processors", parent_id="guitar_bass"),
        "guitar_synthesizers": CategoryNode(id="guitar_synthesizers", label="Guitar Synthesizers", parent_id="guitar_bass"),
        "guitar_accessories": CategoryNode(id="guitar_accessories", label="Guitar Accessories", parent_id="guitar_bass"),
        
        # Production subcategories
        "audio_interfaces": CategoryNode(id="audio_interfaces", label="Audio Interfaces", parent_id="production"),
        "mixers": CategoryNode(id="mixers", label="Mixers", parent_id="production"),
        "video": CategoryNode(id="video", label="Video", parent_id="production"),
        
        # AIRA subcategories
        "aira_compact": CategoryNode(id="aira_compact", label="AIRA Compact", parent_id="aira"),
        "aira_modular": CategoryNode(id="aira_modular", label="AIRA Modular", parent_id="aira"),
        
        # Wind subcategories
        "aerophone": CategoryNode(id="aerophone", label="Aerophone", parent_id="wind_instruments"),
        
        # Roland Cloud subcategories
        "plugins": CategoryNode(id="plugins", label="Plugins", parent_id="roland_cloud"),
        "sound_libraries": CategoryNode(id="sound_libraries", label="Sound Libraries", parent_id="roland_cloud"),
        
        # Accessories subcategories
        "cables": CategoryNode(id="cables", label="Cables", parent_id="accessories"),
        "headphones": CategoryNode(id="headphones", label="Headphones", parent_id="accessories"),
        "stands": CategoryNode(id="stands", label="Stands", parent_id="accessories"),
        "cases_bags": CategoryNode(id="cases_bags", label="Cases & Bags", parent_id="accessories"),
        "pedals": CategoryNode(id="pedals", label="Pedals", parent_id="accessories"),
        "power_supplies": CategoryNode(id="power_supplies", label="Power Supplies", parent_id="accessories"),
    }
)


# =============================================================================
# BOSS OFFICIAL TAXONOMY
# Source: https://www.boss.info/global/categories/
# Last verified: January 2026
# =============================================================================

BOSS_TAXONOMY = BrandTaxonomy(
    brand_id="boss",
    brand_name="BOSS",
    base_url="https://www.boss.info/global",
    last_verified="2026-01-23",
    categories={
        # Root categories
        "effects_pedals": CategoryNode(
            id="effects_pedals",
            label="Effects Pedals",
            url_path="/global/categories/effects_pedals/",
            icon="🎸",
            description="Stompboxes, Compact Pedals",
            children=["stompboxes", "wah_expression", "loopers"]
        ),
        "multi_effects": CategoryNode(
            id="multi_effects",
            label="Multi-Effects",
            url_path="/global/categories/multi-effects/",
            icon="🎛️",
            description="Floor Units, Desktop"
        ),
        "guitar_synthesizers": CategoryNode(
            id="guitar_synthesizers",
            label="Guitar Synthesizers",
            url_path="/global/categories/guitar_synthesizers/",
            icon="🎹",
            description="GK, SY Series"
        ),
        "amplifiers": CategoryNode(
            id="amplifiers",
            label="Amplifiers",
            url_path="/global/categories/amplifiers/",
            icon="🔊",
            description="Katana, Cube, Acoustic",
            children=["katana", "cube", "acoustic_amps"]
        ),
        "acoustic": CategoryNode(
            id="acoustic",
            label="Acoustic",
            url_path="/global/categories/acoustic/",
            icon="🪕",
            description="Acoustic Amps, Preamps"
        ),
        "loop_station": CategoryNode(
            id="loop_station",
            label="Loop Station",
            url_path="/global/categories/loop_station/",
            icon="🔁",
            description="RC Series, Loop Stations"
        ),
        "vocal_effects": CategoryNode(
            id="vocal_effects",
            label="Vocal Effects",
            url_path="/global/categories/vocal_effects/",
            icon="🎤",
            description="VE Series, Vocal Processors"
        ),
        "mixers_audio_solutions": CategoryNode(
            id="mixers_audio_solutions",
            label="Mixers & Audio Solutions",
            url_path="/global/categories/mixers_audio_solutions/",
            icon="🎚️",
            description="Personal Mixers, Audio Interfaces"
        ),
        "tuners_metronomes": CategoryNode(
            id="tuners_metronomes",
            label="Tuners & Metronomes",
            url_path="/global/categories/tuners_metronomes/",
            icon="🎵",
            description="TU Series, DB Series"
        ),
        "wireless": CategoryNode(
            id="wireless",
            label="Wireless",
            url_path="/global/categories/wireless/",
            icon="📡",
            description="WL Series"
        ),
        "accessories": CategoryNode(
            id="accessories",
            label="Accessories",
            url_path="/global/categories/accessories/",
            icon="🔧",
            description="Footswitches, Power Supplies, Cables"
        ),
        "apps": CategoryNode(
            id="apps",
            label="Apps",
            url_path="/global/categories/apps/",
            icon="📱",
            description="BOSS Tone Studio, BOSS Tuner"
        ),
        "featured_products": CategoryNode(
            id="featured_products",
            label="Featured Products",
            url_path="/global/categories/featured_products/",
            icon="⭐",
            description="New & Featured"
        ),
        
        # --- SUBCATEGORIES ---
        "stompboxes": CategoryNode(id="stompboxes", label="Stompboxes", parent_id="effects_pedals"),
        "wah_expression": CategoryNode(id="wah_expression", label="Wah & Expression", parent_id="effects_pedals"),
        "loopers": CategoryNode(id="loopers", label="Loopers", parent_id="effects_pedals"),
        "katana": CategoryNode(id="katana", label="Katana Series", parent_id="amplifiers"),
        "cube": CategoryNode(id="cube", label="Cube Series", parent_id="amplifiers"),
        "acoustic_amps": CategoryNode(id="acoustic_amps", label="Acoustic Amps", parent_id="amplifiers"),
    }
)


# =============================================================================
# NORD OFFICIAL TAXONOMY
# Source: https://www.nordkeyboards.com/products
# Last verified: January 2026
# =============================================================================

NORD_TAXONOMY = BrandTaxonomy(
    brand_id="nord",
    brand_name="Nord",
    base_url="https://www.nordkeyboards.com",
    last_verified="2026-01-23",
    categories={
        "stage": CategoryNode(
            id="stage",
            label="Stage",
            url_path="/products/nord-stage",
            icon="🎹",
            description="Flagship Stage Keyboards"
        ),
        "piano": CategoryNode(
            id="piano",
            label="Piano",
            url_path="/products/nord-piano",
            icon="🎹",
            description="Stage Piano Series"
        ),
        "electro": CategoryNode(
            id="electro",
            label="Electro",
            url_path="/products/nord-electro",
            icon="🎹",
            description="Electro-Mechanical Keyboards"
        ),
        "lead": CategoryNode(
            id="lead",
            label="Lead",
            url_path="/products/nord-lead",
            icon="🎛️",
            description="Virtual Analog Synths"
        ),
        "wave": CategoryNode(
            id="wave",
            label="Wave",
            url_path="/products/nord-wave",
            icon="🌊",
            description="Wavetable Synthesizers"
        ),
        "drum": CategoryNode(
            id="drum",
            label="Drum",
            url_path="/products/nord-drum",
            icon="🥁",
            description="Virtual Analog Drum Machines"
        ),
        "c_organ": CategoryNode(
            id="c_organ",
            label="C2D Organ",
            url_path="/products/nord-c2d",
            icon="🎹",
            description="Combo Organ"
        ),
        "accessories": CategoryNode(
            id="accessories",
            label="Accessories",
            url_path="/products/accessories",
            icon="🔧",
            description="Pedals, Cases, Stands"
        ),
        "software": CategoryNode(
            id="software",
            label="Software",
            url_path="/software",
            icon="💻",
            description="Sound Manager, Sample Editor"
        ),
    }
)


# =============================================================================
# MOOG OFFICIAL TAXONOMY
# Source: https://www.moogmusic.com/products
# Last verified: January 2026
# =============================================================================

MOOG_TAXONOMY = BrandTaxonomy(
    brand_id="moog",
    brand_name="Moog",
    base_url="https://www.moogmusic.com",
    last_verified="2026-01-23",
    categories={
        "synthesizers": CategoryNode(
            id="synthesizers",
            label="Synthesizers",
            url_path="/products/synthesizers",
            icon="🎛️",
            description="Analog Synthesizers",
            children=["semi_modular", "polyphonic", "monophonic", "modular"]
        ),
        "semi_modular": CategoryNode(
            id="semi_modular",
            label="Semi-Modular",
            url_path="/products/semi-modular",
            parent_id="synthesizers",
            description="Mother-32, DFAM, Subharmonicon"
        ),
        "polyphonic": CategoryNode(
            id="polyphonic",
            label="Polyphonic",
            url_path="/products/polyphonic",
            parent_id="synthesizers",
            description="One, Matriarch, Grandmother"
        ),
        "monophonic": CategoryNode(
            id="monophonic",
            label="Monophonic",
            url_path="/products/monophonic",
            parent_id="synthesizers",
            description="Minimoog, Sub, Voyager"
        ),
        "modular": CategoryNode(
            id="modular",
            label="Modular",
            url_path="/products/modular",
            parent_id="synthesizers",
            description="Eurorack Modules"
        ),
        "effects": CategoryNode(
            id="effects",
            label="Effects",
            url_path="/products/effects",
            icon="🎸",
            description="Moogerfooger, Minifooger"
        ),
        "keyboards": CategoryNode(
            id="keyboards",
            label="Keyboards",
            url_path="/products/keyboards",
            icon="⌨️",
            description="Controllers"
        ),
        "accessories": CategoryNode(
            id="accessories",
            label="Accessories",
            url_path="/products/accessories",
            icon="🔧",
            description="Cables, Cases, Patch Cables"
        ),
        "apps": CategoryNode(
            id="apps",
            label="Apps",
            url_path="/products/apps",
            icon="📱",
            description="Animoog, Model D"
        ),
    }
)


# =============================================================================
# TAXONOMY REGISTRY (MASTER CONTROLLER)
# =============================================================================

class TaxonomyRegistry:
    """
    Master Taxonomy Registry - Single Source of Truth
    
    Responsibilities:
    1. Store all brand taxonomies
    2. Provide category validation for scrapers
    3. Normalize raw categories to official taxonomy
    4. Export to frontend as static JSON
    5. Validation checkpoint for data quality
    """
    
    def __init__(self):
        self.taxonomies: Dict[str, BrandTaxonomy] = {
            "roland": ROLAND_TAXONOMY,
            "boss": BOSS_TAXONOMY,
            "nord": NORD_TAXONOMY,
            "moog": MOOG_TAXONOMY,
        }
        
        # Generic categories that should NOT be used (validation check)
        self.invalid_categories = {
            "musical instruments",
            "music",
            "products",
            "all products",
            "all",
            "home",
            "categories",
            "uncategorized",
        }
        
        # Category aliases for normalization (common variations)
        self.aliases = {
            "digital pianos": "pianos",
            "digital piano": "pianos",
            "electric piano": "pianos",
            "synth": "synthesizers",
            "synths": "synthesizers",
            "drum": "drums_percussion",
            "drums": "drums_percussion",
            "percussion": "drums_percussion",
            "guitar": "guitar_bass",
            "bass": "guitar_bass",
            "amp": "amplifiers",
            "amps": "amplifiers",
            "effect": "effects_pedals",
            "effects": "effects_pedals",
            "pedal": "effects_pedals",
            "pedals": "effects_pedals",
        }
    
    def get_brand(self, brand_id: str) -> Optional[BrandTaxonomy]:
        """Get taxonomy for a specific brand"""
        return self.taxonomies.get(brand_id.lower())
    
    def get_all_brands(self) -> List[str]:
        """Get all registered brand IDs"""
        return list(self.taxonomies.keys())
    
    def get_categories(self, brand_id: str, root_only: bool = False) -> List[CategoryNode]:
        """Get categories for a brand, optionally only root categories"""
        taxonomy = self.get_brand(brand_id)
        if not taxonomy:
            return []
        
        if root_only:
            return taxonomy.get_root_categories()
        return list(taxonomy.categories.values())
    
    def get_category_labels(self, brand_id: str, root_only: bool = False) -> List[str]:
        """Get category labels for a brand"""
        return [cat.label for cat in self.get_categories(brand_id, root_only)]
    
    def validate_category(self, brand_id: str, category: str) -> bool:
        """
        Check if a category is valid for a brand.
        Returns True if category matches official taxonomy.
        """
        if not category or category.lower() in self.invalid_categories:
            return False
        
        taxonomy = self.get_brand(brand_id)
        if not taxonomy:
            return False
        
        cat_lower = category.lower().strip()
        cat_slug = cat_lower.replace(" ", "_").replace("-", "_")
        
        # Check ID match
        if cat_slug in taxonomy.categories:
            return True
        
        # Check label match
        for cat in taxonomy.categories.values():
            if cat.label.lower() == cat_lower:
                return True
        
        return False
    
    def normalize_category(self, brand_id: str, raw_category: str) -> Optional[str]:
        """
        Normalize a raw category string to official taxonomy.
        Returns the official label or None if no match.
        
        This is THE validation checkpoint for data quality.
        """
        if not raw_category:
            return None
        
        raw_lower = raw_category.lower().strip()
        
        # Check invalid categories first
        if raw_lower in self.invalid_categories:
            return None
        
        taxonomy = self.get_brand(brand_id)
        if not taxonomy:
            return None
        
        raw_slug = raw_lower.replace("-", "_").replace(" ", "_")
        
        # 1. Direct ID match
        if raw_slug in taxonomy.categories:
            return taxonomy.categories[raw_slug].label
        
        # 2. Check aliases
        if raw_lower in self.aliases:
            alias_slug = self.aliases[raw_lower]
            if alias_slug in taxonomy.categories:
                return taxonomy.categories[alias_slug].label
        
        # 3. Exact label match (case-insensitive)
        for cat in taxonomy.categories.values():
            if cat.label.lower() == raw_lower:
                return cat.label
        
        # 4. Fuzzy match - significant word overlap
        raw_words = set(w for w in raw_lower.split() if len(w) > 2)
        
        best_match = None
        best_score = 0
        
        for cat in taxonomy.categories.values():
            cat_words = set(w.lower() for w in cat.label.split() if len(w) > 2)
            
            if not cat_words or not raw_words:
                continue
            
            overlap = raw_words & cat_words
            if overlap:
                score = len(overlap) / max(len(cat_words), len(raw_words))
                
                # Prefer root categories
                if cat.parent_id is None:
                    score += 0.2
                
                if score > best_score and score >= 0.5:
                    best_score = score
                    best_match = cat.label
        
        return best_match
    
    def get_validation_report(self, brand_id: str, products: List[Dict]) -> Dict[str, Any]:
        """
        Generate a validation report for a list of products.
        Returns statistics on category coverage and issues.
        """
        report = {
            "brand_id": brand_id,
            "total_products": len(products),
            "valid_categories": 0,
            "invalid_categories": 0,
            "uncategorized": 0,
            "category_distribution": {},
            "issues": []
        }
        
        for product in products:
            raw_cat = product.get("main_category") or product.get("category")
            
            if not raw_cat:
                report["uncategorized"] += 1
                report["issues"].append({
                    "product_id": product.get("id"),
                    "issue": "missing_category"
                })
                continue
            
            normalized = self.normalize_category(brand_id, raw_cat)
            
            if normalized:
                report["valid_categories"] += 1
                report["category_distribution"][normalized] = report["category_distribution"].get(normalized, 0) + 1
            else:
                report["invalid_categories"] += 1
                report["issues"].append({
                    "product_id": product.get("id"),
                    "raw_category": raw_cat,
                    "issue": "unrecognized_category"
                })
        
        return report
    
    def export_to_dict(self) -> Dict[str, Any]:
        """Export all taxonomies as a dictionary (for JSON serialization)"""
        return {
            "version": "1.0.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "brands": {
                brand_id: {
                    "brand_id": taxonomy.brand_id,
                    "brand_name": taxonomy.brand_name,
                    "base_url": taxonomy.base_url,
                    "last_verified": taxonomy.last_verified,
                    "categories": [
                        {
                            "id": cat.id,
                            "label": cat.label,
                            "parent_id": cat.parent_id,
                            "children": cat.children,
                            "icon": cat.icon,
                            "description": cat.description,
                        }
                        for cat in taxonomy.categories.values()
                    ],
                    "root_categories": [
                        {
                            "id": cat.id,
                            "label": cat.label,
                            "icon": cat.icon,
                            "description": cat.description,
                            "children": cat.children,
                        }
                        for cat in taxonomy.get_root_categories()
                    ]
                }
                for brand_id, taxonomy in self.taxonomies.items()
            }
        }
    
    def export_to_frontend(self, output_path: Optional[Path] = None) -> Path:
        """
        Export taxonomy registry to frontend as static JSON.
        
        Writes to: frontend/public/data/taxonomy.json
        """
        if output_path is None:
            output_path = Path("../frontend/public/data/taxonomy.json")
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        data = self.export_to_dict()
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📋 Taxonomy Registry exported to {output_path}")
        logger.info(f"   Brands: {len(self.taxonomies)}")
        logger.info(f"   Total categories: {sum(len(t.categories) for t in self.taxonomies.values())}")
        
        return output_path


# Global instance for easy import
_registry_instance: Optional[TaxonomyRegistry] = None


def get_registry() -> TaxonomyRegistry:
    """Get the global taxonomy registry instance"""
    global _registry_instance
    if _registry_instance is None:
        _registry_instance = TaxonomyRegistry()
    return _registry_instance


# Convenience exports
def get_brand_taxonomy(brand_id: str) -> Optional[BrandTaxonomy]:
    """Get taxonomy for a specific brand"""
    return get_registry().get_brand(brand_id)


def normalize_category(brand_id: str, raw_category: str) -> Optional[str]:
    """Normalize a category to official taxonomy"""
    return get_registry().normalize_category(brand_id, raw_category)


def validate_category(brand_id: str, category: str) -> bool:
    """Validate a category against official taxonomy"""
    return get_registry().validate_category(brand_id, category)


def export_taxonomy() -> Path:
    """Export all taxonomies to frontend"""
    return get_registry().export_to_frontend()


if __name__ == "__main__":
    # Test and export
    registry = TaxonomyRegistry()
    
    print("=" * 60)
    print("TAXONOMY REGISTRY - Brand Categories")
    print("=" * 60)
    
    for brand_id in registry.get_all_brands():
        taxonomy = registry.get_brand(brand_id)
        if taxonomy:
            root_cats = taxonomy.get_root_categories()
            print(f"\n📦 {taxonomy.brand_name} ({len(root_cats)} root categories)")
            for cat in root_cats:
                print(f"   {cat.icon or '•'} {cat.label}")
                children = taxonomy.get_children(cat.id)
                for child in children[:2]:
                    print(f"      └─ {child.label}")
                if len(children) > 2:
                    print(f"      └─ ... ({len(children) - 2} more)")
    
    print("\n" + "=" * 60)
    print("Testing Normalization:")
    print("=" * 60)
    
    test_cases = [
        ("roland", "digital pianos"),
        ("roland", "Pianos"),
        ("roland", "synths"),
        ("roland", "V-Drums"),
        ("boss", "effects"),
        ("boss", "Katana"),
        ("nord", "Stage"),
        ("moog", "Semi-Modular"),
    ]
    
    for brand, raw in test_cases:
        result = registry.normalize_category(brand, raw)
        status = "✅" if result else "❌"
        print(f"  {status} {brand}/{raw} → {result or 'NOT FOUND'}")
    
    # Export to frontend
    print("\n" + "=" * 60)
    registry.export_to_frontend()
    print("=" * 60)
