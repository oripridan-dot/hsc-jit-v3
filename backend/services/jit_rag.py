"""
JIT RAG System - v3.7.0
====================

Just-In-Time RAG with official documentation snippets and AI insights.

Features:
- PDF manual parsing and chunking
- Semantic search with embeddings
- AI-powered insights generation
- Context-aware responses
"""

from models.product_hierarchy import (
    DocumentationSnippet,
    AIInsight,
    ProductCore,
    RAGQueryContext,
    RAGResponse
)
import asyncio
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import hashlib

# For PDF parsing
try:
    import pypdf
except ImportError:
    pypdf = None

# For embeddings
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
except ImportError:
    SentenceTransformer = None
    np = None

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


logger = logging.getLogger(__name__)


class JITRAGSystem:
    """
    Just-In-Time RAG system for product documentation

    Workflow:
    1. Parse PDF manuals into semantic chunks
    2. Generate embeddings for each chunk
    3. Store in vector database (JSON for now, can migrate to Pinecone/Qdrant)
    4. Query with semantic search
    5. Generate AI insights from retrieved context
    """

    def __init__(
        self,
        data_dir: Path = None,
        embedding_model: str = "all-MiniLM-L6-v2"
    ):
        if data_dir is None:
            data_dir = Path(__file__).resolve().parents[1] / "data"

        self.data_dir = Path(data_dir)
        self.manuals_dir = self.data_dir / "manuals"
        self.embeddings_dir = self.data_dir / "rag_embeddings"

        self.manuals_dir.mkdir(parents=True, exist_ok=True)
        self.embeddings_dir.mkdir(parents=True, exist_ok=True)

        # Load embedding model (lazy load)
        self.embedding_model_name = embedding_model
        self._embedding_model = None

        # In-memory vector store (for quick access)
        self.vector_store: Dict[str, List[DocumentationSnippet]] = {}

        logger.info("✅ JIT RAG System initialized")

    @property
    def embedding_model(self):
        """Lazy load embedding model"""
        if self._embedding_model is None:
            if SentenceTransformer is None:
                logger.warning(
                    "sentence-transformers not installed. Install: pip install sentence-transformers")
                return None

            try:
                logger.info(
                    f"Loading embedding model: {self.embedding_model_name}")
                self._embedding_model = SentenceTransformer(
                    self.embedding_model_name)
                logger.info("✅ Embedding model loaded")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                return None

        return self._embedding_model

    async def process_manual(
        self,
        product_id: str,
        manual_path: Path,
        chunk_size: int = 500
    ) -> List[DocumentationSnippet]:
        """
        Process a PDF manual into searchable chunks

        Args:
            product_id: Product identifier
            manual_path: Path to PDF file
            chunk_size: Characters per chunk

        Returns:
            List of documentation snippets with embeddings
        """
        logger.info(f"📚 Processing manual for: {product_id}")

        if not manual_path.exists():
            logger.error(f"Manual not found: {manual_path}")
            return []

        # Parse PDF
        text_chunks = await self._parse_pdf(manual_path, chunk_size)
        logger.info(f"   Extracted {len(text_chunks)} chunks")

        # Create snippets with embeddings
        snippets = []
        for idx, (text, page_num, section) in enumerate(text_chunks):
            snippet_id = self._generate_snippet_id(product_id, idx)

            # Generate embedding
            embedding = None
            if self.embedding_model:
                try:
                    embedding = self.embedding_model.encode(text).tolist()
                except Exception as e:
                    logger.error(f"Embedding error: {e}")

            # Extract keywords
            keywords = self._extract_keywords(text)

            snippet = DocumentationSnippet(
                id=snippet_id,
                source_type="manual",
                content=text,
                page_number=page_num,
                section=section,
                embedding_vector=embedding,
                relevance_keywords=keywords
            )

            snippets.append(snippet)

        # Store snippets
        self.vector_store[product_id] = snippets
        await self._save_embeddings(product_id, snippets)

        logger.info(f"✅ Processed {len(snippets)} snippets for {product_id}")

        return snippets

    async def _parse_pdf(
        self,
        pdf_path: Path,
        chunk_size: int
    ) -> List[Tuple[str, int, Optional[str]]]:
        """
        Parse PDF into chunks

        Returns:
            List of (text, page_number, section_name)
        """
        chunks = []

        if pypdf is None:
            logger.warning("pypdf not installed. Install: pip install pypdf")
            return chunks

        try:
            with open(pdf_path, 'rb') as file:
                reader = pypdf.PdfReader(file)
                logger.info(f"   PDF pages: {len(reader.pages)}")

                for page_num, page in enumerate(reader.pages, start=1):
                    try:
                        text = page.extract_text()
                        if not text:
                            continue

                        # Clean text
                        text = self._clean_text(text)

                        # Detect section headers
                        section = self._detect_section(text)

                        # Split into chunks
                        for chunk in self._split_text(text, chunk_size):
                            chunks.append((chunk, page_num, section))

                    except Exception as e:
                        logger.error(f"Error parsing page {page_num}: {e}")
                        continue

        except Exception as e:
            logger.error(f"PDF parsing error: {e}")

        return chunks

    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove page numbers
        text = re.sub(r'\b\d{1,3}\b\s*$', '', text)
        return text.strip()

    def _detect_section(self, text: str) -> Optional[str]:
        """Detect section header"""
        # Look for common section patterns
        patterns = [
            r'^([A-Z][A-Za-z\s]{2,30})\n',  # Title case
            r'^\d+\.\s+([A-Z][A-Za-z\s]{2,30})',  # Numbered sections
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()

        return None

    def _split_text(self, text: str, chunk_size: int) -> List[str]:
        """Split text into semantic chunks"""
        # Try to split on sentence boundaries
        sentences = re.split(r'[.!?]\s+', text)

        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) < chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text"""
        # Simple keyword extraction (can be enhanced with NLP)
        words = re.findall(r'\b[A-Z][A-Za-z]{2,}\b', text)

        # Filter common words
        stop_words = {'The', 'This', 'That', 'These', 'Those', 'When', 'Where'}
        keywords = [w for w in words if w not in stop_words]

        return list(set(keywords))[:10]  # Top 10 unique

    def _generate_snippet_id(self, product_id: str, index: int) -> str:
        """Generate unique snippet ID"""
        return f"{product_id}-snippet-{index:04d}"

    async def _save_embeddings(
        self,
        product_id: str,
        snippets: List[DocumentationSnippet]
    ):
        """Save embeddings to disk"""
        output_file = self.embeddings_dir / f"{product_id}_embeddings.json"

        # Convert to dict
        data = {
            'product_id': product_id,
            'total_snippets': len(snippets),
            'created_at': datetime.utcnow().isoformat(),
            'snippets': [s.model_dump(mode='json') for s in snippets]
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)

        logger.info(f"💾 Saved embeddings: {output_file}")

    async def load_embeddings(self, product_id: str) -> List[DocumentationSnippet]:
        """Load embeddings from disk"""
        input_file = self.embeddings_dir / f"{product_id}_embeddings.json"

        if not input_file.exists():
            logger.warning(f"No embeddings found for: {product_id}")
            return []

        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            snippets = [
                DocumentationSnippet(**s) for s in data['snippets']
            ]

            self.vector_store[product_id] = snippets
            logger.info(
                f"✅ Loaded {len(snippets)} embeddings for {product_id}")

            return snippets

        except Exception as e:
            logger.error(f"Error loading embeddings: {e}")
            return []

    async def query(
        self,
        context: RAGQueryContext,
        llm_service=None
    ) -> RAGResponse:
        """
        Query RAG system with semantic search

        Args:
            context: Query context
            llm_service: Optional LLM service for AI insights

        Returns:
            RAG response with sources and insights
        """
        logger.info(f"🔍 RAG Query: {context.query}")

        # Load embeddings if needed
        if context.product_id and context.product_id not in self.vector_store:
            await self.load_embeddings(context.product_id)

        # Semantic search
        relevant_snippets = await self._semantic_search(
            context.query,
            context.product_id,
            top_k=context.max_snippets
        )

        logger.info(f"   Found {len(relevant_snippets)} relevant snippets")

        # Generate AI insights
        ai_insights = []
        answer = ""

        if llm_service and relevant_snippets:
            answer, ai_insights = await self._generate_insights(
                context,
                relevant_snippets,
                llm_service
            )
        else:
            # Fallback: concatenate snippet content
            answer = "\n\n".join([s.content for s in relevant_snippets[:3]])

        response = RAGResponse(
            answer=answer,
            sources=relevant_snippets,
            ai_insights=ai_insights,
            confidence=self._calculate_confidence(relevant_snippets),
            related_products=[],
            suggested_accessories=[]
        )

        return response

    async def _semantic_search(
        self,
        query: str,
        product_id: Optional[str],
        top_k: int = 5
    ) -> List[DocumentationSnippet]:
        """Semantic search using embeddings"""

        if not self.embedding_model:
            logger.warning("No embedding model available")
            return []

        # Get query embedding
        try:
            query_embedding = self.embedding_model.encode(query)
        except Exception as e:
            logger.error(f"Query embedding error: {e}")
            return []

        # Get relevant snippets
        if product_id and product_id in self.vector_store:
            snippets = self.vector_store[product_id]
        else:
            # Search all products
            snippets = []
            for prod_snippets in self.vector_store.values():
                snippets.extend(prod_snippets)

        if not snippets:
            return []

        # Calculate similarities
        similarities = []
        for snippet in snippets:
            if snippet.embedding_vector and np:
                try:
                    vec = np.array(snippet.embedding_vector)
                    similarity = np.dot(query_embedding, vec) / (
                        np.linalg.norm(query_embedding) * np.linalg.norm(vec)
                    )
                    similarities.append((snippet, float(similarity)))
                except Exception as e:
                    logger.error(f"Similarity calculation error: {e}")
                    continue

        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)

        # Return top-k
        top_snippets = [s for s, _ in similarities[:top_k]]

        return top_snippets

    async def _generate_insights(
        self,
        context: RAGQueryContext,
        snippets: List[DocumentationSnippet],
        llm_service
    ) -> Tuple[str, List[AIInsight]]:
        """Generate AI insights using LLM"""

        # Build context from snippets
        documentation_context = "\n\n".join([
            f"[Page {s.page_number}] {s.content}"
            for s in snippets
        ])

        # Create prompt
        prompt = f"""Based on the following product documentation, answer this question:

Question: {context.query}

Documentation:
{documentation_context}

Provide a clear, concise answer based only on the documentation provided. If the documentation doesn't contain the answer, say so.
"""

        # Generate answer (assuming llm_service has a generate method)
        try:
            answer = await llm_service.generate(prompt)
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            answer = "Unable to generate answer at this time."

        # Create AI insight
        insights = [
            AIInsight(
                insight_type="answer",
                content=answer,
                confidence=0.85,
                sources=[s.id for s in snippets]
            )
        ]

        return answer, insights

    def _calculate_confidence(self, snippets: List[DocumentationSnippet]) -> float:
        """Calculate confidence score based on results"""
        if not snippets:
            return 0.0

        # Simple confidence based on number of relevant snippets
        confidence = min(len(snippets) / 5.0, 1.0)
        return confidence


async def main():
    """Test RAG system"""
    rag = JITRAGSystem()

    # Test query
    context = RAGQueryContext(
        query="How do I connect MIDI?",
        product_id="roland-td-17kvx",
        user_intent="technical",
        max_snippets=3
    )

    response = await rag.query(context)

    print(f"\n✅ Query: {context.query}")
    print(f"   Confidence: {response.confidence}")
    print(f"   Sources: {len(response.sources)}")


if __name__ == "__main__":
    asyncio.run(main())
