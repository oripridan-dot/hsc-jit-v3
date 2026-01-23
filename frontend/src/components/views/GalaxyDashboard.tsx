/**
 * GalaxyDashboard / Halilit Master Desk
 *
 * "The Atmosphere" meets "Digital Showroom"
 * Fully responsive layout with:
 * - Adaptive grid (1-6 columns based on viewport)
 * - Smooth scrolling support
 * - Professional category cards
 * - Touch-optimized for mobile
 *
 * ⭐ DYNAMIC IMAGE HARVESTING:
 * Instead of hardcoded paths, we pull real images from loaded catalogs.
 * This ensures the dashboard always displays valid product images that exist.
 */
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { catalogLoader } from "../../lib/catalogLoader";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { cn } from "../../lib/utils";
import { useNavigationStore } from "../../store/navigationStore";
import { CandyCard } from "../ui/CandyCard";

// Placeholder for when no images are available
const DEFAULT_FALLBACK = ["/assets/react.svg"];

export const GalaxyDashboard: React.FC = () => {
  const { selectUniversalCategory, selectSubcategory, selectBrand } =
    useNavigationStore();
  const [gridColumns, setGridColumns] = useState(3);
  const [catalogImages, setCatalogImages] = useState<Record<string, string[]>>(
    {},
  );

  // ============================================================
  // 1. DYNAMIC IMAGE HARVESTER
  // Load all brand catalogs and extract valid images
  // ============================================================
  useEffect(() => {
    const loadCatalogImages = async () => {
      const imageLookup: Record<string, string[]> = {};

      // Main brands to load (matches your available catalogs)
      const brands = [
        "roland",
        "nord",
        "moog",
        "boss",
        "akai-professional",
        "universal-audio",
        "warm-audio",
        "mackie",
        "teenage-engineering",
      ];

      try {
        // Load all brand catalogs in parallel
        const catalogPromises = brands.map((brand) =>
          catalogLoader.loadBrand(brand).catch(() => null),
        );

        const catalogs = await Promise.all(catalogPromises);

        // Extract images from each catalog
        catalogs.forEach((catalog, idx) => {
          if (!catalog?.products) return;

          const brand = brands[idx];
          const images = catalog.products
            .map((p) => p.images?.thumbnail || p.image_url)
            .filter((url): url is string => Boolean(url) && url.length > 0)
            .slice(0, 4); // Limit to 4 images per category

          if (images.length > 0) {
            imageLookup[brand] = images;
          }
        });

        // Build category-to-images mapping based on loaded data
        const categoryImages: Record<string, string[]> = {};

        // Map categories to available brand images
        const categoryBrandMap: Record<string, string[]> = {
          "Keys & Pianos": ["roland", "nord", "moog"],
          "Drums & Percussion": ["roland", "boss", "akai-professional"],
          "Guitars & Amps": ["boss", "roland"],
          "Studio & Recording": ["universal-audio", "warm-audio", "moog"],
          "Live Sound": ["mackie", "roland", "universal-audio"],
          "DJ & Production": [
            "teenage-engineering",
            "roland",
            "akai-professional",
          ],
        };

        // Populate category images from available brand data
        for (const [category, brands] of Object.entries(categoryBrandMap)) {
          const images: string[] = [];
          for (const brand of brands) {
            if (imageLookup[brand]) {
              images.push(...imageLookup[brand]);
            }
          }
          if (images.length > 0) {
            categoryImages[category] = images.slice(0, 4);
          }
        }

        setCatalogImages(categoryImages);
      } catch (err) {
        console.warn("Failed to load catalog images:", err);
      }
    };

    loadCatalogImages();
  }, []);

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

  const handleCategoryClick = (categoryId: string) => {
    selectUniversalCategory(categoryId);
  };

  const handleSubcategoryClick = (categoryId: string, subcategory: string) => {
    selectSubcategory(categoryId, subcategory);
  };

  const handleBrandClick = (brandId: string) => {
    selectBrand(brandId);
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
          <span>v3.7.5</span>
        </div>
      </header>

      {/* Compact Grid - All Categories Visible */}
      <main className="flex-1 overflow-y-auto scrollbar-custom p-6">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
              "grid gap-4",
              gridColumns === 1 && "grid-cols-1",
              gridColumns === 2 && "grid-cols-2",
              gridColumns === 3 && "grid-cols-3",
            )}
          >
            {visibleCategories.map((cat, index) => {
              // Use dynamic images from loaded catalogs, fallback to placeholder
              const categoryImages =
                catalogImages[cat.label] || DEFAULT_FALLBACK;

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="relative"
                >
                  <CandyCard
                    title={cat.label}
                    subtitle={`${cat.description || "ARM TRACK"}`}
                    images={categoryImages}
                    subcategories={cat.subcategories}
                    onClick={() => handleCategoryClick(cat.id)}
                    onSubcategoryClick={(sub) =>
                      handleSubcategoryClick(cat.id, sub)
                    }
                    onBrandClick={handleBrandClick}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Compact Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800 text-xs">
              <button className="font-mono text-zinc-500 hover:text-cyan-400 transition-colors">
                SEARCH
              </button>
              <div className="w-px h-3 bg-zinc-700" />
              <button className="font-mono text-zinc-500 hover:text-cyan-400 transition-colors">
                BRANDS
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
