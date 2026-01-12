# ✅ HSC JIT v3 - Complete Operational Checklist

**Master checklist for deployment, testing, and ongoing operations**

---

## Pre-Development Setup

- [ ] Clone repository
- [ ] Install Python 3.9+
- [ ] Install Node.js 18+
- [ ] Install Docker & Docker Compose
- [ ] Create `.env` file with GEMINI_API_KEY
- [ ] Run `pip install -r backend/requirements.txt`
- [ ] Run `pip install Pillow` (critical for assets)
- [ ] Run `cd frontend && pnpm install`
- [ ] Run `python backend/scripts/harvest_assets.py`
- [ ] Verify: `bash tools/filesystem-inspector.sh`

---

## Backend Initialization

- [ ] Install Python dependencies
  ```bash
  cd /workspaces/hsc-jit-v3/backend
  pip install -r requirements.txt
  pip install Pillow  # CRITICAL
  ```

- [ ] Generate product assets
  ```bash
  cd backend
  python scripts/harvest_assets.py
  # Verify: 340+ product files created
  # Verify: 90+ brand logo files created
  ```

- [ ] **Restart backend** (CRITICAL!)
  ```bash
  pkill -f "uvicorn"
  sleep 2
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```

- [ ] Verify catalog loading
  ```bash
  # You should see:
  # "[CatalogService] Loaded 340 products from 90 rich brands."
  ```

- [ ] Test image serving
  ```bash
  curl -I http://localhost:8000/static/assets/products/roland-td17kvx2.webp
  # Should return: HTTP/1.1 200 OK
  ```

---

## Frontend Initialization

- [ ] Install Node dependencies
  ```bash
  cd /workspaces/hsc-jit-v3/frontend
  pnpm install
  ```

- [ ] Start dev server
  ```bash
  pnpm dev
  # Note which port it uses (5173 or 5174)
  ```

- [ ] Verify proxy working
  ```bash
  curl -I http://localhost:5174/static/assets/products/roland-td17kvx2.webp
  # Should return: HTTP/1.1 200 OK
  ```

- [ ] Open in browser
  ```
  http://localhost:5174 (or your assigned port)
  ```

---

## Functional Testing

- [ ] **Search test**
  - Type "Roland TD"
  - Verify Ghost Card appears
  - Verify product image loads (not broken icon)
  - Verify brand logo displays

- [ ] **Asset loading test**
  - Open DevTools Console
  - Search for product
  - Verify: NO 404 errors
  - Verify: Images return 200 OK

- [ ] **LLM prompt test**
  - Type product query
  - Verify response starts with "This product is from [Brand]..."
  - Verify flags display (🇲🇾 etc.)
  - Verify related products mentioned

- [ ] **WebSocket test**
  - Open DevTools Network tab
  - Search for product
  - Verify WebSocket connection established
  - Verify message streaming occurs

---

## Code Quality Checks

- [ ] **Python syntax**
  ```bash
  python3 -m py_compile backend/app/services/*.py
  ```

- [ ] **Run test suite**
  ```bash
  bash tools/test-suite.sh
  # All tests should PASS
  ```

- [ ] **Validate branch**
  ```bash
  bash tools/branch-manager.sh validate
  # All checks should PASS
  ```

- [ ] **Check files**
  ```bash
  bash tools/filesystem-inspector.sh
  # Review generated report
  ```

---

## Pre-Commit Checklist

Before pushing code:

- [ ] All tests passing: `bash tools/test-suite.sh`
- [ ] Branch validated: `bash tools/branch-manager.sh validate`
- [ ] No uncommitted changes in dependencies
- [ ] Documentation updated if needed
- [ ] Commit message is clear and descriptive

```bash
# Complete pre-commit workflow
bash tools/branch-manager.sh validate
bash tools/test-suite.sh
bash tools/branch-manager.sh purify
git add .
git commit -m "Clear commit message"
```

---

## Pre-Merge Checklist

Before merging to main:

- [ ] Sync with main: `bash tools/branch-manager.sh sync`
- [ ] Resolve any conflicts
- [ ] Update dependencies: `bash tools/branch-manager.sh update`
- [ ] Run full test suite: `bash tools/test-suite.sh`
- [ ] Validate compliance: `bash tools/branch-manager.sh validate`
- [ ] Generate report: `bash tools/branch-manager.sh report`
- [ ] Review all changes: `git diff main...HEAD`

```bash
# Complete pre-merge workflow
bash tools/branch-manager.sh sync
bash tools/branch-manager.sh update
bash tools/test-suite.sh
bash tools/branch-manager.sh validate
bash tools/branch-manager.sh report
```

---

## Deployment Checklist

Production deployment:

- [ ] **Preparation**
  - [ ] All tests passing on main branch
  - [ ] All documentation updated
  - [ ] Version number bumped (if applicable)
  - [ ] Release notes prepared

- [ ] **Build**
  - [ ] Backend image builds: `docker build -t hsc-jit:latest ./backend`
  - [ ] Frontend image builds: `docker build -t hsc-jit-frontend:latest ./frontend`
  - [ ] Both images run without errors

- [ ] **Pre-deployment validation**
  ```bash
  bash tools/filesystem-inspector.sh
  bash tools/test-suite.sh
  bash tools/branch-manager.sh validate
  ```

- [ ] **Deployment**
  - [ ] Update deployment manifests (if using K8s)
  - [ ] Update docker-compose.yml (if using Docker Compose)
  - [ ] Set environment variables
  - [ ] Run migrations (if needed)

- [ ] **Post-deployment**
  - [ ] All services healthy
  - [ ] Health checks passing: `curl http://production/health`
  - [ ] Images loading correctly
  - [ ] LLM responding to queries
  - [ ] No errors in logs
  - [ ] Monitor for 1 hour

---

## Daily Operations

### Morning (Start of Day)
```bash
# Check system health
bash tools/branch-manager.sh status
bash tools/test-suite.sh

# If any failures, investigate and fix
```

### During Development
```bash
# Before each commit
bash tools/test-suite.sh
bash tools/branch-manager.sh validate
```

### Evening (End of Day)
```bash
# Clean up
bash tools/branch-manager.sh purify

# Generate report
bash tools/branch-manager.sh report
```

---

## Troubleshooting Decision Tree

**Issue: Images show broken icons**
1. Check if backend restarted: `ps aux | grep uvicorn`
2. Check if assets exist: `ls backend/app/static/assets/products | wc -l`
3. Run: `bash tools/test-suite.sh`
4. See: `TROUBLESHOOTING_ASSET_LOADING.md`

**Issue: Frontend not responding**
1. Check ports: `netstat -tuln | grep 517`
2. Kill stale processes: `pkill -f pnpm; pkill -f node`
3. Restart: `cd frontend && pnpm dev`
4. See: `TROUBLESHOOTING_ASSET_LOADING.md` - Port Management

**Issue: Backend returning 500 errors**
1. Check logs: `curl http://localhost:8000/health`
2. Check catalogs loaded: `grep "Loaded.*products" logs/*`
3. Restart backend: `pkill -f uvicorn; cd backend && uvicorn app.main:app --reload`
4. Check Python syntax: `python3 -m py_compile backend/app/services/*.py`

**Issue: Tests failing**
1. Run: `bash tools/test-suite.sh`
2. Read specific error messages
3. Check `TEST_RESULTS_*.md` for details
4. Fix issues
5. Re-run tests

**Issue: Need to sync with team**
1. Run: `bash tools/branch-manager.sh sync`
2. Run: `bash tools/branch-manager.sh update`
3. Run: `bash tools/test-suite.sh`
4. Commit any fixes

---

## Documentation References

| Issue | Documentation |
|-------|---------------|
| Asset/image problems | `TROUBLESHOOTING_ASSET_LOADING.md` + `CRITICAL_DISCOVERY.md` |
| System overview | `FILESYSTEM_HEALTH_REPORT.md` |
| Testing | `TEST_RESULTS_*.md` |
| Architecture | `docs/architecture/ARCHITECTURE.md` |
| Operations | `docs/operations/RUNBOOK.md` |
| Tools usage | `tools/README.md` |
| Gap analysis | `GAP_ANALYSIS_FINAL.md` |
| Branch management | `.branch-manager/report-*.md` |

---

## Critical Success Factors

🚨 **CRITICAL - Must do on initial setup and after changes:**
1. Run asset harvester: `python backend/scripts/harvest_assets.py`
2. **Restart backend** (not optional!): `pkill -f uvicorn` then start fresh
3. Clear browser cache: `Ctrl+Shift+Delete`
4. Verify tests pass: `bash tools/test-suite.sh`

⚠️ **Important - Do regularly:**
1. Run test suite before committing
2. Validate branch before merging
3. Sync with main regularly
4. Check system health daily

✅ **Best practices:**
1. Always use tools for consistency
2. Document any custom setup steps
3. Run purify before committing
4. Read error messages fully
5. Check logs before asking for help

---

## Quick Reference Commands

```bash
# One-liner for complete validation
bash tools/branch-manager.sh validate && bash tools/test-suite.sh && bash tools/filesystem-inspector.sh

# Pre-commit
bash tools/branch-manager.sh validate && bash tools/test-suite.sh && bash tools/branch-manager.sh purify

# Pre-merge
bash tools/branch-manager.sh sync && bash tools/test-suite.sh && bash tools/branch-manager.sh update && bash tools/branch-manager.sh report

# Emergency reset
pkill -f "uvicorn"; pkill -f "pnpm"; pkill -f "node"; sleep 2; cd backend && python scripts/harvest_assets.py && pkill -f "uvicorn" && sleep 1 && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

# Health check
curl http://localhost:8000/health && curl http://localhost:5174/ && bash tools/test-suite.sh
```

---

**Status:** ✅ PRODUCTION READY  
**Last Updated:** January 11, 2026  
**Version:** 3.1
