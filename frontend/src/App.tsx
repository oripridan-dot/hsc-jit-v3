import { useEffect, useState } from 'react';
import { useWebSocketStore } from './store/useWebSocketStore';
import { useNavigationStore } from './store/navigationStore';
import { catalogLoader, instantSearch, type Product } from './lib';
import { HalileoNavigator } from './components/HalileoNavigator';
import { HalileoContextRail } from './components/HalileoContextRail';
import { Workbench } from './components/Workbench';
import { AIAssistant } from './components/AIAssistant';
import { SystemHealthBadge } from './components/SystemHealthBadge';
import { applyBrandTheme } from './styles/brandThemes';
import './index.css';

function App() {
  const { actions } = useWebSocketStore();
  const { selectedProduct } = useNavigationStore();
  const [fullProducts, setFullProducts] = useState<Product[]>([]);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [isCatalogReady, setIsCatalogReady] = useState(false);

  useEffect(() => {
    // Apply Roland brand theme
    applyBrandTheme('roland');
    document.body.setAttribute('data-brand', 'roland');
    
    const initCatalog = async () => {
      try {
        console.log('🚀 v3.7: Initializing Mission Control...');
        await instantSearch.initialize();
        const products = await catalogLoader.loadAllProducts();
        setFullProducts(products);
        setIsCatalogReady(true);
        console.log(`✅ Catalog loaded: ${products.length} products`);
      } catch (error) {
        console.error('❌ Failed to load catalog:', error);
      }
    };
    initCatalog();
  }, []);

  useEffect(() => {
    actions.connect();
  }, [actions]);

  return (
    <div className="flex fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden font-sans selection:bg-cyan-500/30">
      <div className="flex w-full h-full">
        {/* Main Workbench (center/left) */}
        <div className="flex-1 h-full flex flex-col">
          <div className="h-14 border-b border-slate-800/50 flex items-center px-6 gap-4 bg-slate-950/80 backdrop-blur-md z-20 shadow-lg">
            <div className="text-sm font-mono font-bold text-cyan-400 tracking-widest">🎹 ROLAND • MISSION CONTROL</div>
            <div className="flex-1"></div>
            <SystemHealthBadge placement="topbar" />
            <button 
              onClick={() => setAiAssistantOpen(!aiAssistantOpen)} 
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all shadow-md ${
                aiAssistantOpen 
                  ? 'bg-cyan-500/30 text-cyan-300 border-2 border-cyan-400/60 shadow-cyan-500/30' 
                  : 'bg-slate-800/60 text-slate-300 border-2 border-slate-700/60 hover:border-cyan-500/50 hover:text-cyan-400'
              }`}
            >
              🤖 HALILEO
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <Workbench />
            
            {/* Halileo Context Rail - Floating Insights */}
            <HalileoContextRail 
              currentContext={selectedProduct} 
              isVisible={!aiAssistantOpen} 
            />
          </div>
        </div>

        {/* Right Column: Halileo Navigator + Analyst */}
        <div className="w-[360px] h-full border-l border-slate-800/50 bg-slate-950/70 backdrop-blur-md flex flex-col shadow-xl shadow-black/30">
          <div className="flex-1 min-h-0">
            <HalileoNavigator />
          </div>

          {aiAssistantOpen && (
            <div className="h-[45%] border-t border-slate-800/60 bg-slate-950/80">
              <div className="h-12 border-b border-slate-800/60 flex items-center px-4 gap-3">
                <div className="text-[11px] font-mono font-bold text-emerald-400 tracking-wider">ANALYST</div>
                <div className="flex-1" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div className="h-[calc(100%-48px)] overflow-hidden">
                <AIAssistant currentProduct={null} allProducts={fullProducts} isOpen={aiAssistantOpen} onToggle={() => setAiAssistantOpen(!aiAssistantOpen)} />
              </div>
            </div>
          )}
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
