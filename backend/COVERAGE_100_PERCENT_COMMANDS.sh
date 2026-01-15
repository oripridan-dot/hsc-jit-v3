#!/bin/bash
# 100% COVERAGE MAINTENANCE - Quick Commands

# Navigate to backend
cd /workspaces/hsc-jit-v3/backend

# 1️⃣ RUN THE ULTRA SCRAPER (Achieve/Maintain 100%)
echo "🚀 Running Ultra Scraper..."
python3 scripts/ultra_scraper_100_percent.py

# 2️⃣ VERIFY COVERAGE
echo "📊 Verifying coverage..."
python3 << 'EOF'
import json
import os

brands_dir = "data/catalogs_brand"
halilit_dir = "data/catalogs_halilit"

total_scraped = 0
total_expected = 0

for brand in os.listdir(halilit_dir):
    if not brand.endswith('_halilit.json'):
        continue
    
    brand_id = brand.replace('_halilit.json', '')
    
    with open(f"{halilit_dir}/{brand}") as f:
        halilit_data = json.load(f)
        expected = len(halilit_data.get('products', []))
    
    brand_file = f"{brands_dir}/{brand_id}_brand.json"
    scraped = 0
    if os.path.exists(brand_file):
        with open(brand_file) as f:
            data = json.load(f)
            scraped = len(data.get('products', data if isinstance(data, list) else []))
    
    total_scraped += scraped
    total_expected += expected
    
    pct = (scraped / expected * 100) if expected > 0 else 0
    status = "✅" if scraped >= expected else "⚠️"
    print(f"{status} {brand_id:20} {scraped:4}/{expected:4} ({pct:5.1f}%)")

print("\n" + "=" * 60)
overall = (total_scraped / total_expected * 100) if total_expected > 0 else 0
print(f"TOTAL: {total_scraped}/{total_expected} ({overall:.1f}%)")
print("=" * 60)

if overall >= 100:
    print("\n✅ 100% COVERAGE MAINTAINED!")
else:
    print(f"\n⚠️  Coverage dropped to {overall:.1f}% - Re-run scraper!")
EOF

# 3️⃣ CHECK SPECIFIC BRAND
# Usage: check_brand "remo"
check_brand() {
    local brand=$1
    echo "Checking $brand..."
    python3 << EOF
import json
with open("data/catalogs_halilit/${brand}_halilit.json") as f:
    expected = len(json.load(f).get('products', []))
with open("data/catalogs_brand/${brand}_brand.json") as f:
    scraped = len(json.load(f).get('products', []))
print(f"${brand}: {scraped}/{expected} ({scraped/expected*100:.1f}%)")
EOF
}

# 4️⃣ VIEW COVERAGE REPORTS
echo "📄 Available reports:"
echo "  - COVERAGE_100_PERCENT_REPORT.md (Executive summary)"
echo "  - COVERAGE_TRANSFORMATION_BEFORE_AFTER.md (Detailed comparison)"
echo ""
echo "View with: cat COVERAGE_100_PERCENT_REPORT.md"

# 5️⃣ SCHEDULE DAILY MAINTENANCE (Cron)
echo ""
echo "📅 To maintain coverage daily, add to crontab:"
echo ""
echo "0 2 * * * cd /workspaces/hsc-jit-v3/backend && python3 scripts/ultra_scraper_100_percent.py >> /var/log/brand-scraper.log 2>&1"

# 6️⃣ MONITOR COVERAGE CHANGES
monitor_coverage() {
    echo "🔍 Monitoring brand coverage..."
    while true; do
        python3 scripts/ultra_scraper_100_percent.py 2>&1 | tail -30
        echo ""
        echo "Next check in 1 hour... (Ctrl+C to stop)"
        sleep 3600
    done
}

echo ""
echo "Usage examples:"
echo "  ./COVERAGE_100_PERCENT_COMMANDS.sh          # This file"
echo "  check_brand 'remo'                          # Check single brand"
echo "  monitor_coverage                            # Continuous monitoring"
