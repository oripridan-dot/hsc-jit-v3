# HSC-JIT v3: Performance Tuning & Optimization Guide

## Performance Optimization Checklist

### L1: Code-Level Optimizations

#### 1. Cache Optimization
```python
# Current: 30-50ms prediction with no cache
# Optimized: 5-10ms prediction with cache hit

from app.core.cache import cached

@cached(ttl=1800)  # 30 minute cache
async def predict_product(self, text: str) -> List[Product]:
    """Cached product prediction"""
    return await self._fuzzy_match(text)
```

**Impact:** 5-6x faster for repeated queries

#### 2. Database Query Optimization
```python
# BEFORE: N+1 queries
products = session.query(Product).all()
for product in products:
    print(product.catalog.name)  # Triggers N more queries

# AFTER: Eager loading
products = session.query(Product).options(
    joinedload(Product.catalog)
).all()
```

**Impact:** 10-50x faster for large result sets

#### 3. Async Optimization
```python
# BEFORE: Sequential
content1 = await fetch_url(url1)
content2 = await fetch_url(url2)
content3 = await fetch_url(url3)

# AFTER: Parallel
content1, content2, content3 = await asyncio.gather(
    fetch_url(url1),
    fetch_url(url2),
    fetch_url(url3)
)
```

**Impact:** 2-3x faster for I/O-bound operations

### L2: Infrastructure Optimization

#### 1. Redis Configuration
```bash
# Optimize Redis for caching
# In docker-compose.yml
redis:
  command: >
    redis-server
    --maxmemory 512mb
    --maxmemory-policy allkeys-lru
    --tcp-backlog 511
    --timeout 0
    --tcp-keepalive 300
```

**Tuning Parameters:**
- `maxmemory`: 512MB-2GB (based on pod limit)
- `maxmemory-policy`: `allkeys-lru` (evict least-recently-used keys)
- `databases`: 16 (separate DB for cache, tasks, sessions)

#### 2. Connection Pooling
```python
# backend/app/core/database.py
engine = create_async_engine(
    "postgresql+asyncpg://...",
    pool_size=20,        # Base connections
    max_overflow=10,     # Burst capacity
    pool_pre_ping=True,  # Verify before use
    pool_recycle=3600,   # Recycle every hour
)
```

**Tuning Guidelines:**
- `pool_size`: 10-20 for moderate load, 30-50 for high load
- `max_overflow`: 10-20% of pool_size
- `pool_recycle`: 3600s for databases with idle timeouts

#### 3. Uvicorn Worker Configuration
```python
# In kubernetes/backend-deployment.yaml
# OR production dockerfile entrypoint

# Single process (current)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Multi-process (production)
gunicorn \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --worker-connections 1000 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  app.main:app
```

**Benefits:**
- Better CPU utilization (4 workers on 4-core machine)
- Connection pooling per worker
- Automatic worker restart on crashes

### L3: Application-Level Optimization

#### 1. Message Batching (Frontend)
```typescript
// BEFORE: Send every keystroke
onInputChange = (text: string) => {
  socket.send(JSON.stringify({
    type: 'typing',
    content: text
  }));
}

// AFTER: Batch with debounce
onInputChange = debounce((text: string) => {
  socket.send(JSON.stringify({
    type: 'typing',
    content: text
  }));
}, 150);  // Max 6-7 messages/sec instead of 50+
```

**Impact:** 8-10x reduction in WebSocket traffic

#### 2. Lazy Loading & Code Splitting
```typescript
// BEFORE: All code in one bundle
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import AdminPanel from './components/AdminPanel';

// AFTER: Lazy load on route change
const Dashboard = lazy(() => import('./components/Dashboard'));
const Analytics = lazy(() => import('./components/Analytics'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
```

**Impact:**
- Initial load: 1.2MB → 200KB (6x smaller)
- Time to interactive: 3s → 1s

#### 3. Virtual Scrolling
```typescript
// BEFORE: Render all 1000 messages
<div className="messages">
  {messages.map(m => <MessageBubble {...m} />)}
</div>

// AFTER: Render only visible messages
<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
  overscanCount={5}
>
  {({ index, style }) => (
    <div style={style}>
      <MessageBubble {...messages[index]} />
    </div>
  )}
</FixedSizeList>
```

**Impact:**
- 1000 messages: 1000 DOM nodes → ~15 visible nodes
- Scroll FPS: 30fps → 60fps
- Memory: 50MB → 5MB

### L4: Kubernetes-Level Optimization

#### 1. Resource Requests & Limits
```yaml
resources:
  requests:
    memory: "512Mi"    # Guaranteed
    cpu: "500m"        # Guaranteed
  limits:
    memory: "1Gi"      # Maximum
    cpu: "1000m"       # Maximum
```

**Tuning:**
- Set requests = expected usage * 1.2
- Set limits = requests * 2.0
- Monitor actual usage: `kubectl top pod`

#### 2. Probe Configuration
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30  # Wait for startup
  periodSeconds: 10        # Check every 10s
  timeoutSeconds: 5        # Timeout after 5s
  failureThreshold: 3      # Kill after 3 failures

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 10  # Faster initial readiness
  periodSeconds: 5         # More frequent checks
  failureThreshold: 3
```

**Tuning:**
- `initialDelaySeconds`: Increase if slow to start
- `periodSeconds`: Increase to reduce probe overhead
- `failureThreshold`: Lower = faster failure detection, higher = more resilient

#### 3. HPA Tuning
```yaml
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70  # Lower = more aggressive scaling
- type: Resource
  resource:
    name: memory
    target:
      type: Utilization
      averageUtilization: 80

behavior:
  scaleUp:
    stabilizationWindowSeconds: 30      # Scale up fast
    policies:
    - type: Percent
      value: 100                         # Double pods
      periodSeconds: 15
  scaleDown:
    stabilizationWindowSeconds: 300     # Scale down slowly
    policies:
    - type: Percent
      value: 50                          # Remove 50% of extra pods
      periodSeconds: 15
```

## Performance Monitoring

### Key Metrics to Track

#### Backend Performance
```prometheus
# Prediction latency
histogram_quantile(0.95, prediction_latency_seconds)  # Should be < 200ms

# LLM generation time
histogram_quantile(0.95, answer_generation_seconds)   # Should be < 10s

# Cache hit rate
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))  # Should be > 60%

# Active connections
websocket_active_connections  # Should match expected concurrent users

# Error rate
rate(http_requests_total{status=~"5.."}[5m])  # Should be < 0.01
```

#### Infrastructure Performance
```prometheus
# Pod CPU usage
rate(container_cpu_usage_seconds_total[5m])  # Should be < 70%

# Pod memory usage
container_memory_usage_bytes / container_spec_memory_limit_bytes  # Should be < 80%

# Network I/O
rate(container_network_receive_bytes_total[5m])  # Monitor for unexpected spikes

# Disk I/O
rate(container_fs_read_bytes_total[5m])  # Should be < 100MB/s
```

### Grafana Dashboard Queries

```json
{
  "panels": [
    {
      "title": "P95 Prediction Latency",
      "targets": [{
        "expr": "histogram_quantile(0.95, prediction_latency_seconds)"
      }],
      "alert": {"greaterThan": 0.2}
    },
    {
      "title": "Cache Hit Rate",
      "targets": [{
        "expr": "rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))"
      }],
      "alert": {"lessThan": 0.5}
    },
    {
      "title": "Active WebSocket Connections",
      "targets": [{
        "expr": "websocket_active_connections"
      }],
      "alert": {"greaterThan": 10000}
    },
    {
      "title": "Error Rate",
      "targets": [{
        "expr": "rate(http_requests_total{status=~\"5..\"}[1m])"
      }],
      "alert": {"greaterThan": 0.01}
    }
  ]
}
```

## Load Testing

### Simulating Production Load
```bash
# Install locust
pip install locust

# Create locustfile.py
# Run load test
locust -f locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10
```

### Locustfile Example
```python
from locust import HttpUser, task, between
import json
import random

class HSCJITUser(HttpUser):
    wait_time = between(1, 5)
    
    @task(3)
    def predict(self):
        products = ['Roland TD27', 'Shure SM58', 'Fender Stratocaster']
        text = random.choice(products)
        # WebSocket connection
        self.client.get(f"/ws?client_id={self.client_id}")
    
    @task(1)
    def query(self):
        payload = {
            "type": "query",
            "product_id": "roland_td27",
            "query": "How to change the snare tuning?"
        }
        # Send via WebSocket
```

### Performance Benchmarks
```bash
# CPU utilization
kubectl top pod <pod-name> -n hsc-jit

# Network throughput
kubectl exec <pod-name> -n hsc-jit -- \
  watch 'cat /sys/class/net/eth0/statistics/rx_bytes'

# Disk I/O
kubectl exec <pod-name> -n hsc-jit -- \
  iostat -x 1 5
```

## Optimization Checklist

### Before Going to Production
- [ ] Cache hit rate > 60%
- [ ] P95 prediction latency < 200ms
- [ ] P95 LLM latency < 10s
- [ ] Error rate < 0.1%
- [ ] Memory usage < 80% of limit
- [ ] CPU usage < 70% of limit
- [ ] Pod startup time < 30s
- [ ] Pod graceful shutdown < 5s

### After First Week
- [ ] All metrics stable
- [ ] No pod restarts
- [ ] No crash loops
- [ ] Error rate trending down
- [ ] Cache hit rate trending up
- [ ] HPA scaling working correctly

### Monthly
- [ ] Review slow queries
- [ ] Analyze error logs
- [ ] Update cache TTLs if needed
- [ ] Review and optimize DB indexes
- [ ] Check for memory leaks
- [ ] Validate backup integrity

## Cost Optimization

### Reduce Pod Resource Requests
```yaml
# BEFORE
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"

# AFTER (if proven to work)
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
```

**Savings:** ~50% reduction in resource costs

### Use Spot Instances
```yaml
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

**Savings:** 70% cheaper (handle 5-10 min interruption)

### Idle Time Reduction
```bash
# Scale down during off-hours
kubectl scale deployment hsc-jit-backend --replicas=1 -n hsc-jit

# Or use scheduled scaling
*/1 * * * * kubectl scale deployment hsc-jit-backend --replicas=1 -n hsc-jit  # Off-hours
0 8 * * * kubectl scale deployment hsc-jit-backend --replicas=3 -n hsc-jit    # Work hours
```

---

**Last Updated:** January 2025
