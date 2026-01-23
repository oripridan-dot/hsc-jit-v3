"""
Category Consolidator - The "Translation Layer"

ARCHITECTURE PRINCIPLE:
"Accept what brands give us exactly, translate to steady UI categories"

This module maps diverse brand taxonomies into 8 universal UI categories.
The UI always displays the same categories in the same place - no surprises.

Data Flow:
1. Brand scraper extracts exact category from brand website
2. Product JSON stores original brand category (source of truth)
3. This consolidator maps to UI category for display
4. UI shows consolidated category, product details show original

Benefits:
- Steady, predictable UI (same 8 buttons always)
- Zero data loss (original category preserved)
- No-brainer navigation (musician mental model)
- Extensible (add new brands by adding mappings)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


# =============================================================================
# THE 8 UNIVERSAL UI CATEGORIES
# These are DISPLAY categories - they never change, never move
# =============================================================================

@dataclass
class ConsolidatedCategory:
    id: str
    label: str
    icon: str
    color: str
    description: str
    sort_order: int


CONSOLIDATED_CATEGORIES: List[ConsolidatedCategory] = [
    ConsolidatedCategory(
        id="keys",
        label="Keys & Pianos",
        icon="🎹",
        color="#f59e0b",  # Amber
        description="Synths, Pianos, Controllers, Organs",
        sort_order=1,
    ),
    ConsolidatedCategory(
        id="drums",
        label="Drums & Percussion",
        icon="🥁",
        color="#ef4444",  # Red
        description="Electronic & Acoustic Drums, Percussion",
        sort_order=2,
    ),
    ConsolidatedCategory(
        id="guitars",
        label="Guitars & Amps",
        icon="🎸",
        color="#3b82f6",  # Blue
        description="Electric, Bass, Effects, Amplifiers",
        sort_order=3,
    ),
    ConsolidatedCategory(
        id="studio",
        label="Studio & Recording",
        icon="🎙️",
        color="#10b981",  # Emerald
        description="Interfaces, Monitors, Microphones",
        sort_order=4,
    ),
    ConsolidatedCategory(
        id="live",
        label="Live Sound",
        icon="🔊",
        color="#8b5cf6",  # Violet
        description="PA Systems, Mixers, Wireless",
        sort_order=5,
    ),
    ConsolidatedCategory(
        id="dj",
        label="DJ & Production",
        icon="🎧",
        color="#ec4899",  # Pink
        description="Controllers, Samplers, Grooveboxes",
        sort_order=6,
    ),
    ConsolidatedCategory(
        id="software",
        label="Software & Cloud",
        icon="💻",
        color="#06b6d4",  # Cyan
        description="Plugins, Apps, Cloud Services",
        sort_order=7,
    ),
    ConsolidatedCategory(
        id="accessories",
        label="Accessories",
        icon="🔧",
        color="#64748b",  # Slate
        description="Cables, Stands, Cases, Pedals",
        sort_order=8,
    ),
]


# =============================================================================
# BRAND CATEGORY MAPPINGS
# Maps exact brand terminology → consolidated UI category
# =============================================================================

BRAND_MAPPINGS: Dict[str, Dict[str, str]] = {
    # ─────────────────────────────────────────────────────────────────────────
    # ROLAND
    # ─────────────────────────────────────────────────────────────────────────
    "roland": {
        "pianos": "keys",
        "synthesizers": "keys",
        "keyboards": "keys",
        "organs": "keys",
        "drums_percussion": "drums",
        "drums & percussion": "drums",
        "guitar_bass": "guitars",
        "guitar & bass": "guitars",
        "amplifiers": "guitars",
        "production": "studio",
        "aira": "dj",
        "wind_instruments": "studio",
        "roland_cloud": "software",
        "accessories": "accessories",
        "grand_pianos": "keys",
        "portable_pianos": "keys",
        "stage_pianos": "keys",
        "upright_pianos": "keys",
        "v_drums": "drums",
        "electronic_percussion": "drums",
        "hybrid_drums": "drums",
        "keyboard_amplifiers": "guitars",
        "guitar_amplifiers": "guitars",
        "bass_amplifiers": "guitars",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # BOSS
    # ─────────────────────────────────────────────────────────────────────────
    "boss": {
        "effects_pedals": "guitars",
        "effects pedals": "guitars",
        "multi_effects": "guitars",
        "multi-effects": "guitars",
        "guitar_synthesizers": "guitars",
        "guitar synthesizers": "guitars",
        "amplifiers": "guitars",
        "acoustic": "guitars",
        "loop_station": "dj",
        "loop station": "dj",
        "vocal_effects": "studio",
        "vocal effects": "studio",
        "mixers_audio_solutions": "live",
        "mixers & audio solutions": "live",
        "tuners_metronomes": "accessories",
        "tuners & metronomes": "accessories",
        "wireless": "live",
        "accessories": "accessories",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # NORD
    # ─────────────────────────────────────────────────────────────────────────
    "nord": {
        "stage": "keys",
        "piano": "keys",
        "electro": "keys",
        "lead": "keys",
        "wave": "keys",
        "drum": "drums",
        "c2d_organ": "keys",
        "c2d organ": "keys",
        "accessories": "accessories",
        "software": "software",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MOOG
    # ─────────────────────────────────────────────────────────────────────────
    "moog": {
        "synthesizers": "keys",
        "effects": "guitars",
        "keyboards": "keys",
        "controllers": "keys",
        "accessories": "accessories",
        "apps": "software",
        "semi_modular": "keys",
        "semi-modular": "keys",
        "polyphonic": "keys",
        "monophonic": "keys",
        "modular": "keys",
        "moogerfooger": "guitars",
        "minifooger": "guitars",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # UNIVERSAL AUDIO
    # ─────────────────────────────────────────────────────────────────────────
    "universal-audio": {
        "interfaces": "studio",
        "audio interfaces": "studio",
        "preamps": "studio",
        "plugins": "software",
        "uad": "software",
        "apollo": "studio",
        "volt": "studio",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # ADAM AUDIO
    # ─────────────────────────────────────────────────────────────────────────
    "adam-audio": {
        "monitors": "studio",
        "studio monitors": "studio",
        "subwoofers": "studio",
        "accessories": "accessories",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # MACKIE
    # ─────────────────────────────────────────────────────────────────────────
    "mackie": {
        "monitors": "studio",
        "mixers": "live",
        "speakers": "live",
        "pa speakers": "live",
        "powered speakers": "live",
        "headphones": "accessories",
        "accessories": "accessories",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # AKAI PROFESSIONAL
    # ─────────────────────────────────────────────────────────────────────────
    "akai-professional": {
        "controllers": "dj",
        "midi controllers": "dj",
        "mpc": "dj",
        "samplers": "dj",
        "keyboards": "keys",
        "keyboard controllers": "keys",
        "accessories": "accessories",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # WARM AUDIO
    # ─────────────────────────────────────────────────────────────────────────
    "warm-audio": {
        "microphones": "studio",
        "preamps": "studio",
        "compressors": "studio",
        "eq": "studio",
        "outboard": "studio",
    },

    # ─────────────────────────────────────────────────────────────────────────
    # TEENAGE ENGINEERING
    # ─────────────────────────────────────────────────────────────────────────
    "teenage-engineering": {
        "synthesizers": "keys",
        "pocket operators": "dj",
        "op": "keys",
        "op-1": "keys",
        "op-z": "dj",
        "accessories": "accessories",
        "audio": "dj",
    },
}


# =============================================================================
# CONSOLIDATION FUNCTIONS
# =============================================================================

def _infer_category_from_label(label: str) -> str:
    """
    Infer consolidated category from category label keywords.
    Used as fallback when no explicit mapping exists.
    """
    lower = label.lower()

    # Keys & Pianos
    if any(kw in lower for kw in ["piano", "synth", "keyboard", "organ", "keys", "workstation"]):
        return "keys"

    # Drums & Percussion
    if any(kw in lower for kw in ["drum", "percussion", "cymbal", "v-drum"]):
        return "drums"

    # Guitars & Amps
    if any(kw in lower for kw in ["guitar", "bass", "amp", "pedal", "effect", "stomp"]):
        return "guitars"

    # Studio & Recording
    if any(kw in lower for kw in ["monitor", "interface", "mic", "recording", "preamp", "compressor"]):
        return "studio"

    # Live Sound
    if any(kw in lower for kw in ["speaker", "mixer", "pa", "subwoofer", "live", "wireless"]):
        return "live"

    # DJ & Production
    if any(kw in lower for kw in ["dj", "turntable", "sampler", "mpc", "loop", "groovebox"]):
        return "dj"

    # Software & Cloud
    if any(kw in lower for kw in ["software", "cloud", "plugin", "app"]):
        return "software"

    # Default: Accessories
    return "accessories"


def consolidate_category(brand_id: str, brand_category: str) -> str:
    """
    Get the consolidated UI category for a brand's category label.

    Args:
        brand_id: The brand identifier (e.g., "roland", "boss")
        brand_category: The original category from brand taxonomy

    Returns:
        The consolidated category ID (e.g., "keys", "drums")
    """
    normalized_brand = brand_id.lower().strip()
    normalized_category = brand_category.lower().strip().replace("_", " ")

    # Look up the brand's mappings
    brand_mapping = BRAND_MAPPINGS.get(normalized_brand)
    if brand_mapping:
        # Try exact match first
        exact_match = brand_mapping.get(normalized_category)
        if exact_match:
            return exact_match

        # Try with underscores replaced
        underscore_key = normalized_category.replace(" ", "_")
        underscore_match = brand_mapping.get(underscore_key)
        if underscore_match:
            return underscore_match

        # Try fuzzy matching on keywords
        for key, value in brand_mapping.items():
            if normalized_category in key or key in normalized_category:
                return value

    # Fallback: Try to infer from category name using keywords
    return _infer_category_from_label(normalized_category)


def get_consolidated_category(category_id: str) -> Optional[ConsolidatedCategory]:
    """Get the consolidated category definition by ID."""
    for cat in CONSOLIDATED_CATEGORIES:
        if cat.id == category_id:
            return cat
    return None


def get_all_consolidated_categories() -> List[ConsolidatedCategory]:
    """Get all consolidated categories in display order."""
    return sorted(CONSOLIDATED_CATEGORIES, key=lambda c: c.sort_order)


def consolidate_product_category(product: dict) -> Tuple[str, str, str, str]:
    """
    Consolidate a product's category for UI display.
    
    Args:
        product: Product dictionary with 'brand', 'category', and 'id' fields
        
    Returns:
        Tuple of (consolidated_id, consolidated_label, original_category, brand_id)
    """
    brand_id = product.get("brand", product.get("id", "unknown").split("-")[0])
    original_category = product.get("category", "Uncategorized")
    consolidated_id = consolidate_category(brand_id, original_category)
    consolidated = get_consolidated_category(consolidated_id)

    return (
        consolidated_id,
        consolidated.label if consolidated else "Accessories",
        original_category,
        brand_id,
    )


def group_products_by_consolidated_category(products: List[dict]) -> Dict[str, List[dict]]:
    """
    Group products by consolidated category.
    Useful for building category-based navigation.
    """
    groups: Dict[str, List[dict]] = {cat.id: [] for cat in CONSOLIDATED_CATEGORIES}

    for product in products:
        consolidated_id, _, _, _ = consolidate_product_category(product)
        groups[consolidated_id].append(product)

    return groups


def get_category_color_for_brand_category(brand_id: str, brand_category: str) -> str:
    """Get category color for a brand's category."""
    consolidated_id = consolidate_category(brand_id, brand_category)
    cat = get_consolidated_category(consolidated_id)
    return cat.color if cat else "#64748b"


def get_category_icon_for_brand_category(brand_id: str, brand_category: str) -> str:
    """Get category icon for a brand's category."""
    consolidated_id = consolidate_category(brand_id, brand_category)
    cat = get_consolidated_category(consolidated_id)
    return cat.icon if cat else "🔧"


def get_brand_categories_for_consolidated(consolidated_id: str) -> List[Tuple[str, List[str]]]:
    """
    Get all brand categories that map to a consolidated category.
    Useful for filtering products across brands.
    
    Returns:
        List of (brand_id, [matching_categories]) tuples
    """
    result = []

    for brand_id, mappings in BRAND_MAPPINGS.items():
        matching_categories = [
            brand_cat for brand_cat, cons_cat in mappings.items()
            if cons_cat == consolidated_id
        ]
        if matching_categories:
            result.append((brand_id, matching_categories))

    return result


# =============================================================================
# VALIDATION REPORT
# =============================================================================

def validate_category_mappings() -> Dict:
    """
    Validate all category mappings and return a report.
    Useful for debugging and ensuring coverage.
    """
    report = {
        "total_brands": len(BRAND_MAPPINGS),
        "total_mappings": sum(len(m) for m in BRAND_MAPPINGS.values()),
        "consolidated_categories": [c.id for c in CONSOLIDATED_CATEGORIES],
        "coverage": {},
    }

    # Check coverage for each consolidated category
    for cat in CONSOLIDATED_CATEGORIES:
        brand_coverage = get_brand_categories_for_consolidated(cat.id)
        report["coverage"][cat.id] = {
            "label": cat.label,
            "brands_with_mappings": len(brand_coverage),
            "total_brand_categories": sum(len(cats) for _, cats in brand_coverage),
        }

    return report


if __name__ == "__main__":
    # Test the consolidator
    print("=" * 60)
    print("Category Consolidator - Validation Report")
    print("=" * 60)
    
    import json
    report = validate_category_mappings()
    print(json.dumps(report, indent=2))
    
    print("\n" + "=" * 60)
    print("Example Translations:")
    print("=" * 60)
    
    examples = [
        ("roland", "Pianos"),
        ("roland", "Drums & Percussion"),
        ("nord", "Stage"),
        ("nord", "Piano"),
        ("boss", "Effects Pedals"),
        ("moog", "Synthesizers"),
        ("unknown", "Some Random Category"),
    ]
    
    for brand, cat in examples:
        consolidated = consolidate_category(brand, cat)
        consolidated_cat = get_consolidated_category(consolidated)
        print(f"  {brand:20} | {cat:25} → {consolidated_cat.icon if consolidated_cat else '?'} {consolidated_cat.label if consolidated_cat else 'Unknown'}")
