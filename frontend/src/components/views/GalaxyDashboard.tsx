import * as LucideIcons from "lucide-react";
import { LayoutGrid, List } from "lucide-react";
import React, { useState } from "react";
import { UNIVERSAL_CATEGORIES } from "../../lib/universalCategories";
import { useNavigationStore } from "../../store/navigationStore";

export const GalaxyDashboard = () => {
  const { goToSpectrum } = useNavigationStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="w-full h-full bg-[#0e0e10] flex flex-col">
      {/* Header Area */}
      <div className="shrink-0 pt-6 px-6 lg:px-8 bg-[#0e0e10] z-20">
        <div className="flex items-end gap-4 justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white/90 leading-none">
              GALAXIES
            </h1>
            <span className="block text-xs md:text-sm font-bold not-italic tracking-widest text-zinc-500 mt-1">
              SECTOR VIEW
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex bg-[#18181b] p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid"
                  ? "bg-[#25252a] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list"
                  ? "bg-[#25252a] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-zinc-800 to-transparent mb-6" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto xl:overflow-hidden px-4 md:px-6 lg:px-8 pb-4 h-full">
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:grid-rows-2 gap-4 xl:h-full pb-20 xl:pb-0"
              : "flex flex-col gap-3 xl:h-full xl:gap-2 pb-20 xl:pb-0"
          }
        >
          {UNIVERSAL_CATEGORIES.map((tribe, index) => {
            // Dynamic Icon Resolution
            const IconComponent =
              (LucideIcons as unknown as Record<string, React.ElementType>)[
                tribe.iconName
              ] || LucideIcons.HelpCircle;

            if (viewMode === "list") {
              return (
                <div
                  key={tribe.id}
                  className="bg-[#18181b] rounded-lg border border-white/5 px-4 flex items-center gap-6 group hover:bg-[#202023] transition-colors flex-1 min-h-0 py-2 xl:py-0"
                >
                  {/* Left: Category Info */}
                  <div className="flex items-center gap-4 shrink-0 w-32 md:w-64">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: tribe.color }}
                    >
                      <IconComponent className="w-4 h-4 text-black" />
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-0.5">
                        SECTOR 0{index + 1}
                      </span>
                      <h2 className="text-sm md:text-base font-bold uppercase tracking-tight text-white leading-none">
                        {tribe.label}
                      </h2>
                    </div>
                  </div>

                  {/* Right: Horizontal Scrollable Subcategories */}
                  <div className="flex-1 flex gap-2 overflow-x-auto h-full items-center scrollbar-none mask-linear-fade">
                    {tribe.spectrum.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => goToSpectrum(tribe.id, sub.id, [])}
                        className="flex-shrink-0 w-28 md:w-36 h-[90%] bg-[#0a0a0c] rounded border border-white/5 flex items-center p-1.5 gap-2 hover:bg-[#25252a] transition-all group/item"
                      >
                        <div className="w-8 h-full flex items-center justify-center shrink-0">
                          <img
                            src={sub.image}
                            className="max-w-full max-h-full opacity-70 group-hover/item:opacity-100 transition-opacity object-contain"
                            alt={sub.label}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-left leading-tight group-hover/item:text-white line-clamp-2">
                          {sub.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tribe.id}
                className="group relative bg-[#18181b] rounded-t-xl overflow-hidden shadow-2xl flex flex-col min-h-[180px] xl:min-h-0"
                style={{
                  boxShadow: `0 20px 40px -10px rgba(0,0,0,0.5)`,
                }}
              >
                {/* Shelf Top (The "Lip") */}
                <div className="relative h-10 bg-[#202023] border-b border-black flex items-center px-3 justify-between z-10 transition-colors duration-300 group-hover:bg-[#25252a] shrink-0">
                  {/* Top Highlight for 3D effect */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />

                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: tribe.color }}
                    >
                      <IconComponent className="w-3 h-3 text-black" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-tight text-zinc-200 leading-none group-hover:text-white transition-colors">
                        {tribe.label}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* The "Carved" Shelf Body */}
                <div className="relative bg-[#0a0a0c] p-2 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] border-t border-black flex-1 min-h-0 overflow-hidden flex flex-col">
                  {/* Texture Overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent" />

                  {/* The Modules (Subcategories) - Fit logic */}
                  <div className="relative z-10 grid grid-cols-2 2xl:grid-cols-3 gap-2 h-full content-start overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-1">
                    {tribe.spectrum.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => goToSpectrum(tribe.id, sub.id, [])}
                        className="group/item relative flex flex-col items-center justify-between rounded-lg bg-[#030303] overflow-hidden transition-all duration-300 hover:bg-[#050505] shadow-[inset_0_2px_4px_rgba(0,0,0,1)] border border-white/5 aspect-[4/3] min-h-0"
                      >
                        {/* 1. Deep Shadow Layer (The Recess) */}
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_5px_15px_rgba(0,0,0,0.95)] z-20 rounded-lg" />

                        {/* 2. Soft Illumination (The "Dimmed Light") */}
                        <div
                          className="absolute inset-x-0 top-0 h-[80%] opacity-15 group-hover/item:opacity-30 transition-opacity duration-500"
                          style={{
                            background: `radial-gradient(circle at 50% 0%, ${tribe.color}, transparent 70%)`,
                          }}
                        />

                        {/* 3. Product Thumbnail - Standardized Size & Crop */}
                        <div className="relative w-full h-full flex items-center justify-center p-2 z-10">
                          <img
                            src={sub.image}
                            alt={sub.label}
                            className="w-full h-full object-contain filter brightness-[0.7] contrast-[1.1] group-hover/item:brightness-100 group-hover/item:scale-110 transition-all duration-300 drop-shadow-lg"
                          />
                        </div>

                        {/* 4. Label Plate */}
                        <div className="w-full py-1 bg-[#08080a] border-t border-white/5 z-20 flex items-center justify-center relative shrink-0">
                          {/* Top bevel on plate */}
                          <div className="absolute top-0 inset-x-0 h-px bg-black/50" />

                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest group-hover/item:text-zinc-300 transition-colors truncate px-2">
                            {sub.label}
                          </span>

                          {/* Active Indicator Color */}
                          <div
                            className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover/item:opacity-100 transition-opacity"
                            style={{ backgroundColor: tribe.color }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shelf Bottom Lip */}
                <div className="h-1 bg-[#202023] border-t border-white/5 shadow-lg relative rounded-b-xl shrink-0">
                  <div className="absolute inset-x-0 bottom-0 h-px bg-black opacity-50" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
