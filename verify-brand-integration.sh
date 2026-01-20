#!/bin/bash

# 🎨 Brand Integration Verification Script
# Run this to verify the brand integration is working correctly

echo "🔍 Verifying Brand Integration..."
echo ""

# Check if logo files exist
echo "✅ Checking logo files..."
LOGOS=(
  "frontend/public/assets/logos/roland.svg"
  "frontend/public/assets/logos/yamaha.svg"
  "frontend/public/assets/logos/korg.svg"
  "frontend/public/assets/logos/moog.svg"
  "frontend/public/assets/logos/nord.svg"
)

for logo in "${LOGOS[@]}"; do
  if [ -f "$logo" ]; then
    echo "  ✓ $logo"
  else
    echo "  ✗ $logo MISSING"
  fi
done

echo ""
echo "✅ Checking component files..."
COMPONENTS=(
  "frontend/src/components/BrandedHeader.tsx"
  "frontend/src/components/BrandSwitcher.tsx"
)

for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo "  ✓ $component"
  else
    echo "  ✗ $component MISSING"
  fi
done

echo ""
echo "✅ Checking theme configuration..."
if grep -q "logoUrl" frontend/src/styles/brandThemes.ts; then
  echo "  ✓ brandThemes.ts includes logo URLs"
else
  echo "  ✗ brandThemes.ts missing logo URLs"
fi

echo ""
echo "✅ Checking App.tsx integration..."
if grep -q "BrandedHeader" frontend/src/App.tsx; then
  echo "  ✓ App.tsx imports BrandedHeader"
else
  echo "  ✗ App.tsx missing BrandedHeader"
fi

if grep -q "BrandSwitcher" frontend/src/App.tsx; then
  echo "  ✓ App.tsx imports BrandSwitcher"
else
  echo "  ✗ App.tsx missing BrandSwitcher"
fi

echo ""
echo "✅ Checking documentation..."
DOCS=(
  "BRAND_INTEGRATION_COMPLETE.md"
  "BRAND_TESTING_GUIDE.md"
  "BRAND_INTEGRATION_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✓ $doc"
  else
    echo "  ✗ $doc MISSING"
  fi
done

echo ""
echo "🎉 Brand Integration Verification Complete!"
echo ""
echo "Next steps:"
echo "1. Start frontend:  cd frontend && pnpm dev"
echo "2. Open browser:    http://localhost:5174"
echo "3. Look for brand switcher in bottom-right corner"
echo "4. Click to change brands and see logos/colors update"
echo ""
