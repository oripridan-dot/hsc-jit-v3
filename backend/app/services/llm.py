import os
import logging
from typing import AsyncGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        if HAS_GEMINI and self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
        elif not HAS_GEMINI:
            logger.warning("google-generativeai package missing.")
        else:
            logger.warning("GEMINI_API_KEY not set.")

    async def stream_answer(self, context: str, query: str) -> AsyncGenerator[str, None]:
        if not self.model:
            yield "Thinking... (AI disconnected: missing key or libs)"
            return

        prompt = f"""
    You are a technical support expert with deep product knowledge. Use the provided context to answer accurately and helpfully.

    INSTRUCTIONS:
    - First, read the BRAND CONTEXT and RELATED PRODUCTS sections (if present in the context) and use them.
    - If the user asks about quality, origin, or manufacturing, explicitly mention the production country once.
    - If related products are provided, mention at least one by exact name when relevant (e.g., recommended accessories).
    - Prefer concise, well-structured paragraphs (avoid choppy sentence fragments).
    - Cite or reference the manual when appropriate (e.g., "According to the official manual...").
    - Maintain a helpful, technical, and professional tone.

    Context (includes manual excerpts, brand info, and related products):
    {context}

    User Question: {query}

    Answer:
    """

        try:
            # properly use async generation if available, else wrap
            # google-generativeai v0.3+ supports async
            response = await self.model.generate_content_async(prompt, stream=True)
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            yield f"Error generating answer: {e}"
