# HSC JIT v3 - System Instructions

## Core Philosophy: "The Psychic Engine"
We are building a Just-In-Time (JIT) Technical Support System.
1.  **Zero Latency:** We predict intent while the user types.
2.  **No Persistent Vector DB:** We download and read manuals *on demand*.
3.  **Event-Driven:** The frontend and backend communicate via WebSocket streams, not REST APIs.

## Architectural Rules
1.  **The "Map" is King:** All truth comes from `backend/data/catalogs/`. We never guess URLs.
2.  **Ephemeral State:** Use Redis for caching session data. Do not use SQLite or Postgres.
3.  **The "Sniffer":** The backend must implement a fuzzy-matching service that listens to keystrokes.
4.  **Cinematic UI:** Responses are not text blocks; they are JSON events (`show_image`, `status_update`, `final_answer`).

## Tech Stack
- **Backend:** FastAPI (WebSockets), TheFuzz (Matching), HTTPX (Async Fetch).
- **Frontend:** React + Vite + Tailwind (Glassmorphism).
- **Data:** JSON Files (Catalogs) + Redis (Hot Cache).
