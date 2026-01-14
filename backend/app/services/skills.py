"""MCP Skills service stub."""


class MCPSkills:
    """Stub for MCP skills functionality."""

    def __init__(self, catalog, fetcher):
        """Initialize with catalog and fetcher."""
        self.catalog = catalog
        self.fetcher = fetcher

    async def execute_skill(self, skill_name: str, **kwargs):
        """Stub method - returns None for now."""
        return None
