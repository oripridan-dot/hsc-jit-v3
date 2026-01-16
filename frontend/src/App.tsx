import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useWebSocketStore, type Prediction } from './store/useWebSocketStore';
import { catalogLoader, instantSearch } from './lib';
import { ChatView } from './components/ChatView';
import { BrandExplorer } from './components/BrandExplorer';
import { SystemHealthBadge } from './components/SystemHealthBadge';
import { SyncMonitor } from './components/SyncMonitor';
import { ProductCoverageStats } from './components/ProductCoverageStats';
import { DualSourceIntelligence } from './components/DualSourceIntelligence';
import { ZenFinder } from './components/ZenFinder';
import { FolderView } from './components/FolderView';
import { BackendUnavailable } from './components/BackendUnavailable';
import { buildFileSystem, findPathById, type FileNode } from './utils/zenFileSystem';
import { getBrandColors } from './utils/brandColors';
import './index.css';

function App() {
  const { actions, status, predictions, lastPrediction, connectionState } = useWebSocketStore();
  const [inputText, setInputText] = useState('');
  const [currentFolder, setCurrentFolder] = useState<FileNode | null>(null);
  const [brandExplorerOpen, setBrandExplorerOpen] = useState(false);
  const [syncMonitorOpen, setSyncMonitorOpen] = useState(false);
  const [coverageStatsOpen, setCoverageStatsOpen] = useState(false);
  const [dualSourceOpen, setDualSourceOpen] = useState(false);
  const [fullCatalog, setFullCatalog] = useState<Prediction[]>([]);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const connectionAttemptedRef = useRef(false);

  // v3.6: Load static catalog and initialize search on mount
  useEffect(() => {
    const initCatalog = async () => {
      try {
        console.log('🚀 v3.6: Initializing static catalog...');
        
        // Initialize instant search (loads all products)
        await instantSearch.initialize();
        
        // Get all products for display
        const products = await catalogLoader.loadAllProducts();
        
        // Convert to Prediction format for compatibility
        const catalogProducts: Prediction[] = products.map(p => ({
          name: p.name,
          brand: p.brand,
          category: p.category || 'Uncategorized',
          confidence: p.verification_confidence || 0,
          source: p.verified ? 'halilit' : 'brand',
          image_url: p.image_url,
          brand_product_url: p.brand_product_url || p.detail_url,
          verified: p.verified,
          match_quality: p.match_quality
        }));
        
        setFullCatalog(catalogProducts);
        setBackendAvailable(true);
        console.log(`✅ Catalog loaded: ${products.length} products`);
      } catch (error) {
        console.error('❌ Failed to load catalog:', error);
        setBackendAvailable(false);
      }
    };
    
    initCatalog();
  }, []);

  // Build a consistent tree: use full catalog for browsing, predictions only during active search
  // Default to predictions if fullCatalog hasn't loaded yet
  const displayProducts = inputText.length > 0 ? predictions : (fullCatalog.length > 0 ? fullCatalog : predictions);
  const rootNode = useMemo(() => buildFileSystem(displayProducts), [displayProducts]);

  // --- Brand Styling Logic ---
  const activeBrandColors = useMemo(() => {
     if (!currentFolder) return null;

     // Check if current or any ancestor is a brand
     const path = findPathById(rootNode, currentFolder.id);
     const brandNode = path.find(n => n.type === 'brand');
     
     if (brandNode) {
        return getBrandColors(brandNode.id.replace('brand-', ''));
     }
     return null;
  }, [currentFolder, rootNode]);

  const appStyle = useMemo(() => {
     if (activeBrandColors) {
         return {
             '--accent-primary': activeBrandColors.primary,
             '--accent-secondary': activeBrandColors.secondary,
         } as React.CSSProperties;
     }
     return {};
  }, [activeBrandColors]);

  // Connect on mount and monitor backend availability
  useEffect(() => {
    if (connectionAttemptedRef.current) return;
    connectionAttemptedRef.current = true;
    setConnectionAttempted(true);
    actions.connect(); // Let the store figure out the correct WS URL
  }, [actions]);

  // Monitor connection state changes
  useEffect(() => {
    if (connectionAttemptedRef.current) {
      if (connectionState === 1) {
        setBackendAvailable(true);
      } else if (connectionState === 3) {
        // After first connection attempt fails, mark as unavailable
        const timer = setTimeout(() => setBackendAvailable(false), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [connectionState]);

  // Show backend unavailable screen if connection failed
  if (!backendAvailable && connectionAttempted) {
    return <BackendUnavailable onRetry={() => {
      setBackendAvailable(true);
      setConnectionAttempted(false);
      actions.connect();
    }} />;
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    setInputText(txt);
    
    // v3.6: Use instant search instead of WebSocket
    if (txt.length === 0) {
      actions.reset(); // Reset to default state
    } else if (txt.length >= 2) {
      // Instant search with Fuse.js
      if (instantSearch.isInitialized()) {
        const searchResults = instantSearch.search(txt, { limit: 100 });
        
        // Convert to Prediction format
        const predictions: Prediction[] = searchResults.map(p => ({
          name: p.name,
          brand: p.brand,
          category: p.category || 'Uncategorized',
          confidence: p.verification_confidence || 0,
          source: p.verified ? 'halilit' : 'brand',
          image_url: p.image_url,
          brand_product_url: p.brand_product_url || p.detail_url,
          verified: p.verified,
          match_quality: p.match_quality
        }));
        
        // Update predictions directly (bypass WebSocket)
        actions.setPredictions(predictions);
      }
    }
  };

  const submitQuery = (overrideText?: string) => {
    const text = overrideText || inputText;
    const target = lastPrediction || predictions[0];
    // If we have a specific prediction, lock on it, otherwise just generic search
    const query = text.trim() || (target ? target.name : "Details");
    if (target) {
      actions.lockAndQuery(target, query);
    }
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitQuery();
  };

  // Handle Navigation from ZenFinder
    const handleNavigate = (node: FileNode) => {
      if (node.type === 'file' && node.meta) {
        // It's a file? Open details directly
        const p = node.meta as unknown as Prediction;
        actions.lockAndQuery(p, "Details");
      } else if (node.type === 'root') {
        // Return to welcome state
        setCurrentFolder(null);
      } else {
        // It's a folder/brand/category -> Show folder view
        setCurrentFolder(node);
      }
    };

  // Determine View State
  const isChatMode = status === 'LOCKED' || status === 'ANSWERING';

  return (
    <div className="flex fixed inset-0 bg-bg-base text-text-primary overflow-hidden font-sans selection:bg-accent-primary/30" style={appStyle}>
        
        {/* Brand Ambient Background */}
        <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${activeBrandColors ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-accent-primary/10 rounded-full blur-[150px]" />
            <div className={`absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-accent-secondary/5 rounded-full blur-[150px]`} />
        </div>

        {/* System Health Badge */}
        <SystemHealthBadge />
        
        {/* Explorer Layout: Split Pane with ZenFinder */}
        {/* LEFT: Zen Finder Sidebar */}
        <ZenFinder onNavigate={handleNavigate} searchQuery={inputText} products={displayProducts} />

        {/* RIGHT: Main Stage */}
        <div className="flex-1 flex flex-col min-w-0 relative">
            
            {/* Top Bar: Status & Browse Brands */}
            <div className="h-16 border-b border-white/10 flex items-center px-6 gap-4 bg-bg-base/50 backdrop-blur z-20">
                
                {/* Status Indicator */}
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-text-muted">
                    <span>{status}</span>
                    <div className={`w-2 h-2 rounded-full ${status === 'IDLE' ? 'bg-white/20' : 'bg-accent-success animate-pulse'}`} />
                </div>

                <div className="flex-1"></div>

                {/* Browse Brands Button */}
                <button
                    onClick={() => setBrandExplorerOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-accent-success/20 hover:bg-accent-success/30 text-accent-success text-xs font-semibold transition-colors border border-accent-success/30"
                >
                    🎯 Brands
                </button>
                {/* Coverage Stats Button */}
                <button
                    onClick={() => setCoverageStatsOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-accent-secondary/20 hover:bg-accent-secondary/30 text-accent-secondary text-xs font-semibold transition-colors border border-accent-secondary/30"
                >
                    📊 Coverage
                </button>
                {/* Sync Monitor Button */}
                <button
                    onClick={() => setSyncMonitorOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-semibold transition-colors border border-blue-500/30"
                >
                    🔄 Sync Status
                </button>
                {/* Dual Source Intelligence Button */}
                <button
                    onClick={() => setDualSourceOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-xs font-semibold transition-colors border border-indigo-500/30"
                >
                    🔀 Dual-Source
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                
                {/* A. Chat Overlay */}
                {isChatMode ? (
                   <div className="absolute inset-0 z-50 bg-bg-base/90 backdrop-blur-sm p-8 animate-fade-in">
                      <div className="max-w-5xl mx-auto h-full bg-bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                          <button 
                             onClick={() => actions.reset()} 
                             className="absolute top-4 right-4 z-50 p-2 hover:bg-white/10 rounded-full transition-colors"
                          >
                             ✕
                          </button>
                          <ChatView />
                      </div>
                   </div>
                ) : (
                    /* B. Folder View (Dashboard) */
                    currentFolder ? (
                      <FolderView 
                        node={currentFolder} 
                        onProductSelect={(p) => actions.lockAndQuery(p, "Details", null)} 
                        breadcrumbPath={findPathById(rootNode, currentFolder.id)}
                        onNavigate={handleNavigate}
                      />
                    ) : (
                        /* C. Empty State / Welcome */
                        <div className="h-full flex flex-col items-center justify-center text-text-muted gap-6 p-8">
                            <div className="text-7xl animate-bounce-slow">🌌</div>
                            <div className="text-center space-y-3">
                                <h2 className="text-2xl font-bold text-text-primary">Halilit Smart Catalog v3.6</h2>
                                <p className="text-sm text-accent-primary font-semibold">Static-First Architecture</p>
                                <p className="text-text-muted max-w-md">
                                    {predictions.length === 0 ? (
                                        <>Loading catalog... <span className="animate-pulse">●</span></>
                                    ) : (
                                        `Explore ${displayProducts.length.toLocaleString()} products across ${rootNode.children?.[0]?.children?.length || 0} brands`
                                    )}
                                </p>
                                
                                {/* Quick Stats */}
                                {predictions.length > 0 && (
                                    <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl">
                                        <button
                                            onClick={() => setCoverageStatsOpen(true)}
                                            className="bg-bg-surface/50 border border-border-subtle rounded-xl p-6 hover:border-accent-primary/50 transition-all group cursor-pointer"
                                        >
                                            <div className="text-4xl mb-2">📦</div>
                                            <div className="text-3xl font-bold text-status-success mb-1 group-hover:scale-110 transition-transform">
                                                {displayProducts.length.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-text-muted uppercase tracking-wider">Products</div>
                                        </button>
                                        
                                        <button
                                            onClick={() => setBrandExplorerOpen(true)}
                                            className="bg-bg-surface/50 border border-border-subtle rounded-xl p-6 hover:border-accent-primary/50 transition-all group cursor-pointer"
                                        >
                                            <div className="text-4xl mb-2">🏢</div>
                                            <div className="text-3xl font-bold text-accent-primary mb-1 group-hover:scale-110 transition-transform">
                                                {rootNode.children?.[0]?.children?.length || 0}
                                            </div>
                                            <div className="text-xs text-text-muted uppercase tracking-wider">Brands</div>
                                        </button>
                                        
                                        <button
                                            onClick={() => setCoverageStatsOpen(true)}
                                            className="bg-bg-surface/50 border border-border-subtle rounded-xl p-6 hover:border-accent-primary/50 transition-all group cursor-pointer"
                                        >
                                            <div className="text-4xl mb-2">📊</div>
                                            <div className="text-3xl font-bold text-accent-secondary mb-1 group-hover:scale-110 transition-transform">
                                                {Math.round(displayProducts.length / (rootNode.children?.[0]?.children?.length || 1))}
                                            </div>
                                            <div className="text-xs text-text-muted uppercase tracking-wider">Avg/Brand</div>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {predictions.length > 0 && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const brandsFolder = document.querySelector('[data-folder="brands-root"]');
                                            if (brandsFolder) (brandsFolder as HTMLElement).click();
                                        }}
                                        className="px-6 py-3 bg-accent-primary hover:bg-opacity-80 text-black rounded-xl font-semibold transition-all shadow-lg shadow-accent-primary/30"
                                    >
                                        Browse Brands
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                )}
                
            </div>
            
            {/* Bottom Search Bar */}
            <div className="border-t border-white/10 p-4 bg-bg-base/50 backdrop-blur">
                <input 
                    className="w-full bg-bg-surface/50 border border-white/5 rounded-full py-3 px-6 text-sm focus:outline-none focus:border-accent-primary/50 focus:bg-bg-surface transition-all placeholder-text-dimmed"
                    placeholder="Type to search products..." 
                    value={inputText} 
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            </div>
        </div>

        {/* Brand Explorer Modal */}
        {/* Sync Monitor Modal */}
        {syncMonitorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <button
                  onClick={() => setSyncMonitorOpen(false)}
                  className="absolute -top-2 -right-2 z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-white border border-gray-600"
                >
                  ✕
                </button>
                <SyncMonitor />
              </div>
            </div>
          </div>
        )}

        <BrandExplorer 
          isOpen={brandExplorerOpen} 
          onClose={() => setBrandExplorerOpen(false)}
          onBrandSelect={(brand) => {
            console.log('Selected brand:', brand);
          }}
        />
        <ProductCoverageStats isOpen={coverageStatsOpen} onClose={() => setCoverageStatsOpen(false)} />
        <DualSourceIntelligence isOpen={dualSourceOpen} onClose={() => setDualSourceOpen(false)} />

    </div>
  );
}

export default App;
