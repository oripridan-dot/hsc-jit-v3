/**
 * Workbench - The Chameleon View Router + Navigation Hub
 * Routes between different view components based on current level
 * Now includes Breadcrumbs and LayerNavigator for hierarchical navigation
 */
import React, { useEffect, useState, useMemo } from "react";
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
  const {
    currentLevel,
    currentUniversalCategory,
    currentSubcategory,
    activePath,
    currentBrand,
  } = useNavigationStore();
  const [universalProducts, setUniversalProducts] = useState<Product[]>([]);
  const [brandProducts, setBrandProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load ALL products if we are in Universal Mode
  useEffect(() => {
    let mounted = true;
    if (currentLevel === "universal") {
      setIsLoading(true);
      catalogLoader.loadAllProducts().then((products) => {
        if (mounted) {
          setUniversalProducts(products);
          setIsLoading(false);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [currentLevel]);

  // Load brand products when brand is selected
  useEffect(() => {
    let mounted = true;
    if (currentLevel === "brand" && activePath[0]) {
      setIsLoading(true);
      catalogLoader.loadBrand(activePath[0]).then((catalog) => {
        if (mounted) {
          setBrandProducts(catalog.products || []);
          setIsLoading(false);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [currentLevel, activePath]); // Removed activePath[0] to satisfy deps

  // Derived state for category products (Memoized instead of Effect)
  const categoryProducts = useMemo(() => {
    if (
      currentLevel === "family" &&
      brandProducts.length > 0 &&
      activePath[1]
    ) {
      return brandProducts.filter((p) => p.category === activePath[1]);
    }
    return [];
  }, [currentLevel, brandProducts, activePath]);

  // The "Router" logic - switch views based on state machine level
  const renderView = () => {
    // Priority 0: Universal Category View (New Architecture)
    if (currentLevel === "universal" && currentUniversalCategory) {
      let filtered = universalProducts.filter(
        (p) => mapProductToUniversal(p) === currentUniversalCategory,
      );
      const categoryDef = getCategoryById(currentUniversalCategory);
      let categoryLabel = categoryDef?.label || currentUniversalCategory;

      // Handle Subcategory "Drill Down" (Tierbar logic)
      if (currentSubcategory) {
        filtered = filtered.filter((p) => {
          // Simple fuzzy match for now to catch relevant items
          const blob = (
            p.category +
            " " +
            p.name +
            " " +
            (p.description || "")
          ).toLowerCase();
          return blob.includes(currentSubcategory.toLowerCase());
        });
        categoryLabel = `${categoryLabel} / ${currentSubcategory}`;
      }

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
