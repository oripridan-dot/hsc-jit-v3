#!/bin/bash
# Production deployment startup script for HSC-JIT v3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    log_info "Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    log_warn ".env file not found, using defaults"
    export GEMINI_API_KEY="${GEMINI_API_KEY:-your-api-key-here}"
    export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-changeme}"
fi

# Validate required variables
if [ -z "$GEMINI_API_KEY" ]; then
    log_error "GEMINI_API_KEY not set"
    exit 1
fi

# Create data directories
log_info "Creating data directories..."
mkdir -p backups logs

# Start Docker Compose services
log_info "Starting HSC-JIT services..."
docker-compose up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 10

# Check backend health
log_info "Checking backend health..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:8000/ready &> /dev/null; then
        log_info "Backend is ready"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend failed to become ready"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

# Check frontend health
log_info "Checking frontend health..."
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:5173 &> /dev/null; then
        log_info "Frontend is ready"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        log_warn "Frontend took longer than expected to start"
    fi
    sleep 2
done

# Initialize database (if needed)
log_info "Checking database initialization..."
if ! psql -h localhost -U admin -d hsc_jit -c "SELECT 1" &> /dev/null; then
    log_info "Initializing database schema..."
    # This would run migrations if they exist
fi

# Display status
log_info "==========================================="
log_info "HSC-JIT v3 is running!"
log_info "==========================================="
log_info "Frontend:       http://localhost:5173"
log_info "Backend API:    http://localhost:8000"
log_info "Prometheus:     http://localhost:9090"
log_info "Grafana:        http://localhost:3000"
log_info "Redis Commander: http://localhost:8081"
log_info "PgAdmin:        http://localhost:5050"
log_info "==========================================="

# Show running services
log_info "Running services:"
docker-compose ps

# Tail logs
log_info "Tailing logs (Ctrl+C to stop)..."
docker-compose logs -f
