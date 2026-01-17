# HSC-JIT V3.7.0

**Product Hierarchy + JIT RAG**

> **System Status**: Active Development | **Last Synced**: 2026-01-17

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

*   **Current Mode**: Product Hierarchy + JIT RAG
*   **Core Orchestrator**: `backend/orchestrate_brand.py`
*   **Data Policy**: Brand Official Site (Features) + Halilit (Price/SKU)

For legacy V3.6 docs, see [`archive/v3.6-docs/`](archive/v3.6-docs/).
