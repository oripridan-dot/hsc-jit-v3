import { useEffect, useState } from 'react';
import { useWebSocketStore } from './store/useWebSocketStore';
import { catalogLoader, instantSearch } from './lib';
import { HalileoNavigator } from './components/HalileoNavigator';
import { Workbench } from './components/Workbench';
import { SystemHealthBadge } from './components/SystemHealthBadge';
import ErrorBoundary from './components/ErrorBoundary';
import { applyBrandTheme } from './styles/brandThemes';
import { useRealtimeData } from './hooks/useRealtimeData';
import { initializeDevTools } from './lib/devTools';
import './index.css';

// Initialize dev tools in development
initializeDevTools();

function App() {
  const { actions } = useWebSocketStore();
  const [dataVersion, setDataVersion] = useState(0);

  // Enable real-time data updates
  useRealtimeData({
    onDataChange: (type, id) => {
      console.log(`🔄 Real-time update: ${type}${id ? ` (${id})` : ''}`);
      // Trigger re-initialization
      setDataVersion(v => v + 1);
    }
  });

  useEffect(() => {
    // Apply Roland brand theme
    applyBrandTheme('roland');
    document.body.setAttribute('data-brand', 'roland');
    
    // Initialize search system
    const initCatalog = async () => {
      try {
        console.log('🚀 v3.7: Initializing Mission Control...');
        await instantSearch.initialize();
        console.log('✅ Catalog initialized');
      } catch (error) {
        console.error('❌ Initialization error:', error);
      }
    };
    initCatalog();
  }, [dataVersion]); // Re-initialize when data changes

  useEffect(() => {
    // Attempt WebSocket connection but don't block
    try {
      actions.connect();
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.debug('ℹ️ WebSocket unavailable, using static mode:', errorMsg);
    }
  }, [actions]);

  return (
    <div className="flex fixed inset-0 flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* HEADER: Halilit Support Center */}
      <div className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-slate-950/90 backdrop-blur-md z-30 shadow-lg flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-cyan-300 tracking-wide">HALILIT SUPPORT CENTER</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">v3.7 Mission Control</p>
        </div>
        <SystemHealthBadge placement="topbar" />
      </div>

      {/* BODY CONTAINER: Left Nav + Center Workbench */}
      <div className="flex flex-1 w-full h-full overflow-hidden">
        {/* LEFT COLUMN: Navigator */}
        <ErrorBoundary name="Navigator">
          <div className="w-96 h-full border-r border-slate-800/50 bg-slate-950/70 backdrop-blur-md flex flex-col shadow-xl shadow-black/30 overflow-hidden">
            <HalileoNavigator />
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

export default App;
