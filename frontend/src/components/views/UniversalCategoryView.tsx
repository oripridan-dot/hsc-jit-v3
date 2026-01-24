/**
 * UniversalCategoryView - v3.8.0 SCREEN 2
 * "Sub-Category Module - Product Exploration"
 *
 * STANDARD TEMPLATE - The ONLY and SINGLE template for subcategory browsing.
 *
 * All data must comply to this structure:
 * - Spectrum Analyzer View: Price vs. Popularity visualization
 * - Three-panel information display (Visual, Specs, Price History)
 * - Brand-filtered product display
 *
 * No other variations or alternate views.
 */
import React, { useMemo } from "react";
import { useCategoryCatalog } from "../../hooks/useCategoryCatalog";
import { useNavigationStore } from "../../store/navigationStore";
import { SpectrumMiddleLayer } from "../smart-views/SpectrumLayer";

export const UniversalCategoryView: React.FC = () => {
  const { currentUniversalCategory } = useNavigationStore();
  const { products: allProducts } = useCategoryCatalog(
    currentUniversalCategory,
  );

  // Filter and prepare products
  const sortedProducts = useMemo(() => {
    return allProducts
      .filter((p) => p && p.id)
      .sort((a, b) => {
        const priceA = (a.halilit_price ||
          a.pricing?.regular_price ||
          0) as number;
        const priceB = (b.halilit_price ||
          b.pricing?.regular_price ||
          0) as number;
        return priceA - priceB;
      });
  }, [allProducts]);

  const categoryName = currentUniversalCategory || "Products";

  return (
    <div className="flex-1 h-full bg-[var(--bg-app)] transition-colors duration-500 overflow-y-auto relative flex flex-col">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-transparent to-[var(--bg-app)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full flex-1 flex flex-col p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 uppercase tracking-tight">
            {categoryName}
          </h1>
          <p className="text-sm text-zinc-400">
            {sortedProducts.length} products • Spectrum View
          </p>
        </div>

        {/* Spectrum View - THE STANDARD TEMPLATE */}
        <div className="flex-1 overflow-y-auto scrollbar-custom">
          {sortedProducts.length > 0 ? (
            <SpectrumMiddleLayer products={sortedProducts} />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📂</div>
                <div className="font-mono text-lg">NO PRODUCTS AVAILABLE</div>
                <div className="text-sm mt-2">Select a different category</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
