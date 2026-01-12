#!/bin/bash
# HSC JIT v3 - Complete Filesystem Inspection & Health Report
# Purpose: Analyze entire workspace and generate comprehensive health report

set -e

PROJECT_ROOT="/workspaces/hsc-jit-v3"
REPORT_FILE="${PROJECT_ROOT}/FILESYSTEM_HEALTH_REPORT.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "🔍 Performing complete filesystem inspection..."
echo ""

{
    echo "# HSC JIT v3 - Filesystem Health Report"
    echo "**Generated:** $TIMESTAMP"
    echo ""
    
    # 1. DIRECTORY STRUCTURE
    echo "## 1. Directory Structure"
    echo ""
    echo "### Root Directories"
    ls -ld ${PROJECT_ROOT}/*/ | awk '{print "- `" $NF "`"}' | sort
    echo ""
    
    # 2. FILE COUNTS
    echo "## 2. File Statistics"
    echo ""
    echo "### Total Files by Type"
    echo "| Type | Count |"
    echo "|------|-------|"
    find ${PROJECT_ROOT} -type f -name "*.json" | wc -l | xargs echo "| JSON | "
    find ${PROJECT_ROOT} -type f -name "*.py" | wc -l | xargs echo "| Python | "
    find ${PROJECT_ROOT} -type f -name "*.ts" | wc -l | xargs echo "| TypeScript | "
    find ${PROJECT_ROOT} -type f -name "*.tsx" | wc -l | xargs echo "| TSX | "
    find ${PROJECT_ROOT} -type f -name "*.md" | wc -l | xargs echo "| Markdown | "
    find ${PROJECT_ROOT} -type f -name "*.webp" | wc -l | xargs echo "| WebP Images | "
    find ${PROJECT_ROOT} -type f -name "*.png" | wc -l | xargs echo "| PNG Images | "
    echo ""
    
    # 3. BACKEND ANALYSIS
    echo "## 3. Backend Analysis"
    echo ""
    echo "### Python Source Files"
    find ${PROJECT_ROOT}/backend/app -type f -name "*.py" | sort | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /'
    echo ""
    
    echo "### Backend Dependencies"
    echo "\`\`\`"
    wc -l ${PROJECT_ROOT}/backend/requirements.txt
    head -20 ${PROJECT_ROOT}/backend/requirements.txt
    echo "... (see requirements.txt for full list)"
    echo "\`\`\`"
    echo ""
    
    echo "### Catalog Files"
    find ${PROJECT_ROOT}/backend/data/catalogs -name "*.json" | wc -l | xargs echo "Total catalogs: "
    echo ""
    
    echo "### Asset Files"
    echo "- Product images: $(find ${PROJECT_ROOT}/backend/app/static/assets/products -type f | wc -l)"
    echo "- Brand logos: $(find ${PROJECT_ROOT}/backend/app/static/assets/brands -type f | wc -l)"
    echo ""
    
    # 4. FRONTEND ANALYSIS
    echo "## 4. Frontend Analysis"
    echo ""
    echo "### React Components"
    find ${PROJECT_ROOT}/frontend/src/components -name "*.tsx" | wc -l | xargs echo "Total components: "
    find ${PROJECT_ROOT}/frontend/src/components -name "*.tsx" | sort | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /'
    echo ""
    
    echo "### Store/State Management"
    find ${PROJECT_ROOT}/frontend/src/store -name "*.ts" | sort | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /'
    echo ""
    
    # 5. DOCUMENTATION
    echo "## 5. Documentation Files"
    echo ""
    find ${PROJECT_ROOT} -maxdepth 1 -name "*.md" | sort | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /'
    echo ""
    
    # 6. CONFIGURATION FILES
    echo "## 6. Configuration Files"
    echo ""
    echo "### Backend Config"
    ls -1 ${PROJECT_ROOT}/backend/*.{yml,yaml,json,toml,ini} 2>/dev/null | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /' || echo "None found"
    echo ""
    
    echo "### Frontend Config"
    ls -1 ${PROJECT_ROOT}/frontend/*.{json,js,ts,yml,yaml} 2>/dev/null | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /' || echo "None found"
    echo ""
    
    # 7. DOCKER FILES
    echo "## 7. Container Configuration"
    echo ""
    ls -1 ${PROJECT_ROOT}/**/Dockerfile 2>/dev/null | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /' || echo "None found"
    ls -1 ${PROJECT_ROOT}/docker-compose.yml 2>/dev/null | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /' || echo "None found"
    echo ""
    
    # 8. TEST FILES
    echo "## 8. Testing Infrastructure"
    echo ""
    find ${PROJECT_ROOT}/tests -name "test_*.py" -o -name "*_test.py" 2>/dev/null | sort | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /' || echo "No test files found"
    echo ""
    
    # 9. SCRIPTS
    echo "## 9. Executable Scripts"
    echo ""
    find ${PROJECT_ROOT} -maxdepth 2 -name "*.sh" | sort | sed 's|'${PROJECT_ROOT}'/||' | sed 's/^/- /'
    echo ""
    
    # 10. DISK USAGE
    echo "## 10. Disk Usage"
    echo ""
    echo "### Top 10 Largest Directories"
    du -sh ${PROJECT_ROOT}/*/ 2>/dev/null | sort -rh | head -10 | awk '{print "- " $1 " " $2}'
    echo ""
    
    # 11. HEALTH CHECKS
    echo "## 11. System Health"
    echo ""
    echo "### Running Services"
    echo "- Backend (port 8000): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health || echo 'NOT RESPONDING')"
    echo "- Frontend (port 5173/5174): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/ || curl -s -o /dev/null -w '%{http_code}' http://localhost:5174/ || echo 'NOT RESPONDING')"
    echo ""
    
    echo "### Environment Variables"
    echo "- GEMINI_API_KEY: $([ -z "$GEMINI_API_KEY" ] && echo '❌ NOT SET' || echo '✅ SET')"
    echo "- REDIS_URL: $([ -z "$REDIS_URL" ] && echo '❌ NOT SET' || echo '✅ SET')"
    echo ""
    
    # 12. GIT STATUS
    echo "## 12. Git Repository"
    echo ""
    cd ${PROJECT_ROOT}
    echo "- Current branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')"
    echo "- Last commit: $(git log -1 --pretty=format:'%h - %s' 2>/dev/null || echo 'N/A')"
    echo "- Uncommitted changes: $(git status --porcelain 2>/dev/null | wc -l)"
    echo ""
    
} > "$REPORT_FILE"

echo "✅ Filesystem inspection complete!"
echo "📊 Report saved to: $REPORT_FILE"
cat "$REPORT_FILE"
