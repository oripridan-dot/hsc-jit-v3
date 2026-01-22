/**
 * UniversalCategoryView / The "Shelf"
 *
 * Grid-based product display (non-scrolling) that fills the viewport
 * Features:
 * - Compact header bar with back button
 * - Dense product grid with CandyCard components
 * - "View More" card for pagination (if needed)
 * - No scrolling - viewport-locked display
 */
import React, { useMemo } from "react";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product } from "../../types";
import { BrandIcon } from "../BrandIcon";
import { CandyCard } from "../ui/CandyCard";

export const UniversalCategoryView: React.FC<{
  categoryTitle: string;
  products: Product[];
}> = ({ categoryTitle, products }) => {
  const { selectUniversalCategory } = useNavigationStore();

  // Flatten products for the grid (limit to ~15 items for viewport fit)
  const allProducts = useMemo(() => {
    return products.slice(0, 15);
  }, [products]);

  const overflowCount = Math.max(0, products.length - 15);

  return (
    <div className="h-full w-full flex flex-col bg-[#0e0e10] overflow-hidden no-scrollbar">
      {/* Header - Compact, spacious */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => selectUniversalCategory("")}
            className="p-2 rounded-full hover:bg-white/10 transition-colors font-mono text-sm uppercase tracking-widest text-zinc-400 hover:text-white"
          >
            ← BACK
          </button>
          <h2 className="text-3xl font-bold uppercase tracking-wider text-white">
            {categoryTitle}
          </h2>
        </div>
        <div className="text-sm text-zinc-500 uppercase font-mono flex gap-4">
          <span>● {allProducts.length} LOADED</span>
          {overflowCount > 0 && <span>+{overflowCount} MORE</span>}
        </div>
      </div>

      {/* The Product Grid - Fills remaining space, prevents scrolling */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {allProducts.map((product) => (
            <CandyCard
              key={product.id}
              title={product.name}
              subtitle={product.brand}
              image={product.image_url}
              logo={
                <BrandIcon
                  brand={product.brand}
                  className="w-full h-full text-white"
                />
              }
              onClick={() =>
                console.log("Open Inspection Lens for", product.id)
              }
            />
          ))}

          {/* If there are more products than fit, show a 'View More' card */}
          {overflowCount > 0 && (
            <div className="flex items-center justify-center h-full w-full rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 cursor-pointer transition-colors hover:bg-zinc-800/30">
              <span className="text-zinc-400 font-mono text-sm text-center">
                +{overflowCount}
                <br />
                <span className="text-xs text-zinc-600">more</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
