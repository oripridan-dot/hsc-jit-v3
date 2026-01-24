/**
 * Workbench - v3.8.0 Category Module Router
 *
 * THREE SCREENS ARCHITECTURE:
 * 1. Galaxy Dashboard - Bird's eye view of Halilit's reach
 * 2. Sub-Category Module (UniversalCategoryView) - Find products, navigate subcategories
 * 3. Product Pop Interface (ProductCockpit) - Official product knowledge
 * 4. Skeleton View - NEW Genesis protocol skeleton products
 *
 * Nothing more, nothing less.
 */
import React from "react";
import { useNavigationStore } from "../store/navigationStore";
import { GalaxyDashboard } from "./views/GalaxyDashboard";
import { ProductCockpit } from "./views/ProductCockpit";
import { SkeletonView } from "./views/SkeletonView";

export const Workbench: React.FC = () => {
  const { currentLevel, currentUniversalCategory, selectedProduct } =
    useNavigationStore();

  // The v3.8.0 Router - THREE SCREENS + SKELETON VIEW
  const renderView = () => {
    // SCREEN 3: Product Pop Interface (Deepest drill-down)
    if (currentLevel === "product" && selectedProduct) {
      return <ProductCockpit product={selectedProduct} />;
    }

    // SCREEN 2: Sub-Category Module (REPLACED BY SKELETON VIEW FOR GENESIS PHASE)
    if (currentLevel === "universal" && currentUniversalCategory) {
      return <SkeletonView />;
    }

    // SCREEN 1: Galaxy Dashboard (Default home view)
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
    </div>
  );
};
