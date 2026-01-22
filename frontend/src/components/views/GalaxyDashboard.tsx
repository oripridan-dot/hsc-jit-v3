/**
 * GalaxyDashboard / Halilit Master Desk
 *
 * "The Atmosphere" meets "Digital Showroom"
 * Viewport-locked layout with:
 * - Meter Bridge header (Master controls feel)
 * - Channel Strip Grid (Category/Department selection)
 * - Transport Bar footer (Global navigation)
 */
import React from "react";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { useNavigationStore } from "../../store/navigationStore";
import { CandyCard } from "../ui/CandyCard";

// ------------------------------------------------------------------
// CONFIGURATION: Map your categories to "Candy Shop" images here
// ------------------------------------------------------------------
const CATEGORY_IMAGES: Record<string, string[]> = {
  "Keys & Pianos": [
    "/data/product_images/nord/nord-nord-electro-7_thumb.webp",
    "/data/product_images/nord/nord-nord-lead-a1_thumb.webp",
    "/data/product_images/roland/roland-fantom_series_thumb.webp",
    "/data/product_images/roland/roland-gokeys_5_thumb.webp",
  ],
  "Drums & Percussion": [
    "/data/product_images/nord/nord-nord-drum-3p_thumb.webp",
    "/data/product_images/roland/roland-prod-1_thumb.webp",
    "/data/product_images/akai-professional/akai-professional-prod-2_thumb.webp",
    "/data/product_images/akai-professional/akai-professional-prod-3_thumb.webp",
  ],
  "Guitars & Amps": [
    "/data/product_images/boss/boss-eurus_gs-1_thumb.webp",
    "/data/product_images/boss/boss-gx-10_thumb.webp",
    "/data/product_images/boss/boss-prod-1_thumb.webp",
    "/data/product_images/boss/boss-prod-2_thumb.webp",
  ],
  "Studio & Recording": [
    "/data/product_images/universal-audio/universal-audio-prod-1_thumb.webp",
    "/data/product_images/adam-audio/adam-audio-prod-1_thumb.webp",
    "/data/product_images/focusrite/focusrite-prod-1_thumb.webp",
    "/data/product_images/warm-audio/warm-audio-prod-1_thumb.webp",
  ],
  "Live Sound": [
    "/data/product_images/mackie/mackie-prod-1_thumb.webp",
    "/data/product_images/roland/roland-bridge_cast_thumb.webp",
    "/data/product_images/roland/roland-prod-3_thumb.webp",
    "/data/product_images/mackie/mackie-prod-2_thumb.webp",
  ],
  "DJ & Production": [
    "/data/product_images/teenage-engineering/teenage-engineering-prod-1_thumb.webp",
    "/data/product_images/roland/roland-cb-404_thumb.webp",
    "/data/product_images/roland/roland-rh-5_thumb.webp",
    "/data/product_images/teenage-engineering/teenage-engineering-prod-4_thumb.webp",
  ],
  Default: ["/assets/react.svg"],
};

export const GalaxyDashboard: React.FC = () => {
  const { selectUniversalCategory, selectSubcategory } = useNavigationStore();

  // Derive visible categories from UNIVERSAL_CATEGORIES
  const visibleCategories = UNIVERSAL_CATEGORIES.slice(0, 6); // Limit to 6 for grid fit

  const handleCategoryClick = (categoryId: string) => {
    selectUniversalCategory(categoryId);
  };

  const handleSubcategoryClick = (categoryId: string, subcategory: string) => {
    selectSubcategory(categoryId, subcategory);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0e0e10] text-white overflow-hidden no-scrollbar">
      {/* 1. The "Meter Bridge" (Header) - Master Control aesthetics */}
      <header className="flex-shrink-0 h-20 px-8 flex items-center justify-between border-b border-white/10 bg-[#18181b]">
        <div className="flex items-center gap-4">
          {/* "Recording" LED - animated pulse */}
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
          <h1 className="text-2xl font-black tracking-[0.2em] text-zinc-400 uppercase">
            HALILIT <span className="text-white">MASTER</span>
          </h1>
        </div>
        {/* Status indicators (DAW style) */}
        <div className="font-mono text-xs text-zinc-500 flex gap-6">
          <span>SR: 48kHz</span>
          <span>CLK: INT</span>
          <span className="text-[var(--led-active)]">● ONLINE</span>
        </div>
      </header>

      {/* 2. The "Channel Strip" Grid (Main Content) - Non-scrolling viewport */}
      <main className="flex-1 p-6 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
        {visibleCategories.map((cat) => {
          return (
            <div
              key={cat.id}
              className="relative transition-all hover:z-10 group"
            >
              <CandyCard
                title={cat.label}
                subtitle={`${cat.description || "ARM TRACK"}`}
                images={
                  CATEGORY_IMAGES[cat.label] || CATEGORY_IMAGES["Default"]
                }
                subcategories={cat.subcategories}
                onClick={() => handleCategoryClick(cat.id)}
                onSubcategoryClick={(sub) =>
                  handleSubcategoryClick(cat.id, sub)
                }
              />
            </div>
          );
        })}
      </main>

      {/* 3. The "Transport Bar" (Footer) - Global navigation */}
      <footer className="flex-shrink-0 h-16 bg-[#121214] border-t border-white/10 flex items-center justify-center gap-2 px-8">
        <button className="h-10 px-8 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono uppercase tracking-widest transition-colors hover:shadow-[0_0_12px_rgba(0,255,148,0.2)]">
          Global Search
        </button>
        <button className="h-10 px-8 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono uppercase tracking-widest transition-colors hover:shadow-[0_0_12px_rgba(0,255,148,0.2)]">
          All Brands
        </button>
        <div className="flex-1" />
        <span className="text-xs text-zinc-600 font-mono">
          v3.7.5 • Showroom Ready
        </span>
      </footer>
    </div>
  );
};
