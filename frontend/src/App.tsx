import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useWebSocketStore } from './store/useWebSocketStore';
import { ProductDetailView } from './components/ProductDetailView';
import { ChatView } from './components/ChatView';
import { BrandCard } from './components/BrandCard';
import { BrandExplorer } from './components/BrandExplorer';
import { ZenFinder } from './components/ZenFinder';
import { FolderView } from './components/FolderView';
import { buildFileSystem, findPathById, type FileNode } from './utils/zenFileSystem';
import './index.css';

// --- Discovery Components ---
type CardProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  description: string;
  brand: string;
  brand_identity?: { logo_url: string; hq: string; name: string; website?: string };
  production_country?: string;
  category?: string;
  manual_url?: string;
  score: number;
  specs: Record<string, string | number>;
};

const PredictiveCardGrid: React.FC<{
  items: CardProduct[];
  isLoading: boolean;
  onPreview: (item: CardProduct) => void;
  onLock: (item: CardProduct) => void;
}> = ({ items, isLoading, onPreview, onLock }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="relative group bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/30 hover:shadow-blue-900/30 transition-all duration-300"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-70" />
            <div className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/30">
              {Math.round(item.score * 100)}%
            </div>

            <div className="w-full h-56 bg-slate-950/80 flex items-center justify-center overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 p-3" />
              ) : (
                <div className="text-slate-600 text-sm">No image</div>
              )}
            </div>

            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {item.brand_identity && item.brand_identity.logo_url && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
                    <div className="w-4 h-4 rounded bg-white/90 p-0.5 flex items-center justify-center">
                      <img src={item.brand_identity.logo_url} alt={item.brand} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-slate-200 text-[10px] font-semibold uppercase tracking-wider">
                      {item.brand}
                    </span>
                  </div>
                )}
                {!item.brand_identity && item.brand && (
                  <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-[10px] font-semibold uppercase tracking-wider">
                    {item.brand}
                  </span>
                )}
                {item.category && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-200 text-[10px] font-semibold uppercase tracking-wide border border-blue-500/30">
                    {item.category}
                  </span>
                )}
                {item.production_country && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 text-xs font-medium border border-emerald-500/30">
                    {item.production_country}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">{item.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{item.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="font-semibold text-white text-sm">{item.price ? `$${item.price.toLocaleString()}` : 'POA'}</div>
                <div className="text-[10px] text-slate-500">{Object.keys(item.specs || {}).length} specs</div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onPreview(item)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => onLock(item)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition"
                >
                  Ask AI
                </button>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="col-span-full grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const { actions, status, predictions, lastPrediction } = useWebSocketStore();
  const [inputText, setInputText] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [browseMode, setBrowseMode] = useState<string | null>(null); // 'category' | 'brand' | null
  const [focusProduct, setFocusProduct] = useState<CardProduct | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FileNode | null>(null);
  const [viewMode, setViewMode] = useState<'explorer' | 'cards'>('explorer'); // Start in explorer mode by default
  const [brandExplorerOpen, setBrandExplorerOpen] = useState(false);

  // Build a consistent tree for breadcrumbs and navigation context
  const rootNode = useMemo(() => buildFileSystem(predictions), [predictions]);

  // Connect on mount and load ALL brands into finder
  useEffect(() => {
    actions.connect(); // Let the store figure out the correct WS URL
    
    // Load initial catalog - send empty string to get random sample
    // This will populate the finder with diverse brands
    setTimeout(() => {
      if (predictions.length === 0) {
        actions.sendTyping(''); // Empty search returns random catalog sample
      }
    }, 500);
  }, [actions]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    setInputText(txt);
    // Show default state (empty predictions, no browse mode) when textbox is empty
    if (txt.length === 0) {
        setBrowseMode(null);
        actions.reset(); // Reset to default state
    } else if (txt.length > 2) {
        setBrowseMode(null); // Clear browse mode if typing
        actions.sendTyping(txt);
    }
  };

  const submitQuery = (overrideText?: string) => {
    const text = overrideText || inputText;
    const target = lastPrediction || predictions[0];
    // If we have a specific prediction, lock on it, otherwise just generic search
    const query = text.trim() || (target ? target.name : "Details");
    actions.lockAndQuery(target || { name: query }, query, imageData);
    setInputText('');
    setImageData(null);
    setBrowseMode(null);
  };

  const lockProduct = (item: CardProduct, queryText?: string) => {
    const query = (queryText || inputText || item.name || '').trim() || item.name;
    actions.lockAndQuery(item as any, query, imageData);
    setInputText('');
    setImageData(null);
    setBrowseMode(null);
    setFocusProduct(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitQuery();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Navigation from ZenFinder
    const handleNavigate = (node: FileNode) => {
      if (node.type === 'file' && node.meta) {
        // It's a file? Open details directly
        actions.lockAndQuery((node.meta as unknown) as any, "Details", null);
      } else if (node.type === 'root') {
        // Return to welcome state
        setCurrentFolder(null);
        setViewMode('explorer');
      } else {
        // It's a folder/brand/category -> Show folder view
        setCurrentFolder(node);
        setViewMode('explorer');
      }
    };

  // Map predictions to Zen Cards format
  const zenResults = useMemo(() => {
    return predictions.map(p => {
      let score = (p as any).confidence ?? 0.9;
      if (score > 1) score = Math.min(1, score / 100);
      score = Math.max(0, Math.min(1, score));

      return {
        id: p.id,
        name: p.name,
        image: p.images?.main || (p as any).img || '',
        price: (p as any).price || 0,
        description: (p as any).description || `Professional ${p.brand || ''} gear.`,
        brand: p.brand || 'Music',
        brand_identity: p.brand_identity,
        production_country: p.production_country,
        category: (p as any).category,
        family: (p as any).family,
        manual_url: (p as any).manual_url,
        score,
        specs: (p as any).specs || {},
        accessories: (p as any).accessories,
        related: (p as any).related,
        full_description: (p as any).full_description
      } as CardProduct;
    });
  }, [predictions]);

  // Determine View State
  const isChatMode = status === 'LOCKED' || status === 'ANSWERING';
  const showDiscovery = !isChatMode && zenResults.length === 0 && inputText.length === 0;
  const showCards = !isChatMode && zenResults.length > 0;
  const showDetail = !isChatMode && !!focusProduct;

  const predictiveStatus = useMemo(() => {
    if (isChatMode) return 'Engaged with AI';
    if (status === 'SNIFFING') return 'Predicting best matches';
    return 'Ready to assist';
  }, [status, isChatMode]);

  // Auto-preview highest confidence single result to reduce cognition latency
  useEffect(() => {
    if (!isChatMode && status === 'SNIFFING' && zenResults.length === 1 && zenResults[0].score >= 0.9) {
      setFocusProduct(zenResults[0]);
    }
  }, [isChatMode, status, zenResults]);

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30">
        
        {/* Explorer Mode: Split Pane with ZenFinder */}
        {viewMode === 'explorer' && (
            <>
                {/* LEFT: Zen Finder Sidebar */}
                <ZenFinder onNavigate={handleNavigate} searchQuery={inputText} />

                {/* RIGHT: Main Stage */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    
                    {/* Top Bar: Status & View Switcher Only */}
                    <div className="h-16 border-b border-slate-800/50 flex items-center px-6 gap-4 bg-slate-950/50 backdrop-blur z-20">
                        
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                            <span>{status}</span>
                            <div className={`w-2 h-2 rounded-full ${status === 'IDLE' ? 'bg-slate-600' : 'bg-green-500 animate-pulse'}`} />
                        </div>

                        <div className="flex-1"></div>

                        {/* Browse Brands Button */}
                        <button
                            onClick={() => setBrandExplorerOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold transition-colors border border-emerald-500/30"
                        >
                            🎯 Brands
                        </button>

                        {/* Switch to Card View */}
                        <button
                            onClick={() => setViewMode('cards')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                        >
                            Cards
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-hidden relative">
                        
                        {/* A. Chat/Detail Overlay */}
                        {isChatMode ? (
                           <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-8 animate-fade-in">
                              <div className="max-w-5xl mx-auto h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
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
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 p-8">
                                    <div className="text-7xl animate-bounce-slow">🌌</div>
                                    <div className="text-center space-y-3">
                                        <h2 className="text-2xl font-bold text-white">Welcome to Halilit Explorer</h2>
                                        <p className="text-slate-500 max-w-md">
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
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
                                            >
                                                Browse Brands
                                            </button>
                                            <button
                                                onClick={() => setViewMode('cards')}
                                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors"
                                            >
                                                View as Cards
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                        
                    </div>
                    
                    {/* Bottom Search Bar */}
                    <div className="border-t border-slate-800/50 p-4 bg-slate-950/50 backdrop-blur">
                        <input 
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-3 px-6 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all placeholder-slate-600"
                            placeholder="Type to search products..." 
                            value={inputText} 
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                </div>
            </>
        )}

        {/* Card Mode: Original Layout */}
        {viewMode === 'cards' && (
            <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-x-hidden w-full">
                {/* Ambient Backlight */}
                <div className="fixed inset-0 pointer-events-none z-0">
                   <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-gentle" />
                   <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-gentle" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
                  
                  {/* Header */}
                  <header className={`flex flex-col items-center justify-center transition-all duration-700 ${!showDiscovery ? 'min-h-[10vh] mb-8' : 'min-h-[25vh]'}`}>
                     <div className="text-center space-y-4 cursor-pointer" onClick={() => { setInputText(''); setBrowseMode(null); actions.reset(); }}>
                       <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 tracking-tight">
                         HSC JIT v3
                       </h1>
                       <p className={`text-slate-400 text-sm tracking-widest font-light uppercase transition-opacity duration-500 ${!showDiscovery ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>
                         Halilit Smart Catalog
                       </p>
                     </div>
                  </header>

                  {/* Main Content Area */}
                  <main className="flex-1 w-full mx-auto transition-all duration-500 mb-32">
                     {/* PREDICTIVE CARD GRID */}
                     {showCards && (
                       <div className="max-w-6xl mx-auto space-y-4 animate-fade-in-up">
                         <div className="flex items-center justify-between flex-wrap gap-3">
                           <div>
                             <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Psychic Deck</p>
                             <h2 className="text-2xl font-bold text-white">{browseMode ? `Browsing: ${browseMode}` : 'Adaptive cards'}</h2>
                             <p className="text-sm text-slate-400">{predictiveStatus}</p>
                           </div>
                           <div className="text-xs text-slate-500 bg-slate-900/70 px-3 py-2 rounded-full border border-slate-800">
                             {zenResults.length} candidates · latency-tuned rendering
                           </div>
                           
                           {/* Switch to Explorer View */}
                           <button
                               onClick={() => setViewMode('explorer')}
                               className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                           >
                               Explore
                           </button>
                         </div>

                         <PredictiveCardGrid
                           items={zenResults}
                           isLoading={status === 'SNIFFING'}
                           onPreview={(item) => setFocusProduct(item)}
                           onLock={(item) => lockProduct(item, item.name)}
                         />
                       </div>
                     )}

                     {/* PRODUCT DETAIL OVERLAY */}
                     {showDetail && focusProduct && (
                       <ProductDetailView product={focusProduct!} onClose={() => setFocusProduct(null)} />
                     )}
                     
                     {/* CHAT MODE */}
                     {isChatMode && (
                       <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-1 shadow-2xl backdrop-blur-sm animate-scale-in flex-1 min-h-[600px] max-w-5xl mx-auto">
                          <div className="h-full overflow-hidden rounded-2xl relative">
                             <ChatView />
                          </div>
                       </div>
                     )}

                  </main>
                  
                  {/* Bottom Search Bar */}
                  <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-8 pb-6">
                    <div className="container mx-auto px-4">
                      <div className="w-full max-w-4xl mx-auto">

                        {/* Search Status - shows default state when empty */}
                        {inputText.length === 0 && (
                          <div className="text-center mb-3 text-sm text-slate-500 uppercase tracking-widest">
                            🌌 Default State • Ready to assist
                          </div>
                        )}

                        {/* Search Input */}
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
                          <div className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl flex items-center">
                            
                            {/* File Input */}
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 text-slate-400 hover:text-white transition-colors"
                              title="Search with Image"
                            >
                              {imageData ? (
                                <div className="w-8 h-8 rounded overflow-hidden border border-blue-500">
                                  <img src={imageData} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                            
                            <input
                              type="text"
                              className="flex-1 bg-transparent p-4 text-lg text-white placeholder-slate-500 outline-none font-light"
                              placeholder="Search brands, gear, or categories..."
                              value={inputText}
                              onChange={handleInput}
                              onKeyDown={handleKeyDown}
                            />
                            
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                            
                            {/* Send Button */}
                            <button
                              onClick={() => submitQuery()}
                              className="px-4 py-2 m-2 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 rounded-xl text-white transition-all"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <BrandCard />
                  
                  {/* Brand Explorer Modal */}
                  <BrandExplorer 
                    isOpen={brandExplorerOpen} 
                    onClose={() => setBrandExplorerOpen(false)}
                    onBrandSelect={(brand) => {
                      // Navigate to the brand folder
                      // This would be implemented in ZenFinder
                      console.log('Selected brand:', brand);
                    }}
                  />

                </div>
            </div>
        )}

    </div>
  );
}

export default App;
