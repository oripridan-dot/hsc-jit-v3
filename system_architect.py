import os
import glob
import sys

class SystemArchitect:
    """
    THE MANAGER (v3.0)
    ==================
    Authority Level: Structural Enforcement
    Mandate: Pure Code, Clean Current State (No Archives).
    
    FILE SYSTEM LAWS:
    1. /backend: Only the Core Generator & Services. No scripts/tools.
    2. /frontend: Only Source & Public. No Python.
    3. /docs: Consolidated documentation.
    4. /data: Lives in /frontend/public/data (live, production).
    5. NO VAULT: Remove misplaced files entirely. No archives.
    """

    ROOT_PATH = os.path.dirname(os.path.abspath(__file__))

    def __init__(self):
        self.log_buffer = []
        print(f"🕴️  SYSTEM ARCHITECT v3.0 ONLINE: {self.ROOT_PATH}")

    def log(self, msg):
        print(f"  {msg}")

    def execute_mandate(self):
        """Executes the cleanup and structure enforcement mandate."""
        self.enforce_structure()
        self.consolidate_docs()
        self.purify_codebase()
        self.generate_integrity_report()

    def enforce_structure(self):
        """Enforces the clean directory structure."""
        # 1. Check for Recursive Backend (should not exist)
        nested_be = os.path.join(self.ROOT_PATH, "backend", "backend")
        if os.path.exists(nested_be):
            self.log(f"🔥 ERROR: Recursive Backend detected: {nested_be}")
            self.log("   Please manually remove this directory.")
            return False
        
        self.log("✅ Directory structure is clean.")
        return True

    def consolidate_docs(self):
        """Moves markdown documentation from root to /docs."""
        self.log("📚 Consolidating Documentation...")
        moved_count = 0
        docs_dir = os.path.join(self.ROOT_PATH, "docs")
        
        if not os.path.exists(docs_dir):
            os.makedirs(docs_dir)
            
        for file in os.listdir(self.ROOT_PATH):
            if file.endswith(".md") and file not in ["README.md", "AI_CONTEXT.md"]:
                 src = os.path.join(self.ROOT_PATH, file)
                 dst = os.path.join(docs_dir, file)
                 os.rename(src, dst)
                 self.log(f"  ➡️ Moved {file} to docs/")
                 moved_count += 1
                 
        if moved_count == 0:
            self.log("  ✅ Documentation is consolidated.")

    def purify_codebase(self):
        """Removes misplaced files by extension."""
        self.log("🧹 Purifying File Types...")
        removed_count = 0
        
        # 1. No Python in Frontend
        fe_src = os.path.join(self.ROOT_PATH, "frontend")
        for root, _, files in os.walk(fe_src):
            for file in files:
                if file.endswith(".py"):
                    src = os.path.join(root, file)
                    os.remove(src)
                    self.log(f"  ❌ Removed .py from frontend: {file}")
                    removed_count += 1

        # 2. No JS/TS in Backend root/services (except config)
        be_src = os.path.join(self.ROOT_PATH, "backend")
        for root, dirs, files in os.walk(be_src):
            # Skip node_modules and known safe dirs
            if "node_modules" in root or "__pycache__" in root:
                continue
                
            for file in files:
                if file.endswith((".ts", ".tsx", ".js", ".jsx")) and "json" not in file:
                    src = os.path.join(root, file)
                    os.remove(src)
                    self.log(f"  ❌ Removed .js/ts from backend: {file}")
                    removed_count += 1

        # 3. Clean Root of Temporary/Junk Files
        root_junk_extensions = [".html", ".js"]
        preserved_sh = ["auto_process.sh"]
        
        for file in os.listdir(self.ROOT_PATH):
            full_path = os.path.join(self.ROOT_PATH, file)
            if not os.path.isfile(full_path):
                continue
                
            ext = os.path.splitext(file)[1]
            if ext in root_junk_extensions:
                if file in preserved_sh:
                    continue
                
                # Check if it's a known config file
                if "config" in file or "eslint" in file or "vite" in file:
                    continue
                    
                os.remove(full_path)
                self.log(f"  ❌ Removed root clutter: {file}")
                removed_count += 1
        
        if removed_count == 0:
            self.log("  ✅ Codebase is clean. No misplaced files found.")

    def generate_integrity_report(self):
        """Outputs the state of the union"""
        print("\n📊 PURE CODE STATUS REPORT")
        print("--------------------------")
        
        # Check Critical Paths
        paths = {
            "Core Generator": "backend/forge_backbone.py",
            "Service Layer": "backend/services",
            "Frontend App": "frontend/src",
        }
        
        for name, p in paths.items():
            exists = os.path.exists(os.path.join(self.ROOT_PATH, p))
            status = "✅ ONLINE" if exists else "❌ CRITICAL MISSING"
            print(f"{name:<20} : {status}")

        # Check for junk directories that should NOT exist
        junk_paths = {
            "Recursive Backend": "backend/backend",
            "Node Modules (Root)": "node_modules",
            "Manual Tools": "backend/tools",
        }
        
        print("\n🧹 CLEANLINESS CHECK")
        all_clean = True
        for name, p in junk_paths.items():
            exists = os.path.exists(os.path.join(self.ROOT_PATH, p))
            if exists:
                print(f"  ⚠️  {name:<25} - FOUND (should delete)")
                all_clean = False
            else:
                print(f"  ✅ {name:<25} - clean")
        
        if all_clean:
            print("\n✨ Workspace is clean. No archives. No history. Just code.")
        else:
            print("\n⚠️  Some cleanup needed. Run this script again.")

        # Check Lean Mode Status
        venv_path = os.path.join(self.ROOT_PATH, "backend", "venv")
        no_venv = not os.path.exists(venv_path) and not os.path.exists(os.path.join(self.ROOT_PATH, ".venv"))
        
        print("\n📉 ENVIRONMENT STATUS")
        if no_venv:
            print("  ✅ LEAN MODE: No Python environment (disk efficient)")
            hydra = os.path.join(self.ROOT_PATH, "backend", "hydrate_env.sh")
            if os.path.exists(hydra):
                print("  💧 'hydrate_env.sh' ready for on-demand setup")
        else:
            print("  ⚠️  Heavy environment detected (consider running hydrate_env.sh --clean)")

if __name__ == "__main__":
    arch = SystemArchitect()
    arch.execute_mandate()
