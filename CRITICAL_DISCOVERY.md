# 🔴 CRITICAL DISCOVERY: Backend Restart Required

## The Issue That Made Nothing Work

**Status:** RESOLVED ✅

When I ran the asset harvester (`harvest_assets.py`), it correctly:
- ✅ Generated 340 product images
- ✅ Generated 90 brand logos  
- ✅ Updated catalog JSON files with correct `/static/` paths

**BUT:** The running backend server **didn't pick up these changes** because:
- CatalogService loads JSON catalogs **into memory at startup**
- The harvest script modified the JSON files **on disk**
- The backend was still using the **old in-memory catalog data** with broken external URLs
- Frontend received old URLs → All images failed to load (404s)

---

## The Fix

### Backend Must Be Restarted After Harvest

```bash
# Step 1: Stop the backend
pkill -f "uvicorn"
sleep 2

# Step 2: Start it fresh
cd /workspaces/hsc-jit-v3/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# You should see this message:
# "[CatalogService] Loaded 340 products from 90 rich brands."
# This confirms it reloaded catalogs from the updated JSON files
```

---

## Why This Wasn't Obvious

1. **The error was silent** - Backend wasn't throwing errors, just serving old data
2. **Infrastructure looked correct** - Files existed, proxy worked, static mount was there
3. **The gap between data and code** - Code was correct, but data in memory was stale
4. **Caching architecture** - In-memory caching is fast, but requires restart when source changes

---

## Verification: Before vs After Restart

### BEFORE Backend Restart
```python
# Backend's in-memory data still had:
{
  "images": {
    "main": "https://external-broken-url.com/image.jpg"  # ❌ BROKEN
  }
}
# Frontend gets broken URL → Browser tries to load → 404 error
```

### AFTER Backend Restart
```python
# Backend reloads JSON from disk:
{
  "images": {
    "main": "/static/assets/products/product-id.webp"  # ✅ CORRECT
  }
}
# Frontend gets local URL → Vite proxy → Backend serves file → 200 OK
```

---

## The Complete Correct Workflow

1. **Run harvest script** - Updates JSON files on disk
   ```bash
   python backend/scripts/harvest_assets.py
   ```

2. **Restart backend** - Reloads updated catalog data into memory ⚠️ CRITICAL
   ```bash
   pkill -f "uvicorn"
   sleep 2
   cd backend && uvicorn app.main:app --reload ...
   ```

3. **Clear frontend cache** - Browser may have cached old URLs
   ```bash
   # In DevTools: Cmd+Shift+Delete to clear cache
   # Or restart frontend:
   pkill -f "pnpm dev"
   cd frontend && pnpm dev
   ```

4. **Verify** - All images now load correctly
   ```bash
   # Open http://localhost:5174
   # Search product
   # Images display with 200 OK in console
   ```

---

## Updated Documentation

All troubleshooting guides have been updated to emphasize:

1. **`TROUBLESHOOTING_ASSET_LOADING.md`** - Updated Step 3 with critical warning
2. **`ASSET_LOADING_ISSUE_AND_FIX.md`** - Added "Restart Backend (CRITICAL STEP)" section
3. **This file** - Complete discovery and explanation

---

## Current System Status

✅ **FIXED AND VERIFIED**

With the backend restarted:
- Backend catalog loaded: 340 products, 90 brands
- All image paths correct: `/static/assets/products/...` ✅
- All brand logos correct: `/static/assets/brands/...` ✅
- Backend serving: HTTP 200 OK ✅
- Frontend proxy: Working ✅
- Browser: Images displaying correctly ✅

---

## Lesson for Future

**The Caching Problem:**
```
Code deployed  →  Works initially  →  Update data files  →  Code still uses old cached data  →  Appears broken
```

**The Solution:**
```
After updating data that's cached in memory → Restart the service  → Service reloads data  → Updates take effect
```

This applies to:
- ✅ In-memory catalogs
- ✅ Configuration caches
- ✅ Model weights
- ✅ Any service that loads files on startup

---

**Discovery Date:** January 11, 2026  
**Status:** RESOLVED ✅  
**Impact:** CRITICAL - Without this fix, system doesn't work  
**Solution:** One command: `pkill -f "uvicorn"` + restart backend
