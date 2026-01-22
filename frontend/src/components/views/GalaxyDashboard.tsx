/**
 * GalaxyDashboard / Halilit Master Desk
 *
 * "The Atmosphere" meets "Digital Showroom"
 * Fully responsive layout with:
 * - Adaptive grid (1-6 columns based on viewport)
 * - Smooth scrolling support
 * - Professional category cards
 * - Touch-optimized for mobile
 */
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { cn } from "../../lib/utils";
import { useNavigationStore } from "../../store/navigationStore";
import { CandyCard } from "../ui/CandyCard";

// ------------------------------------------------------------------
// CONFIGURATION: Map your categories to "Candy Shop" images here
// ------------------------------------------------------------------
const CATEGORY_IMAGES: Record<string, string[]> = {
  "Keys & Pianos": [
    "/data/product_images/nord/nord-nord-electro-7_thumb.webp",
    "/data/product_images/nord/nord-nord-lead-a1_thumb.webp",
    "/data/product_images/roland/roland-fantom_series_thumb.webp",
    "/data/product_images/roland/roland-gokeys_5_thumb.webp",
  ],
  "Drums & Percussion": [
    "/data/product_images/nord/nord-nord-drum-3p_thumb.webp",
    "/data/product_images/roland/roland-prod-1_thumb.webp",
    "/data/product_images/akai-professional/akai-professional-prod-2_thumb.webp",
    "/data/product_images/akai-professional/akai-professional-prod-3_thumb.webp",
  ],
  "Guitars & Amps": [
    "/data/product_images/boss/boss-eurus_gs-1_thumb.webp",
    "/data/product_images/boss/boss-gx-10_thumb.webp",
    "/data/product_images/boss/boss-prod-1_thumb.webp",
    "/data/product_images/boss/boss-prod-2_thumb.webp",
  ],
  "Studio & Recording": [
    "/data/product_images/universal-audio/universal-audio-prod-1_thumb.webp",
    "/data/product_images/adam-audio/adam-audio-prod-1_thumb.webp",
    "/data/product_images/focusrite/focusrite-prod-1_thumb.webp",
    "/data/product_images/warm-audio/warm-audio-prod-1_thumb.webp",
  ],
  "Live Sound": [
    "/data/product_images/mackie/mackie-prod-1_thumb.webp",
    "/data/product_images/roland/roland-bridge_cast_thumb.webp",
    "/data/product_images/roland/roland-prod-3_thumb.webp",
    "/data/product_images/mackie/mackie-prod-2_thumb.webp",
  ],
  "DJ & Production": [
    "/data/product_images/teenage-engineering/teenage-engineering-prod-1_thumb.webp",
    "/data/product_images/roland/roland-cb-404_thumb.webp",
    "/data/product_images/roland/roland-rh-5_thumb.webp",
    "/data/product_images/teenage-engineering/teenage-engineering-prod-4_thumb.webp",
  ],
  Default: ["/assets/react.svg"],
};

export const GalaxyDashboard: React.FC = () => {
  const { selectUniversalCategory, selectSubcategory } = useNavigationStore();
  const [gridColumns, setGridColumns] = useState(3);

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
                    images={
                      CATEGORY_IMAGES[cat.label] || CATEGORY_IMAGES["Default"]
                    }
                    subcategories={cat.subcategories}
                    onClick={() => handleCategoryClick(cat.id)}
                    onSubcategoryClick={(sub) =>
                      handleSubcategoryClick(cat.id, sub)
                    }
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
