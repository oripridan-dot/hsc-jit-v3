# HSC-JIT v3.5 - PRODUCTION DEPLOYMENT & OPTIMIZATION GUIDE

## 🎯 Strategic Objectives

### 1. **Increase PRIMARY Coverage from 4.6% → 80%+**

- **Current State**: 12 PRIMARY products (Nord only), 249 HALILIT_ONLY
- **Target State**: 250+ PRIMARY products across 18 brands
- **Timeline**: 1-2 weeks with automated daily optimization

### 2. **Establish Daily Synchronization Automation**

- **Full Sync**: Daily at 2:00 AM (comprehensive brand + distributor merge)
- **Quick Sync**: Every 6 hours (fast pricing updates)
- **Enhanced Scraping**: Daily focus on Roland (500), Pearl (364), Mackie (219)

### 3. **Fix Brand Website Scrapers**

- **Roland**: 500 Halilit products → 100-150 PRIMARY expected
- **Pearl**: 364 Halilit products → 80-120 PRIMARY expected
- **Mackie**: 219 Halilit products → 50-80 PRIMARY expected

### 4. **Implement Production Monitoring & Alerting**

- **Health Checks**: Every hour
- **Auto-Recovery**: Automatic restart/resync on failures
- **Daily Reports**: Morning summaries with anomaly detection

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Install Enhanced Playwright Scraper

```bash
cd /workspaces/hsc-jit-v3/backend

# Install Playwright dependencies
pip install playwright httpx
playwright install chromium

# Verify installation
python scripts/playwright_brand_scraper.py --help
```

**Expected Output**:

- 3 brand scrapers (Roland, Pearl, Mackie) initialized
- Playwright browser ready

### Step 2: Set Up Production Cron Automation

```bash
# Make script executable
chmod +x scripts/install_production_automation.sh

# Run installation
bash scripts/install_production_automation.sh
```

**What This Does**:

- ✅ Creates 8-tier automation schedule
- ✅ Sets up log directories (`logs/automation/`)
- ✅ Installs comprehensive cron jobs
- ✅ Configures health monitoring

**Cron Schedule**:

```
02:00 AM  - Enhanced brand scraping (Roland, Pearl, Mackie)
02:30 AM  - Full ecosystem sync
06:00 AM  - Daily reports & anomaly detection
Every 6h  - Quick pricing updates
Every hour - Health monitoring & auto-recovery
Weekly    - Analysis & backups
```

### Step 3: Deploy Production Monitoring

```bash
# Make monitoring script executable
chmod +x scripts/production_monitor.py

# Test health check
python scripts/production_monitor.py

# Enable auto-recovery
python scripts/production_monitor.py --auto-recover

# Enable email alerts (optional)
export ALERT_EMAIL="ops@yourcompany.com"
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
python scripts/production_monitor.py --auto-recover --email-alerts
```

**Monitoring Checks**:

- 🔌 API connectivity (port 8000)
- 📦 Catalog freshness (<48 hours)
- 📊 PRIMARY coverage (target 80%+)
- 🔍 Data integrity
- 📝 Sync log analysis
- 💾 Disk space (minimum 5 GB)

---

## 📊 EXPECTED RESULTS TIMELINE

### **Week 1: Baseline & Stabilization**

```
Day 1-2:  Playwright scraper learns Roland/Pearl/Mackie HTML structure
Day 3-4:  First full syncs → 50-75 PRIMARY products
Day 5-7:  Pattern recognition → 100-150 PRIMARY products
Coverage: 4.6% → 15-20% (conservative estimate)
```

### **Week 2: Optimization & Scale**

```
Day 8-10: Enhanced matching algorithms improve
Day 11-14: All three scrapers fully optimized
Coverage: 15-20% → 40-60%
```

### **Week 3-4: Sustained Growth**

```
Day 15-28: Daily improvements compound
Advanced features:
  - Product family detection
  - Ecosystem relationship mapping
  - Compatibility matrix building
Coverage: 40-60% → 80%+
```

---

## 🎛️ OPERATIONAL COMMANDS

### View System Status

```bash
# Check health status
curl http://localhost:8000/api/dual-source-intelligence | jq '.global_stats'

# Sample output:
# {
#   "total_products": 262,
#   "primary_products": 12,
#   "dual_source_coverage": 4.6
# }
```

### Manual Sync Operations

```bash
# Full ecosystem sync (brand + distributor)
cd /workspaces/hsc-jit-v3/backend
python scripts/ecosystem_orchestrator.py --mode=full

# Quick pricing update only
python scripts/ecosystem_orchestrator.py --mode=quick

# Enhanced brand scraping
python scripts/playwright_brand_scraper.py

# Single brand sync
python scripts/ecosystem_orchestrator.py --brand=roland
python scripts/ecosystem_orchestrator.py --brand=pearl
python scripts/ecosystem_orchestrator.py --brand=mackie
```

### Monitor Logs

```bash
# Watch automation logs
tail -f backend/logs/automation/*.log

# View specific logs
tail -f backend/logs/automation/brand_scrape.log
tail -f backend/logs/automation/full_sync.log
tail -f backend/logs/automation/health_check.log

# Check health reports
cat backend/logs/health_report.json | python -m json.tool
```

### Cron Management

```bash
# View all scheduled jobs
crontab -l

# Edit cron jobs
crontab -e

# Remove specific job (edit, then save)
crontab -e

# View cron logs (system-dependent)
# Ubuntu/Debian: grep CRON /var/log/syslog
# RedHat/CentOS: grep CRON /var/log/cron
```

---

## ⚠️ TROUBLESHOOTING

### Issue: Enhanced Scraper Returns 0 Products

**Diagnosis**:

```bash
# Check if Playwright is installed
python -c "from playwright.async_api import async_playwright; print('✅ Playwright OK')"

# Run with verbose logging
python scripts/playwright_brand_scraper.py 2>&1 | grep -i error
```

**Solutions**:

1. Reinstall Playwright: `pip install --force-reinstall playwright && playwright install chromium`
2. Check website structure changed: Visit site manually and verify selectors
3. Check network connectivity: `curl -I https://www.roland.com`

### Issue: Low PRIMARY Coverage

**Check scraper output**:

```bash
# View last scrape results
ls -lh backend/data/catalogs_brand/
cat backend/data/catalogs_brand/roland_catalog.json | jq '.total_products'
```

**Improve matching**:

- Edit `/backend/data/brands/{brand}/scrape_config.json`
- Update CSS selectors to match site structure
- Increase similarity threshold in `ecosystem_orchestrator.py` (currently 0.85)

### Issue: Cron Jobs Not Running

**Verify installation**:

```bash
# List installed jobs
crontab -l | grep ECOSYSTEM

# Check cron service
sudo service cron status

# View cron logs
sudo tail -f /var/log/syslog | grep CRON
```

**Common fixes**:

- Ensure backend directory path is absolute
- Check Python path: `which python3`
- Verify script permissions: `chmod +x scripts/*.py`
- Check log directory exists: `mkdir -p backend/logs/automation`

---

## 📈 PERFORMANCE OPTIMIZATION

### Bottleneck 1: Website Scraping Time

**Current**: ~30 seconds per brand × 18 = 9 minutes  
**Optimization**:

- Use API endpoints when available
- Parallel scraping (already implemented)
- Browser pooling in Playwright

### Bottleneck 2: Product Matching

**Current**: String similarity at 0.85  
**Optimization**:

- Use Levenshtein distance
- Fuzzy matching with thresholds
- Category-aware matching

### Bottleneck 3: Merge Operations

**Current**: Sequential processing  
**Optimization**:

- Parallel brand processing
- Batch database operations
- Caching match results

---

## 🔐 SECURITY CONSIDERATIONS

### Data Protection

- ✅ No credentials stored in configs
- ✅ Use environment variables for sensitive data
- ✅ Backup data encrypted

### Rate Limiting Protection

- ✅ User-Agent rotation
- ✅ Request delays between pages
- ✅ Respectful scraping practices

### Access Control

```bash
# Restrict API access
# Add to backend/app/main.py:
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

---

## 📊 MONITORING DASHBOARD

Access production health via API:

```bash
# GET /api/health
curl http://localhost:8000/api/health

# Response:
{
  "status": "healthy",
  "last_check": "2026-01-15T14:39:57",
  "api": "✅ HEALTHY",
  "catalogs": "✅ FRESH",
  "coverage": "⚠️  BELOW_TARGET",
  "alerts": 0
}
```

---

## 🎓 NEXT LEARNING RESOURCES

1. **Playwright Documentation**: https://playwright.dev/python/
2. **FastAPI Production**: https://fastapi.tiangolo.com/deployment/
3. **Cron Syntax Reference**: https://crontab.guru/
4. **Database Optimization**: Backend optimization guide (separate doc)

---

## ✅ CHECKLIST: GO LIVE

- [ ] Playwright installed and tested
- [ ] Cron jobs installed: `crontab -l`
- [ ] Health check passing: `python scripts/production_monitor.py`
- [ ] First sync completed: Check `logs/automation/full_sync.log`
- [ ] API returning data: `curl http://localhost:8000/api/dual-source-intelligence`
- [ ] Email alerts configured (optional)
- [ ] Log rotation configured
- [ ] Backup strategy in place

---

## 💬 SUPPORT

For issues or questions:

1. Check logs: `tail -f logs/automation/*.log`
2. Run health check: `python scripts/production_monitor.py`
3. Review this guide for troubleshooting section
4. Contact ops team with log excerpts

---

**Last Updated**: 2026-01-15  
**Version**: 3.5  
**Status**: Production Ready
