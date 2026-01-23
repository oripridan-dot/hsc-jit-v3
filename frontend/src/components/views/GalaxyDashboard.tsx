/**
 * GalaxyDashboard - v3.8.0 SCREEN 1
 * "Bird's Eye View of Halilit's Reach"
 *
 * The master control center showing all universal categories.
 * Click a category to dive into SCREEN 2 (Sub-Category Module with Spectrum View).
 *
 * Features:
 * - Adaptive grid (1-6 columns based on viewport)
 * - Dynamic thumbnails (most expensive product per category)
 * - Touch-optimized for mobile
 * - Smooth transitions between screens
 */
import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { catalogLoader } from "../../lib/catalogLoader";
import {
  buildDynamicThumbnailMap,
  getThumbnailForCategory,
  type CategoryThumbnail,
} from "../../lib/dynamicThumbnails";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product } from "../../types";

// Placeholder for when no images are available
const DEFAULT_FALLBACK = "/assets/react.svg";

export const GalaxyDashboard: React.FC = () => {
  const { selectUniversalCategory } =
    useNavigationStore();
  const [gridColumns, setGridColumns] = useState(3);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================
  // 1. LOAD ALL PRODUCTS FROM ALL BRANDS
  // ============================================================
  useEffect(() => {
    const loadAllProducts = async () => {
      setIsLoading(true);

      try {
        // 1. Load the Master Index first to see available brands
        const index = await catalogLoader.loadIndex();
        const availableBrands = index.brands.map((b) => b.id);

        console.log("📦 Available brands in index:", availableBrands);

        // 2. Load only available brand catalogs
        const catalogPromises = availableBrands.map((brand) =>
          catalogLoader.loadBrand(brand).catch((err) => {
            console.warn(`Failed to load brand ${brand}:`, err);
            return null;
          }),
        );

        const catalogs = await Promise.all(catalogPromises);

        // Combine all products
        const allProds: Product[] = [];
        catalogs.forEach((catalog) => {
          if (catalog?.products) {
            allProds.push(...catalog.products);
          }
        });

        setAllProducts(allProds);
        console.log(
          `✅ Loaded ${allProds.length} products for dynamic thumbnails`,
        );
      } catch (err) {
        console.warn("Failed to load products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllProducts();
  }, []);

  // ============================================================
  // 2. BUILD DYNAMIC THUMBNAIL MAP (MOST EXPENSIVE PRODUCTS)
  // ============================================================
  const thumbnailMap = useMemo(() => {
    if (allProducts.length === 0) return new Map();
    return buildDynamicThumbnailMap(allProducts);
  }, [allProducts]);

  // Calculate responsive grid columns
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) return 1; // Mobile
      if (width < 1024) return 2; // Tablet
      if (width < 1280) return 2; // Small desktop
      if (width < 1536) return 3; // Desktop
      return 3; // Large screens
    };

    setGridColumns(calculateColumns());

    const handleResize = () => {
      setGridColumns(calculateColumns());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Derive visible categories from UNIVERSAL_CATEGORIES
  const visibleCategories = UNIVERSAL_CATEGORIES.slice(0, 6); // Limit to 6 for grid fit

  // ============================================================
  // 3. ENHANCE CATEGORIES WITH DYNAMIC SUBCATEGORY THUMBNAILS
  // ============================================================
  const enhancedCategories = useMemo(() => {
    console.log(
      "🔍 Building enhanced categories with",
      thumbnailMap.size,
      "thumbnails",
    );

    return visibleCategories.map((cat) => {
      // Get dynamic thumbnail for main category
      const mainThumbnail = getThumbnailForCategory(thumbnailMap, cat.id);
      const hasContent = !!mainThumbnail;

      // Enhance subcategories with dynamic thumbnails
      const enhancedSubcategories = cat.subcategories?.map((sub) => {
        const subThumbnail = getThumbnailForCategory(
          thumbnailMap,
          cat.id,
          sub.label,
        );
        return {
          ...sub,
          image: subThumbnail || sub.image || DEFAULT_FALLBACK,
          hasContent: !!subThumbnail,
        };
      });

      return {
        ...cat,
        mainThumbnail: mainThumbnail || DEFAULT_FALLBACK,
        subcategories: enhancedSubcategories,
        hasContent,
      };
    });
  }, [visibleCategories, thumbnailMap]);

  const handleCategoryClick = (categoryId: string) => {
    selectUniversalCategory(categoryId);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0e0e10] text-white overflow-hidden">
      {/* Compact Header */}
      <header className="flex-shrink-0 h-14 px-6 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <div className="flex flex-col leading-none select-none">
            <span
              className="text-3xl font-black text-white"
              style={{
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                textTransform: "lowercase",
                fontStyle: "italic",
              }}
            >
              halilit
            </span>
            <span className="text-[0.5rem] font-semibold text-zinc-600 tracking-[0.2em] uppercase">
              Support Center
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-600 font-mono">
          <span className="text-green-500">● ONLINE</span>
          <span>v3.7.6 DYNAMIC</span>
        </div>
      </header>

      {/* Compact Grid - All Categories Visible */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full w-full max-w-[2000px] mx-auto flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-500 font-mono text-sm">
                Loading dynamic thumbnails...
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 grid gap-3 auto-rows-fr"
              style={{
                gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                gridTemplateRows: "repeat(2, minmax(0, 1fr))",
              }}
            >
              {enhancedCategories.map((cat, index) => {
                const thumbnail = thumbnailMap.get(cat.id) as CategoryThumbnail | undefined;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="relative cursor-pointer group"
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    {/* Category Card */}
                    <div className="relative w-full h-full rounded-xl border border-white/10 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
                      {/* Thumbnail Background */}
                      {thumbnail?.imageUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-300"
                          style={{
                            backgroundImage: `url('${thumbnail.imageUrl}')`,
                          }}
                        />
                      )}

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
                        <div className="text-xs text-zinc-300">
                          {cat.subcategories?.length || 0} subcategories
                        </div>
                      </div>

                      {/* Hover Indicator */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Compact Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-3 text-center flex-shrink-0"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800 text-xs">
              <button className="font-mono text-zinc-500 hover:text-cyan-400 transition-colors">
                SEARCH
              </button>
              <div className="w-px h-3 bg-zinc-700" />
              <button className="font-mono text-zinc-500 hover:text-cyan-400 transition-colors">
                BRANDS
              </button>
              <div className="w-px h-3 bg-zinc-700" />
              <span className="font-mono text-zinc-700">
                {allProducts.length} products
              </span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
