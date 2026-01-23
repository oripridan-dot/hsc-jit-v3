/**
 * Dynamic Thumbnail Selection
 *
 * Automatically selects category thumbnails based on the most expensive
 * product in each category. This ensures:
 * 1. Always showcasing premium products
 * 2. Fully dynamic - updates when product data changes
 * 3. No manual curation needed
 * 4. Can be leveraged for marketing/featured products later
 */

import type { Product } from "../types";
import { consolidateCategory } from "./categoryConsolidator";

export interface CategoryThumbnail {
  categoryId: string;
  subcategory?: string;
  imageUrl: string;
  productName: string;
  price: number;
  brand: string;
}

/**
 * Get the most expensive product's image for a category
 */
export function getMostExpensiveProductImage(
  products: Product[],
  universalCategoryId?: string,
  subcategory?: string,
): CategoryThumbnail | null {
  if (!products || products.length === 0) return null;

  // Filter by category and subcategory if specified
  let filtered = products;

  if (universalCategoryId) {
    filtered = products.filter((p) => {
      const consolidated = consolidateCategory(p.brand, p.category);
      return consolidated === universalCategoryId;
    });
  }

  if (subcategory) {
    filtered = filtered.filter((p) => {
      // Check both subcategory and category fields
      return (
        p.subcategory?.toLowerCase() === subcategory.toLowerCase() ||
        p.category?.toLowerCase() === subcategory.toLowerCase()
      );
    });
  }

  if (filtered.length === 0) return null;

  // Find the most expensive product (or first one with image if no prices)
  let mostExpensive = filtered[0];
  let hasAnyPrices = false;
  
  for (const product of filtered) {
    const price =
      product.halilit_price ||
      product.pricing?.regular_price ||
      product.pricing?.sale_price ||
      0;
    
    if (price > 0) hasAnyPrices = true;
    
    const maxPrice =
      mostExpensive.halilit_price ||
      mostExpensive.pricing?.regular_price ||
      mostExpensive.pricing?.sale_price ||
      0;

    if (price > maxPrice) {
      mostExpensive = product;
    }
  }
  
  // If no prices found, use first product with a valid image
  if (!hasAnyPrices) {
    const productWithImage = filtered.find((p) => {
      return p.image_url || p.image || p.images;
    });
    if (productWithImage) {
      mostExpensive = productWithImage;
    }
  }

  // Extract image URL (handle both object and array formats)
  let imageUrl = "";

  if (
    typeof mostExpensive.images === "object" &&
    mostExpensive.images !== null
  ) {
    if (Array.isArray(mostExpensive.images)) {
      // Array format: ProductImage[]
      const thumbnailImage = mostExpensive.images.find(
        (img) => img.type === "thumbnail" || img.type === "main",
      );
      imageUrl = thumbnailImage?.url || mostExpensive.images[0]?.url || "";
    } else {
      // Object format: ProductImagesObject
      imageUrl =
        mostExpensive.images.thumbnail || mostExpensive.images.main || "";
    }
  }

  // Fallback to other fields
  if (!imageUrl) {
    imageUrl = mostExpensive.image_url || mostExpensive.image || "";
  }

  if (!imageUrl) return null;

  return {
    categoryId: universalCategoryId || "",
    subcategory,
    imageUrl,
    productName: mostExpensive.name,
    price:
      mostExpensive.halilit_price || mostExpensive.pricing?.regular_price || 0,
    brand: mostExpensive.brand,
  };
}

/**
 * Build a complete thumbnail map for all categories and subcategories
 */
export function buildDynamicThumbnailMap(
  products: Product[],
): Map<string, CategoryThumbnail> {
  const thumbnailMap = new Map<string, CategoryThumbnail>();

  // Universal categories to process
  const universalCategories = [
    "keys",
    "drums",
    "guitars",
    "studio",
    "live",
    "dj",
    "software",
    "accessories",
  ];

  // Build top-level category thumbnails
  universalCategories.forEach((categoryId) => {
    const thumbnail = getMostExpensiveProductImage(products, categoryId);
    if (thumbnail) {
      thumbnailMap.set(categoryId, thumbnail);
    }
  });

  // Build subcategory thumbnails
  // Extract unique subcategories from products
  const subcategoriesByCategory = new Map<string, Set<string>>();

  products.forEach((product) => {
    const universalCat = consolidateCategory(product.brand, product.category);
    if (!universalCat) return;

    const subcategory = product.subcategory || product.category;
    if (!subcategory) return;

    if (!subcategoriesByCategory.has(universalCat)) {
      subcategoriesByCategory.set(universalCat, new Set());
    }
    subcategoriesByCategory.get(universalCat)!.add(subcategory);
  });

  // Generate thumbnails for each subcategory
  subcategoriesByCategory.forEach((subcategories, categoryId) => {
    subcategories.forEach((subcategory) => {
      const thumbnail = getMostExpensiveProductImage(
        products,
        categoryId,
        subcategory,
      );
      if (thumbnail) {
        const key = `${categoryId}:${subcategory}`;
        thumbnailMap.set(key, thumbnail);
      }
    });
  });

  return thumbnailMap;
}

/**
 * Get thumbnail for a specific category/subcategory combination
 */
export function getThumbnailForCategory(
  thumbnailMap: Map<string, CategoryThumbnail>,
  categoryId: string,
  subcategory?: string,
): string | null {
  const key = subcategory ? `${categoryId}:${subcategory}` : categoryId;
  return thumbnailMap.get(key)?.imageUrl || null;
}

/**
 * Get all products sorted by price (for debugging/admin)
 */
export function getTopProductsByCategory(
  products: Product[],
  categoryId: string,
  limit = 10,
): Product[] {
  const filtered = products.filter((p) => {
    const consolidated = consolidateCategory(p.brand, p.category);
    return consolidated === categoryId;
  });

  return filtered
    .sort((a, b) => {
      const priceA =
        a.halilit_price ||
        a.pricing?.regular_price ||
        a.pricing?.sale_price ||
        0;
      const priceB =
        b.halilit_price ||
        b.pricing?.regular_price ||
        b.pricing?.sale_price ||
        0;
      return priceB - priceA; // Descending
    })
    .slice(0, limit);
}
