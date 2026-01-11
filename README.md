# Halilit Support Center (HSC) - JIT v3 🚀

**"The Psychic Engine"**

HSC JIT is a real-time, predictive support system that identifies products *while you type* and prefetches official documentation to answer technical questions instantly.

## 🏗️ Architecture: The "Speedboat"

Unlike v2 (which indexed everything in advance), v3 indexes **nothing** until necessary.

1.  **The Map:** ~80 Brand Catalog JSONs containing validated URLs to Manuals/Images.
2.  **The Sniffer:** A WebSocket service that fuzzy-matches user keystrokes against The Map.
3.  **The Reader:** A JIT agent that downloads a PDF, reads it in memory, and answers—all within the time it takes the user to finish typing.

## ⚡ Quick Start

### Prerequisites
- **Redis** must be running: `redis-server` (or `redis-cli ping` to verify)
- **Python 3.9+** with `pip`
- **Node.js + pnpm** for the frontend

### 1. Install Dependencies

```bash
# Install Python backend dependencies
pip install -r requirements.txt

# Install JavaScript frontend dependencies
cd frontend && pnpm install
```

### 2. Configure Environment

Create/update `.env` in the project root:

```bash
# .env
GEMINI_API_KEY=your_api_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Start the Application

**Option A: Using the startup script (recommended)**
```bash
./start.sh
```

**Option B: Manual (two terminals)**

Terminal 1 — Backend:
```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2 — Frontend:
```bash
cd frontend && pnpm dev
```

### 4. Access the App

- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs
- **WebSocket Endpoint:** ws://localhost:8000/ws

## 📂 Key Directories
- `backend/data/catalogs/`: The Single Source of Truth (JSON product catalogs).
- `backend/app/services/sniffer.py`: Fuzzy-matching engine for product predictions.
- `backend/app/services/catalog.py`: Loads and indexes all product data.
- `backend/app/services/fetcher.py`: Downloads and caches PDF/HTML manuals.
- `backend/app/services/rag.py`: Ephemeral embeddings & semantic retrieval.
- `backend/app/services/llm.py`: Google Gemini integration for answer generation.
- `backend/app/main.py`: FastAPI app with WebSocket `/ws` endpoint.
- `frontend/src/store/useWebSocketStore.ts`: State management for real-time predictions & chat.
- `frontend/src/components/ChatView.tsx`: Main UI for live answers.

## 🔧 Troubleshooting

### Backend won't start
- Ensure Redis is running: `redis-cli ping`
- Check port 8000 is free: `lsof -i :8000`
- View logs: `tail -f /tmp/hsc-backend.log`

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:8000/docs`
- Check WebSocket proxy in `frontend/vite.config.ts`
- Browser console (F12) shows connection errors

### Gemini API errors
- Ensure `GEMINI_API_KEY` is set in `.env`
- Update to `google-genai` package instead of deprecated `google-generativeai` (optional)

## 📋 System Architecture

### Data Flow
```
User Types → Frontend sends "typing" event → 
WebSocket → Backend SnifferService (fuzzy match) → 
Predicts product & sends back → 
Frontend shows prediction.

User Locks Selection → "query" event with product_id & question →
Backend fetches manual (ContentFetcher) →
RAG indexes & retrieves relevant chunks (EphemeralRAG) →
Gemini generates streaming answer (LLM) →
Frontend displays answer chunks.
```

### Key Components

| Service | Purpose | Stack |
|---------|---------|-------|
| **SnifferService** | Predicts products from partial text | TheFuzz (fuzzy matching) |
| **CatalogService** | Loads ~80 brand JSON files into memory | Python dicts |
| **ContentFetcher** | Async downloads & caches manuals | HTTPX, PyMuPDF, BeautifulSoup |
| **EphemeralRAG** | Chunks, embeds, retrieves relevant context | SentenceTransformers, Redis |
| **GeminiService** | Generates answers with context | Google Generative AI |

### Technology Stack
- **Backend:** FastAPI + Uvicorn + Redis
- **Frontend:** React + Vite + Tailwind + Zustand
- **ML/AI:** SentenceTransformers, TheFuzz, Google Gemini API