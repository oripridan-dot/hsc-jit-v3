# 🔧 Maintenance Guide - Keep HSC-JIT Clean 100% of the Time

**Automated quality control for v3.7.5 "See Then Read"**

---

## 🎯 Philosophy

**"Prevention is better than cleanup"**

Instead of massive 4-prompt cleanup sessions, we run **continuous automated checks** that prevent technical debt from accumulating.

---

## ⚡ Quick Commands

### Daily (Before Starting Work)

```bash
cd frontend
pnpm daily
# Runs: types + lint + build + tests + deps check + size report
# Time: ~10 seconds
```

### Before Every Commit

```bash
# Automatic via git hooks (see below)
# Manual check:
pnpm verify
```

### Weekly (Friday Cleanup)

```bash
pnpm run clean:logs    # Find stray console.log
pnpm run clean:todos   # List TODO/FIXME comments
pnpm run quality:deps  # Check for unused packages
```

---

## 🤖 Automated Systems

### 1. Git Pre-Commit Hook

**Location**: `.husky/pre-commit`

**What it checks**:

- ✅ TypeScript compiles
- ✅ ESLint passes
- ✅ No new console.log (except devTools)
- ⚠️ Warns about new TODO/FIXME

**Setup** (one-time):

```bash
cd /workspaces/hsc-jit-v3
npx husky install
chmod +x .husky/pre-commit
```

**Result**: **Cannot commit broken code** ✅

---

### 2. GitHub Actions CI/CD

**Location**: `.github/workflows/quality-gate.yml`

**Runs on**:

- Every push to `main` or `v3.7.5-*` branches
- Every pull request

**What it checks**:

- ✅ TypeScript compilation
- ✅ ESLint (0 warnings)
- ✅ Production build succeeds
- ✅ Bundle size <500KB
- ✅ No unused dependencies
- ✅ No backend API calls (static-first verification)
- ✅ No WebSocket references
- ✅ Tests pass
- ⚠️ TODO/FIXME count <5

**Result**: **Cannot merge broken PRs** ✅

---

### 3. VS Code Auto-Fix

**Location**: `.vscode/settings.json`

**Features**:

- ✅ Format on save
- ✅ Auto-fix ESLint issues
- ✅ Auto-organize imports
- ✅ Highlight TODO/FIXME in red
- ✅ Use workspace TypeScript

**Result**: **Code stays clean while typing** ✅

---

### 4. NPM Scripts (Manual Checks)

```json
"quality"       → Full quality check (types + lint + build)
"quality:types" → TypeScript only
"quality:lint"  → ESLint only
"quality:build" → Production build test
"quality:deps"  → Find unused dependencies
"quality:size"  → Show bundle size

"clean:logs"    → Find console.log statements
"clean:todos"   → List all TODO/FIXME
"clean:imports" → Count imported files

"verify"        → Full verification (quality + tests)
"daily"         → Complete daily check suite
```

**Result**: **Quality checks on demand** ✅

---

## 📋 Daily Workflow

### Morning (Start of Day)

```bash
cd frontend
pnpm daily
```

**Expected output**:

```
✅ TypeScript: 0 errors
✅ ESLint: 0 warnings
✅ Build: 3.87s
✅ Tests: 6 passed
✅ Dependencies: 0 unused
✅ Bundle: 139KB gzipped
```

**If any fail**: Fix immediately before starting new work.

---

### During Development

**VS Code does automatically**:

1. Shows TypeScript errors in real-time
2. Formats code on save
3. Organizes imports on save
4. Highlights TODO/FIXME

**You do**:

- Write clean code
- Avoid console.log (use devTools if needed)
- Resolve TODOs before committing

---

### Before Commit

**Git hook runs automatically**:

```
🔍 Running pre-commit quality checks...
  → TypeScript compilation...
  → ESLint...
  → Checking for console.log...
  → Checking for TODO/FIXME...
  → Checking imports...
✅ All pre-commit checks passed!
```

**If hook fails**: Fix issues, then commit again.

---

### Friday (End of Week)

```bash
# Quick cleanup scan
pnpm run clean:logs
pnpm run clean:todos
pnpm run quality:deps
pnpm run quality:size

# If you find issues:
# - Remove stray console.log
# - Resolve or remove TODOs
# - Remove unused dependencies
# - Check if bundle grew
```

**Goal**: Keep accumulating debt at **zero** ✅

---

## 🚨 Red Flags (Act Immediately)

### 🔴 TypeScript Errors

```bash
pnpm quality:types
```

**Never commit with TypeScript errors.**

### 🔴 Bundle Size Growth

```bash
pnpm quality:size
```

**If bundle >500KB**: Investigate what grew.

### 🔴 New Unused Dependencies

```bash
pnpm quality:deps
```

**If unused found**: Remove immediately.

### 🟡 TODO/FIXME Growth

```bash
pnpm run clean:todos
```

**If count >10**: Schedule cleanup session.

### 🟡 Console.log in Production

```bash
pnpm run clean:logs
```

**If found outside devTools/Navigator**: Remove.

---

## 🔧 Setup (One-Time)

### 1. Install Husky (Git Hooks)

```bash
cd /workspaces/hsc-jit-v3
npm install -D husky
npx husky install
chmod +x .husky/pre-commit
```

### 2. Install depcheck (Dependency Checker)

```bash
cd frontend
pnpm add -D depcheck
```

### 3. Enable VS Code Extensions (Recommended)

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **TODO Tree** (`Gruntfuggly.todo-tree`)
- **Error Lens** (`usernamehw.errorlens`)

### 4. Configure Git

```bash
# Run quality checks before push (optional)
git config core.hooksPath .husky
```

---

## 📊 Quality Metrics (Target Values)

| Metric                 | Target | Current | Status |
| ---------------------- | ------ | ------- | ------ |
| TypeScript Errors      | 0      | 0       | ✅     |
| ESLint Warnings        | 0      | 0       | ✅     |
| Bundle Size (gzipped)  | <200KB | 139KB   | ✅     |
| Unused Dependencies    | 0      | 0       | ✅     |
| TODO/FIXME Count       | <5     | 0       | ✅     |
| Production console.log | <5     | 4       | ✅     |
| Test Coverage          | >70%   | TBD     | ⚠️     |
| Build Time             | <5s    | 3.87s   | ✅     |

---

## 🎓 Training: The Clean Code Habit

### Week 1: Learn the Tools

- Run `pnpm daily` every morning
- Watch git pre-commit hook work
- Read VS Code warnings

### Week 2: Build Muscle Memory

- Fix errors **before** they accumulate
- Clean TODOs **as you go**
- Remove unused imports **immediately**

### Week 3: Internalize Standards

- Code feels "wrong" with console.log
- Can't commit without running checks
- Quality checks become automatic

### Week 4+: Maintenance Mode

- Quality checks happen unconsciously
- Codebase stays clean 100% of time
- Cleanup sessions become **unnecessary**

---

## 🆘 Troubleshooting

### "Pre-commit hook not running"

```bash
chmod +x .husky/pre-commit
git config core.hooksPath .husky
```

### "TypeScript errors in tests only"

```bash
# Update test tsconfig
cd frontend
# Check tsconfig.test.json extends main config
```

### "ESLint failing on valid code"

```bash
# Update .eslintrc or add exceptions
# Only do this if genuinely needed
```

### "Bundle size suddenly grew"

```bash
# Check what was added
pnpm exec vite-bundle-visualizer
# Or manually check package.json changes
```

---

## 📈 Continuous Improvement

### Monthly Review

1. Check GitHub Actions success rate
2. Review average build time
3. Check bundle size trend
4. Survey team: "What slows you down?"

### Quarterly Audit

1. Deep dependency review
2. Architecture validation
3. Performance profiling
4. Security audit

---

## 🎯 Success Criteria

**You know this is working when**:

1. ✅ Git pre-commit never blocks you (code already clean)
2. ✅ GitHub Actions always green (no surprises)
3. ✅ `pnpm daily` runs in <10s
4. ✅ Bundle size stays flat or decreases
5. ✅ Zero "cleanup" sessions needed
6. ✅ New developers follow standards naturally

---

## 📚 Reference Commands

```bash
# Daily (automated)
pnpm daily                  # Complete check suite

# Quality checks
pnpm quality                # Full quality gate
pnpm quality:types          # TypeScript only
pnpm quality:lint           # ESLint only
pnpm quality:build          # Build test
pnpm quality:deps           # Unused deps
pnpm quality:size           # Bundle size

# Cleanup tools
pnpm run clean:logs         # Find console.log
pnpm run clean:todos        # Find TODO/FIXME
pnpm run clean:imports      # Import count

# Verification
pnpm verify                 # Full verification
pnpm test                   # Run tests
pnpm build                  # Production build

# Development
pnpm dev                    # Start dev server
pnpm preview                # Preview build
```

---

## 🎉 Result

**No more 4-prompt cleanup sessions.**

Instead:

- ✅ Quality checks run **automatically**
- ✅ Issues caught **immediately**
- ✅ Technical debt prevented **at source**
- ✅ Codebase clean **100% of time**
- ✅ Developers stay focused on features

**Maintenance**: 2 minutes/day instead of 4 hours/month ✅

---

**Version**: 3.7.5 "See Then Read"  
**Last Updated**: January 22, 2026  
**Maintained by**: Ori Pridan ([@oripridan-dot](https://github.com/oripridan-dot))
