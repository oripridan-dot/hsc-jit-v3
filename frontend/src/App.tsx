import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { Navigator } from "./components/Navigator";
import { Workbench } from "./components/Workbench";
import "./index.css";
import { instantSearch } from "./lib";
import { initializeDevTools } from "./lib/devTools";

// Initialize dev tools in development
initializeDevTools();

function AppContent() {
  useEffect(() => {
    // Initialize search system from static JSON catalogs (non-blocking)
    console.log("🚀 v3.7: Initializing Mission Control...");

    // Don't block - initialize in background
    setTimeout(() => {
      instantSearch
        .initialize()
        .then(() => {
          console.log("✅ Catalog initialized from static data");
        })
        .catch((error) => {
          console.error("❌ Initialization error:", error);
        });
    }, 100); // Defer to next tick
  }, []); // Run once on mount

  return (
    <div className="flex fixed inset-0 flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* HEADER: Halilit Support Center */}
      <div className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-950/90 backdrop-blur-md z-30 shadow-lg flex-shrink-0 relative">
        <div>
          <h1 className="text-2xl font-bold text-cyan-300 tracking-wide">
            HALILIT SUPPORT CENTER
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            v3.7.4 - Enhanced Navigation & TierBar
          </p>
        </div>
      </div>

      {/* BODY CONTAINER: Left Nav + Center Workbench */}
      <div className="flex flex-1 w-full h-full overflow-hidden">
        {/* LEFT COLUMN: Navigator */}
        <ErrorBoundary name="Navigator">
          <div className="w-96 h-full border-r border-slate-800/50 bg-slate-950/70 backdrop-blur-md flex flex-col shadow-xl shadow-black/30 overflow-hidden">
            <Navigator
              mode="catalog"
              setMode={() => {}}
              searchResults={[]}
              isSearching={false}
              insight={null}
              query=""
            />
          </div>
        </ErrorBoundary>

        {/* CENTER + RIGHT COLUMN: Workbench */}
        <ErrorBoundary name="Workbench">
          <div className="flex-1 h-full flex flex-col overflow-hidden">
            <Workbench />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
