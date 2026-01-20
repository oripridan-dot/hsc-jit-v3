#!/bin/bash
# Deep cleanup script for HSC Mission Control v3.7
# Removes all obsolete documentation, old code, and unnecessary files

set -e

echo "🧹 HSC Mission Control v3.7 - Deep Cleanup"
echo "==========================================="
echo ""

# Create archive for removed docs
ARCHIVE_DIR="docs/archive/cleanup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

echo "📦 Archiving old documentation..."

# Move obsolete root-level docs to archive
OBSOLETE_DOCS=(
    "CHANGES_SUMMARY.md"
    "CODE_CHANGES.md"
    "COMPLETE_DELIVERY_CHECKLIST.md"
    "DEVELOPER_QUICK_START.md"
    "DOCS_CONSOLIDATION.md"
    "DOCUMENTATION_INDEX.md"
    "DOCUMENTATION_INDEX_PHASE1.md"
    "EXECUTIVE_SUMMARY.md"
    "FILES_CHANGED.txt"
    "IMPLEMENTATION_COMPLETE.md"
    "IMPLEMENTATION_COMPLETE_v37.md"
    "IMPLEMENTATION_STATUS_v37.md"
    "IMPLEMENTATION_SUMMARY.md"
    "INNER_LOGO_GUIDE.md"
    "MISSION_CONTROL_LAUNCH.md"
    "MISSION_CONTROL_THEMING_GUIDE.md"
    "PHASE_1_COMPLETE.md"
    "QUICK_REFERENCE.md"
    "VERIFICATION_CHECKLIST.md"
)

for doc in "${OBSOLETE_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $doc"
    fi
done

# Move obsolete scripts
OBSOLETE_SCRIPTS=(
    "cleanup_v3.7.sh"
    "deep_clean.sh"
    "roland_full_cycle.sh"
    "verify-pipeline.sh"
    "verify-theming.sh"
)

for script in "${OBSOLETE_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $script"
    fi
done

# Archive entire old docs directory
if [ -d "docs" ]; then
    echo "📁 Archiving old docs directory..."
    mv docs "$ARCHIVE_DIR/old_docs"
    echo "  ✓ Archived: docs/ → $ARCHIVE_DIR/old_docs/"
fi

# Archive root archive directory
if [ -d "archive" ]; then
    echo "📁 Archiving root archive directory..."
    mv archive "$ARCHIVE_DIR/root_archive"
    echo "  ✓ Archived: archive/ → $ARCHIVE_DIR/root_archive/"
fi

# Clean up frontend obsolete docs
echo "🎨 Cleaning frontend documentation..."
FRONTEND_OBSOLETE=(
    "frontend/DESIGN_SYSTEM_V3_WCAG.md"
    "frontend/STYLE_GUIDE.md"
    "frontend/DEPRECATED.md"
    "frontend/DESIGN_QUICK_REF.md"
    "frontend/DESIGN_REFINEMENT_COMPLETE.md"
    "frontend/DESIGN_TOKENS_REFERENCE.md"
    "frontend/HALILEO_ENHANCED.md"
    "frontend/DESIGN_SYSTEM_V2.md"
)

for doc in "${FRONTEND_OBSOLETE[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $doc"
    fi
done

# Clean up backend archives
if [ -d "backend/archive" ]; then
    echo "🗄️ Removing backend archive..."
    rm -rf "backend/archive"
    echo "  ✓ Removed: backend/archive/ (21MB)"
fi

# Clean up temp/build files
echo "🗑️ Removing temporary files..."

# Remove Python cache
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find backend -type f -name "*.pyc" -exec rm -f {} + 2>/dev/null || true
echo "  ✓ Removed: Python cache files"

# Remove logs
if [ -d "backend/logs" ]; then
    rm -rf backend/logs
    echo "  ✓ Removed: backend/logs/"
fi

# Remove temp data
if [ -d "backend/data" ]; then
    echo "  ℹ️ Keeping: backend/data/ (may contain useful data)"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Summary:"
echo "  - Archived docs → $ARCHIVE_DIR"
echo "  - Removed 21MB backend archive"
echo "  - Cleaned Python cache files"
echo "  - Removed obsolete scripts and documentation"
echo ""
echo "Kept:"
echo "  ✓ README.md (main documentation)"
echo "  ✓ SYSTEM_GUIDE.md (consolidated guide)"
echo "  ✓ QUICK_START.md (getting started)"
echo "  ✓ start-mission-control.sh (startup script)"
echo "  ✓ .github/copilot-instructions.md (AI dev guide)"
echo ""
