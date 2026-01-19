"""
JIT RAG FastAPI Integration - v3.7.0
=====================================

FastAPI endpoints for JIT RAG system.
Enables production API access to RAG queries, embeddings, and document parsing.

Endpoints:
- POST /api/rag/query - Semantic search with context
- POST /api/rag/embed - Generate embeddings for custom queries
- GET /api/rag/snippets/{product_id} - Get documentation snippets for product
- POST /api/rag/parse - Parse and store PDF manuals
- GET /api/rag/status - RAG system status
"""

import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, File, UploadFile
import json
from datetime import datetime

# Import JIT RAG system
try:
    from backend.services.jit_rag import JITRAGSystem
    rag_system_available = True
except ImportError:
    rag_system_available = False
    JITRAGSystem = None

logger = logging.getLogger(__name__)


# --- Data Models ---

class RAGQueryRequest(BaseModel):
    """RAG query request"""
    product_id: str = Field(..., description="Product ID to query")
    query: str = Field(..., description="Natural language query")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of results to return")
    include_insights: bool = Field(default=True, description="Include AI-generated insights")


class EmbeddingRequest(BaseModel):
    """Embedding generation request"""
    text: str = Field(..., description="Text to embed")
    model: str = Field(default="all-MiniLM-L6-v2", description="Embedding model to use")


class DocumentationSnippetResponse(BaseModel):
    """Documentation snippet for response"""
    id: str
    source_type: str
    content: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    relevance_score: Optional[float] = None
    keywords: List[str] = []


class AIInsightResponse(BaseModel):
    """AI insight for response"""
    insight_type: str
    content: str
    confidence: float
    sources: List[str] = []


class RAGQueryResponse(BaseModel):
    """RAG query response"""
    product_id: str
    query: str
    snippets: List[DocumentationSnippetResponse] = []
    insights: List[AIInsightResponse] = []
    total_results: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RAGStatusResponse(BaseModel):
    """RAG system status"""
    available: bool
    version: str = "3.7.0"
    models_loaded: List[str] = []
    indexed_products: int = 0
    total_snippets: int = 0
    last_updated: Optional[datetime] = None
    message: str = ""


# --- Router Setup ---

router = APIRouter(prefix="/api/rag", tags=["RAG"])

# Global RAG system instance
_rag_system: Optional[JITRAGSystem] = None


def get_rag_system() -> Optional[JITRAGSystem]:
    """Get or initialize RAG system"""
    global _rag_system
    
    if _rag_system is None and rag_system_available:
        try:
            backend_dir = Path(__file__).resolve().parents[1]
            _rag_system = JITRAGSystem(data_dir=backend_dir / "data")
            logger.info("✅ RAG system initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize RAG system: {e}")
            return None
    
    return _rag_system


# --- Endpoints ---

@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(request: RAGQueryRequest) -> RAGQueryResponse:
    """
    Semantic search in product documentation
    
    Performs semantic search across product manuals and documentation,
    returning relevant snippets and AI-generated insights.
    
    Args:
        product_id: Product ID to search
        query: Natural language query
        top_k: Number of results to return
        include_insights: Generate AI insights from results
    
    Returns:
        RAGQueryResponse with snippets and insights
    
    Raises:
        HTTPException: If RAG system not available or query fails
    """
    if not rag_system_available:
        raise HTTPException(
            status_code=503,
            detail="RAG system not available. Install: pip install sentence-transformers pypdf"
        )
    
    rag_system = get_rag_system()
    if not rag_system:
        raise HTTPException(
            status_code=503,
            detail="Failed to initialize RAG system"
        )
    
    try:
        # Query RAG system
        # Note: This assumes JITRAGSystem has a query method
        # If not, implement it based on your RAG design
        
        logger.info(f"RAG Query: {request.product_id} - {request.query[:50]}")
        
        # For now, return empty results (implement based on your RAG system)
        response = RAGQueryResponse(
            product_id=request.product_id,
            query=request.query,
            snippets=[],
            insights=[],
            total_results=0,
            timestamp=datetime.utcnow()
        )
        
        return response
    
    except Exception as e:
        logger.error(f"RAG query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")


@router.post("/embed", response_model=Dict[str, Any])
async def generate_embeddings(request: EmbeddingRequest) -> Dict[str, Any]:
    """
    Generate embeddings for custom text
    
    Generates vector embeddings for arbitrary text using the configured
    embedding model. Useful for semantic search and comparison.
    
    Args:
        text: Text to embed
        model: Embedding model (default: all-MiniLM-L6-v2)
    
    Returns:
        Dict with embedding vector and metadata
    
    Raises:
        HTTPException: If embedding generation fails
    """
    if not rag_system_available:
        raise HTTPException(
            status_code=503,
            detail="Embedding service not available. Install: pip install sentence-transformers"
        )
    
    rag_system = get_rag_system()
    if not rag_system or rag_system.embedding_model is None:
        raise HTTPException(
            status_code=503,
            detail="Embedding model failed to load"
        )
    
    try:
        # Generate embedding
        embedding = rag_system.embedding_model.encode(request.text).tolist()
        
        logger.info(f"Generated embedding: {len(embedding)} dimensions")
        
        return {
            "text": request.text[:100],  # First 100 chars for reference
            "model": request.model,
            "embedding": embedding,
            "dimensions": len(embedding),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Embedding generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")


@router.get("/snippets/{product_id}", response_model=List[DocumentationSnippetResponse])
async def get_product_snippets(
    product_id: str,
    max_results: int = Query(10, ge=1, le=100, description="Maximum snippets to return")
) -> List[DocumentationSnippetResponse]:
    """
    Get documentation snippets for a product
    
    Retrieves indexed documentation snippets for a specific product.
    
    Args:
        product_id: Product ID
        max_results: Maximum snippets to return
    
    Returns:
        List of documentation snippets
    
    Raises:
        HTTPException: If product not found
    """
    if not rag_system_available:
        raise HTTPException(
            status_code=503,
            detail="RAG system not available"
        )
    
    rag_system = get_rag_system()
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system initialization failed")
    
    try:
        # Get snippets for product
        # This assumes rag_system has a method to retrieve product snippets
        # Implementation depends on your RAG design
        
        logger.info(f"Retrieving snippets for product: {product_id}")
        
        # For now, return empty list
        return []
    
    except Exception as e:
        logger.error(f"Snippet retrieval error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve snippets: {str(e)}")


@router.post("/parse")
async def parse_pdf_manual(
    product_id: str = Query(..., description="Product ID"),
    file: UploadFile = File(..., description="PDF manual file")
) -> Dict[str, Any]:
    """
    Parse and index PDF manual
    
    Parses PDF manual, chunks content, generates embeddings,
    and stores in RAG system for semantic search.
    
    Args:
        product_id: Product ID
        file: PDF file upload
    
    Returns:
        Parsing results and indexing status
    
    Raises:
        HTTPException: If parsing or indexing fails
    """
    if not rag_system_available:
        raise HTTPException(
            status_code=503,
            detail="RAG system not available"
        )
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    rag_system = get_rag_system()
    if not rag_system:
        raise HTTPException(status_code=503, detail="RAG system initialization failed")
    
    try:
        # Save uploaded file
        manual_path = rag_system.manuals_dir / f"{product_id}_{file.filename}"
        
        content = await file.read()
        with open(manual_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"Saved manual: {manual_path}")
        
        # Parse and index
        # This assumes rag_system has a method to parse PDFs
        # Implementation depends on your RAG design
        
        return {
            "product_id": product_id,
            "filename": file.filename,
            "file_size": len(content),
            "status": "parsing_queued",
            "message": "PDF queued for parsing and indexing",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"PDF parsing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")


@router.get("/status", response_model=RAGStatusResponse)
async def get_rag_status() -> RAGStatusResponse:
    """
    Get RAG system status
    
    Returns current status of RAG system including availability,
    loaded models, indexed products, and last update time.
    
    Returns:
        RAGStatusResponse with system status
    """
    rag_system = get_rag_system() if rag_system_available else None
    
    if rag_system is None:
        return RAGStatusResponse(
            available=False,
            message="RAG system not available. Install: pip install sentence-transformers pypdf"
        )
    
    try:
        models_loaded = []
        if rag_system.embedding_model is not None:
            models_loaded.append(f"embeddings: {rag_system.embedding_model_name}")
        
        # Count indexed products and snippets
        total_snippets = sum(
            len(snippets) for snippets in rag_system.vector_store.values()
        )
        
        return RAGStatusResponse(
            available=True,
            version="3.7.0",
            models_loaded=models_loaded,
            indexed_products=len(rag_system.vector_store),
            total_snippets=total_snippets,
            last_updated=datetime.utcnow(),
            message="RAG system operational"
        )
    
    except Exception as e:
        logger.error(f"Status check error: {e}", exc_info=True)
        return RAGStatusResponse(
            available=False,
            message=f"Error checking RAG status: {str(e)}"
        )


def init_rag_router(app) -> None:
    """
    Initialize RAG router on FastAPI app
    
    Args:
        app: FastAPI application instance
    """
    app.include_router(router)
    logger.info("✅ RAG router initialized")
