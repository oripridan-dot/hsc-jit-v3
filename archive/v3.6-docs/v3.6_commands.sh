#!/bin/bash
# HSC JIT v3.6 - Quick Commands
# Usage: ./v3.6_commands.sh [command]

set -e

BACKEND_DIR="/workspaces/hsc-jit-v3/backend"
FRONTEND_DIR="/workspaces/hsc-jit-v3/frontend"
DATA_DIR="$FRONTEND_DIR/public/data"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

# Command: Build all brands
build_all() {
    echo_info "Building all brand catalogs..."
    cd "$BACKEND_DIR"
    python build.py --brand=all
    echo_success "All brands built successfully!"
}

# Command: Build single brand
build_brand() {
    local brand=$1
    if [ -z "$brand" ]; then
        echo_error "Please specify a brand: ./v3.6_commands.sh build-brand nord"
        exit 1
    fi
    
    echo_info "Building catalog for: $brand"
    cd "$BACKEND_DIR"
    python build.py --brand="$brand" --validate
    echo_success "Brand '$brand' built successfully!"
}

# Command: List available brands
list_brands() {
    echo_info "Available brands:"
    cd "$BACKEND_DIR"
    python build.py --list
}

# Command: Check data quality
check_quality() {
    echo_info "Checking data quality..."
    cd "$DATA_DIR"
    
    if [ ! -f "index.json" ]; then
        echo_error "No index.json found. Run build first."
        exit 1
    fi
    
    echo ""
    echo "📊 Overall Statistics:"
    jq -r '"Total Products: \(.total_products)\nTotal Verified: \(.total_verified)\nVerification Rate: \((.total_verified / .total_products * 100 | floor))%"' index.json
    
    echo ""
    echo "🏆 Top Brands by Product Count:"
    jq -r '.brands | sort_by(.product_count) | reverse | .[:10] | .[] | "  \(.name): \(.product_count) products (\(.verified_count) verified)"' index.json
    
    echo ""
    echo "✅ Best Match Rates:"
    jq -r '.brands | map(select(.verified_count > 0)) | sort_by(.verified_count / .product_count) | reverse | .[:5] | .[] | "  \(.name): \((.verified_count / .product_count * 100 | floor))% (\(.verified_count)/\(.product_count))"' index.json
}

# Command: Show brand details
show_brand() {
    local brand=$1
    if [ -z "$brand" ]; then
        echo_error "Please specify a brand: ./v3.6_commands.sh show-brand nord"
        exit 1
    fi
    
    local file="$DATA_DIR/${brand}.json"
    if [ ! -f "$file" ]; then
        echo_error "Brand catalog not found: $file"
        exit 1
    fi
    
    echo_info "Brand: $brand"
    echo ""
    echo "📊 Statistics:"
    jq '.stats' "$file"
    
    echo ""
    echo "✅ Verified Products:"
    jq -r '.products[] | select(.verified) | "  - \(.name) [\(.match_quality)]"' "$file" | head -20
    
    echo ""
    local verified=$(jq '.stats.verified_products' "$file")
    local total=$(jq '.stats.total_products' "$file")
    if [ "$verified" -lt "$total" ]; then
        echo "⚠️  Unverified Products:"
        jq -r '.products[] | select(.verified == false) | "  - \(.name)"' "$file" | head -10
    fi
}

# Command: Find duplicates
find_duplicates() {
    echo_info "Checking for duplicates across all brands..."
    cd "$BACKEND_DIR/data/catalogs_brand"
    
    for file in *_brand.json; do
        brand=$(basename "$file" _brand.json)
        dupes=$(jq '.products | group_by(.name) | map(select(length > 1)) | length' "$file")
        
        if [ "$dupes" -gt 0 ]; then
            echo_warning "$brand: $dupes duplicate product names"
            jq -r '.products | group_by(.name) | map(select(length > 1)) | .[] | "  - \(.[0].name) (×\(length))"' "$file"
        fi
    done
    
    echo_success "Duplicate check complete"
}

# Command: Validate output
validate_output() {
    echo_info "Validating build output..."
    
    # Check if files exist
    if [ ! -f "$DATA_DIR/index.json" ]; then
        echo_error "index.json not found. Run build first."
        exit 1
    fi
    
    # Check JSON validity
    echo_info "Validating JSON files..."
    local errors=0
    for file in "$DATA_DIR"/*.json; do
        if ! jq empty "$file" 2>/dev/null; then
            echo_error "Invalid JSON: $(basename $file)"
            ((errors++))
        fi
    done
    
    if [ "$errors" -eq 0 ]; then
        echo_success "All JSON files valid"
    else
        echo_error "$errors invalid JSON files found"
        exit 1
    fi
    
    # Check index consistency
    echo_info "Checking index consistency..."
    local index_brands=$(jq '.brands | length' "$DATA_DIR/index.json")
    local file_count=$(find "$DATA_DIR" -name "*.json" -not -name "index.json" | wc -l)
    
    if [ "$index_brands" -ne "$file_count" ]; then
        echo_warning "Index has $index_brands brands, but $file_count brand files exist"
    else
        echo_success "Index consistent with $index_brands brands"
    fi
}

# Command: Clean output
clean_output() {
    echo_info "Cleaning build output..."
    rm -rf "$DATA_DIR"
    mkdir -p "$DATA_DIR"
    echo_success "Output directory cleaned"
}

# Command: Full rebuild
full_rebuild() {
    echo_info "Starting full rebuild..."
    clean_output
    build_all
    validate_output
    check_quality
    echo_success "Full rebuild complete!"
}

# Command: Watch mode (for development)
watch_brand() {
    local brand=$1
    if [ -z "$brand" ]; then
        echo_error "Please specify a brand: ./v3.6_commands.sh watch-brand nord"
        exit 1
    fi
    
    echo_info "Watching brand: $brand (Ctrl+C to stop)"
    while true; do
        cd "$BACKEND_DIR"
        python build.py --brand="$brand"
        sleep 5
    done
}

# Main command dispatcher
case "${1:-help}" in
    build-all)
        build_all
        ;;
    build-brand)
        build_brand "$2"
        ;;
    list)
        list_brands
        ;;
    quality)
        check_quality
        ;;
    show)
        show_brand "$2"
        ;;
    duplicates)
        find_duplicates
        ;;
    validate)
        validate_output
        ;;
    clean)
        clean_output
        ;;
    rebuild)
        full_rebuild
        ;;
    watch)
        watch_brand "$2"
        ;;
    help|*)
        cat << EOF
${BLUE}HSC JIT v3.6 - Quick Commands${NC}

${GREEN}Build Commands:${NC}
  build-all              Build all brand catalogs
  build-brand <brand>    Build single brand catalog
  rebuild                Clean and rebuild everything

${GREEN}Info Commands:${NC}
  list                   List available brands
  quality                Show data quality statistics
  show <brand>           Show detailed brand information
  duplicates             Find duplicate products

${GREEN}Validation:${NC}
  validate               Validate build output

${GREEN}Maintenance:${NC}
  clean                  Clean output directory
  watch <brand>          Watch and rebuild brand (dev mode)

${GREEN}Examples:${NC}
  ./v3.6_commands.sh build-all
  ./v3.6_commands.sh build-brand nord
  ./v3.6_commands.sh show roland
  ./v3.6_commands.sh quality

EOF
        ;;
esac
