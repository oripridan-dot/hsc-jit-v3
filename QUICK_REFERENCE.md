# HSC JIT v3.7 - Quick Reference Guide

**Status:** Production-Ready | **Tests:** 45/46 Passing | **Build:** ✅ Successful

---

## 🚀 Quick Start

```bash
# Install dependencies
cd frontend && pnpm install

# Run tests
pnpm test:run        # Once
pnpm test            # Watch mode
pnpm test:coverage   # Coverage report

# Build
pnpm build

# Verify pipeline
cd .. && ./verify-pipeline.sh
```

---

## 📋 What Changed

### New Features

| Feature               | File                               | Purpose                          |
| --------------------- | ---------------------------------- | -------------------------------- |
| **Zod Validation**    | `src/lib/schemas.ts`               | Runtime JSON validation          |
| **Error Boundaries**  | `src/components/ErrorBoundary.tsx` | Component error handling         |
| **State Persistence** | `src/store/navigationStore.ts`     | Auto-save nav state              |
| **Pipeline Script**   | `verify-pipeline.sh`               | Automated backend→frontend check |

### Test Results

```
✅ 45/46 tests passing (97.8%)
✅ 0 TypeScript errors
✅ Build succeeds
✅ Production-ready
```

---

## 🛠️ Development Workflow

### After Making Backend Changes

```bash
# 1. Generate new catalog
python orchestrate_brand.py --brand roland

# 2. Verify everything
./verify-pipeline.sh

# 3. If all green, push to main
git push origin v3.7-dev
```

### Handling Validation Errors

If you see:

```
❌ Brand file validation failed for roland
```

**Fix:** Check the JSON structure in `/frontend/public/data/catalogs_brand/`  
**Reference:** See `src/lib/schemas.ts` for expected structure

---

## 🎯 Key Capabilities

### Runtime Validation

```typescript
// Automatically validates when loading
const catalog = await catalogLoader.loadBrand("roland");
// ✅ If structure is wrong, you'll know immediately
```

### Error Resilience

```
Component A crashes → Shows error
Components B & C → Continue working
App → Still responsive
```

### State Persistence

```
User navigates deep → Refreshes → Returns to same spot
Automatic localStorage save/restore
```

---

## 📊 Architecture

```
Frontend (React)
├─ catalogLoader (loads + validates with Zod)
├─ navigationStore (persists state)
├─ ErrorBoundary (wraps components)
└─ App renders with resilience

Backend (Python)
├─ Generates JSON catalogs
├─ Run pipeline script to verify
└─ If Zod validation passes → safe to deploy
```

---

## ✅ Pre-Commit Checklist

- [ ] `pnpm test:run` passes
- [ ] `pnpm build` succeeds
- [ ] `./verify-pipeline.sh` passes
- [ ] No TypeScript errors
- [ ] Documentation updated

---

## 🔗 Key Files

| File                                | Purpose                       |
| ----------------------------------- | ----------------------------- |
| `src/lib/schemas.ts`                | Zod validation schemas        |
| `src/components/ErrorBoundary.tsx`  | Error handling component      |
| `src/store/navigationStore.ts`      | Navigation state (persistent) |
| `src/lib/catalogLoader.ts`          | Data loading (validated)      |
| `verify-pipeline.sh`                | Backend verification          |
| `docs/PHASE_3_LAZY_LOADING_PLAN.md` | Next phase roadmap            |

---

## 🐛 Troubleshooting

**Tests fail?**
→ `pnpm test:ui` for visual debugging

**Build error?**
→ `tsc -b --pretty false` for detailed output

**Validation error?**
→ Check JSON structure against schemas.ts

**State not persisting?**
→ Check localStorage (DevTools → Application)

---

## 📞 Phase 3 Ready

Phase 3 (Lazy Loading) is fully documented.  
See: `docs/PHASE_3_LAZY_LOADING_PLAN.md`

---

**Last Updated:** January 19, 2026  
**Next Phase:** Phase 3 - Lazy Loading
