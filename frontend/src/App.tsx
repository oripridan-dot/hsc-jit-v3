import { useEffect, useState } from 'react';
import { useWebSocketStore } from './store/useWebSocketStore';
import { useNavigationStore } from './store/navigationStore';
import { catalogLoader, instantSearch, type Product } from './lib';
import { HalileoNavigator } from './components/HalileoNavigator';
import { Workbench } from './components/Workbench';
import { AIAssistant } from './components/AIAssistant';
import { SystemHealthBadge } from './components/SystemHealthBadge';
import { applyBrandTheme } from './styles/brandThemes';
import './index.css';

function App() {
  const { actions } = useWebSocketStore();
  const { selectedProduct } = useNavigationStore();
  const [fullProducts, setFullProducts] = useState<Product[]>([]);
  const [isCatalogReady, setIsCatalogReady] = useState(true); // Start as ready immediately

  useEffect(() => {
    // Apply Roland brand theme
    applyBrandTheme('roland');
    document.body.setAttribute('data-brand', 'roland');
    
    // Try to load catalog in background
    const initCatalog = async () => {
      try {
        console.log('🚀 v3.7: Initializing Mission Control...');
        await instantSearch.initialize();
        // Load products for AI assistant if available
        try {
          const products = await catalogLoader.loadAllProducts();
          setFullProducts(products);
          console.log(`✅ Catalog loaded: ${products.length} products`);
        } catch (e) {
          console.warn('⚠️ Could not load full products list, using static mode', e);
        }
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
      {!isCatalogReady && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-pulse">🌌</div>
            <div className="text-xl font-bold text-cyan-400">Initializing Mission Control</div>
            <div className="text-sm text-slate-500 font-mono">Loading product universe...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
