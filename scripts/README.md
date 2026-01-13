# Brand Catalog Automation System

Complete automation suite for maintaining 100% catalog quality across all 90 brands in HSC-JIT.

## 🎯 System Overview

This automation system ensures every product in the catalog is:
- ✅ Real (not placeholder/fake)
- ✅ Well-documented (with verified URLs)
- ✅ Fully specified (complete metadata)
- ✅ Tested (pipeline validated)
- ✅ Production-ready

## 📊 Current Status

After automated cleaning:
- **Total Brands:** 90
- **Total Products:** 273 (down from 1,605)
- **Products Removed:** 1,332 fake/placeholder products (83%)
- **Production-Ready:** 2 brands (Moog, Mackie)
- **Quality:** 90.8% of remaining products need enrichment

## 🛠️ Automation Tools

### 1. **audit_all_brands.py** - Catalog Auditor

Comprehensive audit of all brand catalogs.

```bash
# Audit all brands
python scripts/audit_all_brands.py --report --output docs/audit.json

# Audit single brand
python scripts/audit_all_brands.py --brand roland

# View summary only
python scripts/audit_all_brands.py
```

**Detects:**
- Placeholder URLs (example.com)
- Fake products (variant-N patterns)
- Missing documentation
- Incomplete metadata
- Invalid data

**Output:**
- Terminal summary with statistics
- JSON report with detailed issues
- Brand rankings by quality

---

### 2. **fix_catalogs.py** - Automated Fixer

Removes fake/placeholder products automatically.

```bash
# Dry run (see what would be fixed)
python scripts/fix_catalogs.py --all --dry-run

# Fix all brands (with backup)
python scripts/fix_catalogs.py --all --backup

# Fix single brand
python scripts/fix_catalogs.py --brand roland --backup

# Fix without backup (not recommended)
python scripts/fix_catalogs.py --all --no-backup
```

**Actions:**
- Removes products with variant-N pattern
- Removes products with example.com URLs
- Removes generic placeholder products
- Creates backups before modifying
- Validates remaining products

**Safety:**
- Always creates backups by default
- Supports dry-run mode
- Preserves original catalogs in `backups/` folder

---

### 3. **master_pipeline.py** - Complete Pipeline

Orchestrates the full enrichment workflow.

```bash
# Run complete pipeline
python scripts/master_pipeline.py --full

# Audit only
python scripts/master_pipeline.py --audit

# Clean only
python scripts/master_pipeline.py --clean
```

**Pipeline Stages:**
1. **Initial Audit** - Assess current state
2. **Automated Cleaning** - Remove fake products
3. **Post-Clean Validation** - Verify improvements
4. **Priority Generation** - Rank brands for manual work
5. **Report Generation** - Comprehensive documentation

**Generates:**
- `docs/CATALOG_AUDIT_REPORT.json` - Detailed audit data
- `docs/BRAND_PRIORITY_LIST.md` - Brands ranked by priority
- `docs/CATALOG_ENRICHMENT_REPORT.md` - Executive summary
- `backend/data/catalogs/backups/` - Backup copies

---

### 4. **generate_brand_template.py** - Template Generator

Creates all files needed to complete a brand (like Moog).

```bash
# Generate templates for Roland
python scripts/generate_brand_template.py roland

# Generate with custom output directory
python scripts/generate_brand_template.py yamaha --output docs/brands/
```

**Generates:**
1. **Test Suite** - `tests/test_{brand}_pipeline.py`
   - Catalog loading tests
   - Fuzzy search validation
   - Document fetching tests
   - End-to-end pipeline test

2. **Completion Checklist** - `docs/brands/{BRAND}_CHECKLIST.md`
   - Phase-by-phase completion guide
   - Detailed requirements for each phase
   - Verification checkboxes

3. **Quick Reference** - `docs/brands/{BRAND}_QUICKREF.md`
   - Status tracking
   - Product table
   - Test results
   - Quick commands

---

## 🚀 Workflow: Complete a New Brand

Follow these steps to achieve 100% completion for any brand:

### Step 1: Generate Templates
```bash
python scripts/generate_brand_template.py <brand-id>
```

### Step 2: Review Current State
```bash
# Check what exists
cat backend/data/catalogs/<brand-id>_catalog.json | jq '.products | length'

# Audit specific brand
python scripts/audit_all_brands.py --brand <brand-id>
```

### Step 3: Curate Products
Edit `backend/data/catalogs/<brand-id>_catalog.json`:
1. Remove any remaining fake products
2. Add 5-10 real, flagship products
3. Ensure unique product IDs
4. Set correct brand field

### Step 4: Find Documentation
For each product:
1. Search brand's official website
2. Find product manual/documentation
3. Verify URL is accessible
4. Update `documentation.url` field

### Step 5: Write Descriptions
For each product:
1. Write 2-3 sentence description
2. Include key features
3. Mention target audience
4. Be specific and accurate

### Step 6: Add Specifications
For each product:
1. Add 3-5 key technical specs
2. Use consistent naming
3. Include units where relevant
4. Verify from official sources

### Step 7: Verify/Create Images
```bash
# Check existing images
ls -lh backend/app/static/assets/products/<brand-id>-*.webp

# Create placeholders if needed (or source real images)
```

### Step 8: Test Everything
```bash
# Run brand-specific test suite
python tests/test_<brand-id>_pipeline.py

# Verify in full system
python scripts/audit_all_brands.py --brand <brand-id>
```

### Step 9: Generate Reports
```bash
# Create completion report (similar to Moog)
cat > docs/brands/<BRAND>_COMPLETE_REPORT.md << 'EOF'
# Brand Name - 100% Pipeline Coverage Report
...
EOF
```

### Step 10: Update Documentation
```bash
# Add to production-ready list in docs/brands/README.md
```

---

## 📋 Quality Standards

All completed brands must meet:

### ✅ Data Quality
- [ ] 5-10 real, current products
- [ ] All products have unique IDs
- [ ] All products have `brand` field set correctly
- [ ] All prices are realistic
- [ ] All categories are specified

### ✅ Documentation
- [ ] All products have documentation URLs
- [ ] Zero placeholder URLs (no example.com)
- [ ] All URLs verified accessible
- [ ] URLs point to official sources

### ✅ Content
- [ ] Detailed product descriptions (50-150 words)
- [ ] 3-5 technical specifications per product
- [ ] Accurate, specific information
- [ ] Professional tone throughout

### ✅ Assets
- [ ] Brand logo exists (`/static/assets/brands/<brand>.png`)
- [ ] All products have images (or placeholders)
- [ ] Images in WebP format
- [ ] Consistent image quality

### ✅ Testing
- [ ] Test suite created
- [ ] All tests passing
- [ ] Fuzzy search validated
- [ ] Pipeline integration verified
- [ ] Zero audit issues

---

## 📊 Monitoring & Reporting

### Check Overall Progress
```bash
# Full audit with report
python scripts/audit_all_brands.py --report --output docs/current_audit.json

# View priority list
cat docs/BRAND_PRIORITY_LIST.md

# Check production-ready brands
grep "✓" docs/BRAND_PRIORITY_LIST.md
```

### Track Individual Brand
```bash
# Audit specific brand
python scripts/audit_all_brands.py --brand <brand-id>

# Run test suite
python tests/test_<brand-id>_pipeline.py

# Check completion checklist
cat docs/brands/<BRAND>_CHECKLIST.md
```

---

## 🎯 Priority Brands

Based on automated analysis, focus on these brands first:

1. **Moog Music** ✅ (Complete - 8 products, 100% quality)
2. **Mackie** ✅ (Complete - 5 products, 100% quality)
3. **Roland** (9 products, 88.9% quality) - HIGH PRIORITY
4. **Akai Professional** (4 products, 75% quality)
5. **Nord** (3 products, 33% quality)

See `docs/BRAND_PRIORITY_LIST.md` for complete ranking.

---

## 🔄 Maintenance

### Regular Audits
Run monthly to catch any issues:
```bash
python scripts/audit_all_brands.py --report --output docs/audit_$(date +%Y%m%d).json
```

### Update Documentation
When products change:
```bash
# Re-audit
python scripts/audit_all_brands.py --brand <brand-id>

# Update reports
# Re-run tests
python tests/test_<brand-id>_pipeline.py
```

---

## 📚 Reference Implementation

**Moog Music** serves as the gold standard:
- `backend/data/catalogs/moog_catalog.json` - Perfect catalog structure
- `tests/test_moog_pipeline.py` - Complete test suite
- `docs/brands/MOOG_COMPLETE_REPORT.md` - Full documentation
- `docs/brands/MOOG_QUICKREF.md` - Quick reference

Use Moog as a template when completing other brands.

---

## 🚨 Troubleshooting

### Issue: "Brand catalog not found"
```bash
# Check file exists
ls backend/data/catalogs/<brand-id>_catalog.json

# Check naming convention (should be: brand-id_catalog.json)
```

### Issue: "No module named 'app.services'"
```bash
# Run from workspace root
cd /workspaces/hsc-jit-v3
python scripts/...
```

### Issue: "Backups directory full"
```bash
# Clean old backups (keep recent ones)
find backend/data/catalogs/backups -type f -mtime +30 -delete
```

---

## 📖 Additional Resources

- **Architecture:** `docs/architecture/ARCHITECTURE.md`
- **Development Guide:** `docs/development/IMPLEMENTATION_SUMMARY.md`
- **Operations:** `docs/operations/RUNBOOK.md`
- **Brand Documentation:** `docs/brands/`

---

**System Version:** 1.0  
**Last Updated:** January 2026  
**Maintained by:** HSC-JIT Team
