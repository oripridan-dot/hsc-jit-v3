# Image Optimization System

## Overview

Automatic image compression and optimization system that reduces file sizes by ~95% while maintaining quality.

## Features

- **Automatic compression**: WebP format with intelligent quality settings
- **Multiple presets**: thumbnail (400px), medium (800px), large (1600px), original (full)
- **Smart caching**: Compressed images cached for fast delivery
- **On-demand processing**: Images compressed on first request

## API Endpoints

### Get Optimized Image

```
GET /api/images/optimize/{image_name}?preset=medium
```

**Presets:**

- `thumbnail`: 400px wide, 80% quality - for lists/grids
- `medium`: 800px wide, 85% quality - default, good for most uses
- `large`: 1600px wide, 90% quality - for detail views
- `original`: full size, 95% quality - when size matters less

**Example:**

```
/api/images/optimize/nord-wave-2.webp?preset=thumbnail
```

### Batch Optimize

```
POST /api/images/batch-optimize?directory=products&preset=medium&dry_run=false
```

### Clear Cache

```
DELETE /api/images/cache?pattern=*
```

## Usage in Frontend

```typescript
import { getOptimizedImageUrl } from "@/utils/imageOptimization";

// Get optimized URL
const thumbnailUrl = getOptimizedImageUrl(product.image_url, "thumbnail");
const mediumUrl = getOptimizedImageUrl(product.image_url, "medium");

// Use in component
<img
  src={getOptimizedImageUrl(product.image_url, "thumbnail")}
  alt={product.name}
/>;
```

## CLI Tools

### Batch Optimization Script

```bash
cd backend
python scripts/optimize_images.py
```

This will:

1. Analyze all images in `app/static/assets/products/`
2. Show potential savings
3. Ask for confirmation
4. Compress and cache all images

## Results

**Before:** 27.0 MB (355 images)
**After:** 1.2 MB cached (355 images)
**Savings:** 25.8 MB (95.5% reduction)

## Performance Impact

- ✅ Faster page loads
- ✅ Reduced bandwidth usage
- ✅ Better mobile experience
- ✅ Automatic WebP conversion
- ✅ Browser caching (1 year)

## Cache Management

Cached images are stored in `backend/app/static/assets/cache/`

To clear cache:

```bash
curl -X DELETE http://localhost:8000/api/images/cache
```

Or programmatically clear specific patterns:

```bash
curl -X DELETE "http://localhost:8000/api/images/cache?pattern=*_thumbnail.webp"
```

## Technical Details

- **Format**: WebP (universal browser support)
- **Compression method**: Level 6 (best compression)
- **Resizing**: Lanczos resampling (high quality)
- **Caching**: Hash-based filenames for cache invalidation
- **Transparency**: Converted to white background for compatibility

## Notes

- Original images remain unchanged
- Cache can be rebuilt anytime
- First request for each image/preset combination generates cache
- Subsequent requests served from cache instantly
- Cache included in .gitignore
