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
    console.log("🚀 v3.7.5: Initializing Mission Control...");

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
    <div className="flex fixed inset-0 flex-col bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* MAIN APPLICATION FRAME */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* LEFT COLUMN: Refined Navigation Sidebar */}
        <ErrorBoundary name="Navigator">
          <Navigator />
        </ErrorBoundary>

        {/* CENTER + RIGHT COLUMN: Main Workbench */}
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
