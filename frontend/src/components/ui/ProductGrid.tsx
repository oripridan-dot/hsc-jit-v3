/**
 * ProductGrid - Responsive, Scalable Product Display System
 *
 * Features:
 * - Fully responsive grid (1-8 columns based on viewport)
 * - Maintains minimum thumbnail size across all screens
 * - Lazy loading for images
 * - Hover effects and interactions
 * - Supports thousands of products with smooth scrolling
 * - Professional card design with brand integration
 */
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { useNavigationStore } from "../../store/navigationStore";
import type { Product, ProductImagesObject } from "../../types";
import { BrandIcon } from "../BrandIcon";

interface ProductGridProps {
  products: Product[];
  className?: string;
  minThumbnailSize?: number; // Minimum thumbnail width in pixels
  showBrandIcon?: boolean;
  showPrice?: boolean;
  compactMode?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  className,
  minThumbnailSize = 120,
  showBrandIcon = true,
  showPrice = true,
  compactMode = false,
}) => {
  const { selectProduct } = useNavigationStore();

  // Calculate grid columns based on viewport width
  const getGridColumns = () => {
    if (typeof window === "undefined") return 6;
    const width = window.innerWidth;

    // Dynamic column calculation ensuring minimum thumbnail size
    const sidebarWidth = 256; // Approximate sidebar width
    const availableWidth = width - sidebarWidth - 64; // Subtract sidebar + padding
    const maxColumns = Math.floor(availableWidth / minThumbnailSize);

    // Responsive breakpoints with intelligent column selection
    if (width < 640) return Math.min(maxColumns, 2); // Mobile: 1-2 columns
    if (width < 768) return Math.min(maxColumns, 3); // Tablet: 2-3 columns
    if (width < 1024) return Math.min(maxColumns, 4); // Laptop: 3-4 columns
    if (width < 1280) return Math.min(maxColumns, 5); // Desktop: 4-5 columns
    if (width < 1536) return Math.min(maxColumns, 6); // Large: 5-6 columns
    if (width < 1920) return Math.min(maxColumns, 7); // XL: 6-7 columns
    return Math.min(maxColumns, 8); // 2K+: 7-8 columns
  };

  const [columns, setColumns] = useState(getGridColumns());

  useEffect(() => {
    const handleResize = () => {
      setColumns(getGridColumns());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minThumbnailSize]);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📦</div>
          <div className="text-sm">No products found</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-4 w-full", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(${minThumbnailSize}px, 1fr))`,
      }}
    >
      {products.map((product, index) => (
        <ProductCard
          key={`${product.id}-${index}`}
          product={product}
          showBrandIcon={showBrandIcon}
          showPrice={showPrice}
          compactMode={compactMode}
          index={index}
          onClick={() => selectProduct(product)}
        />
      ))}
    </div>
  );
};

// Individual Product Card Component
interface ProductCardProps {
  product: Product;
  showBrandIcon: boolean;
  showPrice: boolean;
  compactMode: boolean;
  index: number;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showBrandIcon,
  showPrice,
  compactMode,
  index,
  onClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }, // Load images 100px before they enter viewport
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Resolve product image
  const getProductImage = (): string => {
    let img = product.image_url || product.image || "";

    if (product.images) {
      if (Array.isArray(product.images)) {
        if (product.images.length > 0) img = product.images[0].url;
      } else {
        const imagesObj = product.images as ProductImagesObject;
        img = imagesObj.thumbnail || imagesObj.main || img;
      }
    }

    return img;
  };

  // Get product price
  const getPrice = (): number => {
    return typeof product.halilit_price === "number"
      ? product.halilit_price
      : product.pricing?.regular_price || 0;
  };

  const imageUrl = getProductImage();
  const price = getPrice();

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      onClick={onClick}
      className={cn(
        "group relative bg-[#18181b] rounded-lg overflow-hidden cursor-pointer",
        "border border-white/5 hover:border-white/20",
        "transition-all duration-300",
        "hover:shadow-xl hover:shadow-black/50",
        "hover:scale-[1.02] hover:z-10",
        compactMode ? "pb-2" : "pb-3",
      )}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative bg-white/5 overflow-hidden",
          compactMode ? "aspect-square" : "aspect-[4/3]",
        )}
      >
        {isVisible && (
          <>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {!imageError ? (
              <img
                src={imageUrl}
                alt={product.name}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={cn(
                  "w-full h-full object-contain p-4 transition-all duration-300",
                  "group-hover:scale-110 group-hover:p-2",
                  imageLoaded ? "opacity-100" : "opacity-0",
                )}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                <div className="text-center">
                  <div className="text-3xl mb-1">📦</div>
                  <div className="text-xs">No Image</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Brand Icon Overlay */}
        {showBrandIcon && product.brand && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <BrandIcon brand={product.brand} className="w-6 h-6" />
          </div>
        )}

        {/* Quick View Badge */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="text-white text-xs font-bold uppercase tracking-wider">
            Quick View
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className={cn("px-3", compactMode ? "pt-2" : "pt-3")}>
        {/* Brand Name */}
        {product.brand && (
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 truncate">
            {product.brand}
          </div>
        )}

        {/* Product Name */}
        <h3
          className={cn(
            "font-semibold text-white mb-1 line-clamp-2 leading-tight",
            compactMode ? "text-xs" : "text-sm",
          )}
        >
          {product.name}
        </h3>

        {/* Category */}
        {product.category && !compactMode && (
          <div className="text-[10px] text-zinc-600 mb-2 truncate">
            {product.category}
          </div>
        )}

        {/* Price */}
        {showPrice && price > 0 && (
          <div
            className={cn(
              "font-mono font-bold text-[#00ff94]",
              compactMode ? "text-xs" : "text-sm",
            )}
          >
            ₪{price.toLocaleString()}
          </div>
        )}
      </div>

      {/* Active Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00ff94] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};
