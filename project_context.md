# 🧠 Project Memory & Context (The "Bible")

## 1. Current Goal (Update this daily!)
* **Focus:** Finalizing v3.7 JIT RAG System & Hierarchy-Aware Scraper.
* **Active Branch:** v3.7-dev
* **Last Big Change:** Aligned workspace to v3.7 architecture (JIT RAG, Product Hierarchy).

## 2. The "No-Go" Zone (Rules)
* Do not change the `backend/core` logic without asking.
* Always use English for code comments, but Hebrew is okay for user prompts.
* Never delete the 'docs' folder.

## 3. Architecture Shortcut
* **Frontend:** React + Vite (`frontend/`)
* **Backend:** Python + FastAPI (`backend/`)
* **Key Logic:** 
    * `backend/services/jit_rag.py` (JIT RAG System)
    * `backend/services/hierarchy_scraper.py` (Product Hierarchy)
    * `backend/models/product_hierarchy.py` (Data Models)
