# ⚡ Quick Setup - Automated Quality Control

**5-minute setup for continuous code quality**

---

## 1. Install Tools (Already Done! ✅)

```bash
cd frontend
# Already installed:
# - husky (git hooks)
# - depcheck (unused dependencies)
```

---

## 2. Test Your New Commands

### Quality Checks (NEW!)

```bash
cd frontend

# Type checking
pnpm run quality:types          # ✅ No TypeScript errors

# Find console.log
pnpm run clean:logs              # Found in 6 files (normal)

# Find TODOs
pnpm run clean:todos             # 0 found ✅

# Full quality gate
pnpm run quality                 # types + lint + build

# Complete verification
pnpm run verify                  # quality + tests

# Daily routine
pnpm run daily                   # verify + bundle size
```

---

## 3. Enable Git Hook (Optional but Recommended)

```bash
cd /workspaces/hsc-jit-v3

# Create husky directory
mkdir -p .husky
cp /workspaces/hsc-jit-v3/.husky/pre-commit .husky/
chmod +x .husky/pre-commit

# Test it
git add -A
git commit -m "test: quality hooks"
# Should run checks automatically!
```

---

## 4. VS Code Settings (Already Applied! ✅)

Your VS Code now:

- ✅ Formats on save
- ✅ Auto-fixes ESLint
- ✅ Organizes imports
- ✅ Shows TypeScript errors in real-time

---

## 5. Daily Routine

### Every Morning

```bash
cd frontend
pnpm run daily
```

**Expected output**:

```
✅ TypeScript: 0 errors
✅ ESLint: 0 warnings
✅ Build: Success (3.87s)
✅ Tests: 6 passed
✅ Bundle: 460KB / 139KB gzipped
```

### Before Every Commit

```bash
# Automatic via git hook!
# Or manual:
pnpm run verify
```

### Friday Cleanup

```bash
pnpm run clean:logs    # Check console.log
pnpm run clean:todos   # Check TODOs
pnpm run quality:deps  # Check unused deps
```

---

## 6. Try It Now!

```bash
cd /workspaces/hsc-jit-v3/frontend

# 1. Check types (should pass)
pnpm run quality:types

# 2. Check bundle size
pnpm run quality:size

# 3. Find console.log statements
pnpm run clean:logs

# 4. Run full verification
pnpm run verify
```

---

## 📊 What's Monitored

| Check       | Command         | Frequency    |
| ----------- | --------------- | ------------ |
| TypeScript  | `quality:types` | Every commit |
| ESLint      | `quality:lint`  | Every commit |
| Build       | `quality:build` | Daily        |
| Tests       | `test:run`      | Every commit |
| Bundle Size | `quality:size`  | Weekly       |
| Unused Deps | `quality:deps`  | Weekly       |
| console.log | `clean:logs`    | Weekly       |
| TODOs       | `clean:todos`   | Weekly       |

---

## 🎯 Result

**Before**: 4-prompt cleanup sessions ❌  
**After**: 2-minute daily checks ✅

No more technical debt!

---

**See full guide**: [MAINTENANCE.md](MAINTENANCE.md)
