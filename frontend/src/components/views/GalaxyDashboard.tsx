/**
 * GalaxyDashboard - v3.9.0 REDESIGNED
 * "Interactive Category & Subcategory Browser"
 *
 * Two-level interface:
 * LEVEL 1: 8 main categories with subcategory grids
 * LEVEL 2: Subcategories as clickable thumbnails → Spectrum Module
 *
 * Features:
 * - Full subcategory thumbnail grid (40 total)
 * - Dynamic product loading based on selection
 * - Bottom buttons show sub-divisions
 * - Smooth navigation between levels
 * - Back button to return to main categories
 */
import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { catalogLoader } from "../../lib/catalogLoader";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product } from "../../types";

// Placeholder for when no images are available
const _DEFAULT_FALLBACK = "/assets/react.svg";

export const GalaxyDashboard: React.FC = () => {
  const {
    currentUniversalCategory,
    currentSubcategory,
    selectUniversalCategory,
    selectSubcategory,
  } = useNavigationStore();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gridColumns, setGridColumns] = useState(3);

  // ============================================================
  // 1. LOAD ALL PRODUCTS
  // ============================================================
  useEffect(() => {
    const loadAllProducts = async () => {
      setIsLoading(true);
      try {
        const index = await catalogLoader.loadIndex();
        const availableBrands = index.brands.map((b) => b.id);

        const catalogPromises = availableBrands.map((brand) =>
          catalogLoader.loadBrand(brand).catch((err) => {
            console.warn(`Failed to load brand ${brand}:`, err);
            return null;
          }),
        );

        const catalogs = await Promise.all(catalogPromises);
        const allProds: Product[] = [];
        catalogs.forEach((catalog) => {
          if (catalog?.products) {
            allProds.push(...catalog.products);
          }
        });

        setAllProducts(allProds);
        console.log(`✅ Loaded ${allProds.length} products`);
      } catch (err) {
        console.warn("Failed to load products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllProducts();
  }, []);

  // ============================================================
  // 2. RESPONSIVE GRID
  // ============================================================
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) return 2;
      if (width < 1024) return 3;
      if (width < 1280) return 3;
      if (width < 1536) return 4;
      return 4;
    };

    setGridColumns(calculateColumns());

    const handleResize = () => setGridColumns(calculateColumns());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ============================================================
  // 3. DETERMINE VIEW MODE
  // ============================================================
  const selectedCategory = useMemo(() => {
    return UNIVERSAL_CATEGORIES.find((c) => c.id === currentUniversalCategory);
  }, [currentUniversalCategory]);

  const selectedSubcategory = useMemo(() => {
    if (!selectedCategory) return null;
    return selectedCategory.subcategories?.find(
      (s) => s.id === currentSubcategory,
    );
  }, [selectedCategory, currentSubcategory]);

  const handleCategoryClick = (categoryId: string) => {
    selectUniversalCategory(categoryId);
  };

  const handleSubcategoryClick = (subcategoryId: string | null) => {
    selectSubcategory(subcategoryId);
  };

  const handleBackToMainCategories = () => {
    selectUniversalCategory(null);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0e0e10] text-white overflow-hidden">
      {/* Header with back button and breadcrumb */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-4 py-3 bg-zinc-900/50">
        <div className="flex items-center gap-3 max-w-[2000px] mx-auto">
          {(currentUniversalCategory || currentSubcategory) && (
            <button
              onClick={handleBackToMainCategories}
              className="px-3 py-1 rounded text-sm bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              ← Back to Categories
            </button>
          )}
          <div className="flex-1 font-mono text-xs text-zinc-500">
            {currentUniversalCategory && selectedCategory && (
              <span>
                {selectedCategory.label}
                {currentSubcategory && selectedSubcategory && (
                  <span> → {selectedSubcategory.label}</span>
                )}
              </span>
            )}
            {!currentUniversalCategory && (
              <span>🏠 SELECT A CATEGORY</span>
            )}
          </div>
          <div className="font-mono text-xs text-zinc-500">
            {allProducts.length} products
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full w-full max-w-[2000px] mx-auto flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-500 font-mono text-sm">
                Loading products...
              </div>
            </div>
          ) : !currentUniversalCategory ? (
            // VIEW 1: MAIN CATEGORIES GRID
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 grid gap-3 auto-rows-fr"
              style={{
                gridTemplateColumns: `repeat(${Math.min(gridColumns, 4)}, minmax(0, 1fr))`,
                gridTemplateRows: "repeat(2, minmax(0, 1fr))",
              }}
            >
              {UNIVERSAL_CATEGORIES.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="relative cursor-pointer group"
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  <div className="relative w-full h-full rounded-xl border border-white/10 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                      <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-lg">
                        {cat.label}
                      </h3>
                      <p className="text-sm text-zinc-200 mb-4 drop-shadow">
                        {cat.description}
                      </p>
                      <div className="text-xs text-zinc-300 font-mono">
                        {cat.subcategories?.length || 0} types
                      </div>
                    </div>

                    {/* Hover Indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // VIEW 2: SUBCATEGORIES GRID
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col gap-3"
            >
              {/* Category Title */}
              <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  {selectedCategory?.label}
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {selectedCategory?.description}
                </p>
              </div>

              {/* Subcategories Grid */}
              <div
                className="flex-1 grid gap-3 auto-rows-max overflow-y-auto"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(2, gridColumns)}, minmax(0, 1fr))`,
                }}
              >
                {selectedCategory?.subcategories?.map((sub, index) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`relative cursor-pointer group rounded-lg overflow-hidden border transition-all duration-300 ${
                      currentSubcategory === sub.id
                        ? "border-cyan-500 shadow-lg shadow-cyan-500/50"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    onClick={() => handleSubcategoryClick(sub.id)}
                  >
                    {/* Thumbnail Background */}
                    <div className="relative w-full aspect-square bg-zinc-900">
                      {sub.image && (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                          style={{
                            backgroundImage: `url('${sub.image}')`,
                          }}
                        />
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                      {/* Label */}
                      <div className="absolute inset-0 flex items-end p-3 z-10">
                        <div className="text-sm font-semibold truncate drop-shadow-lg">
                          {sub.label}
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {currentSubcategory === sub.id && (
                        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Bottom Control Bar */}
      {currentUniversalCategory && selectedCategory && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900/50 p-3"
        >
          <div className="max-w-[2000px] mx-auto">
            {currentSubcategory && selectedSubcategory ? (
              // Show detailed info for selected subcategory
              <div className="flex items-center gap-3 justify-between">
                <div className="font-mono text-xs text-zinc-400">
                  <div className="font-semibold text-white mb-1">
                    {selectedSubcategory.label}
                  </div>
                  <div>
                    {selectedSubcategory.brands?.join(", ") || "Multiple brands"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectSubcategory(null)}
                    className="px-3 py-1 rounded text-xs bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            ) : (
              // Show subcategory buttons
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedCategory?.subcategories?.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubcategoryClick(sub.id)}
                    className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition-all duration-200 ${
                      currentSubcategory === sub.id
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/50"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
