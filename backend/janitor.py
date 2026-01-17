import os
import sys
from pathlib import Path

# Configuration
ROOT_DIR = Path(__file__).resolve().parent.parent
ALLOWED_ROOT_FILES = {
    "README.md", 
    ".gitignore", 
    ".devcontainer", 
    ".github",
    "janitor.py",
    ".dockerignore",
    ".env",
    ".trivyignore"
}
ALLOWED_ROOT_DIRS = {
    "backend", 
    "frontend", 
    "docs", 
    "archive", 
    ".git",
    ".vscode",
    ".devcontainer",
    ".github"
}

def scan_root_pollution():
    print(f"🧹 Scanning Root Directory: {ROOT_DIR}")
    pollution_found = False
    
    for item in os.listdir(ROOT_DIR):
        # Allow all dotfiles (config files)
        if item.startswith("."):
            continue
            
        if item in ALLOWED_ROOT_FILES or item in ALLOWED_ROOT_DIRS:
            continue
        
        # Check if it's a directory
        if (ROOT_DIR / item).is_dir():
            print(f"❌ UNAUTHORIZED DIRECTORY: {item}")
            pollution_found = True
        else:
            print(f"❌ UNAUTHORIZED FILE: {item}")
            pollution_found = True

    if not pollution_found:
        print("✅ Root directory is clean.")
    else:
        print("\n⚠️  DRIFT DETECTED: Please move unauthorized files to 'archive/' or delete them.")

def check_duplicate_docs():
    print("\n🧹 Scanning for Duplicate Documentation Logic...")
    # Simple heuristic: check if old keywords exist in current doc filenames
    docs_dir = ROOT_DIR / "docs"
    archive_dir = ROOT_DIR / "archive"
    
    # This is a placeholder for more advanced logic
    # For now, just ensure docs/ exists and is populated
    if not docs_dir.exists():
        print("❌ CRITICAL: docs/ directory missing!")
    else:
        print(f"✅ docs/ directory exists with {len(list(docs_dir.glob('**/*.md')))} files.")

if __name__ == "__main__":
    print("------------------------------------------------")
    print("       HSC-JIT V3.7 KEEPER OF PURITY ")
    print("------------------------------------------------")
    scan_root_pollution()
    check_duplicate_docs()
    print("------------------------------------------------")
