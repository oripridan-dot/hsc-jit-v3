import { AnimatePresence, motion } from "framer-motion";
import React, { useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product } from "../../types";

/**
 * RackModule - A single modular unit in the rack system
 * Each subcategory gets its own module with hotspots for data display
 * Features:
 * - Wide hover screen above the module
 * - Product slots as "hotspots"
 * - Familiar rack/modular synth aesthetic for musicians
 * - Data-rich hover interactions
 */

interface RackModuleProps {
  subcategoryName: string;
  products: Product[];
  icon?: React.ReactNode;
  color?: string; // Brand or category color
  className?: string;
}

interface HotspotData {
  productId: string;
  position: number; // 0-100 percentage across module width
  product: Product;
}

export const RackModule: React.FC<RackModuleProps> = ({
  subcategoryName,
  products,
  icon,
  color = "from-zinc-600 to-zinc-700",
  className,
}) => {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [hoverScreenData, setHoverScreenData] = useState<Product | null>(null);
  const { selectProduct } = useNavigationStore();
  const moduleRef = useRef<HTMLDivElement>(null);

  // Generate hotspots from products
  const hotspots: HotspotData[] = products.map((product, index) => ({
    productId: product.id,
    position: (index / Math.max(products.length - 1, 1)) * 100,
    product,
  }));

  const handleHotspotHover = (hotspot: HotspotData) => {
    setActiveHotspot(hotspot.productId);
    setHoverScreenData(hotspot.product);
  };

  const handleHotspotClick = (product: Product) => {
    selectProduct(product);
  };

  return (
    <div ref={moduleRef} className={cn("relative", className)}>
      {/* WIDE HOVER SCREEN - Displays above module */}
      <AnimatePresence>
        {hoverScreenData && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-full left-0 right-0 mb-4 z-50 px-2"
          >
            <HoverScreen product={hoverScreenData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RACK MODULE CONTAINER */}
      <div
        className={cn(
          "relative w-full rounded-lg border overflow-hidden",
          `bg-gradient-to-br ${color}`,
          "shadow-2xl shadow-black/60",
          "p-6 transition-all duration-300",
          "hover:shadow-2xl hover:shadow-cyan-500/20",
          "group",
        )}
        onMouseLeave={() => {
          setActiveHotspot(null);
          setHoverScreenData(null);
        }}
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Module Header - Brand/Category Name */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10 relative z-10">
          {icon && <div className="text-2xl filter drop-shadow-lg">{icon}</div>}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              {subcategoryName}
            </h3>
            <p className="text-xs text-zinc-300 font-mono">
              {products.length} unit{products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* HOTSPOT ROW - Product slots */}
        {products.length > 0 ? (
          <div className="relative h-16 bg-gradient-to-b from-black/50 to-black/30 rounded border border-white/10 overflow-hidden shadow-inner">
            {/* Hotspot Track Background - Animated gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:via-white/10 transition-all duration-300" />

            {/* Frequency visualization lines */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 px-2 opacity-20">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-gradient-to-t from-cyan-500/50 to-purple-500/50 rounded-full"
                  style={{ height: `${40 + Math.sin(i * 0.5) * 20}%` }}
                  animate={{
                    height: [
                      `${40 + Math.sin(i * 0.5 + 0) * 20}%`,
                      `${60 + Math.sin(i * 0.5) * 20}%`,
                      `${40 + Math.sin(i * 0.5) * 20}%`,
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Hotspots */}
            <div className="relative w-full h-full flex items-center justify-between px-2 z-10">
              {hotspots.map((hotspot) => (
                <motion.div
                  key={hotspot.productId}
                  className="relative flex-1 h-full flex items-center justify-center group/hotspot"
                  style={{
                    minWidth: "40px",
                  }}
                  onMouseEnter={() => handleHotspotHover(hotspot)}
                >
                  {/* Hotspot Indicator */}
                  <motion.button
                    className={cn(
                      "relative w-8 h-8 rounded-full border-2 transition-all duration-200",
                      "flex items-center justify-center text-xs font-mono font-bold",
                      "cursor-pointer",
                      activeHotspot === hotspot.productId
                        ? "bg-cyan-500 border-cyan-300 shadow-xl shadow-cyan-500/60 scale-110"
                        : "bg-gradient-to-br from-zinc-600/80 to-zinc-700/60 border-zinc-500/80 hover:from-zinc-500/90 hover:to-zinc-600/80 hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-500/30",
                    )}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleHotspotClick(hotspot.product)}
                    aria-label={`Select ${hotspot.product.name}`}
                    title={hotspot.product.name}
                  >
                    {/* Glow effect */}
                    {activeHotspot === hotspot.productId && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-cyan-400/40 blur-md"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0.2, 0.5],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Ring effect on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-full border border-white/20"
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />

                    <span className="relative z-10 drop-shadow-lg">●</span>
                  </motion.button>

                  {/* Tooltip on hover */}
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    whileHover={{ opacity: 1, y: -12 }}
                    className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black/95 border border-cyan-500/50 px-2 py-1 rounded text-xs text-white whitespace-nowrap pointer-events-none z-40 backdrop-blur-sm"
                  >
                    {hotspot.product.name}
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Meter indicator line */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        ) : (
          <div className="h-16 flex items-center justify-center text-xs text-zinc-500 relative z-10">
            No products
          </div>
        )}

        {/* Module Footer - Status/Info */}
        <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
          <div className="text-[10px] text-zinc-300 font-mono tracking-wider uppercase">
            <span className="inline-block text-cyan-400">◆</span>
            <span className="mx-2">
              RK-MOD-{subcategoryName.substring(0, 3).toUpperCase()}
            </span>
            <span className="mx-2">•</span>
            <span className="inline-block">SLOTS: {hotspots.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * HoverScreen - Wide display showing rich product data
 * Appears above hotspots when hovered
 */
interface HoverScreenProps {
  product: Product;
}

const HoverScreen: React.FC<HoverScreenProps> = ({ product }) => {
  // Get best available image
  let imageSrc = product.image_url || product.image;
  if (product.images) {
    if (Array.isArray(product.images) && product.images.length > 0) {
      imageSrc = product.images[0].url;
    } else if (typeof product.images === "object" && "main" in product.images) {
      imageSrc = product.images.main || imageSrc;
    }
  }

  return (
    <motion.div
      className="w-full bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 rounded-lg border border-cyan-500/40 overflow-hidden shadow-2xl shadow-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Glow backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="flex gap-4 p-5 relative z-10">
        {/* Product Image */}
        {imageSrc && (
          <motion.div
            className="flex-shrink-0 w-36 h-36 rounded-lg border border-cyan-500/30 bg-black/60 overflow-hidden shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-contain p-3"
            />
          </motion.div>
        )}

        {/* Product Info Grid */}
        <div className="flex-1 min-w-0">
          <motion.h4
            className="text-xl font-bold text-white mb-3 truncate drop-shadow-lg"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {product.name}
          </motion.h4>

          {/* Key specs grid - 2x2 layout */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Price */}
            {(product.halilit_price || product.pricing?.regular_price) && (
              <motion.div
                className="bg-black/40 rounded-lg px-3 py-2 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
                  Price
                </div>
                <div className="text-base font-bold text-cyan-400 mt-1">
                  ₪
                  {Math.round(
                    typeof product.halilit_price === "number"
                      ? product.halilit_price
                      : product.pricing?.regular_price || 0,
                  ).toLocaleString()}
                </div>
              </motion.div>
            )}

            {/* Category */}
            {product.category && (
              <motion.div
                className="bg-black/40 rounded-lg px-3 py-2 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
                  Category
                </div>
                <div className="text-sm font-semibold text-purple-400 truncate mt-1">
                  {product.category}
                </div>
              </motion.div>
            )}

            {/* Brand */}
            {product.brand && (
              <motion.div
                className="bg-black/40 rounded-lg px-3 py-2 border border-white/20 hover:border-white/40 transition-all"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
                  Brand
                </div>
                <div className="text-sm font-semibold text-white truncate mt-1">
                  {product.brand}
                </div>
              </motion.div>
            )}

            {/* SKU/Model */}
            {product.model_number && (
              <motion.div
                className="bg-black/40 rounded-lg px-3 py-2 border border-green-500/20 hover:border-green-500/40 transition-all"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider">
                  Model
                </div>
                <div className="text-sm font-mono text-green-400 mt-1">
                  {product.model_number}
                </div>
              </motion.div>
            )}
          </div>

          {/* Description snippet */}
          {product.description && (
            <motion.p
              className="text-xs text-zinc-300 line-clamp-2 leading-relaxed"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {product.description}
            </motion.p>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-black/60 border-t border-cyan-500/20 px-5 py-3 flex items-center justify-between">
        <div className="text-[11px] text-zinc-400 font-mono tracking-wider">
          ▶ HOVER TO INSPECT • CLICK TO SELECT ◀
        </div>
        <motion.div
          className="w-2 h-2 rounded-full bg-cyan-500"
          animate={{
            opacity: [0.5, 1, 0.5],
            boxShadow: [
              "0 0 8px rgba(0, 240, 255, 0.3)",
              "0 0 16px rgba(0, 240, 255, 0.6)",
              "0 0 8px rgba(0, 240, 255, 0.3)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.div>
  );
};
