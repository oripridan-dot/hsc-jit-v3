# Halilit Support Center (HSC) - JIT v3 🚀

**"The Psychic Engine"**

HSC JIT is a real-time, predictive support system that identifies products *while you type* and prefetches official documentation to answer technical questions instantly.

## 🏗️ Architecture: The "Speedboat"

Unlike v2 (which indexed everything in advance), v3 indexes **nothing** until necessary.

1.  **The Map:** ~80 Brand Catalog JSONs containing validated URLs to Manuals/Images.
2.  **The Sniffer:** A WebSocket service that fuzzy-matches user keystrokes against The Map.
3.  **The Reader:** A JIT agent that downloads a PDF, reads it in memory, and answers—all within the time it takes the user to finish typing.

## ⚡ Quick Start

1.  **Install:**
	```bash
	pip install -r requirements.txt
	cd frontend && pnpm install
	```

2.  **Run (The Monolith):**
	```bash
	# Terminal 1: Backend
	uvicorn backend.app.main:app --reload
    
	# Terminal 2: Frontend
	cd frontend && pnpm dev
	```

## 📂 Key Directories
- `backend/data/catalogs/`: The Single Source of Truth (JSONs).
- `backend/app/services/sniffer.py`: The predictive logic.
- `backend/app/services/catalog.py`: Catalog loader and in-memory map.
- `backend/app/main.py`: FastAPI app with WebSocket `/ws/predict`.