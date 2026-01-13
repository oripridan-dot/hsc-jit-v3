"""Redis Pub/Sub Manager for multi-instance WebSocket scaling."""

import redis.asyncio as aioredis
import logging
from typing import Set, Optional, AsyncGenerator
import json

logger = logging.getLogger(__name__)


class RedisPubSubManager:
    """Centralized Redis Pub/Sub for stateless, multi-instance deployment"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis: Optional[aioredis.Redis] = None
        self.pubsub: Optional[aioredis.client.PubSub] = None
        self.channels: Set[str] = set()

    async def connect(self):
        """Initialize Redis connection pool with pooling configuration"""
        try:
            self.redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=50,  # Connection pooling
                socket_keepalive=True,
            )
            self.pubsub = self.redis.pubsub()
            logger.info("Redis Pub/Sub connected successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def subscribe(self, channel: str):
        """Subscribe to a channel"""
        if self.pubsub:
            await self.pubsub.subscribe(channel)
            self.channels.add(channel)
            logger.debug(f"Subscribed to channel: {channel}")

    async def unsubscribe(self, channel: str):
        """Unsubscribe from a channel"""
        if self.pubsub and channel in self.channels:
            await self.pubsub.unsubscribe(channel)
            self.channels.discard(channel)
            logger.debug(f"Unsubscribed from channel: {channel}")

    async def publish(self, channel: str, message: dict) -> int:
        """Publish message to channel (broadcasts to all instances)"""
        if not self.redis:
            logger.error("Redis not connected")
            return 0

        try:
            message_str = (
                json.dumps(message)
                if isinstance(message, dict)
                else message
            )
            num_subscribers = await self.redis.publish(channel, message_str)
            return num_subscribers
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            return 0

    async def listen(self) -> AsyncGenerator[dict, None]:
        """Async generator for incoming Pub/Sub messages"""
        if not self.pubsub:
            return

        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    yield message
        except Exception as e:
            logger.error(f"Error listening to Pub/Sub: {e}")

    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis"""
        if not self.redis:
            return None
        try:
            return await self.redis.get(key)
        except Exception as e:
            logger.error(f"Failed to get key {key}: {e}")
            return None

    async def set(
        self, key: str, value: str, ttl: Optional[int] = None
    ) -> bool:
        """Set value in Redis with optional TTL"""
        if not self.redis:
            return False

        try:
            if ttl:
                await self.redis.setex(key, ttl, value)
            else:
                await self.redis.set(key, value)
            return True
        except Exception as e:
            logger.error(f"Failed to set key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        if not self.redis:
            return False

        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Failed to delete key {key}: {e}")
            return False

    async def ping(self) -> bool:
        """Check if Redis is alive"""
        if not self.redis:
            return False

        try:
            result = await self.redis.ping()
            return result is True
        except Exception:
            return False

    async def disconnect(self):
        """Gracefully close Redis connection"""
        if self.pubsub:
            await self.pubsub.unsubscribe(*self.channels)
            await self.pubsub.close()
        if self.redis:
            await self.redis.close()
        logger.info("Redis connection closed")
