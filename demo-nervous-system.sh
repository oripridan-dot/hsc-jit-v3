#!/bin/bash
# Visual Demo: Halileo Nervous System in Action
# Shows intelligence tags and corresponding insights

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧠 HALILEO NERVOUS SYSTEM - Live Intelligence Demo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DATA_FILE="/workspaces/hsc-jit-v3/frontend/public/data/roland-catalog.json"

# Demo 1: Complex Device Detection
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ SCENARIO 1: User selects a complex workstation             │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
COMPLEX=$(jq -r '.products[] | select(.halileo_context != null and (.halileo_context | contains(["complex_device"]))) | "\(.name) (\(.features | length) features)"' "$DATA_FILE" | head -1)
echo "📦 Product Selected: $COMPLEX"
echo "🏷️  Tags: complex_device"
echo ""
echo "💬 Halileo Insight:"
echo "   ┌────────────────────────────────────────────────────────┐"
echo "   │ 🔧 TIP                                                 │"
echo "   │ This is a deep instrument. I've prioritized the       │"
echo "   │ Parameter Guide in the Docs tab.                      │"
echo "   │                                    [View Docs →]      │"
echo "   └────────────────────────────────────────────────────────┘"
echo ""
echo ""

# Demo 2: Entry Tier Product
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ SCENARIO 2: User selects an entry-level product            │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
ENTRY=$(jq -r '.products[] | select(.halileo_context != null and (.halileo_context | contains(["entry_tier"]))) | .name' "$DATA_FILE" | head -1)
echo "📦 Product Selected: $ENTRY"
echo "🏷️  Tags: entry_tier"
echo ""
echo "💬 Halileo Insight:"
echo "   ┌────────────────────────────────────────────────────────┐"
echo "   │ ℹ️  INFO                                                │"
echo "   │ Entry-level instrument. Perfect for beginners -       │"
echo "   │ simplified controls.                                  │"
echo "   └────────────────────────────────────────────────────────┘"
echo ""
echo ""

# Demo 3: Pro Tier Product
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ SCENARIO 3: User selects a professional-grade instrument   │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
PRO=$(jq -r '.products[] | select(.halileo_context != null and (.halileo_context | contains(["pro_tier"]))) | .name' "$DATA_FILE" | head -1)
echo "📦 Product Selected: $PRO"
echo "🏷️  Tags: pro_tier"
echo ""
echo "💬 Halileo Insight:"
echo "   ┌────────────────────────────────────────────────────────┐"
echo "   │ ℹ️  INFO                                                │"
echo "   │ Professional-grade instrument. Comprehensive specs    │"
echo "   │ and manuals loaded.                                   │"
echo "   └────────────────────────────────────────────────────────┘"
echo ""
echo ""

# Demo 4: Search Mode
echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ SCENARIO 4: User searches for products                     │"
echo "└─────────────────────────────────────────────────────────────┘"
echo ""
echo "🔍 User types: 'fantom'"
echo ""
echo "💬 Halileo Insight:"
echo "   ┌────────────────────────────────────────────────────────┐"
echo "   │ ℹ️  INFO                                                │"
echo "   │ Scanning catalog for \"fantom\"...                      │"
echo "   └────────────────────────────────────────────────────────┘"
echo ""
echo ""

# Statistics
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 INTELLIGENCE STATISTICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL_PRODUCTS=$(jq '.products | length' "$DATA_FILE")
TAGGED_PRODUCTS=$(jq '[.products[] | select(.halileo_context != null and (.halileo_context | length) > 0)] | length' "$DATA_FILE")
COVERAGE=$((TAGGED_PRODUCTS * 100 / TOTAL_PRODUCTS))

echo "Total Products:        $TOTAL_PRODUCTS"
echo "Tagged Products:       $TAGGED_PRODUCTS"
echo "Intelligence Coverage: ${COVERAGE}%"
echo ""

echo "Tag Distribution:"
jq -r '.products[].halileo_context[]?' "$DATA_FILE" | sort | uniq -c | sort -rn | while read count tag; do
    printf "  %-25s %3d products\n" "$tag" "$count"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ SYSTEM STATUS: FULLY OPERATIONAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
