import React, { useEffect, useMemo, useState } from "react";
import {
  CONSOLIDATED_CATEGORIES,
  type ConsolidatedCategory,
} from "../lib/categoryConsolidator";
import { useNavigationStore } from "../store/navigationStore";

/**
 * Navigator Component - Consolidated Category Navigation
 *
 * ARCHITECTURE PRINCIPLE: "Steady UI, No Surprises"
 *
 * We always display the same 8 universal categories in the same order.
 * Brand selection filters products, but categories NEVER change.
 *
 * This means:
 * - Users always know where to find things
 * - No cognitive load from brand-specific terminology
 * - Categories are in the same place regardless of brand
 *
 * Data Flow:
 * 1. User sees 8 consolidated categories (always the same)
 * 2. Selecting a category shows products from all brands OR current brand
 * 3. Brand filter narrows products, not categories
 */

interface BrandInfo {
  id: string;
  name: string;
  logo_url: string;
  brand_color: string;
  count: number;
}

export const Navigator: React.FC = () => {
  const {
    currentBrand,
    currentCategory,
    currentUniversalCategory,
    selectBrand,
    selectUniversalCategory,
    goHome,
  } = useNavigationStore();

  // Load brands from index.json
  const [brands, setBrands] = useState<BrandInfo[]>([]);

  useEffect(() => {
    fetch("/data/index.json")
      .then((res) => res.json())
      .then((data: unknown) => {
        const indexData = data as { brands?: unknown };
        if (indexData.brands && Array.isArray(indexData.brands)) {
          setBrands(indexData.brands as BrandInfo[]);
        }
      })
      .catch((_err) => console.error("Failed to load brands:", _err));
  }, []);

  // Get consolidated categories - always the same 8 categories
  const consolidatedCategories = useMemo((): ConsolidatedCategory[] => {
    // Always return the same 8 categories in the same order
    return [...CONSOLIDATED_CATEGORIES].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, []);

  return (
    <nav className="h-full w-16 md:w-56 flex flex-col bg-[#050505] border-r border-white/5 z-50">
      <div className="p-3 md:p-4">
        <h1 className="text-[10px] font-black tracking-[0.25em] text-zinc-700 uppercase mb-4 hidden md:block">
          {currentBrand ? currentBrand.name : "Support Center"}
        </h1>

        {/* Back to Brands / Search Button */}
        <button
          onClick={() => goHome()}
          className="w-full bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 p-2.5 rounded flex items-center justify-center gap-2 transition-all mb-4"
        >
          <span className="md:hidden text-sm">{currentBrand ? "←" : "🔍"}</span>
          <span className="hidden md:inline font-bold text-[10px] uppercase tracking-wider">
            {currentBrand ? "← ALL BRANDS" : "SEARCH"}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 px-2">
        {/* ALWAYS show the 8 consolidated categories - steady UI */}
        {consolidatedCategories.map((cat) => {
          const isActive =
            currentUniversalCategory === cat.id ||
            currentCategory === cat.label;

          return (
            <button
              key={cat.id}
              onClick={() => selectUniversalCategory(cat.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded transition-all duration-200 group ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-600 hover:text-white hover:bg-white/5"
              }`}
            >
              {/* Color-coded category indicator */}
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-sm flex-shrink-0"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                {cat.icon}
              </div>
              <span className="text-xs font-medium hidden md:block truncate">
                {cat.label}
              </span>

              {isActive && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: cat.color,
                    boxShadow: `0 0 8px ${cat.color}`,
                  }}
                />
              )}
            </button>
          );
        })}

        {/* Brand filter section - appears below categories */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-2 hidden md:block px-1">
            Filter by Brand
          </div>
          {brands.map((brand) => {
            const isActive = currentBrand?.id === brand.id;

            return (
              <button
                key={brand.id}
                onClick={() => selectBrand(brand.id)}
                className={`w-full flex items-center gap-3 p-2 rounded transition-all duration-200 group ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-600 hover:text-white hover:bg-white/5"
                }`}
              >
                {/* Brand Logo */}
                <div className="w-5 h-5 flex-shrink-0 rounded overflow-hidden bg-zinc-800/50 flex items-center justify-center">
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className={`w-4 h-4 object-contain transition-all ${
                      isActive ? "" : "filter grayscale group-hover:grayscale-0"
                    }`}
                    onError={(e) => {
                      // Fallback to first letter if logo fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `<span class="text-[10px] font-bold">${brand.name[0]}</span>`;
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium hidden md:block">
                  {brand.name}
                </span>

                {isActive && (
                  <div
                    className="ml-auto w-1 h-1 rounded-full shadow-[0_0_8px]"
                    style={{
                      backgroundColor: brand.brand_color || "#00f0ff",
                      boxShadow: `0 0 8px ${brand.brand_color || "#00f0ff"}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="p-3 mt-auto border-t border-white/5">
        <div className="flex items-center gap-1.5 text-[9px] text-zinc-700 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="hidden md:inline">
            {currentBrand ? `${currentBrand.name} FILTER` : "ALL BRANDS"}
          </span>
        </div>
      </div>
    </nav>
  );
};
