import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product, ProductImagesObject } from "../../types";
import { BrandIcon } from "../BrandIcon";

interface TierBarProps {
  label: string;
  products: Product[];
  className?: string;
}

export const TierBar: React.FC<TierBarProps> = ({
  label,
  products,
  className,
}) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const { selectProduct } = useNavigationStore();

  // Price range filtering state - Start with full range
  const [minHandle, setMinHandle] = useState(0); // 0-100%
  const [maxHandle, setMaxHandle] = useState(100); // 0-100%
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1; // Larger steps with Shift key

      if (e.key === "Escape") {
        // Reset filters
        setMinHandle(0);
        setMaxHandle(100);
      } else if (e.key === "ArrowLeft" && e.ctrlKey) {
        // Move min handle left
        e.preventDefault();
        setMinHandle((prev) => Math.max(0, prev - step));
      } else if (e.key === "ArrowRight" && e.ctrlKey) {
        // Move min handle right
        e.preventDefault();
        setMinHandle((prev) => Math.min(maxHandle - 5, prev + step));
      } else if (e.key === "ArrowLeft" && e.altKey) {
        // Move max handle left
        e.preventDefault();
        setMaxHandle((prev) => Math.max(minHandle + 5, prev - step));
      } else if (e.key === "ArrowRight" && e.altKey) {
        // Move max handle right
        e.preventDefault();
        setMaxHandle((prev) => Math.min(100, prev + step));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [minHandle, maxHandle]);

  // Sort and Normalize
  const { allNodes, filteredNodes, priceRange } = useMemo(() => {
    // Filter products with valid price and sort
    const valid = products
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

    if (!valid.length)
      return {
        allNodes: [],
        filteredNodes: [],
        priceRange: { min: 0, max: 0 },
      };

    // Determine FULL range
    const first = valid[0];
    const last = valid[valid.length - 1];

    const min =
      typeof first.halilit_price === "number"
        ? first.halilit_price
        : first.pricing?.regular_price || 0;
    const max =
      typeof last.halilit_price === "number"
        ? last.halilit_price
        : last.pricing?.regular_price || 0;
    const range = max - min || 1;

    const allMapped = valid.map((p) => {
      const price =
        typeof p.halilit_price === "number"
          ? p.halilit_price
          : p.pricing?.regular_price || 0;

      // Resolve image
      let img = p.image_url || p.image;
      if (p.images) {
        if (Array.isArray(p.images)) {
          if (p.images.length > 0) img = p.images[0].url;
        } else {
          img =
            (p.images as ProductImagesObject).thumbnail ||
            (p.images as ProductImagesObject).main ||
            img;
        }
      }

      return {
        ...p,
        priceDisplay: price,
        displayImage: img,
        pos: 0,
      };
    });

    // Filter by handle positions
    const minPrice = min + (range * minHandle) / 100;
    const maxPrice = min + (range * maxHandle) / 100;
    const filtered = allMapped.filter(
      (node) => node.priceDisplay >= minPrice && node.priceDisplay <= maxPrice,
    );

    // RECALCULATE positions based on FILTERED range (zoom effect)
    if (filtered.length > 0) {
      const filteredMin = filtered[0].priceDisplay;
      const filteredMax = filtered[filtered.length - 1].priceDisplay;
      const filteredRange = filteredMax - filteredMin || 1;

      filtered.forEach((node) => {
        node.pos = ((node.priceDisplay - filteredMin) / filteredRange) * 100;
      });
    }

    return {
      allNodes: allMapped,
      filteredNodes: filtered,
      priceRange: { min, max },
    };
  }, [products, minHandle, maxHandle]);

  // Handle dragging for price range controls
  const rafRef = React.useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    // Cancel any pending animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

      if (isDragging === "min") {
        setMinHandle(Math.min(percentage, maxHandle - 5));
      } else if (isDragging === "max") {
        setMaxHandle(Math.max(percentage, minHandle + 5));
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (allNodes.length === 0) return null;

  // Calculate current filtered price range
  const currentMinPrice =
    priceRange.min + ((priceRange.max - priceRange.min) * minHandle) / 100;
  const currentMaxPrice =
    priceRange.min + ((priceRange.max - priceRange.min) * maxHandle) / 100;

  return (
    <div
      className={cn("w-full py-16 relative isolate select-none", className)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        WebkitUserSelect: "none",
        userSelect: "none",
        cursor: isDragging ? "ew-resize" : "default",
      }}
    >
      {/* Clean - No Background Clutter */}

      {/* Reset Button & Keyboard Hint */}
      {(minHandle > 0 || maxHandle < 100) && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
          <div className="text-[10px] text-zinc-500 font-mono hidden md:block">
            <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700">
              Esc
            </kbd>{" "}
            to reset
          </div>
          <button
            onClick={() => {
              setMinHandle(0);
              setMaxHandle(100);
            }}
            className="px-3 py-1.5 text-xs font-mono font-bold text-white/70 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded transition-all hover:text-white hover:border-zinc-600"
            aria-label="Reset price filters"
          >
            Reset
          </button>
        </div>
      )}

      {/* Track with Handles */}
      <div
        className="relative h-32 w-full px-12 pt-16"
        role="region"
        aria-label={`${label} price filter`}
        style={{ willChange: "contents" }}
      >
        {/* ARIA Live Region for Price Updates */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Filtering {filteredNodes.length} of {allNodes.length} products between
          ₪{Math.round(currentMinPrice).toLocaleString()} and ₪
          {Math.round(currentMaxPrice).toLocaleString()}
        </div>
        <div className="relative h-full" style={{ willChange: "transform" }}>
          {/* Main Track */}
          <div className="absolute left-0 right-0 top-16 h-1.5 bg-gradient-to-r from-zinc-800/50 via-zinc-700/80 to-zinc-800/50 rounded-full overflow-visible shadow-lg">
            {/* Selected Range Highlight */}
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-cyan-500/70 to-purple-500/70 transition-all duration-300 motion-reduce:transition-none"
              style={{
                left: `${minHandle}%`,
                width: `${maxHandle - minHandle}%`,
                willChange: "left, width",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 to-purple-400/40 blur-md" />
            </div>

            {/* Dimmed Areas */}
            <div
              className="absolute top-0 left-0 h-full bg-black/40 transition-all duration-300"
              style={{ width: `${minHandle}%`, willChange: "width" }}
            />
            <div
              className="absolute top-0 right-0 h-full bg-black/40 transition-all duration-300"
              style={{ width: `${100 - maxHandle}%`, willChange: "width" }}
            />
          </div>

          {/* Product Nodes - Elevated Above Track */}
          <div
            className="absolute left-0 right-0 -top-12 h-24"
            style={{ willChange: "contents" }}
          >
            {filteredNodes.map((product) => {
              const clampedPos = Math.max(3, Math.min(97, product.pos));
              return (
                <div
                  key={product.id}
                  className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-300"
                  style={{ left: `${clampedPos}%`, willChange: "left" }}
                  onMouseEnter={() => setActiveItem(product.id)}
                  onMouseLeave={() => setActiveItem(null)}
                  onClick={() => selectProduct(product)}
                >
                  <motion.div
                    className="relative cursor-pointer group"
                    style={{ x: "-50%" }}
                    whileHover={{ scale: 1.3, zIndex: 30 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Warm Spotlight on Track Below Logo */}
                    <div
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 transition-all duration-500",
                        "pointer-events-none",
                        activeItem === product.id
                          ? "bottom-0 w-20 h-32 opacity-100"
                          : "bottom-4 w-12 h-24 opacity-0 group-hover:opacity-60",
                      )}
                      style={{
                        background:
                          "radial-gradient(ellipse at center, rgba(255,200,100,0.4) 0%, rgba(255,160,60,0.2) 40%, transparent 70%)",
                        filter: "blur(12px)",
                      }}
                    />

                    {/* Elevated Logo - Larger & Prominent */}
                    <div className="relative">
                      <BrandIcon
                        brand={product.brand}
                        className={cn(
                          "w-12 h-12 transition-all duration-300",
                          activeItem === product.id
                            ? "drop-shadow-[0_0_16px_rgba(255,200,100,0.9)] brightness-110"
                            : "opacity-80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] group-hover:opacity-100 group-hover:drop-shadow-[0_0_12px_rgba(255,200,100,0.6)]",
                        )}
                      />

                      {/* Track Illumination Spot */}
                      <div
                        className={cn(
                          "absolute left-1/2 -translate-x-1/2 rounded-full transition-all duration-500",
                          activeItem === product.id
                            ? "bottom-[-40px] w-16 h-2 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent shadow-[0_0_20px_rgba(255,200,100,0.6)]"
                            : "bottom-[-40px] w-8 h-1 bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-400/40 group-hover:w-12 group-hover:shadow-[0_0_12px_rgba(255,200,100,0.4)]",
                        )}
                      />
                    </div>
                  </motion.div>

                  {/* Hover Info - Larger Thumbnail */}
                  <AnimatePresence>
                    {activeItem === product.id && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 20,
                          scale: 0.9,
                          x: "-50%",
                        }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                        exit={{ opacity: 0, scale: 0.9, x: "-50%" }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full mb-6 left-1/2 w-96 z-50 pointer-events-none"
                      >
                        <div className="bg-gradient-to-br from-zinc-900/98 to-black/98 backdrop-blur-xl border border-amber-500/30 rounded-xl shadow-2xl shadow-amber-500/20 overflow-hidden">
                          <div className="flex h-40">
                            <div className="w-40 bg-gradient-to-br from-zinc-800/50 to-zinc-900/80 p-4 flex items-center justify-center border-r border-amber-500/20">
                              <img
                                src={product.displayImage}
                                className="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(255,200,100,0.3)]"
                                alt={product.name}
                              />
                            </div>
                            <div className="flex-1 p-4 flex flex-col justify-center">
                              <div className="text-[11px] text-amber-400/80 uppercase tracking-widest font-mono mb-1">
                                {product.brand}
                              </div>
                              <div className="font-bold text-white text-lg leading-tight line-clamp-2 mb-2">
                                {product.name}
                              </div>
                              <div className="font-mono text-amber-400 font-black text-xl">
                                ₪{product.priceDisplay.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-px bg-amber-500/10 text-[11px] font-mono text-zinc-400">
                            <div className="bg-zinc-900/90 px-3 py-2 flex justify-between items-center">
                              <span className="text-zinc-500">SKU</span>
                              <span className="text-white font-bold">
                                {product.sku || "N/A"}
                              </span>
                            </div>
                            <div className="bg-zinc-900/90 px-3 py-2 flex justify-between items-center">
                              <span className="text-zinc-500">STOCK</span>
                              <span
                                className={cn(
                                  "font-bold",
                                  product.availability === "in-stock"
                                    ? "text-green-400"
                                    : "text-red-400",
                                )}
                              >
                                {product.availability === "in-stock"
                                  ? "IN STOCK"
                                  : "LOW"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-[2px] h-4 bg-gradient-to-b from-amber-500/60 to-transparent mx-auto" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Min Handle - Minimal */}
          <motion.div
            className="absolute bottom-0 cursor-ew-resize z-40 group"
            style={{ left: `${minHandle}%`, willChange: "left" }}
            onMouseDown={() => setIsDragging("min")}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            role="slider"
            aria-label="Minimum price filter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={minHandle}
            tabIndex={0}
          >
            <div
              className="relative flex items-end"
              style={{ transform: "translateX(-50%)" }}
            >
              {/* Connection Line */}
              <div
                className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-8 transition-all motion-reduce:transition-none",
                  isDragging === "min"
                    ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)]"
                    : "bg-cyan-500/70 group-hover:bg-cyan-400",
                )}
              />
              {/* Handle */}
              <div
                className={cn(
                  "relative mt-auto w-4 h-8 rounded-full transition-all motion-reduce:transition-none focus-within:ring-2 focus-within:ring-cyan-400 focus-within:ring-offset-2 focus-within:ring-offset-black",
                  isDragging === "min"
                    ? "bg-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.9)]"
                    : "bg-cyan-500/90 group-hover:bg-cyan-400 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.6)]",
                )}
              />
              {/* Price Label */}
              <div
                className={cn(
                  "absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-mono font-bold transition-all motion-reduce:transition-none",
                  isDragging === "min"
                    ? "text-cyan-200 scale-110"
                    : "text-cyan-400/80 group-hover:text-cyan-300 group-hover:scale-105",
                )}
              >
                ₪{Math.round(currentMinPrice).toLocaleString()}
              </div>
            </div>
          </motion.div>

          {/* Max Handle - Minimal */}
          <motion.div
            className="absolute bottom-0 cursor-ew-resize z-40 group"
            style={{ right: `${100 - maxHandle}%`, willChange: "right" }}
            onMouseDown={() => setIsDragging("max")}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            role="slider"
            aria-label="Maximum price filter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={maxHandle}
            tabIndex={0}
          >
            <div
              className="relative flex items-end"
              style={{ transform: "translateX(50%)" }}
            >
              {/* Connection Line */}
              <div
                className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-8 transition-all motion-reduce:transition-none",
                  isDragging === "max"
                    ? "bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.9)]"
                    : "bg-purple-500/70 group-hover:bg-purple-400",
                )}
              />
              {/* Handle */}
              <div
                className={cn(
                  "relative mt-auto w-4 h-8 rounded-full transition-all motion-reduce:transition-none focus-within:ring-2 focus-within:ring-purple-400 focus-within:ring-offset-2 focus-within:ring-offset-black",
                  isDragging === "max"
                    ? "bg-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.9)]"
                    : "bg-purple-500/90 group-hover:bg-purple-400 group-hover:shadow-[0_0_12px_rgba(168,85,247,0.6)]",
                )}
              />
              {/* Price Label */}
              <div
                className={cn(
                  "absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-mono font-bold transition-all motion-reduce:transition-none",
                  isDragging === "max"
                    ? "text-purple-200 scale-110"
                    : "text-purple-400/80 group-hover:text-purple-300 group-hover:scale-105",
                )}
              >
                ₪{Math.round(currentMaxPrice).toLocaleString()}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
