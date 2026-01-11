"""Asset Harvester

Downloads brand and product imagery from catalog JSON files and rewrites
paths to point to locally served static assets. Safe to run multiple times;
will skip downloads if files already exist.
"""
from __future__ import annotations

import io
import json
import logging
from pathlib import Path
from typing import Dict, Tuple, Optional
from urllib.parse import urlparse

import httpx
from PIL import Image, ImageDraw, ImageFont

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
CATALOG_DIR = BASE_DIR / "data" / "catalogs"
STATIC_DIR = BASE_DIR / "app" / "static"
BRAND_DIR = STATIC_DIR / "assets" / "brands"
PRODUCT_DIR = STATIC_DIR / "assets" / "products"

CLIENT_TIMEOUT = 20.0
HEADERS = {"User-Agent": "HSC-JIT-Harvester/1.0"}


def ensure_dirs() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    PRODUCT_DIR.mkdir(parents=True, exist_ok=True)


def _referer_for(url: str) -> str:
    try:
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        return ""


def fetch_image(url: str) -> Optional[Tuple[bytes, str]]:
    try:
        headers = HEADERS.copy()
        ref = _referer_for(url)
        if ref:
            headers["Referer"] = ref

        with httpx.Client(timeout=CLIENT_TIMEOUT, follow_redirects=True, headers=headers) as client:
            resp = client.get(url)
            if resp.status_code != 200:
                logger.warning("[%s] download failed: %s", url, resp.status_code)
                return None
            content_type = resp.headers.get("content-type", "")
            return resp.content, content_type
    except Exception as exc:
        logger.warning("[%s] download error: %s", url, exc)
        return None


def optimize_and_save(img_bytes: bytes, dest: Path, prefer_png: bool = False) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(img_bytes)) as img:
        # Preserve transparency for logos; otherwise convert to RGB for compact size
        if prefer_png:
            if img.mode in ("RGBA", "LA"):
                converted = img.convert("RGBA")
            else:
                converted = img.convert("RGB")
            converted.save(dest.with_suffix(".png"), format="PNG", optimize=True)
        else:
            converted = img.convert("RGB")
            converted.save(dest.with_suffix(".webp"), format="WEBP", quality=85, method=6)


def create_placeholder(dest: Path, text: str, prefer_png: bool = True) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    size = (512, 320) if not prefer_png else (320, 320)
    bg = (20, 30, 40)
    fg = (120, 200, 255)
    img = Image.new("RGB", size, color=bg)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 80)
    except Exception:
        font = ImageFont.load_default()
    text = (text or "?").upper()[:8]
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(((size[0]-w)/2, (size[1]-h)/2), text, fill=fg, font=font)
    suffix = ".png" if prefer_png else ".webp"
    img.save(dest.with_suffix(suffix), format="PNG" if prefer_png else "WEBP")


def process_catalog(catalog_path: Path) -> Tuple[int, int]:
    """
    Returns tuple (logos_downloaded, products_downloaded)
    """
    try:
        data = json.loads(catalog_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        logger.warning("Skipping %s (invalid JSON): %s", catalog_path.name, exc)
        return (0, 0)

    logos_saved = 0
    products_saved = 0

    brand = data.get("brand_identity", {}) or {}
    brand_id = brand.get("id")
    logo_url = brand.get("logo_url")

    if brand_id and logo_url:
        logo_dest = BRAND_DIR / f"{brand_id}"
        saved = logo_dest.with_suffix(".png").exists()

        if not saved and logo_url.startswith("/static/"):
            # Already localized but missing on disk: create placeholder
            create_placeholder(logo_dest, brand.get("name", brand_id), prefer_png=True)
            saved = True
        elif not saved:
            fetched = fetch_image(logo_url)
            if fetched:
                img_bytes, _ = fetched
                try:
                    optimize_and_save(img_bytes, logo_dest, prefer_png=True)
                    logos_saved += 1
                    saved = True
                except Exception as exc:  # pragma: no cover - pillow/runtime
                    logger.warning("Failed to save logo for %s: %s", brand_id, exc)
        if not saved:
            create_placeholder(logo_dest, brand.get("name", brand_id), prefer_png=True)
        # Rewrite URL to local path
        data["brand_identity"]["logo_url"] = f"/static/assets/brands/{brand_id}.png"

    for product in data.get("products", []):
        product_id = product.get("id")
        images: Dict[str, str] = product.get("images", {}) or {}
        main_url = images.get("main")

        if product_id and main_url:
            product_dest = PRODUCT_DIR / f"{product_id}"
            saved = product_dest.with_suffix(".webp").exists()

            if not saved and isinstance(main_url, str) and main_url.startswith("/static/"):
                create_placeholder(product_dest, product.get("name", product_id), prefer_png=False)
                saved = True
            elif not saved:
                fetched = fetch_image(main_url)
                if fetched:
                    img_bytes, _ = fetched
                    try:
                        optimize_and_save(img_bytes, product_dest, prefer_png=False)
                        products_saved += 1
                        saved = True
                    except Exception as exc:  # pragma: no cover
                        logger.warning("Failed to save product image for %s: %s", product_id, exc)
            if not saved:
                create_placeholder(product_dest, product.get("name", product_id), prefer_png=False)
            # Rewrite URL to local path
            images["main"] = f"/static/assets/products/{product_id}.webp"
            product["images"] = images

    # Persist rewritten catalog
    try:
        catalog_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as exc:
        logger.warning("Failed to rewrite %s: %s", catalog_path.name, exc)

    return logos_saved, products_saved


def main() -> None:
    ensure_dirs()

    if not CATALOG_DIR.exists():
        logger.error("Catalog directory missing: %s", CATALOG_DIR)
        return

    total_logos = 0
    total_products = 0

    for catalog in sorted(CATALOG_DIR.glob("*.json")):
        logos, products = process_catalog(catalog)
        total_logos += logos
        total_products += products

    logger.info("Harvest complete. Logos saved: %s | Product images saved: %s", total_logos, total_products)


if __name__ == "__main__":
    main()
