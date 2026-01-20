"""
Monitoring and Instrumentation - v3.7.0
========================================

Structured logging, metrics collection, and observability for backend pipeline.

Tracks:
- Scraping progress and performance metrics
- Data quality statistics
- API request/response patterns
- Cache performance
- Error rates and types
"""

import logging
import time
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
from contextlib import contextmanager
import sys

# Setup JSON structured logging
class JSONFormatter(logging.Formatter):
    """Format logs as JSON for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add custom fields if present
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)
        
        return json.dumps(log_data)


def setup_structured_logging(name: str, log_file: Optional[Path] = None) -> logging.Logger:
    """
    Setup structured JSON logging for a module
    
    Args:
        name: Logger name (usually __name__)
        log_file: Optional file path for logging (default: stdout)
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Console handler with JSON formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)
    
    # File handler if specified
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)
    
    return logger


class MetricType(str, Enum):
    """Types of metrics"""
    COUNTER = "counter"      # Monotonic count
    GAUGE = "gauge"          # Point-in-time value
    HISTOGRAM = "histogram"  # Distribution/latency
    SUMMARY = "summary"      # Quantile data


@dataclass
class Metric:
    """Single metric data point"""
    name: str
    type: MetricType
    value: float
    unit: str = ""
    tags: Dict[str, str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = {}
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "name": self.name,
            "type": self.type.value,
            "value": self.value,
            "unit": self.unit,
            "tags": self.tags,
            "timestamp": self.timestamp.isoformat()
        }


class MetricsCollector:
    """Collects and aggregates metrics"""
    
    def __init__(self):
        self.metrics: List[Metric] = []
        self.logger = setup_structured_logging(__name__)
    
    def record_metric(
        self,
        name: str,
        value: float,
        metric_type: MetricType = MetricType.GAUGE,
        unit: str = "",
        tags: Dict[str, str] = None
    ) -> None:
        """Record a single metric"""
        metric = Metric(
            name=name,
            type=metric_type,
            value=value,
            unit=unit,
            tags=tags or {}
        )
        self.metrics.append(metric)
        
        # Log metric
        self.logger.info(
            f"Metric recorded: {name}={value}{unit}",
            extra={"extra_fields": metric.to_dict()}
        )
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of all recorded metrics"""
        by_type = {}
        for metric in self.metrics:
            type_name = metric.type.value
            if type_name not in by_type:
                by_type[type_name] = []
            by_type[type_name].append(metric.to_dict())
        
        return {
            "total_metrics": len(self.metrics),
            "by_type": by_type,
            "timestamp": datetime.utcnow().isoformat()
        }


@dataclass
class ScrapingMetrics:
    """Metrics for a scraping session"""
    brand: str
    total_products: int = 0
    successful_products: int = 0
    failed_products: int = 0
    skipped_products: int = 0
    
    total_images: int = 0
    total_specifications: int = 0
    total_features: int = 0
    total_manuals: int = 0
    total_accessories: int = 0
    
    start_time: datetime = None
    end_time: datetime = None
    
    def __post_init__(self):
        if self.start_time is None:
            self.start_time = datetime.utcnow()
    
    @property
    def duration_seconds(self) -> float:
        """Scraping duration in seconds"""
        end = self.end_time or datetime.utcnow()
        return (end - self.start_time).total_seconds()
    
    @property
    def success_rate(self) -> float:
        """Percentage of successful products"""
        if self.total_products == 0:
            return 0.0
        return (self.successful_products / self.total_products) * 100
    
    @property
    def products_per_second(self) -> float:
        """Scraping throughput"""
        duration = self.duration_seconds
        if duration == 0:
            return 0.0
        return self.successful_products / duration
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "brand": self.brand,
            "total_products": self.total_products,
            "successful_products": self.successful_products,
            "failed_products": self.failed_products,
            "skipped_products": self.skipped_products,
            "success_rate_percent": round(self.success_rate, 2),
            "total_images": self.total_images,
            "total_specifications": self.total_specifications,
            "total_features": self.total_features,
            "total_manuals": self.total_manuals,
            "total_accessories": self.total_accessories,
            "duration_seconds": round(self.duration_seconds, 2),
            "products_per_second": round(self.products_per_second, 2),
            "start_time": self.start_time.isoformat(),
            "end_time": (self.end_time or datetime.utcnow()).isoformat()
        }
    
    def summary(self) -> str:
        """Human-readable summary"""
        lines = [
            f"\n{'='*70}",
            f"📊 Scraping Metrics: {self.brand}",
            f"{'='*70}",
            f"✓ Successful: {self.successful_products}/{self.total_products} ({self.success_rate:.1f}%)",
            f"❌ Failed: {self.failed_products}",
            f"⏭️  Skipped: {self.skipped_products}",
            f"⏱️  Duration: {self.duration_seconds:.1f}s",
            f"⚡ Throughput: {self.products_per_second:.2f} products/sec",
            f"📦 Total content extracted:",
            f"   - Images: {self.total_images}",
            f"   - Specifications: {self.total_specifications}",
            f"   - Features: {self.total_features}",
            f"   - Manuals: {self.total_manuals}",
            f"   - Accessories: {self.total_accessories}",
            f"{'='*70}\n"
        ]
        return "\n".join(lines)


@dataclass
class ValidationMetrics:
    """Metrics for data validation"""
    brand: str
    total_products: int = 0
    products_with_errors: int = 0
    products_with_warnings: int = 0
    
    total_errors: int = 0
    total_warnings: int = 0
    
    error_categories: Dict[str, int] = None
    warning_categories: Dict[str, int] = None
    
    validation_timestamp: datetime = None
    
    def __post_init__(self):
        if self.error_categories is None:
            self.error_categories = {}
        if self.warning_categories is None:
            self.warning_categories = {}
        if self.validation_timestamp is None:
            self.validation_timestamp = datetime.utcnow()
    
    @property
    def validation_success_rate(self) -> float:
        """Percentage of products without errors"""
        if self.total_products == 0:
            return 0.0
        return ((self.total_products - self.products_with_errors) / self.total_products) * 100
    
    @property
    def is_publication_ready(self) -> bool:
        """True if no products have errors"""
        return self.products_with_errors == 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "brand": self.brand,
            "total_products": self.total_products,
            "products_with_errors": self.products_with_errors,
            "products_with_warnings": self.products_with_warnings,
            "validation_success_rate_percent": round(self.validation_success_rate, 2),
            "is_publication_ready": self.is_publication_ready,
            "total_errors": self.total_errors,
            "total_warnings": self.total_warnings,
            "error_categories": self.error_categories,
            "warning_categories": self.warning_categories,
            "validation_timestamp": self.validation_timestamp.isoformat()
        }
    
    def summary(self) -> str:
        """Human-readable summary"""
        status_icon = "✅" if self.is_publication_ready else "❌"
        lines = [
            f"\n{'='*70}",
            f"🔍 Validation Metrics: {self.brand}",
            f"{'='*70}",
            f"{status_icon} Publication Ready: {self.is_publication_ready}",
            f"✓ Pass Rate: {self.validation_success_rate:.1f}%",
            f"❌ Products with errors: {self.products_with_errors}/{self.total_products}",
            f"⚠️  Products with warnings: {self.products_with_warnings}",
            f"📊 Error/Warning breakdown:",
            f"   - Total errors: {self.total_errors}",
            f"   - Total warnings: {self.total_warnings}",
        ]
        
        if self.error_categories:
            lines.append(f"   - Error categories:")
            for cat, count in sorted(self.error_categories.items(), key=lambda x: x[1], reverse=True):
                lines.append(f"      • {cat}: {count}")
        
        if self.warning_categories:
            lines.append(f"   - Warning categories:")
            for cat, count in sorted(self.warning_categories.items(), key=lambda x: x[1], reverse=True):
                lines.append(f"      • {cat}: {count}")
        
        lines.append(f"{'='*70}\n")
        return "\n".join(lines)


@contextmanager
def measure_scraping(brand: str, total_products: int):
    """Context manager to measure scraping performance"""
    metrics = ScrapingMetrics(brand=brand, total_products=total_products)
    
    try:
        yield metrics
    finally:
        metrics.end_time = datetime.utcnow()
        print(metrics.summary())


@contextmanager
def measure_operation(operation_name: str, logger: logging.Logger = None):
    """Context manager to measure operation duration"""
    if logger is None:
        logger = logging.getLogger(__name__)
    
    start_time = time.time()
    
    try:
        yield
    finally:
        duration = time.time() - start_time
        logger.info(
            f"Operation completed: {operation_name}",
            extra={
                "extra_fields": {
                    "operation": operation_name,
                    "duration_seconds": round(duration, 3),
                    "duration_ms": round(duration * 1000, 2)
                }
            }
        )
