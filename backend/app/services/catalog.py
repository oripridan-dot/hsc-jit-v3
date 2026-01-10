from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class CatalogService:
    """
    Loads all brand catalog JSONs from backend/data/catalogs/ into memory.

    Produces:
    - self.products: List[Dict[str, Any]] raw product entries
    - self.search_texts: List[str] human-friendly strings for fuzzy matching
    """

    def __init__(self, catalogs_dir: Optional[Path] = None) -> None:
        # Resolve default catalogs directory relative to this file
        if catalogs_dir is None:
            backend_dir = Path(__file__).resolve().parents[2]
            catalogs_dir = backend_dir / "data" / "catalogs"
        self.catalogs_dir = Path(catalogs_dir)

        self.products: List[Dict[str, Any]] = []
        self.search_texts: List[str] = []

        self._load_catalogs()

    def _load_catalogs(self) -> None:
        if not self.catalogs_dir.exists():
            raise FileNotFoundError(f"Catalogs directory not found: {self.catalogs_dir}")

        for json_path in sorted(self.catalogs_dir.glob("*.json")):
            try:
                with json_path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                # Skip malformed files but continue loading others
                print(f"[CatalogService] Failed to read {json_path.name}: {e}")
                continue

            brand_slug = json_path.stem.replace("_catalog", "")

            # Normalize different possible structures
            if isinstance(data, list):
                entries = data
            elif isinstance(data, dict):
                # Common schemas: { products: [...] } or single object
                if "products" in data and isinstance(data["products"], list):
                    entries = data["products"]
                else:
                    entries = [data]
            else:
                entries = []

            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                enriched = {**entry}
                # Enrich with brand slug if not present
                enriched.setdefault("brand", brand_slug)
                self.products.append(enriched)
                self.search_texts.append(self._make_search_text(enriched))

        # Basic sanity log
        print(f"[CatalogService] Loaded {len(self.products)} products from {self.catalogs_dir}")

    @staticmethod
    def _make_search_text(product: Dict[str, Any]) -> str:
        """
        Build a human-friendly string for fuzzy matching. Tries several common keys.
        """
        candidates = []
        # Common name-like fields
        for key in ("product_name", "name", "model", "title", "sku"):
            val = product.get(key)
            if isinstance(val, str) and val.strip():
                candidates.append(val.strip())

        # Brand
        brand = product.get("brand")
        if isinstance(brand, str) and brand.strip():
            candidates.append(brand.strip())

        # Combine unique parts
        text = " ".join(dict.fromkeys(candidates)) or json.dumps(product, ensure_ascii=False)
        return text

    def all_products(self) -> List[Dict[str, Any]]:
        return self.products

    def all_search_texts(self) -> List[str]:
        return self.search_texts
