"""
JIT RAG API Integration Module

Provides RAG capabilities integrated with the product catalog pipeline:
- Semantic search via embeddings
- Query answering with product context
- Document parsing and indexing
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

try:
    from sentence_transformers import SentenceTransformer, util
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False

try:
    import pypdf
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False


class JITRAGSystem:
    """Integrated RAG system for product discovery"""
    
    def __init__(self, catalog_data: Dict[str, Any]):
        """
        Initialize RAG system with catalog data.
        
        Args:
            catalog_data: ProductCatalog dictionary with products
        """
        self.catalog = catalog_data
        self.products = catalog_data.get("products", [])
        self.embeddings_model = None
        self.product_embeddings = None
        
        # Try to load embeddings model if available
        if EMBEDDINGS_AVAILABLE:
            try:
                self.embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
                self._build_product_index()
            except Exception as e:
                print(f"⚠️  Failed to load embeddings model: {e}")
    
    def _build_product_index(self):
        """Build embeddings index for all products"""
        if not self.embeddings_model or not self.products:
            return
        
        try:
            # Create searchable text from products
            texts = [
                f"{p.get('name', '')} {p.get('description', '')} {' '.join(p.get('tags', []))}".lower()
                for p in self.products
            ]
            
            # Generate embeddings
            self.product_embeddings = self.embeddings_model.encode(texts)
            print(f"✅ Built embeddings index for {len(self.products)} products")
        
        except Exception as e:
            print(f"❌ Failed to build embeddings index: {e}")
            self.product_embeddings = None
    
    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Semantic search across products using embeddings.
        
        Args:
            query: Natural language search query
            top_k: Number of results to return
        
        Returns:
            List of matching products with scores
        """
        if not self.embeddings_model or self.product_embeddings is None:
            return []
        
        try:
            # Encode query
            query_embedding = self.embeddings_model.encode(query)
            
            # Compute similarity
            similarities = util.pytorch_cos_sim(query_embedding, self.product_embeddings)[0]
            
            # Get top matches
            top_results = sorted(
                enumerate(similarities.cpu()),
                key=lambda x: x[1],
                reverse=True
            )[:top_k]
            
            # Build results with scores
            results = []
            for idx, score in top_results:
                if float(score) > 0.3:  # Confidence threshold
                    product = self.products[idx].copy()
                    product["_relevance_score"] = float(score)
                    results.append(product)
            
            return results
        
        except Exception as e:
            print(f"❌ Semantic search failed: {e}")
            return []
    
    def keyword_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Fallback keyword search when embeddings unavailable.
        
        Args:
            query: Search query
            top_k: Number of results
        
        Returns:
            List of matching products
        """
        query_lower = query.lower()
        matches = []
        
        for product in self.products:
            # Check multiple fields
            name_match = query_lower in product.get("name", "").lower()
            desc_match = query_lower in product.get("description", "").lower()
            tags_match = any(query_lower in tag.lower() for tag in product.get("tags", []))
            
            if name_match or desc_match or tags_match:
                matches.append(product)
            
            if len(matches) >= top_k:
                break
        
        return matches
    
    def generate_product_insights(self, product_id: str) -> Dict[str, Any]:
        """
        Generate AI insights for a product.
        
        Args:
            product_id: Product ID
        
        Returns:
            Dictionary with insights (features, use cases, etc.)
        """
        # Find product
        product = None
        for p in self.products:
            if p.get("id") == product_id:
                product = p
                break
        
        if not product:
            return {"error": "Product not found"}
        
        # Generate structured insights
        insights = {
            "product_id": product_id,
            "product_name": product.get("name"),
            "category": product.get("main_category"),
            "key_features": product.get("features", [])[:5],
            "specifications": {
                k: v for k, v in product.get("specifications", {}).items()
                if k in ["model_number", "color", "dimensions", "weight", "warranty"]
            },
            "use_cases": self._infer_use_cases(product),
            "related_tags": product.get("tags", [])[:5],
            "description_summary": (product.get("short_description") or product.get("description", ""))[:200] + "..."
        }
        
        return insights
    
    @staticmethod
    def _infer_use_cases(product: Dict[str, Any]) -> List[str]:
        """Infer use cases from product data"""
        use_cases = []
        
        # Simple keyword mapping
        keywords_to_uses = {
            "synthesizer": ["Music Production", "Live Performance", "Sound Design"],
            "drum": ["Drum & Bass", "EDM", "Percussion"],
            "keyboard": ["Piano Practice", "Live Performance", "Composition"],
            "amplifier": ["Guitar Amplification", "Sound Reinforcement"],
            "interface": ["Audio Recording", "Music Production", "Podcasting"],
            "mixer": ["Live Sound", "Studio Recording", "Audio Mixing"],
            "effect": ["Sound Design", "Music Production", "Live Performance"]
        }
        
        product_text = (product.get("name", "") + " " + product.get("description", "")).lower()
        
        for keyword, uses in keywords_to_uses.items():
            if keyword in product_text:
                use_cases.extend(uses)
        
        return list(set(use_cases))[:3]
    
    def extract_pdf_documentation(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract text from product manuals (PDF).
        
        Args:
            pdf_path: Path to PDF file
        
        Returns:
            Extracted text and metadata
        """
        if not PDF_SUPPORT:
            return {"error": "PDF support not available", "message": "Install pypdf"}
        
        try:
            with open(pdf_path, "rb") as f:
                pdf = pypdf.PdfReader(f)
                
                # Extract text
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
                
                # Extract metadata
                metadata = pdf.metadata or {}
                
                return {
                    "filename": Path(pdf_path).name,
                    "pages": len(pdf.pages),
                    "text": text[:5000],  # First 5000 chars
                    "metadata": {
                        "title": metadata.get("/Title", ""),
                        "author": metadata.get("/Author", ""),
                        "subject": metadata.get("/Subject", "")
                    }
                }
        
        except Exception as e:
            return {"error": str(e)}


# ============================================================================
# API Response Models
# ============================================================================

class RAGQueryRequest:
    """Request model for RAG queries"""
    def __init__(self, query: str, search_type: str = "semantic", limit: int = 5):
        self.query = query
        self.search_type = search_type  # semantic|keyword
        self.limit = limit


class RAGQueryResponse:
    """Response model for RAG queries"""
    def __init__(self, query: str, results: List[Dict], search_type: str):
        self.query = query
        self.results = results
        self.search_type = search_type
        self.result_count = len(results)
        self.timestamp = datetime.utcnow().isoformat()


# ============================================================================
# RAG System Status
# ============================================================================

def get_rag_status() -> Dict[str, Any]:
    """Get RAG system capabilities"""
    return {
        "embeddings_available": EMBEDDINGS_AVAILABLE,
        "pdf_support_available": PDF_SUPPORT,
        "capabilities": {
            "semantic_search": EMBEDDINGS_AVAILABLE,
            "keyword_search": True,
            "product_insights": True,
            "pdf_parsing": PDF_SUPPORT
        },
        "models": {
            "embeddings": "all-MiniLM-L6-v2" if EMBEDDINGS_AVAILABLE else None
        }
    }
