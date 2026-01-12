# HSC-JIT v3: Production Deployment Guide

> **Zero-touch operation. Self-healing infrastructure. Enterprise reliability.**

This comprehensive guide covers the architecture, deployment procedures, and operational checklist for the HSC-JIT v3 system.

---

## 🏗️ Architecture Overview

The system uses a production-grade autonomous architecture designed for scalability and resilience.

### Core Components
1.  **Redis Pub/Sub (State Management)**
    *   Stateless WebSocket scaling using Redis as a message bus.
    *   Enables multi-instance deployments sharing state immediately.
    *   Zero data loss on pod restarts.
2.  **Multi-Layer Caching**
    *   **L1 (Memory):** Fast in-memory LRU cache for millisecond access.
    *   **L2 (Redis):** Persistent, shared Redis cache with TTLs.
    *   Automated hit rate tracking via Prometheus.
3.  **Celery Background Tasks**
    *   Asynchronous fetching of heavy assets (PDFs).
    *   Scheduled maintenance (cache cleanup, index optimization).
4.  **Health & Recovery**
    *   Kubernetes Liveness probes (`/health`) and Readiness probes (`/ready`).
    *   Automatic pod restart on failure.
    *   HPA (Horizontal Pod Autoscaler) based on CPU/Memory.

---

## 🚀 Quick Start (Local & Dev)

### Docker Compose
For local development or simple deployments:

```bash
# 1. Start all services
docker-compose up -d

# 2. Access points
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090

# 3. View Logs
docker-compose logs -f backend

# 4. Stop
docker-compose down
```

---

## ☸️ Kubernetes Deployment

### Prerequisites
*   `kubectl` installed and configured.
*   Access to a Kubernetes cluster (Cloud or Minikube).
*   Docker registry access for pulling images.

### 1. Preparation
```bash
# Create namespace
kubectl create namespace hsc-jit

# Create secrets (if not using Secret Store)
kubectl create secret generic hsc-secrets \
  --from-literal=redis-url=redis://... \
  --from-literal=gemini-key=... \
  -n hsc-jit
```

### 2. Deploy Manifests
```bash
# Deploy core backend and HPA
kubectl apply -f kubernetes/backend-deployment.yaml

# Deploy monitoring stack (Prometheus/Grafana)
kubectl apply -f kubernetes/monitoring.yaml

# Deploy maintenance jobs (CronJobs)
kubectl apply -f kubernetes/maintenance.yaml
```

### 3. Verification
```bash
# Check Pods
kubectl get pods -n hsc-jit

# Watch Rollout status
kubectl rollout status deployment/hsc-jit-backend -n hsc-jit

# Check Logs
kubectl logs -f -l app=hsc-jit-backend -n hsc-jit
```

---

## ✅ Production Checklist

### Pre-Deployment (T-Minus 1 Week)
- [ ] **Code**: All tests passing, lints clean, code reviewed.
- [ ] **Security**: Image scan (Trivy/Snyk) clean, dependencies updated.
- [ ] **Load Test**: Validated for 100+ concurrent users (Locust/K6).
- [ ] **Infra**: Cluster provisioned, Ingress configured, TLS certs ready.
- [ ] **Access**: DNS updated, Secrets configured in vault/k8s.

### Deployment Day (T-Hour)
- [ ] **Pre-Flight**: Verify cluster health `kubectl get nodes`.
- [ ] **Disk Space**: Ensure >10GB free for logs/metrics.
- [ ] **Backups**: Trigger pre-migration backup of Redis/SQL.
- [ ] **Migration**: Run schema migrations if applicable.
- [ ] **Rollout**: Apply manifests `kubectl apply -f kubernetes/`.

### Post-Deployment Verification
- [ ] **Health**: `curl http://api.link/health` returns 200 OK.
- [ ] **Frontend**: Main UI loads, search functions correctly.
- [ ] **Latency**: API response time < 200ms (check Grafana).
- [ ] **Logs**: No error spikes in `kubectl logs`.

---

## 🚨 Troubleshooting & Operations

### Common Commands
```bash
# Restart Backend Pods
kubectl rollout restart deployment/hsc-jit-backend -n hsc-jit

# Check Celery Queue
celery -A app.core.tasks inspect active

# Flush Cache
redis-cli FLUSHDB
```

### Monitoring
*   **Grafana**: Check "HSC-JIT Overview" dashboard for 500 errors or latency spikes.
*   **Prometheus**: Query `http_requests_total` for raw metrics.

For detailed runbooks, refer to `docs/operations/RUNBOOK.md`.
