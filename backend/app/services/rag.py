import os
import json
import logging
import redis
import hashlib
from typing import List, Dict, Any, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Feature flag
RAG_ENABLED = os.getenv("RAG_ENABLED", "false").lower() in {"1", "true", "yes", "on"}
RAG_MODEL_NAME = os.getenv("RAG_MODEL", "all-MiniLM-L6-v2")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Try to import heavy ML libraries
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    ML_AVAILABLE = True
except ImportError:
    logger.warning("⚠️  sentence-transformers or numpy not found. RAG will be disabled/mocked.")
    ML_AVAILABLE = False
    SentenceTransformer = None
    np = None

# Initialize Redis lazily based on feature flag
redis_client = None
if RAG_ENABLED:
    try:
        redis_client = redis.from_url(REDIS_URL, decode_responses=False)
    except Exception as e:
        logger.warning(f"⚠️  Redis not available for RAG: {e}")
        redis_client = None

class EphemeralRAG:
    def __init__(self):
        self.model = None
        self.enabled = False

        if not RAG_ENABLED:
            logger.info("RAG disabled via RAG_ENABLED flag. Skipping model/redis init.")
            return

        if not ML_AVAILABLE:
            logger.warning("RAG disabled: missing ML dependencies (sentence-transformers / numpy).")
            return

        if not redis_client:
            logger.warning("RAG disabled: Redis unavailable. Check REDIS_URL or service status.")
            return

        try:
            # Load a very small, fast model
            self.model = SentenceTransformer(RAG_MODEL_NAME)
            self.enabled = True
            logger.info(f"RAG enabled with model '{RAG_MODEL_NAME}'.")
        except Exception as e:
            logger.error(f"Failed to load RAG model '{RAG_MODEL_NAME}': {e}")
            self.model = None

    def index(self, session_id: str, content: str, chunk_size: int = 500) -> bool:
        """
        Chunks content, embeds it, and stores in Redis under session_id.
        """
        if not self.enabled or not self.model or not redis_client:
            return False
            
        # 1. Chunking (Simple sliding window or per sentence)
        chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]
        
        # 2. Embedding
        try:
            vectors = self.model.encode(chunks)
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return False
            
        # 3. Store in Redis
        # We store as a list of JSON objects: { "text": chunk, "vector": list(float) }
        # Or better: Store raw bytes or use a specialized Redis module.
        # Speedboat approach: JSON serialize the list of chunks+vectors.
        
        key = f"sess:{session_id}:vectors"
        data = []
        for text, vector in zip(chunks, vectors):
            data.append({
                "text": text,
                "vector": vector.tolist()
            })
            
        redis_client.setex(key, 600, json.dumps(data)) # 10 mins expiry
        return True

    def query(self, session_id: str, query_text: str, top_k: int = 3) -> str:
        """
        Retrieves relevant chunks for the query.
        """
        if not self.enabled or not self.model or not redis_client:
            return "" # Fail gracefully
            
        key = f"sess:{session_id}:vectors"
        cached_data = redis_client.get(key)
        
        if not cached_data:
            return ""
            
        knowledge_base = json.loads(cached_data)
        if not knowledge_base:
            return ""
            
        # Embed query
        query_vector = self.model.encode([query_text])[0]
        
        # Cosine Similarity
        scored_chunks = []
        for item in knowledge_base:
            doc_vector = item["vector"]
            # Manual cosine calc if needed or use simple dot product if normalized
            # Start strict:
            score = self._cosine_similarity(query_vector, doc_vector)
            scored_chunks.append((score, item["text"]))
            
        # Sort desc
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        
        # Return top K combined
        best_chunks = [chunk for score, chunk in scored_chunks[:top_k]]
        return "\n\n".join(best_chunks)

    def _cosine_similarity(self, v1, v2):
        if not np:
            return 0.0
        vec1 = np.array(v1)
        vec2 = np.array(v2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return np.dot(vec1, vec2) / (norm1 * norm2)
