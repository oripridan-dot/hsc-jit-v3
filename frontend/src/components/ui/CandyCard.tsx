import React from "react";
import type { SubcategoryDef } from "../../lib/universalCategories";

interface CandyCardProps {
  image?: string; // Legacy support (unused)
  images?: string[]; // Legacy support (unused)
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
  title,
  subtitle,
  subcategories,
  logo,
  onClick,
  onSubcategoryClick,
  className,
  isActive,
}) => {
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

  // No background images - clean design

  return (
    <div onClick={onClick} className={baseClasses}>
      {/* Clean background with subtle warm glow - NO IMAGES */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,200,100,0.03),transparent_70%)]" />

      {/* Content Layer - Compact */}
      <div className="relative z-10 p-4 flex flex-col h-full">
        {/* Title Area - Compact */}
        <div className="flex items-center gap-2 mb-3">
          {logo && (
            <div className="w-6 h-6 flex items-center justify-center text-amber-400">
              {logo}
            </div>
          )}
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wide">
              {title}
            </h3>
            {subtitle && !subcategories && (
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Subcategories Grid - 3 Column Compact Layout */}
        {subcategories && subcategories.length > 0 && (
          <div className="flex-1 border-t border-white/10 pt-3 pointer-events-auto">
            <ul className="grid grid-cols-3 gap-2">
              {subcategories.slice(0, 6).map((sub, i) => (
                <li key={i}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubcategoryClick?.(sub.label);
                    }}
                    className="w-full flex flex-col items-center gap-0.5 group/sub"
                  >
                    {/* Compact Thumbnail - Optimized 64x64 */}
                    <div className="w-16 h-16 rounded overflow-hidden bg-zinc-800/50 group-hover/sub:scale-105 transition-transform duration-200 border border-white/5">
                      <img
                        src={sub.image}
                        alt={sub.label}
                        className="w-full h-full object-cover opacity-90 group-hover/sub:opacity-100 transition-opacity"
                      />
                    </div>

                    {/* Label - MINIMAL 4px gap from thumbnail */}
                    <span className="text-[9px] font-semibold text-zinc-400 group-hover/sub:text-cyan-400 transition-colors text-center line-clamp-2 leading-tight mt-1">
                      {sub.label}
                    </span>

                    {/* Brand Micro-Logos - Tight spacing */}
                    {sub.brands && sub.brands.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {sub.brands.slice(0, 4).map((brand) => (
                          <div
                            key={brand}
                            className="w-3 h-3 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center opacity-60 group-hover/sub:opacity-100 group-hover/sub:border-cyan-400/30 transition-all"
                            title={brand}
                          >
                            <span className="text-[6px] font-black text-white">
                              {brand.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
