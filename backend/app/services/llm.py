import os
import re
import base64
import logging
from typing import AsyncGenerator, Optional, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from google import genai
    from google.genai import types as genai_types
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    genai = None
    genai_types = None

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.client = None

        if HAS_GEMINI and self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        elif not HAS_GEMINI:
            logger.warning("google-genai package missing.")
        else:
            logger.warning("GEMINI_API_KEY not set.")

    def _decode_image(self, image_data: str) -> Optional[Tuple[bytes, str]]:
        """Decode a base64 string (data URL or raw) into bytes and mime type."""
        try:
            mime_type = "image/png"
            # data URL handling
            data_url_match = re.match(r"data:(image/[a-zA-Z0-9.+-]+);base64,(.*)", image_data)
            if data_url_match:
                mime_type = data_url_match.group(1)
                b64_content = data_url_match.group(2)
            else:
                b64_content = image_data

            decoded = base64.b64decode(b64_content)
            return decoded, mime_type
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to decode image payload: %s", exc)
            return None

    async def stream_answer(self, context: str, query: str, image_data: Optional[str] = None) -> AsyncGenerator[str, None]:
        if not self.client:
            yield "Thinking... (AI disconnected: missing key or libs)"
            return

        prompt = f"""
    You are a technical support expert with deep product knowledge. Use the provided context to answer accurately and helpfully.

    CRITICAL INSTRUCTIONS - ALWAYS FOLLOW:
    1. **START YOUR RESPONSE** by mentioning: "This product is from [Brand Name] ([Brand HQ with flag]) and is manufactured in [Production Country with flag]."
    2. First, read the BRAND CONTEXT and RELATED PRODUCTS sections in the context below.
    3. When relevant, mention related products by their exact names (e.g., "Consider the Roland RH-300 headphones..." or "The Noise Eater (NE-10) is perfect for apartments...").
    4. Prefer concise, well-structured paragraphs (avoid choppy sentence fragments).
    5. Cite or reference the manual when appropriate (e.g., "According to the official manual...").
    6. Maintain a helpful, technical, and professional tone.

    Context (includes manual excerpts, brand info, and related products):
    {context}

    User Question: {query}

    Answer:
    """

        try:
            # If an image is provided, send multimodal prompt
            if image_data:
                decoded = self._decode_image(image_data)
                if not decoded:
                    yield "Image could not be processed. Proceeding with text-only answer."
                    response = self.client.models.generate_content_stream(
                        model=self.model_name,
                        contents=prompt,
                    )
                else:
                    image_bytes, mime_type = decoded
                    parts = [
                        genai_types.Part.from_text(prompt),
                        genai_types.Part.from_bytes(image_bytes, mime_type),
                    ]
                    response = self.client.models.generate_content_stream(
                        model=self.model_name,
                        contents=parts,
                    )
            else:
                response = self.client.models.generate_content_stream(
                    model=self.model_name,
                    contents=prompt,
                )

            for chunk in response:
                chunk_text = getattr(chunk, "text", None)
                if chunk_text:
                    yield chunk_text
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            yield f"Error generating answer: {e}"
