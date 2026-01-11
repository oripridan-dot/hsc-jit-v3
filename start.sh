#!/bin/bash
# HSC JIT v3 - Startup Script
# Run both backend and frontend servers concurrently

echo "🚀 Starting HSC JIT v3 - The Psychic Engine"
echo ""

# Ensure we're in the repo root
cd "$(dirname "$0")"
REPO_ROOT="$(pwd)"

# Activate venv for all subsequent commands
echo "✓ Activating Python venv..."
if [ ! -d ".venv" ]; then
  echo "⚠️ .venv not found. Creating fresh venv..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install --upgrade pip setuptools wheel > /dev/null 2>&1
  pip install -r requirements.txt > /dev/null 2>&1
else
  source .venv/bin/activate
fi
echo "  Using Python: $(which python)"

# Check Redis (optional)
echo "✓ Checking Redis..."
if command -v redis-cli >/dev/null 2>&1; then
  if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️ Redis not responding. Backend will run without cache."
  else
    echo "  Redis OK"
  fi
else
  echo "⚠️ redis-cli not found. Skipping Redis check."
fi

# Kill any existing processes on ports
echo "✓ Cleaning up old processes..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend in background
echo "✓ Starting Backend (FastAPI) on port 8000..."
cd "$REPO_ROOT/backend"
# Use activated venv python (already on PATH after source .venv/bin/activate)
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/hsc-backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Verify backend
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "❌ Backend failed to start. Check /tmp/hsc-backend.log"
  cat /tmp/hsc-backend.log
  exit 1
fi
echo "  Backend PID: $BACKEND_PID"

# Start frontend in background (if pnpm is available)
cd "$REPO_ROOT/frontend"
echo "✓ Starting Frontend (Vite) on port 5173..."
if command -v pnpm >/dev/null 2>&1; then
  nohup pnpm dev > /tmp/hsc-frontend.log 2>&1 &
  FRONTEND_PID=$!
  sleep 3
  # Verify frontend
  if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check /tmp/hsc-frontend.log"
    cat /tmp/hsc-frontend.log
    exit 1
  fi
  echo "  Frontend PID: $FRONTEND_PID"
else
  echo "⚠️ pnpm not found. Skipping frontend start."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ HSC JIT v3 is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔌 API:     http://localhost:8000"
echo "📖 Docs:    http://localhost:8000/docs"
echo ""
echo "To stop: kill $BACKEND_PID ${FRONTEND_PID:-}" 
echo "Logs:"
echo "  Backend:  tail -f /tmp/hsc-backend.log"
echo "  Frontend: tail -f /tmp/hsc-frontend.log"
echo ""
echo "✅ All services started. Ready for development!"
echo ""

# Keep script running with auto-restart (servers run in background)
while true; do
  sleep 60
  # Check if servers are still running
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "⚠️ Backend died. Restarting..."
    cd "$REPO_ROOT/backend"
    nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/hsc-backend.log 2>&1 &
    BACKEND_PID=$!
  fi
  if [ -n "$FRONTEND_PID" ] && ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "⚠️ Frontend died. Restarting..."
    cd "$REPO_ROOT/frontend"
    nohup pnpm dev > /tmp/hsc-frontend.log 2>&1 &
    FRONTEND_PID=$!
  fi
done
