"""
Product Hierarchy Models - v3.7
================================

New architecture with complete product relationships:
1. Product Core - Main product data
2. Product Accessories - Bound accessories (cables, cases, etc.)
3. Related Products - Complementary products (stands, subwoofers, etc.)

Supports JIT RAG with official documentation snippets and AI insights.
"""

from typing import Dict, List, Optional, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class ProductStatus(str, Enum):
    """Product availability status"""
    IN_STOCK = "in_stock"
    PRE_ORDER = "pre_order"
    DISCONTINUED = "discontinued"
    COMING_SOON = "coming_soon"


class RelationshipType(str, Enum):
    """Type of product relationship"""
    ACCESSORY = "accessory"  # Must-have accessory (required/recommended)
    RELATED = "related"  # Goes well with (complementary)
    ALTERNATIVE = "alternative"  # Similar product
    UPGRADE = "upgrade"  # Higher tier version
    BUNDLE = "bundle"  # Package deal


class SourceType(str, Enum):
    """Data source type"""
    BRAND_OFFICIAL = "brand_official"  # Official brand website
    HALILIT = "halilit"  # Local distributor
    MANUAL = "manual"  # Extracted from manual
    AI_ENRICHED = "ai_enriched"  # AI-enhanced data


class DocumentationSnippet(BaseModel):
    """Official documentation snippet for RAG"""
    id: str
    source_type: str = Field(...,
                             description="Type: manual, spec_sheet, quick_start")
    content: str = Field(..., description="Raw text content")
    page_number: Optional[int] = None
    section: Optional[str] = None
    embedding_vector: Optional[List[float]] = Field(
        None, description="Vector for RAG search")
    relevance_keywords: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AIInsight(BaseModel):
    """AI-generated insights from documentation"""
    insight_type: str = Field(...,
                              description="Type: usage_tip, comparison, compatibility")
    content: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    sources: List[str] = Field(
        default_factory=list, description="Documentation snippet IDs")
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ProductImage(BaseModel):
    """Product image with metadata"""
    url: str
    type: str = Field(
        default="main", description="main, thumbnail, gallery, technical")
    alt_text: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class PriceInfo(BaseModel):
    """
    Comprehensive pricing information

    Source: Halilit ONLY (local Israeli market pricing)
    """
    currency: str = "ILS"
    regular_price: Optional[float] = Field(
        None, description="Black - Official price in Israel")
    eilat_price: Optional[float] = Field(
        None, description="Red - Tax-free Eilat price")
    sale_price: Optional[float] = Field(
        None, description="Grey crossed - Original price before discount")
    msrp: Optional[float] = Field(
        None, description="Manufacturer suggested retail price")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    price_history: List[Dict[str, Any]] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "currency": "ILS",
                "regular_price": 8500.00,
                "eilat_price": 7225.00,
                "sale_price": 9500.00
            }
        }


class ProductSpecification(BaseModel):
    """Structured product specifications"""
    category: str = Field(...,
                          description="Spec category: dimensions, weight, audio, etc.")
    key: str
    value: str
    unit: Optional[str] = None
    source: SourceType = SourceType.BRAND_OFFICIAL


class ProductRelationship(BaseModel):
    """Relationship to another product"""
    relationship_type: RelationshipType
    target_product_id: str
    target_product_name: str
    target_product_brand: str
    description: Optional[str] = Field(
        None, description="Why this relationship exists")
    compatibility_notes: Optional[str] = None
    is_required: bool = Field(
        default=False, description="Is this accessory required?")
    priority: int = Field(
        default=0, description="Display priority (0=highest)")

    # Pricing context for accessories
    combined_price: Optional[float] = None
    savings: Optional[float] = None


class ConnectivityDNA(BaseModel):
    """
    The "Golden Record" for any cable or device with I/O
    """
    type: Literal['cable', 'adapter', 'interface', 'controller', 'headphones']
    connector_a: str = Field(description="Connector A type (e.g. XLR-Male, TRS-1/4)")
    connector_b: str = Field(description="Connector B type (e.g. XLR-Female, TS-1/4)")
    signal_type: str = Field(description="Signal type (e.g. Balanced, Unbalanced, MIDI)")
    pinout_standard: Optional[str] = None
    length_meters: Optional[float] = None
    gender_conversion: Optional[bool] = None


class ProductTier(BaseModel):
    """Product tiering info"""
    level: Literal['Entry', 'Pro', 'Elite']
    grade_factors: List[str]
    target_audience: Literal['Student', 'Studio', 'Broadcast']


class ProductCore(BaseModel):
    """
    Core product information - the primary product entity

    Data Source Policy:
    - ALL product data from Brand Official Website (PRIMARY)
    - Halilit used ONLY for: SKU, Pricing (3 types), Images (fallback)
    - See DATA_SOURCE_POLICY.md for complete policy
    """
    # Identity
    id: str = Field(..., description="Unique product identifier")
    brand: str
    name: str = Field(..., description="From brand official site")
    model_number: Optional[str] = Field(
        None, description="From brand official site")
    sku: Optional[str] = Field(
        None, description="From Halilit (local inventory). First 2 digits = brand code")
    halilit_brand_code: Optional[str] = Field(
        None, description="First 2 digits of SKU - brand's Halilit ID")

    # Classification
    main_category: str = Field(..., description="From brand contract")
    subcategory: Optional[str] = None
    sub_subcategory: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    # Core Information (ALL from brand official)
    description: str = Field(
        default="", description="From brand official site")
    short_description: Optional[str] = Field(
        None, max_length=200, description="From brand official site")

    # Visual Assets (Brand official, Halilit fallback)
    images: List[ProductImage] = Field(
        default_factory=list, description="Prefer brand official")
    video_urls: List[str] = Field(default_factory=list)

    # Specifications (From brand official)
    specifications: List[ProductSpecification] = Field(default_factory=list)
    features: List[str] = Field(
        default_factory=list, description="From brand official site")

    # Connectivity & Tiering
    connectivity: Optional[ConnectivityDNA] = None
    tier: Optional[ProductTier] = None

    # Pricing & Availability (From Halilit ONLY)
    pricing: Optional[PriceInfo] = Field(
        None, description="From Halilit - 3 price types")
    status: ProductStatus = ProductStatus.IN_STOCK
    availability_notes: Optional[str] = None

    # Documentation & Support (From brand official)
    manual_urls: List[str] = Field(
        default_factory=list, description="From brand official site")
    documentation_snippets: List[DocumentationSnippet] = Field(
        default_factory=list)
    support_url: Optional[str] = Field(
        None, description="From brand official site")

    # AI Enhancement
    ai_insights: List[AIInsight] = Field(default_factory=list)
    ai_summary: Optional[str] = Field(
        None, description="AI-generated product summary")

    # Relationships
    accessories: List[ProductRelationship] = Field(default_factory=list)
    related_products: List[ProductRelationship] = Field(default_factory=list)

    # URLs (From brand official)
    brand_product_url: Optional[str] = Field(
        None, description="From brand official site")
    distributor_url: Optional[str] = Field(
        None, description="Halilit product page")

    # Metadata
    data_sources: List[SourceType] = Field(
        default_factory=list,
        description="Source tracking: brand_official (primary), halilit (SKU/pricing only)"
    )
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    last_scraped: datetime = Field(default_factory=datetime.utcnow)

    # Search Optimization
    search_keywords: List[str] = Field(default_factory=list)
    search_text: str = Field(
        default="", description="Computed search text for indexing")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "roland-td-17kvx",
                "brand": "roland",
                "name": "TD-17KVX V-Drums Electronic Drum Kit",
                "model_number": "TD-17KVX",
                "main_category": "electronic_drums",
                "description": "Premium electronic drum kit with mesh heads",
                "pricing": {
                    "currency": "ILS",
                    "regular_price": 8500.0
                },
                "accessories": [
                    {
                        "relationship_type": "accessory",
                        "target_product_id": "roland-dap-3x",
                        "target_product_name": "DAP-3X V-Drums Accessory Package",
                        "is_required": False,
                        "priority": 0
                    }
                ]
            }
        }


class BrandIdentity(BaseModel):
    """Enhanced brand information"""
    id: str
    name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    founded: Optional[int] = None
    headquarters: Optional[str] = None
    categories: List[str] = Field(default_factory=list)
    brand_colors: Dict[str, str] = Field(default_factory=dict)


class ProductCatalog(BaseModel):
    """Complete brand catalog with hierarchy"""
    brand_identity: BrandIdentity
    products: List[ProductCore]
    total_products: int
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    catalog_version: str = "3.7.0"

    # Catalog-level metadata
    coverage_stats: Dict[str, Any] = Field(default_factory=dict)
    rag_enabled: bool = Field(default=False)
    total_documentation_snippets: int = 0


class RAGQueryContext(BaseModel):
    """Context for RAG queries"""
    query: str
    product_id: Optional[str] = None
    user_intent: str = Field(
        default="general", description="general, technical, comparison, troubleshooting")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    max_snippets: int = Field(default=5)


class RAGResponse(BaseModel):
    """Response from RAG system"""
    answer: str
    sources: List[DocumentationSnippet] = Field(default_factory=list)
    ai_insights: List[AIInsight] = Field(default_factory=list)
    confidence: float
    related_products: List[str] = Field(default_factory=list)
    suggested_accessories: List[str] = Field(default_factory=list)
