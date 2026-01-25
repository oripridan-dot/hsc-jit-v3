/**
 * Data Normalizer: Handles different data structures from various brands
 * Normalizes all product data to a consistent format
 */

import type { Product } from "../types";

/**
 * Normalize a raw product from any brand to standard Product format
 * Handles differences in data structure across Roland, Boss, Nord, etc.
 */
export function normalizeProduct(rawProduct: any): Product {
  // Start with a copy of the raw product
  const product: any = {
    id: rawProduct.id || "",
    name: rawProduct.name || "Unknown Product",
    brand: rawProduct.brand || "",
    category:
      rawProduct.category || rawProduct.main_category || "uncategorized",
    main_category:
      rawProduct.main_category || rawProduct.category || "uncategorized",
    description: rawProduct.description || "",

    // Image URL: Try multiple locations
    image_url:
      rawProduct.image_url || // Roland format
      rawProduct.image || // Alternative format
      rawProduct.media?.thumbnail || // Boss/Nord nested format
      rawProduct.media?.gallery?.[0] || // Gallery fallback
      "",

    // Pricing: Try multiple locations
    pricing: extractPrice(rawProduct),

    // Optional fields
    logo_url: rawProduct.logo_url,
    url: rawProduct.url || rawProduct.commercial?.link,
    sku: rawProduct.sku || rawProduct.halilit_id,
    status: rawProduct.status || "IN_STOCK",

    // Media/Gallery
    images: normalizeImages(rawProduct),
    official_gallery:
      rawProduct.official_gallery || rawProduct.media?.gallery || [],

    // Specs and details
    specifications:
      rawProduct.specifications ||
      rawProduct.specs ||
      rawProduct.official_specs,
    features: rawProduct.features || [],

    // Documentation
    official_manuals: rawProduct.official_manuals || rawProduct.manual_urls,

    // Relationships
    necessities: rawProduct.necessities,
    accessories: rawProduct.accessories,
    related: rawProduct.related,

    // Metadata
    verified: true,
  };

  return product as Product;
}

/**
 * Extract price from various data structures
 */
function extractPrice(product: any): any {
  // Try direct pricing object first
  if (product.pricing && typeof product.pricing === "object") {
    return product.pricing;
  }

  // Try nested commercial pricing
  if (
    product.commercial?.price !== undefined &&
    product.commercial.price !== null
  ) {
    return {
      regular_price: product.commercial.price,
      currency: "ILS",
    };
  }

  // Try direct price field
  if (product.price !== undefined && product.price !== null) {
    return {
      regular_price: product.price,
      currency: "ILS",
    };
  }

  // Return empty object if no pricing found
  return {};
}

/**
 * Normalize images array to consistent format
 */
function normalizeImages(product: any): any[] {
  const images = product.images || [];

  // If empty, try to build from other sources
  if (!Array.isArray(images) || images.length === 0) {
    const imageUrl = product.image_url || product.image;
    if (imageUrl) {
      return [
        {
          url: imageUrl,
          type: "main",
        },
      ];
    }
    return [];
  }

  return images;
}

/**
 * Batch normalize products
 */
export function normalizeProducts(rawProducts: any[]): Product[] {
  if (!Array.isArray(rawProducts)) {
    console.warn("Expected array of products, got:", typeof rawProducts);
    return [];
  }

  return rawProducts.map((p) => {
    try {
      return normalizeProduct(p);
    } catch (error) {
      console.warn("Failed to normalize product:", p, error);
      return normalizeProduct({}); // Return empty normalized product
    }
  });
}
