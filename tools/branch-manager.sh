#!/bin/bash
# HSC JIT v3 - Branch Manager & Sync Tool
# Purpose: Manage branches, sync code, and maintain compliance

set -e

PROJECT_ROOT="/workspaces/hsc-jit-v3"
BRANCH_LOG="${PROJECT_ROOT}/.branch-manager/sync-$(date +%s).log"
mkdir -p "${PROJECT_ROOT}/.branch-manager"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Command: sync - Sync current branch with main
sync_with_main() {
    echo -e "${BLUE}Syncing with main branch...${NC}"
    cd "$PROJECT_ROOT"
    
    CURRENT=$(git rev-parse --abbrev-ref HEAD)
    
    if [ "$CURRENT" == "main" ]; then
        echo "Already on main branch"
        git pull origin main
    else
        echo "Current branch: $CURRENT"
        echo "Fetching latest from main..."
        git fetch origin main
        
        echo "Merging main into $CURRENT..."
        git merge origin/main --no-edit
    fi
    
    echo -e "${GREEN}✅ Sync complete${NC}"
    echo "$(date): Synced $CURRENT with main" >> "$BRANCH_LOG"
}

# Command: status - Show git status and version info
show_status() {
    echo -e "${BLUE}Branch & Version Status${NC}"
    echo ""
    
    cd "$PROJECT_ROOT"
    
    echo "📍 Current Branch: $(git rev-parse --abbrev-ref HEAD)"
    echo "📝 Last Commit: $(git log -1 --pretty=format:'%h - %s (%ar)')"
    echo "🔄 Changes: $(git status --porcelain | wc -l) files"
    echo ""
    
    echo "📦 Version Info:"
    echo "  - Python: $(python3 --version 2>&1 | cut -d' ' -f2)"
    echo "  - Node: $(node --version)"
    echo "  - npm: $(npm --version)"
    echo ""
    
    echo "🐳 Services:"
    echo "  - Backend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health || echo 'DOWN') http://localhost:8000"
    echo "  - Frontend: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/ || curl -s -o /dev/null -w '%{http_code}' http://localhost:5174/ || echo 'DOWN')"
}

# Command: validate - Check compliance and consistency
validate_branch() {
    echo -e "${BLUE}Validating branch compliance...${NC}"
    echo ""
    
    VALID=true
    
    # Check Python syntax
    echo -n "Checking Python syntax... "
    if python3 -m py_compile "${PROJECT_ROOT}"/backend/app/services/*.py 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        VALID=false
    fi
    
    # Check required files
    echo -n "Checking required files... "
    if [[ -f "${PROJECT_ROOT}/requirements.txt" ]] && \
       [[ -f "${PROJECT_ROOT}/backend/requirements.txt" ]] && \
       [[ -f "${PROJECT_ROOT}/frontend/package.json" ]]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        VALID=false
    fi
    
    # Check assets
    echo -n "Checking assets... "
    PRODUCTS=$(find "${PROJECT_ROOT}/backend/app/static/assets/products" -type f | wc -l)
    if [ "$PRODUCTS" -ge 300 ]; then
        echo -e "${GREEN}✓ ($PRODUCTS products)${NC}"
    else
        echo -e "${RED}✗ (only $PRODUCTS products)${NC}"
        VALID=false
    fi
    
    echo ""
    if [ "$VALID" = true ]; then
        echo -e "${GREEN}✅ All validations passed${NC}"
        echo "$(date): Validation PASSED" >> "$BRANCH_LOG"
        return 0
    else
        echo -e "${RED}❌ Some validations failed${NC}"
        echo "$(date): Validation FAILED" >> "$BRANCH_LOG"
        return 1
    fi
}

# Command: update - Update dependencies and align versions
update_deps() {
    echo -e "${BLUE}Updating dependencies...${NC}"
    echo ""
    
    echo "📦 Backend dependencies..."
    cd "${PROJECT_ROOT}/backend"
    pip install -q --upgrade -r requirements.txt
    
    echo "📦 Frontend dependencies..."
    cd "${PROJECT_ROOT}/frontend"
    pnpm install --prefer-offline
    
    echo -e "${GREEN}✅ Dependencies updated${NC}"
    echo "$(date): Dependencies updated" >> "$BRANCH_LOG"
}

# Command: purify - Clean and optimize dev environment
purify_env() {
    echo -e "${BLUE}Purifying development environment...${NC}"
    echo ""
    
    echo "Removing cache files..."
    find "${PROJECT_ROOT}" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find "${PROJECT_ROOT}" -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
    find "${PROJECT_ROOT}" -type f -name "*.pyc" -delete 2>/dev/null || true
    
    echo "Cleaning Node modules cache..."
    cd "${PROJECT_ROOT}/frontend"
    rm -rf node_modules/.pnpm-store 2>/dev/null || true
    pnpm store prune 2>/dev/null || true
    
    echo "Removing build artifacts..."
    rm -rf "${PROJECT_ROOT}/backend/dist" 2>/dev/null || true
    rm -rf "${PROJECT_ROOT}/frontend/dist" 2>/dev/null || true
    rm -rf "${PROJECT_ROOT}/frontend/.vite" 2>/dev/null || true
    
    echo "Clearing logs..."
    rm -f "${PROJECT_ROOT}"/*.log 2>/dev/null || true
    
    echo -e "${GREEN}✅ Environment purified${NC}"
    echo "$(date): Environment purified" >> "$BRANCH_LOG"
}

# Command: report - Generate comprehensive sync report
generate_report() {
    echo -e "${BLUE}Generating sync report...${NC}"
    
    REPORT_FILE="${PROJECT_ROOT}/.branch-manager/report-$(date +%s).md"
    
    {
        echo "# Branch Manager Sync Report"
        echo "**Generated:** $(date)"
        echo ""
        
        echo "## Status"
        echo "- Current branch: $(cd "$PROJECT_ROOT" && git rev-parse --abbrev-ref HEAD)"
        echo "- Last sync: $(tail -1 "$BRANCH_LOG" 2>/dev/null || echo 'Never')"
        echo ""
        
        echo "## Recent Activity"
        echo "\`\`\`"
        tail -10 "$BRANCH_LOG" 2>/dev/null || echo "No sync history"
        echo "\`\`\`"
        echo ""
        
        echo "## Git Log"
        echo "\`\`\`"
        cd "$PROJECT_ROOT"
        git log --oneline -5
        echo "\`\`\`"
        
    } > "$REPORT_FILE"
    
    echo "✅ Report saved to: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# Main
COMMAND="${1:-help}"

case "$COMMAND" in
    sync)
        sync_with_main
        ;;
    status)
        show_status
        ;;
    validate)
        validate_branch
        ;;
    update)
        update_deps
        ;;
    purify)
        purify_env
        ;;
    report)
        generate_report
        ;;
    *)
        echo -e "${YELLOW}Branch Manager - Commands:${NC}"
        echo ""
        echo "  sync       - Sync current branch with main"
        echo "  status     - Show branch and service status"
        echo "  validate   - Check compliance and consistency"
        echo "  update     - Update all dependencies"
        echo "  purify     - Clean and optimize dev environment"
        echo "  report     - Generate sync report"
        echo ""
        echo "Examples:"
        echo "  bash tools/branch-manager.sh sync"
        echo "  bash tools/branch-manager.sh status"
        echo "  bash tools/branch-manager.sh validate"
        ;;
esac
