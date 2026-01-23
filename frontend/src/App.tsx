import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { Workbench } from "./components/Workbench";
import "./index.css";
import { instantSearch } from "./lib";
import { initializeDevTools } from "./lib/devTools";

// Initialize dev tools in development
initializeDevTools();

/**
 * App - v3.8.0 Category Module
 *
 * Three Screen Architecture:
 * 1. Galaxy Dashboard - Universal categories overview
 * 2. Sub-Category Module - Product exploration with Spectrum View
 * 3. Product Pop Interface - Detailed product knowledge
 */
function AppContent() {
  useEffect(() => {
    // Initialize search system from static JSON catalogs (non-blocking)
    console.log(
      "🚀 v3.8.0 CATEGORY-MODUL: Initializing 3-Screen Architecture...",
    );

    // Don't block - initialize in background
    setTimeout(() => {
      instantSearch
        .initialize()
        .then(() => {
          console.log(
            "✅ Catalog initialized | Screens: Galaxy → Spectrum → ProductPop",
          );
        })
        .catch((error) => {
          console.error("❌ Initialization error:", error);
        });
    }, 100); // Defer to next tick
  }, []); // Run once on mount

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Global Header */}
      <header className="flex-shrink-0 h-12 bg-black border-b border-white/5 flex items-center justify-between px-6 z-50">
        <div className="flex items-baseline gap-3">
          <div className="text-2xl font-black italic tracking-tighter text-white">
            halilit
          </div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
            Support Center
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </div>
          <div>v3.8.0 CATEGORY-MODUL</div>
        </div>
      </header>

      {/* MAIN APPLICATION FRAME - Galaxy Dashboard is the navigator */}
      <div className="flex-1 flex min-h-0 relative">
        <ErrorBoundary name="Workbench">
          <main className="flex-1 relative z-10 flex flex-col overflow-hidden">
            <Workbench />
          </main>
        </ErrorBoundary>
      </div>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
