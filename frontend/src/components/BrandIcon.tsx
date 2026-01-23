/**
 * BrandIcon - Renders brand logos from SVG/PNG assets
 *
 * Normalizes logo rendering with fallback text when image fails
 * All logos fit uniformly in a square container
 */
import React, { useState } from "react";
import { BRAND_COLORS, LOGO_MAP } from "../lib/brandConstants";

interface BrandIconProps {
  brand: string;
  className?: string;
  fallbackBg?: string;
}

export const BrandIcon: React.FC<BrandIconProps> = ({
  brand,
  className = "w-7 h-7",
  fallbackBg,
}) => {
  const [imageError, setImageError] = useState(false);
  const logoUrl = LOGO_MAP[brand];
  const brandColor = fallbackBg || BRAND_COLORS[brand] || "#666666";

  if (!logoUrl || imageError) {
    // Fallback: colored box with brand initial
    return (
      <div
        className={`${className} flex items-center justify-center font-bold text-white text-xs rounded-md`}
        style={{ backgroundColor: brandColor }}
        title={brand}
      >
        {brand.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={brand}
      className={`${className} object-contain`}
      onError={() => setImageError(true)}
      title={brand}
    />
  );
};
