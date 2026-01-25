/**
 * Image Resolver: Ensures every product has a valid image URL
 * Falls back to brand logo if product image is missing/invalid
 */

export const PLACEHOLDER_COLORS = {
  primary: "#1a1a1a",
  accent: "#ff9900",
};

/**
 * Resolve a valid image URL for a product
 * Prioritizes: product image > brand logo > generated placeholder
 */
export function resolveProductImage(product: any): string {
  if (!product) {
    console.warn("⚠️ NO PRODUCT PROVIDED");
    return generatePlaceholderImage("Unknown");
  }

  // 1. Try product image_url first (normalized)
  if (product.image_url && isValidImageUrl(product.image_url)) {
    console.log("🖼️ RESOLVE IMAGE:", {
      url: product.image_url,
      product: product.name,
    });
    return product.image_url;
  }

  // 2. Try product image field (alternative format)
  if (product.image && isValidImageUrl(product.image)) {
    console.log("🖼️ RESOLVE IMAGE (alt):", {
      url: product.image,
      product: product.name,
    });
    return product.image;
  }

  // 3. Try nested media thumbnail
  if (product.media?.thumbnail && isValidImageUrl(product.media.thumbnail)) {
    console.log("🖼️ RESOLVE MEDIA THUMBNAIL:", {
      url: product.media.thumbnail,
      product: product.name,
    });
    return product.media.thumbnail;
  }

  // 4. Try gallery
  if (
    product.media?.gallery &&
    Array.isArray(product.media.gallery) &&
    product.media.gallery.length > 0
  ) {
    const firstImage = product.media.gallery[0];
    if (isValidImageUrl(firstImage)) {
      console.log("🖼️ RESOLVE GALLERY IMAGE:", {
        url: firstImage,
        product: product.name,
      });
      return firstImage;
    }
  }

  // 5. Fall back to brand logo
  if (product.logo_url && isValidImageUrl(product.logo_url)) {
    console.log("📌 RESOLVE LOGO:", {
      url: product.logo_url,
      product: product.name,
    });
    return product.logo_url;
  }

  // 6. Return a generic placeholder
  console.warn("⚠️ RESOLVE PLACEHOLDER for:", {
    product: product.name,
    has_image_url: !!product.image_url,
    has_image: !!product.image,
    has_media: !!product.media,
    has_logo_url: !!product.logo_url,
  });
  return generatePlaceholderImage(product.name || product.brand || "Product");
}

/**
 * Check if image URL looks valid
 * Just checks if it has a valid image extension
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Should have file extension
  const imageExtensions = /\.(jpg|jpeg|png|gif|svg|webp)$/i;
  return imageExtensions.test(url);
}

/**
 * Generate a data URL placeholder image for products without images
 */
export function generatePlaceholderImage(productName: string): string {
  // Create a simple SVG placeholder with product name hint
  const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${PLACEHOLDER_COLORS.primary};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="300" height="300" fill="url(#grad)"/>
    <circle cx="150" cy="120" r="50" fill="${PLACEHOLDER_COLORS.accent}" opacity="0.2"/>
    <rect x="40" y="190" width="220" height="80" fill="${PLACEHOLDER_COLORS.accent}" opacity="0.15" rx="4"/>
    <text x="150" y="275" font-family="monospace" font-size="11" font-weight="bold" fill="${PLACEHOLDER_COLORS.accent}" text-anchor="middle" opacity="0.6">
      LOADING IMAGE...
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Batch resolve images for multiple products
 */
export function resolveProductImages(products: any[]): any[] {
  return products.map((product) => ({
    ...product,
    resolved_image_url: resolveProductImage(product),
  }));
}
