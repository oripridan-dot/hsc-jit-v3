# HSC-JIT v3: Production Deployment Checklist

## Pre-Deployment (1 Week Before)

### Code & Testing
- [ ] All tests passing locally
- [ ] No critical linting warnings
- [ ] Code review completed
- [ ] Security scan (Trivy) clean
- [ ] Load testing (100+ concurrent users)
- [ ] Backup/restore tested

### Infrastructure Preparation
- [ ] Kubernetes cluster provisioned
- [ ] Ingress/LoadBalancer configured
- [ ] TLS certificates ready
- [ ] DNS entries updated
- [ ] Monitoring stack deployed
- [ ] Backup storage configured
- [ ] VPN/Access controls in place

### Documentation
- [ ] Runbook completed
- [ ] Escalation procedures documented
- [ ] API documentation updated
- [ ] Architecture diagrams drawn
- [ ] Team trained on new architecture

---

## Deployment Day (T-Day)

### T-6 Hours: Pre-Flight Checks

```bash
# Verify cluster health
kubectl get nodes -o wide
kubectl get pvc -A
kubectl describe quota -A

# Verify images built
docker images | grep hsc-jit

# Verify secrets exist
kubectl get secrets -n hsc-jit

# Check disk space
kubectl exec -it <pod> -n hsc-jit -- df -h /
```

Checklist:
- [ ] All nodes ready
- [ ] All images available
- [ ] All secrets configured
- [ ] Disk space available (>10GB free)

### T-4 Hours: Final Database Migration

```bash
# Create pre-migration backup
redis-cli SAVE
pg_dump hsc_jit > backup-pre-migration.sql.gz

# Run migrations (if any)
kubectl run migration --image=hsc-jit-backend:new \
  --command -- python -m alembic upgrade head

# Verify migration
kubectl logs migration
```

Checklist:
- [ ] Backup created
- [ ] Migrations run successfully
- [ ] No migration errors in logs

### T-2 Hours: Staging Validation

```bash
# Deploy to staging (same as prod, different namespace)
kubectl apply -f kubernetes/ -n staging

# Run integration tests
pytest tests/e2e/ \
  --base-url http://staging.example.com \
  --workers 10 \
  -v

# Load test
locust -f tests/load/locustfile.py \
  --host http://staging.example.com \
  --users 100 --spawn-rate 10 \
  --run-time 5m
```

Checklist:
- [ ] Staging deployment successful
- [ ] All integration tests passing
- [ ] Load test: P95 latency < 200ms
- [ ] Load test: Error rate < 0.1%

### T-30 Min: Communication

```bash
# Notify stakeholders
# Send message to:
# - #operations channel
# - @on-call rotation
# - @product team
# - @support team

# Message template:
# "🚀 Deploying HSC-JIT v3 in 30 minutes
#  - Zero downtime: YES
#  - Estimated duration: 15 minutes
#  - Rollback available: YES
#  - Status page: https://status.example.com"
```

Checklist:
- [ ] Team notified
- [ ] On-call engineer standing by
- [ ] Slack channel open
- [ ] War room ready

### T-0: Production Deployment

```bash
# Step 1: Scale up new version (1 extra pod)
kubectl patch deployment hsc-jit-backend -n hsc-jit \
  -p '{"spec": {"replicas": 4}}'

# Step 2: Wait for new pod readiness
kubectl wait --for=condition=ready pod \
  -l app=hsc-jit-backend -n hsc-jit \
  --timeout=5m

# Step 3: Verify new pod health
kubectl logs -f <new-pod-name> -n hsc-jit | grep "All services initialized"

# Step 4: Run smoke tests
curl -f https://api.example.com/health
curl -f https://api.example.com/ready

# Step 5: Slow roll (gradual traffic shift)
# Update service to 25% new, 75% old
# Monitor for 5 minutes
# If good: 50/50
# If good: 75/25
# If good: 100% new

# Step 6: Scale down old replicas
kubectl patch deployment hsc-jit-backend -n hsc-jit \
  -p '{"spec": {"replicas": 3}}'

# Step 7: Monitor for 30 minutes
# Watch: error rate, latency, pod restarts
```

Checklist:
- [ ] New pod started successfully
- [ ] Passed readiness probe
- [ ] Smoke tests passed
- [ ] Slow roll (25%) - no issues
- [ ] Slow roll (50%) - no issues
- [ ] Slow roll (75%) - no issues
- [ ] Slow roll (100%) - no issues
- [ ] Old pods scaled down
- [ ] All metrics green

---

## Post-Deployment Validation (T+30 Min to T+2 Hours)

### Immediate Checks (T+5 Min)

```bash
# Pod status
kubectl get pods -n hsc-jit -o wide
kubectl top pods -n hsc-jit

# Error rate
curl 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[1m])'

# Latency
curl 'http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95, prediction_latency_seconds)'

# Active connections
curl 'http://prometheus:9090/api/v1/query?query=websocket_active_connections'

# Check for restart loops
kubectl get events -n hsc-jit --sort-by='.lastTimestamp' | tail -20
```

Checklist:
- [ ] All pods running
- [ ] Error rate < 0.5% (some users refreshing)
- [ ] P95 latency < 300ms
- [ ] WebSocket connections increasing
- [ ] No crash loops

### Functional Checks (T+15 Min)

```bash
# Test prediction
curl -X GET 'http://api.example.com/health'
# Response: {"status": "healthy"}

# Test query
curl -X GET 'http://api.example.com/ready'
# Response: {"status": "ready"}

# Test actual features
# - Type in search box (should get predictions)
# - Click product (should fetch manual)
# - Ask question (should stream answer)
```

Checklist:
- [ ] Predictions working
- [ ] Manual fetching working
- [ ] Answer generation working
- [ ] UI responsive
- [ ] No 404 errors

### Monitoring (T+30 Min)

```bash
# Create dashboard snapshot
# View in Grafana:
# - System CPU (should be 30-50%)
# - System memory (should be 40-60%)
# - Request latency (should be stable)
# - Error rate (should be flat line at ~0%)
# - Cache hit rate (should be 50-70%)
# - Pod restart count (should be 0)
```

Checklist:
- [ ] CPU stable
- [ ] Memory stable
- [ ] Latency stable
- [ ] Error rate < 0.1%
- [ ] Cache hit rate > 50%
- [ ] No pod restarts
- [ ] HPA not scaling excessively

### Load Verification (T+1 Hour)

```bash
# Peak hour simulation
locust -f tests/load/locustfile.py \
  --host https://api.example.com \
  --users 500 --spawn-rate 25 \
  --run-time 10m

# Check results
# P95 latency < 500ms?
# Error rate < 0.5%?
# No pod evictions?
```

Checklist:
- [ ] Handles 500 concurrent users
- [ ] P95 latency < 500ms under load
- [ ] Error rate < 0.5%
- [ ] No OOMKilled pods
- [ ] HPA scaled to 5-6 pods

---

## Post-Deployment Monitoring (T+2 Hours to T+24 Hours)

### Continuous Monitoring

```bash
# Set up alerting
# Email on:
# - Error rate > 1%
# - P95 latency > 1s
# - Pod restart > 1 per hour
# - Memory usage > 90%
# - Redis connection errors

# Setup on-call schedule for next 24h
# Escalate to engineering if any alerts
```

### Automated Checks
```yaml
# Kubernetes automated tasks
- Health check probes: every 10s
- Metric collection: every 15s
- Log aggregation: real-time
- Auto-scaling: based on load
- Pod disruption budgets: maintained
```

### Manual Checks

Schedule | Check
---------|------
Every 30 min | Error rate, P95 latency
Every 1 hour | Pod status, HPA status
Every 4 hours | Cache hit rate, database performance
Daily | Full health report, backup verification

---

## Rollback Procedure (If Issues Found)

### Automatic Rollback (Preferred)
```bash
# If readiness probe fails, Kubernetes auto-rolls back
# Deployment never scales down old replicas
# No action needed - happens automatically
```

### Manual Rollback (Emergency)
```bash
# Step 1: Immediate action - stop bad pods
kubectl delete pods -l app=hsc-jit-backend -n hsc-jit --force

# Step 2: Restore previous version
kubectl rollout history deployment/hsc-jit-backend -n hsc-jit
kubectl rollout undo deployment/hsc-jit-backend -n hsc-jit --to-revision=2

# Step 3: Wait for recovery
kubectl rollout status deployment/hsc-jit-backend -n hsc-jit

# Step 4: Verify
curl -f https://api.example.com/health
curl -f https://api.example.com/ready

# Step 5: Notify team
# Send message: "⚠️ ROLLBACK: Returned to v3.0
#  Reason: [error description]
#  Impact: Minimal (< 5 min)
#  Status: Investigating root cause"
```

Checklist:
- [ ] Bad version stopped
- [ ] Previous version restored
- [ ] Health checks passing
- [ ] Team notified
- [ ] RCA scheduled

---

## Post-Incident (If Rollback Occurred)

### Immediate (Within 1 Hour)
1. Stabilize production (✓ already done via rollback)
2. Notify stakeholders
3. Open incident ticket
4. Assign RCA owner

### Short-term (Within 24 Hours)
1. Root cause analysis
2. Fix deployed to staging
3. Staging validation complete
4. Ready for re-deployment

### Long-term (Within 1 Week)
1. RCA document published
2. Preventive measures implemented
3. Test coverage improved
4. Team training completed

---

## Success Criteria

Deployment is **successful** if:

1. **Availability:** 99.9% uptime (< 1.5 min downtime)
2. **Performance:** P95 latency < 200ms under normal load
3. **Reliability:** 0 pod crashes in 24 hours
4. **Stability:** Metrics flat (no anomalies)
5. **Functionality:** All features working as expected
6. **User Experience:** No user-reported issues

Deployment is **failed** if:

1. **Critical Error Rate:** > 5% for > 5 minutes
2. **Performance Degradation:** P95 > 2s for > 10 minutes
3. **Availability Loss:** > 1% downtime (> 14 min)
4. **Data Corruption:** Any data consistency issues
5. **Security Incident:** Any unauthorized access
6. **User Blocking Bug:** Feature completely broken

---

## Contact & Escalation

| Severity | Owner | Escalate After | Contact |
|----------|-------|----------------|---------|
| Critical (down) | On-call Engineer | 1 min | Slack + call |
| High (degraded) | Team Lead | 15 min | Slack |
| Medium (slow) | Engineer | 30 min | Slack |
| Low (monitoring) | Team | 1 hour | Email |

**On-Call Engineer Contacts:**
- Primary: [name] - [phone]
- Secondary: [name] - [phone]
- Tertiary: [name] - [phone]

**War Room:** [Zoom link or conference room]

---

**Deployment Owner:** [Name]  
**Date:** January 11, 2025  
**Version:** v3.1  
**Status:** ✅ Ready to Deploy
