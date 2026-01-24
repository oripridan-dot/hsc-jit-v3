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
import React from "react";
import { BRAND_COLORS } from "../../lib/brandColors";
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
              <span className="text-sm text-cyan-400 font-semibold">
                Selection Active
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: "Unbreakable" Layout - Fits Single Screen */}
      <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3 p-3 lg:p-4 overflow-hidden h-full min-h-0">
        {UNIVERSAL_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="group relative flex flex-col rounded-xl bg-zinc-900/40 border border-white/5 p-3 hover:bg-zinc-800/40 hover:border-white/10 transition-all duration-300 h-full min-h-0 shadow-lg"
          >
            {/* Category Identity */}
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <div
                className="w-1 h-5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white truncate">
                  {category.label}
                </h3>
              </div>
              <div className="text-[9px] text-zinc-600 font-mono">
                {category.subcategories.length}
              </div>
            </div>

            {/* Subcategories Grid: 2 cols x 3 rows (Strict Structure) */}
            <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-2 min-h-0">
              {category.subcategories.map((subcategory) => {
                const isSelected = currentSubcategory === subcategory.id;
                // Get participating brands (limit to 3 for visual balance)
                const brandList = subcategory.brands
                  ? subcategory.brands.slice(0, 3)
                  : [];

                return (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategoryClick(subcategory.id)}
                    className={`
                      relative flex flex-col items-center justify-between p-1.5 rounded-lg transition-all duration-300 group/item text-left w-full h-full overflow-hidden
                      ${
                        isSelected
                          ? "bg-zinc-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border-b border-cyan-500/50"
                          : "bg-black/60 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] border-b border-white/5 hover:bg-black/80"
                      }
                    `}
                  >
                    {/* Thumbnail Container - Flex to fit available height */}
                    <div className="relative w-full flex-1 min-h-0 mb-1 rounded-md flex items-center justify-center overflow-hidden">
                      {/* Deep Slot Shadow */}
                      <div className="absolute inset-0 bg-black/40 shadow-[inset_0_0_15px_rgba(0,0,0,0.9)] rounded-md pointer-events-none z-0" />

                      {/* Brand Lightshow */}
                      <div className="absolute bottom-0.5 w-full flex justify-center gap-1 z-0 px-2 pointer-events-none">
                        {brandList.map((brand, idx) => {
                          const color =
                            BRAND_COLORS[brand] || BRAND_COLORS.default;
                          return (
                            <div
                              key={idx}
                              className={`
                                 h-0.5 w-2 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.2)] transition-all duration-500
                                 ${isSelected ? "opacity-100 shadow-[0_0_6px_currentColor]" : "opacity-30 group-hover/item:opacity-70"}
                               `}
                              style={{
                                backgroundColor: color,
                                color: color,
                              }}
                            />
                          );
                        })}
                      </div>

                      {subcategory.image ? (
                        <img
                          src={subcategory.image}
                          alt={subcategory.label}
                          className={`
                            relative z-10 w-full h-full object-contain p-1 transition-all duration-300 drop-shadow-xl
                            ${isSelected ? "scale-105 opacity-100 brightness-110" : "opacity-90 grayscale-[20%] group-hover/item:grayscale-0 group-hover/item:opacity-100 group-hover/item:scale-105"}
                          `}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 relative z-10">
                          <span className="text-[8px]">NO IMG</span>
                        </div>
                      )}

                      {/* Selection Highlight */}
                      {isSelected && (
                        <div className="absolute inset-0 rounded-md ring-1 ring-cyan-500/30 pointer-events-none" />
                      )}
                    </div>

                    {/* Simple Label */}
                    <div className="w-full text-center flex-shrink-0">
                      <p
                        className={`
                        text-[9px] font-semibold leading-tight tracking-wide truncate
                        ${isSelected ? "text-cyan-400" : "text-zinc-400 group-hover/item:text-zinc-200"}
                      `}
                      >
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
