"""
HSC JIT v3.3 - Backend Unified Router Service
Consolidates Explorer and PromptBar logic into a single intelligent routing system

Key Features:
- Unified query processing
- Smart context management
- Seamless product discovery
- Optimized caching strategy
"""

from typing import Dict, List, Optional, Literal
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import json
from fastapi import WebSocket
from redis import Redis
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class QueryIntent:
    """Analyzed query intent"""
    type: Literal['product_search', 'technical_question', 'comparison', 'troubleshooting']
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
    timestamp: float = field(default_factory=lambda: datetime.now().timestamp())


@dataclass
class ProcessingPipeline:
    """Processing stages for a query"""
    stage: Literal['analyze', 'predict', 'fetch', 'contextualize', 'generate', 'complete']
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
        context_service,
        llm_service,
        cache: Redis
    ):
        self.sniffer = sniffer_service
        self.catalog = catalog_service
        self.fetcher = fetcher_service
        self.context = context_service
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
            # Stage 1: Analyze Intent
            await self._send_progress(websocket, 'analyze', 0.1)
            intent = await self._analyze_intent(query)
            
            # Stage 2: Product Prediction (streaming results)
            await self._send_progress(websocket, 'predict', 0.2)
            products = await self._predict_products(query, websocket, filters)
            
            # Get or create session context
            context = self._get_or_create_context(
                session_id, query, intent, source
            )
            
            # Stage 3: Product Selection
            await self._send_progress(websocket, 'fetch', 0.4)
            selected_product = await self._select_product(
                context, products, websocket
            )
            
            if not selected_product:
                await websocket.send_json({
                    'type': 'error',
                    'message': 'No matching products found'
                })
                return
            
            # Stage 4: Fetch Manual Content
            await self._send_progress(websocket, 'contextualize', 0.5)
            manual_text = await self._fetch_manual(selected_product)
            
            # Stage 5: Build Context Window
            context_window = await self._build_context_window(
                context, selected_product, manual_text
            )
            
            # Notify frontend that context is ready
            await websocket.send_json({
                'type': 'context_ready',
                'data': {
                    'product': self._product_to_dict(selected_product),
                    'context_size': len(context_window)
                }
            })
            
            # Stage 6: Stream LLM Response
            await self._send_progress(websocket, 'generate', 0.7)
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
                    'session_id': session_id,
                    'product': self._product_to_dict(selected_product)
                }
            })
            
        except Exception as e:
            logger.error(f"Query processing error: {str(e)}", exc_info=True)
            await websocket.send_json({
                'type': 'error',
                'message': str(e)
            })
    
    # ========================================================================
    # PRIVATE METHODS - Processing Stages
    # ========================================================================
    
    async def _analyze_intent(self, query: str) -> QueryIntent:
        """Analyze query to determine intent and required context"""
        lower_query = query.lower()
        
        # Product search indicators
        if any(word in lower_query for word in ['show', 'find', 'search', 'list', 'get']):
            return QueryIntent(
                type='product_search',
                confidence=0.9,
                keywords=self._extract_keywords(query),
                requires_product_context=True
            )
        
        # Technical question indicators
        if any(word in lower_query for word in ['how', 'why', 'what', 'when', 'explain']):
            return QueryIntent(
                type='technical_question',
                confidence=0.85,
                keywords=self._extract_keywords(query),
                requires_product_context=True
            )
        
        # Comparison indicators
        if any(word in lower_query for word in ['vs', 'versus', 'compare', 'difference', 'better']):
            return QueryIntent(
                type='comparison',
                confidence=0.88,
                keywords=self._extract_keywords(query),
                requires_product_context=True
            )
        
        # Troubleshooting indicators
        if any(word in lower_query for word in ['fix', 'broken', 'error', 'issue', 'problem', 'not working']):
            return QueryIntent(
                type='troubleshooting',
                confidence=0.92,
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
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
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
        
        async for prediction in self.sniffer.predict_streaming(query, filters):
            product = ProductMatch(
                id=prediction['id'],
                name=prediction['name'],
                brand=prediction['brand'],
                score=prediction['score'],
                category=prediction.get('category', 'Unknown'),
                manual_url=prediction.get('manual_url'),
                image_url=prediction.get('image_url')
            )
            products.append(product)
            
            # Stream prediction to frontend
            await websocket.send_json({
                'type': 'predictions',
                'data': {
                    'products': [self._product_to_dict(p) for p in products]
                }
            })
        
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
        # Check cache first
        cache_key = f"manual:{product.id}"
        cached = self.cache.get(cache_key)
        
        if cached:
            logger.info(f"Cache HIT for {product.name}")
            return cached.decode('utf-8')
        
        # Fetch from source
        logger.info(f"Cache MISS for {product.name}, fetching...")
        manual_text = await self.fetcher.fetch_manual(product.manual_url)
        
        # Cache for 24 hours
        self.cache.setex(cache_key, 86400, manual_text)
        
        return manual_text
    
    async def _build_context_window(
        self,
        context: QueryContext,
        product: ProductMatch,
        manual_text: str
    ) -> str:
        """Build optimized context window for LLM"""
        return await self.context.build_window(
            query=context.query,
            product=product,
            manual_text=manual_text,
            conversation_history=context.conversation_history,
            intent=context.intent.type
        )
    
    async def _stream_llm_response(
        self,
        context_window: str,
        query: str
    ):
        """Stream LLM response chunks"""
        async for chunk in self.llm.stream_response(context_window, query):
            yield chunk
    
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
        """Get existing or create new query context"""
        if session_id not in self.sessions:
            self.sessions[session_id] = QueryContext(
                query=query,
                intent=intent,
                source=source
            )
        else:
            # Update existing context with new query
            ctx = self.sessions[session_id]
            ctx.query = query
            ctx.intent = intent
            ctx.timestamp = datetime.now().timestamp()
        
        return self.sessions[session_id]
    
    def update_selected_product(
        self,
        session_id: str,
        product: ProductMatch
    ):
        """Update selected product for session"""
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
        """Send processing progress update"""
        await websocket.send_json({
            'type': 'progress',
            'data': {
                'stage': stage,
                'progress': progress
            }
        })
    
    def _product_to_dict(self, product: ProductMatch) -> Dict:
        """Convert ProductMatch to dictionary"""
        return {
            'id': product.id,
            'name': product.name,
            'brand': product.brand,
            'score': product.score,
            'category': product.category,
            'manual_url': product.manual_url,
            'image_url': product.image_url
        }


# ============================================================================
# WEBSOCKET ENDPOINT INTEGRATION
# ============================================================================

async def handle_unified_websocket(
    websocket: WebSocket,
    router: UnifiedQueryRouter
):
    """
    Unified WebSocket handler for both Explorer and PromptBar
    """
    await websocket.accept()
    session_id = str(id(websocket))
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data['type'] == 'query':
                await router.process_query(
                    query=data['query'],
                    websocket=websocket,
                    session_id=session_id,
                    source=data.get('source', 'promptbar'),
                    filters=data.get('filters')
                )
            
            elif data['type'] == 'select_product':
                product = ProductMatch(**data['product'])
                router.update_selected_product(session_id, product)
            
            elif data['type'] == 'sync_state':
                # Handle state synchronization
                pass
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        if session_id in router.sessions:
            del router.sessions[session_id]
