# Visual Factory - Thumbnail Reprocessing Guide

## 🎯 Purpose

Reprocess ALL product images with:

- **Precise auto-cropping** - Tight bounds around products
- **Normalized sizing** - 400x400px canvas (up from 300x300)
- **Quality enhancement** - Sharpness, contrast, color saturation
- **Consistent appearance** - All products look professional
- **Transparent backgrounds** - Clean floating effect

## 🏭 Visual Factory Features

### Thumbnail Processing (400x400px)

1. **Background Removal** - AI-powered (rembg)
2. **Precise Auto-Crop** - Finds tight bounding box + 10px margin
3. **Smart Centering** - Maintains aspect ratio, perfectly centered
4. **Quality Boost**:
   - Auto-contrast for consistent brightness
   - 1.3x sharpness enhancement
   - 1.1x color saturation boost
5. **Optimized Output** - WebP format, 92% quality

### Inspection Images (2400px max)

1. **High Resolution** - For zoom/detail views
2. **Visual Enhancement**:
   - Contrast normalization
   - Unsharp mask for LCD/text clarity
3. **Optimized Output** - WebP format, 95% quality

## 📦 Batch Processing

### Process Single Brand Catalog

```bash
cd /workspaces/hsc-jit-v3/backend

# Roland products
python3 reprocess_thumbnails.py \
  --catalog ../frontend/public/data/roland.json \
  --output ../frontend/public/data/product_images/roland \
  --force

# Boss products
python3 reprocess_thumbnails.py \
  --catalog ../frontend/public/data/boss.json \
  --output ../frontend/public/data/product_images/boss \
  --force

# Nord products
python3 reprocess_thumbnails.py \
  --catalog ../frontend/public/data/nord.json \
  --output ../frontend/public/data/product_images/nord \
  --force
```

### Process ALL Catalogs

```bash
cd /workspaces/hsc-jit-v3/backend

# Create master processing script
for catalog in ../frontend/public/data/*.json; do
  if [[ "$catalog" != *"index.json"* ]] && [[ "$catalog" != *"scrape_progress.json"* ]]; then
    brand=$(basename "$catalog" .json)
    echo "Processing $brand..."
    python3 reprocess_thumbnails.py \
      --catalog "$catalog" \
      --output "../frontend/public/data/product_images/$brand" \
      --force
  fi
done
```

## 🎛️ Command Options

| Option      | Description                           | Default                               |
| ----------- | ------------------------------------- | ------------------------------------- |
| `--catalog` | Path to catalog JSON                  | **Required**                          |
| `--output`  | Output directory for processed images | `frontend/public/data/product_images` |
| `--force`   | Reprocess even if images exist        | `false`                               |
| `--brand`   | Process only specific brand           | All                                   |

## 📊 Output

### Files Generated Per Product

```
product_images/
├── roland/
│   ├── product_id_thumb.webp      # 400x400 thumbnail
│   ├── product_id_inspect.webp    # High-res inspection
│   └── catalog_processed.json     # Updated catalog
```

### Updated Catalog Fields

```json
{
  "id": "product_id",
  "name": "Product Name",
  "thumbnail_processed": "path/to/product_id_thumb.webp",
  "inspection_image": "path/to/product_id_inspect.webp",
  "image_dimensions": {
    "thumb": { "width": 320, "height": 280 },
    "original": { "width": 1920, "height": 1080 }
  }
}
```

## 🚀 Integration with Frontend

### Using Processed Thumbnails

The TierBar component will automatically use processed thumbnails:

```typescript
// In TierBar.tsx - displays larger, cleaner logos
<BrandIcon
  brand={product.brand}
  className="w-12 h-12"  // Larger size (was w-7 h-7)
/>

// Hover card shows processed thumbnail
<img
  src={product.thumbnail_processed || product.displayImage}
  className="max-h-full max-w-full object-contain"
/>
```

## 📈 Before & After

### Before Reprocessing

- ❌ Inconsistent sizes and quality
- ❌ White backgrounds or noise
- ❌ Products off-center
- ❌ Varying contrast and sharpness
- ❌ 300x300px (small)

### After Reprocessing

- ✅ Uniform 400x400px canvas
- ✅ Transparent backgrounds
- ✅ Perfectly centered products
- ✅ Normalized brightness and contrast
- ✅ Enhanced sharpness and color
- ✅ Optimized WebP format

## 🎨 Visual Impact

1. **Larger Thumbnails** - 33% bigger (300→400px)
2. **Better Quality** - Normalized, enhanced
3. **Consistent Look** - Professional appearance
4. **Faster Loading** - WebP optimization
5. **Clean UI** - Transparent backgrounds

## ⚡ Performance

- **WebP Format** - 25-35% smaller than PNG
- **Optimized Quality** - 92% for thumbs, 95% for inspection
- **Smart Caching** - Skip if already processed
- **Batch Processing** - Handle hundreds of products

## 🔧 Troubleshooting

### Missing Dependencies

```bash
pip install Pillow rembg requests
```

### Memory Issues

Process brands one at a time instead of all at once.

### Image Download Failures

- Check internet connection
- Verify image URLs in catalog
- Some products may have broken links

## 📝 Next Steps

1. **Run batch processor** for all brands
2. **Update catalogs** with processed image paths
3. **Deploy** new thumbnails to production
4. **Monitor** visual quality in UI
5. **Iterate** if needed with different settings

---

**Status:** Ready to process ✅  
**Estimated Time:** ~2-5 minutes per 100 products  
**Output Quality:** Professional, normalized, optimized
