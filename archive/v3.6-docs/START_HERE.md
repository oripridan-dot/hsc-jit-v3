# HSC-JIT v3.6 - Start Here 🚀

**Pure static-first architecture - zero runtime infrastructure**

## Quick Setup (5 minutes)

### 1. Build Catalogs
```bash
cd backend && python build.py --brand=all
```
Output: 2,026 products across 38 brands → `frontend/public/data/*.json`

### 2. Run Frontend
```bash
cd frontend && pnpm install && pnpm dev
```
Result: http://localhost:5173 - Instant <50ms search

## What You Get

✅ **Brand Contracts**: Boss & Roland with 12 main categories each  
✅ **Static JSON**: 2MB total, instant loading  
✅ **Client Search**: Fuse.js <50ms in-memory  
✅ **Zero Cost**: No backend, no database, no infrastructure  

## Key Files

- `backend/build.py` - Master build script
- `backend/core/brand_contracts.py` - Category hierarchy
- `frontend/src/lib/catalogLoader.ts` - Static JSON loader
- `frontend/src/lib/instantSearch.ts` - Fuse.js search

## Documentation

- [V3.6_STATIC_BUILD_SYSTEM.md](V3.6_STATIC_BUILD_SYSTEM.md) - Build system
- [contracts/README.md](backend/data/contracts/README.md) - Brand contracts

**Status**: ✅ Production Ready v3.6.0 (Jan 16, 2026)
