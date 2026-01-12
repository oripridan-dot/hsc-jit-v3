import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useWebSocketStore } from './store/useWebSocketStore';
import { ProductDetailView } from './components/ProductDetailView';
import { ChatView } from './components/ChatView';
import { GhostCard } from './components/GhostCard';
import './index.css';

function App() {
  const { actions, status, predictions, lastPrediction } = useWebSocketStore();
  const [inputText, setInputText] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Connect on mount
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    actions.connect(`${protocol}//${host}/ws`);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    setInputText(txt);
    actions.sendTyping(txt);
  };

  const submitQuery = () => {
    const target = lastPrediction || predictions[0];
    if (!target) return;

    const query = inputText.trim() || target.name || "Details";
    actions.lockAndQuery(target, query, imageData);
    setInputText('');
    setImageData(null);
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

  // Map predictions to Zen Cards format
  const zenResults = useMemo(() => {
    return predictions.map(p => ({
      id: p.id,
      name: p.name,
      image: p.images?.main || p.img || '', // Handle varied schema
      price: (p as any).price || 0, // Should be fetched
      description: (p as any).description || `Professional ${p.brand || ''} gear for serious musicians.`,
      brand: p.brand || 'Music',
      brand_identity: p.brand_identity, // Pass through identity
      production_country: p.production_country,
      category: (p as any).category,
      family: (p as any).family,
      manual_url: (p as any).manual_url,
      score: (p as any).confidence || 0.9,
      specs: (p as any).specs || { "Category": "Instrument", "Type": "Pro Audio" },
      accessories: (p as any).accessories,
      related: (p as any).related,
      full_description: (p as any).full_description
    }));
  }, [predictions]);

  // Effect to fetch prices for results
  useEffect(() => {
    predictions.forEach(p => {
       if (!(p as any).priceFetched) {
           (p as any).priceFetched = true;
           fetch(`/api/price/${encodeURIComponent(p.name)}`)
             .then(r => r.json())
             .then(data => {
                // Ideally update store, but for now we just log/mock
             })
             .catch(() => {});
       }
    });
  }, [predictions]);

  const isChatMode = status === 'LOCKED' || status === 'ANSWERING';
  const showDetail = !isChatMode && status === 'SNIFFING' && zenResults.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
        {/* Ambient Backlight */}
        <div className="fixed inset-0 pointer-events-none z-0">
           <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-gentle" />
           <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-gentle" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
          
          {/* Header */}
          <header className={`flex flex-col items-center justify-center transition-all duration-700 ${isChatMode || showDetail ? 'min-h-[10vh] mb-8' : 'min-h-[30vh]'}`}>
             <div className="text-center space-y-4">
               <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 tracking-tight animate-fade-in-up">
                 HSC JIT v3
               </h1>
               <p className={`text-slate-400 text-sm tracking-widest font-light uppercase transition-opacity duration-500 ${(isChatMode || showDetail) ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>
                 The Zen Search Engine
               </p>
             </div>
          </header>

          {/* Search Bar */}
          <div className={`w-full max-w-2xl mx-auto transition-all duration-500 transform ${isChatMode || showDetail ? 'translate-y-0 scale-95 mb-8' : 'translate-y-0'}`}>
             <div className="relative group z-30">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
                <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl flex items-center">
                   
                   {/* File Input Trigger */}
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="pl-4 pr-2 text-slate-400 hover:text-white transition-colors"
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
                      className="w-full bg-transparent p-6 text-xl text-white placeholder-slate-500 outline-none font-light"
                      placeholder="What are you looking for today?"
                      value={inputText}
                      onChange={handleInput}
                      onKeyDown={handleKeyDown}
                      autoFocus
                   />
                   <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                   />
                </div>
             </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 w-full mx-auto transition-all duration-500 pb-20">
             
             {showDetail && (
               /* Show Solid Product Page for Top Result */
               <ProductDetailView product={zenResults[0]} />
             )}
             
             {isChatMode && (
               <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-1 shadow-2xl backdrop-blur-sm animate-scale-in flex-1 min-h-[600px] max-w-5xl mx-auto">
                  <div className="h-full overflow-hidden rounded-2xl relative">
                     <ChatView />
                  </div>
               </div>
             )}
             
             {/* If multiple results and we want to allow selecting others, 
                 we could list them small below, but user asked for solid page.
                 We stick to the top result detail view. 
             */}
             
             {!isChatMode && !showDetail && zenResults.length === 0 && (
                <div className="text-center text-slate-600 mt-20">
                  <p className="animate-pulse">Start typing to see the magic...</p>
                </div>
             )}

          </main>
          
          <GhostCard />

        </div>
    </div>
  );
}

export default App;
