# HSC-JIT v3: Operations Quick Reference

## 🚨 Common Issues & Fixes

### Pod Not Starting

**Symptom:** Pod stuck in `Pending` or `CrashLoopBackOff`

```bash
# 1. Check pod status
kubectl describe pod <pod-name> -n hsc-jit

# 2. Check logs
kubectl logs <pod-name> -n hsc-jit --previous

# 3. Common causes & fixes:

# Issue: Image not found
# Fix: Push new image to registry
docker push ghcr.io/oripridan-dot/hsc-jit-backend:latest

# Issue: CrashLoopBackOff
# Fix: Check Redis connectivity
redis-cli -h redis-service.hsc-jit PING
# Should return: PONG

# Issue: Out of Memory (OOMKilled)
# Fix: Increase memory limit or scale down load
kubectl patch deployment hsc-jit-backend -n hsc-jit \
  -p '{"spec": {"template": {"spec": {"containers": [{"name": "backend", "resources": {"limits": {"memory": "1500Mi"}}}]}}}}'

# Issue: Readiness probe failing
# Fix: Check if backend is actually ready
kubectl port-forward <pod-name> 8000:8000 -n hsc-jit
curl http://localhost:8000/ready
```

### High Latency

**Symptom:** Prediction taking > 500ms, user complaints

```bash
# 1. Check cache hit rate
curl 'http://prometheus:9090/api/v1/query?query=cache_hits_total'

# Low hit rate? Increase cache TTL
# In backend/app/core/cache.py: @cached(ttl=3600)

# 2. Check CPU usage
kubectl top pods -n hsc-jit
# If > 80%: Scale up more replicas

# 3. Check Redis latency
redis-cli --latency-history

# High Redis latency? 
# - Check memory: redis-cli INFO memory
# - Check connections: redis-cli INFO clients
# - Restart Redis if necessary: kubectl delete pod redis-0 -n hsc-jit

# 4. Check database connection pool
# In backend logs: Look for "pool exhausted"
# Fix: Increase pool_size in backend/app/core/database.py
```

### Memory Leaks

**Symptom:** Memory usage slowly increases, pod OOMKilled

```bash
# 1. Monitor memory trend
kubectl top pod <pod-name> -n hsc-jit --containers
# Watch for steady increase

# 2. Check cache size
# In app, call: cache.get_stats()
# If L1 size > 1000: May be evicting too slowly

# 3. Check for unclosed connections
# Look for "No pool slots available" errors

# Fix options:
# A. Restart pod (short-term)
kubectl delete pod <pod-name> -n hsc-jit

# B. Lower cache size (if too aggressive)
# In backend/app/core/cache.py: MultiLayerCache(l1_max_size=500)

# C. Increase memory limit (if legitimate usage)
kubectl set resources deployment hsc-jit-backend \
  --limits=memory=2Gi -n hsc-jit
```

### WebSocket Disconnections

**Symptom:** Users getting dropped from chat

```bash
# 1. Check Redis Pub/Sub
redis-cli
> PUBSUB CHANNELS
# Should see active channels like "client:uuid"

# 2. Check network
kubectl get networkpolicies -n hsc-jit
# If too restrictive: relax rules

# 3. Check connection limits
redis-cli INFO clients
# If close to maxclients: Increase in redis config

# 4. Check logs for errors
kubectl logs -f <pod-name> -n hsc-jit | grep -i error

# 5. Restart affected pods
kubectl rollout restart deployment/hsc-jit-backend -n hsc-jit
```

### Database Connection Pool Exhausted

**Symptom:** "No pool slots available" errors in logs

```bash
# 1. Check connection count
kubectl exec postgres-0 -n hsc-jit -- \
  psql -U admin -d hsc_jit -c "SELECT count(*) FROM pg_stat_activity;"

# 2. Kill idle connections
kubectl exec postgres-0 -n hsc-jit -- \
  psql -U admin -d hsc_jit -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'hsc_jit'
    AND state = 'idle'
    AND query_start < now() - interval '1 hour';
  "

# 3. Increase pool size
# In backend/app/core/database.py
# Increase: pool_size=30, max_overflow=15
```

---

## 📊 Useful Monitoring Commands

```bash
# System Health
kubectl get nodes -o wide
kubectl get pods -n hsc-jit -o wide
kubectl describe node <node-name>

# Pod Metrics
kubectl top pods -n hsc-jit
kubectl top pod <pod-name> -n hsc-jit --containers

# Logs
kubectl logs <pod-name> -n hsc-jit
kubectl logs <pod-name> -n hsc-jit --previous  # Before crash
kubectl logs -f <pod-name> -n hsc-jit          # Stream logs
kubectl logs -l app=hsc-jit-backend -n hsc-jit # All pods

# Events
kubectl get events -n hsc-jit --sort-by='.lastTimestamp'
kubectl describe pod <pod-name> -n hsc-jit     # Pod events

# Prometheus Queries
# Active connections
curl 'http://localhost:9090/api/v1/query?query=websocket_active_connections'

# Error rate (last 5 min)
curl 'http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])'

# P95 latency
curl 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95, prediction_latency_seconds)'

# Cache hit rate
curl 'http://localhost:9090/api/v1/query?query=rate(cache_hits_total[5m])/(rate(cache_hits_total[5m])+rate(cache_misses_total[5m]))'

# Database connections
curl 'http://localhost:9090/api/v1/query?query=postgresql_connections_used'
```

---

## 🔄 Scaling Operations

### Scale Up (Increase Replicas)
```bash
# Manual scale
kubectl scale deployment hsc-jit-backend --replicas=5 -n hsc-jit

# Check HPA before manual scaling
kubectl get hpa -n hsc-jit

# If HPA active, it will auto-adjust back to target
```

### Scale Down (Decrease Replicas)
```bash
# Manual scale
kubectl scale deployment hsc-jit-backend --replicas=2 -n hsc-jit

# Graceful: Pods get 5 sec preStop hook to drain connections
```

### Increase Resource Limits
```bash
# Update CPU & memory limits
kubectl set resources deployment hsc-jit-backend \
  --requests=cpu=750m,memory=768Mi \
  --limits=cpu=1500m,memory=2Gi \
  -n hsc-jit
```

### Adjust Auto-Scaling Thresholds
```bash
# Edit HPA
kubectl edit hpa hsc-jit-backend-hpa -n hsc-jit

# Change these values:
# - spec.metrics[0].resource.target.averageUtilization: 70 (CPU)
# - spec.metrics[1].resource.target.averageUtilization: 80 (Memory)
# - spec.minReplicas: 2
# - spec.maxReplicas: 10
```

---

## 🔧 Maintenance Operations

### Restart Pod
```bash
# Graceful restart (pre-stop hook honored)
kubectl rollout restart deployment/hsc-jit-backend -n hsc-jit

# Force restart (no grace period)
kubectl delete pod <pod-name> --force --grace-period=0 -n hsc-jit
```

### Check Deployment History
```bash
# View rollout history
kubectl rollout history deployment/hsc-jit-backend -n hsc-jit

# View specific revision
kubectl rollout history deployment/hsc-jit-backend -n hsc-jit --revision=2

# Rollback to previous version
kubectl rollout undo deployment/hsc-jit-backend -n hsc-jit

# Rollback to specific revision
kubectl rollout undo deployment/hsc-jit-backend -n hsc-jit --to-revision=2
```

### Check Health
```bash
# All green?
curl http://api.example.com/health
# Response: {"status": "healthy", ...}

# Ready for traffic?
curl http://api.example.com/ready
# Response: {"status": "ready"}
```

### Backup Operations
```bash
# Create manual backup
bash scripts/backup.sh

# View backups
ls -lah backups/

# Restore from backup
bash scripts/restore.sh redis backups/redis-20250111_020000.rdb.gz
bash scripts/restore.sh postgres backups/postgres-20250111_020000.sql.gz
```

---

## 📈 Capacity Planning

### Current Capacity (3 pods)
- Max users: ~5000 concurrent
- Max throughput: 450-600 req/sec
- Max cache size: 3GB (3 × 1GB)

### If Approaching Limits
1. Scale up replicas: `kubectl scale deployment hsc-jit-backend --replicas=5`
2. Check HPA status: `kubectl get hpa -n hsc-jit`
3. Monitor for 1 hour: Check if errors decrease

### When to Scale Database
- If `postgresql_connections_used` > 90%: Increase pool_size
- If query latency > 1s: Check for missing indexes or slow queries
- If disk usage > 80%: Archive old logs

---

## 🚨 Emergency Procedures

### Service Down (Complete Outage)

```bash
# 1. Immediate action (< 1 min)
# Check if it's a Kubernetes issue
kubectl get pods -n hsc-jit
kubectl get nodes

# If nodes down: Contact cloud provider
# If pods not running: Check logs

# 2. Check health endpoints
curl -I http://api.example.com/health

# 3. If backend is down but Redis/DB up:
# Rollback to previous version
kubectl rollout undo deployment/hsc-jit-backend -n hsc-jit

# 4. Wait for recovery
kubectl rollout status deployment/hsc-jit-backend -n hsc-jit --timeout=5m

# 5. If still down, force restart
kubectl rollout restart deployment/hsc-jit-backend -n hsc-jit
```

### Data Corruption

```bash
# 1. Stop all writes
kubectl scale deployment hsc-jit-backend --replicas=0 -n hsc-jit

# 2. Create backup of corrupted data (for analysis)
redis-cli BGSAVE > backup-corrupted.rdb
pg_dump hsc_jit > backup-corrupted.sql

# 3. Restore from known good backup
bash scripts/restore.sh redis backups/redis-YYYY-MM-DD_HHMMSS.rdb.gz
bash scripts/restore.sh postgres backups/postgres-YYYY-MM-DD_HHMMSS.sql.gz

# 4. Resume service
kubectl scale deployment hsc-jit-backend --replicas=3 -n hsc-jit

# 5. Investigate root cause
# - Check logs for what caused corruption
# - Add extra validation/monitoring
```

### DDoS/High Traffic Spike

```bash
# 1. Check current load
kubectl top pods -n hsc-jit

# 2. Temporary rate limit
# (Need to implement in nginx/firewall)

# 3. Increase replicas aggressively
kubectl scale deployment hsc-jit-backend --replicas=10 -n hsc-jit

# 4. Update HPA limits if needed
kubectl patch hpa hsc-jit-backend-hpa -n hsc-jit \
  -p '{"spec": {"maxReplicas": 20}}'

# 5. Monitor until traffic normalizes
watch kubectl top pods -n hsc-jit

# 6. Scale back down when safe
kubectl scale deployment hsc-jit-backend --replicas=3 -n hsc-jit
```

---

## 📋 Daily Checklist

**Every Morning:**
```bash
# Check overnight status
kubectl get pods -n hsc-jit                    # All running?
kubectl top pods -n hsc-jit                    # Memory/CPU OK?
kubectl get events -n hsc-jit --sort-by='.lastTimestamp' | tail -10  # Any errors?
curl -f http://api.example.com/health         # Backend healthy?
```

**Every 4 Hours:**
```bash
# Performance check
curl 'http://prometheus:9090/api/v1/query?query=websocket_active_connections'
curl 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])'
# Any anomalies?
```

**End of Day:**
```bash
# Final checks
kubectl get deployment hsc-jit-backend -n hsc-jit    # All replicas ready?
kubectl get hpa -n hsc-jit                           # HPA scaling normally?
# Check: Any pods restarted today?
kubectl describe nodes | grep -E "Allocated|Requests"
```

---

## 🔐 Security Checklist

- [ ] All secrets in Kubernetes (not environment vars)
- [ ] Network policies restrict traffic
- [ ] RBAC configured for service accounts
- [ ] Pod security policies enabled
- [ ] Regular security updates (Dependabot)
- [ ] Audit logging enabled
- [ ] API keys rotated monthly

---

## 📞 Escalation Contacts

| Level | Owner | Time | Escalate After |
|-------|-------|------|-----------------|
| Level 1 | On-call Engineer | 24/7 | N/A |
| Level 2 | Team Lead | 9-5 | 15 min on-call escalation |
| Level 3 | Manager | 9-5 | 30 min escalation |

**On-Call Phone Tree:** [See ops wiki]

---

**Last Updated:** January 2025  
**For Questions:** See DEPLOYMENT_GUIDE.md
