"""
Deprecated RAG service.

The system now uses a stateless context window workflow with direct TEXT caching.
This module is kept as a stub to avoid accidental imports.
"""


class EphemeralRAG:  # pragma: no cover
    def __init__(self, *args, **kwargs):
        raise ImportError(
            "RAG is deprecated. Use the stateless context window workflow instead."
        )
