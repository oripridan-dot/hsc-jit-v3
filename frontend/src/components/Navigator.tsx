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

  return (
    <aside className="w-[80px] lg:w-[240px] bg-[#0f0f0f] border-r border-white/5 flex flex-col h-full z-20">
      {/* 1. HEADER & SEARCH */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-6 lg:mb-4 justify-center lg:justify-start">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="font-black text-white">H</span>
          </div>
          <span className="font-bold text-white hidden lg:block tracking-tight">
            Halilit SC
          </span>
        </div>

        {/* Visual Mode Toggle */}
        <div className="bg-black/50 p-1 rounded-lg flex border border-white/10">
          <button
            onClick={() => viewMode !== "category" && toggleViewMode()}
            className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${viewMode === "category" ? "bg-indigo-600 text-white shadow" : "text-white/40 hover:text-white"}`}
            title="Category mode"
          >
            CAT
          </button>
          <button
            onClick={() => viewMode !== "brand" && toggleViewMode()}
            className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${viewMode === "brand" ? "bg-amber-600 text-white shadow" : "text-white/40 hover:text-white"}`}
            title="Brand mode"
          >
            BRD
          </button>
        </div>
      </div>

      {/* 2. THE VISUAL LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
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
                  className={`w-full flex items-center gap-3 p-2 rounded-lg group transition-all ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/50"}`}
                  title={cat.label}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${isActive ? "scale-110 shadow-lg" : "grayscale group-hover:grayscale-0"}`}
                    style={{ backgroundColor: cat.color, color: "black" }}
                  >
                    {cat.label[0]}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div
                      className={`text-xs font-bold ${isActive ? "text-white" : "text-white/70"}`}
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
                    className={`w-full flex items-center gap-3 p-2 rounded-lg group transition-all ${isActive ? "bg-white/10 ring-1 ring-white/20" : "hover:bg-white/5"}`}
                    title={brand.name}
                  >
                    {/* The Logo Container */}
                    <div className="w-8 h-8 bg-white rounded-md p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <BrandIcon
                        brand={brand.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Brand Name (Desktop Only) */}
                    <div className="hidden lg:block text-left min-w-0">
                      <div
                        className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}
                      >
                        {brand.name}
                      </div>
                      <div className="text-[9px] text-white/30 truncate">
                        {brand.product_count} Products
                      </div>
                    </div>
                  </button>
                );
              })}
          </>
        )}
      </div>

      {/* 3. GLOBAL SEARCH TRIGGER */}
      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-lg text-left text-white/40 hover:text-white transition-colors">
          <Search size={14} />
          <span className="text-xs hidden lg:inline">Quick Jump...</span>
          <kbd className="hidden lg:inline ml-auto bg-black px-1.5 rounded text-[9px] font-mono border border-white/10">
            ⌘K
          </kbd>
        </button>
      </div>
    </aside>
  );
};
