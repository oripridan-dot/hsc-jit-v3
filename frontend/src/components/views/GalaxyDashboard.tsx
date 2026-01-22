/**
 * GalaxyDashboard - Visual Showroom / Home View
 * "See Then Read" paradigm: Hero images + Visual Entry Points
 *
 * Grabs random flagship items from catalog to create immersive atmosphere
 */
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import React, { useMemo } from "react";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { useNavigationStore } from "../../store/navigationStore";

export const GalaxyDashboard: React.FC = () => {
  const { selectUniversalCategory, selectBrand } = useNavigationStore();

  // Mock "Flagship" Data (In real app, fetch from RAG "high_tier" tag)
  const heroProduct = useMemo(
    () => ({
      name: "ROLAND FANTOM-8 EX",
      image:
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1600&q=85",
      tagline: "Professional Workstation Synthesizer",
      brand: "Roland",
    }),
    [],
  );

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto text-white relative">
      {/* 1. HERO SECTION - Refined Cinema Experience */}
      <div className="relative w-full overflow-hidden flex items-end pb-20 px-16">
        <div className="absolute inset-0 z-0">
          <img
            src={heroProduct.image}
            className="w-full h-full object-cover opacity-50 hover:opacity-65 transition-opacity duration-1000"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 40%, transparent 85%)",
            }}
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        </div>

        {/* Hero Content - Refined Proportions */}
        <div className="relative z-10 max-w-5xl py-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              Flagship
            </span>
            <span className="text-amber-300 text-xs font-mono uppercase tracking-widest opacity-80">
              {heroProduct.brand}
            </span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-6 leading-[0.95]">
            {heroProduct.name}
          </h1>
          <p className="text-xl lg:text-2xl text-white/50 font-light mb-12 max-w-2xl leading-relaxed">
            {heroProduct.tagline}
          </p>

          <button
            onClick={() => selectBrand("roland")}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-8 py-3.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
          >
            <PlayCircle size={18} />
            Explore Collection
          </button>
        </div>
      </div>

      {/* 2. VISUAL ENTRY POINTS - Refined Grid */}
      <div className="px-16 py-20">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-transparent" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">
            Discover By Category
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {UNIVERSAL_CATEGORIES.slice(0, 8).map((cat, i) => (
            <motion.button
              key={cat.id}
              onClick={() => selectUniversalCategory(cat.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group relative aspect-square rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-xl"
              style={{
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 40px ${cat.color}00`,
              }}
            >
              {/* Background Gradient */}
              <div
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{
                  background: `radial-gradient(circle at top right, ${cat.color}, transparent)`,
                }}
              />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="mb-auto opacity-40 group-hover:opacity-60 transition-opacity">
                  <span className="text-5xl font-black text-white/20">
                    {cat.label[0]}
                  </span>
                </div>

                <h3 className="text-lg font-bold uppercase leading-tight mb-2 group-hover:text-white/95 transition-colors">
                  {cat.label}
                </h3>
                <div className="h-0.5 w-6 bg-white/20 group-hover:w-12 group-hover:bg-white/40 transition-all duration-500" />
                <p className="text-[10px] text-white/40 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {cat.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
