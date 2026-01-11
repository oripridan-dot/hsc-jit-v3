# HSC-JIT v3: Production Architecture Summary

## System Overview

```
                     ┌─────────────────┐
                     │  CLOUDFLARE CDN │
                     │  (Static Assets)│
                     └────────┬────────┘
                              │
                    ┌─────────▼─────────┐
                    │  NGINX/ALB        │
                    │  (Load Balancer)  │
                    └────────┬──────────┘
                             │
        ┌────────────┬───────┼───────┬────────────┐
        │            │       │       │            │
    ┌───▼──┐   ┌────▼──┐ ┌──▼──┐ ┌─▼────┐   ┌───▼──┐
    │Back- │   │Backend│ │Back-│ │Front-│   │Front-│
    │end   │   │Pod 2  │ │end  │ │end   │   │end   │
    │Pod 1 │   │       │ │Pod 3│ │React │   │(CDN) │
    └───┬──┘   └───┬───┘ └──┬──┘ └─┬────┘   └──────┘
        │          │        │      │
        └──────────┼────────┼──────┘
                   │        │
        ┌──────────▼────────▼──────────┐
        │    REDIS SENTINEL            │
        │  (Master + 2 Replicas)       │
        │  Pub/Sub + Cache             │
        └──────────┬──────────────────┘
                   │
        ┌──────────▼──────────┐
        │  PostgreSQL         │
        │  (Primary + Replica)│
        └─────────────────────┘

    ┌─────────────────────────────────┐
    │  CELERY WORKERS (Task Queue)    │
    │  - PDF Prefetch                 │
    │  - Session Cleanup              │
    │  - Cache Regenration            │
    └─────────────────────────────────┘

    ┌─────────────────────────────────┐
    │  MONITORING STACK               │
    │  - Prometheus (metrics)         │
    │  - Grafana (dashboards)         │
    │  - ELK Stack (logs)             │
    │  - Sentry (errors)              │
    └─────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + Vite + Tailwind | UI with message virtualization |
| **Backend** | FastAPI + Uvicorn | WebSocket API, real-time streaming |
| **Cache** | Redis Pub/Sub | Multi-instance state + hot cache |
| **Database** | PostgreSQL | Persistent storage |
| **Tasks** | Celery + Redis | Background async processing |
| **Metrics** | Prometheus | Performance monitoring |
| **Dashboards** | Grafana | Real-time visualization |
| **Logs** | ELK / JSON logs | Structured logging |
| **Container** | Docker | Deployment consistency |
| **Orchestration** | Kubernetes | Production scaling |
| **CI/CD** | GitHub Actions | Automated testing & deployment |

## Key Design Principles

### 1. **Stateless Services**
- No session data stored in pods
- All state in Redis (shareable across instances)
- Pods can restart without data loss

### 2. **Async-First Architecture**
- Heavy operations (PDF fetch, indexing) run in Celery
- WebSocket stays responsive
- Users see instant UI feedback

### 3. **Multi-Layer Caching**
- **L1:** Memory (LRU, 1000 items)
- **L2:** Redis (persistent, 24hr TTL)
- **Miss:** Compute fresh (fetch manual, rebuild index)

### 4. **Health & Resilience**
- Liveness probes kill stuck pods
- Readiness probes prevent traffic to unhealthy pods
- Pod disruption budgets maintain availability
- Graceful shutdown (5s preStop hook)

### 5. **Automatic Scaling**
- HPA targets 70% CPU, 80% memory
- Min 2 replicas (HA), max 10 (cost control)
- Scale-up: Immediate (handle spikes)
- Scale-down: 5 min stabilization (avoid flapping)

## Performance Characteristics

### Latencies (Typical)
| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Prediction (typing) | 50ms | 100ms | 200ms |
| Manual fetch | 1.5s | 3s | 5s |
| RAG indexing | 500ms | 1.5s | 3s |
| LLM answer generation | 2s | 4s | 8s |
| WebSocket round-trip | 20ms | 50ms | 100ms |

### Throughput
- **WebSocket connections:** 10,000+ per pod
- **Queries/sec:** 100-200 per pod
- **Cache hit rate:** 60-80% (L1 + L2)

### Resources (Per Pod)
- **CPU request:** 500m
- **CPU limit:** 1000m
- **Memory request:** 512Mi
- **Memory limit:** 1Gi

## Deployment Workflow

### 1. **Local Development**
```bash
docker-compose up  # All services local
```

### 2. **GitHub Actions**
- Push to main → Tests run
- Tests pass → Images built & pushed
- Images pushed → Deploy to K8s

### 3. **Zero-Downtime Rollout**
- New pod starts, waits for readiness
- Load balancer switches traffic
- Old pod preStop hook (5s grace period)
- Old pod terminated

### 4. **Automatic Rollback**
- If new pod fails readiness probe
- Kubernetes never scales down old replicas
- Traffic continues on old version

## Operational Tasks

### Daily (Automated)
- ✅ Health checks every 10s
- ✅ Metric scraping every 15s
- ✅ Log aggregation real-time
- ✅ Auto-scaling based on load
- ✅ Cache eviction (LRU)

### Weekly (Automated)
- ✅ Backup verification
- ✅ Security updates (Dependabot)
- ✅ Performance regression tests

### Monthly (Manual)
- 🔍 Review Grafana anomalies
- 🔍 Check error rates (Sentry)
- 🔍 Adjust HPA thresholds if needed

### Yearly (Manual)
- 🔍 Capacity planning
- 🔍 Disaster recovery drill
- 🔍 Security audit

## Failure Scenarios & Recovery

| Scenario | Detection | Recovery | RTO |
|----------|-----------|----------|-----|
| Pod crash | Liveness probe | Auto-restart | <30s |
| Redis down | Readiness probe | Manual restart | <5min |
| DB connection pool exhausted | Slow queries | App auto-retry | <10s |
| Memory leak | Memory trend | Pod restart | <30s |
| Network partition | High latency | Timeout & retry | <30s |
| Cascading failures | Error rate spike | Circuit breaker | <1min |

## Cost Optimization

### Current Setup (3 replicas)
- **Compute:** $75/month
- **Storage:** $50/month
- **Networking:** $30/month
- **Total:** ~$155/month

### Scale to 5 Replicas
- **Compute:** $125/month
- **Storage:** $50/month
- **Networking:** $40/month
- **Total:** ~$215/month

### Cost-Saving Tips
1. Use spot instances (70% savings, handle interruptions)
2. Reserved instances for baseload
3. Scale down to 1 pod during maintenance
4. Compress logs before archiving
5. Delete old backups after 30 days

## Security Posture

### Network
- ✅ Ingress TLS/SSL
- ✅ mTLS between pods (optional)
- ✅ Network policies (restrict traffic)
- ✅ DDoS mitigation (Cloudflare)

### Secrets
- ✅ API keys in Kubernetes secrets
- ✅ Encrypted at rest (etcd encryption)
- ✅ Rotated regularly
- ✅ Never logged

### Compliance
- ✅ Audit logging (all API calls)
- ✅ Data at rest encryption
- ✅ Data in transit encryption
- ✅ GDPR compliance (data retention)

## Monitoring & Alerting

### Key Metrics
```prometheus
# Application
websocket_active_connections
prediction_latency_seconds
answer_generation_seconds
cache_hits_total

# Infrastructure
container_memory_usage_bytes
container_cpu_usage_seconds_total
redis_connected_clients

# Database
postgresql_connections_used
postgresql_query_duration_seconds
```

### Alert Rules (Example)
```prometheus
# High error rate
rate(http_requests_total{status=~"5.."}[5m]) > 0.1

# High latency
histogram_quantile(0.95, http_request_duration_seconds) > 2

# Pod crash loop
rate(container_last_seen{state="exited"}[5m]) > 0

# Memory pressure
container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
```

## Future Enhancements

### Phase 2 (Quarter 2)
- [ ] GraphQL API for frontend
- [ ] Real-time collaboration (multiple users)
- [ ] WebRTC for voice/video
- [ ] ML-powered relevance ranking

### Phase 3 (Quarter 3)
- [ ] Multi-tenant support
- [ ] Advanced analytics
- [ ] Custom model fine-tuning
- [ ] API marketplace

### Phase 4 (Quarter 4)
- [ ] Edge deployment (regional pods)
- [ ] Blockchain-based audit trail
- [ ] Quantum-ready encryption
- [ ] AI-driven ops (AIOps)

---

**Architecture Version:** 3.1  
**Last Updated:** January 2025  
**Maintainer:** DevOps Team  
**Status:** Production Ready ✅
