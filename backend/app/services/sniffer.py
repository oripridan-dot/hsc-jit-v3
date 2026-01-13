from __future__ import annotations

import random
from typing import Any, Dict, List

from thefuzz import fuzz, process

from .catalog import CatalogService


class SnifferService:
    """
    Fuzzy-matches partial text against catalog product search strings.
    Returns top-N predictions with confidence scores.
    """

    def __init__(self, catalog: CatalogService) -> None:
        self.catalog = catalog
        # Choices for fuzzy matching are the search strings
        self._choices: List[str] = self.catalog.all_search_texts()

    def predict(self, partial_text: str, limit: int = 3) -> List[Dict[str, Any]]:
        text = (partial_text or "").strip()
        
        # If no text provided, return random sample of products to populate the catalog
        if not text:
            all_products = self.catalog.all_products()
            sample_size = min(limit, len(all_products))
            sampled = random.sample(all_products, sample_size)
            return [{
                "product": product,
                "confidence": 100,
                "match_text": product.get("name", "Unknown"),
            } for product in sampled]

        # Use a robust scorer for mixed-length inputs
        matches = process.extract(text, self._choices, scorer=fuzz.WRatio, limit=limit)
        results: List[Dict[str, Any]] = []
        for match_text, score in matches:
            # Find first product whose search text matches this choice
            try:
                idx = self._choices.index(match_text)
                product = self.catalog.all_products()[idx]
            except ValueError:
                # If not found (shouldn't happen), skip
                continue

            results.append({
                "product": product,
                "confidence": score,
                "match_text": match_text,
            })
        return results
