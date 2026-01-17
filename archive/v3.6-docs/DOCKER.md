# HSC JIT v3.6 - Docker Integration Guide (Legacy)

## 🐳 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Git repository cloned

### One-Command Launch

```bash
# Production build (optimized, multi-worker)
docker compose up -d --build

# Development mode (hot reload)
docker compose -f docker-compose.dev.yml up --build
```

## 📋 Configuration

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your keys:

```bash
GEMINI_API_KEY=your-actual-key-here
```

### 2. Build Images

```bash
# Build all services
docker compose build

# Build specific service
docker compose build backend
docker compose build frontend
```

### 3. Start Services

```bash
# Start all services (detached)
docker compose up -d

# Start and view logs
docker compose up

# Start specific services
docker compose up -d backend redis
```

## 🔍 Service Endpoints

| Service         | URL                          | Purpose        |
| --------------- | ---------------------------- | -------------- |
| Frontend        | http://localhost:5173        | React UI       |
| Backend API     | http://localhost:8000        | FastAPI        |
| API Docs        | http://localhost:8000/docs   | Swagger UI     |
| Health Check    | http://localhost:8000/health | Service status |
| Redis           | localhost:6379               | Cache          |
| Postgres        | localhost:5432               | Database       |
| Prometheus      | http://localhost:9090        | Metrics        |
| Grafana         | http://localhost:3000        | Dashboards     |
| Redis Commander | http://localhost:8081        | Redis UI       |
| pgAdmin         | http://localhost:5050        | Postgres UI    |

## 🏗️ Architecture

### Multi-Stage Builds

**Backend Dockerfile:**

- `base`: System dependencies
- `deps`: Python packages (cached layer)
- `production`: Optimized runtime with Sentinel healthcheck

**Frontend Dockerfile:**

- `builder`: Build React app with Vite
- `production`: Nginx serving static files

### Health Checks

- **Backend:** Sentinel script validates data integrity every 5 minutes
- **Frontend:** Nginx HTTP probe
- **Redis:** `redis-cli ping`
- **Postgres:** `pg_isready`

## 📦 Development vs Production

### Development Mode (`docker-compose.dev.yml`)

- Hot reload enabled
- Volume mounts for live code changes
- Single worker processes
- Debug logging

```bash
docker compose -f docker-compose.dev.yml up
```

### Production Mode (`docker-compose.yml`)

- Optimized builds
- Multi-worker processes (4 uvicorn workers)
- No volume mounts
- Nginx for frontend
- Health checks enabled

```bash
docker compose up -d --build
```

## 🔧 Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### Stop Services

```bash
# Stop all (preserves containers)
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes
docker compose down -v
```

### Execute Commands in Containers

```bash
# Backend shell
docker compose exec backend bash

# Run tests
docker compose exec backend pytest tests/ -v

# Run Sentinel manually
docker compose exec backend python3 scripts/sentinel.py

# Frontend shell
docker compose exec frontend sh

# Redis CLI
docker compose exec redis redis-cli
```

### Rebuild After Changes

```bash
# Rebuild and restart
docker compose up -d --build

# Force rebuild (no cache)
docker compose build --no-cache
docker compose up -d
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs backend

# Check if port is in use
lsof -i :8000
lsof -i :5173

# Remove old containers
docker compose down
docker compose up -d
```

### Backend Health Check Failing

```bash
# Check Sentinel output
docker compose exec backend python3 scripts/sentinel.py

# View health status
curl http://localhost:8000/health | jq

# Check system_health.json
docker compose exec backend cat app/static/system_health.json
```

### Database Connection Issues

```bash
# Check Postgres is healthy
docker compose ps postgres

# Connect to database
docker compose exec postgres psql -U admin -d hsc_jit

# Reset database
docker compose down -v
docker compose up -d postgres
```

### Redis Connection Issues

```bash
# Test Redis
docker compose exec redis redis-cli ping

# Monitor Redis
docker compose exec redis redis-cli monitor
```

### Out of Memory

```bash
# Check resource usage
docker stats

# Increase Docker Desktop memory:
# Settings → Resources → Memory (recommend 8GB+)
```

## 📊 Monitoring

### Prometheus Metrics

```bash
# Access Prometheus
open http://localhost:9090

# Query examples:
# - Rate of WebSocket messages: rate(messages_processed_total[1m])
# - Active connections: websocket_active_connections
# - Memory usage: process_resident_memory_bytes
```

### Grafana Dashboards

```bash
# Access Grafana
open http://localhost:3000
# Default: admin / admin

# Add Prometheus datasource:
# URL: http://prometheus:9090
```

## 🔒 Security Notes

- Backend runs as non-root user (`appuser`)
- Minimal base images (alpine/slim)
- No dev dependencies in production
- Health checks enforce data integrity via Sentinel
- Environment variables for secrets (never commit `.env`)

## 🚀 Production Deployment

### Using Docker Compose

```bash
# Set production env vars
export GEMINI_API_KEY=prod-key
export POSTGRES_PASSWORD=secure-password

# Deploy
docker compose -f docker-compose.yml up -d --build
```

### Using Docker Swarm

```bash
docker stack deploy -c docker-compose.yml hsc-jit
```

### Using Kubernetes

```bash
kubectl apply -f kubernetes/
```

## 📝 Best Practices

1. **Always use `.env` for secrets** - Never commit keys
2. **Use `docker compose down -v` cautiously** - Deletes all data
3. **Monitor logs** - Check for errors after deploy
4. **Health checks** - Ensure passing before routing traffic
5. **Resource limits** - Set in production (`deploy.resources`)
6. **Backup volumes** - Before major changes

## 🔗 Related Scripts

- `./run-docker.sh` - One-command launcher (auto-detects Compose)
- `./start-production.sh` - Full production startup with health checks
- `./start.sh` - Local dev without Docker

---

**Version:** 3.4  
**Last Updated:** January 2026  
**Status:** ✅ Production Ready
