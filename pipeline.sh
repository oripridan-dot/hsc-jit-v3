#!/bin/bash

# HSC-JIT v3.5 - Quick Pipeline Commands
# All commands for managing the dual-source intelligence system

set -e  # Exit on error

BACKEND_DIR="/workspaces/hsc-jit-v3/backend"
FRONTEND_DIR="/workspaces/hsc-jit-v3/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      HSC-JIT v3.5 - Dual Source Intelligence Pipeline         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to show usage
show_usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./pipeline.sh [command]"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  start            - Start backend and frontend servers"
    echo "  scrape           - Run complete scraping pipeline for all brands"
    echo "  fix-zero         - Fix brands with 0 products (manual lists)"
    echo "  unified          - Create unified catalogs for all brands"
    echo "  reports          - Update all API reports"
    echo "  verify           - Verify coverage via API"
    echo "  full-pipeline    - Run complete pipeline (scrape + unified + reports)"
    echo "  status           - Show current system status"
    echo "  help             - Show this help message"
    echo ""
}

# Function to start servers
start_servers() {
    echo -e "${GREEN}🚀 Starting servers...${NC}"
    echo ""
    echo -e "${BLUE}Backend:${NC} http://localhost:8000"
    echo -e "${BLUE}Frontend:${NC} http://localhost:5174"
    echo ""
    echo "Press Ctrl+C to stop"
    echo ""
    
    # Start backend in background
    cd "$BACKEND_DIR"
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    
    # Start frontend
    cd "$FRONTEND_DIR"
    pnpm dev &
    FRONTEND_PID=$!
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
}

# Function to run scraping
run_scraping() {
    echo -e "${GREEN}🔍 Running complete scraping pipeline...${NC}"
    cd "$BACKEND_DIR"
    python3 scripts/complete_pipeline_38_brands.py
}

# Function to fix zero-product brands
fix_zero_brands() {
    echo -e "${GREEN}🛠️  Fixing zero-product brands...${NC}"
    cd "$BACKEND_DIR"
    python3 scripts/fix_zero_brands.py
}

# Function to create unified catalogs
create_unified() {
    echo -e "${GREEN}🔗 Creating unified catalogs...${NC}"
    cd "$BACKEND_DIR"
    python3 scripts/create_unified_all_brands.py
}

# Function to update reports
update_reports() {
    echo -e "${GREEN}📊 Updating API reports...${NC}"
    cd "$BACKEND_DIR"
    python3 scripts/update_api_reports.py
}

# Function to verify coverage
verify_coverage() {
    echo -e "${GREEN}✅ Verifying coverage via API...${NC}"
    echo ""
    curl -s http://localhost:8000/api/dual-source-intelligence | jq -r '
      "╔═══════════════════════════════════════════════════════════════╗",
      "║          DUAL SOURCE INTELLIGENCE - COVERAGE STATUS          ║",
      "╠═══════════════════════════════════════════════════════════════╣",
      ("║ Brands:     " + (.brands | length | tostring) + " " * (49 - (.brands | length | tostring | length)) + "║"),
      ("║ Products:   " + (.global_stats.total_products | tostring) + " " * (49 - (.global_stats.total_products | tostring | length)) + "║"),
      ("║ PRIMARY:    " + (.global_stats.primary_products | tostring) + " " * (49 - (.global_stats.primary_products | tostring | length)) + "║"),
      ("║ Coverage:   " + (.global_stats.dual_source_coverage | tostring) + "%" + " " * (48 - (.global_stats.dual_source_coverage | tostring | length)) + "║"),
      "╚═══════════════════════════════════════════════════════════════╝"
    '
}

# Function to run full pipeline
run_full_pipeline() {
    echo -e "${GREEN}🎯 Running full pipeline...${NC}"
    echo ""
    
    fix_zero_brands
    echo ""
    
    create_unified
    echo ""
    
    update_reports
    echo ""
    
    verify_coverage
}

# Function to show status
show_status() {
    echo -e "${GREEN}📊 System Status${NC}"
    echo ""
    
    # Check if backend is running
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend:${NC} Running on port 8000"
    else
        echo -e "${RED}❌ Backend:${NC} Not running"
    fi
    
    # Check if frontend is running
    if curl -s http://localhost:5174 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend:${NC} Running on port 5174"
    else
        echo -e "${RED}❌ Frontend:${NC} Not running"
    fi
    
    echo ""
    
    # Count files
    BRAND_FILES=$(ls -1 "$BACKEND_DIR/data/catalogs_brand"/*.json 2>/dev/null | wc -l)
    UNIFIED_FILES=$(ls -1 "$BACKEND_DIR/data/catalogs_unified"/*.json 2>/dev/null | wc -l)
    
    echo -e "${BLUE}📁 Data Files:${NC}"
    echo "   Brand catalogs: $BRAND_FILES"
    echo "   Unified catalogs: $UNIFIED_FILES"
    
    echo ""
    
    # Show git status
    cd /workspaces/hsc-jit-v3
    echo -e "${BLUE}📝 Git Status:${NC}"
    echo "   Branch: $(git branch --show-current)"
    echo "   Latest: $(git log --oneline -1)"
}

# Main command handler
case "${1:-help}" in
    start)
        start_servers
        ;;
    scrape)
        run_scraping
        ;;
    fix-zero)
        fix_zero_brands
        ;;
    unified)
        create_unified
        ;;
    reports)
        update_reports
        ;;
    verify)
        verify_coverage
        ;;
    full-pipeline)
        run_full_pipeline
        ;;
    status)
        show_status
        ;;
    help|*)
        show_usage
        ;;
esac
