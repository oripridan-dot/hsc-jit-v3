"""Input validation for WebSocket messages and API requests."""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator, ValidationError
import logging

logger = logging.getLogger(__name__)


class TypingMessage(BaseModel):
    """Validation model for typing/prediction messages"""
    type: str = Field(..., pattern="^typing$")
    content: str = Field(..., min_length=0, max_length=1000)
    
    @field_validator('content')
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        """Sanitize content to prevent injection attacks"""
        # Remove null bytes and control characters
        return ''.join(char for char in v if char.isprintable() or char.isspace())


class QueryMessage(BaseModel):
    """Validation model for legacy query messages"""
    type: str = Field(..., pattern="^(query|lock_and_query)$")
    product_id: str = Field(..., min_length=1, max_length=200)
    question: Optional[str] = Field(None, max_length=2000)
    scenario: Optional[str] = Field("general", pattern="^(studio|live|general)$")
    
    @field_validator('product_id')
    @classmethod
    def sanitize_product_id(cls, v: str) -> str:
        """Sanitize product ID"""
        # Only allow alphanumeric, dash, underscore
        return ''.join(char for char in v if char.isalnum() or char in '-_.')
    
    @field_validator('question')
    @classmethod
    def sanitize_question(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize question text"""
        if v is None:
            return v
        # Remove null bytes and control characters
        return ''.join(char for char in v if char.isprintable() or char.isspace())


class UnifiedQueryMessage(BaseModel):
    """Validation model for unified queries (Explorer/PromptBar)"""
    type: str = Field(..., pattern="^unified_query$")
    query: str = Field(..., min_length=1, max_length=2000)
    source: str = Field('explorer', pattern="^(explorer|promptbar)$")
    filters: Optional[Dict[str, Any]] = None

    @field_validator('query')
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        return ''.join(char for char in v[:2000] if char.isprintable() or char.isspace())


class SyncStateMessage(BaseModel):
    """Validation model for initial state sync"""
    type: str = Field(..., pattern="^sync_state$")
    context: Optional[Dict[str, Any]] = None
    history: Optional[list] = None


def validate_websocket_message(raw_data: Dict[str, Any]) -> Optional[BaseModel]:
    """
    Validate incoming WebSocket message.
    
    Args:
        raw_data: Raw message data from WebSocket
        
    Returns:
        Validated message model or None if invalid
        
    Raises:
        ValidationError: If message validation fails
    """
    msg_type = raw_data.get("type")
    
    if msg_type == "typing":
        return TypingMessage(**raw_data)
    elif msg_type in ["query", "lock_and_query"]:
        return QueryMessage(**raw_data)
    elif msg_type == "unified_query":
        return UnifiedQueryMessage(**raw_data)
    elif msg_type == "sync_state":
        return SyncStateMessage(**raw_data)
    else:
        # Allow unknown types to pass through without killing the socket,
        # but log them for investigation.
        logger.warning("Unknown WebSocket message type", extra={"msg_type": msg_type})
        return None


def safe_get_str(data: Dict[str, Any], key: str, default: str = "", max_length: int = 1000) -> str:
    """
    Safely extract and sanitize string from dictionary.
    
    Args:
        data: Source dictionary
        key: Key to extract
        default: Default value if key not found
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string value
    """
    value = data.get(key, default)
    if not isinstance(value, str):
        return default
    
    # Truncate if too long
    value = value[:max_length]
    
    # Remove control characters
    value = ''.join(char for char in value if char.isprintable() or char.isspace())
    
    return value


def safe_get_int(data: Dict[str, Any], key: str, default: int = 0, min_val: int = 0, max_val: int = 1000000) -> int:
    """
    Safely extract and validate integer from dictionary.
    
    Args:
        data: Source dictionary
        key: Key to extract
        default: Default value if key not found
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        
    Returns:
        Validated integer value
    """
    value = data.get(key, default)
    
    try:
        int_value = int(value)
        return max(min_val, min(int_value, max_val))
    except (ValueError, TypeError):
        return default
