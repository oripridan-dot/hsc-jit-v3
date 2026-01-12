# 🛠️ HSC JIT v3 - Development Tools Suite

**Master toolkit for code quality, testing, branch management, and compliance**

All tools are designed to be **dragged from the VS Code Explorer** into Copilot for execution.

---

## Available Tools

### 1. 🔍 Filesystem Inspector
**File:** `tools/filesystem-inspector.sh`

**Purpose:** Complete workspace analysis and health report

**Commands:**
```bash
bash tools/filesystem-inspector.sh
```

**What it does:**
- Scans entire project structure
- Counts files by type (Python, TypeScript, JSON, etc.)
- Lists all components, services, and dependencies
- Checks disk usage and large directories
- Verifies running services
- Generates comprehensive health report
- Saves output to `FILESYSTEM_HEALTH_REPORT.md`

**When to use:**
- Onboarding new team members
- Pre-deployment verification
- Troubleshooting file structure issues
- Understanding project architecture

---

### 2. 🧪 Comprehensive Test Suite
**File:** `tools/test-suite.sh`

**Purpose:** Single source of truth for all system tests

**Commands:**
```bash
bash tools/test-suite.sh
```

**What it tests:**
- Backend API responsiveness
- Catalog loading (340 products)
- Product image serving (200 OK)
- Brand logo serving (200 OK)
- Redis connection
- Frontend dev server (5173/5174)
- Vite proxy functionality
- Asset files on disk
- Python code syntax
- Configuration files
- Docker Compose setup

**When to use:**
- Before committing code
- After deployment
- When deploying to production
- Troubleshooting issues
- Continuous integration/CD

**Output:** `TEST_RESULTS_*.md`

---

### 3. 🌿 Branch Manager & Sync Tool
**File:** `tools/branch-manager.sh`

**Purpose:** Manage branches, sync code, validate compliance, optimize environment

**Commands:**
```bash
# Show current status
bash tools/branch-manager.sh status

# Sync with main branch
bash tools/branch-manager.sh sync

# Validate compliance
bash tools/branch-manager.sh validate

# Update dependencies
bash tools/branch-manager.sh update

# Purify/clean environment
bash tools/branch-manager.sh purify

# Generate sync report
bash tools/branch-manager.sh report
```

**What each command does:**

#### `status`
- Shows current git branch
- Displays last commit
- Lists pending changes
- Shows service status (backend/frontend)
- Displays version info (Python, Node, npm)

#### `sync`
- Fetches latest from main branch
- Merges main into current branch
- Handles conflicts gracefully
- Logs all sync operations

#### `validate`
- Checks Python syntax
- Verifies required files exist
- Validates asset presence (300+ products)
- Ensures compliance across codebase
- Returns pass/fail status

#### `update`
- Upgrades backend dependencies (`pip install -r requirements.txt`)
- Upgrades frontend dependencies (`pnpm install`)
- Maintains version compatibility

#### `purify`
- Removes `__pycache__` directories
- Clears `.pytest_cache`
- Removes `.pyc` files
- Cleans Node modules cache
- Removes build artifacts
- Clears old logs

#### `report`
- Generates comprehensive sync report
- Shows git history
- Lists recent sync operations
- Saves to `.branch-manager/report-*.md`

**When to use:**
- Before switching branches
- Before committing changes
- During code review process
- Before and after deployments
- When onboarding new developers
- Regular health checks

**Logs:** `.branch-manager/sync-*.log`

---

## How to Use These Tools

### Method 1: Direct Execution
```bash
# In terminal
bash tools/test-suite.sh
bash tools/filesystem-inspector.sh
bash tools/branch-manager.sh status
```

### Method 2: From VS Code Explorer (Recommended)
1. Open VS Code Explorer
2. Navigate to `tools/` folder
3. Right-click on tool script
4. Select "Open in Terminal" or "Run with Bash"
5. Results appear in Copilot or terminal

### Method 3: Drag & Drop to Copilot
1. Open Explorer → `tools/` folder
2. Drag `test-suite.sh` onto Copilot chat
3. Copilot sees the script and can execute it
4. Results are captured and analyzed

---

## Tool Workflow Examples

### Pre-Commit Workflow
```bash
# 1. Check status
bash tools/branch-manager.sh status

# 2. Validate compliance
bash tools/branch-manager.sh validate

# 3. Run tests
bash tools/test-suite.sh

# 4. Clean environment
bash tools/branch-manager.sh purify
```

### Pre-Deployment Workflow
```bash
# 1. Sync with main
bash tools/branch-manager.sh sync

# 2. Update dependencies
bash tools/branch-manager.sh update

# 3. Run full test suite
bash tools/test-suite.sh

# 4. Inspect filesystem
bash tools/filesystem-inspector.sh

# 5. Generate report
bash tools/branch-manager.sh report
```

### New Developer Onboarding
```bash
# 1. Show project structure
bash tools/filesystem-inspector.sh

# 2. Show current status
bash tools/branch-manager.sh status

# 3. Run tests to verify setup
bash tools/test-suite.sh
```

---

## Output Files

Each tool generates timestamped reports:

| Tool | Output File | Location |
|------|------------|----------|
| Filesystem Inspector | `FILESYSTEM_HEALTH_REPORT.md` | Project root |
| Test Suite | `TEST_RESULTS_<timestamp>.md` | Project root |
| Branch Manager (sync) | `sync-<timestamp>.log` | `.branch-manager/` |
| Branch Manager (report) | `report-<timestamp>.md` | `.branch-manager/` |

---

## Integration with Development

These tools are designed to be **part of your daily workflow**:

✅ **Before coding:** Run `branch-manager.sh status` + `branch-manager.sh validate`  
✅ **During coding:** Regular `test-suite.sh` runs  
✅ **Before commit:** `branch-manager.sh validate` + `test-suite.sh`  
✅ **Before merge:** `branch-manager.sh sync` + full `test-suite.sh`  
✅ **Before deploy:** Complete workflow above  
✅ **After deploy:** `test-suite.sh` + `filesystem-inspector.sh`  

---

## Automation Ideas

### GitHub Actions Integration
```yaml
- name: Run Test Suite
  run: bash tools/test-suite.sh

- name: Validate Branch
  run: bash tools/branch-manager.sh validate

- name: Generate Report
  run: bash tools/branch-manager.sh report
```

### Local Git Hooks
```bash
#!/bin/bash
# .git/hooks/pre-commit
bash tools/branch-manager.sh validate
bash tools/test-suite.sh
```

### Scheduled Health Checks
```bash
# Run daily at 8 AM
0 8 * * * /workspaces/hsc-jit-v3/tools/test-suite.sh
0 8 * * * /workspaces/hsc-jit-v3/tools/filesystem-inspector.sh
```

---

## Tool Maintenance

Each tool is self-contained and independent. To update:

1. Edit the desired tool script
2. Test changes with `bash tools/SCRIPT.sh`
3. Commit changes to git
4. All developers automatically get updated version on next sync

---

## Getting Started

1. **Check what tools are available:**
   ```bash
   ls -la tools/
   ```

2. **Start with status check:**
   ```bash
   bash tools/branch-manager.sh status
   ```

3. **Run full health check:**
   ```bash
   bash tools/filesystem-inspector.sh
   bash tools/test-suite.sh
   ```

4. **Read individual outputs** to understand project health

---

**Version:** 1.0  
**Last Updated:** January 11, 2026  
**Status:** Production Ready ✅
