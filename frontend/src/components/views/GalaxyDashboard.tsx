/**
 * GalaxyDashboard - Visual Showroom / Home View
 * "See Then Read" paradigm: Hero images + Visual Entry Points
 *
 * Grabs random flagship items from catalog to create immersive atmosphere
 */
import { motion } from "framer-motion";
import { PlayCircle, Sparkles } from "lucide-react";
import React, { useMemo } from "react";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { useNavigationStore } from "../../store/navigationStore";

export const GalaxyDashboard: React.FC = () => {
  const { selectUniversalCategory, selectBrand } = useNavigationStore();

  // Mock "Flagship" Data (In real app, fetch from RAG "high_tier" tag)
  // These create the "Atmosphere" of the app
  const heroProduct = useMemo(
    () => ({
      name: "ROLAND FANTOM-8 EX",
      image:
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&q=80",
      tagline: "The World's Most Powerful Synthesizer",
      brand: "Roland",
    }),
    [],
  );

  return (
    <div className="h-full w-full bg-[#050505] overflow-y-auto text-white relative">
      {/* 1. HERO SECTION (Cinema Experience) */}
      <div className="relative h-[60vh] w-full overflow-hidden flex items-end pb-16 px-12 group cursor-pointer">
        {/* Immersive Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroProduct.image}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 50%, transparent 100%)",
            }}
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Flagship Spotlight
            </span>
            <span className="text-amber-500/80 text-xs font-mono uppercase tracking-widest">
              {heroProduct.brand}
            </span>
          </div>
          <h1 className="text-7xl font-black uppercase tracking-tighter mb-4 leading-[0.9]">
            {heroProduct.name}
          </h1>
          <p className="text-2xl text-white/60 font-light mb-8 max-w-xl">
            {heroProduct.tagline}
          </p>

          <button
            onClick={() => selectBrand("roland")}
            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform"
          >
            <PlayCircle size={20} /> Experience Now
          </button>
        </div>
      </div>

      {/* 2. VISUAL ENTRY POINTS (The Universal 10) */}
      <div className="px-12 py-8">
        <div className="flex items-center gap-2 mb-8 text-white/40">
          <Sparkles size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">
            Explore Categories
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {UNIVERSAL_CATEGORIES.slice(0, 8).map((cat, i) => (
            <motion.button
              key={cat.id}
              onClick={() => selectUniversalCategory(cat.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02]"
            >
              {/* Abstract Visual Gradient based on Category Color */}
              <div
                className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity"
                style={{
                  background: `linear-gradient(to top right, ${cat.color}, transparent)`,
                }}
              />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="mb-auto opacity-50 group-hover:opacity-100 transition-opacity">
                  {/* Icon would go here if we had Lucide map, or large text char */}
                  <span className="text-4xl font-black text-white/20">
                    {cat.label[0]}
                  </span>
                </div>

                <h3 className="text-xl font-bold uppercase leading-tight mb-1">
                  {cat.label}
                </h3>
                <div className="h-0.5 w-8 bg-white/20 group-hover:w-full group-hover:bg-white transition-all duration-500" />
                <p className="text-[10px] text-white/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
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
