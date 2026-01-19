#!/bin/bash
# Verify Mission Control v3.7 Theming Implementation

set -e

echo "🔍 Verifying Mission Control v3.7 Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    local file=$1
    local description=$2
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: $file"
        return 0
    else
        echo -e "${RED}✗${NC} $description: $file (NOT FOUND)"
        return 1
    fi
}

check_content() {
    local file=$1
    local search_string=$2
    local description=$3
    if grep -q "$search_string" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        return 1
    fi
}

failed=0

echo "📋 Checking File Existence..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "frontend/src/hooks/useBrandTheme.ts" "useBrandTheme hook" || ((failed++))
check_file "frontend/src/components/Workbench.tsx" "Workbench component" || ((failed++))
check_file "frontend/src/components/Navigator.tsx" "Navigator component" || ((failed++))
check_file "frontend/src/styles/brandThemes.ts" "Brand themes" || ((failed++))
check_file "frontend/tailwind.config.js" "Tailwind config" || ((failed++))
check_file "frontend/public/data/index.json" "Catalog index" || ((failed++))
check_file "frontend/public/data/catalogs_brand/roland_catalog.json" "Roland catalog" || ((failed++))

echo ""
echo "🎨 Checking Implementation Details..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_content "frontend/src/hooks/useBrandTheme.ts" "BrandColors" "useBrandTheme accepts color objects" || ((failed++))
check_content "frontend/src/components/Workbench.tsx" "useBrandTheme" "Workbench applies brand theme" || ((failed++))
check_content "frontend/tailwind.config.js" "brand-primary" "Tailwind has brand color support" || ((failed++))
check_content "frontend/public/data/index.json" "brand_colors" "Index has brand metadata" || ((failed++))
check_content "frontend/public/data/catalogs_brand/roland_catalog.json" "logo_url" "Roland catalog has logo URL" || ((failed++))

echo ""
echo "📊 Checking Data Integrity..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify Roland catalog JSON is valid
if python3 -c "import json; json.load(open('frontend/public/data/catalogs_brand/roland_catalog.json'))" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Roland catalog is valid JSON"
else
    echo -e "${RED}✗${NC} Roland catalog JSON is invalid"
    ((failed++))
fi

# Verify index.json is valid
if python3 -c "import json; json.load(open('frontend/public/data/index.json'))" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Index is valid JSON"
else
    echo -e "${RED}✗${NC} Index JSON is invalid"
    ((failed++))
fi

# Check Roland brand colors are set
if grep -q '"primary": "#ef4444"' "frontend/public/data/index.json"; then
    echo -e "${GREEN}✓${NC} Roland brand color configured (#ef4444)"
else
    echo -e "${YELLOW}⚠${NC} Roland brand color not found in index"
fi

echo ""
echo "🎯 Color Palette Check..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "primary.*#ef4444" "frontend/src/styles/brandThemes.ts"; then
    echo -e "${GREEN}✓${NC} Roland (Red): #ef4444"
fi

if grep -q "primary.*#a855f7" "frontend/src/styles/brandThemes.ts"; then
    echo -e "${GREEN}✓${NC} Yamaha (Purple): #a855f7"
fi

if grep -q "primary.*#fb923c" "frontend/src/styles/brandThemes.ts"; then
    echo -e "${GREEN}✓${NC} Korg (Orange): #fb923c"
fi

if grep -q "primary.*#22d3ee" "frontend/src/styles/brandThemes.ts"; then
    echo -e "${GREEN}✓${NC} Moog (Cyan): #22d3ee"
fi

echo ""
echo "📚 Documentation Check..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "MISSION_CONTROL_THEMING_GUIDE.md" "Theming guide" || ((failed++))
check_file "IMPLEMENTATION_STATUS_v37.md" "Implementation status" || ((failed++))

echo ""
echo "📈 Summary..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "🚀 Mission Control v3.7 'Chameleon' System is READY"
    echo ""
    echo "Next steps:"
    echo "  1. cd frontend && pnpm dev"
    echo "  2. Open Mission Control"
    echo "  3. Select a product"
    echo "  4. Watch the UI transform to the brand's colors!"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $failed checks failed${NC}"
    echo ""
    echo "Please review the implementation guide:"
    echo "  - MISSION_CONTROL_THEMING_GUIDE.md"
    echo "  - IMPLEMENTATION_STATUS_v37.md"
    echo ""
    exit 1
fi
