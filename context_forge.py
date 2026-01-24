import os
import json
import subprocess
import re
from datetime import datetime
import glob

class ContextForge:
    """
    CONTEXT FORGE v3.0 (Live Injector)
    ==================================
    1. Generates deep-scan AI Context files.
    2. Injects live data into README.md.
    3. Injects live data into Copilot Instructions.
    4. Assembles MASTER AI_CONTEXT.md.
    
    Ensures 100% Alignment across documentation and reality.
    """
    
    ROOT_PATH = os.path.dirname(os.path.abspath(__file__))
    OUTPUT_DIR = os.path.join(ROOT_PATH, "docs", "context")
    
    def __init__(self):
        if not os.path.exists(self.OUTPUT_DIR):
            os.makedirs(self.OUTPUT_DIR)
        print(f"🧠 CONTEXT FORGE v3.0 ONLINE. Outputting to: {self.OUTPUT_DIR}")

    def run(self):
        # 1. Gather Intelligence
        version, branch, commit, msg = self.get_system_stats()
        
        # 2. Update Live Docs (Live Injection)
        self.inject_readme(version, branch)
        self.inject_copilot_instructions(version)
        
        # 3. Generate Briefings
        self.generate_identity_and_manifest(version, branch, commit, msg)
        self.generate_backend_pipeline()
        self.generate_frontend_architecture()
        self.generate_design_system()
        self.generate_workflows()
        
        # 4. Assemble Master
        self.assemble_master_file()
        print("✅ System Fully Synced & Documented.")

    def get_system_stats(self):
        # Git
        try:
            branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"]).decode().strip()
            commit = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"]).decode().strip()
            msg = subprocess.check_output(["git", "log", "-1", "--pretty=%B"]).decode().strip()
        except:
            branch, commit, msg = "unknown", "unknown", "unknown"
            
        # Version
        try:
            with open(os.path.join(self.ROOT_PATH, "frontend", "package.json")) as f:
                pkg = json.load(f)
                version = pkg.get("version", "0.0.0")
        except:
            version = "unknown"
            
        return version, branch, commit, msg

    def inject_readme(self, version, branch):
        readme_path = os.path.join(self.ROOT_PATH, "README.md")
        if not os.path.exists(readme_path):
            return

        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Update Version/Branch Status Line
        # Matches: **Status**: ... | Branch: `...` | Frontend: `...`
        new_status = f"**Status**: 🟢 **ACTIVE** | Branch: `{branch}` | Frontend: `{version}`"
        # We look for the pattern starting with **Status**: and ending with newline
        content = re.sub(r"\*\*Status\*\*:.*", new_status, content)
        
        # Update Header Version
        # Matches: # HSC-JIT v... - 
        content = re.sub(r"# HSC-JIT v[\d\.]+ -", f"# HSC-JIT v{version} -", content)
        
        # Update Last Updated Footer (if exists pattern)
        date_str = datetime.now().strftime("%B %d, %Y")
        content = re.sub(r"\*\*Last Updated\*\*: .*", f"**Last Updated**: {date_str}", content)
        content = re.sub(r"\*\*Version\*\*: .*", f"**Version**: {version}", content)

        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("  💉 Injected live stats into README.md")

    def inject_copilot_instructions(self, version):
        copilot_path = os.path.join(self.ROOT_PATH, ".github", "copilot-instructions.md")
        if not os.path.exists(copilot_path):
            return

        with open(copilot_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Update Title
        content = re.sub(r"# HSC-JIT v[\d\.]+ -", f"# HSC-JIT v{version} -", content)
        
        # Update Footer Stats
        date_str = datetime.now().strftime("%B %Y")
        content = re.sub(r"\*\*Last Updated:\*\* .*", f"**Last Updated:** {date_str}", content)
        content = re.sub(r"\*\*Version:\*\* .*", f"**Version:** {version}", content)

        with open(copilot_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("  💉 Injected live stats into copilot-instructions.md")

    def write_file(self, filename, content):
        with open(os.path.join(self.OUTPUT_DIR, filename), "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ➡️ Generated {filename}")

    def scan_directory(self, relative_path, extensions=None):
        files_list = []
        abs_path = os.path.join(self.ROOT_PATH, relative_path)
        if not os.path.exists(abs_path):
            return []
            
        for root, _, files in os.walk(abs_path):
            if "__pycache__" in root or "node_modules" in root:
                continue
            for file in files:
                if extensions and not file.endswith(tuple(extensions)):
                    continue
                rel_file = os.path.relpath(os.path.join(root, file), self.ROOT_PATH)
                files_list.append(rel_file)
        return sorted(files_list)

    def generate_identity_and_manifest(self, version, branch, commit, msg):
        # Full System Scan
        all_files = []
        for root, dirs, files in os.walk(self.ROOT_PATH):
            if any(x in root for x in ["node_modules", ".git", "__pycache__", "venv", ".idea", ".vscode"]):
                continue
            for file in files:
                if file.endswith((".pyc", ".DS_Store")): 
                    continue
                path = os.path.relpath(os.path.join(root, file), self.ROOT_PATH)
                all_files.append(path)
        
        all_files.sort()
        
        content = f"""# 🆔 01_PROJECT_IDENTITY.md

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📌 Status
- **Project:** HSC-JIT v3
- **Version:** {version}
- **Branch:** `{branch}`
- **Commit:** `{commit}`
- **Last Message:** {msg}
- **Total Files Tracked:** {len(all_files)}

## 🎯 Primary Directive
This project is a **STATIC** Single Page Application.
There is **NO runtime backend**. All data is pre-generated JSON.

## 🗺️ COMPLETE SYSTEM MANIFEST
Every file in the repository (excluding git/node_modules):

{chr(10).join([f'- `{f}`' for f in all_files])}
"""
        self.write_file("01_PROJECT_IDENTITY.md", content)

    def generate_backend_pipeline(self):
        backend_files = self.scan_directory("backend", [".py"])
        services = [f for f in backend_files if "services/" in f]
        models = [f for f in backend_files if "models/" in f]
        core = [f for f in backend_files if f not in services and f not in models]
        
        data_dir = os.path.join(self.ROOT_PATH, "frontend", "public", "data")
        json_files = glob.glob(os.path.join(data_dir, "*.json"))
        json_list = sorted([os.path.basename(f) for f in json_files])

        content = f"""# ⚙️ 02_BACKEND_PIPELINE.md

**Role:** Offline Data Generation
**Execution:** `python3 forge_backbone.py`

## 🏭 The Factory Structure
The backend is strictly for offline data generation. It contains:

### 🧠 Core Generators
{chr(10).join([f'- `{f}`' for f in core])}

### 🤖 Services & Scrapers
{chr(10).join([f'- `{f}`' for f in services])}

### 📦 Data Models
{chr(10).join([f'- `{f}`' for f in models])}

## 📄 Published Production Catalogs
These files are the ONLY source of truth for the frontend:
{chr(10).join([f'- `{j}`' for j in json_list])}

## ⚠️ Rules
- The backend is **NOT** deployed.
- `main.py` is for DEV validation only.
- Frontend MUST read from JSON files, NEVER from localhost API.
"""
        self.write_file("02_BACKEND_PIPELINE.md", content)

    def generate_frontend_architecture(self):
        components = self.scan_directory("frontend/src/components", [".tsx"])
        hooks = self.scan_directory("frontend/src/hooks", [".ts", ".tsx"])
        lib = self.scan_directory("frontend/src/lib", [".ts"])
        store = self.scan_directory("frontend/src/store", [".ts"])
        
        content = f"""# ⚛️ 03_FRONTEND_ARCHITECTURE.md

**Framework:** React 19 + TypeScript + Vite
**State:** Zustand
**Styling:** Tailwind CSS

## 🏛️ Core Architecture ("Static Logic")

### 1. Data Loading (`src/lib/catalogLoader.ts`)
- Fetches static JSON files from `/data/`
- Types data with Zod schemas
- **Pattern:** Load once -> Store in State

### 2. State Management (`src/store/navigationStore.ts`)
- Holds `products`, `activeCategory`, `searchQuery`
- **Pattern:** Single Source of Truth for Navigation

## 🧩 Component Registry
### UI Components
{chr(10).join([f'- `{f}`' for f in components])}

### Logic Hooks
{chr(10).join([f'- `{f}`' for f in hooks])}

### Core Libraries
{chr(10).join([f'- `{f}`' for f in lib])}

### State Stores
{chr(10).join([f'- `{f}`' for f in store])}

## 📡 Connectivity Rules
- **NO** WebSockets
- **NO** REST API Calls to Backend
- **NO** Server-Side Rendering
"""
        self.write_file("03_FRONTEND_ARCHITECTURE.md", content)

    def generate_design_system(self):
        css_file = os.path.join(self.ROOT_PATH, "frontend", "src", "index.css")
        colors = []
        try:
            with open(css_file) as f:
                for line in f:
                    if "--c-" in line:
                         colors.append(line.strip())
        except:
            pass

        content = f"""# 🎨 04_DESIGN_SYSTEM.md

**Philosophy:** "See Then Read" - Visual First.

## 🌈 Color Palette (Category Anchors)
The application uses a strict color coding system for the 8 main categories.

```css
{chr(10).join(colors[:20])}
...
```

## 📐 Layout Principles
1. **Navigator (Left)**: Fixed interaction point.
2. **Workbench (Center)**: Dynamic content area.
3. **MediaDeck (Bottom)**: Persistent tool control.

## 🖼️ Visual Factory
All product images are processed offline into high-quality WebP with removed backgrounds.
- Source: `backend/visual_factory.py`
- Output: `frontend/public/data/product_images/`
"""
        self.write_file("04_DESIGN_SYSTEM.md", content)

    def generate_workflows(self):
        content = """# 🛠️ 05_WORKFLOWS.md

## 🔄 Daily Dev Cycle

### 1. Start Environment
```bash
cd frontend
pnpm dev
```

### 2. Update Data (If Scrapers Changed)
```bash
cd backend
python3 forge_backbone.py
# Verify check:
# python3 system_architect.py
```

### 3. Deployment Build
```bash
cd frontend
pnpm build
# Upload 'dist/' folder to host
```

## 🚨 Troubleshooting
- **Missing Images?** Run `forge_backbone.py` to trigger Visual Factory.
- **Type Errors?** Run `npx tsc --noEmit` in frontend.
- **Stale Data?** Clear browser cache or run `window.__hscdev.clearCache()`.
"""
        self.write_file("05_WORKFLOWS.md", content)

    def assemble_master_file(self):
        master_path = os.path.join(self.ROOT_PATH, "AI_CONTEXT.md")
        content = "# 🧠 MASTER AI CONTEXT\n\n"
        content += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        content += "> ⚠️ DO NOT EDIT. Autogenerated by `context_forge.py`.\n"
        content += "> This file aggregates all context briefings from `docs/context/` for single-file injection.\n\n"
        
        for filename in sorted(os.listdir(self.OUTPUT_DIR)):
            if filename.endswith(".md"):
                with open(os.path.join(self.OUTPUT_DIR, filename), "r", encoding="utf-8") as f:
                     content += f"\n\n---\n\n{f.read()}"
        
        with open(master_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  💎 Generated MASTER CONTEXT: AI_CONTEXT.md (Root)")

if __name__ == "__main__":
    forge = ContextForge()
    forge.run()
