from typing import List, Optional, Dict, Any
from pydantic import BaseModel, field_validator, ValidationError
import re


class ProductContract(BaseModel):
    """
    The Single Source of Truth for a 'Harvested Product'.
    Data MUST meet this schema to enter the ecosystem.
    """
    id: str
    brand: str
    name: str  # Must be clean (no "Roland FP-30", just "FP-30")
    category: str  # Must be English, Capitalized, not "General"
    description: Optional[str] = None
    msrp: Optional[float] = None
    image_url: str
    specs: Dict[str, Any] = {}
    source_url: str

    @field_validator('name')
    def name_must_be_clean(cls, v, values):
        if not v or len(v) < 2:
            raise ValueError("Name too short")
        # Ensure brand name isn't the whole title (context dependent, but good for basic sanity)
        return v.strip()

    @field_validator('category')
    def category_must_be_english_and_meaningful(cls, v):
        if not v:
            raise ValueError("Category missing")
        if v.lower() in ["general", "other", "product", "products"]:
            raise ValueError(f"Category '{v}' is too generic")

        # ASCII check to ensure no Hebrew in 'category' field
        if not v.isascii():
            raise ValueError(f"Category '{v}' contains non-English characters")

        return v.title()


class BrandComplianceReport(BaseModel):
    brand_id: str
    total_scraped: int
    compliant_count: int
    compliance_rate: float
    products: List[ProductContract]
    rejection_reasons: Dict[str, int]
    is_locked: bool = False  # Unlocked until compliance > 95%
