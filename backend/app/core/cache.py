"""Multi-layer caching system: L1 (Memory LRU) → L2 (Redis)"""

from functools import wraps
import hashlib
import pickle
import logging
from typing import Optional, Callable, Any, Dict
from collections import OrderedDict

logger = logging.getLogger(__name__)


class MultiLayerCache:
    """Three-tier cache: L1 (Memory LRU) → L2 (Redis) → Miss"""

    def __init__(self, l1_max_size: int = 1000):
        self.l1_cache: OrderedDict = OrderedDict()  # LRU cache
        self.l1_max_size = l1_max_size
        self.redis = None  # Set by dependency injection
        self.hits = 0
        self.misses = 0

    def set_redis(self, redis_client):
        """Inject Redis client"""
        self.redis = redis_client

    @staticmethod
    def _generate_key(func_name: str, *args, **kwargs) -> str:
        """Deterministic cache key from function and arguments"""
        # Hash to keep key length reasonable
        key_data = f"{func_name}:{str(args)}:{str(sorted(kwargs.items()))}"
        return hashlib.sha256(key_data.encode()).hexdigest()

    async def get(self, key: str) -> Optional[Any]:
        """Retrieve from L1, then L2, return None on miss"""
        # L1: Check memory (instant, no await needed)
        if key in self.l1_cache:
            self.l1_cache.move_to_end(key)  # Mark as recently used
            self.hits += 1
            logger.debug(f"L1 cache hit for {key}")
            return self.l1_cache[key]

        # L2: Check Redis (~1-5ms)
        if self.redis:
            try:
                cached = await self.redis.get(f"cache:{key}")
                if cached:
                    value = pickle.loads(cached)
                    # Promote to L1
                    self._put_l1(key, value)
                    self.hits += 1
                    logger.debug(f"L2 cache hit for {key}")
                    return value
            except Exception as e:
                logger.warning(f"L2 cache retrieval failed: {e}")

        self.misses += 1
        return None

    async def set(
        self, key: str, value: Any, ttl: int = 3600
    ) -> None:
        """Write to L1 and L2"""
        # L1: Immediate (memory)
        self._put_l1(key, value)

        # L2: Persistent with TTL (Redis)
        if self.redis:
            try:
                await self.redis.setex(
                    f"cache:{key}", ttl, pickle.dumps(value)
                )
            except Exception as e:
                logger.warning(f"L2 cache write failed: {e}")

    def _put_l1(self, key: str, value: Any):
        """Put in L1 cache with LRU eviction"""
        self.l1_cache[key] = value
        self.l1_cache.move_to_end(key)

        # Evict LRU item if over capacity
        if len(self.l1_cache) > self.l1_max_size:
            removed_key, _ = self.l1_cache.popitem(last=False)
            logger.debug(f"L1 cache evicted {removed_key}")

    async def delete(self, key: str):
        """Delete from both L1 and L2"""
        # L1
        self.l1_cache.pop(key, None)

        # L2
        if self.redis:
            try:
                await self.redis.delete(f"cache:{key}")
            except Exception as e:
                logger.warning(f"L2 cache delete failed: {e}")

    async def clear(self):
        """Clear all caches"""
        self.l1_cache.clear()
        if self.redis:
            try:
                # Clear all cache: keys
                keys = await self.redis.keys("cache:*")
                if keys:
                    await self.redis.delete(*keys)
            except Exception as e:
                logger.warning(f"L2 cache clear failed: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache hit/miss statistics"""
        total = self.hits + self.misses
        hit_rate = (
            (self.hits / total * 100) if total > 0 else 0
        )
        return {
            "hits": self.hits,
            "misses": self.misses,
            "total": total,
            "hit_rate_percent": hit_rate,
            "l1_size": len(self.l1_cache),
            "l1_max_size": self.l1_max_size,
        }


# Global cache instance
_cache = MultiLayerCache()


def cached(ttl: int = 3600):
    """Decorator for automatic L1/L2 caching of async functions"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key = _cache._generate_key(func.__name__, *args, **kwargs)

            # Try cache first
            cached_value = await _cache.get(key)
            if cached_value is not None:
                return cached_value

            # Cache miss - execute function
            result = await func(*args, **kwargs)

            # Store in cache
            await _cache.set(key, result, ttl)

            return result

        return wrapper

    return decorator


def get_cache() -> MultiLayerCache:
    """Get the global cache instance"""
    return _cache
