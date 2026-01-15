# Option 2: Ongoing Maintenance Plan

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED DATA SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HALILIT (Primary: Pricing, SKU, Availability)              │
│  ├─ Sync: Weekly or on-demand                               │
│  ├─ 2,227 products across 18 brands                         │
│  └─ Source: backend/data/catalogs_halilit/                  │
│                                                               │
│  BRAND WEBSITES (Primary: Specs, Manuals, Content)          │
│  ├─ Sync: Weekly with Playwright                            │
│  ├─ Full catalogs (sometimes larger than Halilit)           │
│  └─ Source: backend/data/catalogs_brand/                    │
│                                                               │
│  PRODUCT MATCHING LAYER                                      │
│  ├─ Merge products by: SKU, Name similarity                 │
│  ├─ Mark: PRIMARY (in both) / SECONDARY (brand-only)        │
│  └─ Output: backend/data/catalogs/unified/                  │
│                                                               │
│  USER-FACING DATA                                            │
│  ├─ Halilit pricing (always accurate)                       │
│  ├─ Brand specs & manuals (from brand website)              │
│  └─ Source flag in UI: "Available at Halilit" vs "Info only"│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Ongoing Maintenance Tasks

### 1. **Weekly Sync Operations** (2-3 hours/week)

#### 1.1 Halilit Scrape

```bash
# Weekly - Check for new/updated products
python scripts/master_sync.py --priority

# Time: ~45 minutes
# What it does:
# - Scrapes all 18 priority brands
# - Updates prices, availability
# - Generates gap reports
```

**Maintenance effort**: Minimal (already working)

- Monitor for failures
- Check for URL changes
- Review new products

#### 1.2 Brand Website Scrape

```bash
# Weekly - Scrape brand catalogs
python scripts/brand_website_scraper.py --all-brands

# Time: 1-2 hours (depends on site complexity)
# What it does:
# - Uses Playwright to load JS-rendered content
# - Extracts full product catalogs
# - Saves to catalogs_brand/*.json
```

**Maintenance effort**: Moderate

- Monitor for scraper failures
- Handle site layout changes
- Update selectors when needed

#### 1.3 Product Matching & Merge

```bash
# Automatic - After both syncs complete
python scripts/merge_catalog.py

# Time: 5-10 minutes
# What it does:
# - Matches Halilit products with Brand products
# - Marks PRIMARY (in both) / SECONDARY (brand-only)
# - Creates unified catalog
# - Generates quality reports
```

**Maintenance effort**: Low

- Review matching accuracy
- Adjust similarity thresholds if needed
- Check for duplicates

---

### 2. **When Sites Break** (Happens 1-2x/month)

**Scenario**: Brand website layout changes → Playwright scraper fails

**Steps to Fix**:

1. **Detect**: Cron job or manual check shows 0 products
2. **Debug** (15 min):

   ```bash
   # Test site structure
   python scripts/debug_brand_site.py --brand roland
   # See what changed in the HTML
   ```

3. **Update Selectors** (15-30 min):

   - Edit brand-specific config
   - Update CSS selectors
   - Test again

4. **Re-run**:
   ```bash
   python scripts/brand_website_scraper.py --brand roland
   ```

**Cost**: ~1 hour per broken site (4x/year = 4 hours)

---

### 3. **Monthly Quality Review** (1-2 hours)

```
Month End Tasks:
┌─────────────────────────────────────────────┐
│ 1. Review Sync Logs                         │
│    - Any failed brands?                     │
│    - Any unusual patterns?                  │
│                                             │
│ 2. Check Data Quality                       │
│    - Missing prices?                        │
│    - Duplicate products?                    │
│    - Bad images?                            │
│                                             │
│ 3. Verify Matching Accuracy                 │
│    - Correct PRIMARY/SECONDARY flags?       │
│    - Any unmatched products?                │
│                                             │
│ 4. Update Documentation                     │
│    - Site layout changes                    │
│    - New selectors needed                   │
│    - Performance notes                      │
│                                             │
│ 5. Optimize Performance                     │
│    - Cache popular products?                │
│    - Update sync frequency?                 │
│    - Archive old data?                      │
└─────────────────────────────────────────────┘
```

---

### 4. **Infrastructure Monitoring** (Ongoing)

```yaml
Database/Storage:
  - Halilit catalogs: ~2,227 products = 1-2 MB
  - Brand catalogs: ~5,000-10,000 products = 10-20 MB
  - Unified data: ~7,000-12,000 products = 15-25 MB
  - Growth: ~5-10% per month
  - Action: Archive old catalogs after 6 months

Playwright Browser:
  - Headless Chromium: ~200-300 MB memory per sync
  - Timeout: 30 seconds per page
  - Retries: 2 attempts per page
  - Action: Ensure 1 GB free memory during sync

Rate Limiting:
  - Halilit: 1 request/second (no issues)
  - Brand sites: 0.5-1 second between requests
  - Action: Add delays if getting 429 errors

Network:
  - Typical sync: 50-100 HTTP requests
  - Data transfer: 20-50 MB per full sync
  - Action: Monitor for slowdowns, cache when possible
```

---

## 📈 Maintenance Effort Summary

| Task                     | Frequency  | Time/Month            | Effort Level |
| ------------------------ | ---------- | --------------------- | ------------ |
| Halilit sync             | Weekly     | 3 hours               | Low          |
| Brand sync               | Weekly     | 4-8 hours             | Moderate     |
| Matching & merge         | Weekly     | 0.5 hours             | Low          |
| Bug fixes (site changes) | 1-2x/month | 2-4 hours             | Moderate     |
| Quality review           | Monthly    | 2 hours               | Low          |
| **TOTAL**                | —          | **11-18 hours/month** | **Moderate** |

**Annual Cost**: ~140-220 hours (3.5-5.5 weeks of work)

---

## 🚀 Automation Strategies to Reduce Maintenance

### Strategy 1: Cron Jobs (Automatic Sync)

```bash
# /etc/cron.d/hsc-jit-sync

# Monday 2 AM - Halilit sync
0 2 * * 1 /workspaces/hsc-jit-v3/backend/sync_halilit.sh

# Tuesday 2 AM - Brand websites sync
0 2 * * 2 /workspaces/hsc-jit-v3/backend/sync_brands.sh

# Wednesday 4 AM - Merge catalogs
0 4 * * 3 /workspaces/hsc-jit-v3/backend/merge_catalogs.sh
```

**Time saved**: ~10 hours/month (automation instead of manual runs)

### Strategy 2: Smart Retry Logic

```python
# Auto-retry with exponential backoff
for attempt in range(3):
    try:
        scrape_brand(brand)
        break
    except TimeoutError:
        wait(2 ** attempt)  # 1s, 2s, 4s
```

**Time saved**: ~2 hours/month (fewer manual interventions)

### Strategy 3: Incremental Sync

```bash
# Instead of full sync every time
# Only update products that changed
python scripts/brand_sync.py --incremental

# Much faster (~15 min vs 2 hours)
```

**Time saved**: ~4 hours/month (faster updates)

### Strategy 4: Monitoring Alerts

```python
# Alert if:
# - Sync fails 2x in a row
# - Product count drops >20%
# - Average response time >10s
# - Storage usage >100MB
```

**Time saved**: ~1 hour/month (catch issues early)

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Brand site layout changed - 0 products found"

- **Cause**: CSS selectors no longer match
- **Solution**: Update selectors in config
- **Prevention**: Add visual regression testing

### Issue 2: "Playwright memory leak"

- **Cause**: Browser context not properly closed
- **Solution**: Use context manager, restart cron daily
- **Prevention**: Monitor memory during syncs

### Issue 3: "Too many products, matching is slow"

- **Cause**: Name matching is O(n²) complexity
- **Solution**: Use fuzzy matching library, add SKU primary key
- **Prevention**: Implement incremental matching

### Issue 4: "Halilit prices out of sync"

- **Cause**: Weekly sync schedule misses updates
- **Solution**: Run on-demand sync after major updates
- **Prevention**: Add webhook integration if available

### Issue 5: "Duplicate products in unified catalog"

- **Cause**: Matching threshold too loose
- **Solution**: Tighten similarity score (0.8 → 0.85)
- **Prevention**: Add duplicate detection post-merge

---

## 📋 Maintenance Checklist

### Daily (5 minutes)

- [ ] Check sync logs for errors
- [ ] Alert dashboard for failures

### Weekly (1 hour)

- [ ] Review sync success rates
- [ ] Check for rate limiting issues
- [ ] Monitor storage usage

### Monthly (2 hours)

- [ ] Quality review meeting
- [ ] Update selectors if sites changed
- [ ] Optimize slow queries
- [ ] Archive old backups

### Quarterly (4 hours)

- [ ] Review selector robustness
- [ ] Test disaster recovery
- [ ] Update documentation
- [ ] Plan next quarter improvements

---

## 💡 Optimization Opportunities

### Phase 1 (Month 1-2): Foundation

- [ ] Implement cron jobs
- [ ] Add monitoring alerts
- [ ] Create runbook documentation

### Phase 2 (Month 3-4): Efficiency

- [ ] Implement incremental syncs
- [ ] Add smart retry logic
- [ ] Cache brand site data

### Phase 3 (Month 5-6): Intelligence

- [ ] ML-based product matching
- [ ] Anomaly detection for price changes
- [ ] Automated selector updates

### Phase 4 (Month 7+): Scale

- [ ] Distributed scraping (multiple workers)
- [ ] Real-time sync instead of weekly
- [ ] API integration with brand partners

---

## 🎯 Success Metrics

Track these to measure maintenance health:

```
Availability:
  Target: >98% success rate for syncs
  Action: Alert if <95%

Data Quality:
  Target: >95% products matched (PRIMARY)
  Action: Review matching if <90%

Performance:
  Target: Full sync <3 hours
  Action: Optimize if >4 hours

Coverage:
  Target: All 18 brands scraped
  Action: Fix within 24h if any fail

Freshness:
  Target: Data <7 days old
  Action: Run on-demand sync if needed
```

---

## 🔐 Data Backup & Recovery

**Backup Strategy**:

```
Daily: Incremental backup of new products
Weekly: Full backup of all catalogs
Monthly: Archive old versions
```

**Disaster Recovery**:

```
If Halilit source down:
  → Use cached version (up to 2 weeks old)

If brand site down:
  → Skip that brand, retry next week

If matching fails:
  → Fall back to manual review
```

---

## 📞 Getting Help

When maintenance gets complex:

1. **Simple selector fix**: 15-30 minutes (DIY)
2. **Matching accuracy issue**: 1 hour (DIY)
3. **Performance optimization**: 2-4 hours (May need consultant)
4. **API integration**: 1-2 weeks (Hire contractor)

**Budget estimate**: $500-2000/month for external support if needed

---

## Summary

**Option 2 is sustainable because:**

- ✅ Well-defined weekly routine
- ✅ Automated with cron jobs
- ✅ Modular (fix one brand without affecting others)
- ✅ Clear escalation path
- ✅ Can scale to more brands easily

**You'll need:**

- 1 dedicated person (10-20 hours/month) OR
- Automated monitoring + occasional fixes (5-10 hours/month)
- $500-1000/month infrastructure costs

**Recommendation**: Start with automated syncs, dedicate 1 team member for monitoring and fixes. Revisit after 3 months to optimize.
