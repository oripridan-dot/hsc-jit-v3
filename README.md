# HSC-JIT v3.6 - Static-First Architecture

**Pure static catalog system with zero runtime infrastructure**

## 🎯 What is v3.6?

v3.6 is a complete architectural transformation from API-based (v3.5) to **static-first**:

- ❌ **Removed**: FastAPI, Redis, Celery, WebSockets, databases
- ✅ **Added**: Offline build pipeline, static JSON, instant search
- 🚀 **Result**: Zero infrastructure, <50ms search, instant deploy

## Quick Start

### Build Static Catalogs

```bash
cd backend
python build.py --brand=all
```

**Output**: `frontend/public/data/*.json` (2,026 products across 38 brands)

### Run Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

**Result**: Instant <50ms search with Fuse.js, no backend needed

## Key Features

### 1. Brand Contracts System

Each brand has a contract defining **12 main categories** with subcategories:

- **Boss**: Effects Pedals, Loop Station, Multi-Effects, etc.
- **Roland**: Pianos, Synthesizers, Drums & Percussion, etc.

Products map: `"Blues Driver" → Effects Pedals / Distortion`

### 2. Static JSON Output (2MB total, 2,026 products)

### 3. Instant Search (<50ms with Fuse.js)

## Current Status

✅ **Production Ready - v3.6.0**  
📊 38 brands, 2,026 products  
⚡ <50ms search, $0 infrastructure  
🚀 Deploy in 30 seconds

---

**Documentation**: See [V3.6_STATIC_BUILD_SYSTEM.md](V3.6_STATIC_BUILD_SYSTEM.md)  
**Last Updated**: January 16, 2026
