/**
 * TierBarV2 - Enhanced Responsive Tier Display
 *
 * Features:
 * - Responsive grid layout for product display
 * - Smooth scrolling support
 * - Maintains minimum thumbnail sizes
 * - Better performance for large datasets
 * - Optional horizontal scroll mode for compact views
 */
import { motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import type { Product } from "../../types";
import { ProductGrid } from "../ui/ProductGrid";

interface TierBarV2Props {
  label: string;
  products: Product[];
  className?: string;
  displayMode?: "grid" | "horizontal";
  showPriceFilter?: boolean;
}

export const TierBarV2: React.FC<TierBarV2Props> = ({
  label,
  products,
  className,
  displayMode = "grid",
  showPriceFilter = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [minHandle, setMinHandle] = useState(0);
  const [maxHandle, setMaxHandle] = useState(100);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);

  // Calculate price range
  const { priceRange, filteredProducts } = useMemo(() => {
    const productsWithPrice = products
      .filter((p) => {
        const price =
          typeof p.halilit_price === "number"
            ? p.halilit_price
            : p.pricing?.regular_price || 0;
        return price > 0;
      })
      .sort((a, b) => {
        const priceA =
          typeof a.halilit_price === "number"
            ? a.halilit_price
            : a.pricing?.regular_price || 0;
        const priceB =
          typeof b.halilit_price === "number"
            ? b.halilit_price
            : b.pricing?.regular_price || 0;
        return priceA - priceB;
      });

    if (!productsWithPrice.length) {
      return {
        priceRange: { min: 0, max: 0 },
        filteredProducts: products,
      };
    }

    const firstPrice =
      typeof productsWithPrice[0].halilit_price === "number"
        ? productsWithPrice[0].halilit_price
        : productsWithPrice[0].pricing?.regular_price || 0;
    const lastPrice =
      typeof productsWithPrice[productsWithPrice.length - 1].halilit_price ===
      "number"
        ? productsWithPrice[productsWithPrice.length - 1].halilit_price
        : productsWithPrice[productsWithPrice.length - 1].pricing
            ?.regular_price || 0;

    const range = (lastPrice || 0) - (firstPrice || 0) || 1;
    const minPrice = (firstPrice || 0) + (range * minHandle) / 100;
    const maxPrice = (firstPrice || 0) + (range * maxHandle) / 100;

    const filtered = productsWithPrice.filter((p) => {
      const price =
        typeof p.halilit_price === "number"
          ? p.halilit_price
          : p.pricing?.regular_price || 0;
      return price >= minPrice && price <= maxPrice;
    });

    return {
      priceRange: { min: firstPrice, max: lastPrice },
      filteredProducts:
        minHandle === 0 && maxHandle === 100 ? products : filtered,
    };
  }, [products, minHandle, maxHandle]);

  // Handle price filter dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    if (isDragging === "min") {
      setMinHandle(Math.min(percentage, maxHandle - 5));
    } else if (isDragging === "max") {
      setMaxHandle(Math.max(percentage, minHandle + 5));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  if (products.length === 0) return null;

  const currentMinPrice =
    (priceRange.min || 0) +
    (((priceRange.max || 0) - (priceRange.min || 0)) * minHandle) / 100;
  const currentMaxPrice =
    (priceRange.min || 0) +
    (((priceRange.max || 0) - (priceRange.min || 0)) * maxHandle) / 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 group"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-zinc-500 group-hover:text-white"
          >
            ▶
          </motion.div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 transition-all">
              {label}
            </h2>
            <div className="text-xs text-zinc-600 font-mono">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "item" : "items"}
              {filteredProducts.length !== products.length &&
                ` (${products.length} total)`}
            </div>
          </div>
        </button>

        {showPriceFilter && (priceRange.max || 0) > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-500 font-mono">
              ₪{Math.round(currentMinPrice).toLocaleString()} - ₪
              {Math.round(currentMaxPrice).toLocaleString()}
            </div>
            {(minHandle > 0 || maxHandle < 100) && (
              <button
                onClick={() => {
                  setMinHandle(0);
                  setMaxHandle(100);
                }}
                className="text-xs font-mono px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Price Filter Slider */}
      {showPriceFilter && (priceRange.max || 0) > 0 && isExpanded && (
        <div
          className="relative h-12 mb-6 px-4"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="relative h-full">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-zinc-800 rounded-full">
              {/* Selected Range */}
              <div
                className="absolute top-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                style={{
                  left: `${minHandle}%`,
                  width: `${maxHandle - minHandle}%`,
                }}
              />
            </div>

            {/* Min Handle */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-500 rounded-full cursor-ew-resize shadow-lg hover:scale-125 transition-transform"
              style={{ left: `${minHandle}%`, x: "-50%" }}
              onMouseDown={() => setIsDragging("min")}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
            />

            {/* Max Handle */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full cursor-ew-resize shadow-lg hover:scale-125 transition-transform"
              style={{ left: `${maxHandle}%`, x: "-50%" }}
              onMouseDown={() => setIsDragging("max")}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
            />
          </div>
        </div>
      )}

      {/* Product Display */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        {displayMode === "grid" ? (
          <ProductGrid products={filteredProducts} minThumbnailSize={140} />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {filteredProducts.map((product, index) => (
              <div
                key={`${product.id}-${index}`}
                className="flex-shrink-0 w-48 bg-zinc-900 rounded-lg p-3 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <div className="aspect-square bg-zinc-800 rounded mb-2 flex items-center justify-center">
                  <img
                    src={product.image_url || product.image}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain p-2"
                  />
                </div>
                <div className="text-xs text-zinc-500 mb-1">
                  {product.brand}
                </div>
                <div className="text-sm text-white font-semibold line-clamp-2 mb-2">
                  {product.name}
                </div>
                <div className="text-sm text-cyan-400 font-mono font-bold">
                  ₪
                  {(typeof product.halilit_price === "number"
                    ? product.halilit_price
                    : product.pricing?.regular_price || 0
                  ).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Divider */}
      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  );
};
