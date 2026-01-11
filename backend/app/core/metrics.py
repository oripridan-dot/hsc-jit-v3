"""Prometheus metrics collection and instrumentation."""

import time
import logging
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    CollectorRegistry,
    generate_latest,
)
from functools import wraps
from typing import Callable

logger = logging.getLogger(__name__)

# Create custom registry
registry = CollectorRegistry()

# ============ Connection Metrics ============
websocket_active_connections = Gauge(
    "websocket_active_connections",
    "Number of active WebSocket connections",
    registry=registry,
)

# ============ Performance Metrics ============
prediction_latency = Histogram(
    "prediction_latency_seconds",
    "Time to predict product from typing",
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0],
    registry=registry,
)

answer_generation_latency = Histogram(
    "answer_generation_seconds",
    "Time to generate LLM answer",
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
    registry=registry,
)

pdf_fetch_latency = Histogram(
    "pdf_fetch_seconds",
    "Time to fetch PDF content",
    buckets=[1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
    registry=registry,
)

websocket_message_latency = Histogram(
    "websocket_message_latency_seconds",
    "Round-trip latency for WebSocket messages",
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5],
    registry=registry,
)

# ============ Cache Metrics ============
cache_hits = Counter(
    "cache_hits_total",
    "Total cache hits",
    labelnames=["layer"],  # L1 or L2
    registry=registry,
)

cache_misses = Counter(
    "cache_misses_total",
    "Total cache misses",
    labelnames=["layer"],
    registry=registry,
)

# ============ Error Metrics ============
websocket_errors = Counter(
    "websocket_errors_total",
    "Total WebSocket errors",
    labelnames=["error_type"],
    registry=registry,
)

llm_errors = Counter(
    "llm_errors_total",
    "Total LLM API errors",
    labelnames=["error_type"],
    registry=registry,
)

redis_errors = Counter(
    "redis_errors_total",
    "Total Redis errors",
    labelnames=["operation"],
    registry=registry,
)

# ============ Task Metrics ============
background_tasks = Gauge(
    "background_tasks_active",
    "Number of active background tasks",
    registry=registry,
)

background_task_duration = Histogram(
    "background_task_duration_seconds",
    "Duration of background tasks",
    labelnames=["task_type"],
    buckets=[1, 5, 10, 30, 60, 300],
    registry=registry,
)

# ============ Business Metrics ============
messages_processed = Counter(
    "messages_processed_total",
    "Total messages processed",
    labelnames=["message_type"],
    registry=registry,
)

products_searched = Counter(
    "products_searched_total",
    "Total product searches",
    registry=registry,
)

documents_indexed = Counter(
    "documents_indexed_total",
    "Total documents indexed for RAG",
    registry=registry,
)


def instrument_latency(metric: Histogram):
    """Decorator to instrument function latency"""

    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                elapsed = time.time() - start
                metric.observe(elapsed)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                elapsed = time.time() - start
                metric.observe(elapsed)

        # Return appropriate wrapper
        if hasattr(func, "__await__"):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def get_metrics_summary() -> dict:
    """Get a summary of current metrics"""
    return {
        "active_connections": websocket_active_connections._value.get(),
        "cache_hits": cache_hits._metrics,
        "cache_misses": cache_misses._metrics,
        "websocket_errors": websocket_errors._metrics,
        "background_tasks": background_tasks._value.get(),
    }


def get_prometheus_metrics() -> bytes:
    """Get all metrics in Prometheus format"""
    return generate_latest(registry)
