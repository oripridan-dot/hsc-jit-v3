/**
 * Navigator - Visual Rack Sidebar
 *
 * "See Then Read" paradigm: Logos (brands) and colored icons (categories)
 * No text clutter—just visual discovery.
 *
 * Toggle between Brand and Category modes with minimal UI overhead.
 */

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { catalogLoader } from "../lib/catalogLoader";
import { UNIVERSAL_CATEGORIES } from "../lib/universalCategories";
import { useNavigationStore } from "../store/navigationStore";
import { BrandIcon } from "./BrandIcon";

interface BrandIndexItem {
  id: string;
  name: string;
  slug?: string;
  brand_color?: string;
  logo_url?: string | null;
  product_count: number;
  verified_count?: number;
  data_file: string;
  brand_number?: string;
}

interface CatalogIndex {
  build_timestamp: string;
  version: string;
  total_products: number;
  total_verified: number;
  brands: BrandIndexItem[];
}

export const Navigator = () => {
  const {
    viewMode,
    toggleViewMode,
    selectBrand,
    selectUniversalCategory,
    activePath,
  } = useNavigationStore();
  const [catalogIndex, setCatalogIndex] = useState<CatalogIndex | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the Halilit Catalog Index on mount
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        const index = await catalogLoader.loadIndex();
        setCatalogIndex(index as unknown as CatalogIndex);
        console.log(`✅ Visual Rack loaded: ${index.brands.length} brands`);
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    // Sync active brand to highlight in sidebar
    if (activePath[0] && viewMode === "brand") {
      // Additional sync logic if needed
    }
  }, [activePath, viewMode]);

  return (
    <aside className="w-20 lg:w-60 bg-gradient-to-b from-[#111] to-[#0f0f0f] border-r border-white/5 flex flex-col h-full z-20 transition-all duration-300">
      {/* 1. HEADER */}
      <div className="px-5 py-6 border-b border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
          {/* Authentic Halilit Logo SVG */}
          <svg
            viewBox="0 0 140 40"
            className="h-8 w-auto fill-current text-red-600"
          >
            <path
              d="M12.5,0 L12.5,35 L2.5,35 L2.5,0 L12.5,0 Z M27.5,0 L27.5,35 L17.5,35 L17.5,0 L27.5,0 Z M42.5,0 L42.5,25 L52.5,25 L52.5,35 L32.5,35 L32.5,0 L42.5,0 Z M57.5,0 L57.5,35 L47.5,35 L47.5,0 L57.5,0 Z M72.5,0 L72.5,25 L82.5,25 L82.5,35 L62.5,35 L62.5,0 L72.5,0 Z M87.5,0 L87.5,35 L77.5,35 L77.5,0 L87.5,0 Z M105.0,5 L105.0,35 L95.0,35 L95.0,5 L85.0,5 L85.0,0 L115.0,0 L115.0,5 L105.0,5 Z"
              fill="#E31E24"
            />{" "}
            {/* Simplified textual representation for "HALILIT" branding */}
          </svg>
        </div>

        {/* Visual Mode Toggle - Refined */}
        <div className="bg-black/40 p-0.5 rounded-md flex border border-white/10 gap-0.5">
          <button
            onClick={() => viewMode !== "category" && toggleViewMode()}
            className={`flex-1 py-1 rounded text-[9px] font-bold transition-all ${viewMode === "category" ? "bg-indigo-600/80 text-white shadow-sm shadow-indigo-500/30" : "text-white/40 hover:text-white/60"}`}
            title="Category mode"
          >
            CAT
          </button>
          <button
            onClick={() => viewMode !== "brand" && toggleViewMode()}
            className={`flex-1 py-1 rounded text-[9px] font-bold transition-all ${viewMode === "brand" ? "bg-amber-600/80 text-white shadow-sm shadow-amber-500/30" : "text-white/40 hover:text-white/60"}`}
            title="Brand mode"
          >
            BRD
          </button>
        </div>
      </div>

      {/* 2. THE VISUAL LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : viewMode === "category" ? (
          // MODE A: VISUAL CATEGORIES
          <>
            {UNIVERSAL_CATEGORIES.map((cat) => {
              const isActive = activePath[0] === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => selectUniversalCategory(cat.id)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg group transition-all ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/50"}`}
                  title={cat.label}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${isActive ? "scale-110 shadow-md shadow-current" : "grayscale group-hover:grayscale-0"}`}
                    style={{ backgroundColor: cat.color, color: "black" }}
                  >
                    {cat.label[0]}
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <div
                      className={`text-sm font-semibold ${isActive ? "text-white" : "text-white/70"}`}
                    >
                      {cat.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        ) : (
          // MODE B: BRAND LOGOS
          <>
            {catalogIndex?.brands &&
              catalogIndex.brands.map((brand) => {
                const isActive = activePath[0] === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => selectBrand(brand.id)}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg group transition-all ${isActive ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"}`}
                    title={brand.name}
                  >
                    {/* The Logo Container */}
                    <div className="w-7 h-7 bg-white rounded-md p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <BrandIcon
                        brand={brand.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Brand Name (Desktop Only) */}
                    <div className="hidden lg:block text-left min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}
                      >
                        {brand.name}
                      </div>
                      <div className="text-[10px] text-white/30 truncate">
                        {brand.product_count} Items
                      </div>
                    </div>
                  </button>
                );
              })}
          </>
        )}
      </div>

      {/* 3. GLOBAL SEARCH TRIGGER */}
      <div className="px-3 py-4 border-t border-white/5 bg-gradient-to-t from-[#0f0f0f] to-transparent">
        <button className="w-full flex items-center gap-1.5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/15 p-2 rounded-lg text-left text-white/40 hover:text-white/60 transition-all">
          <Search size={13} className="shrink-0" />
          <span className="text-[11px] hidden lg:inline">Jump...</span>
          <kbd className="hidden lg:inline ml-auto bg-black/40 px-1.5 rounded text-[8px] font-mono border border-white/10 text-white/30">
            ⌘K
          </kbd>
        </button>
      </div>
    </aside>
  );
};
