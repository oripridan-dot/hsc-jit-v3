# Logo Acquisition Guide

## Status
- **Available logos**: 3 (Roland, Boss, Nord)  
- **Placeholder/Fallback logos**: 87 brands

## For Getting Real Logos

### Recommended Approach: Brand Websites
Most professional music equipment manufacturers have logos available on their official websites. You can extract them from:

1. **About/Brand pages**: Most brands display their logo prominently
2. **Social media**: Twitter, Instagram, LinkedIn profiles have logos  
3. **Logo/press kit pages**: Many have dedicated press resources

### Service Options (May require subscription)
- **Clearbit**: Free tier available via API (requires network access)
- **BrandCrowd**: Logo database
- **LogoTown**: Music industry logos
- **CDNs**: Many brands serve logos via CloudFlare or similar

### Quick Acquisition Steps

1. **Visit brand website** from the catalog (each brand has a `website` field)
2. **Right-click logo** → Save as PNG/SVG
3. **Save to**: `/backend/app/static/assets/brands/{brand_id}.png`
4. **Format**: PNG or SVG (PNG preferred, 256x256 or larger)

### Featured Brands (Priority Order)

These high-traffic brands should be prioritized:

| Brand ID | Name | Website |
|----------|------|---------|
| akai-professional | Akai Professional | https://www.akaipro.com |
| allen-and-heath | Allen & Heath | https://www.allen-heath.com |
| boss | Boss | https://www.boss.info |
| dynaudio | Dynaudio | https://www.dynaudio.com |
| krk | KRK | https://www.krksys.com |
| mackie | Mackie | https://www.mackie.com |
| m-audio | M-Audio | https://www.m-audio.com |
| moog | Moog | https://www.moogmusic.com |
| nord | Nord | https://www.nordkeyboards.com |
| oberheim | Oberheim | https://oberheim.com |
| pearl | Pearl | https://www.pearldrums.com |
| presonus | PreSonus | https://www.presonus.com |
| remo | Remo | https://www.remo.com |
| roland | Roland | https://www.roland.com |
| steinberg | Steinberg | https://www.steinberg.net |
| universal-audio | Universal Audio | https://www.uaudio.com |

## Brand Logos CSV Export

To bulk-download logos, use this mapping (brand_id → website):

```csv
adam-audio,https://www.adamaudio.com
akai-professional,https://www.akaipro.com
allen-and-heath,https://www.allen-heath.com
ampeg,https://www.ampeg.com
amphion,https://www.amphion.fi
...
```

## Frontend Logo Loading

The `SmartImage` component handles missing logos gracefully:

```tsx
<SmartImage 
  src={brand.logo_url}  // Falls back to initials if missing
  alt={brand.name}
  className="w-12 h-12"
/>
```

**Fallback behavior**: Shows brand name initials on a colored background

## Verification

After adding logos, verify they load:

```bash
# Check available logos
ls -la backend/app/static/assets/brands/

# Run frontend
pnpm dev

# Check network tab in DevTools for logo URLs
```

## Notes

- Logos use `/static/assets/brands/{brand_id}.png` convention
- Store as PNG (256x256 minimum recommended)
- SVG is also supported for better scalability
- The manifest tracks which logos are available vs. fallback
