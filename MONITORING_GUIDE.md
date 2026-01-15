# 🔄 Real-Time Monitoring Guide

## Quick Reference

### Watch Everything (Recommended)
```bash
python backend/scripts/watch_sync.py
```
**Shows**: All phases, progress, recent logs, auto-refresh every 3 seconds

### Follow Specific Log
```bash
# Halilit scraper
python backend/scripts/watch_sync.py --tail halilit-sync.log

# Brand website scraper
python backend/scripts/watch_sync.py --tail brand-sync.log

# Merge process
python backend/scripts/watch_sync.py --tail merge-sync.log

# Main orchestrator
python backend/scripts/watch_sync.py --tail hsc-sync-orchestrator.log

# Health monitoring
python backend/scripts/watch_sync.py --tail hsc-jit-monitor.log
```

### Custom Refresh Rate
```bash
# Slower refresh (less CPU)
python backend/scripts/watch_sync.py --refresh 10

# Faster refresh
python backend/scripts/watch_sync.py --refresh 1
```

---

## What You'll See

### Real-Time Dashboard

```
═══════════════════════════════════════════════════════════════════
                    🔄 REAL-TIME SYNC MONITORING
═══════════════════════════════════════════════════════════════════

🔄 Sync Phases:
────────────────────────────────────────────────────────────────────
⏳ Halilit Sync         RUNNING
   ├─ Products: 1,547
   └─ Brands: 12

⏹️  Brand Scraper        PENDING

⏹️  Merge                PENDING

⏹️  Gap Analysis         PENDING

📋 Recent Log Entries:
────────────────────────────────────────────────────────────────────
Orchestrator:
  2026-01-15 08:20:07 | INFO | [HALILIT] Starting sync...
  2026-01-15 08:21:15 | INFO | [HALILIT] Roland: 500 products

Halilit:
  Scraping Roland... 500 products found
  Scraping Pearl... 364 products found

Status: Sync process is RUNNING
════════════════════════════════════════════════════════════════════
Last updated: 08:25:43 | Press Ctrl+C to exit
Refreshing every 3 seconds...
```

---

## Status Indicators

| Symbol | Status | Meaning |
|--------|--------|---------|
| ⏳ | RUNNING | Phase is currently executing |
| ✅ | COMPLETE | Phase finished successfully |
| ⏹️  | PENDING | Phase hasn't started yet |
| ❌ | ERROR | Phase encountered errors |

---

## Monitoring Scenarios

### During Sync
```bash
# Open in terminal while sync is running
python backend/scripts/watch_sync.py
```
You'll see:
- Real-time product counts as brands are scraped
- Progress through all phases
- Recent log entries showing what's happening
- Errors if any occur

### After Sync
```bash
# Check final results
python backend/scripts/elite_dashboard.py
```
Shows complete statistics and timing.

### Debugging Issues
```bash
# Follow specific log for details
python backend/scripts/watch_sync.py --tail halilit-sync.log
```
See detailed error messages and progress.

---

## Gap Analysis Monitoring

The real-time monitor also tracks gap analysis:

```
⏳ Gap Analysis         RUNNING
   └─ Brands: 15
```

Shows how many brands have been analyzed for coverage gaps.

---

## Tips

1. **Open in separate terminal** while sync runs in another
2. **Use `--refresh 10`** if your terminal is slow
3. **Press Ctrl+C** anytime to stop monitoring (won't stop sync)
4. **Check logs manually** if monitor crashes: `tail -f backend/logs/*.log`

---

## All Available Logs

```bash
backend/logs/
├── hsc-sync-orchestrator.log  # Main coordinator
├── halilit-sync.log           # Halilit scraping
├── brand-sync.log             # Brand website scraping
├── merge-sync.log             # Catalog merging
└── hsc-jit-monitor.log        # Health checks
```

---

## Integration with Elite System

Real-time monitoring complements the elite system:

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `watch_sync.py` | Real-time progress | During sync |
| `elite_dashboard.py` | Final results | After sync completes |
| `elite_monitor.py` | Health checks | On-demand verification |
| `sync_orchestrator.py` | Run sync | Start new sync |

---

## Examples

### Example 1: Monitor Full Sync
```bash
# Terminal 1: Start sync
python backend/scripts/sync_orchestrator.py

# Terminal 2: Watch progress
python backend/scripts/watch_sync.py
```

### Example 2: Debug Halilit Issues
```bash
# Follow Halilit log in detail
python backend/scripts/watch_sync.py --tail halilit-sync.log

# In another terminal, check what's wrong
cat backend/logs/halilit-sync.log | grep ERROR
```

### Example 3: Quick Status Check
```bash
# Single refresh, then exit
timeout 3 python backend/scripts/watch_sync.py
```

---

## Summary

✅ **Real-time monitoring available**  
✅ **Works during sync or after**  
✅ **Tracks all phases + gap analysis**  
✅ **Color-coded status indicators**  
✅ **Auto-refreshing dashboard**  
✅ **Can tail specific logs**

**Primary Command**: `python backend/scripts/watch_sync.py`

Press Ctrl+C to stop monitoring anytime.
