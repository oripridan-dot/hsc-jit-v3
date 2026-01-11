# Testing Guide for HSC-JIT v3

## Quick Start

### Run All Tests
```bash
cd /workspaces/hsc-jit-v3
python -m pytest tests/ -v
```

### Run Specific Test Suite
```bash
# Cache component tests
python -m pytest tests/test_e2e_scenarios.py::TestCacheVerification -v

# Health check tests  
python -m pytest tests/test_e2e_scenarios.py::TestHealthCheckVerification -v

# Data flow scenarios
python -m pytest tests/test_e2e_scenarios.py::TestRealisticDataFlows -v

# Performance benchmarks
python -m pytest tests/test_e2e_scenarios.py::TestPerformanceBenchmarks -v
```

### Run Single Test
```bash
python -m pytest tests/test_e2e_scenarios.py::TestCacheVerification::test_cache_l1_operations -v
```

### Generate Coverage Report
```bash
python -m pytest tests/ --cov=backend --cov-report=html
```

---

## Test Files

### `tests/test_e2e_scenarios.py` (Main Test Suite)
36 comprehensive tests covering:
- ✅ Cache component (8 tests)
- ✅ Health checks (5 tests)
- ✅ Metrics collection (2 tests)
- ✅ Redis manager (3 tests)
- ✅ Logging system (3 tests)
- ✅ Data flow scenarios (5 tests)
- ✅ Edge cases & error handling (7 tests)
- ✅ Performance benchmarks (3 tests)

### `tests/test_component_integration.py` (Basic Integration Tests)
Additional integration tests for component composition.

---

## Test Results

**Latest Run:** 36/36 tests PASSED ✅

| Component | Tests | Status |
|-----------|-------|--------|
| Cache | 8 | ✅ PASS |
| Health Check | 5 | ✅ PASS |
| Metrics | 2 | ✅ PASS |
| Redis Manager | 3 | ✅ PASS |
| Logging | 3 | ✅ PASS |
| Data Flows | 5 | ✅ PASS |
| Edge Cases | 7 | ✅ PASS |
| Performance | 3 | ✅ PASS |

---

## Key Findings

### Performance Metrics
- **L1 Cache:** 0.009ms per operation (Target: <1ms) ✅
- **Key Generation:** 0.081ms per operation (Target: <1ms) ✅
- **Health Checks:** <100ms (Target: <5s) ✅

### Component Status
- ✅ Cache: Fully functional with LRU eviction
- ✅ Health Checks: Async-compatible, Kubernetes-ready
- ✅ Metrics: Prometheus format validated
- ✅ Redis Manager: Complete Pub/Sub API
- ✅ Logging: Structured JSON logging works
- ✅ Integration: All components work together

### Verified Scenarios
- ✅ Search → Prediction → Query → Answer flow
- ✅ Multi-user concurrent sessions
- ✅ Streaming response chunks
- ✅ Product detail pages
- ✅ Product comparisons

---

## Running Tests in CI/CD

### GitHub Actions Example
```yaml
- name: Run Component Tests
  run: |
    cd /workspaces/hsc-jit-v3
    python -m pytest tests/test_e2e_scenarios.py -v --tb=short --junit-xml=test-results.xml

- name: Upload Test Results
  uses: actions/upload-artifact@v2
  with:
    name: test-results
    path: test-results.xml
```

---

## Test Report

Full detailed report available in: [TEST_RESULTS_REPORT.md](TEST_RESULTS_REPORT.md)

---

## Troubleshooting

### "ModuleNotFoundError" when running tests
```bash
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-cov
```

### Tests hang on async operations
- Ensure pytest-asyncio is installed
- Use `@pytest.mark.asyncio` for async tests
- Check for infinite loops in async code

### "redis.ConnectionError"
- This is expected for health check tests without Redis running
- Tests are designed to handle missing dependencies gracefully

---

## Adding New Tests

Create test file in `tests/` directory:
```python
import pytest
from backend.app.core.cache import MultiLayerCache

class TestMyFeature:
    @pytest.fixture
    def cache(self):
        return MultiLayerCache()
    
    def test_my_feature(self, cache):
        # Arrange
        cache._put_l1("key", "value")
        
        # Act
        result = cache.l1_cache.get("key")
        
        # Assert
        assert result == "value"
```

Then run: `pytest tests/test_my_feature.py -v`

---

## Continuous Testing

### Watch Mode (requires pytest-watch)
```bash
ptw tests/ -- -v
```

### Run tests on every save (using git hooks)
```bash
./scripts/setup-git-hooks.sh
```

---

## Performance Testing

### Benchmark cache operations
```bash
python -m pytest tests/test_e2e_scenarios.py::TestPerformanceBenchmarks -v -s
```

### Profile code execution
```bash
python -m cProfile -s cumtime -m pytest tests/ -v
```

---

## Documentation References

- **Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Operations:** See [OPS_QUICK_REFERENCE.md](OPS_QUICK_REFERENCE.md)
- **Performance:** See [PERFORMANCE_TUNING.md](PERFORMANCE_TUNING.md)

---

**Last Updated:** January 11, 2026  
**Test Framework:** pytest 9.0.2  
**Python:** 3.11.13
