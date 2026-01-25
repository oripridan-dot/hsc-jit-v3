import json
import glob
import os
from collections import defaultdict

# Definitions copied from generate_final_category_thumbnails.py
SPECTRUM_DEFINITIONS = {
    # --- GUITARS ---
    "electric-guitars": ["Electric Guitar", "Solid Body", "Telecaster", "Stratocaster", "Les Paul", "SG", "Electric"],
    "acoustic-guitars": ["Acoustic Guitar", "Classical Guitar", "Dreadnought", "Concert", "Nylon String", "Steel String"],
    "bass-guitars": ["Bass Guitar", "Precision Bass", "Jazz Bass", "4-String", "5-String"],
    "guitar-amps": ["Guitar Amplifier", "Guitar Amp", "Combo Amp", "Cabinet", "Head"],
    "guitar-pedals": ["Overdrive", "Distortion", "Reverb", "Delay", "Looper", "Fuzz", "Guitar Pedal", "Stompbox"],
    "folk-instruments": ["Ukulele", "Banjo", "Mandolin", "Resonator"],
    "guitar-accessories": ["Guitar Strings", "Guitar Strap", "Capo", "Pick", "Gig Bag", "Case"],

    # --- DRUMS ---
    "acoustic-drums": ["Drum Kit", "Shell Pack", "Acoustic Drum", "Bass Drum"],
    "electronic-drums": ["Electronic Drum", "V-Drums", "Drum Module", "Electric Kit"],
    "cymbals": ["Crash", "Ride", "Hi-Hat", "Splash", "China", "Cymbal"],
    "snares": ["Snare Drum", "Snare"],
    "sticks-heads": ["Drumsticks", "Drum Head", "Brushes"],
    "percussion": ["Cajon", "Bongos", "Congas", "Djembe", "Shaker", "Tambourine", "Cowbell"],
    "drum-hardware": ["Cymbal Stand", "Hi-Hat Stand", "Snare Stand", "Drum Pedal", "Throne"],

    # --- KEYS ---
    "synthesizers": ["Synthesizer", "Synth", "Analog Synth", "Polyphonic"],
    "stage-pianos": ["Stage Piano", "Digital Piano", "Electric Piano"],
    "midi-controllers": ["MIDI Controller", "Keyboard Controller", "Master Keyboard"],
    "grooveboxes": ["Groovebox", "Sampler", "Drum Machine", "Sequencer"],
    "eurorack": ["Eurorack", "Modular", "Module"],
    "keys-accessories": ["Keyboard Stand", "Sustain Pedal"],

    # --- STUDIO ---
    "audio-interfaces": ["Audio Interface", "USB Interface", "Thunderbolt"],
    "studio-monitors": ["Studio Monitor", "Reference Monitor", "Active Monitor"],
    "studio-microphones": ["Condenser Microphone", "Dynamic Microphone", "Ribbon Microphone", "Studio Mic"],
    "outboard-gear": ["Preamp", "Compressor", "Equalizer", "Channel Strip"],
    "software-plugins": ["DAW", "Plugin", "VST", "Software"],
    "studio-accessories": ["Pop Filter", "Shock Mount", "Acoustic Foam"],

    # --- LIVE ---
    "pa-systems": ["PA Speaker", "Active Speaker", "Subwoofer", "Line Array"],
    "live-mixers": ["Mixing Console", "Digital Mixer", "Analog Mixer"],
    "dj-equipment": ["DJ Controller", "Turntable", "DJ Mixer"],
    "lighting": ["Moving Head", "Par Can", "Stage Light", "DMX"],
    "live-mics": ["Wireless Microphone", "Handheld Mic", "Vocal Mic"],
    "live-accessories": ["Speaker Stand", "Microphone Stand", "XLR Cable"],

     # --- UTILITY ---
    "cables": ["Instrument Cable", "Patch Cable", "Microphone Cable"],
    "stands": ["Music Stand", "Guitar Stand"],
    "cases-bags": ["Flight Case", "Soft Case"],
    "power-supplies": ["Power Supply", "Battery"],
}

# Brand Colors (The Palette)
BRAND_PALETTE = {
    "Roland": "#ff8c00",
    "Boss": "#06b6d4",
    "Nord": "#e61d2b",
    "Moog": "#9333ea", # Purple
    "Akai": "#ef4444",
    "Mackie": "#22c55e",
    "PreSonus": "#0ea5e9",
    "Universal Audio": "#94a3b8", # Silver
    "KRK": "#facc15", # Yellow
    "Adam Audio": "#facc15",  # Often yellow ribbon
    "Ampeg": "#7e22ce", # Purple
    "Warm Audio": "#f97316", # Orange
    "Arturia": "#ffffff",
    "Behringer": "#eab308",
    "Pearl": "#ef4444",
    "Yamaha": "#7c3aed",
    "Korg": "#2563eb",
    "Fender": "#ef4444",
    "Gibson": "#eab308",
    "Ibanez": "#ef4444",
    "ESP": "#ef4444",
    "Spector": "#14b8a6",
    "Darkglass": "#1f2937",
    "Solid State Logic": "#94a3b8",
    "Neve": "#1e3a8a", # Dark Blue
    "API": "#ea580c", # Orange/Red
    "Manley": "#7c3aed", # Purple
    "Topp Pro": "#2563eb",
    "Montarbo": "#ef4444",
    "Allen & Heath": "#ef4444",
    "M-Audio": "#ef4444",
    "Denon": "#22c55e",
    "Rane": "#3b82f6",
    "Numark": "#8b5cf6",
    "Steinberg": "#ef4444",
    "Washburn": "#f97316",
    "Breedlove": "#f97316",
    "Lag Guitars": "#f97316",
    "V-Moda": "#ef4444",
}
DEFAULT_COLOR = "#a1a1aa" # Zinc 400

def get_spectrum_id(product):
    # Logic to match product to spectrum
    text = (product.get("name", "") + " " + product.get("category", "")).lower()
    best_match = None
    best_score = 0
    
    for spec_id, keywords in SPECTRUM_DEFINITIONS.items():
        score = 0
        for k in keywords:
            if k.lower() in text:
                score += 1
        if score > best_score:
            best_score = score
            best_match = spec_id
            
    return best_match

def run():
    print("🔍 Analyzing Brands per Spectrum ID...")
    spectrum_brands = defaultdict(set)
    
    files = glob.glob("frontend/public/data/*.json")
    for f in files:
        if "index.json" in f or "taxonomy.json" in f or "scrape" in f or "log" in f: continue
        if "catalog" in f: continue
        
        try:
            with open(f, 'r') as json_f:
                data = json.load(json_f)
                brand_name = data.get("brand_identity", {}).get("name")
                if not brand_name:
                    # Infer from filename
                    brand_name = os.path.basename(f).replace(".json", "").replace("-", " ").title()
                
                # print(f"  > Processing {brand_name}...")
                products = data.get("products", [])
                for p in products:
                    spec_id = get_spectrum_id(p)
                    if spec_id:
                        spectrum_brands[spec_id].add(brand_name)
        except Exception as e:
            print(f"Error reading {f}: {e}")

    # Convert to JSON friendly format with Colors
    output = {}
    for spec_id, brands in spectrum_brands.items():
        brand_list = sorted(list(brands))
        # Map to colors
        colors = []
        unique_colors = set()
        
        # Prioritize brands in palette
        sorted_brands = sorted(brand_list, key=lambda x: 0 if any(k.lower() in x.lower() for k in BRAND_PALETTE) else 1)
        
        for b in sorted_brands:
            # Fuzzy match brand name to palette
            color = DEFAULT_COLOR
            matched = False
            for pb, pc in BRAND_PALETTE.items():
                if pb.lower() in b.lower() or b.lower() in pb.lower():
                    color = pc
                    matched = True
                    break
            
            if color not in unique_colors:
                colors.append(color)
                unique_colors.add(color)
        
        # Take up to 6 unique colors
        output[spec_id] = colors[:6]
        # print(f"  {spec_id}: {len(colors)} colors ({brand_list})")

    # Ensure all spectrum IDs have at least one color (default)
    for spec_id in SPECTRUM_DEFINITIONS.keys():
        if spec_id not in output or not output[spec_id]:
             output[spec_id] = [DEFAULT_COLOR]

    with open("frontend/src/lib/generatedSpectrumBrands.json", "w") as out:
        json.dump(output, out, indent=2)
    print("✅ Generated frontend/src/lib/generatedSpectrumBrands.json")

if __name__ == "__main__":
    run()
