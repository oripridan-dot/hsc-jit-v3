/**
 * GalaxyDashboard v3.11.1 - "Breathing Space"
 * ============================================
 * Clean, spacious layout with proper padding and no visual clutter.
 * 
 * Design Philosophy:
 * - More space, less noise
 * - Clean buttons without background images
 * - Generous padding for readability
 * - Single column subcategories for clarity
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
      {/* Spacious Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-6 py-4 bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-zinc-400">
            {currentSubcategory ? "🎯 Category Selected" : "🌌 Galaxy View"}
          </span>
        </div>
      </div>

      {/* Spacious Grid: 2 columns × 4 rows with generous gaps */}
      <main className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-hidden">
        {UNIVERSAL_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="border border-zinc-800 rounded-xl bg-zinc-900/20 p-5 flex flex-col overflow-hidden"
            style={{ borderColor: category.color + "30" }}
          >
            {/* Category Header - Spacious */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800/50">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h3 className="text-base font-bold uppercase tracking-tight flex-1">
                {category.label}
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                {category.subcategories.length}
              </span>
            </div>

            {/* Subcategories - Single Column, Clean Buttons */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {category.subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryClick(subcategory.id)}
                  className={`
                    relative group rounded-lg text-left px-4 py-3 transition-all duration-200
                    ${
                      currentSubcategory === subcategory.id
                        ? "bg-cyan-500/15 border-2 border-cyan-500/60 shadow-lg shadow-cyan-500/20"
                        : "bg-transparent border-2 border-zinc-800/50 hover:bg-zinc-800/30 hover:border-zinc-700/70"
                    }
                  `}
                >
                  {/* Content - No Background Image */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">
                      {subcategory.label}
                    </p>
                    
                    {/* Selection Indicator */}
                    {currentSubcategory === subcategory.id && (
                      <motion.div
                        layoutId="galaxy-selection"
                        className="w-2 h-2 rounded-full bg-cyan-400"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};
