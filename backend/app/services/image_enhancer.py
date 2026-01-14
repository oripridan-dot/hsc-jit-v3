"""Image enhancement service stub."""


class ImageEnhancer:
    """Stub for image enhancement functionality."""

    async def enhance_image(self, product_id: str, product_name: str, image_url: str):
        """Stub method - returns None for now."""
        return None


_enhancer = ImageEnhancer()


def get_image_enhancer() -> ImageEnhancer:
    """Get image enhancer instance."""
    return _enhancer
