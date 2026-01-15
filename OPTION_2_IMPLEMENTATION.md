# Option 2: Implementation Overview

## 🎯 Your Data Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    USER-FACING PRODUCTS                         │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ PRIMARY (Both Sources)                                     │
│  ├─ Name, SKU, Price: FROM HALILIT ← Authoritative pricing    │
│  ├─ Specs, Manuals: FROM BRAND WEBSITE                        │
│  ├─ "Available at official distributor"                       │
│  └─ Buy link: Halilit (with brand specs)                      │
│                                                                  │
│  🔄 SECONDARY (Brand Website Only)                            │
│  ├─ Name, Specs, Manual: FROM BRAND WEBSITE                   │
│  ├─ Price: "Check brand website"                              │
│  ├─ "Product info only - availability may vary"              │
│  └─ Info link: Brand website                                  │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
         ↓              ↓               ↓
   HALILIT        MATCHING        BRAND SITES
   ├─ Prices      LAYER           ├─ Specs
   ├─ SKU         Primary/        ├─ Manuals
   ├─ Images      Secondary       ├─ Content
   └─ 2,227 prod  Flags           └─ Unknown count
```

---

## 📅 Weekly Sync Schedule

```
MONDAY 2:00 AM
│
├─ Halilit Sync (45 min)
│  ├─ Scrape all 18 brands
│  ├─ Update prices
│  └─ Save: catalogs_halilit/*.json
│
TUESDAY 2:00 AM
│
├─ Brand Website Sync (1-2 hours)
│  ├─ Use Playwright for JS sites
│  ├─ Scrape product catalogs
│  └─ Save: catalogs_brand/*.json
│
WEDNESDAY 4:00 AM
│
├─ Merge & Match (10 min)
│  ├─ Match products by SKU/Name
│  ├─ Mark PRIMARY/SECONDARY
│  └─ Save: catalogs_unified/*.json
│
ALL SOURCES UPDATED ✅
```

---

## 🔧 Setup Instructions

### Step 1: Install Playwright

```bash
cd /workspaces/hsc-jit-v3/backend

# Install required dependencies
pip install -r requirements-playwright.txt

# Install browser
playwright install chromium
```

### Step 2: Configure Brands to Scrape

```bash
# Edit brand_website_scraper.py
# Update BRAND_CONFIGS with your target brands and URLs

BRAND_CONFIGS = {
    "roland": {
        "product_urls": [
            "https://www.roland.com/us/categories/pianos/grand_pianos/",
            # Add more URLs as needed
        ]
    },
    "nord": {
        "product_urls": [
            "https://www.nordkeyboards.com/products/",
        ]
    },
    # Add more brands...
}
```

### Step 3: Test Scrapers

```bash
# Test Halilit scraper (already working)
python scripts/master_sync.py --priority

# Test Brand website scraper (new)
python scripts/brand_website_scraper.py --brand roland

# Test merger
python scripts/merge_catalog.py
```

### Step 4: Set Up Cron Jobs

```bash
# Edit crontab
sudo crontab -e

# Add:
0 2 * * 1 cd /workspaces/hsc-jit-v3/backend && python scripts/master_sync.py --priority > /var/log/halilit-sync.log 2>&1

0 2 * * 2 cd /workspaces/hsc-jit-v3/backend && python scripts/brand_website_scraper.py --all-brands > /var/log/brand-sync.log 2>&1

0 4 * * 3 cd /workspaces/hsc-jit-v3/backend && python scripts/merge_catalog.py > /var/log/merge.log 2>&1
```

---

## 📊 Expected Results

### After First Full Sync

```
Halilit Data:
├─ 2,227 products ✅
├─ All 18 brands ✅
├─ Prices: ILS ✅
├─ SKU: Complete ✅
└─ Images: Ready ✅

Brand Website Data:
├─ ~5,000-10,000 products (estimated)
├─ Full specifications
├─ Technical manuals
├─ Product knowledge
└─ Cross-reference images

Unified Catalog:
├─ ~7,000-12,000 total products
├─ ~2,227 PRIMARY (in both)
├─ ~4,000-7,000 SECONDARY (brand-only)
├─ Coverage: ~30-40% (Halilit/Brand overlap)
└─ Ready for user-facing UI
```

---

## 🛠️ Maintenance Breakdown

### Easy Stuff (5-30 min)

- Check sync logs: `tail -f /var/log/halilit-sync.log`
- Verify data quality: `python scripts/validate_catalog.py`
- View latest stats: `cat data/catalogs_unified/summary.json`

### Moderate Stuff (30 min - 1 hour)

- Brand website layout changed? Update CSS selectors in scraper config
- Product matching too loose? Adjust similarity threshold (0.75 → 0.80)
- Want faster syncs? Switch to incremental mode

### Hard Stuff (1-2 hours, happens rarely)

- Playwright timeouts: Add retry logic, increase timeout
- Duplicate products: Implement fuzzy matching with fuzzy-string library
- Storage growing: Archive old catalogs, implement data retention

---

## 💰 Infrastructure Costs

### Monthly

| Item                  | Cost     | Notes               |
| --------------------- | -------- | ------------------- |
| Compute (cron runner) | Included | Use existing server |
| Storage (catalogs)    | <$1      | ~50 MB total        |
| Bandwidth             | <$1      | ~50 MB per week     |
| Playwright (browser)  | Included | Open source         |
| **Total**             | ~$0      | Minimal             |

### Annual

- **Server cost**: $50-200 (low usage, cron jobs only)
- **External tools**: $0 (all open source)
- **Developer time**: $3,000-5,000 (1 FTE @ 10-15 hours/month)

---

## 🚨 When Things Break (Troubleshooting)

### "0 products found for brand X"

```bash
# 1. Check what changed
python scripts/debug_brand_site.py --brand roland --headless false

# 2. View the HTML
browser opens and shows current page structure

# 3. Update selectors in config
# Edit: brand_website_scraper.py → BRAND_CONFIGS

# 4. Re-run
python scripts/brand_website_scraper.py --brand roland
```

### "Matching giving wrong results"

```bash
# 1. Check similarity scores
python scripts/debug_matching.py --brand roland

# 2. See what matched/didn't
# Review: data/catalogs_unified/roland_unified.json

# 3. Adjust threshold
# Edit: merge_catalog.py → _similarity_score()
# Change: if similarity > 0.75:
#      to: if similarity > 0.85:
```

### "Sync taking too long (>3 hours)"

```bash
# 1. Identify slow brand
tail -f /var/log/brand-sync.log

# 2. Options:
# a) Use incremental sync instead of full sync
# b) Increase timeouts (some sites are just slow)
# c) Skip that brand for now, focus on others
```

---

## ✅ Success Criteria

You'll know Option 2 is working when:

- [ ] Weekly syncs run automatically via cron
- [ ] Halilit prices always up-to-date (< 7 days old)
- [ ] Brand specs fetched successfully
- [ ] PRIMARY products marked correctly (>90% accuracy)
- [ ] UI shows "Available at Halilit" vs "Check brand website"
- [ ] Users can see both pricing and specs
- [ ] Zero manual interventions per week (automated)
- [ ] Maintenance takes <2 hours per month

---

## 📈 Roadmap

### Week 1-2: Setup

- [ ] Install Playwright
- [ ] Test brand scrapers
- [ ] Configure cron jobs
- [ ] Verify merger logic

### Week 3-4: Launch

- [ ] Run first full sync
- [ ] Monitor logs
- [ ] Fix any selectors
- [ ] Update UI to use unified data

### Month 2: Optimization

- [ ] Add incremental syncs
- [ ] Implement smart retries
- [ ] Tune matching thresholds
- [ ] Archive old data

### Month 3+: Enhancement

- [ ] ML-based product matching
- [ ] Real-time price alerts
- [ ] User feedback integration
- [ ] API for brand partners

---

## 🎯 Key Differences from Option 1

| Aspect         | Option 1      | Option 2              |
| -------------- | ------------- | --------------------- |
| Data Sources   | Halilit only  | Halilit + Brand sites |
| Product Count  | 2,227         | 7,000-12,000+         |
| Specs/Manuals  | None          | From brand sites      |
| Maintenance    | <1 hour/month | 10-15 hours/month     |
| Coverage       | 100% Halilit  | 30-40% overlap        |
| Cost           | Free          | $0 infrastructure     |
| Complexity     | Low           | Moderate              |
| Time to launch | 1 day         | 2 weeks               |

---

## 📞 Questions?

**Q: What if a brand site goes down?**  
A: Use cached version (up to 7 days old), skip that brand, retry next week

**Q: How do I handle rate limiting?**  
A: Add delays between requests, implement exponential backoff, cache responses

**Q: Can I run syncs on a schedule other than weekly?**  
A: Yes! Change cron times, switch to incremental sync for daily updates

**Q: What if matching accuracy is bad?**  
A: Use fuzzy matching library, manually review problematic brands, adjust thresholds

**Q: Do I need a dedicated server?**  
A: No! Cron jobs are lightweight. Run on existing server or AWS Lambda.

---

## Next Steps

1. **Review this plan** with your team
2. **Approve approach** (Option 2)
3. **Allocate resources** (1 developer for setup + monitoring)
4. **Set timeline** (2 weeks to launch)
5. **Start with test brands** (Roland, Nord) before all 18

Ready to implement? Let me know! 🚀
