# backend/models/product_hierarchy.py
from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field, validator
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
    name: str = "Unknown Product"
    sku: Optional[str] = None
    
    # Classification
    main_category: str = Field(..., alias="category")
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
        populate_by_name = True

class ProductCatalog(BaseModel):
    brand_identity: Dict[str, Any]
    products: List[ProductCore]
    total_products: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    @validator('total_products', pre=True, always=True)
    def set_total_products(cls, v, values):
        if v is None or v == 0:
            if 'products' in values and values['products']:
                return len(values['products'])
        return v or 0

    @validator('last_updated', pre=True, always=True)
    def set_last_updated(cls, v):
        if v is None:
            return datetime.utcnow()
        return v
