/**
 * BrandIcon - Renders brand logos from SVG/PNG assets
 *
 * Normalizes logo rendering with fallback text when image fails
 * All logos fit uniformly in a square container
 */
import React, { useState } from "react";

interface BrandIconProps {
  brand: string;
  className?: string;
  fallbackBg?: string;
}

const LOGO_MAP: Record<string, string> = {
  Roland: "/assets/logos/roland_logo.png",
  Boss: "/assets/logos/boss_logo.png",
  Nord: "/assets/logos/nord_logo.png",
  Moog: "/assets/logos/moog_logo.png",
  "Akai Professional": "/assets/logos/akai-professional_logo.svg",
  "Adam Audio": "/assets/logos/adam-audio_logo.svg",
  Mackie: "/assets/logos/mackie_logo.svg",
  "Teenage Engineering": "/assets/logos/teenage-engineering_logo.svg",
  "Universal Audio": "/assets/logos/universal-audio_logo.svg",
  "Warm Audio": "/assets/logos/warm-audio_logo.svg",
};

const BRAND_COLORS: Record<string, string> = {
  Roland: "#FF6600", // Orange
  Boss: "#000000", // Black
  Nord: "#CC0000", // Red
  Moog: "#1A4D8C", // Navy Blue
  "Akai Professional": "#FF6600", // Orange
  "Adam Audio": "#003D82", // Blue
  Mackie: "#FF0000", // Red
  "Teenage Engineering": "#000000", // Black
  "Universal Audio": "#1F77B4", // Blue
  "Warm Audio": "#8B4513", // Brown
};

export const BrandIcon: React.FC<BrandIconProps> = ({
  brand,
  className = "w-8 h-8",
  fallbackBg,
}) => {
  const [imageError, setImageError] = useState(false);
  const logoUrl = LOGO_MAP[brand];
  const brandColor = fallbackBg || BRAND_COLORS[brand] || "#666666";

  if (!logoUrl || imageError) {
    // Fallback: colored box with brand initial
    return (
      <div
        className={`${className} flex items-center justify-center font-bold text-white text-xs rounded`}
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
