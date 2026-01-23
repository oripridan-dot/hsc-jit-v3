import { useEffect, useState } from "react";
import { consolidateCategory } from "../lib/categoryConsolidator";
import type { Product } from "../types";

/**
 * useCategoryCatalog - Category Consolidation-Aware Product Loading
 *
 * This hook loads products and filters them using the CONSOLIDATED category system.
 * Brand categories are translated to universal UI categories for filtering.
 *
 * Flow:
 * 1. User selects consolidated category (e.g., "keys")
 * 2. Hook loads all brand catalogs
 * 3. For each product, consolidate its brand category to UI category
 * 4. Filter products where consolidated category matches selection
 */

// The list of brands your system tracks (corresponds to your JSON filenames)
const TRACKED_BRANDS = [
  "roland",
  "boss",
  "nord",
  "moog",
  "mackie",
  "adam-audio",
  "akai-professional",
  "teenage-engineering",
  "universal-audio",
  "warm-audio",
];

export const useCategoryCatalog = (
  category: string | null,
  brandId?: string | null,
) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      let aggregated: Product[] = [];

      // If a specific brand is provided, only fetch that brand
      const brandsToFetch = brandId ? [brandId] : TRACKED_BRANDS;

      // Parallel fetch of all Master Files
      const promises = brandsToFetch.map((brand) =>
        fetch(`/data/${brand}.json`) // Files are in public/data/
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          })
          .then((data) => (data as { products: Product[] }).products || [])
          .catch((err) => {
            console.warn(`Failed to load ${brand} master:`, err);
            return [] as Product[];
          }),
      );

      const results = await Promise.all(promises);

      // Flatten arrays
      aggregated = results.flat();

      console.log(
        `📦 [useCategoryCatalog] Loaded ${aggregated.length} total products`,
        brandId ? `for brand: "${brandId}"` : "",
        category ? `category: "${category}"` : "",
      );

      // Filter by CONSOLIDATED category - translate brand categories to UI categories
      const filtered = aggregated.filter((p) => {
        // If no category filter or "All", include everything
        if (!category || category === "All") return true;

        // Get the product's brand and category
        const productBrand = (p.brand || "").toLowerCase();
        const productCategory = p.main_category || p.category || "";

        // Consolidate the product's category to get its UI category ID
        const consolidatedId = consolidateCategory(
          productBrand,
          productCategory,
        );

        // Match against the requested consolidated category
        // The category param should be a consolidated ID like "keys", "drums", etc.
        const requestedCategory = category.toLowerCase();

        if (consolidatedId === requestedCategory) {
          return true;
        }

        // Also check if the category param matches the consolidated category label
        // This handles cases where labels like "Keys & Pianos" are passed
        const labelMappings: Record<string, string> = {
          "keys & pianos": "keys",
          "drums & percussion": "drums",
          "guitars & amps": "guitars",
          "studio & recording": "studio",
          "live sound": "live",
          "dj & production": "dj",
          "software & cloud": "software",
          accessories: "accessories",
        };

        const normalizedCategory =
          labelMappings[requestedCategory] || requestedCategory;
        return consolidatedId === normalizedCategory;
      });

      console.log(
        `🔍 [useCategoryCatalog] Filtered to ${filtered.length} products for consolidated category: "${category}"`,
      );
      if (filtered.length > 0) {
        console.log(`📝 Sample product:`, filtered[0]);
      }

      setProducts(filtered);
      setLoading(false);
    };

    fetchAll();
  }, [category, brandId]);

  return { products, loading };
};
