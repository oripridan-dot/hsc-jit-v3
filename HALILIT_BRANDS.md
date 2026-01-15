# Halilit Official Brands - Single Source of Truth

## Source
**https://www.halilit.com/pages/4367**

This is the ONLY authoritative source for brands in this system.

## Status
✅ **84 Official Authorized Brands** extracted and validated
✅ Removed all non-Halilit brands (Yamaha, Korg, Moog, Arturia)
✅ System now uses ONLY verified Halilit distributors

## Key Changes Made

### 1. Data Cleanup
- **Removed**: `yamaha`, `korg`, `arturia`, `moog` (not in Halilit catalog)
- **Kept**: `roland`, `nord` (verified authorized)
- **Added**: Reference to 82 additional authorized brands

### 2. New Files
- `backend/data/halilit_official_brands.json` - Master brand list
- `backend/scripts/extract_halilit_brands.py` - Extractor script

### 3. Updated Files
- `backend/data/brands/brands_metadata.json` - Now includes source attribution
- `backend/scripts/harvest_all_brands.py` - Uses official brand list

## Priority Brands (First Wave Harvest)

### Synthesizers & Digital Pianos
- Roland (Inspire. Create. Connect.)
- Nord (The Legend Lives On)
- Oberheim

### Audio Interfaces & Controllers
- PreSonus
- M-Audio
- Akai Professional

### Studio Monitors
- ADAM Audio
- KRK Systems
- Dynaudio

### Guitar Effects
- Boss
- HeadRush FX
- Xotic

### PA Systems
- RCF
- Mackie

### Drums & Percussion
- Pearl
- Rogers
- Paiste Cymbals
- Remo

## Complete Brand List (84 Total)

See: `backend/data/halilit_official_brands.json`

All brands include:
- Official Halilit product page URL
- Logo URL (83/84 have logos)
- Authorization status
- Clean brand ID for routing

## Usage

### Extract Latest Brands
\`\`\`bash
cd backend
python scripts/extract_halilit_brands.py
\`\`\`

### Harvest Priority Brands
\`\`\`bash
cd backend
python scripts/harvest_all_brands.py
\`\`\`

## Architecture Impact

### Before
- Arbitrary brand list
- Mix of authorized and unauthorized brands
- No source validation

### After
- Single source of truth (Halilit website)
- All brands verified authorized
- Logo URLs from official distributor
- Clean, validated brand IDs

---

**Last Updated**: January 15, 2026
**Validator**: Halilit Music Center Official Website
