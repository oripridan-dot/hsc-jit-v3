/**
 * Workbench - The Chameleon View Router + Navigation Hub
 * Routes between different view components based on current level
 * Now includes Breadcrumbs and LayerNavigator for hierarchical navigation
 */
import React, { useEffect, useState } from "react";
import { catalogLoader } from "../lib/catalogLoader";
import { useNavigationStore } from "../store/navigationStore";
import { useCategoryProducts } from "../hooks/useTaxonomy";
import type { Product } from "../types";
import { Breadcrumbs, LayerNavigator } from "./ui";
import { GalaxyDashboard } from "./views/GalaxyDashboard";
import { UniversalCategoryView } from "./views/UniversalCategoryView";

export const Workbench: React.FC = () => {
  const {
    currentLevel,
    currentUniversalCategory,
    selectedProduct,
    activePath,
    currentBrand,
    currentCategory,
  } = useNavigationStore();
  const [brandProducts, setBrandProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use taxonomy-aware category filtering
  const categoryProducts = useCategoryProducts(brandProducts, currentCategory ?? undefined);

  // Load brand products when brand is selected
  useEffect(() => {
    if (currentLevel === "brand" && activePath[0]) {
      setIsLoading(true);
      catalogLoader.loadBrand(activePath[0]).then((catalog) => {
        setBrandProducts(catalog.products || []);
        setIsLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, activePath[0]]);

  // The "Router" logic - switch views based on state machine level
  const renderView = () => {
    // Priority -1: Product Detail View (Deepest drill-down)
    if (currentLevel === "product" && selectedProduct) {
      return (
        <div className="flex-1 h-full flex flex-col bg-[#09090b]">
          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Product Detail - Now scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-custom p-4 md:p-8 pb-32">
            <div className="max-w-6xl mx-auto">
              {/* Product Hero */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
                {/* Image */}
                <div className="bg-white/5 rounded-2xl p-6 md:p-8 flex items-center justify-center">
                  <img
                    src={selectedProduct.image_url || selectedProduct.image}
                    alt={selectedProduct.name}
                    className="max-w-full max-h-64 md:max-h-96 object-contain"
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center">
                  <div className="text-sm text-zinc-500 uppercase tracking-widest mb-2">
                    {selectedProduct.brand}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
                    {selectedProduct.name}
                  </h1>
                  <div className="text-3xl md:text-4xl font-mono text-[#00ff94] mb-6">
                    ₪
                    {(
                      selectedProduct.halilit_price ||
                      selectedProduct.pricing?.regular_price ||
                      0
                    ).toLocaleString()}
                  </div>
                  <p className="text-zinc-400 leading-relaxed mb-8">
                    {selectedProduct.description ||
                      "Professional-grade equipment from " +
                        selectedProduct.brand}
                  </p>

                  {/* Specs Grid */}
                  {selectedProduct.specifications &&
                    selectedProduct.specifications.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {selectedProduct.specifications.map((spec, idx) => (
                          <div key={idx} className="bg-white/5 rounded p-3">
                            <div className="text-xs text-zinc-500 uppercase">
                              {spec.key}
                            </div>
                            <div className="text-white font-mono text-sm">
                              {spec.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 bg-[#00ff94] text-black font-bold py-3 md:py-4 px-6 rounded-lg hover:bg-[#00cc77] transition-colors">
                      Add to Cart
                    </button>
                    <button className="px-6 py-3 md:py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors text-white">
                      ♡
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Priority 0: Universal Category View (New Architecture)
    // Let the UniversalCategoryView fetch its own data using useCategoryCatalog hook
    if (currentLevel === "universal" && currentUniversalCategory) {
      return <UniversalCategoryView />;
    }

    // Priority 1: Category/Family View with LayerNavigator
    if (currentLevel === "family" && currentCategory) {
      // Use category-filtered products from taxonomy
      const displayProducts = categoryProducts.length > 0 ? categoryProducts : brandProducts;
      
      return (
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Layer Navigator for drilling deeper */}
          <div className="flex-1 overflow-y-auto p-8 pb-32">
            <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-8">
              {currentCategory || activePath[1] || "Category"}
              <span className="text-lg font-normal text-[var(--text-secondary)] ml-4">
                ({displayProducts.length} products)
              </span>
            </h1>
            <LayerNavigator
              products={displayProducts}
              currentLevel="category"
              isMultiBrand={false}
            />
          </div>
        </div>
      );
    }

    // Priority 2: Brand View with Layer Navigator
    if (currentLevel === "brand" && brandProducts.length > 0) {
      return (
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Layer Navigator for browsing categories */}
          <div className="flex-1 overflow-y-auto p-8 pb-32">
            <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-8">
              {currentBrand?.name || activePath[0] || "Brand"}
            </h1>
            <LayerNavigator
              products={brandProducts}
              currentLevel="brand"
              isMultiBrand={false}
            />
          </div>
        </div>
      );
    }

    // Default: Galaxy Dashboard (home view)
    return <GalaxyDashboard />;
  };

  return (
    <div className="flex-1 h-full bg-[var(--bg-app)] transition-colors duration-500 overflow-hidden relative flex flex-col">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-transparent to-[var(--bg-app)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {renderView()}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-app)]/50 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};
