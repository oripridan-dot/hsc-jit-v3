/**
 * GalaxyDashboard - v3.10.0 REDESIGNED
 * "Full Subcategory Thumbnail Browser"
 *
 * Single-view interface showing all 40 subcategories organized by main categories.
 * Each main category displays its subcategories as clickable thumbnails.
 *
 * Features:
 * - All 8 main categories visible on one page
 * - All 40 subcategories with real product thumbnails
 * - Click subcategory → Load products
 * - Fully responsive (mobile to desktop)
 * - Beautiful category section layout
 */
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { catalogLoader } from "../../lib/catalogLoader";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product } from "../../types";

export const GalaxyDashboard: React.FC = () => {
  const { currentSubcategory, selectSubcategory } = useNavigationStore();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subcategoryGridColumns, setSubcategoryGridColumns] = useState(3);

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
  // 2. RESPONSIVE GRID FOR SUBCATEGORIES
  // ============================================================
  useEffect(() => {
    const calculateSubcategoryColumns = () => {
      const width = window.innerWidth;
      if (width < 640) return 2; // Mobile: 2 columns
      if (width < 768) return 3; // Tablet: 3 columns
      if (width < 1024) return 3; // Small desktop: 3 columns
      if (width < 1280) return 4; // Desktop: 4 columns
      return 5; // Large desktop: 5 columns
    };

    setSubcategoryGridColumns(calculateSubcategoryColumns());

    const handleResize = () => {
      setSubcategoryGridColumns(calculateSubcategoryColumns());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ============================================================
  // 3. HANDLE SUBCATEGORY CLICK
  // ============================================================
  const handleSubcategoryClick = (subcategoryId: string) => {
    selectSubcategory(subcategoryId);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0e0e10] text-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-4 py-3 bg-zinc-900/50">
        <div className="flex items-center justify-between max-w-[2000px] mx-auto">
          <div className="flex-1 font-mono text-xs text-zinc-500">
            {currentSubcategory ? (
              <span>🎯 Category Selected</span>
            ) : (
              <span>🏠 Browse All Categories & Subcategories</span>
            )}
          </div>
          <div className="font-mono text-xs text-zinc-500">
            {allProducts.length} products
          </div>
        </div>
      </div>

      {/* Main Content - All Categories with Subcategories */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="w-full max-w-[2000px] mx-auto space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-500 font-mono text-sm">
                Loading subcategory thumbnails...
              </div>
            </div>
          ) : (
            UNIVERSAL_CATEGORIES.map((category, catIndex) => (
              <motion.section
                key={category.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: catIndex * 0.05 }}
                className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-4 hover:bg-zinc-900/50 transition-colors"
              >
                {/* Category Header */}
                <div className="mb-4 pb-3 border-b border-zinc-800">
                  <h2 className="text-xl font-bold uppercase tracking-tight mb-1">
                    {category.label}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {category.description}
                  </p>
                </div>

                {/* Subcategories Grid */}
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${subcategoryGridColumns}, minmax(0, 1fr))`,
                  }}
                >
                  {category.subcategories?.map((subcategory, subIndex) => (
                    <motion.div
                      key={subcategory.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.2,
                        delay: subIndex * 0.02,
                      }}
                      className={`relative cursor-pointer group overflow-hidden rounded-lg border transition-all duration-300 ${
                        currentSubcategory === subcategory.id
                          ? "border-cyan-500 shadow-lg shadow-cyan-500/50"
                          : "border-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/5"
                      }`}
                      onClick={() => handleSubcategoryClick(subcategory.id)}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative w-full aspect-square bg-zinc-800 overflow-hidden">
                        {/* Background Image */}
                        {subcategory.image && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                            style={{
                              backgroundImage: `url('${subcategory.image}')`,
                            }}
                          />
                        )}

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-75 transition-opacity" />

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-3 z-10">
                          <div className="text-center drop-shadow-lg">
                            <p className="text-sm font-semibold text-white">
                              {subcategory.label}
                            </p>
                            {subcategory.brands && subcategory.brands.length > 0 && (
                              <p className="text-xs text-zinc-300 mt-1 truncate">
                                {subcategory.brands.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {currentSubcategory === subcategory.id && (
                          <motion.div
                            layoutId="selected-indicator"
                            className="absolute top-2 right-2 w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"
                          />
                        )}

                        {/* Hover Border Animation */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
