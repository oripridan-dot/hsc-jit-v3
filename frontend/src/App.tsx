import { useEffect } from 'react';
import { useWebSocketStore } from './store/useWebSocketStore';
import { catalogLoader, instantSearch } from './lib';
import { HalileoNavigator } from './components/HalileoNavigator';
import { Workbench } from './components/Workbench';
import { SystemHealthBadge } from './components/SystemHealthBadge';
import { applyBrandTheme } from './styles/brandThemes';
import './index.css';

function App() {
  const { actions } = useWebSocketStore();

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
  }, []);

  useEffect(() => {
    // Attempt WebSocket connection but don't block
    try {
      actions.connect();
    } catch (e: any) {
      console.debug('ℹ️ WebSocket unavailable, using static mode:', e);
    }
  }, [actions]);

  return (
    <div className="flex fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-cyan-500/30">
      <div className="flex w-full h-full">
        {/* LEFT COLUMN: Navigator */}
        <div className="w-96 h-full border-r border-slate-800/50 bg-slate-950/70 backdrop-blur-md flex flex-col shadow-xl shadow-black/30 overflow-hidden">
          <HalileoNavigator />
        </div>

        {/* CENTER COLUMN: Workbench */}
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          <div className="h-14 border-b border-slate-800/50 flex items-center px-6 gap-4 bg-slate-950/80 backdrop-blur-md z-20 shadow-lg flex-shrink-0">
            <div className="text-sm font-mono font-bold text-cyan-400 tracking-widest">🎹 ROLAND • MISSION CONTROL</div>
            <div className="flex-1"></div>
            <SystemHealthBadge placement="topbar" />
          </div>
          <div className="flex-1 overflow-hidden relative">
            <Workbench />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
