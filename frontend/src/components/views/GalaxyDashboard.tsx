/**
 * GalaxyDashboard v3.12.0 - "No Scroll Thumbnails"
 * =================================================
 * 8 category cards with thumbnail images, all visible without scrolling.
 * 
 * Layout:
 * - 2×4 grid (8 category cards)
 * - Each card shows subcategory thumbnails in compact grid
 * - Thumbnail + label for each subcategory
 * - Everything fits in viewport
 */
import { motion } from "framer-motion";
import React from "react";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { useNavigationStore } from "../../store/navigationStore";

export const GalaxyDashboard: React.FC = () => {
  const { currentSubcategory, selectSubcategory } = useNavigationStore();

  const handleSubcategoryClick = (subcategoryId: string) => {
    selectSubcategory(subcategoryId);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0e0e10] text-white overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-4 py-2 bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-zinc-400">
            {currentSubcategory ? "🎯 Category Selected" : "🌌 Galaxy View"}
          </span>
        </div>
      </div>

      {/* 2×4 Grid: 8 category cards, no scrolling */}
      <main className="flex-1 grid grid-cols-2 gap-3 p-3 overflow-hidden">
        {UNIVERSAL_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-3 flex flex-col overflow-hidden"
            style={{ borderColor: category.color + "30" }}
          >
            {/* Category Header - Ultra Compact */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <h3 className="text-xs font-bold uppercase tracking-tight truncate flex-1">
                {category.label}
              </h3>
            </div>

            {/* Subcategories Grid - Thumbnail + Text */}
            <div className="grid grid-cols-3 gap-2 flex-1 overflow-hidden">
              {category.subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryClick(subcategory.id)}
                  className={`
                    relative group flex flex-col items-center rounded-md p-2 transition-all duration-200 overflow-hidden
                    ${
                      currentSubcategory === subcategory.id
                        ? "bg-cyan-500/15 ring-2 ring-cyan-500/60"
                        : "bg-zinc-800/30 ring-1 ring-zinc-700/30 hover:bg-zinc-700/40 hover:ring-zinc-600/50"
                    }
                  `}
                >
                  {/* Thumbnail Image */}
                  {subcategory.image && (
                    <div className="w-full aspect-square mb-1.5 rounded overflow-hidden bg-zinc-800/50">
                      <img
                        src={subcategory.image}
                        alt={subcategory.label}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  )}

                  {/* Label */}
                  <p className="text-[9px] font-medium text-white text-center leading-tight line-clamp-2">
                    {subcategory.label}
                  </p>

                  {/* Selection Indicator */}
                  {currentSubcategory === subcategory.id && (
                    <motion.div
                      layoutId="galaxy-selection"
                      className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};
