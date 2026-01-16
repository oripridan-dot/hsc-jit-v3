# Dual-Source Product Synchronization System (v3.5)

## Architecture Overview

The system maintains **two parallel product sources** but has evolved to a **Brand-First Content** strategy while keeping **Halilit** as the commercial source of truth:

```
┌─ Brand Websites (PRIMARY CONTENT) ────┐
│  The Authority on "What it is"         │
│  - English Categories (Regex-based)    │
│  - Official Names & Descriptions       │
│  - High-Res Images                     │
│  - Specs & Documentation               │
│  Source: nordkeyboards.com, etc.       │
└────────────────────────────────────────┘
                    ↓
        [DUAL SOURCE MERGER]
                    ↓
┌─ Halilit Official (COMMERCE) ─────────┐
│  The Authority on "How to buy it"      │
│  - Pricing (ILS)                       │
│  - SKU / Item Code                     │
│  - Stock & Local Availability          │
│  Source: halilit.com                   │
└────────────────────────────────────────┘
                    ↓
        [UNIFIED ECOSYSTEM CATALOG]
                    ↓
┌─ Single Queryable Database ────────────┐
│  Merged Intelligence                   │
│  - Name/Category taken from Brand      │
│  - Price/SKU taken from Halilit        │
│  - Gaps (Brand products not carried)   │
│  - Match Score (Confidence level)      │
└────────────────────────────────────────┘
```

## Key Files (v3.5)

### 1. Extraction & Scraping

| Script                      | Purpose                     | Capabilities |
| --------------------------- | --------------------------- | -------------------------------- |
| `halilit_scraper.py`        | Scrape Commercial Data      | Pricing, SKUs, Hebrew Titles     |
| `brand_website_scraper.py`  | Scrape Brand Data           | **Regex Category Extraction**, Multi-page support, Async |

### 2. Orchestration & Merging

| Script                      | Purpose                     | Logic |
| --------------------------- | --------------------------- | ------------------------- |
| `ecosystem_orchestrator.py` | Pipeline Runner             | Runs scrapers, triggers merge |
| `dual_source_merger.py`     | Logic Core                  | **Brand Content Priority** (merges dictionaries favoring Brand keys) |

### 3. Data Directories

```
backend/data/
├── brands/
│   ├── nord/scrape_config.json   # Defines Regex patterns for categories
│   └── ...
├── catalogs_brand/               # Raw output from brand sites
├── catalogs_halilit/             # Raw output from Halilit
└── catalogs_unified/             # Final merged JSONs (Brand content + Halilit prices)
```

## "Brand First" Categories Implementation

We recently shifted from using Halilit's Hebrew categories to extracting authentic English categories directly from brand websites.

**How it works:**
1. **Config:** Each brand (e.g., `nord`) has a `scrape_config.json` defining Regex patterns (e.g., `(Piano|Stage|Lead)`).
2. **Extraction:** `brand_website_scraper.py` scans page metadata/content using these patterns.
3. **Merging:** The merger script strictly prefers the Brand's `category` field over Halilit's, unless the Brand data is missing.

## Execution Flow

### Full Synchronization

```bash
cd backend/scripts

# Run the ecosystem orchestrator for a specific brand
python3 ecosystem_orchestrator.py --brand=nord

# Run for all brands (if configured)
python3 ecosystem_orchestrator.py --mode=full
```
