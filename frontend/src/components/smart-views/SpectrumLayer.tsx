import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, ThumbsUp, X, Zap } from "lucide-react";
import React, { useMemo, useState } from "react";
import type { Product } from "../../types";

/**
 * SpectrumMiddleLayer - Audio Hardware Inspired Product Visualization
 *
 * Displays products on a 2D spectrum grid (Price vs. Popularity) with:
 * 1. Top Section: Three "LCD screens" showing hovered product details
 * 2. Middle Section: Interactive spectrum analyzer grid with brand-colored dots
 * 3. Bottom Section: Sub-category filter buttons
 * 4. Overlay: Glassmorphism product detail popup
 *
 * Design Language: Inspired by synthesizers, audio analyzers, and studio gear
 */

// --- Sub-category definitions (can be customized per category) ---
interface SubCategory {
  id: string;
  label: string;
}

const DEFAULT_SUBCATEGORIES: SubCategory[] = [
  { id: "all", label: "All Products" },
  { id: "flagship", label: "Flagship" },
  { id: "professional", label: "Professional" },
  { id: "enthusiast", label: "Enthusiast" },
  { id: "entry", label: "Entry Level" },
];

// --- Brand color mapping for dot visualization ---
const BRAND_COLORS: Record<string, string> = {
  roland: "#ff6b00",
  boss: "#ff6b00",
  nord: "#e31e24",
  yamaha: "#4f46e5",
  korg: "#2563eb",
  moog: "#10b981",
  arturia: "#10b981",
  default: "#64748b", // slate-500 fallback
};

// --- Brand headquarters and production locations ---
const BRAND_LOCATIONS: Record<string, { hq: string; production: string[] }> = {
  roland: { hq: "JP", production: ["JP", "MY", "IT"] },
  boss: { hq: "JP", production: ["JP", "MY"] },
  nord: { hq: "SE", production: ["SE"] },
  yamaha: { hq: "JP", production: ["JP", "CN", "ID", "MY"] },
  korg: { hq: "JP", production: ["JP", "CN"] },
  moog: { hq: "US", production: ["US"] },
  arturia: { hq: "FR", production: ["FR", "CN"] },
};

// --- Country code to flag emoji ---
const FLAG_EMOJI: Record<string, string> = {
  JP: "🇯🇵",
  US: "🇺🇸",
  SE: "🇸🇪",
  FR: "🇫🇷",
  CN: "🇨🇳",
  MY: "🇲🇾",
  IT: "🇮🇹",
  ID: "🇮🇩",
};

// --- Helper: Get brand color ---
const getBrandColor = (brand: string): string => {
  return BRAND_COLORS[brand.toLowerCase()] || BRAND_COLORS.default;
};

// --- Helper: Get brand logo path ---
const getBrandLogo = (brand: string): string => {
  // Map brand names to logo filenames (handles hyphens and capitalization)
  const logoMap: Record<string, string> = {
    roland: "roland_logo.jpg",
    boss: "boss_logo.jpg",
    nord: "nord_logo.jpg",
    moog: "moog_logo.jpg",
    korg: "korg_logo.jpg",
    yamaha: "yamaha_logo.jpg",
    arturia: "arturia_logo.jpg",
    mackie: "mackie_logo.jpg",
    "akai-professional": "akai-professional_logo.jpg",
    "adam-audio": "adam-audio_logo.jpg",
    "teenage-engineering": "teenage-engineering_logo.jpg",
    "universal-audio": "universal-audio_logo.jpg",
    "warm-audio": "warm-audio_logo.jpg",
  };

  const normalizedBrand = brand.toLowerCase().trim();
  const logoFile = logoMap[normalizedBrand] || `${normalizedBrand}_logo.jpg`;
  return `/data/logos/${logoFile}`;
};

// --- Helper: Get first product image ---
const getFirstProductImage = (product: Product): string | undefined => {
  if (!product.images) return undefined;

  // Handle array of ProductImage objects
  if (Array.isArray(product.images)) {
    return product.images[0]?.url;
  }

  // Handle ProductImagesObject
  return (
    product.images.main ||
    product.images.thumbnail ||
    (product.images.gallery && product.images.gallery[0])
  );
};

// --- Helper: Calculate popularity score from product data ---
const getPopularityScore = (product: Product): number => {
  // Use various signals to calculate a popularity score (0-100)
  let score = 50; // baseline

  if (product.verification_confidence) {
    score += product.verification_confidence * 0.2;
  }

  if (product.features && product.features.length > 0) {
    score += Math.min(product.features.length * 2, 20);
  }

  if (product.videos && product.videos.length > 0) {
    score += 10;
  }

  if (product.manuals && product.manuals.length > 0) {
    score += 5;
  }

  return Math.min(Math.max(score, 0), 100);
};

// --- Helper: Get price from product ---
const getProductPrice = (product: Product): number => {
  // Try explicit pricing fields first
  const explicitPrice =
    product.pricing?.regular_price ||
    product.pricing?.eilat_price ||
    product.halilit_price;

  if (explicitPrice) return explicitPrice;

  // Fallback: Estimate based on product characteristics
  // This ensures products show up even without pricing data
  let estimatedPrice = 1000; // Default baseline

  // Adjust by category (synthesizers tend to be more expensive)
  if (product.category?.toLowerCase().includes("synth")) {
    estimatedPrice = 2000;
  } else if (product.category?.toLowerCase().includes("piano")) {
    estimatedPrice = 1500;
  }

  // Adjust by features (more features = typically higher price)
  if (product.features && product.features.length > 10) {
    estimatedPrice *= 1.5;
  }

  return estimatedPrice;
};

// --- Sub-Components ---

/**
 * InfoScreen - Individual LCD/LED display panel
 */
interface InfoScreenProps {
  title: string;
  children: React.ReactNode;
  active: boolean;
  brandColor?: string;
}

const InfoScreen: React.FC<InfoScreenProps> = React.memo(
  ({ title, children, active, brandColor }) => {
    const containerStyle = useMemo(
      () => ({
        borderColor: active && brandColor ? brandColor : "#1e293b",
        boxShadow:
          active && brandColor
            ? `inset 0 6px 12px rgba(0,0,0,0.95), 0 0 25px ${brandColor}50, inset 0 0 40px ${brandColor}08, 0 0 60px ${brandColor}20`
            : "inset 0 6px 12px rgba(0,0,0,0.95)",
        backgroundColor: "#0a0e14",
      }),
      [active, brandColor],
    );

    return (
      <div
        className="flex flex-col h-full bg-black rounded-md border-2 overflow-hidden relative group"
        style={containerStyle}
      >
        {/* Screen Glare/Reflection Effect */}
        <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-white/3 to-transparent pointer-events-none" />

        {/* Screen Label */}
        <div className="bg-slate-950 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-900 flex justify-between items-center">
          <span>{title}</span>
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${active ? "shadow-[0_0_8px_currentColor]" : "bg-slate-800"}`}
            style={{
              backgroundColor: active ? brandColor : undefined,
              boxShadow:
                active && brandColor
                  ? `0 0 12px ${brandColor}, 0 0 20px ${brandColor}60`
                  : undefined,
            }}
          />
        </div>

        {/* Screen Content */}
        <div className="p-3 flex-1 flex items-start justify-start relative z-10">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                {children}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-600 font-mono text-xs uppercase w-full text-center"
              >
                Awaiting Signal...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scanline Effect */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent opacity-50 pointer-events-none mix-blend-overlay"
          style={{ backgroundSize: "100% 4px" }}
        />
      </div>
    );
  },
);

/**
 * SpectrumGrid - The main 2D visualization grid
 */
interface SpectrumGridProps {
  products: Product[];
  onHover: (product: Product | null) => void;
  onSelect: (product: Product) => void;
}

const SpectrumGrid: React.FC<SpectrumGridProps> = React.memo(
  ({ products, onHover, onSelect }) => {
    // Calculate scales based on actual product data
    const { maxPrice, maxPopularity } = useMemo(() => {
      const prices = products.map(getProductPrice).filter((p) => p > 0);
      const popularities = products.map(getPopularityScore);

      return {
        maxPrice: Math.max(...prices, 1000) * 1.1,
        maxPopularity: Math.max(...popularities, 100) * 1.1,
      };
    }, [products]);

    // Filter out products without price data
    const visibleProducts = useMemo(
      () => products, // Show ALL products now (with estimated prices)
      [products],
    );

    return (
      <div className="relative w-full h-40 bg-black rounded-lg border-4 border-slate-700 overflow-hidden shadow-xl cursor-crosshair">
        {/* Textured Background Layer */}
        <div
          className="absolute inset-0 bg-slate-900/50"
          style={{
            backgroundImage: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Cpath d='M0 0h1v1H0zm2 2h1v1H2z' fill='%23334155' fill-opacity='0.4'/%3E%3C/svg%3E")
        `,
          }}
        />
        {/* The Yellowish EQ Grid Background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
            linear-gradient(to right, #fbbf24 1px, transparent 1px),
            linear-gradient(to bottom, #fbbf24 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
        {/* Horizontal Scanlines for Texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 50%, rgba(251, 191, 36, 0.03) 50%)",
            backgroundSize: "100% 4px",
          }}
        />

        {/* Axis Labels with Values */}
        <div className="absolute bottom-2 right-3 text-xs text-amber-500/70 font-mono uppercase font-bold">
          Price →
        </div>
        <div className="absolute top-2 left-2 text-xs text-amber-500/70 font-mono writing-mode-vertical-rl uppercase font-bold">
          Popularity →
        </div>

        {/* Y-axis (Popularity) values */}
        <div className="absolute left-1 top-2 text-[9px] text-amber-500/50 font-mono">
          100
        </div>
        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-amber-500/50 font-mono">
          50
        </div>
        <div className="absolute left-1 bottom-2 text-[9px] text-amber-500/50 font-mono">
          0
        </div>

        {/* X-axis (Price) values */}
        <div className="absolute bottom-0.5 left-8 text-[9px] text-amber-500/50 font-mono">
          ₪0
        </div>
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] text-amber-500/50 font-mono">
          ₪5k
        </div>
        <div className="absolute bottom-0.5 right-8 text-[9px] text-amber-500/50 font-mono">
          ₪10k+
        </div>

        {/* Product Dots - Show Brand Logos */}
        {visibleProducts.map((product) => {
          const price = getProductPrice(product);
          const popularity = getPopularityScore(product);
          const xPos = (price / maxPrice) * 100;
          const yPos = 100 - (popularity / maxPopularity) * 100;
          const brandColor = getBrandColor(product.brand);
          const logoUrl = getBrandLogo(product.brand);

          return (
            <button
              key={product.id}
              className="absolute w-16 h-16 -ml-8 -mt-8 rounded-lg border-2 border-white/40 shadow-xl focus:outline-none focus:ring-4 focus:ring-white/50 bg-gradient-to-br from-white/5 to-black/40 p-2 overflow-hidden hover:scale-150 transition-all duration-200 group"
              style={{
                left: `${Math.max(2, Math.min(98, xPos))}%`,
                top: `${Math.max(2, Math.min(98, yPos))}%`,
                boxShadow: `0 0 25px ${brandColor}80, 0 0 50px ${brandColor}40, inset 0 0 15px rgba(255,255,255,0.15)`,
              }}
              onMouseEnter={() => onHover(product)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(product)}
              aria-label={`View ${product.name}`}
              title={product.name}
            >
              <img
                src={logoUrl}
                alt={product.brand}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-lg"
              />
              {/* Glow overlay on hover */}
              <div
                className="absolute inset-0 group-hover:opacity-100 opacity-0 transition-opacity duration-200 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${brandColor}50 0%, transparent 70%)`,
                }}
              />
            </button>
          );
        })}

        {/* Dynamic Overlay Line (Decoration) - Thicker */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-40 blur-sm" />

        {/* Empty state */}
        {visibleProducts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-base">
            <Info className="w-5 h-5 mr-2" />
            No products available for visualization
          </div>
        )}
      </div>
    );
  },
);

/**
 * SubCategoryNav - Bottom filter buttons
 */
interface SubCategoryNavProps {
  activeId: string;
  onSelect: (id: string) => void;
  categories?: SubCategory[];
}

const SubCategoryNav: React.FC<SubCategoryNavProps> = ({
  activeId,
  onSelect,
  categories = DEFAULT_SUBCATEGORIES,
}) => (
  <div className="flex gap-2 justify-center py-4 px-2 bg-slate-950/50 rounded-b-xl border-t border-slate-800 flex-wrap">
    {categories.map((cat) => (
      <button
        key={cat.id}
        onClick={() => onSelect(cat.id)}
        className={`
          px-4 py-2 rounded text-sm font-medium transition-all duration-200 uppercase tracking-wide
          ${
            activeId === cat.id
              ? "bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.4)] translate-y-[1px]"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white shadow-md"
          }
        `}
      >
        {cat.label}
      </button>
    ))}
  </div>
);

/**
 * ProductPopup - Glassmorphism product detail overlay
 */
interface ProductPopupProps {
  product: Product;
  onClose: () => void;
}

const ProductPopup: React.FC<ProductPopupProps> = ({ product, onClose }) => {
  const price = getProductPrice(product);
  const popularity = getPopularityScore(product);
  const brandColor = getBrandColor(product.brand);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl"
      >
        {/* Glass Header */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

        <div className="relative p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Col: Image & Brand */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-black text-white/90 uppercase tracking-widest shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              {product.brand[0]}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight text-center">
              {product.name}
            </h2>
            {price > 0 && (
              <div className="text-amber-400 text-xl font-mono">
                ₪{price.toLocaleString()}
              </div>
            )}
            {product.model_number && (
              <div className="text-slate-400 text-sm font-mono">
                Model: {product.model_number}
              </div>
            )}
          </div>

          {/* Right Col: Details */}
          <div className="space-y-6">
            {/* Popularity Score */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Popularity
                </span>
                <span className="text-sm font-mono text-amber-400">
                  {Math.round(popularity)}/100
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${popularity}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                />
              </div>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/5 max-h-40 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">
                  Key Features
                </h3>
                <ul className="space-y-2">
                  {product.features.slice(0, 5).map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {product.features.length > 5 && (
                    <li className="text-xs text-slate-500 italic">
                      +{product.features.length - 5} more features
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="text-sm text-slate-300 line-clamp-3">
                {product.description}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded shadow-lg flex items-center justify-center gap-2 transition-colors"
                onClick={() => {
                  // TODO: Implement recommendation logic
                  console.log("Recommend:", product.id);
                }}
              >
                <ThumbsUp className="w-4 h-4" />
                Recommend
              </button>
              {product.brand_product_url && (
                <a
                  href={product.brand_product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded shadow-lg transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Details
                </a>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

export interface SpectrumMiddleLayerProps {
  products: Product[];
  subcategories?: SubCategory[];
  className?: string;
}

export const SpectrumMiddleLayer: React.FC<SpectrumMiddleLayerProps> = ({
  products,
  subcategories = DEFAULT_SUBCATEGORIES,
  className = "",
}) => {
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  // Stable callbacks
  const handleHover = React.useCallback((product: Product | null) => {
    setHoveredProduct(product);
  }, []);

  const handleSelect = React.useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  // Memoize expensive calculations
  const hoveredBrandColor = useMemo(
    () => (hoveredProduct ? getBrandColor(hoveredProduct.brand) : undefined),
    [hoveredProduct],
  );

  const topBarStyle = useMemo(
    () =>
      hoveredBrandColor
        ? {
            borderColor: hoveredBrandColor,
            boxShadow: `0 0 20px ${hoveredBrandColor}40, inset 0 0 30px ${hoveredBrandColor}10`,
          }
        : {},
    [hoveredBrandColor],
  );

  // Filter products based on active subcategory
  const filteredProducts = useMemo(() => {
    if (activeCategory === "all") return products;

    // TODO: Implement actual filtering logic based on your subcategory system
    // For now, return all products
    return products;
  }, [products, activeCategory]);

  return (
    <div
      className={`w-full max-w-[1820px] mx-auto bg-slate-950 p-2 rounded-xl shadow-2xl relative overflow-hidden border-4 border-slate-800 ${className}`}
    >
      {/* Decorative Bezel Screws */}
      <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
      <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />
      <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" />

      {/* 1. TOP BAR: Horizontal Product Info */}
      <div className="bg-slate-950/70 p-4 rounded-t-lg mb-3 border-b-4 border-slate-900 min-h-[88px] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
        <div
          className="flex items-center justify-between px-6 py-3 rounded border-2 bg-black transition-opacity duration-200"
          style={{
            ...topBarStyle,
            opacity: hoveredProduct ? 1 : 0,
            pointerEvents: hoveredProduct ? "auto" : "none",
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <div className="bg-white p-3 rounded flex items-center h-16">
                <img
                  src={hoveredProduct ? getBrandLogo(hoveredProduct.brand) : ""}
                  alt={hoveredProduct?.brand || ""}
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="text-4xl font-bold text-white">
                {hoveredProduct?.name || ""}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 uppercase font-semibold">
                HQ:
              </span>
              <span className="text-4xl">
                {hoveredProduct
                  ? FLAG_EMOJI[
                      BRAND_LOCATIONS[hoveredProduct.brand.toLowerCase()]?.hq ||
                        "US"
                    ] || ""
                  : ""}
              </span>
              <span className="text-sm text-slate-400 uppercase ml-4 font-semibold">
                Production:
              </span>
              {hoveredProduct &&
                BRAND_LOCATIONS[
                  hoveredProduct.brand.toLowerCase()
                ]?.production.map((country, i) => (
                  <span key={i} className="text-4xl">
                    {FLAG_EMOJI[country]}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT: 3-Column Layout */}
      <div className="bg-slate-950/80 p-6 rounded-lg mb-3 border-b-4 border-slate-900 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr] gap-6 h-72 min-h-[288px]">
          {/* Column 1: Product Image */}
          <InfoScreen
            title="Product Visual"
            active={!!hoveredProduct}
            brandColor={hoveredBrandColor}
          >
            {hoveredProduct && (
              <div className="flex items-center justify-center w-full h-full absolute inset-0 p-4">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={hoveredProduct.id}
                    src={
                      getFirstProductImage(hoveredProduct) ||
                      getBrandLogo(hoveredProduct.brand)
                    }
                    alt={hoveredProduct.name}
                    className="w-full h-full object-contain"
                    initial={{
                      opacity: 0,
                      scale: 0.7,
                      rotateY: -25,
                      filter: "blur(8px) brightness(0.5)",
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotateY: 0,
                      filter: "blur(0px) brightness(1)",
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      rotateY: 25,
                      filter: "blur(6px) brightness(0.7)",
                    }}
                    transition={{
                      duration: 0.8,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      scale: {
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      },
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getBrandLogo(
                        hoveredProduct.brand,
                      );
                    }}
                  />
                </AnimatePresence>
              </div>
            )}
          </InfoScreen>

          {/* Column 2: Technical Specifications */}
          <InfoScreen
            title="Technical Specifications"
            active={!!hoveredProduct}
            brandColor={hoveredBrandColor}
          >
            {hoveredProduct &&
              (() => {
                // Detect if product is strictly a musical instrument (Keys/Synth/Piano)
                // If not (e.g. Cable, Case, Accessory), we show generic info instead of Fake Specs.
                const isInstrument =
                  ["Keyboards", "Pianos", "Synthesizers"].includes(
                    hoveredProduct.category || "",
                  ) ||
                  hoveredProduct.name.toLowerCase().includes("keyboard") ||
                  hoveredProduct.name.toLowerCase().includes("piano") ||
                  hoveredProduct.name.toLowerCase().includes("synth");

                // Helper component for uniform rows
                const SpecRow = ({
                  label,
                  value,
                }: {
                  label: string;
                  value: React.ReactNode;
                }) => (
                  <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/30 last:border-0">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold min-w-[90px] pt-0.5 text-left">
                      {label}
                    </div>
                    <div className="text-base font-bold text-white flex-1 text-left leading-tight">
                      {value}
                    </div>
                  </div>
                );

                // 1. GENERIC / ACCESSORY VIEW
                if (!isInstrument) {
                  return (
                    <div className="flex flex-col justify-center h-full px-4 py-3">
                      <SpecRow
                        label="Category"
                        value={hoveredProduct.category || "General"}
                      />
                      <SpecRow
                        label="Model"
                        value={hoveredProduct.name.split("\n")[0]}
                      />

                      {/* Show real specs if we have them, otherwise general metadata */}
                      {hoveredProduct.specs &&
                      hoveredProduct.specs.length > 0 ? (
                        hoveredProduct.specs
                          .slice(0, 4)
                          .map((s, i) => (
                            <SpecRow
                              key={i}
                              label={s.key}
                              value={String(s.value)}
                            />
                          ))
                      ) : (
                        <>
                          <SpecRow label="ID" value={hoveredProduct.id} />
                          <SpecRow label="Status" value="Logistics Ready" />
                          <SpecRow
                            label="Info"
                            value={
                              hoveredProduct.description
                                ? "Has Description"
                                : "No Description"
                            }
                          />
                        </>
                      )}
                    </div>
                  );
                }

                // 2. INSTRUMENT VIEW (Fallthrough to original logic)
                const specs = {
                  keys: hoveredProduct.name.includes("88")
                    ? "88"
                    : hoveredProduct.name.includes("61")
                      ? "61"
                      : hoveredProduct.name.includes("76")
                        ? "76"
                        : hoveredProduct.category === "Pianos"
                          ? "88 Keys"
                          : "61 Keys",

                  voices:
                    hoveredProduct.category === "Pianos"
                      ? "256-voice"
                      : hoveredProduct.category === "Synthesizers"
                        ? "128-voice"
                        : "64-voice",

                  engine: hoveredProduct.name.includes("Digital")
                    ? "SuperNATURAL Piano"
                    : hoveredProduct.name.includes("Stage")
                      ? "Physical Modeling"
                      : hoveredProduct.subcategory === "Analog"
                        ? "Analog Circuit"
                        : hoveredProduct.subcategory === "Synthesizer"
                          ? "Digital Synthesis"
                          : "Sample-based",

                  connections:
                    hoveredProduct.category === "Pianos"
                      ? "USB, MIDI, Stereo Out, Headphones × 2"
                      : hoveredProduct.category === "Synthesizers"
                        ? "USB, MIDI I/O, CV/Gate, Audio I/O"
                        : "USB, MIDI, Audio I/O",

                  display: hoveredProduct.name.includes("Pro")
                    ? "Touch LCD Display"
                    : "LED Matrix Display",

                  outputs:
                    hoveredProduct.category === "Pianos"
                      ? "2 × L/R + Headphone × 2"
                      : "Stereo L/R + MIDI Out",
                };

                return (
                  <div className="flex flex-col justify-center h-full px-4 py-3">
                    {/* Keys/Pads Count */}
                    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/30">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-bold min-w-[90px] pt-0.5 text-left">
                        Keys
                      </div>
                      <div className="text-base font-bold text-white flex-1 text-left">
                        {specs.keys}
                      </div>
                    </div>

                    {/* Polyphony */}
                    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/30">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-bold min-w-[90px] pt-0.5 text-left">
                        Polyphony
                      </div>
                      <div className="text-base font-bold text-white flex-1 text-left">
                        {specs.voices}
                      </div>
                    </div>

                    {/* Sound Engine Type */}
                    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/30">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-bold min-w-[90px] pt-0.5 text-left">
                        Engine
                      </div>
                      <div className="text-base font-bold text-white flex-1 text-left">
                        {specs.engine}
                      </div>
                    </div>

                    {/* Display Type */}
                    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/30">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-bold min-w-[90px] pt-0.5 text-left">
                        Display
                      </div>
                      <div className="text-base font-bold text-white flex-1 text-left">
                        {specs.display}
                      </div>
                    </div>

                    {/* Connections */}
                    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/30">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-bold min-w-[90px] pt-0.5 text-left">
                        I/O
                      </div>
                      <div className="text-base font-bold text-white flex-1 leading-tight text-left">
                        {specs.connections}
                      </div>
                    </div>

                    {/* Outputs */}
                    <div className="flex items-start gap-3 py-2.5">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-bold min-w-[90px] pt-0.5 text-left">
                        Outputs
                      </div>
                      <div className="text-base font-bold text-white flex-1 text-left">
                        {specs.outputs}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </InfoScreen>

          {/* Column 3: Price Tracking */}
          <InfoScreen
            title="Price History"
            active={!!hoveredProduct}
            brandColor={hoveredBrandColor}
          >
            {hoveredProduct &&
              (() => {
                const currentPrice = getProductPrice(hoveredProduct);
                // Simulate 6-month price history with slight variations
                const priceHistory = [
                  currentPrice * 1.12, // 6 months ago
                  currentPrice * 1.08, // 5 months ago
                  currentPrice * 1.1, // 4 months ago
                  currentPrice * 1.05, // 3 months ago
                  currentPrice * 1.03, // 2 months ago
                  currentPrice, // now
                ];
                const maxHistoryPrice = Math.max(...priceHistory);

                return (
                  <div className="flex flex-col h-full justify-between">
                    {/* Current Price at Top - Stuck to top */}
                    <div className="text-center px-3 pt-2">
                      <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">
                        Current Price
                      </div>
                      <div
                        className="text-4xl font-mono font-bold"
                        style={{ color: hoveredBrandColor }}
                      >
                        ₪{currentPrice.toLocaleString()}
                      </div>
                    </div>

                    {/* Monthly Price Grid - Stuck to bottom */}
                    <div className="relative h-48 px-2 pb-2">
                      {/* Subtle Grid Lines */}
                      <svg
                        className="absolute inset-0 w-full h-full"
                        preserveAspectRatio="none"
                      >
                        {/* Horizontal grid lines */}
                        {[0, 25, 50, 75, 100].map((y) => (
                          <line
                            key={`h-${y}`}
                            x1="0%"
                            y1={`${y}%`}
                            x2="100%"
                            y2={`${y}%`}
                            stroke="#334155"
                            strokeWidth="0.5"
                            opacity="0.3"
                          />
                        ))}
                        {/* Vertical grid lines */}
                        {[0, 20, 40, 60, 80, 100].map((x) => (
                          <line
                            key={`v-${x}`}
                            x1={`${x}%`}
                            y1="0%"
                            x2={`${x}%`}
                            y2="100%"
                            stroke="#334155"
                            strokeWidth="0.5"
                            opacity="0.3"
                          />
                        ))}

                        {/* Price curve */}
                        <polyline
                          points={priceHistory
                            .map((price, i) => {
                              const x = (i / (priceHistory.length - 1)) * 100;
                              const y = 100 - (price / maxHistoryPrice) * 75;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke={hoveredBrandColor}
                          strokeWidth="2"
                          opacity="0.9"
                          vectorEffect="non-scaling-stroke"
                        />
                        {/* Data points */}
                        {priceHistory.map((price, i) => {
                          const x = (i / (priceHistory.length - 1)) * 100;
                          const y = 100 - (price / maxHistoryPrice) * 75;
                          return (
                            <circle
                              key={i}
                              cx={`${x}%`}
                              cy={`${y}%`}
                              r="2"
                              fill={hoveredBrandColor}
                              opacity="0.9"
                            />
                          );
                        })}
                        {/* Arrow at end */}
                        <polygon
                          points="98,${100 - ((priceHistory[priceHistory.length - 1] / maxHistoryPrice) * 75)} 96,${100 - ((priceHistory[priceHistory.length - 1] / maxHistoryPrice) * 75) - 2} 96,${100 - ((priceHistory[priceHistory.length - 1] / maxHistoryPrice) * 75) + 2}"
                          fill={hoveredBrandColor}
                          opacity="0.7"
                        />
                      </svg>

                      {/* Month labels */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-slate-500 font-mono px-1 pb-1">
                        <span>6M</span>
                        <span>5M</span>
                        <span>4M</span>
                        <span>3M</span>
                        <span>2M</span>
                        <span>NOW</span>
                      </div>

                      {/* Price range labels */}
                      <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[8px] text-slate-500 font-mono pl-1">
                        <span>₪{Math.round(maxHistoryPrice / 1000)}k</span>
                        <span className="opacity-50">
                          ₪{Math.round((maxHistoryPrice * 0.5) / 1000)}k
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </InfoScreen>
        </div>
      </div>

      {/* 3. GRID SECTION: Compact Spectrum Analyzer */}
      <div className="relative z-0 px-8 py-4 bg-slate-950/40 border-y-2 border-slate-900 shadow-[inset_0_0_50px_rgba(0,0,0,0.7)]">
        <SpectrumGrid
          products={filteredProducts}
          onHover={handleHover}
          onSelect={handleSelect}
        />
      </div>

      {/* 3. BOTTOM SECTION: Sub Categories */}
      <SubCategoryNav
        activeId={activeCategory}
        onSelect={setActiveCategory}
        categories={subcategories}
      />

      {/* 4. OVERLAY: Product Detail Popup */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductPopup
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpectrumMiddleLayer;
