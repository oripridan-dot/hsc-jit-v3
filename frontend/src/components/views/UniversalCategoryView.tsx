import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { useCategoryCatalog } from "../../hooks/useCategoryCatalog";
import { cn } from "../../lib/utils";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product } from "../../types";
import { ModularRack } from "../smart-views/ModularRack";
import { TierBar } from "../smart-views/TierBar";
import { ProductGrid } from "../ui/ProductGrid";

// View modes for different display preferences
type ViewMode = "shelves" | "grid" | "compact" | "rack";

export const UniversalCategoryView: React.FC = () => {
  const { currentUniversalCategory } = useNavigationStore();
  const [viewMode, setViewMode] = useState<ViewMode>("shelves");
  const [sortBy, setSortBy] = useState<"name" | "price" | "brand">("name");

  // Category to load - comes from navigation store
  const activeCategory = currentUniversalCategory || "All";

  // SINGLE SOURCE OF TRUTH: Fetch ALL products that match this category across ALL brands
  const { products, loading } = useCategoryCatalog(activeCategory);

  // Debug logging
  console.log(
    `📦 [UniversalCategoryView] Active category: "${activeCategory}", Products count: ${products.length}, Loading: ${loading}`,
  );

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "price":
        return sorted.sort((a, b) => {
          const priceA =
            typeof a.halilit_price === "number"
              ? a.halilit_price
              : a.pricing?.regular_price || 0;
          const priceB =
            typeof b.halilit_price === "number"
              ? b.halilit_price
              : b.pricing?.regular_price || 0;
          return priceA - priceB;
        });
      case "brand":
        return sorted.sort((a, b) =>
          (a.brand || "").localeCompare(b.brand || ""),
        );
      default:
        return sorted;
    }
  }, [products, sortBy]);

  // Group by Subcategory to create the "Shelf" structure
  const shelves = useMemo(() => {
    console.log(
      `🗂️ [UniversalCategoryView] Building shelves from ${products.length} products`,
    );
    if (!products.length) {
      console.warn(`⚠️ [UniversalCategoryView] No products to display!`);
      return {};
    }
    const groups: Record<string, Product[]> = {};

    sortedProducts.forEach((p) => {
      // Use subcategory or fall back to 'General'
      // Clean up messy data (trim whitespace, handle nulls)
      const key = (p.subcategory || p.family || "Misc").trim();

      // Filter out empty keys resulting from just whitespace
      if (!key) return;

      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedProducts]);

  const shelfNames = Object.keys(shelves).sort();

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#09090b] text-[#00f0ff] font-mono animate-pulse">
        ACCESSING GLOBAL INVENTORY...
      </div>
    );

  return (
    <div className="h-full w-full bg-[#09090b] flex flex-col">
      {/* Enhanced Header with Controls */}
      <div className="flex-shrink-0 px-4 md:px-8 py-6 border-b border-white/5 bg-[#0e0e10]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">
              Department
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
              {activeCategory}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Product Count */}
            <div className="text-right hidden sm:block">
              <div className="text-xl md:text-2xl font-mono text-white">
                {products.length}
              </div>
              <div className="text-zinc-600 text-[10px] uppercase">
                Active Units
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-mono">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "price" | "brand")
                }
                className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="brand">Brand</option>
              </select>
            </div>

            {/* View Mode Toggles */}
            <div className="flex items-center gap-1 bg-zinc-900 rounded p-1 border border-zinc-800 flex-wrap">
              <button
                onClick={() => setViewMode("shelves")}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono rounded transition-all",
                  viewMode === "shelves"
                    ? "bg-cyan-500 text-black font-bold"
                    : "text-zinc-500 hover:text-white",
                )}
                title="Shelves View"
              >
                📚 Shelves
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono rounded transition-all",
                  viewMode === "grid"
                    ? "bg-cyan-500 text-black font-bold"
                    : "text-zinc-500 hover:text-white",
                )}
                title="Grid View"
              >
                ▦ Grid
              </button>
              <button
                onClick={() => setViewMode("compact")}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono rounded transition-all",
                  viewMode === "compact"
                    ? "bg-cyan-500 text-black font-bold"
                    : "text-zinc-500 hover:text-white",
                )}
                title="Compact View"
              >
                ▤ Compact
              </button>
              <button
                onClick={() => setViewMode("rack")}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono rounded transition-all",
                  viewMode === "rack"
                    ? "bg-purple-500 text-black font-bold"
                    : "text-zinc-500 hover:text-white",
                )}
                title="Rack Modular View"
              >
                🎛️ Rack
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Now with Scrolling */}
      <div className="flex-1 overflow-y-auto scrollbar-custom px-4 md:px-8 py-6">
        {viewMode === "shelves" && shelfNames.length > 0 && (
          <div className="space-y-6 pt-48">
            {shelfNames.map((shelfName, i) => (
              <motion.div
                key={shelfName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <TierBar
                  label={shelfName}
                  products={shelves[shelfName]}
                  className="mb-12"
                />
              </motion.div>
            ))}
          </div>
        )}

        {viewMode === "grid" && (
          <ProductGrid
            products={sortedProducts}
            minThumbnailSize={150}
            showBrandIcon={true}
            showPrice={true}
            compactMode={false}
          />
        )}

        {viewMode === "compact" && (
          <ProductGrid
            products={sortedProducts}
            minThumbnailSize={120}
            showBrandIcon={true}
            showPrice={true}
            compactMode={true}
          />
        )}

        {viewMode === "rack" && shelfNames.length > 0 && (
          <div className="pt-48">
            <ModularRack
              categoryName={activeCategory}
              subcategories={shelfNames.map((name) => ({
                name,
                products: shelves[name],
              }))}
            />
          </div>
        )}

        {products.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-30">
            <div className="text-center">
              <div className="text-6xl mb-4">📂</div>
              <div className="font-mono text-lg">NO DATA IN CATEGORY</div>
              <div className="text-sm text-zinc-600 mt-2">
                Try selecting a different category
              </div>
            </div>
          </div>
        )}

        {/* Scroll to top button */}
        <motion.button
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: "all" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 w-12 h-12 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full shadow-xl flex items-center justify-center font-bold text-xl transition-colors z-50"
          title="Scroll to top"
        >
          ↑
        </motion.button>
      </div>
    </div>
  );
};
