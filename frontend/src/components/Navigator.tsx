import React from "react";
import { useNavigationStore } from "../store/navigationStore";

// Main functional categories for a music store
const SUPPORT_CATEGORIES = [
  { id: "keys", label: "Keys & Pianos", icon: "🎹" },
  { id: "drums", label: "Drums & Perc", icon: "🥁" },
  { id: "studio", label: "Studio & Rec", icon: "🎙️" },
  { id: "guitar", label: "Guitar & FX", icon: "🎸" },
  { id: "dj", label: "DJ & Perf", icon: "🎛️" },
  { id: "pa", label: "PA & Live", icon: "🔊" },
];

export const Navigator: React.FC = () => {
  // We use selectUniversalCategory instead of the imagined setCurrentView
  // This hooks into the existing store action that sets currentLevel="universal"
  const {
    currentLevel,
    currentUniversalCategory,
    selectUniversalCategory,
    goHome,
  } = useNavigationStore();

  const currentCategoryLabel = currentUniversalCategory;

  return (
    <nav className="h-full w-16 md:w-56 flex flex-col bg-[#050505] border-r border-white/5 z-50">
      <div className="p-3 md:p-4">
        <h1 className="text-[10px] font-black tracking-[0.25em] text-zinc-700 uppercase mb-4 hidden md:block">
          Support Center
        </h1>

        {/* Compact Global Search Button */}
        <button
          onClick={() => goHome()}
          className="w-full bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 p-2.5 rounded flex items-center justify-center gap-2 transition-all mb-4"
        >
          <span className="md:hidden text-sm">🔍</span>
          <span className="hidden md:inline font-bold text-[10px] uppercase tracking-wider">
            SEARCH
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 px-2">
        {SUPPORT_CATEGORIES.map((cat) => {
          const isActive =
            currentLevel === "universal" && currentCategoryLabel === cat.label;

          return (
            <button
              key={cat.id}
              onClick={() => selectUniversalCategory(cat.label)}
              className={`w-full flex items-center gap-3 p-2.5 rounded transition-all duration-200 group ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-600 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-lg filter grayscale group-hover:grayscale-0">
                {cat.icon}
              </span>
              <span className="text-xs font-medium hidden md:block">
                {cat.label}
              </span>

              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Compact Status */}
      <div className="p-3 mt-auto border-t border-white/5">
        <div className="flex items-center gap-1.5 text-[9px] text-zinc-700 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="hidden md:inline">SYNCED</span>
        </div>
      </div>
    </nav>
  );
};
