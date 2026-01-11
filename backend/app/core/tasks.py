"""Background task queue using Celery for heavy operations."""

from celery import Celery, Task
from celery.signals import task_postrun, task_prerun
import logging
from typing import Optional, Dict, Any

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


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def prefetch_manual(
    self,
    product_id: str,
    manual_url: str,
    session_id: Optional[str] = None,
) -> dict:
    """
    Background task: Download and index PDF manual.
    Triggered when user types product name with high confidence.
    """
    try:
        logger.info(
            f"Starting prefetch_manual for product {product_id}",
            extra={"product_id": product_id, "session_id": session_id},
        )

        # Import here to avoid circular dependencies
        from app.services.fetcher import ContentFetcher
        from app.services.rag import EphemeralRAG

        # Fetch PDF
        fetcher = ContentFetcher()
        content = fetcher.fetch_pdf_sync(manual_url)

        if not content:
            logger.warning(f"Failed to fetch PDF from {manual_url}")
            return {"status": "error", "reason": "fetch_failed"}

        # Index in RAG system
        rag = EphemeralRAG()
        rag.index_document(product_id, content, session_id=session_id)

        logger.info(f"Successfully prefetched manual for {product_id}")
        return {"status": "success", "product_id": product_id, "size": len(content)}

    except Exception as exc:
        logger.error(f"Error in prefetch_manual: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=min(60 * (2 ** self.request.retries), 300))


@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def index_large_document(
    self,
    product_id: str,
    content: str,
    session_id: Optional[str] = None,
) -> dict:
    """
    Background task: Index large document content.
    Called for documents > 10MB.
    """
    try:
        logger.info(
            f"Indexing large document for {product_id}",
            extra={"content_size": len(content), "session_id": session_id},
        )

        from app.services.rag import EphemeralRAG

        rag = EphemeralRAG()
        rag.index_document(product_id, content, session_id=session_id)

        logger.info(f"Indexed document for {product_id}")
        return {"status": "success", "product_id": product_id}

    except Exception as exc:
        logger.error(f"Error in index_large_document: {exc}")
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(bind=True)
def cleanup_old_sessions(self, max_age_hours: int = 24) -> Dict[str, Any]:
    """
    Maintenance task: Clean up old RAG sessions.
    Scheduled to run daily.
    
    Args:
        max_age_hours: Maximum age in hours for sessions to keep
        
    Returns:
        Dictionary with cleanup status and metrics
    """
    try:
        logger.info(f"Cleaning up sessions older than {max_age_hours} hours")

        from app.core.redis_manager import get_redis_client
        import time
        
        redis_client = get_redis_client()
        if not redis_client:
            logger.warning("Redis not available, skipping cleanup")
            return {"status": "skipped", "reason": "redis_unavailable"}
        
        # Find all session keys
        session_pattern = "rag_session:*"
        cursor = 0
        sessions_deleted = 0
        sessions_kept = 0
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        while True:
            cursor, keys = redis_client.scan(cursor, match=session_pattern, count=100)
            
            for key in keys:
                try:
                    # Get session metadata
                    ttl = redis_client.ttl(key)
                    
                    # If TTL is -1 (no expiration) or key is very old
                    if ttl == -1:
                        # Check if we have timestamp in the key or data
                        redis_client.delete(key)
                        sessions_deleted += 1
                    elif ttl > 0 and ttl < (86400 - max_age_seconds):
                        # Key will expire soon enough
                        sessions_kept += 1
                except Exception as e:
                    logger.error(f"Error processing key {key}: {e}")
                    
            if cursor == 0:
                break
        
        logger.info(
            "Session cleanup completed",
            extra={
                "sessions_deleted": sessions_deleted,
                "sessions_kept": sessions_kept,
                "max_age_hours": max_age_hours
            }
        )
        return {
            "status": "success",
            "sessions_deleted": sessions_deleted,
            "sessions_kept": sessions_kept
        }

    except Exception as exc:
        logger.error(f"Error in cleanup_old_sessions: {exc}")
        raise


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
