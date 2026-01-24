import { useEffect, useMemo, useState } from "react";
import { consolidateCategory } from "../lib/categoryConsolidator";
import { useNavigationStore } from "../store/navigationStore";
import type { Product } from "../types";

/**
 * useCategoryCatalog - REAL-TIME CATEGORY COMPUTATION
 *
 * ✅ UNIFIED: Loads ALL brand catalogs and computes categories in real-time
 * - Loads all brand catalogs once (cached)
 * - When category selected: filters all brands + combines results
 * - Categories are DERIVED from brand catalogs (not pre-built)
 * - Single brand catalogs are source of truth
 *
 * Flow:
 * 1. Load all brand catalogs (once, cached)
 * 2. User selects "Keys & Pianos" category
 * 3. Real-time: Filter each brand's products by category
 * 4. Combine results from all brands
 * 5. Display: Products from all brands in that category
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
  const [allBrandCatalogs, setAllBrandCatalogs] = useState<
    Record<string, Product[]>
  >({});

  // Use store for error handling
  const { setCatalogLoading, setCatalogError } = useNavigationStore();

  // STEP 1: Load ALL brand catalogs once (cached)
  useEffect(() => {
    const fetchAllBrands = async () => {
      setLoading(true);
      setCatalogLoading(true);

      try {
        const brandsToFetch = brandId ? [brandId] : TRACKED_BRANDS;

        // Parallel fetch of all brand catalogs
        const promises = brandsToFetch.map((brand) =>
          fetch(`/data/${brand}.json`)
            .then((res) => {
              const contentType = res.headers.get("content-type");
              if (
                !res.ok ||
                (contentType && !contentType.includes("application/json"))
              ) {
                return null;
              }
              return res.json();
            })
            .then((data) => {
              if (!data) return null;
              return {
                brand,
                products: (data as { products: Product[] }).products || [],
              };
            })
            .catch(() => null),
        );

        const results = await Promise.all(promises);

        // Build map of brand → products
        const catalogs: Record<string, Product[]> = {};
        results.forEach((result) => {
          if (result) {
            catalogs[result.brand] = result.products;
          }
        });

        setAllBrandCatalogs(catalogs);

        console.log(
          `📦 [REAL-TIME CATEGORIES] Loaded ${Object.keys(catalogs).length} brand catalogs`,
          brandsToFetch,
        );

        setCatalogError(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setCatalogError(errorMessage);
        setAllBrandCatalogs({});
      } finally {
        setLoading(false);
        setCatalogLoading(false);
      }
    };

    fetchAllBrands();
  }, [brandId, setCatalogLoading, setCatalogError]);

  // STEP 2: Compute category in real-time by filtering + combining brands
  const filtered = useMemo(() => {
    if (!category) {
      // No category selected, return all products
      const all = Object.values(allBrandCatalogs).flat();
      console.log(
        `📦 [REAL-TIME CATEGORIES] No category filter: ${all.length} products from all brands`,
      );
      return all;
    }

    // Filter each brand's products by consolidated category
    const categoryProducts: Product[] = [];

    for (const [brandName, brandProducts] of Object.entries(allBrandCatalogs)) {
      const brandFiltered = brandProducts.filter((p) => {
        // Get product's category
        const productBrand = brandName.toLowerCase();
        const productCategory = p.main_category || p.category || "";

        // Consolidate to UI category
        const consolidatedId = consolidateCategory(
          productBrand,
          productCategory,
        );

        // Match requested category
        const requestedCategory = category.toLowerCase();

        if (consolidatedId === requestedCategory) {
          return true;
        }

        // Also handle label matching
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

      categoryProducts.push(...brandFiltered);
    }

    console.log(
      `🔍 [REAL-TIME CATEGORIES] Category "${category}" computed: ${categoryProducts.length} products from ${Object.keys(allBrandCatalogs).length} brands`,
    );

    return categoryProducts;
  }, [allBrandCatalogs, category]);

  // Update products when filtered results change
  useEffect(() => {
    setProducts(filtered);
  }, [filtered]);

  return { products, loading, allBrandCatalogs };
};
