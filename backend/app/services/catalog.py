from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class CatalogService:
    """
    Loads all brand catalog JSONs from backend/data/catalogs/ into memory.

    Produces:
    - self.products: List[Dict[str, Any]] raw product entries with injected brand info.
    - self.brands: Dict[str, Dict[str, Any]] map of brand_id -> brand_identity
    - self.search_texts: List[str] human-friendly strings for fuzzy matching
    - self.product_map: Dict[str, Dict[str, Any]] map of product_id -> product for fast lookup
    """

    def __init__(self, catalogs_dir: Optional[Path] = None) -> None:
        # Resolve default catalogs directory relative to this file
        if catalogs_dir is None:
            backend_dir = Path(__file__).resolve().parents[2]
            # Use catalogs directory which has flattened unified data
            catalogs_dir = backend_dir / "data" / "catalogs"
        self.catalogs_dir = Path(catalogs_dir)

        self.products: List[Dict[str, Any]] = []
        self.brands: Dict[str, Dict[str, Any]] = {}  # Store brand identities
        self.search_texts: List[str] = []
        # Fast product lookup by ID
        self.product_map: Dict[str, Dict[str, Any]] = {}

        self._load_catalogs()

    def _load_catalogs(self) -> None:
        if not self.catalogs_dir.exists():
            raise FileNotFoundError(
                f"Catalogs directory not found: {self.catalogs_dir}")

        for json_path in sorted(self.catalogs_dir.glob("*.json")):
            try:
                with json_path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                print(f"[CatalogService] Failed to read {json_path.name}: {e}")
                continue

            products_list = []
            brand_id = None
            brand_info = {}

            # New Schema: Dict with 'brand_identity' and 'products'
            if isinstance(data, dict) and "brand_identity" in data:
                brand_info = data["brand_identity"]
                brand_id = brand_info.get("id")

                # Cache bust brand logos too
                if brand_info and "logo_url" in brand_info:
                    logo_url = brand_info["logo_url"]
                    if logo_url and isinstance(logo_url, str) and "?" not in logo_url:
                        brand_info["logo_url"] = f"{logo_url}?v=fix3"

                if brand_id:
                    self.brands[brand_id] = brand_info

                products_list = data.get("products", [])

            # Legacy fallback
            elif isinstance(data, list):
                products_list = data
            elif isinstance(data, dict) and "products" in data:
                products_list = data["products"]

            # Process products
            for p in products_list:
                # Inject brand info if available and not present
                if brand_info:
                    p["brand_identity"] = brand_info
                    if "brand" not in p and brand_id:
                        p["brand"] = brand_id

                # ---------------------------------------------------------
                # NETWORK FIX: Cache Busting for Images
                # ---------------------------------------------------------
                # Cause: Browser cached 404s for /static/* improperly.
                # Fix: Append query param to force browser to fetch again.
                if "images" in p and isinstance(p["images"], dict):
                    main_img = p["images"].get("main")
                    if main_img and isinstance(main_img, str) and "?" not in main_img:
                        p["images"]["main"] = f"{main_img}?v=fix3"

                self.products.append(p)

                # Add to product_map for fast lookup
                if p.get("id"):
                    self.product_map[p["id"]] = p

                # Create detailed search text
                # "Roland TD-17KVX (Electronic Drums) - Malaysia"
                search_parts = [p.get("name", "")]
                if p.get("id"):
                    search_parts.append(p["id"])

                # Add keywords for better fuzzy matching
                if "category" in p:
                    search_parts.append(p["category"])

                self.search_texts.append(" ".join(str(s)
                                         for s in search_parts if s))

        print(
            f"[CatalogService] Loaded {len(self.products)} products from {len(self.brands)} rich brands.")

    def all_products(self) -> List[Dict[str, Any]]:
        return self.products

    def all_search_texts(self) -> List[str]:
        return self.search_texts

    def get_brand(self, brand_id: str) -> Optional[Dict[str, Any]]:
        return self.brands.get(brand_id)

    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Fast lookup for a product by ID."""
        return self.product_map.get(product_id)

    def get_all_brands(self) -> List[Dict[str, Any]]:
        """
        Returns list of all brand identities with product counts.
        Format: [{ "id": "moog", "name": "Moog Music", "product_count": 8, "logo_url": "...", ... }]
        """
        brands_list = []
        for brand_id, brand_info in self.brands.items():
            # Count products for this brand
            product_count = sum(
                1 for p in self.products if p.get("brand") == brand_id)

            brand_data = {
                **brand_info,
                "product_count": product_count
            }
            brands_list.append(brand_data)

        # Sort by name
        brands_list.sort(key=lambda x: x.get("name", ""))
        return brands_list

    def get_product_with_context(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Returns a product with hydrated context:
        - Full brand_identity injected
        - Relationships resolved with target product metadata

        Returns: { 
            "product": {...}, 
            "brand": {...}, 
            "context": { "related_items": [...] } 
        }
        """
        product = self.get_product(product_id)
        if not product:
            return None

        # Get brand
        brand = None
        if "brand_identity" in product:
            brand = product["brand_identity"]
        elif product.get("brand"):
            brand = self.get_brand(product["brand"])

        # Hydrate relationships
        related_items = []
        relationships = product.get("relationships", [])

        # Handle both old dict format and new list format
        if isinstance(relationships, dict):
            # Old format: { "compatible_accessories": ["id1", "id2"], ... }
            for rel_type, rel_ids in relationships.items():
                if isinstance(rel_ids, list):
                    for target_id in rel_ids:
                        target = self.get_product(target_id)
                        if target:
                            related_items.append({
                                "id": target.get("id"),
                                "name": target.get("name"),
                                "category": target.get("category"),
                                "production_country": target.get("production_country"),
                                "type": rel_type,
                                "label": rel_type.replace("_", " ").title(),
                                "image": target.get("images", {}).get("main")
                            })
        elif isinstance(relationships, list):
            # New format: [{ "type": "accessory", "target_id": "...", "label": "..." }, ...]
            for rel in relationships:
                target_id = rel.get("target_id")
                target = self.get_product(target_id) if target_id else None
                if target:
                    related_items.append({
                        "id": target.get("id"),
                        "name": target.get("name"),
                        "category": target.get("category"),
                        "production_country": target.get("production_country"),
                        "type": rel.get("type", "related"),
                        "label": rel.get("label", "Related"),
                        "image": target.get("images", {}).get("main")
                    })

        return {
            "product": product,
            "brand": brand or {},
            "context": {
                "related_items": related_items
            }
        }
