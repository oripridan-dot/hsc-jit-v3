#!/bin/bash
# HSC JIT v3 - Startup Script
# Run both backend and frontend servers concurrently

set -e

echo "🚀 Starting HSC JIT v3 - The Psychic Engine"
echo ""

# Check Redis
echo "✓ Checking Redis..."
redis-cli ping > /dev/null 2>&1 || (echo "❌ Redis not running. Start with: redis-server"; exit 1)

# Kill any existing processes on ports
echo "✓ Cleaning up old processes..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend in background
echo "✓ Starting Backend (FastAPI) on port 8000..."
cd backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/hsc-backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Verify backend
if ! kill -0 $BACKEND_PID 2>/dev/null; then
  echo "❌ Backend failed to start. Check /tmp/hsc-backend.log"
  cat /tmp/hsc-backend.log
  exit 1
fi
echo "  Backend PID: $BACKEND_PID"

# Start frontend in background
cd ../frontend
echo "✓ Starting Frontend (Vite) on port 5173..."
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

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ HSC JIT v3 is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔌 API:     http://localhost:8000"
echo "📖 Docs:    http://localhost:8000/docs"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "Logs:"
echo "  Backend:  tail -f /tmp/hsc-backend.log"
echo "  Frontend: tail -f /tmp/hsc-frontend.log"
echo ""

# Wait for both processes
wait
