# HSC-JIT v3: Production Architecture Guide

## Overview

This guide covers the production-grade autonomous architecture for HSC-JIT v3 with zero-touch operation, auto-healing, and self-scaling capabilities.

## Quick Start

### Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# Access services:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8000
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3000 (admin/admin)
# - Redis Commander: http://localhost:8081
# - PgAdmin: http://localhost:5050

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

## Architecture Components

### 1. **Redis Pub/Sub** - Stateless WebSocket Scaling
- Multi-instance deployments share state via Redis
- Zero data loss on pod restart
- Horizontal scaling: 1 → 10+ instances

```bash
# Monitor Redis
redis-cli MONITOR
redis-cli INFO stats
```

### 2. **Multi-Layer Cache** - L1 (Memory) → L2 (Redis)
- L1 cache: Fast in-memory LRU
- L2 cache: Persistent Redis with TTL
- Hit rate tracking via Prometheus

### 3. **Celery Background Tasks**
- Async prefetching of PDFs
- Scheduled maintenance (cleanup, reindexing)
- Retry logic with exponential backoff

```bash
# Monitor Celery tasks
celery -A app.core.tasks inspect active
celery -A app.core.tasks inspect stats
```

### 4. **Health Checks & Readiness Probes**
- Kubernetes liveness: `/health`
- Kubernetes readiness: `/ready`
- Automatic pod restart on failure

```bash
# Manual health check
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

## Kubernetes Deployment

### Prerequisites
```bash
# Install kubectl
curl -LO https://dl.k8s.io/release/stable.txt
version=$(cat stable.txt)
curl -LO "https://dl.k8s.io/release/${version}/bin/linux/amd64/kubectl"

# Configure kubeconfig
export KUBECONFIG=~/.kube/config
```

### Deploy to Cluster
```bash
# Create namespace and all resources
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/monitoring.yaml
kubectl apply -f kubernetes/maintenance.yaml

# Verify deployment
kubectl get all -n hsc-jit
kubectl get hpa -n hsc-jit

# Watch rollout
kubectl rollout status deployment/hsc-jit-backend -n hsc-jit
```

### Check Pod Status
```bash
# Get running pods
kubectl get pods -n hsc-jit -w

# Describe pod (troubleshoot)
kubectl describe pod <pod-name> -n hsc-jit

# View logs
kubectl logs <pod-name> -n hsc-jit -f

# Get metrics
kubectl top pods -n hsc-jit
kubectl top nodes
```

### Manual Scaling
```bash
# Scale to N replicas
kubectl scale deployment hsc-jit-backend --replicas=5 -n hsc-jit

# HPA will override if configured
kubectl get hpa -n hsc-jit
```

## Monitoring & Observability

### Prometheus Metrics
```bash
# Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=websocket_active_connections'

# Useful metrics:
# - websocket_active_connections: Current WS connections
# - prediction_latency_seconds: Model prediction time
# - answer_generation_seconds: LLM response time
# - cache_hits_total: Cache hit count
# - background_tasks_active: Running async tasks
```

### Grafana Dashboards
1. Navigate to http://localhost:3000
2. Default credentials: admin/admin
3. Add Prometheus data source:
   - URL: http://prometheus:9090
4. Import dashboard JSON or create custom

**Key Metrics to Monitor:**
- Request latency (P50, P95, P99)
- Error rate (HTTP 5xx)
- Cache hit rate
- Pod restart count
- Memory/CPU usage
- Database connection pool usage

### Structured Logging (JSON)
All logs are JSON-formatted for ELK integration:
```json
{
  "timestamp": "2025-01-11T10:30:45Z",
  "level": "INFO",
  "logger": "app.services.sniffer",
  "message": "Product prediction completed",
  "service": "hsc-jit-backend",
  "product_id": "roland_td27",
  "confidence": 0.95
}
```

Forward logs to ELK:
```bash
# Filebeat config for Kubernetes
kubectl apply -f kubernetes/filebeat.yaml
```

## Backup & Disaster Recovery

### Manual Backup
```bash
# Backup Redis
redis-cli SAVE  # Blocking save
redis-cli BGSAVE  # Background save

# Backup PostgreSQL
pg_dump -h localhost -U admin hsc_jit | gzip > backup.sql.gz

# Use provided script
bash scripts/backup.sh
```

### Automated Backups
Kubernetes CronJob at 2 AM UTC:
```bash
kubectl get cronjobs -n hsc-jit
kubectl describe cronjob backup-job -n hsc-jit
```

### Restore from Backup
```bash
# Restore Redis
bash scripts/restore.sh redis backups/redis-20250111_020000.rdb.gz

# Restore PostgreSQL
bash scripts/restore.sh postgres backups/postgres-20250111_020000.sql.gz
```

## Performance Tuning

### Cache Configuration
```python
# In backend/app/core/cache.py
cache = MultiLayerCache(l1_max_size=2000)  # Increase L1 size for high throughput
```

### Connection Pooling
```python
# In backend/app/core/database.py
pool_size=50,  # Increase for high concurrency
max_overflow=20,  # Burst capacity
```

### Celery Concurrency
```bash
# More workers for task throughput
celery -A app.core.tasks worker --concurrency=8 --pool=prefork
```

## Scaling Checklist

### Vertical Scaling (More CPU/Memory)
```yaml
# In kubernetes/backend-deployment.yaml
resources:
  requests:
    memory: "1Gi"  # Increase from 512Mi
    cpu: "1000m"   # Increase from 500m
```

### Horizontal Scaling (More Pods)
```bash
# Manual scale
kubectl scale deployment hsc-jit-backend --replicas=10 -n hsc-jit

# Auto-scale config (already in deployment)
# Min: 2, Max: 10
# Target: 70% CPU, 80% Memory
```

### Database Connection Issues
```bash
# Check connection pool status
redis-cli INFO stats

# Reduce prefetch parallelism
# In backend/app/core/tasks.py: max_concurrency=4
```

## Troubleshooting

### Pod Not Starting
```bash
kubectl describe pod <pod-name> -n hsc-jit
# Check: image pull, resource limits, Redis connectivity
```

### High Latency
```bash
# Check cache hit rate
curl http://localhost:8000/metrics | grep cache_hits

# Monitor CPU
kubectl top pods -n hsc-jit

# Check Redis memory
redis-cli INFO memory
```

### Pod Restart Loop
```bash
# Check logs
kubectl logs <pod-name> -n hsc-jit --previous

# Common causes:
# 1. OOMKilled: Increase memory limit
# 2. Readiness probe failing: Check Redis connection
# 3. Crash: Check application logs
```

### Memory Leak
```bash
# Monitor memory growth
kubectl top pod <pod-name> -n hsc-jit --containers

# Check cache size
# In app.core.cache: get_cache().get_stats()
```

## Cost Optimization

### Reduce Replicas During Off-Peak
```bash
kubectl scale deployment hsc-jit-backend --replicas=1 -n hsc-jit
# HPA will scale back up automatically
```

### Use Spot Instances
```yaml
# In kubernetes/backend-deployment.yaml
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      preference:
        matchExpressions:
        - key: cloud.google.com/gke-spot
          operator: In
          values:
          - "true"
```

### Resource Limits
- Min replicas: 2 (high availability)
- Max replicas: 10 (cost control)
- Pod memory: 512Mi-1Gi
- Pod CPU: 500m-1000m

## Maintenance Windows

### Zero-Downtime Deployment
```bash
# Rolling update happens automatically
# 1. Old pods receive no new connections
# 2. New pods start and pass readiness checks
# 3. Load balancer switches traffic
# 4. Old pods shut down gracefully (5s PreStop hook)

kubectl set image deployment/hsc-jit-backend backend=hsc-jit-backend:v2 -n hsc-jit
```

### Database Migrations
```bash
# Run migrations before deployment
kubectl run migration --image=hsc-jit-backend:new --command -- python -m alembic upgrade head

# Verify success before rolling out
kubectl logs migration
```

### Cache Warming
```bash
# Pre-warm cache after deployment
curl -X POST http://hsc-jit-backend-service/admin/cache-warm \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Security

### Environment Secrets
```bash
# Create secret from API keys
kubectl create secret generic hsc-jit-secrets \
  --from-literal=GEMINI_API_KEY=<key> \
  --from-literal=GRAFANA_PASSWORD=<pass> \
  -n hsc-jit
```

### Network Policies
```yaml
# Restrict traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: hsc-jit-backend-netpol
  namespace: hsc-jit
spec:
  podSelector:
    matchLabels:
      app: hsc-jit-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: hsc-jit
```

### RBAC
```bash
# Service account with minimal permissions
kubectl create serviceaccount hsc-jit-app -n hsc-jit
```

## Support & Contact

For issues:
1. Check logs: `kubectl logs <pod> -n hsc-jit`
2. Monitor metrics: http://localhost:3000 (Grafana)
3. Check health: http://api.example.com/health

---

**Last Updated:** January 2025  
**Version:** HSC-JIT v3.1  
**Maintainer:** DevOps Team
