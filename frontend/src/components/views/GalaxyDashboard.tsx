/**
 * GalaxyDashboard v3.11.0 - "Perfect Fit Grid"
 * ============================================
 * NO SCROLL. All 8 categories + subcategories visible in one screen.
 * 
 * Layout Strategy:
 * - 2×4 grid of main categories (fills viewport height)
 * - Each category shows icon + subcategories as compact buttons
 * - Click subcategory → Navigates to Spectrum Module
 * 
 * Removed:
 * - Product loading (not needed here)
 * - Responsive grid calculations (fixed layout)
 * - Staggered animations (instant load)
 * - Scrolling main content
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

      {/* Perfect Fit Grid: 2 columns × 4 rows = 8 categories */}
      <main className="flex-1 grid grid-cols-2 gap-3 p-3 overflow-hidden">
        {UNIVERSAL_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="border border-zinc-800 rounded-lg bg-zinc-900/30 p-3 flex flex-col overflow-hidden"
            style={{ borderColor: category.color + "40" }}
          >
            {/* Category Header - Compact */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800/50">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h3 className="text-sm font-bold uppercase tracking-tight truncate flex-1">
                {category.label}
              </h3>
              <span className="text-[10px] text-zinc-500">
                {category.subcategories.length}
              </span>
            </div>

            {/* Subcategories - Compact Button Grid */}
            <div className="grid grid-cols-2 gap-1.5 flex-1 overflow-y-auto custom-scrollbar">
              {category.subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryClick(subcategory.id)}
                  className={`
                    relative group rounded text-left p-2 transition-all duration-200
                    ${
                      currentSubcategory === subcategory.id
                        ? "bg-cyan-500/20 border border-cyan-500/50"
                        : "bg-zinc-800/30 border border-zinc-700/30 hover:bg-zinc-700/40 hover:border-zinc-600/50"
                    }
                  `}
                >
                  {/* Subcategory Image Background */}
                  {subcategory.image && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity rounded"
                      style={{ backgroundImage: `url('${subcategory.image}')` }}
                    />
                  )}

                  {/* Content */}
                  <div className="relative z-10">
                    <p className="text-[11px] font-semibold text-white truncate">
                      {subcategory.label}
                    </p>
                  </div>

                  {/* Selection Dot */}
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
