# HSC-JIT v3 Production Runbook

> **Quick Reference:** Emergency procedures, troubleshooting, and common operational tasks.

---

## 🚨 Emergency Procedures

### System Down - Complete Outage

**Symptoms:** All endpoints returning 502/503, no pods responding

**Actions:**
```bash
# 1. Check pod status
kubectl get pods -n hsc-jit -o wide

# 2. Check recent events
kubectl get events -n hsc-jit --sort-by='.lastTimestamp' | tail -20

# 3. Check logs from crashed pods
kubectl logs -n hsc-jit <pod-name> --previous

# 4. Force restart all pods
kubectl rollout restart deployment/backend -n hsc-jit
kubectl rollout restart deployment/frontend -n hsc-jit

# 5. Verify health
kubectl wait --for=condition=ready pod -l app=hsc-jit-backend -n hsc-jit --timeout=300s
curl -f http://<loadbalancer-ip>/health || echo "Still unhealthy"
```

**Escalation:** If not resolved in 5 minutes, initiate rollback (see below).

---

### Degraded Performance - High Latency

**Symptoms:** Response times >5s, timeouts, slow UI

**Actions:**
```bash
# 1. Check resource usage
kubectl top pods -n hsc-jit
kubectl top nodes

# 2. Check Redis connection
kubectl exec -it deployment/backend -n hsc-jit -- redis-cli -h redis ping

# 3. Check cache hit rate
curl -s http://<backend-ip>:8000/metrics | grep cache_hit

# 4. Scale up if needed
kubectl scale deployment/backend -n hsc-jit --replicas=6

# 5. Check LLM service health
curl -s http://<backend-ip>:8000/health | jq .
```

**Common Causes:**
- Redis disconnected → Check Redis pod/service
- Low cache hit rate → Warm cache with common queries
- High CPU → Scale horizontally
- LLM API rate limits → Check Gemini quota

---

### Redis Connection Lost

**Symptoms:** `redis_connected: false` in health check, cache misses at 100%

**Actions:**
```bash
# 1. Check Redis pod
kubectl get pod -l app=redis -n hsc-jit
kubectl logs -l app=redis -n hsc-jit --tail=50

# 2. Check Redis service
kubectl get svc redis -n hsc-jit
kubectl describe svc redis -n hsc-jit

# 3. Test connectivity from backend pod
kubectl exec -it deployment/backend -n hsc-jit -- sh
> redis-cli -h redis ping
> exit

# 4. Restart Redis if needed
kubectl rollout restart statefulset/redis -n hsc-jit

# 5. Verify backend reconnects
kubectl logs -f deployment/backend -n hsc-jit | grep -i redis
```

**Expected Recovery Time:** 30-60 seconds (backend auto-reconnects)

---

### Database Corruption / Data Loss

**Symptoms:** 500 errors with stack traces, corrupted responses, missing data

**Actions:**
```bash
# 1. IMMEDIATELY stop writes
kubectl scale deployment/backend -n hsc-jit --replicas=0

# 2. Identify affected database
# Check logs for error messages mentioning PostgreSQL or Redis

# 3. Restore from backup
cd /workspaces/hsc-jit-v3/scripts

# For Redis:
./restore.sh redis /path/to/backup/redis-YYYYMMDD_HHMMSS.rdb.gz

# For PostgreSQL:
./restore.sh postgres /path/to/backup/postgres-YYYYMMDD_HHMMSS.sql.gz

# 4. Verify data integrity
kubectl exec -it deployment/backend -n hsc-jit -- python -c "
from app.services.catalog import CatalogService
cs = CatalogService()
brands = cs.get_brands()
print(f'Brands loaded: {len(brands)}')
"

# 5. Resume operations
kubectl scale deployment/backend -n hsc-jit --replicas=3
```

**Documentation:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md#disaster-recovery)

---

## 🔄 Routine Operations

### Deploying a New Version

**Pre-Deployment Checklist:**
- [ ] All tests passing in CI/CD
- [ ] Smoke test in staging environment
- [ ] Backup completed (automatic daily backup verified)
- [ ] Rollback plan confirmed
- [ ] Team notified of deployment window

**Deployment Steps:**
```bash
# 1. Build and tag new images
docker build -t hsc-jit-backend:v3.3.x ./backend
docker build -t hsc-jit-frontend:v3.3.x ./frontend

# 2. Push to registry
docker tag hsc-jit-backend:v3.3.x gcr.io/your-project/hsc-jit-backend:v3.3.x
docker push gcr.io/your-project/hsc-jit-backend:v3.3.x

# Same for frontend...

# 3. Update Kubernetes manifests
cd kubernetes/
sed -i 's/:v3.3.[0-9]*/:v3.3.x/g' backend-deployment.yaml
sed -i 's/:v3.3.[0-9]*/:v3.3.x/g' frontend-deployment.yaml

# 4. Apply changes (rolling update)
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# 5. Monitor rollout
kubectl rollout status deployment/backend -n hsc-jit
kubectl rollout status deployment/frontend -n hsc-jit

# 6. Smoke test
./test_e2e.py --env production --quick

# 7. Monitor for 10 minutes
watch -n 5 'kubectl top pods -n hsc-jit && echo "---" && kubectl get pods -n hsc-jit'
```

**Rollback Procedure (if issues detected):**
```bash
# Immediate rollback
kubectl rollout undo deployment/backend -n hsc-jit
kubectl rollout undo deployment/frontend -n hsc-jit

# Or rollback to specific revision
kubectl rollout history deployment/backend -n hsc-jit
kubectl rollout undo deployment/backend -n hsc-jit --to-revision=<N>
```

---

### Scaling Operations

**Manual Scaling:**
```bash
# Scale backend pods
kubectl scale deployment/backend -n hsc-jit --replicas=5

# Verify
kubectl get pods -n hsc-jit -l app=hsc-jit-backend
```

**Verify HPA (Horizontal Pod Autoscaler):**
```bash
# Check current HPA status
kubectl get hpa -n hsc-jit

# Should show:
# NAME      REFERENCE            TARGETS   MINPODS   MAXPODS   REPLICAS
# backend   Deployment/backend   45%/70%   2         10        3
```

**When to Scale:**
- **Scale Up:** CPU >70% for >5 min, response time >3s, active connections >500
- **Scale Down:** CPU <20% for >15 min, off-peak hours, low traffic

---

### Cache Management

**View Cache Statistics:**
```bash
# Via metrics endpoint
curl -s http://<backend-ip>:8000/metrics | grep cache

# Expected output:
# cache_hits_total 1523
# cache_misses_total 234
# cache_hit_rate 0.87
```

**Clear Cache (Emergency):**
```bash
# Clear Redis cache
kubectl exec -it deployment/redis -n hsc-jit -- redis-cli FLUSHDB

# Backend L1 cache clears on pod restart
kubectl rollout restart deployment/backend -n hsc-jit
```

**Warm Cache (After Clear):**
```bash
# Run common queries to rebuild cache
python3 scripts/warm_cache.py --brands "roland,yamaha,moog,korg"
```

---

### Log Investigation

**View Live Logs:**
```bash
# Backend logs (JSON structured)
kubectl logs -f deployment/backend -n hsc-jit --tail=100

# Filter for errors
kubectl logs deployment/backend -n hsc-jit --since=1h | jq 'select(.level=="ERROR")'

# WebSocket events
kubectl logs deployment/backend -n hsc-jit | grep -i websocket

# LLM requests
kubectl logs deployment/backend -n hsc-jit | grep -i "llm_request"
```

**Export Logs for Analysis:**
```bash
# Last hour of errors
kubectl logs deployment/backend -n hsc-jit --since=1h > /tmp/backend-errors.log

# Analyze with jq
cat /tmp/backend-errors.log | jq -r 'select(.level=="ERROR") | "\(.timestamp) \(.message)"'
```

---

### Database Backup & Restore

**Manual Backup (Before Risky Operation):**
```bash
cd /workspaces/hsc-jit-v3/scripts
./backup.sh

# Verify backup created
ls -lh backups/ | tail -5
```

**Restore from Backup:**
```bash
# List available backups
ls -lh backups/

# Restore Redis
./restore.sh redis backups/redis-20260111_120000.rdb.gz

# Restore PostgreSQL
./restore.sh postgres backups/postgres-20260111_120000.sql.gz
```

**Backup Schedule:**
- **Daily:** 02:00 UTC (automated via CronJob)
- **Before Deployments:** Manual backup
- **Retention:** 7 days local, 30 days S3

---

## 📊 Monitoring & Alerts

### Key Metrics to Watch

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Response Time (p95) | <500ms | 500ms-2s | >2s |
| Error Rate | <0.1% | 0.1%-1% | >1% |
| Cache Hit Rate | >80% | 60%-80% | <60% |
| Memory Usage | <70% | 70%-85% | >85% |
| CPU Usage | <60% | 60%-80% | >80% |
| Active Connections | <500 | 500-800 | >800 |
| Redis Ping | <5ms | 5-20ms | >20ms or timeout |

### Grafana Dashboards

**Access:** http://grafana.yourdomain.com (or `kubectl port-forward svc/grafana 3000:3000`)

**Key Dashboards:**
1. **HSC-JIT v3 Production Dashboard** - Overall system health
2. **Request Performance** - Latency breakdown by endpoint
3. **Cache Analytics** - Hit rates, eviction rates
4. **Resource Utilization** - CPU/memory/disk per pod

**Import Dashboard:**
```bash
# From file
kubectl create configmap grafana-dashboard --from-file=kubernetes/grafana-dashboards.json -n monitoring

# Dashboard auto-loads via Grafana sidecar
```

### Prometheus Queries

**Request Rate:**
```promql
rate(http_requests_total{job="hsc-jit-backend"}[5m])
```

**Error Rate:**
```promql
rate(http_requests_total{job="hsc-jit-backend",status=~"5.."}[5m]) / 
rate(http_requests_total{job="hsc-jit-backend"}[5m])
```

**Cache Hit Rate:**
```promql
rate(cache_hits_total[5m]) / 
(rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

**95th Percentile Response Time:**
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket{job="hsc-jit-backend"}[5m])
)
```

---

## 🔧 Troubleshooting Guide

### Issue: WebSocket Connections Dropping

**Diagnosis:**
```bash
# Check active connections
kubectl exec -it deployment/backend -n hsc-jit -- netstat -an | grep ESTABLISHED | wc -l

# Check WebSocket errors in logs
kubectl logs deployment/backend -n hsc-jit | grep -i "websocket.*error"
```

**Common Causes:**
1. Load balancer timeout (default 60s) → Increase to 300s
2. Client-side network issues → Check client logs
3. Pod restarting → Check pod events: `kubectl describe pod <pod-name>`

**Fix:**
```bash
# Update load balancer timeout (example for GKE)
kubectl annotate service backend -n hsc-jit \
  cloud.google.com/neg='{"ingress": true}' \
  --overwrite

# Or configure in ingress:
kubectl edit ingress hsc-jit -n hsc-jit
# Add: nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
```

---

### Issue: High Memory Usage / OOM Kills

**Diagnosis:**
```bash
# Check current memory usage
kubectl top pods -n hsc-jit

# Check OOM events
kubectl get events -n hsc-jit | grep OOM

# Check pod restarts
kubectl get pods -n hsc-jit -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].restartCount}{"\n"}{end}'
```

**Common Causes:**
1. L1 cache too large → Reduce `l1_max_size` in config
2. Memory leak → Check for increasing memory over time
3. Large response payloads → Check PDF sizes

**Fix:**
```bash
# Temporary: Restart high-memory pods
kubectl delete pod <pod-name> -n hsc-jit

# Permanent: Adjust memory limits
kubectl edit deployment/backend -n hsc-jit
# resources:
#   limits:
#     memory: 1Gi  # Increase if needed
#   requests:
#     memory: 512Mi
```

---

### Issue: PDF Fetch Failures

**Diagnosis:**
```bash
# Check PDF fetch metrics
curl -s http://<backend-ip>:8000/metrics | grep pdf_fetch

# Check recent PDF fetch errors
kubectl logs deployment/backend -n hsc-jit --since=10m | grep "pdf_fetch.*error"
```

**Common Causes:**
1. Source URL unreachable → Check catalog URLs
2. Rate limiting from source → Implement backoff
3. Timeout (30s default) → Increase timeout for large PDFs

**Fix:**
```bash
# Test PDF fetch manually
kubectl exec -it deployment/backend -n hsc-jit -- python3 -c "
import asyncio
from app.services.fetcher import fetch_pdf
result = asyncio.run(fetch_pdf('https://...'))
print(result[:100])
"

# Update catalog if URL is broken
vim backend/data/catalogs/<brand>_catalog.json
# Fix URLs, then reload:
kubectl exec -it deployment/backend -n hsc-jit -- kill -HUP 1
```

---

### Issue: LLM API Errors

**Diagnosis:**
```bash
# Check LLM errors
kubectl logs deployment/backend -n hsc-jit | grep "LLM.*error"

# Check API key validity
kubectl get secret llm-api-key -n hsc-jit -o jsonpath='{.data.key}' | base64 -d | wc -c
# Should be >20 characters
```

**Common Causes:**
1. Invalid API key → Rotate secret
2. Rate limit exceeded → Check Gemini quota
3. Network timeout → Check egress rules

**Fix:**
```bash
# Rotate API key
kubectl create secret generic llm-api-key \
  --from-literal=key='NEW_API_KEY_HERE' \
  -n hsc-jit \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secret
kubectl rollout restart deployment/backend -n hsc-jit
```

---

## 📞 Escalation Contacts

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Critical Outage | On-Call Engineer (PagerDuty) | <15 min |
| Performance Degradation | DevOps Team (Slack #incidents) | <30 min |
| Data Issues | Data Engineering Lead | <1 hour |
| Infrastructure | Platform Team | <2 hours |
| LLM API Issues | AI Services Team | <4 hours |

**Emergency Runbook Location:**  
https://wiki.company.com/hsc-jit/runbook (this file)

---

## 📚 Additional Resources

- **Architecture Docs:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Performance Tuning:** [PERFORMANCE_TUNING.md](PERFORMANCE_TUNING.md)
- **Operations Quick Ref:** [OPS_QUICK_REFERENCE.md](OPS_QUICK_REFERENCE.md)
- **Test Results:** [TEST_RESULTS_REPORT.md](TEST_RESULTS_REPORT.md)

**Last Updated:** January 11, 2026  
**Maintained By:** DevOps Team  
**Review Schedule:** Quarterly
