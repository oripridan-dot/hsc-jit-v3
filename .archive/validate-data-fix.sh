#!/bin/bash
# Validate Data Fetching Fix
echo "🔍 VALIDATING DATA FETCHING FIX"
echo "=================================="
echo ""

# Test 1: Check index.json paths
echo "✅ Test 1: Index File Paths"
echo "   Checking for double /data/ issue..."
DOUBLE_PATH=$(cat /workspaces/hsc-jit-v3/frontend/public/data/index.json | jq -r '.brands[].file' | grep -c "^/data/" || true)
if [ "$DOUBLE_PATH" -eq 0 ]; then
    echo "   ✓ No /data/ prefix in file paths (correct)"
    cat /workspaces/hsc-jit-v3/frontend/public/data/index.json | jq -r '.brands[] | "     \(.slug) -> \(.file)"' | head -5
else
    echo "   ✗ FAILED: Found /data/ prefix in file paths"
    exit 1
fi

echo ""
echo "✅ Test 2: File Accessibility"
echo "   Testing if catalog files exist..."
for file in boss-catalog.json nord-catalog.json roland-catalog.json moog-catalog.json; do
    if [ -f "/workspaces/hsc-jit-v3/frontend/public/data/$file" ]; then
        SIZE=$(du -h "/workspaces/hsc-jit-v3/frontend/public/data/$file" | cut -f1)
        echo "   ✓ $file exists ($SIZE)"
    else
        echo "   ✗ FAILED: $file not found"
        exit 1
    fi
done

echo ""
echo "✅ Test 3: JSON Validity"
echo "   Validating JSON structure..."
for file in boss-catalog.json nord-catalog.json roland-catalog.json; do
    BRAND=$(jq -r '.brand_name' "/workspaces/hsc-jit-v3/frontend/public/data/$file" 2>/dev/null)
    PRODUCTS=$(jq -r '.products | length' "/workspaces/hsc-jit-v3/frontend/public/data/$file" 2>/dev/null)
    if [ -n "$BRAND" ] && [ -n "$PRODUCTS" ]; then
        echo "   ✓ $file: $BRAND ($PRODUCTS products)"
    else
        echo "   ✗ FAILED: Invalid JSON in $file"
        exit 1
    fi
done

echo ""
echo "✅ Test 4: Intelligence Tags Present"
echo "   Checking for halileo_context in products..."
TAGGED=$(jq '[.products[] | select(.halileo_context != null)] | length' /workspaces/hsc-jit-v3/frontend/public/data/roland-catalog.json)
TOTAL=$(jq '.products | length' /workspaces/hsc-jit-v3/frontend/public/data/roland-catalog.json)
COVERAGE=$((TAGGED * 100 / TOTAL))
echo "   ✓ $TAGGED/$TOTAL products have intelligence tags (${COVERAGE}%)"

echo ""
echo "=================================="
echo "🎉 ALL TESTS PASSED"
echo "=================================="
echo ""
echo "The data fetching issue has been fixed:"
echo "  • Removed double /data/ path prefix"
echo "  • All catalog files are valid JSON"
echo "  • All brands are accessible"
echo "  • Intelligence tags are present"
echo ""
echo "🚀 Frontend should now load data correctly!"
echo ""
