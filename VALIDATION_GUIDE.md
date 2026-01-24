# VALIDATION & TESTING GUIDE

## Quick Start

Before any work, run the validation:

```bash
# Run from root
./validate.sh

# Or from anywhere
python3 /workspaces/hsc-jit-v3/backend/validate.py
```

**Expected Result:** All 5 critical checks PASS ✓

---

## Validation Tools

### 1. `validate.py` ⭐ (PRIMARY - Use This)

**Purpose:** Quick production validation  
**Time:** < 5 seconds  
**Checks:** 5 critical checks only

```bash
python3 backend/validate.py
```

**Checks:**

- ✓ Real logos validation (RULE)
- ✓ Ghost product removal (RULE)
- ✓ Real products present (RULE)
- ✓ Data file integrity
- ✓ Directory structure

**When to use:** Before any development work, before committing changes

---

### 2. `logo_validator.py` (STRICT)

**Purpose:** Strict brand logo validation  
**Time:** < 2 seconds  
**Rules:** Only real logos allowed

```bash
python3 backend/logo_validator.py
```

**Checks:**

- Logos directory exists
- All approved brands have logos (10)
- No unapproved brands have logos
- No generated/placeholder logos
- Logo file integrity
- Catalog logo references valid
- No placeholder markers

**When to use:** When working with logos, before adding new logos

---

### 3. `system_validator.py` (COMPREHENSIVE)

**Purpose:** Full system validation  
**Time:** 10 seconds  
**Tests:** 10 comprehensive tests

```bash
python3 backend/system_validator.py
```

**Tests:**

- Frontend data structure
- Real logos validation
- Brand catalog completeness
- Product data integrity
- Category consolidation
- Index consistency
- No placeholder content
- Frontend components valid
- Data file integrity
- Cross-reference validation

**When to use:** After major changes, before deployment

---

### 4. `master_validator.py` (ORCHESTRATOR)

**Purpose:** Run all validators together  
**Time:** 20 seconds  
**Orchestrates:** All validation scripts

```bash
python3 backend/master_validator.py
```

**When to use:** Complete system audit

---

### 5. `clean_ghost_products.py` (MAINTENANCE)

**Purpose:** Remove ghost/placeholder products  
**Usage:** One-time use (already done)

```bash
python3 backend/clean_ghost_products.py
```

**What it does:**

- Scans all catalogs
- Identifies products with names like "brand_ghost_001"
- Removes them
- Saves cleaned catalogs

**When to use:** If new ghost products accidentally added

---

## STRICT RULES (Non-Negotiable)

### Rule 1: ONLY REAL LOGOS ⚖️

**Requirement:** Every logo must be a real brand asset

✓ Allowed:

- Official brand logos from brand websites
- Real existing JPEG/PNG files
- Verified real images > 1 KB

✗ Not Allowed:

- AI-generated logos
- Placeholder logos
- Synthetic logos
- Generated images
- Logos without brand verification

**How to check:**

```bash
python3 backend/logo_validator.py
```

---

### Rule 2: ONLY REAL PRODUCTS ⚖️

**Requirement:** All products must be real, verified products

✓ Allowed:

- Real products from official brand catalogs
- Products with real names (not "test_product", "ghost_001", etc)
- Verified against official brand websites

✗ Not Allowed:

- Placeholder products
- Ghost products ("brand*ghost*\*")
- Test products
- Generated product data
- Synthetic product descriptions

**How to check:**

```bash
python3 backend/validate.py
```

---

### Rule 3: NO GENERATED CONTENT ⚖️

**Requirement:** All source data must be real

✓ Allowed:

- Real product names from official sources
- Real product descriptions from official sources
- Real logos from official sources
- Real product images from official sources

✗ Not Allowed:

- AI-generated images
- Synthetic product descriptions
- Placeholder content
- Test data
- Temporary data

**How to check:**

```bash
python3 backend/logo_validator.py
python3 backend/system_validator.py
```

---

## WORKFLOW

### Before Each Development Session

```bash
# Quick validation
./validate.sh

# Expected: ✓ ALL CRITICAL CHECKS PASSED
```

### Before Committing Changes

```bash
# Comprehensive check
python3 backend/system_validator.py

# Expected: ✓ 10/10 tests passed
```

### Before Deploying

```bash
# Master validation
python3 backend/master_validator.py

# Expected: ✓ ALL CHECKS PASSED
```

---

## Common Scenarios

### Scenario 1: Adding a New Product

**Process:**

1. Find real product from official brand catalog
2. Add to appropriate `catalog.json`
3. Run: `python3 backend/validate.py`
4. Check: Must still show "134 real products"

### Scenario 2: Updating Product Data

**Process:**

1. Update product in catalog JSON
2. Verify changes don't create placeholders
3. Run: `python3 backend/validate.py`
4. Check: All 5 checks PASS

### Scenario 3: Working with Logos

**Process:**

1. Obtain real logo from official brand source
2. Save to `frontend/public/data/logos/`
3. Reference in catalog
4. Run: `python3 backend/logo_validator.py`
5. Check: New logo appears in validation

### Scenario 4: Data Integrity Check

**Process:**

1. Run: `python3 backend/system_validator.py`
2. Review all 10 test results
3. Fix any issues before proceeding
4. All tests must PASS

---

## Troubleshooting

### Issue: Validation fails for "placeholder"

**Cause:** Word "placeholder" appears in product description  
**Solution:** This is OK - only product IDs are checked, not descriptions

### Issue: Ghost products detected

**Cause:** Products with "ghost" in ID  
**Solution:** Run `python3 backend/clean_ghost_products.py`

### Issue: Logo validation fails

**Cause:** Logo file too small, not real image, or missing  
**Solution:** Replace with real logo from official source > 1 KB

### Issue: JSON parse errors

**Cause:** Invalid JSON in catalog file  
**Solution:** Check JSON syntax - use JSON validator tool

### Issue: Missing required products

**Cause:** Products deleted or not found  
**Solution:** Restore from backup or re-scrape official source

---

## Files Structure

```
/workspaces/hsc-jit-v3/
├── validate.sh                          ← Run this first
├── SYSTEM_CLEANUP_COMPLETE.md           ← Full report
├── CLEANUP_VERIFICATION_REPORT.md       ← Cleanup summary
├── README.md                            ← Main readme
│
├── backend/
│   ├── validate.py                      ⭐ PRIMARY (Quick check)
│   ├── logo_validator.py                (Strict logos)
│   ├── system_validator.py              (Comprehensive)
│   ├── master_validator.py              (All validators)
│   ├── final_validation.py              (Final check)
│   ├── clean_ghost_products.py          (Cleanup utility)
│   ├── forge_backbone.py                (Data generation)
│   └── [other essential files]
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── store/
│   └── public/data/
│       ├── index.json
│       ├── taxonomy.json
│       ├── 10 brand catalogs
│       └── logos/
│           └── [10 real logos]
│
└── docs/
    ├── BRAND_TAXONOMY_ARCHITECTURE.md
    └── CATEGORY_CONSOLIDATION_ARCHITECTURE.md
```

---

## Status

**Validation Status:** ✓ PRODUCTION READY  
**Last Validated:** 2026-01-23  
**Critical Checks:** 5/5 PASS  
**System Status:** CLEAN & LEAN

---

## Summary

- ✓ Quick validation: `./validate.sh` (< 5 sec)
- ✓ Logo validation: `python3 backend/logo_validator.py` (< 2 sec)
- ✓ Comprehensive: `python3 backend/system_validator.py` (10 sec)
- ✓ All rules enforced
- ✓ Production ready
- ✓ Development ready

**Remember:** Validate before work, validate after changes!
