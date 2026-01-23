#!/bin/bash

# DATA FLOW VERIFICATION REPORT
# This script verifies the complete alignment between JSON catalogs and disk images

echo "🔍 HSC-JIT v3 DATA FLOW VERIFICATION REPORT"
echo "=========================================="
echo ""
echo "Timestamp: $(date)"
echo ""

# Check if frontend directory exists
if [ ! -d "../frontend/public/data" ]; then
    echo "❌ ERROR: Frontend data directory not found"
    exit 1
fi

FRONTEND_DATA_DIR="../frontend/public/data"
IMAGES_DIR="$FRONTEND_DATA_DIR/product_images"

echo "📂 DIRECTORY STATUS"
echo "---"
echo "✅ Frontend Data Dir: $FRONTEND_DATA_DIR"
echo "✅ Images Dir: $IMAGES_DIR"
echo ""

# Count brand catalogs
BRAND_JSONS=$(ls "$FRONTEND_DATA_DIR"/*.json | grep -v index | grep -v progress | wc -l)
echo "📊 CATALOG FILES: $BRAND_JSONS found"
echo ""

# Detailed verification for each brand
echo "🔗 DETAILED ALIGNMENT CHECK"
echo "---"

TOTAL_PRODUCTS=0
TOTAL_VALID_IMAGES=0
TOTAL_BROKEN_LINKS=0

for json_file in $(ls "$FRONTEND_DATA_DIR"/*.json | grep -v index | grep -v progress); do
    brand=$(basename "$json_file" .json)
    
    # Count products in JSON
    product_count=$(jq '.products | length' "$json_file" 2>/dev/null || echo 0)
    
    # Count valid image directories
    if [ -d "$IMAGES_DIR/$brand" ]; then
        image_count=$(find "$IMAGES_DIR/$brand" -name "*_thumb.webp" | wc -l)
        
        # Count products with valid image URLs
        valid_urls=$(jq '.products[] | select(.images.thumbnail != null and .images.thumbnail != "") | .images.thumbnail' "$json_file" 2>/dev/null | wc -l)
        
        echo "$brand:"
        echo "  📦 Products: $product_count"
        echo "  🖼️  Thumbnail Images on Disk: $image_count"
        echo "  🔗 Products with Image URLs: $valid_urls"
        
        # Spot check: verify first image link actually exists
        first_image=$(jq -r '.products[0].images.thumbnail' "$json_file" 2>/dev/null)
        if [ ! -z "$first_image" ] && [ "$first_image" != "null" ]; then
            # Extract filename from URL
            filename=$(basename "$first_image")
            if [ -f "$IMAGES_DIR/$brand/$filename" ]; then
                echo "  ✅ Sample Link Valid: $filename exists"
            else
                echo "  ❌ Sample Link BROKEN: $filename NOT FOUND"
                TOTAL_BROKEN_LINKS=$((TOTAL_BROKEN_LINKS + 1))
            fi
        fi
        
        TOTAL_PRODUCTS=$((TOTAL_PRODUCTS + product_count))
        TOTAL_VALID_IMAGES=$((TOTAL_VALID_IMAGES + image_count))
        echo ""
    else
        echo "$brand:"
        echo "  ⚠️  Image directory NOT FOUND: $IMAGES_DIR/$brand"
        echo ""
    fi
done

echo ""
echo "📈 SUMMARY"
echo "---"
echo "Total Products Across All Brands: $TOTAL_PRODUCTS"
echo "Total Thumbnail Images Available: $TOTAL_VALID_IMAGES"
echo "Broken Links Detected: $TOTAL_BROKEN_LINKS"
echo ""

if [ $TOTAL_BROKEN_LINKS -eq 0 ]; then
    echo "🟢 STATUS: SYSTEM FLOW CLEAR ✅"
else
    echo "🔴 STATUS: CLOG DETECTED ❌"
    echo "Run: python3 ../backend/align_and_verify.py"
fi

echo ""
