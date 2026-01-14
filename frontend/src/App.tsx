import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useWebSocketStore, type Prediction } from './store/useWebSocketStore';
import { ChatView } from './components/ChatView';
import { BrandExplorer } from './components/BrandExplorer';
import { SystemHealthBadge } from './components/SystemHealthBadge';
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
  const [fullCatalog, setFullCatalog] = useState<Prediction[]>([]);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const connectionAttemptedRef = useRef(false);

  // Hydrate full catalog on mount
  useEffect(() => {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
            if (data.products) setFullCatalog(data.products);
        })
        .catch(console.error);
  }, []);

  // Build a consistent tree: use full catalog when idle, predictions when searching
  const displayProducts = (inputText.length === 0 && status === 'IDLE') ? fullCatalog : predictions;
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

  // Load initial catalog sample once when predictions are empty
  useEffect(() => {
    if (predictions.length === 0 && backendAvailable) {
      const t = setTimeout(() => {
        actions.sendTyping('');
      }, 500);
      return () => clearTimeout(t);
    }
  }, [predictions.length, actions, backendAvailable]);

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
    // Show default state (empty predictions, no browse mode) when textbox is empty
    if (txt.length === 0) {
        actions.reset(); // Reset to default state
    } else if (txt.length > 2) {
        actions.sendTyping(txt);
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
                                <h2 className="text-2xl font-bold text-text-primary">Halilit Smart Catalog v3.4</h2>
                                <p className="text-sm text-accent-primary font-semibold">Unified Router Architecture</p>
                                <p className="text-text-muted max-w-md">
                                    {predictions.length === 0 ? (
                                        <>Loading catalog... <span className="animate-pulse">●</span></>
                                    ) : (
                                        'Select a brand or category from the sidebar to begin exploring'
                                    )}
                                </p>
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
        <BrandExplorer 
          isOpen={brandExplorerOpen} 
          onClose={() => setBrandExplorerOpen(false)}
          onBrandSelect={(brand) => {
            console.log('Selected brand:', brand);
          }}
        />

    </div>
  );
}

export default App;
