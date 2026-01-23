import React from "react";
import type { SubcategoryDef } from "../../lib/universalCategories";

// Official brand logo paths - ONLY real logos, no generated text
const BRAND_LOGO_MAP: Record<string, string> = {
  roland: "/assets/logos/roland_logo.png",
  boss: "/assets/logos/boss_logo.png",
  nord: "/assets/logos/nord_logo.png",
  moog: "/assets/logos/moog_logo.png",
  "akai-professional": "/assets/logos/akai-professional_logo.svg",
  "adam-audio": "/assets/logos/adam-audio_logo.svg",
  mackie: "/assets/logos/mackie_logo.svg",
  "teenage-engineering": "/assets/logos/teenage-engineering_logo.svg",
  "universal-audio": "/assets/logos/universal-audio_logo.svg",
  "warm-audio": "/assets/logos/warm-audio_logo.svg",
};

interface CandyCardProps {
  image?: string; // Legacy support (unused)
  images?: string[]; // Legacy support (unused)
  title: string;
  subtitle?: string;
  subcategories?: (SubcategoryDef & { hasContent?: boolean })[]; // Subcategories list support
  logo?: React.ReactNode;
  onClick?: () => void;
  onSubcategoryClick?: (subcategory: string) => void;
  onBrandClick?: (brandId: string) => void; // Active brand filter
  className?: string;
  isActive?: boolean;
  hasContent?: boolean;
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
  onBrandClick,
  className,
  isActive,
  hasContent = true, // Default to true if not provided
}) => {
  const baseClasses = [
    "relative",
    "group",
    "h-full",
    "w-full",
    "overflow-hidden",
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
    !hasContent
      ? "opacity-50 grayscale cursor-not-allowed border-dashed border-white/10"
      : "cursor-pointer",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  // No background images - clean design

  return (
    <div onClick={hasContent ? onClick : undefined} className={baseClasses}>
      {/* Clean background with subtle warm glow - NO IMAGES */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,200,100,0.03),transparent_70%)]" />

      {/* "Not Active Yet" Overlay for empty categories */}
      {!hasContent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="px-3 py-1 bg-black/80 border border-white/10 rounded-full">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              No Data
            </span>
          </div>
        </div>
      )}

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

        {/* Subcategories Grid - Responsive Layout, Maximum Screen Use */}
        {subcategories && subcategories.length > 0 && (
          <div className="flex-1 border-t border-white/10 pt-2 pointer-events-auto">
            <ul className="grid grid-cols-3 gap-x-2 gap-y-1">
              {subcategories.slice(0, 6).map((sub, i) => {
                const isSubActive = sub.hasContent !== false;

                return (
                  <li
                    key={i}
                    className={
                      !isSubActive
                        ? "opacity-30 grayscale pointer-events-none"
                        : ""
                    }
                  >
                    <div
                      onClick={(e) => {
                        if (!isSubActive) return;
                        e.stopPropagation();
                        onSubcategoryClick?.(sub.label);
                      }}
                      className={`w-full flex flex-col items-center group/sub ${isSubActive ? "cursor-pointer hover:bg-white/5 rounded-lg" : ""}`}
                      role="button"
                      tabIndex={isSubActive ? 0 : -1}
                    >
                      {/* Large Responsive Thumbnail - Fills available space */}
                      <div className="w-full aspect-square flex items-center justify-center group-hover/sub:scale-105 transition-transform duration-200">
                        <img
                          src={sub.image}
                          alt={sub.label}
                          className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                        />
                      </div>

                      {/* Label - Tight proximity to thumbnail */}
                      <span className="text-[10px] font-semibold text-zinc-400 group-hover/sub:text-cyan-400 transition-colors text-center line-clamp-1 leading-tight">
                        {sub.label}
                      </span>

                      {/* Official Brand Logos - Compact row */}
                      {sub.brands && sub.brands.length > 0 && (
                        <div className="flex gap-0.5">
                          {sub.brands.slice(0, 4).map((brand) => {
                            const logoUrl = BRAND_LOGO_MAP[brand.toLowerCase()];
                            if (!logoUrl) return null;
                            return (
                              <button
                                key={brand}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBrandClick?.(brand);
                                }}
                                className="w-5 h-3 hover:scale-125 active:scale-95 transition-all duration-150 cursor-pointer"
                                title={`Filter by ${brand}`}
                              >
                                <img
                                  src={logoUrl}
                                  alt={brand}
                                  className="w-full h-full object-contain brightness-90 hover:brightness-110"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Hover Highlight Ring */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-400/50 rounded-xl transition-colors duration-300 pointer-events-none" />
    </div>
  );
};
