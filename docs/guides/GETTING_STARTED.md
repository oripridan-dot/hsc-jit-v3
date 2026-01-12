# Getting Started with HSC-JIT v3

## 🚀 Introduction

HSC-JIT (Just-In-Time) v3 is a production-grade autonomous technical support system. It features a FastAPI backend, React frontend, and uses Redis for state management and caching.

## 🛠️ Prerequisites

*   **Docker & Docker Compose** (Preferred for local dev)
*   **Node.js 18+** & **pnpm**
*   **Python 3.10+**
*   **Redis 6+**

## ⚡ Quick Start (Local Development)

The easiest way to start the system is using the included start script which handles environment setup, dependencies, and concurrent process management.

```bash
# Clone the repository (if you haven't)
# git clone ...

# Navigate to project root
cd /workspaces/hsc-jit-v3

# Run the startup script
./start.sh
```

### What `start.sh` does:
1.  Creates/Activates a Python virtual environment (`.venv`).
2.  Installs backend requirements.
3.  Checks for Redis availability.
4.  Starts Backend (FastAPI) on port **8000**.
5.  Starts Frontend (Vite) on port **5173**.

## 💻 Manual Start

If you prefer to run services in separate terminals:

**Terminal 1: Backend**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start with hot-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2: Frontend**
```bash
cd frontend
pnpm install
pnpm dev
```

## 🧪 Verifying the Installation

1.  **Backend Health Check**:
    Open http://localhost:8000/docs. You should see the Swagger UI.
    
2.  **Frontend Interface**:
    Open http://localhost:5173. You should see the "Zen Search Engine" interface.

3.  **Test Search**:
    Type `Roland` or `Nord` in the search bar. You should see instant predictions.

## 🔧 Troubleshooting

**"Redis Connection Error"**
Ensure Redis is running:
```bash
sudo service redis-server start
# or
docker run -d -p 6379:6379 redis
```

**"Module not found"**
Ensure you have activated the virtual environment: `source .venv/bin/activate`.

## 📚 Next Steps
- Review the [Deployment Guide](../deployment/DEPLOYMENT.md) for production setup.
- Check [Testing Guide](../testing/TESTING_GUIDE.md) for running the test suite.
