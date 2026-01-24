# backend/models/product_hierarchy.py
from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class ProductStatus(str, Enum):
    IN_STOCK = "in_stock"
    PRE_ORDER = "pre_order"
    DISCONTINUED = "discontinued"
    COMING_SOON = "coming_soon"

class ProductImage(BaseModel):
    url: str
    type: str = "main"

class ProductSpecification(BaseModel):
    key: str
    value: str

class PriceInfo(BaseModel):
    regular_price: Optional[float] = None
    eilat_price: Optional[float] = None

class ProductCore(BaseModel):
    """
    The Master Product Entity.
    """
    id: str
    brand: str
    name: str
    sku: Optional[str] = None
    
    # Classification
    main_category: str
    subcategory: Optional[str] = None
    
    # Data
    description: str = ""
    features: List[str] = []
    specifications: List[ProductSpecification] = []
    images: List[ProductImage] = []
    pricing: Optional[PriceInfo] = None
    status: ProductStatus = ProductStatus.IN_STOCK
    
    # Links
    manual_urls: List[str] = []
    support_url: Optional[str] = None
    
    # --- NEW: Frontend Normalization Hooks ---
    tribe_assignment: Optional[str] = Field(None, description="Force a specific Tribe ID")

    class Config:
        arbitrary_types_allowed = True
