from __future__ import annotations

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
        if not text:
            return []

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
