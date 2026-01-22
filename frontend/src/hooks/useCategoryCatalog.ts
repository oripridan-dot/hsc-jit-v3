import { useEffect, useState } from "react";
import type { Product } from "../types";

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

export const useCategoryCatalog = (category: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      let aggregated: Product[] = [];

      // Parallel fetch of all Master Files
      const promises = TRACKED_BRANDS.map((brand) =>
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
        `📦 [useCategoryCatalog] Loaded ${aggregated.length} total products for category: "${category}"`,
      );

      // Filter by the requested Category Context
      // This logic allows for broad matching (e.g., "Keys" matches "Synthesizers", "Pianos")
      const filtered = aggregated.filter((p) => {
        if (!category || category === "All") return true;

        const catLower = category.toLowerCase();

        // Primary: Check main_category field (this is what our seed data uses)
        const mainCat = (p.main_category || p.category || "").toLowerCase();
        const subCat = (p.subcategory || p.family || "").toLowerCase();
        const searchSpace = `${mainCat} ${subCat}`.toLowerCase();

        // Direct match first (most reliable)
        if (mainCat.includes(catLower)) return true;

        // Handle composite category names like "Keys & Pianos"
        if (
          catLower.includes("keys") &&
          (mainCat.includes("keys") ||
            searchSpace.includes("piano") ||
            searchSpace.includes("synth") ||
            searchSpace.includes("keyboard"))
        )
          return true;
        if (
          catLower.includes("drums") &&
          (mainCat.includes("drums") ||
            searchSpace.includes("drum") ||
            searchSpace.includes("percussion"))
        )
          return true;
        if (
          catLower.includes("studio") &&
          (mainCat.includes("studio") ||
            searchSpace.includes("interface") ||
            searchSpace.includes("monitor") ||
            searchSpace.includes("microphone"))
        )
          return true;
        if (
          catLower.includes("guitar") &&
          (mainCat.includes("guitar") ||
            searchSpace.includes("guitar") ||
            searchSpace.includes("amp"))
        )
          return true;
        if (
          catLower.includes("dj") &&
          (mainCat.includes("dj") ||
            searchSpace.includes("dj") ||
            searchSpace.includes("production"))
        )
          return true;
        if (
          catLower.includes("pa") &&
          (mainCat.includes("pa") ||
            searchSpace.includes("speaker") ||
            searchSpace.includes("live"))
        )
          return true;

        return searchSpace.includes(catLower);
      });

      console.log(
        `🔍 [useCategoryCatalog] Filtered to ${filtered.length} products for category: "${category}"`,
      );
      if (filtered.length > 0) {
        console.log(`📝 Sample product:`, filtered[0]);
      }

      setProducts(filtered);
      setLoading(false);
    };

    fetchAll();
  }, [category]);

  return { products, loading };
};
