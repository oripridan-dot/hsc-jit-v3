"""
Category Consolidator - The "Logic Engine" (v3.0 - Galaxy/Spectrum)

This module implements the "Galaxy -> Spectrum" mapping logic.
It takes raw scraped data and routes it to specific Spectrum IDs.

Architecture:
1. Scraper gets "Raw Category" (e.g. "Solid Body Electric")
2. Consolidator maps it to "Spectrum ID" (e.g. "electric-guitars")
3. Frontend maps Spectrum ID to Galaxy (e.g. "guitars-bass") using taxonomy.json
"""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class ConsolidatedCategory:
    id: str
    label: str
    icon: str
    color: str
    description: str
    sort_order: int

# Reference for the 6 Galaxies (Tribes) - Source of Truth is taxonomy.json
CONSOLIDATED_CATEGORIES: List[ConsolidatedCategory] = [
    ConsolidatedCategory("guitars-bass", "Guitars & Bass", "guitar", "var(--galaxy-orange)", "The Plucked Universe", 1),
    ConsolidatedCategory("drums-percussion", "Drums & Percussion", "drum", "var(--galaxy-red)", "The Struck Universe", 2),
    ConsolidatedCategory("keys-production", "Keys & Synths", "piano", "var(--galaxy-purple)", "The Synthesis Universe", 3),
    ConsolidatedCategory("studio-recording", "Studio & Recording", "mic", "var(--galaxy-blue)", "The Engineer's Universe", 4),
    ConsolidatedCategory("live-dj", "Live Sound & DJ", "speaker", "var(--galaxy-green)", "The Stage Universe", 5),
    ConsolidatedCategory("accessories-utility", "General Utility", "plug", "var(--galaxy-gray)", "The Connection Universe", 6),
]

# The Logic: Mapping "Raw Scraped Terms" -> "Spectrum IDs"
SPECTRUM_MAP = {
    # --- GUITARS GALAXY ---
    "electric guitar": "electric-guitars",
    "solid body": "electric-guitars",
    "hollow body": "electric-guitars",
    "acoustic guitar": "acoustic-guitars",
    "classical guitar": "acoustic-guitars",
    "bass guitar": "bass-guitars",
    "4-string bass": "bass-guitars",
    "guitar amp": "guitar-amps",
    "cabinet": "guitar-amps",
    "pedal": "guitar-pedals",
    "stompbox": "guitar-pedals",
    "ukulele": "folk-instruments",
    "banjo": "folk-instruments",
    "guitar string": "guitar-accessories",
    "pick": "guitar-accessories",

    # --- DRUMS GALAXY ---
    "drum kit": "acoustic-drums",
    "shell pack": "acoustic-drums",
    "snare": "snares",
    "cymbal": "cymbals",
    "electronic drum": "electronic-drums",
    "v-drums": "electronic-drums",
    "drumstick": "sticks-heads",
    "drum head": "sticks-heads",
    "cajon": "percussion",
    "bongo": "percussion",
    "drum hardware": "drum-hardware",
    "cymbal stand": "drum-hardware",

    # --- KEYS GALAXY ---
    "synthesizer": "synthesizers",
    "eurorack": "eurorack",
    "stage piano": "stage-pianos",
    "digital piano": "stage-pianos",
    "midi controller": "midi-controllers",
    "keyboard": "midi-controllers", # Context check needed usually, but safe default
    "groovebox": "grooveboxes",
    "sampler": "grooveboxes",

    # --- STUDIO GALAXY ---
    "audio interface": "audio-interfaces",
    "studio monitor": "studio-monitors",
    "condenser microphone": "studio-microphones",
    "ribbon microphone": "studio-microphones",
    "daw": "software-plugins",
    "plugin": "software-plugins",
    "preamp": "outboard-gear",
    "compressor": "outboard-gear",

    # --- LIVE GALAXY ---
    "pa speaker": "pa-systems",
    "subwoofer": "pa-systems",
    "live mixer": "live-mixers",
    "dj controller": "dj-equipment",
    "turntable": "dj-equipment",
    "wireless microphone": "live-mics",
    "moving head": "lighting",
    "par can": "lighting",
}

def consolidate_category(raw_category_name: str, product_name: str = "") -> str:
    """
    The Router: Takes a raw string and sends it to the correct Spectrum ID.
    Ignores brand inputs - pure logic routing.
    """
    if not raw_category_name:
        return "accessories-utility"

    # 1. Normalize
    search_term = f"{raw_category_name} {product_name}".lower()

    # 2. Iterate and Match
    for keyword, spectrum_id in SPECTRUM_MAP.items():
        if keyword in search_term:
            return spectrum_id
            
    # 3. Fallback to General Utility if no match
    if "cable" in search_term: return "cables"
    if "stand" in search_term: return "stands"
    if "case" in search_term or "bag" in search_term: return "cases-bags"
    if "power" in search_term: return "power-supplies"
    
    return "accessories-utility" # The "Lost & Found" bin

# Legacy support / alias to match interface if needed
def get_consolidated_category(cat_id):
    for c in CONSOLIDATED_CATEGORIES:
        if c.id == cat_id:
            return c
    return None

if __name__ == "__main__":
    print("Testing Consolidator...")
    tests = [
        ("Solid Body Electric", "Fender Strat"),
        ("Bass Guitar", "P-Bass"),
        ("V-Drums", "TD-50"),
        ("Synthesizer", "Moog One"),
        ("Cables", "XLR Cable")
    ]
    for cat, prod in tests:
        print(f"{cat} -> {consolidate_category(cat, prod)}")
