/**
 * GalaxyDashboard v3.13.0 - "UI/UX Basics"
 * ==========================================
 * Optimized layout for intuitive 16:9 desktop experience.
 * 
 * Layout Strategy:
 * - 4 columns × 2 rows (Optimizes vertical breathing room)
 * - Taller cards allow for proper square thumbnails
 * - "App Grid" feel for subcategories
 * - Clear hierarchy and affordances
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
    <div className="h-full w-full flex flex-col bg-[#0e0e10] text-white overflow-hidden font-sans">
      {/* Header - Simple & Clean */}
      <div className="flex-shrink-0 border-b border-zinc-800/50 px-6 py-3 bg-zinc-900/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-sm font-medium text-zinc-300 tracking-wide">
            GALAXY VIEW
          </span>
          {currentSubcategory && (
            <>
              <span className="text-zinc-600">/</span>
              <span className="text-sm text-cyan-400 font-semibold">Selection Active</span>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: 4 columns × 2 rows
          Why? Most screens are wider than tall. 
          Dividing height by 2 gives much more vertical breathing room than dividing by 4.
      */}
      <main className="flex-1 grid grid-cols-4 grid-rows-2 gap-4 p-4 lg:p-6 overflow-hidden">
        {UNIVERSAL_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="group relative flex flex-col rounded-2xl bg-zinc-900/40 border border-white/5 p-4 hover:bg-zinc-800/40 hover:border-white/10 transition-all duration-300"
          >
            {/* Category Identity */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-1.5 h-6 rounded-full" 
                style={{ backgroundColor: category.color }} 
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white truncate">
                  {category.label}
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium tracking-wide">
                  {category.subcategories.length} COLLECTIONS
                </p>
              </div>
            </div>

            {/* Subcategories Grid - 2 cols x 3 rows (or auto fit) */}
            <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden content-start">
              {category.subcategories.map((subcategory) => {
                const isSelected = currentSubcategory === subcategory.id;
                
                return (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategoryClick(subcategory.id)}
                    className={`
                      relative flex flex-col items-center p-2 rounded-xl transition-all duration-200 group/item
                      ${
                        isSelected
                          ? "bg-cyan-500/10 ring-1 ring-cyan-500/50"
                          : "bg-black/20 hover:bg-white/5 ring-1 ring-white/0 hover:ring-white/10"
                      }
                    `}
                  >
                    {/* Thumbnail Container - Aspect Square + Fit */}
                    <div className="relative w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden bg-black/40">
                      {subcategory.image ? (
                        <img
                          src={subcategory.image}
                          alt={subcategory.label}
                          className={`
                            w-full h-full object-contain transition-all duration-300
                            ${isSelected ? "scale-105 opacity-100" : "opacity-80 group-hover/item:opacity-100 group-hover/item:scale-105"}
                          `}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <span className="text-[9px]">NO IMG</span>
                        </div>
                      )}
                      
                      {/* Selection Badge */}
                      {isSelected && (
                        <motion.div
                          layoutId="selbox"
                          className="absolute inset-0 border-2 border-cyan-500/50 rounded-lg"
                        />
                      )}
                    </div>

                    {/* Simple Label */}
                    <div className="w-full text-center">
                      <p className={`
                        text-[10px] font-medium leading-tight line-clamp-2
                        ${isSelected ? "text-cyan-400" : "text-zinc-400 group-hover/item:text-zinc-200"}
                      `}>
                        {subcategory.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};
