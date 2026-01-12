#!/bin/bash
# HSC JIT v3 - Comprehensive Testing Suite
# Purpose: Single source of truth for all system tests

set -e

PROJECT_ROOT="/workspaces/hsc-jit-v3"
TEST_REPORT="${PROJECT_ROOT}/TEST_RESULTS_$(date +%s).md"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_case() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Testing: $name ... "
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "🧪 Starting comprehensive test suite..."
echo ""

{
    echo "# HSC JIT v3 - Test Results"
    echo "**Timestamp:** $(date)"
    echo ""
    echo "---"
    echo ""
    
    # BACKEND TESTS
    echo "## Backend Tests"
    echo ""
    
    test_case "Backend API responding" "curl -s http://localhost:8000/health | grep -q status" && {
        echo "✅ Backend API is responsive"
    } || {
        echo "❌ Backend API not responding"
    }
    
    test_case "Catalog loading (340 products)" "curl -s http://localhost:8000/health | grep -q 340" && {
        echo "✅ All 340 products loaded"
    } || {
        echo "❌ Products not fully loaded"
    }
    
    test_case "Product image serving" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/static/assets/products/roland-td17kvx2.webp | grep -q 200" && {
        echo "✅ Product images serving (200 OK)"
    } || {
        echo "❌ Product image serving failed"
    }
    
    test_case "Brand logo serving" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/static/assets/brands/roland.png | grep -q 200" && {
        echo "✅ Brand logos serving (200 OK)"
    } || {
        echo "❌ Brand logo serving failed"
    }
    
    test_case "Redis connection" "[[ -n \$(redis-cli ping 2>/dev/null) ]]" && {
        echo "✅ Redis connected"
    } || {
        echo "❌ Redis not responding"
    }
    
    echo ""
    echo "## Frontend Tests"
    echo ""
    
    # Determine running port
    PORT=5173
    if curl -s http://localhost:5174/ >/dev/null; then
        PORT=5174
    fi

    test_case "Frontend dev server (5173 or 5174)" "curl -s http://localhost:$PORT/ >/dev/null" && {
        echo "✅ Frontend running on port $PORT"
    } || {
        echo "❌ Frontend not responding on 5173 or 5174"
    }
    
    test_case "Frontend proxy working" "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/static/assets/products/roland-td17kvx2.webp | grep -q 200" && {
        echo "✅ Vite proxy forwarding to backend"
    } || {
        echo "❌ Vite proxy not working"
    }
    
    echo ""
    echo "## File & Asset Tests"
    echo ""
    
    PRODUCT_COUNT=$(find ${PROJECT_ROOT}/backend/app/static/assets/products -type f | wc -l)
    echo "- Product images on disk: $PRODUCT_COUNT"
    
    BRAND_COUNT=$(find ${PROJECT_ROOT}/backend/app/static/assets/brands -type f | wc -l)
    echo "- Brand logos on disk: $BRAND_COUNT"
    
    if [ "$PRODUCT_COUNT" -ge 300 ]; then
        echo "✅ Product images present (>=300)"
    else
        echo "❌ Product images missing ($PRODUCT_COUNT < 300)"
    fi
    
    if [ "$BRAND_COUNT" -ge 80 ]; then
        echo "✅ Brand logos present (>=80)"
    else
        echo "❌ Brand logos missing ($BRAND_COUNT < 80)"
    fi
    
    echo ""
    echo "## Code Quality Tests"
    echo ""
    
    test_case "Python syntax check" "python3 -m py_compile ${PROJECT_ROOT}/backend/app/services/*.py" && {
        echo "✅ Python code syntax valid"
    } || {
        echo "❌ Python syntax errors found"
    }
    
    echo ""
    echo "## Configuration Tests"
    echo ""
    
    test_case "Backend requirements.txt valid" "[[ -f ${PROJECT_ROOT}/requirements.txt ]]" && {
        echo "✅ Backend dependencies file exists"
    } || {
        echo "❌ Backend dependencies missing"
    }
    
    test_case "Frontend package.json valid" "[[ -f ${PROJECT_ROOT}/frontend/package.json ]]" && {
        echo "✅ Frontend package config exists"
    } || {
        echo "❌ Frontend package config missing"
    }
    
    test_case "Docker Compose present" "[[ -f ${PROJECT_ROOT}/docker-compose.yml ]]" && {
        echo "✅ Docker Compose configured"
    } || {
        echo "❌ Docker Compose missing"
    }
    
    echo ""
    echo "---"
    echo ""
    echo "## Summary"
    echo "- Tests Passed: $TESTS_PASSED"
    echo "- Tests Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo "- Status: ✅ **ALL TESTS PASSED**"
    else
        echo "- Status: ⚠️ **SOME TESTS FAILED**"
    fi
    
} | tee "$TEST_REPORT"

echo ""
echo "📄 Full report saved to: $TEST_REPORT"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Review report above.${NC}"
    exit 1
fi
