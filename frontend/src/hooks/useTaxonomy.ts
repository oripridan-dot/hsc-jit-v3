/**
 * useTaxonomy - Hook for accessing taxonomy data
 *
 * Provides easy access to:
 * 1. Brand categories from taxonomy.json
 * 2. Category-filtered products
 * 3. Subcategory navigation
 */

import { useEffect, useState, useMemo } from "react";
import {
  loadTaxonomyRegistry,
  getBrandTaxonomySync,
  type TaxonomyCategory,
  type BrandTaxonomy,
} from "../lib/taxonomyLoader";

interface UseTaxonomyResult {
  /** All root categories for the brand */
  categories: TaxonomyCategory[];
  /** Get children of a category */
  getChildren: (categoryId: string) => TaxonomyCategory[];
  /** Check if taxonomy is loaded */
  isLoaded: boolean;
  /** Full brand taxonomy object */
  taxonomy: BrandTaxonomy | null;
}

/**
 * Hook to access brand taxonomy
 * @param brandId - Brand identifier
 */
export function useTaxonomy(brandId: string | undefined): UseTaxonomyResult {
  const [taxonomy, setTaxonomy] = useState<BrandTaxonomy | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!brandId) {
      setTaxonomy(null);
      setIsLoaded(false);
      return;
    }

    // First check sync cache
    const cached = getBrandTaxonomySync(brandId);
    if (cached) {
      setTaxonomy(cached);
      setIsLoaded(true);
      return;
    }

    // Load async if not cached
    loadTaxonomyRegistry()
      .then((registry) => {
        const brandTax = registry.brands[brandId.toLowerCase()];
        if (brandTax) {
          setTaxonomy(brandTax);
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        console.warn("Failed to load taxonomy:", err);
        setIsLoaded(true);
      });
  }, [brandId]);

  const categories = useMemo(() => {
    if (!taxonomy) return [];
    return taxonomy.root_categories || [];
  }, [taxonomy]);

  const getChildren = useMemo(() => {
    return (categoryId: string): TaxonomyCategory[] => {
      if (!taxonomy) return [];

      // Find the parent category
      const parent = taxonomy.categories.find((c) => c.id === categoryId);
      if (!parent || !parent.children?.length) return [];

      // Find all children by ID
      return taxonomy.categories.filter((c) =>
        parent.children.includes(c.id)
      );
    };
  }, [taxonomy]);

  return {
    categories,
    getChildren,
    isLoaded,
    taxonomy,
  };
}

/**
 * Hook to get category-filtered products
 * @param products - All products
 * @param categoryLabel - Category label to filter by (from taxonomy)
 */
export function useCategoryProducts<T extends { category?: string; main_category?: string }>(
  products: T[],
  categoryLabel: string | undefined
): T[] {
  return useMemo(() => {
    if (!categoryLabel || !products.length) return products;

    return products.filter((p) => {
      const productCat = p.category || p.main_category;
      if (!productCat) return false;
      
      // Case-insensitive match
      return productCat.toLowerCase() === categoryLabel.toLowerCase();
    });
  }, [products, categoryLabel]);
}

/**
 * Hook to group products by taxonomy categories
 * Returns products organized by their categories
 */
export function useProductsByCategory<T extends { category?: string; main_category?: string }>(
  products: T[],
  brandId: string | undefined
): Record<string, T[]> {
  const { categories } = useTaxonomy(brandId);

  return useMemo(() => {
    const grouped: Record<string, T[]> = {};

    // Initialize all categories
    categories.forEach((cat) => {
      grouped[cat.label] = [];
    });

    // Add "Other" for uncategorized
    grouped["Other"] = [];

    // Sort products into categories
    products.forEach((product) => {
      const productCat = product.category || product.main_category;

      if (!productCat) {
        grouped["Other"].push(product);
        return;
      }

      // Find matching category
      const matchedCat = categories.find(
        (c) => c.label.toLowerCase() === productCat.toLowerCase()
      );

      if (matchedCat) {
        grouped[matchedCat.label].push(product);
      } else {
        // Check if it's a subcategory
        grouped[productCat] = grouped[productCat] || [];
        grouped[productCat].push(product);
      }
    });

    // Remove empty categories
    Object.keys(grouped).forEach((key) => {
      if (grouped[key].length === 0) {
        delete grouped[key];
      }
    });

    return grouped;
  }, [products, categories]);
}

export default useTaxonomy;
