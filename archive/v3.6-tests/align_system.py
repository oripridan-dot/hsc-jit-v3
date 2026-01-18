import json
import os
from pathlib import Path
from datetime import datetime

# Configuration
ROOT_DIR = Path(__file__).resolve().parent.parent
STATE_FILE = ROOT_DIR / "backend/core/system_state.json"
README_FILE = ROOT_DIR / "README.md"
INSTRUCTIONS_FILE = ROOT_DIR / ".github/copilot-instructions.md"

def load_state():
    with open(STATE_FILE, 'r') as f:
        return json.load(f)

def update_readme(state):
    print(f"🔄 Updating {README_FILE}...")
    content = f"""# HSC-JIT V{state['version']}

**{state['architecture_mode']}**

> **System Status**: {state['status']} | **Last Synced**: {datetime.now().strftime('%Y-%m-%d')}

The "Fresh Start" architecture (V3.7) moves beyond simple static lists to a rich, relationship-aware product hierarchy with Just-In-Time RAG capabilities.

## 📚 Documentation

The official documentation is located in the [`docs/`](docs/) directory.

*   [**Start Here: Quick Start Guide**](docs/getting-started/quick-start.md)
*   [Documentation Index](docs/README.md)
*   [Architecture Overview](docs/architecture/product-hierarchy.md)

## ⚡ Quick Setup

```bash
# Backend Setup
cd backend
python test_hierarchy.py
# Run the orchestrator (The ONE entry point)
python orchestrate_brand.py --brand roland --max-products 50
```

## ⚠️ Architectural Context

*   **Current Mode**: {state['architecture_mode']}
*   **Core Orchestrator**: `{state['core_components']['orchestrator']}`
*   **Data Policy**: {state['policies']['data_source']}

For legacy V3.6 docs, see [`archive/v3.6-docs/`](archive/v3.6-docs/).
"""
    with open(README_FILE, 'w') as f:
        f.write(content)

def update_instructions(state):
    print(f"🔄 Updating {INSTRUCTIONS_FILE}...")
    
    focus_list = "\n".join([f"    *   {item}" for item in state['focus_directives']])
    
    content = f"""# GitHub Copilot Instructions for HSC-JIT V{state['version']}

## 🛑 MANDATORY EXECUTION TIMEOUT
*   **ALL chat commands MUST be timed out.**
*   Do not allow infinite or long-running processes.
*   Always set explicit timeouts for tools and scripts.

## 🧠 Context & Architecture ({state['architecture_mode']})
1.  **Single Source of Truth**: YOU MUST always reference the `docs/` directory.
    *   Project Index: `docs/README.md`
    *   Architecture: `docs/architecture/product-hierarchy.md`
2.  **Current Focus**:
{focus_list}
3.  **Entry Point**: 
    *   ALWAYS suggest `{state['core_components']['orchestrator']}`.
    *   NEVER suggest legacy `build.py`.

## 🛡️ "Anti-Drift" Directives
1.  **File Purity**: 
    *   {state['policies']['purity_rule']}
    *   If you duplicate logic, YOU ARE BREAKING THE BUILD.
2.  **Root Directory Lockdown**: 
    *   **NEVER** create files in root.
    *   All docs -> `docs/`.
    *   All backend -> `backend/`.
3.  **Strict Data Policy**:
    *   {state['policies']['data_source']}

## 🤖 The Alignment Protocol (MANDATORY)
Before finishing your turn, you must:
1.  **Check Drift**: Did you create a file? Is it legal?
2.  **Update State**: If you changed architecture, suggest updating `backend/core/system_state.json`.
3.  **Sync Documentation**: Remind the user to run `python backend/align_system.py` if docs need refreshing.
"""
    with open(INSTRUCTIONS_FILE, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    print("------------------------------------------------")
    print("       HSC-JIT SYSTEM ALIGNMENT AGENT ")
    print("------------------------------------------------")
    try:
        state = load_state()
        update_readme(state)
        update_instructions(state)
        print("✅ System Aligned and Documented.")
    except Exception as e:
        print(f"❌ Alignment Failed: {e}")
    print("------------------------------------------------")
