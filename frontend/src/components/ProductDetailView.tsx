import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfidenceMeter } from './ui/ConfidenceMeter';
import { PriceDisplay } from './ui/PriceDisplay';
import { Dock } from './ui/Dock';

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    description: string;
    brand: string;
    brand_identity?: {
       logo_url: string;
       hq: string; // Brand Location
       name: string;
       website?: string;
    };
    production_country?: string; // Product Location
    category?: string;
    family?: string;
    manual_url?: string;
    score: number;
    specs: Record<string, string | number>;
    accessories?: any[]; // Placeholder
    related?: any[];
    full_description?: string; // If available, else use description
  };
  onClose?: () => void;
}

export const ProductDetailView: React.FC<ProductDetailProps> = ({ product, onClose }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const dockItems = [
    {
      label: "Official Manual",
      icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      href: product.manual_url,
    },
    {
       label: "Brand Website",
       icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
       href: product.brand_identity?.website || `https://www.google.com/search?q=${product.brand}`,
    },
    {
       label: "Support",
       icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
       href: "#support", // Placeholder
    },
  ];

  // Placeholder accessories if none provided
  const accessories = product.accessories?.length ? product.accessories : [
     { name: "Power Cable", match: 99, img: "" },
     { name: "Dust Cover", match: 85, img: "" },
     { name: "Pro Bag", match: 70, img: "" },
     { name: "Stand", match: 60, img: "" },
     { name: "Pedal", match: 95, img: "" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden font-sans text-slate-200">
      
      {/* =========================================================================
          TOP BAR
          Logo, Name, Desc, Family, Locations | Price
      ========================================================================= */}
      <header className="flex-none bg-slate-900/40 backdrop-blur-md border-b border-white/5 p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 z-20">
         
         <div className="flex items-start gap-6">
            {/* Logo Block */}
            <div className="flex-none hidden md:block">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-2xl shadow-black/50">
                {product.brand_identity?.logo_url ? (
                  <img src={product.brand_identity.logo_url} alt={product.brand} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-black text-black">{product.brand[0]}</span>
                )}
              </div>
              <div className="text-center mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">{product.brand}</div>
            </div>

            {/* Info Block */}
            <div className="space-y-2 mt-1">
               <div className="flex flex-wrap items-baseline gap-3">
                 <h1 className="text-3xl lg:text-5xl font-bold text-white tracking-tight leading-none">{product.name}</h1>
                 <div className="flex items-center gap-2">
                   {product.category && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs font-medium uppercase tracking-wider">{product.category}</span>}
                   {product.family && <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-medium uppercase tracking-wider">{product.family}</span>}
                 </div>
               </div>
               
               <p className="text-lg text-slate-300 font-light max-w-2xl leading-snug">
                 {product.description}
               </p>

               <div className="flex items-center gap-6 pt-2">
                  {product.brand_identity?.hq && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                       <span className="text-xl">🏢</span>
                       <span>HQ: <span className="text-slate-200 font-medium">{product.brand_identity.hq}</span></span>
                    </div>
                  )}
                  {product.production_country && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                       <span className="text-xl">🏭</span>
                       <span>Made in: <span className="text-slate-200 font-medium">{product.production_country}</span></span>
                    </div>
                  )}
               </div>
            </div>
         </div>

         {/* Price Block */}
         <div className="flex-none text-right min-w-[200px]">
            <PriceDisplay price={product.price} />
            <div className="mt-2 flex justify-end">
               <ConfidenceMeter score={product.score} compact />
            </div>
         </div>

      </header>


      {/* =========================================================================
          MAIN STAGE
          Left: Visuals | Right: Info
      ========================================================================= */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
         
         {/* LEFT PANE: Visuals */}
         <div className="flex-1 lg:flex-[1.4] bg-gradient-to-br from-slate-900 via-[#0B1120] to-black relative flex items-center justify-center p-8 group overflow-hidden">
            {/* Background blobs for mood */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen" />

            <div className="relative w-full h-full flex items-center justify-center">
                 <motion.img 
                   src={product.image} 
                   alt={product.name}
                   layoutId={`product-image-${product.id}`}
                   className="max-w-[85%] max-h-[75%] object-contain drop-shadow-2xl cursor-zoom-in hover:scale-105 transition-transform duration-500 ease-out z-10"
                   onClick={() => setIsZoomed(true)}
                 />
                 <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-widest uppercase pointer-events-none">
                    High Resolution Image • Tap to Inspect
                 </div>
            </div>
         </div>


         {/* RIGHT PANE: Info Panel */}
         <div className="flex-1 lg:flex-1 bg-slate-900/30 backdrop-blur-xl border-l border-white/5 overflow-y-auto custom-scrollbar p-8 pb-32">
            
            {/* H2 Most Important Info */}
            <section className="mb-8">
               <h2 className="text-base font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                 Core Specifications
               </h2>
               <div className="grid grid-cols-2 gap-3">
                  {Object.entries(product.specs).slice(0, 6).map(([key, val]) => (
                    <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                       <div className="text-slate-500 text-xs uppercase font-semibold mb-1">{key.replace(/_/g, ' ')}</div>
                       <div className="text-slate-200 font-medium truncate" title={String(val)}>{val}</div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Foldable Full Description */}
            <section className="mb-8 border-t border-white/5 pt-6">
               <button 
                 onClick={() => setDescExpanded(!descExpanded)}
                 className="w-full flex items-center justify-between text-left group"
               >
                 <h2 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                   In-Depth Analysis
                 </h2>
                 <span className={`text-slate-500 transition-transform duration-300 ${descExpanded ? 'rotate-180' : ''}`}>▼</span>
               </button>
               
               <AnimatePresence>
                 {(descExpanded || product.full_description) && (
                   <motion.div 
                     initial={false}
                     animate={{ height: descExpanded ? 'auto' : '100px', opacity: 1 }}
                     className="relative overflow-hidden mt-4"
                   >
                     <div className="prose prose-invert prose-sm text-slate-400 leading-relaxed font-light">
                        {product.full_description || product.description}
                        <br/><br/>
                        <p>Detailed technical architecture and design philosophy...</p>
                     </div>
                     {!descExpanded && (
                       <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
               {!descExpanded && (
                  <button onClick={() => setDescExpanded(true)} className="text-blue-400 text-xs mt-2 hover:underline uppercase tracking-wide">Read full analysis</button>
               )}
            </section>


            {/* Accessories / Related (Swipe) */}
            <section className="mb-8 border-t border-white/5 pt-6">
                <h2 className="text-base font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                   Ecosystem & Accessories
                </h2>
                
                <div className="flex overflow-x-auto gap-4 pb-4 -mx-2 px-2 snap-x hide-scrollbar">
                   {accessories.map((item, i) => (
                     <div key={i} className="flex-none w-48 bg-black/20 rounded-xl p-3 border border-white/5 snap-center hover:bg-white/5 transition cursor-pointer group">
                        <div className="aspect-video bg-slate-800 rounded-lg mb-3 overflow-hidden relative">
                           {/* Placeholder Img */}
                           <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 group-hover:scale-110 transition-transform duration-500"></div>
                           <div className="absolute bottom-1 right-1 bg-green-500/20 text-green-300 text-[10px] font-bold px-1.5 rounded backdrop-blur">
                             {item.match || 90}% MATCH
                           </div>
                        </div>
                        <div className="font-bold text-slate-200 text-sm truncate">{item.name || `Accessory ${i+1}`}</div>
                        <div className="text-xs text-slate-500 flex justify-between">
                            <span>Official Part</span>
                            <span>$??</span>
                        </div>
                     </div>
                   ))}
                </div>
            </section>

         </div>

      </div>


      {/* =========================================================================
          DOCK OVERLAY
      ========================================================================= */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
         <Dock items={dockItems} />
      </div>

      {/* Close Button (Absolute Top Right) */}
      {onClose && (
        <button onClick={onClose} className="fixed top-6 right-6 z-50 p-2 bg-black/20 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-400 backdrop-blur transition-colors border border-white/5">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}


      {/* =========================================================================
          ZOOM MODAL
      ========================================================================= */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
             <motion.img 
               src={product.image} 
               layoutId={`product-image-${product.id}`}
               className="max-w-full max-h-full object-contain shadow-2xl"
             />
             <div className="absolute top-8 left-8 text-white text-xl font-bold font-mono">{product.name}</div>
             <div className="absolute top-8 right-8 text-white/50 text-xs border border-white/20 px-3 py-1 rounded-full uppercase tracking-widest">
               ESC to Close
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};
