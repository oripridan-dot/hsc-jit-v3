# Development Policy & Anti-Drift Standards

## 🎯 The "One of a Kind" Rule
To prevent codebase drift, every function must exist in exactly one place.

*   **One Orchestrator**: `backend/orchestrate_brand.py` is the ONLY entry point for data processing.
*   **One Doc Source**: `docs/` is the ONLY place for documentation. Root `.md` files are forbidden (except README.md).
*   **One Build System**: Static JSONs are generated solely by the orchestration pipeline, not by ad-hoc scripts.

## 🚫 Forbidden Patterns (Drift Triggers)
1.  **Root Clutter**: 
    *   Do not create `test.py`, `temp.json`, or `notes.md` in the root.
    *   Use `backend/logs/` or ignored scratchpads for temporary work.
2.  **Legacy Resurrection**:
    *   Do not re-implement features found in `archive/`. Check `archive/` to ensure you aren't rebuilding the past.
3.  **Bypassing the Hierarchy**:
    *   All products must be processed through the `ProductHierarchy` class. Flat scraping is banned.

## 🧹 Maintenance Workflow
1.  **Daily**: Run `python backend/janitor.py` (Script to be created) to scan for unauthorized files.
2.  **Weekly**: Review `docs/architecture/` to ensure code matches documentation.
3.  **On Change**: If you change a core process, you MUST update the corresponding file in `docs/architecture/` immediately.
