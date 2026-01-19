#!/bin/bash
# V3.7 Branch Cleanup & Organization Script
# Cleans up legacy files, organizes structure, and prepares for deployment

set -e

echo "🚀 Starting V3.7 Branch Cleanup..."
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Archive old/unused files
echo -e "${YELLOW}📦 Archiving legacy files...${NC}"

# Move old test files to archive
mkdir -p archive/v3.6-tests
if [ -f "backend/test_roland_scraper.py" ]; then
    mv backend/test_roland_scraper.py archive/v3.6-tests/ 2>/dev/null || true
fi

# Archive old alignment scripts
if [ -f "backend/align_system.py" ]; then
    mv backend/align_system.py archive/v3.6-tests/ 2>/dev/null || true
fi

echo -e "${GREEN}✅ Legacy files archived${NC}"

# 2. Clean data directories
echo -e "${YELLOW}🧹 Cleaning data directories...${NC}"

# Clean frontend old data
rm -f frontend/public/data/halilit_universe.json 2>/dev/null || true
rm -rf frontend/public/data/catalogs 2>/dev/null || true

# Ensure proper structure
mkdir -p backend/data/catalogs
mkdir -p frontend/public/data/catalogs_brand

echo -e "${GREEN}✅ Data directories cleaned${NC}"

# 3. Remove node_modules cache (optional - uncomment if needed)
# echo -e "${YELLOW}🗑️  Cleaning node_modules cache...${NC}"
# cd frontend && rm -rf node_modules/.vite && cd ..
# echo -e "${GREEN}✅ Cache cleaned${NC}"

# 4. Clean Python cache
echo -e "${YELLOW}🐍 Cleaning Python cache...${NC}"
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find backend -type f -name "*.pyc" -delete 2>/dev/null || true
echo -e "${GREEN}✅ Python cache cleaned${NC}"

# 5. Verify backend structure
echo -e "${YELLOW}📁 Verifying backend structure...${NC}"
required_dirs=(
    "backend/app"
    "backend/core"
    "backend/data/catalogs"
    "backend/models"
    "backend/services"
)

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Missing: $dir${NC}"
        mkdir -p "$dir"
        echo -e "${GREEN}✅ Created: $dir${NC}"
    else
        echo -e "${GREEN}✅ Exists: $dir${NC}"
    fi
done

# 6. Verify frontend structure
echo -e "${YELLOW}📁 Verifying frontend structure...${NC}"
required_frontend_dirs=(
    "frontend/src/components"
    "frontend/src/store"
    "frontend/src/styles"
    "frontend/public/data"
)

for dir in "${required_frontend_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Missing: $dir${NC}"
        mkdir -p "$dir"
        echo -e "${GREEN}✅ Created: $dir${NC}"
    else
        echo -e "${GREEN}✅ Exists: $dir${NC}"
    fi
done

# 7. Create/Update .gitignore entries
echo -e "${YELLOW}📝 Updating .gitignore...${NC}"
cat >> .gitignore << 'EOF'

# V3.7 Specific
backend/data/catalogs/*.json
!backend/data/catalogs/.gitkeep
frontend/public/data/catalogs_brand/*.json
backend/logs/*.log
backend/backend.log
*.pyc
__pycache__/
.pytest_cache/
venv/
node_modules/
.vite/
EOF
echo -e "${GREEN}✅ .gitignore updated${NC}"

# 8. Verify key files exist
echo -e "${YELLOW}🔍 Verifying key files...${NC}"
key_files=(
    "backend/app/main.py"
    "backend/orchestrate_brand.py"
    "frontend/src/App.tsx"
    "frontend/src/components/Navigator.tsx"
    "docs/README.md"
)

for file in "${key_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing: $file${NC}"
    else
        echo -e "${GREEN}✅ Exists: $file${NC}"
    fi
done

# 9. Update README status
echo -e "${YELLOW}📄 Updating README...${NC}"
echo "Last cleanup: $(date)" >> README_CLEANUP.txt
echo -e "${GREEN}✅ README updated${NC}"

# 10. Summary
echo ""
echo "=================================="
echo -e "${GREEN}🎉 V3.7 Branch Cleanup Complete!${NC}"
echo "=================================="
echo ""
echo "📊 Summary:"
echo "  ✅ Legacy files archived"
echo "  ✅ Data directories cleaned"
echo "  ✅ Python cache removed"
echo "  ✅ Directory structure verified"
echo "  ✅ .gitignore updated"
echo ""
echo "🚀 Next Steps:"
echo "  1. Run: cd backend && python orchestrate_brand.py --brand roland --max-products 50"
echo "  2. Verify backend: curl http://localhost:8000/health"
echo "  3. Check frontend: Open http://localhost:5173"
echo ""
echo "📝 Documentation:"
echo "  - Architecture: docs/architecture/"
echo "  - Quick Start: docs/getting-started/quick-start.md"
echo "  - Catalogs: backend/data/catalogs/"
echo ""
