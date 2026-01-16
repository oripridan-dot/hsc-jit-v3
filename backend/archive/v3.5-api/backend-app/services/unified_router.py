"""
HSC JIT v3.4 - Backend Unified Router Service
Consolidates Explorer and PromptBar logic into a single intelligent routing system

Key Features:
- Unified query processing
- Smart context management  
- Seamless product discovery
- Optimized caching strategy
- Real-time streaming predictions
- LLM-powered responses
"""

from typing import Dict, List, Optional, Literal, AsyncGenerator
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class QueryIntent:
    """Analyzed query intent"""
    type: Literal['product_search', 'technical_question',
                  'comparison', 'troubleshooting']
    confidence: float
    keywords: List[str]
    requires_product_context: bool = False


@dataclass
class ProductMatch:
    """Product match result"""
    id: str
    name: str
    brand: str
    score: float
    category: str
    manual_url: Optional[str] = None
    image_url: Optional[str] = None
    cached_content: Optional[str] = None


@dataclass
class QueryContext:
    """Complete query context"""
    query: str
    intent: QueryIntent
    selected_product: Optional[ProductMatch] = None
    conversation_history: List[Dict] = field(default_factory=list)
    source: Literal['explorer', 'promptbar'] = 'promptbar'
    timestamp: float = field(
        default_factory=lambda: datetime.now().timestamp())


@dataclass
class ProcessingPipeline:
    """Processing stages for a query"""
    stage: Literal['analyze', 'predict', 'fetch',
                   'contextualize', 'generate', 'complete']
    progress: float
    metadata: Dict = field(default_factory=dict)


# ============================================================================
# UNIFIED QUERY ROUTER
# ============================================================================

class UnifiedQueryRouter:
    """
    Central routing engine that processes all queries regardless of source
    Ensures Explorer and PromptBar behave as two views of the same tool
    """

    def __init__(
        self,
        sniffer_service,
        catalog_service,
        fetcher_service,
        llm_service,
        cache
    ):
        self.sniffer = sniffer_service
        self.catalog = catalog_service
        self.fetcher = fetcher_service
        self.llm = llm_service
        self.cache = cache

        # Active sessions
        self.sessions: Dict[str, QueryContext] = {}

    async def process_query(
        self,
        query: str,
        websocket: WebSocket,
        session_id: str,
        source: Literal['explorer', 'promptbar'],
        filters: Optional[Dict] = None
    ) -> None:
        """
        Main processing pipeline - unified for both Explorer and PromptBar

        Flow:
        1. Analyze intent
        2. Predict products (streaming)
        3. Select best match OR use user selection
        4. Fetch manual content
        5. Build context window
        6. Stream LLM response
        """
        try:
            # Stage 1: Analyze Intent (10%)
            await self._send_progress(websocket, 'analyze', 0.1)
            intent = await self._analyze_intent(query)

            context = self._get_or_create_context(
                session_id, query, intent, source)

            # Stage 2: Predict Products (30%)
            await self._send_progress(websocket, 'predict', 0.3)
            products = await self._predict_products(query, websocket, filters)

            if not products and intent.requires_product_context:
                await websocket.send_json({
                    'type': 'error',
                    'data': {
                        'message': 'No matching products found. Please try a different query.'
                    }
                })
                return

            # Stage 3: Select Product (50%)
            await self._send_progress(websocket, 'fetch', 0.5)
            selected_product = await self._select_product(context, products, websocket)

            if not selected_product and intent.requires_product_context:
                await websocket.send_json({
                    'type': 'error',
                    'data': {
                        'message': 'Could not determine product. Please select one manually.'
                    }
                })
                return

            # Update context with selected product
            context.selected_product = selected_product
            self.sessions[session_id] = context

            # Stage 4: Fetch Manual (70%)
            await self._send_progress(websocket, 'contextualize', 0.7)
            manual_text = ""
            if selected_product and selected_product.manual_url:
                manual_text = await self._fetch_manual(selected_product)

            # Stage 5: Build Context Window (80%)
            await self._send_progress(websocket, 'generate', 0.8)
            context_window = await self._build_context_window(context, selected_product, manual_text)

            # Stage 6: Stream LLM Response (90-100%)
            async for chunk in self._stream_llm_response(context_window, query):
                await websocket.send_json({
                    'type': 'llm_stream',
                    'data': {'chunk': chunk}
                })

            # Stage 7: Complete
            await self._send_progress(websocket, 'complete', 1.0)
            await websocket.send_json({
                'type': 'complete',
                'data': {
                    'query': query,
                    'product': self._product_to_dict(selected_product) if selected_product else None,
                    'source': source
                }
            })

        except Exception as e:
            logger.error(f"Error processing query: {e}", exc_info=True)
            await websocket.send_json({
                'type': 'error',
                'data': {'message': f'Error processing query: {str(e)}'}
            })

    # ========================================================================
    # PRIVATE METHODS - Processing Stages
    # ========================================================================

    async def _analyze_intent(self, query: str) -> QueryIntent:
        """Analyze query to determine intent and required context"""
        lower_query = query.lower()
        # Troubleshooting indicators (highest priority for fix/repair)
        if any(word in lower_query for word in ['fix', 'broken', 'error', 'issue', 'problem', 'not working', 'repair', 'troubleshoot', 'help']):
            return QueryIntent(
                type='troubleshooting',
                confidence=0.95,
                keywords=self._extract_keywords(query),
                requires_product_context=True
            )

        # Comparison indicators
        if any(word in lower_query for word in ['vs', 'versus', 'compare', 'difference', 'better']):
            return QueryIntent(
                type='comparison',
                confidence=0.9,
                keywords=self._extract_keywords(query),
                requires_product_context=True
            )

        # Product search indicators
        if any(word in lower_query for word in ['show', 'find', 'search', 'list', 'get']):
            return QueryIntent(
                type='product_search',
                confidence=0.9,
                keywords=self._extract_keywords(query),
                requires_product_context=False
            )

        # Technical question indicators
        if any(word in lower_query for word in ['how', 'why', 'what', 'when', 'explain']):
            return QueryIntent(
                type='technical_question',
                confidence=0.85,
                keywords=self._extract_keywords(query),
                requires_product_context=True
            )

        # Default to technical question
        return QueryIntent(
            type='technical_question',
            confidence=0.5,
            keywords=self._extract_keywords(query),
            requires_product_context=True
        )

    def _extract_keywords(self, query: str) -> List[str]:
        """Extract meaningful keywords from query"""
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in',
                      'on', 'at', 'to', 'for', 'how', 'why', 'what', 'when'}
        words = query.lower().split()
        return [w for w in words if len(w) > 2 and w not in stop_words]

    async def _predict_products(
        self,
        query: str,
        websocket: WebSocket,
        filters: Optional[Dict]
    ) -> List[ProductMatch]:
        """Stream product predictions as they arrive"""
        products = []

        # Use sniffer to predict products
        predictions = self.sniffer.predict(query, limit=10)

        # Apply filters if provided
        if filters:
            if filters.get('brand'):
                predictions = [p for p in predictions if p.get(
                    'brand', '').lower() == filters['brand'].lower()]
            if filters.get('category'):
                predictions = [p for p in predictions if p.get(
                    'category', '').lower() == filters['category'].lower()]

        # Stream predictions to frontend
        for pred in predictions:
            product = ProductMatch(
                id=pred.get('id', ''),
                name=pred.get('name', ''),
                brand=pred.get('brand', ''),
                score=pred.get('score', 0.0),
                category=pred.get('category', ''),
                manual_url=pred.get('manual_url'),
                image_url=pred.get('image_url')
            )
            products.append(product)

            # Send prediction immediately
            await websocket.send_json({
                'type': 'predictions',
                'data': {
                    'products': [self._product_to_dict(product)],
                    'total': len(predictions)
                }
            })

            # Small delay to avoid overwhelming the client
            await asyncio.sleep(0.05)

        return products

    async def _select_product(
        self,
        context: QueryContext,
        products: List[ProductMatch],
        websocket: WebSocket
    ) -> Optional[ProductMatch]:
        """Select best product based on context and scores"""
        if not products:
            return None

        # If user has already selected a product in this session, use it
        if context.selected_product:
            return context.selected_product

        # Otherwise, use highest scoring product
        best_product = max(products, key=lambda p: p.score)

        # Notify frontend of auto-selection
        await websocket.send_json({
            'type': 'product_selected',
            'data': {
                'product': self._product_to_dict(best_product),
                'auto_selected': True
            }
        })

        return best_product

    async def _fetch_manual(self, product: ProductMatch) -> str:
        """Fetch and cache manual content"""
        if not product.manual_url:
            return ""

        # Check cache first
        cache_key = f"manual:{product.id}"
        cached = self.cache.get(cache_key)

        if cached:
            logger.info(f"Cache HIT for {product.name}")
            return cached.decode('utf-8') if isinstance(cached, bytes) else cached

        # Fetch from source
        logger.info(f"Cache MISS for {product.name}, fetching...")
        try:
            manual_text = await self.fetcher.fetch_manual(product.manual_url)

            # Cache for 24 hours
            self.cache.setex(cache_key, 86400, manual_text)

            return manual_text
        except Exception as e:
            logger.error(f"Error fetching manual for {product.name}: {e}")
            return ""

    async def _build_context_window(
        self,
        context: QueryContext,
        product: Optional[ProductMatch],
        manual_text: str
    ) -> str:
        """Build optimized context window for LLM"""
        context_parts = []

        # Add product information
        if product:
            context_parts.append(f"Product: {product.name} by {product.brand}")
            context_parts.append(f"Category: {product.category}")

        # Add relevant manual excerpts (limit to 4000 chars)
        if manual_text:
            # Simple relevance: extract sections containing query keywords
            relevant_sections = []
            for keyword in context.intent.keywords:
                for line in manual_text.split('\n'):
                    if keyword in line.lower() and line not in relevant_sections:
                        relevant_sections.append(line)

            if relevant_sections:
                context_parts.append("Relevant Manual Sections:")
                # Limit to 20 lines
                context_parts.append('\n'.join(relevant_sections[:20]))

        # Add conversation history (last 3 exchanges)
        if context.conversation_history:
            context_parts.append("\nConversation History:")
            for exchange in context.conversation_history[-3:]:
                context_parts.append(f"Q: {exchange.get('query', '')}")
                context_parts.append(
                    f"A: {exchange.get('response', '')[:200]}...")

        return '\n\n'.join(context_parts)

    async def _stream_llm_response(
        self,
        context_window: str,
        query: str
    ) -> AsyncGenerator[str, None]:
        """Stream LLM response chunks"""
        prompt = f"""You are a technical support assistant. Use the following context to answer the user's question accurately and concisely.

Context:
{context_window}

User Question: {query}

Provide a helpful, accurate answer based on the context above. If the context doesn't contain enough information, say so clearly."""

        stream = self.llm.stream_response(prompt)

        # If coroutine, await to get the actual stream
        if asyncio.iscoroutine(stream):
            stream = await stream

        # Handle async generator
        if hasattr(stream, '__aiter__'):
            async for chunk in stream:
                yield chunk
        else:
            # Fallbacks for test doubles: list/iterable or single string
            try:
                for chunk in stream:  # synchronous iterable
                    yield chunk
            except TypeError:
                if isinstance(stream, str):
                    yield stream
                else:
                    # No chunks available
                    return

    # ========================================================================
    # SESSION MANAGEMENT
    # ========================================================================

    def _get_or_create_context(
        self,
        session_id: str,
        query: str,
        intent: QueryIntent,
        source: Literal['explorer', 'promptbar']
    ) -> QueryContext:
        """Get existing context or create new one"""
        if session_id in self.sessions:
            context = self.sessions[session_id]
            # Update with new query
            context.query = query
            context.intent = intent
            context.source = source
            context.timestamp = datetime.now().timestamp()
            return context

        # Create new context
        context = QueryContext(
            query=query,
            intent=intent,
            source=source
        )
        self.sessions[session_id] = context
        return context

    def update_selected_product(
        self,
        session_id: str,
        product: ProductMatch
    ):
        """Update selected product in session context"""
        if session_id in self.sessions:
            self.sessions[session_id].selected_product = product

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    async def _send_progress(
        self,
        websocket: WebSocket,
        stage: str,
        progress: float
    ):
        """Send progress update to frontend"""
        await websocket.send_json({
            'type': 'progress',
            'data': {
                'stage': stage,
                'progress': progress
            }
        })

    def _product_to_dict(self, product: Optional[ProductMatch]) -> Optional[Dict]:
        """Convert ProductMatch to dictionary"""
        if not product:
            return None

        return {
            'id': product.id,
            'name': product.name,
            'brand': product.brand,
            'score': product.score,
            'category': product.category,
            'manual_url': product.manual_url,
            'image_url': product.image_url
        }
