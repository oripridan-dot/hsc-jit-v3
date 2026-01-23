/**
 * Workbench - The Chameleon View Router + Navigation Hub
 * Routes between different view components based on current level
 * Now includes Breadcrumbs and LayerNavigator for hierarchical navigation
 */
import React, { useEffect, useState } from "react";
import { useCategoryProducts } from "../hooks/useTaxonomy";
import { catalogLoader } from "../lib/catalogLoader";
import { useNavigationStore } from "../store/navigationStore";
import type { Product } from "../types";
import { Breadcrumbs, LayerNavigator } from "./ui";
import { GalaxyDashboard } from "./views/GalaxyDashboard";
import { ProductCockpit } from "./views/ProductCockpit";
import { UniversalCategoryView } from "./views/UniversalCategoryView";

export const Workbench: React.FC = () => {
  const {
    currentLevel,
    currentUniversalCategory,
    selectedProduct,
    activePath,
    currentBrand,
    currentCategory,
    goHome,
  } = useNavigationStore();
  const [brandProducts, setBrandProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use taxonomy-aware category filtering
  const categoryProducts = useCategoryProducts(
    brandProducts,
    currentCategory ?? undefined,
  );

  // Load brand products when brand is selected
  useEffect(() => {
    if (currentLevel === "brand" && activePath[0]) {
      setIsLoading(true);
      catalogLoader
        .loadBrand(activePath[0])
        .then((catalog) => {
          setBrandProducts(catalog.products || []);
          setIsLoading(false);
        })
        .catch((error) => {
          console.warn(
            `Redirecting to home - failed to load brand: ${activePath[0]}`,
            error,
          );
          goHome();
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, activePath[0]]);

  // The "Router" logic - switch views based on state machine level
  const renderView = () => {
    // Priority -1: Product Detail View (Deepest drill-down)
    if (currentLevel === "product" && selectedProduct) {
      return <ProductCockpit product={selectedProduct} />;
    }

    // Priority 0: Universal Category View (New Architecture)
    // Let the UniversalCategoryView fetch its own data using useCategoryCatalog hook
    if (currentLevel === "universal" && currentUniversalCategory) {
      return <UniversalCategoryView />;
    }

    // Priority 1: Category/Family View with LayerNavigator
    if (currentLevel === "family" && currentCategory) {
      // Use category-filtered products from taxonomy
      const displayProducts =
        categoryProducts.length > 0 ? categoryProducts : brandProducts;

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
