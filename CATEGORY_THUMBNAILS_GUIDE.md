# Category Thumbnails Replacement Guide

## Issue
All 40 category thumbnail images need to be replaced with appropriate visuals representing their categories.

## Current Structure
Location: `frontend/public/data/category_thumbnails/`

Each category has TWO image files:
- `{category}_thumb.webp` - 400x400px thumbnail (used in category grid)
- `{category}_inspect.webp` - Larger inspection view (used in detailed view)

## Required Categories (40 total)

### Keys & Pianos (6)
- [ ] keys-synths_thumb.webp / keys-synths_inspect.webp
- [ ] keys-stage-pianos_thumb.webp / keys-stage-pianos_inspect.webp
- [ ] keys-controllers_thumb.webp / keys-controllers_inspect.webp
- [ ] keys-arrangers_thumb.webp / keys-arrangers_inspect.webp
- [ ] keys-organs_thumb.webp / keys-organs_inspect.webp
- [ ] keys-workstations_thumb.webp / keys-workstations_inspect.webp

### Drums & Percussion (6)
- [ ] drums-electronic-drums_thumb.webp / drums-electronic-drums_inspect.webp
- [ ] drums-acoustic-drums_thumb.webp / drums-acoustic-drums_inspect.webp
- [ ] drums-cymbals_thumb.webp / drums-cymbals_inspect.webp
- [ ] drums-percussion_thumb.webp / drums-percussion_inspect.webp
- [ ] drums-drum-machines_thumb.webp / drums-drum-machines_inspect.webp
- [ ] drums-pads_thumb.webp / drums-pads_inspect.webp

### Guitars & Amps (6)
- [ ] guitars-electric-guitars_thumb.webp / guitars-electric-guitars_inspect.webp
- [ ] guitars-bass-guitars_thumb.webp / guitars-bass-guitars_inspect.webp
- [ ] guitars-amplifiers_thumb.webp / guitars-amplifiers_inspect.webp
- [ ] guitars-effects-pedals_thumb.webp / guitars-effects-pedals_inspect.webp
- [ ] guitars-multi-effects_thumb.webp / guitars-multi-effects_inspect.webp
- [ ] guitars-accessories_thumb.webp / guitars-accessories_inspect.webp

### Studio & Recording (6)
- [ ] studio-audio-interfaces_thumb.webp / studio-audio-interfaces_inspect.webp
- [ ] studio-studio-monitors_thumb.webp / studio-studio-monitors_inspect.webp
- [ ] studio-microphones_thumb.webp / studio-microphones_inspect.webp
- [ ] studio-outboard-gear_thumb.webp / studio-outboard-gear_inspect.webp
- [ ] studio-preamps_thumb.webp / studio-preamps_inspect.webp
- [ ] studio-software_thumb.webp / studio-software_inspect.webp

### Live Sound (5)
- [ ] live-pa-speakers_thumb.webp / live-pa-speakers_inspect.webp
- [ ] live-mixers_thumb.webp / live-mixers_inspect.webp
- [ ] live-stage-boxes_thumb.webp / live-stage-boxes_inspect.webp
- [ ] live-wireless-systems_thumb.webp / live-wireless-systems_inspect.webp
- [ ] live-in-ear-monitoring_thumb.webp / live-in-ear-monitoring_inspect.webp

### DJ & Production (5)
- [ ] dj-production_thumb.webp / dj-production_inspect.webp
- [ ] dj-dj-headphones_thumb.webp / dj-dj-headphones_inspect.webp
- [ ] dj-samplers_thumb.webp / dj-samplers_inspect.webp
- [ ] dj-grooveboxes_thumb.webp / dj-grooveboxes_inspect.webp
- [ ] dj-accessories_thumb.webp / dj-accessories_inspect.webp

### Software & Cloud (3)
- [ ] software-daw_thumb.webp / software-daw_inspect.webp
- [ ] software-plugins_thumb.webp / software-plugins_inspect.webp
- [ ] software-sound-libraries_thumb.webp / software-sound-libraries_inspect.webp

### Accessories (3)
- [ ] accessories-cables_thumb.webp / accessories-cables_inspect.webp
- [ ] accessories-cases_thumb.webp / accessories-cases_inspect.webp
- [ ] accessories-pedals_thumb.webp / accessories-pedals_inspect.webp
- [ ] accessories-power_thumb.webp / accessories-power_inspect.webp
- [ ] accessories-stands_thumb.webp / accessories-stands_inspect.webp

## Image Specifications

### Format & Size
- **Format**: WebP (lossy, optimized)
- **Thumbnail**: 400x400px
- **Inspect**: 800x800px (or proportionally larger)
- **Quality**: 92% (thumbnails), 95% (inspect)
- **Background**: Transparent (PNG alpha) or white background

### Content Guidelines
Each image should feature:
1. **Representative product(s)** for that category
2. **Clear, uncluttered** composition
3. **Professional quality** (high-res source material)
4. **Consistent style** across all thumbnails
5. **Good contrast** for visibility at small sizes

## How to Replace

### Option 1: Manual Upload (if you have images)
1. Place `.webp` files in `frontend/public/data/category_thumbnails/`
2. Ensure naming follows: `{category}_{thumb|inspect}.webp`
3. Commit to git

### Option 2: Generate Placeholder Images
Run the image generator script:
```bash
cd backend
python3 generate_category_thumbnails.py
```

### Option 3: Source from Products
Extract best product images from your catalog:
```bash
cd backend
python3 extract_best_category_images.py
```

## Testing
After replacing images:
1. Start the dev server: `cd frontend && pnpm dev`
2. Navigate to categories and verify visual representations
3. Check both mobile (400px) and desktop (800px) rendering
4. Ensure images load without errors in browser console

## Current Issues
- **Keys**: Generic placeholder (should show synthesizer, stage piano)
- **Drums**: Generic placeholder (should show drum kit, electronic drums)
- **Guitars**: Generic placeholder (should show guitar, amp, pedals)
- **Studio**: Generic placeholder (should show interface, monitors, mic)
- **Live**: Generic placeholder (should show speakers, mixer)
- **DJ**: Generic placeholder (should show headphones, sampler, production gear)
- **Software**: Generic placeholder (should show DAW UI, plugins)
- **Accessories**: Generic placeholder (should show cables, cases, stands)

## Next Steps
1. Identify image source (purchase stock photos, use product images, AI generation, etc.)
2. Convert to WebP format with transparent backgrounds
3. Resize to 400x400 (thumb) and 800x800 (inspect)
4. Replace files in `frontend/public/data/category_thumbnails/`
5. Test and commit
