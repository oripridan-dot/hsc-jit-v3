/**
 * Workbench - The Chameleon View Router + Navigation Hub
 * Routes between different view components based on current level
 * Now includes Breadcrumbs and LayerNavigator for hierarchical navigation
 */
import React, { useEffect, useState } from "react";
import { catalogLoader } from "../lib/catalogLoader";
import {
  getCategoryById,
  mapProductToUniversal,
} from "../lib/universalCategories";
import { useNavigationStore } from "../store/navigationStore";
import type { Product } from "../types";
import { Breadcrumbs, LayerNavigator } from "./ui";
import { GalaxyDashboard } from "./views/GalaxyDashboard";
import { UniversalCategoryView } from "./views/UniversalCategoryView";

export const Workbench: React.FC = () => {
  const { currentLevel, currentUniversalCategory, activePath, currentBrand } =
    useNavigationStore();
  const [universalProducts, setUniversalProducts] = useState<Product[]>([]);
  const [brandProducts, setBrandProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load ALL products if we are in Universal Mode
  useEffect(() => {
    if (currentLevel === "universal") {
      setIsLoading(true);
      catalogLoader.loadAllProducts().then((products) => {
        setUniversalProducts(products);
        setIsLoading(false);
      });
    }
  }, [currentLevel]);

  // Load brand products when brand is selected
  useEffect(() => {
    if (currentLevel === "brand" && activePath[0]) {
      setIsLoading(true);
      catalogLoader.loadBrand(activePath[0]).then((catalog) => {
        setBrandProducts(catalog.products || []);
        setIsLoading(false);
      });
    }
  }, [currentLevel, activePath[0]]);

  // Filter category products when category is selected
  useEffect(() => {
    if (
      currentLevel === "family" &&
      brandProducts.length > 0 &&
      activePath[1]
    ) {
      const filtered = brandProducts.filter(
        (p) => p.category === activePath[1],
      );
      setCategoryProducts(filtered);
    }
  }, [currentLevel, activePath, brandProducts]);

  // The "Router" logic - switch views based on state machine level
  const renderView = () => {
    // Priority 0: Universal Category View (New Architecture)
    if (currentLevel === "universal" && currentUniversalCategory) {
      const filtered = universalProducts.filter(
        (p) => mapProductToUniversal(p) === currentUniversalCategory,
      );
      const categoryDef = getCategoryById(currentUniversalCategory);
      const categoryLabel = categoryDef?.label || currentUniversalCategory;
      return (
        <UniversalCategoryView
          categoryTitle={categoryLabel}
          products={filtered}
        />
      );
    }

    // Priority 1: Category/Family View with LayerNavigator
    if (currentLevel === "family" && categoryProducts.length > 0) {
      return (
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Layer Navigator for drilling deeper */}
          <div className="flex-1 overflow-y-auto p-8 pb-32">
            <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-8">
              {activePath[1] || "Category"}
            </h1>
            <LayerNavigator
              products={categoryProducts}
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
