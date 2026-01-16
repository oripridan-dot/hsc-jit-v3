"""Structured JSON logging for production deployment and ELK integration."""

import logging
import json
from datetime import datetime
from typing import Any, Dict
import sys

# Standard format for structured logs
JSON_LOG_FORMAT = json.dumps(
    {
        "timestamp": "%(asctime)s",
        "service": "hsc-jit-backend",
        "level": "%(levelname)s",
        "logger": "%(name)s",
        "message": "%(message)s",
    }
)


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logs"""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "service": "hsc-jit-backend",
        }

        # Include exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Include any extra fields passed via record
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        return json.dumps(log_data)


class StructuredLogger:
    """Wrapper for structured logging with context"""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.context: Dict[str, Any] = {}

    def set_context(self, **kwargs):
        """Set context fields for all subsequent logs"""
        self.context.update(kwargs)

    def clear_context(self):
        """Clear context"""
        self.context.clear()

    def _add_context(self, extra: Dict[str, Any]) -> Dict[str, Any]:
        """Merge context with extra fields"""
        merged = {**self.context, **extra}
        return {"extra": merged} if merged else {}

    def debug(self, message: str, **context):
        """Log debug message"""
        extra = self._add_context(context)
        self.logger.debug(message, extra=extra.get("extra", {}))

    def info(self, message: str, **context):
        """Log info message"""
        extra = self._add_context(context)
        self.logger.info(message, extra=extra.get("extra", {}))

    def warning(self, message: str, **context):
        """Log warning message"""
        extra = self._add_context(context)
        self.logger.warning(message, extra=extra.get("extra", {}))

    def error(self, message: str, **context):
        """Log error message"""
        extra = self._add_context(context)
        self.logger.error(message, extra=extra.get("extra", {}))

    def critical(self, message: str, **context):
        """Log critical message"""
        extra = self._add_context(context)
        self.logger.critical(message, extra=extra.get("extra", {}))


def setup_structured_logging(
    service_name: str = "hsc-jit-backend", level: str = "INFO"
) -> None:
    """
    Configure structured JSON logging for the application.
    Should be called at startup.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))

    # Console handler with structured formatter
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(
        StructuredFormatter()
    )
    root_logger.addHandler(console_handler)

    # Log startup
    logger = logging.getLogger(__name__)
    logger.info(
        json.dumps(
            {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "service": service_name,
                "level": "INFO",
                "message": "Structured logging configured",
                "log_level": level,
            }
        )
    )


def get_logger(name: str) -> StructuredLogger:
    """Get a structured logger instance"""
    return StructuredLogger(name)
