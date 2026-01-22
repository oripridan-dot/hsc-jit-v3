import React from "react";
import type { SubcategoryDef } from "../../lib/universalCategories";

interface CandyCardProps {
  image?: string;
  images?: string[]; // Multiple images support
  title: string;
  subtitle?: string;
  subcategories?: SubcategoryDef[]; // Subcategories list support
  logo?: React.ReactNode;
  onClick?: () => void;
  onSubcategoryClick?: (subcategory: string) => void;
  className?: string;
  isActive?: boolean;
}

/**
 * CandyCard / GearModule
 *
 * Updated "Clear as Sun" Design
 * Features:
 * - Bright, high-contrast visibility
 * - Multi-image grid support
 * - Explicit subcategory listing with thumbnails
 * - Clear framing
 */
export const CandyCard: React.FC<CandyCardProps> = ({
  image,
  images,
  title,
  subtitle,
  subcategories,
  logo,
  onClick,
  onSubcategoryClick,
  className,
  isActive,
}) => {
  const displayImages =
    images && images.length > 0 ? images : image ? [image] : [];

  const baseClasses = [
    "relative",
    "group",
    "h-full",
    "w-full",
    "overflow-hidden",
    "cursor-pointer",
    "rounded-xl", // Softer corners
    "bg-zinc-900", // Dark base
    "border",
    "border-white/20", // Higher contrast border
    "hover:border-white/50", // Brighter hover
    "transition-all",
    "duration-300",
    "shadow-xl",
    "shadow-black/60",
    isActive ? "ring-2 ring-amber-400" : "", // Sun-like active ring
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  // Grid layout helper
  const renderImageGrid = () => {
    if (displayImages.length === 0) {
      return (
        <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
      );
    }

    if (displayImages.length === 1) {
      return (
        <img
          src={displayImages[0]}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      );
    }

    if (displayImages.length === 2) {
      return (
        <div className="h-full w-full grid grid-cols-2 gap-0.5">
          {displayImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${title} ${i}`}
              className="h-full w-full object-cover"
            />
          ))}
        </div>
      );
    }

    if (displayImages.length === 3) {
      return (
        <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-0.5">
          <img
            src={displayImages[0]}
            alt=""
            className="h-full w-full object-cover row-span-2"
          />
          <img
            src={displayImages[1]}
            alt=""
            className="h-full w-full object-cover"
          />
          <img
            src={displayImages[2]}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    // 4 or more
    return (
      <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-0.5">
        {displayImages.slice(0, 4).map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${title} ${i}`}
            className="h-full w-full object-cover"
          />
        ))}
      </div>
    );
  };

  return (
    <div onClick={onClick} className={baseClasses}>
      {/* 1. The Image Layer - Clear, bright, fitted */}
      <div className="absolute inset-0 z-0 bg-zinc-800">
        <div className="h-full w-full opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          {renderImageGrid()}
        </div>
        {/* Subtle gradient to ensure text readability without hiding images */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* 2. Content Layer - "Clear as Sun" Typography */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 flex flex-col justify-end h-full">
        <div className="mt-auto pointer-events-none">
          {/* Main Title Area */}
          <div className="flex items-center gap-3 mb-2">
            {logo && (
              <div className="w-8 h-8 flex items-center justify-center text-amber-400">
                {logo}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md">
                {title}
              </h3>
              {subtitle && !subcategories && (
                <p className="text-sm text-zinc-300 font-medium">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Subcategories List - Explicit and Clear with Thumbnails */}
        {subcategories && subcategories.length > 0 && (
          <div className="border-t border-white/20 pt-3 mt-2 pointer-events-auto">
            <ul className="grid grid-cols-2 gap-x-2 gap-y-2">
              {subcategories.slice(0, 6).map((sub, i) => (
                <li key={i}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubcategoryClick?.(sub.label); // Pass label for search/nav
                    }}
                    className="group/item flex items-center gap-2 w-full p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {/* Contextual Thumbnail instead of dot */}
                    <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-white/10 group-hover/item:border-amber-400/50 transition-colors bg-black">
                      <img
                        src={sub.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-zinc-300 font-medium truncate group-hover/item:text-amber-400 transition-colors text-left">
                      {sub.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hover Highlight Ring */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-400/50 rounded-xl transition-colors duration-300 pointer-events-none" />
    </div>
  );
};
