import { useEffect, useState } from "react";
import { catalogLoader } from "../lib/catalogLoader";
import type { Product } from "../types";

interface IndexBrand {
  slug: string;
}

export const useCategoryProducts = (subcategoryId: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      if (!subcategoryId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        // 1. Get List of Brands
        let brandsToFetch: string[] = ["roland", "boss", "nord"]; // Defaults
        try {
          const indexRes = await fetch("/data/index.json");
          if (indexRes.ok) {
            const indexData = (await indexRes.json()) as {
              brands?: IndexBrand[];
            };
            if (indexData.brands)
              brandsToFetch = indexData.brands.map((b) => b.slug);
          }
        } catch {
          console.warn("Could not load index.json, using defaults");
        }

        // 2. Load all catalogs
        const allProducts: Product[] = [];
        await Promise.all(
          brandsToFetch.map(async (brand) => {
            try {
              const catalog = await catalogLoader.loadBrand(brand);
              allProducts.push(...catalog.products);
            } catch (e) {
              console.warn(`Failed to load ${brand}`, e);
            }
          }),
        );

        // 3. Filter by Subcategory Logic
        const getSearchTerms = (id: string) => {
          switch (id) {
            // Manual overrides for tricky IDs
            case "dj-gear":
              return ["dj"];
            case "guitar-amps":
              return ["amp"];
            case "midi-controllers":
              return ["midi", "controller"];
            case "audio-interfaces":
              return ["interface"];
            case "monitors":
              return ["monitor", "speaker"];
            case "microphones":
              return ["mic", "condenser", "dynamic"];
            case "cables":
              return ["cable"];
            case "cases":
              return ["case", "bag"];
            case "stands":
              return ["stand"];
            default:
              return id.split("-").filter((t) => t.length > 2);
          }
        };

        const terms = getSearchTerms(subcategoryId);
        const filtered = allProducts.filter((p) => {
          const searchString =
            `${p.category || ""} ${p.family || ""} ${p.name || ""} ${p.tags?.join(" ") || ""}`.toLowerCase();
          return terms.some((term) => searchString.includes(term));
        });

        // Return valid Products
        setProducts(filtered);
      } catch (err) {
        console.error("Error loading category products", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [subcategoryId]);

  return { products, loading };
};
