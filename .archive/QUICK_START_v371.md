# 🚀 Quick Start - v3.7.1-catalogs

## ✅ What's Ready

Your system is fully set up and production-ready:

- ✅ Backend: Perfect alignment with 6-stage pipeline
- ✅ Frontend: Real-time auto-updating with live catalog sync
- ✅ Data: Cleaned catalogs (226 products: 197 Boss + 29 Roland)
- ✅ Vite Config: Fixed (removed problematic middleware)

---

## 🎯 Start Development

### Terminal 1: Frontend Dev Server

```bash
cd /workspaces/hsc-jit-v3/frontend
pnpm dev
```

You'll see:

```
VITE ready in XXXms
Local: http://localhost:5173
(or 5174/5175 if port is busy)
```

Open in browser: **http://localhost:5173**

### Terminal 2: Backend (Optional)

```bash
cd /workspaces/hsc-jit-v3/backend
python orchestrate_pipeline.py
```

This publishes updated catalogs to `/frontend/public/data/`

---

## 🔄 Real-Time Updates in Action

### Edit a Catalog File

```bash
# Open: /frontend/public/data/boss.json
# Edit: Change a product name, add a product, etc.
# Save the file
```

### Watch UI Auto-Update

Within **1 second**, the frontend will:

1. Detect the change
2. Clear cache
3. Reload data
4. Update UI automatically

**No refresh button needed!**

### Manual Control (Browser Console)

```javascript
// Check status
window.__hscdev.status();

// Force refresh all data
window.__hscdev.refreshData();

// Force refresh specific brand
window.__hscdev.refreshBrand("roland");

// Clear all caches
window.__hscdev.clearCache();
```

---

## 📁 File Structure

```
/workspaces/hsc-jit-v3/
├── frontend/
│   ├── public/data/          ← Edit catalogs here
│   │   ├── index.json        (2 brands, 226 products)
│   │   ├── boss.json         (197 products)
│   │   └── roland.json       (29 products)
│   └── src/
│       ├── lib/
│       │   ├── dataWatcher.ts      (1s polling for changes)
│       │   ├── catalogLoader.ts    (caching + loading)
│       │   └── devTools.ts         (browser console API)
│       ├── hooks/
│       │   └── useRealtimeData.ts  (React hooks for updates)
│       └── App.tsx                 (real-time integration)
│
└── backend/
    ├── data/catalogs_brand/        ← Mirror of frontend/public/data
    │   ├── boss.json
    │   └── roland.json
    └── orchestrate_pipeline.py    (auto-publish to frontend)
```

---

## 🧪 Testing the System

### Test 1: Manual Edit

1. Start frontend: `pnpm dev`
2. Open http://localhost:5173
3. Edit `/frontend/public/data/boss.json`
4. Watch UI update automatically

### Test 2: Backend Pipeline

1. Start backend: `python orchestrate_pipeline.py`
2. Publishes new catalogs to `/frontend/public/data/`
3. Frontend auto-detects changes
4. UI updates in real-time

### Test 3: Dev Tools

```javascript
// In browser console
window.__hscdev.refreshData();
// UI should refresh with latest data
```

---

## 🔧 Configuration

### Change Polling Interval

Edit `frontend/src/lib/dataWatcher.ts`:

```typescript
private pollInterval: number = 1000; // Change to 500 for faster
```

### Change Dev Server Port

Edit `frontend/vite.config.ts`:

```typescript
server: {
  port: 5173, // Change to desired port
}
```

---

## 📊 Current Status

| Component | Status    | Details                   |
| --------- | --------- | ------------------------- |
| Frontend  | ✅ Ready  | Real-time updates enabled |
| Backend   | ✅ Ready  | 6-stage pipeline working  |
| Data      | ✅ Clean  | 226 products (2 brands)   |
| Dev Tools | ✅ Active | Browser console API ready |

**Version**: v3.7.1-catalogs  
**Commits**: 4 (backend alignment + catalogs cleanup + real-time)  
**Ready**: Yes ✅

---

## 🚨 Troubleshooting

### Frontend won't start

```bash
cd frontend
pkill -f "pnpm" 2>/dev/null || true
pnpm dev
```

### Port already in use

Vite auto-tries 5174, 5175, etc. Or kill the process:

```bash
pkill -f "vite"
pnpm dev
```

### Data not updating

1. Check file exists: `ls /frontend/public/data/boss.json`
2. Check Vite is serving it: `curl http://localhost:5173/data/boss.json`
3. Force refresh: `window.__hscdev.refreshData()`

### Real-time not working

```javascript
// Check if dev tools are loaded
window.__hscdev.status();

// If not found, check browser console for errors
// Reload page: Ctrl+R (or Cmd+R on Mac)
```

---

## 🎓 Next Steps

1. **Start the frontend**: `cd frontend && pnpm dev`
2. **Open browser**: http://localhost:5173
3. **Test real-time**: Edit `/frontend/public/data/boss.json`
4. **Watch it work**: UI updates within 1 second
5. **Read docs**: [REALTIME_DEVELOPMENT.md](../REALTIME_DEVELOPMENT.md)

---

## 📚 Documentation

- **REALTIME_DEVELOPMENT.md** - Comprehensive real-time guide
- **README.md** - Main project documentation
- **SYSTEM_GUIDE.md** - Architecture and design
- **Backend Guides** - In `/backend/` directory

---

**Everything is ready. Start coding! 🚀**
