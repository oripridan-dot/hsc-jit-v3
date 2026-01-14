import os
import re
import base64
import logging
from typing import AsyncGenerator, Optional, Tuple, Any, Dict

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

    async def stream_answer(self, context: str, query: str, image_data: Optional[str] = None, scenario: str = "general") -> AsyncGenerator[str, None]:
        if not self.client:
            yield "Thinking... (AI disconnected: missing key or libs)"
            return

        # Build scenario-specific guidance
        scenario_guidance = ""
        if scenario == "studio":
            scenario_guidance = """
    
    SCENARIO: Studio/Home Recording Mode
    - Prioritize technical accuracy and setup instructions
    - Mention latency/buffer considerations when relevant
    - Suggest workflow optimization for recording/production
    - Avoid warnings about real-time performance unless critical
    """
        elif scenario == "live":
            scenario_guidance = """
    
    SCENARIO: Live Performance Mode
    - Highlight reliability and stage-readiness
    - **WARNING:** Mention when operations cause audio interruption (e.g., saving presets stops sound)
    - Suggest quick workarounds for live scenarios
    - Prioritize fail-safe procedures
    """

        prompt = f"""
    You are a technical support expert with deep product knowledge. Use the provided context to answer accurately and helpfully.

    CRITICAL INSTRUCTIONS - ALWAYS FOLLOW:
    1. **START YOUR RESPONSE** by mentioning: "This product is from [Brand Name] ([Brand HQ with flag]) and is manufactured in [Production Country with flag]."
    2. First, read the BRAND CONTEXT and RELATED PRODUCTS sections in the context below.
    3. **ANSWER SECTION:** Provide the core technical answer using ONLY the manual context. Use [MANUAL: page X] citations.
    4. **SMART PAIRING SECTION:** If the question relates to a feature or workflow, suggest ONE official accessory from the "Official Accessories" list that enhances that feature. Mark with [SUGGESTION: <product_name>].
    5. **PRO TIP SECTION:** Add a field note with real-world usage advice, workarounds, or warnings. Mark with [PRO TIP:].
    6. Maintain a helpful, technical, and professional tone.{scenario_guidance}

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
                    response = self.client.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                        stream=True,
                    )
                else:
                    image_bytes, mime_type = decoded
                    parts = [
                        genai_types.Part.from_text(prompt),
                        genai_types.Part.from_bytes(image_bytes, mime_type),
                    ]
                    response = self.client.models.generate_content(
                        model=self.model_name,
                        contents=parts,
                        stream=True,
                    )
            else:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    stream=True,
                )

            for chunk in response:
                chunk_text = getattr(chunk, "text", None)
                if chunk_text:
                    yield chunk_text
        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            yield f"Error generating answer: {e}"

    async def answer_with_tools(self, query: str, skills: Any, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Attempt Gemini function calling using provided skills. Falls back to plain text answer.
        Returns structured result: { "type": "tool_result"|"text", "data": Any }
        """
        # If no client, fallback
        if not self.client:
            return {"type": "text", "data": "AI unavailable (missing key or library)."}

        tools_def = []
        try:
            # Expect skills to have get_tools_definition()
            tools_def = skills.get_tools_definition()
        except Exception:
            tools_def = []

        user_prompt = (
            "You are a helpful assistant. If a tool is more appropriate to satisfy the user request, "
            "call one of the available tools with correct parameters. Otherwise, respond in text."
        )
        if context:
            user_prompt += f"\nContext:\n{context}\n"

        # Build request; best-effort tools integration
        try:
            # If the SDK supports tools, attach them
            kwargs: Dict[str, Any] = {"model": self.model_name, "contents": query}
            if genai_types is not None and hasattr(genai_types, "Tool") and tools_def:
                tool_objs = []
                for t in tools_def:
                    try:
                        tool_objs.append(genai_types.Tool(
                            name=t.get("name"),
                            description=t.get("description"),
                            parameters=t.get("parameters"),
                        ))
                    except Exception:
                        pass
                if tool_objs:
                    kwargs["tools"] = tool_objs
            
            # Include system instruction if supported
            if genai_types is not None and hasattr(genai_types, "SystemInstruction"):
                kwargs["system_instruction"] = user_prompt

            response = self.client.models.generate_content(**kwargs)

            # Parse tool call if present
            # Different SDK versions have different shapes; inspect defensively
            # Look for function_call inside candidate parts
            if hasattr(response, "candidates"):
                for cand in getattr(response, "candidates", []) or []:
                    parts = getattr(getattr(cand, "content", None), "parts", []) or []
                    for part in parts:
                        fc = getattr(part, "function_call", None)
                        if fc and hasattr(fc, "name"):
                            name = getattr(fc, "name", "")
                            raw_args = getattr(fc, "args", {})
                            # Ensure args is dict-like
                            args_dict = raw_args if isinstance(raw_args, dict) else {}
                            try:
                                tool_result = await skills.execute(name, args_dict)
                                return {"type": "tool_result", "data": {"tool": name, "result": tool_result}}
                            except Exception as e:
                                logger.error(f"Tool execution failed: {e}")
                                return {"type": "text", "data": f"Tool execution failed: {e}"}

            # If no tool call, return text
            text = getattr(response, "text", None) or str(response)
            return {"type": "text", "data": text}
        except Exception as e:
            logger.error(f"Gemini tool-call error: {e}")
            return {"type": "text", "data": f"Error: {e}"}
