# Quick Reference - Dual Source System

## 🎯 TL;DR

**Halilit = Source of Truth**

- What they actually sell
- Official images (brand-approved)
- Primary inventory

**Brand Websites = Reference**

- Full product lines
- Identifies gaps
- What could be added

## 🚀 Quick Start

```bash
cd backend

# Full sync (all steps in one command)
python scripts/master_sync.py --priority

# Then view results
cat data/gap_reports/summary_gap_report.json
```

## 📊 Key Commands

### Extract Official Brands

```bash
python scripts/extract_halilit_brands.py
# Output: data/halilit_official_brands.json (84 brands)
```

### Scrape Halilit (PRIMARY)

```bash
python scripts/halilit_scraper.py --brand-id roland \
  --url "https://www.halilit.com/g/5193-Brand/33109-Roland"
# Output: data/catalogs_halilit/roland_halilit.json
```

### Scrape Brand Websites (REFERENCE)

```bash
python scripts/harvest_all_brands.py
# Output: data/catalogs/*.json
```

### Analyze Gaps

```bash
python scripts/gap_analyzer.py --all
# Output: data/gap_reports/*.json
```

### Build Unified Catalogs

```bash
python scripts/unified_catalog_builder.py --all
# Output: data/catalogs_unified/*.json
```

## 📁 Output Locations

| What              | Where                                      |
| ----------------- | ------------------------------------------ |
| Halilit inventory | `data/catalogs_halilit/`                   |
| Brand products    | `data/catalogs/`                           |
| Merged catalog    | `data/catalogs_unified/`                   |
| Gap reports       | `data/gap_reports/`                        |
| Sync summary      | `data/gap_reports/summary_gap_report.json` |

## 📈 Reading Gap Reports

```json
{
  "brand_id": "roland",
  "halilit_count": 8, // What Halilit sells
  "brand_website_count": 42, // Full brand line
  "gap_count": 34, // Missing from Halilit
  "coverage_percentage": 19.05 // Halilit carries 19% of line
}
```

## 🎯 Priority Brands (First Wave)

**Synth/Piano**

- roland (8 products on Halilit)
- nord (12 products)
- oberheim

**Audio Interface**

- presonus
- m-audio
- akai-professional

**Studio Monitor**

- adam-audio
- krk-systems
- dynaudio

**Effects**

- boss
- headrush-fx
- xotic

**PA/Drum**

- rcf
- mackie
- pearl
- rogers
- paiste-cymbals
- remo

## 💡 Use Cases

### "How many products does Halilit carry?"

→ Check `catalogs_halilit/` count

### "What's the full Roland product line?"

→ Check `catalogs/roland_catalog.json`

### "What Roland products is Halilit missing?"

→ Check `gap_reports/roland_gap_report.json` for "gap_products"

### "Overall coverage by brand?"

→ Check `gap_reports/summary_gap_report.json`

## ⚡ Performance

| Operation                | Time         |
| ------------------------ | ------------ |
| Extract brands           | 5-10 seconds |
| Scrape 1 brand (Halilit) | 2-5 minutes  |
| Scrape 1 brand (website) | 3-10 minutes |
| Gap analysis (all)       | 30 seconds   |
| Build unified (all)      | 1 minute     |

## 🔧 Troubleshooting

| Problem                    | Solution                                                    |
| -------------------------- | ----------------------------------------------------------- |
| No Halilit products found  | Check URL format matches pattern                            |
| Brand website scrape fails | Run `python scripts/diplomat.py --brand id --url url` first |
| Gap shows 100%             | Brand catalog may not exist yet                             |
| Images broken              | Use Halilit CDN URLs (official source)                      |

## 📋 Sync Workflow

```
1. Extract brands
   ↓
2. Scrape Halilit (PRIMARY) ← Always do this first
   ↓
3. Scrape brand websites (REFERENCE)
   ↓
4. Analyze gaps
   ↓
5. Build unified catalogs
   ↓
6. Review summary report
   ↓
7. Update frontend with unified catalog
```

## 🎓 Understanding the System

**Why two sources?**

- Halilit = Reality (what they sell)
- Brand = Potential (what could be added)
- Gap = Opportunity (what customers ask for but Halilit doesn't carry)

**Why is Halilit primary?**

- Official distributor
- Images approved by brands
- Current pricing
- Real stock status
- Legal source

**Why sync with brand websites?**

- Identify popular products not in stock
- Plan inventory
- Understand product lines
- Make business decisions

## 🌟 Key Insights

- **Roland on Halilit**: 8 products (vs full line of 100+)
- **Nord on Halilit**: Better coverage
- **Boss on Halilit**: Good coverage (effects)
- **Gaps**: Opportunity to add vintage/niche products

---

See full docs: [DUAL_SOURCE_SYSTEM.md](./DUAL_SOURCE_SYSTEM.md)
