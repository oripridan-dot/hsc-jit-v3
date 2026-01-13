"""Background task queue using Celery for heavy operations."""

from celery import Celery, Task
from celery.signals import task_postrun, task_prerun
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "hsc_jit",
    broker="redis://localhost:6379/1",
    backend="redis://localhost:6379/2",
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 min hard limit
    task_soft_time_limit=25 * 60,  # 25 min soft limit
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)


class CallbackTask(Task):
    """Task base class with hooks"""

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning(f"Task {task_id} retrying after error: {exc}")

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f"Task {task_id} failed: {exc}")

    def on_success(self, result, task_id, args, kwargs):
        logger.info(f"Task {task_id} completed successfully")


celery_app.Task = CallbackTask


# ============ Task Definitions ============



@celery_app.task(bind=True)
def regenerate_product_cache(self) -> Dict[str, Any]:
    """
    Maintenance task: Regenerate product prediction cache.
    Scheduled to run daily at off-peak hours.
    
    Returns:
        Dictionary with cache regeneration status and metrics
    """
    try:
        logger.info("Regenerating product prediction cache")

        from app.services.sniffer import SnifferService
        from app.services.catalog import CatalogService
        from app.core.cache import get_cache

        catalog = CatalogService()
        sniffer = SnifferService(catalog)
        cache = get_cache()

        # Pre-warm cache with common searches
        common_brands = catalog.get_top_brands(limit=100)

        for brand in common_brands:
            sniffer.predict(brand.get("name", ""), limit=5)

        logger.info("Product cache regeneration completed")
        return {"status": "success", "brands_cached": len(common_brands)}

    except Exception as exc:
        logger.error(f"Error in regenerate_product_cache: {exc}")
        raise


# ============ Task Status and Monitoring ============


def get_task_status(task_id: str) -> dict:
    """Get status of a specific task"""
    from celery.result import AsyncResult

    result = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "state": result.state,
        "result": result.result if result.successful() else None,
        "error": str(result.info) if result.failed() else None,
    }


def get_active_tasks() -> list:
    """Get all active tasks"""
    inspector = celery_app.control.inspect()
    active = inspector.active()
    return active or {}
