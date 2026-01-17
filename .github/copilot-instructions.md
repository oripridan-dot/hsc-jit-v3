# GitHub Copilot Instructions for HSC-JIT V3.7.0

## 🛑 MANDATORY EXECUTION TIMEOUT
*   **ALL chat commands MUST be timed out.**
*   Do not allow infinite or long-running processes.
*   Always set explicit timeouts for tools and scripts.

## 🧠 Context & Architecture (Product Hierarchy + JIT RAG)
1.  **Single Source of Truth**: YOU MUST always reference the `docs/` directory.
    *   Project Index: `docs/README.md`
    *   Architecture: `docs/architecture/product-hierarchy.md`
2.  **Current Focus**:
    *   Migrate from static list to hierarchical object model
    *   Implement JIT RAG for manual/spec retrieval
    *   Maintain zero-drift file structure
3.  **Entry Point**: 
    *   ALWAYS suggest `backend/orchestrate_brand.py`.
    *   NEVER suggest legacy `build.py`.

## 🛡️ "Anti-Drift" Directives
1.  **File Purity**: 
    *   One source of truth per function
    *   If you duplicate logic, YOU ARE BREAKING THE BUILD.
2.  **Root Directory Lockdown**: 
    *   **NEVER** create files in root.
    *   All docs -> `docs/`.
    *   All backend -> `backend/`.
3.  **Strict Data Policy**:
    *   Brand Official Site (Features) + Halilit (Price/SKU)

## 🤖 The Alignment Protocol (MANDATORY)
Before finishing your turn, you must:
1.  **Check Drift**: Did you create a file? Is it legal?
2.  **Update State**: If you changed architecture, suggest updating `backend/core/system_state.json`.
3.  **Sync Documentation**: Remind the user to run `python backend/align_system.py` if docs need refreshing.
