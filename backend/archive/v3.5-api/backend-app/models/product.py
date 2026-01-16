from typing import Dict, Optional
from pydantic import BaseModel


class ProductValidation(BaseModel):
    is_globally_recognized: bool = False  # Found on Brand Site
    is_locally_available: bool = False    # Found on Halilit
    confidence_score: int = 0             # 0-100


class VariantInfo(BaseModel):
    has_variant: bool = False
    variant_type: Optional[str] = None  # 'color', 'version', 'generation'
    variant_value: Optional[str] = None
    color: Optional[str] = None
    base_model: Optional[str] = None  # Model without variant suffix


class Product(BaseModel):
    # Identity
    id: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None  # Normalized key (e.g., "FP-30X")

    # Global Data (Source A)
    title_en: Optional[str] = None
    description_en: Optional[str] = None
    specs_en: Optional[Dict[str, str]] = None

    # Local Data (Source B - Halilit)
    title_he: Optional[str] = None
    description_he: Optional[str] = None
    price_ils: Optional[float] = None
    original_price_ils: Optional[float] = None  # Before discount (overlined)
    eilat_price_ils: Optional[float] = None     # Tax-free Eilat price (red)

    # Variant Management
    variant_info: Optional[VariantInfo] = None

    # Confidence Engine
    validation: ProductValidation = ProductValidation()
