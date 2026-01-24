// frontend/src/components/views/SpectrumModule.tsx
import React, { useState, useMemo } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { ArrowLeft } from 'lucide-react';
import type { Product, Specification } from '../../types';

// Mock Data Hook (Replace with real hook)
import { useCategoryProducts } from '../../hooks/useCategoryProducts'; 

export const SpectrumModule = () => {
  const { activeSubcategoryId, activeFilters, goToGalaxy } = useNavigationStore();
  const { products } = useCategoryProducts(activeSubcategoryId); // Fetch data
  
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Filter Logic (Layer 3)
  const filteredProducts = useMemo(() => {
    if (activeFilter === 'ALL') return products;
    return products.filter(p => p.category === activeFilter || p.tags?.includes(activeFilter));
  }, [products, activeFilter]);

  const getProductImage = (p: Product) => {
    if (p.image_url) return p.image_url;
    if (typeof p.image === 'string') return p.image;
    if (p.images && !Array.isArray(p.images) && p.images.main) return p.images.main;
    return '';
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0c10] text-white overflow-hidden relative">
      
      {/* 1. TOP CONTROL DECK (The 1176 Buttons) */}
      <div className="h-16 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center px-4 gap-4 z-20">
        <button 
          onClick={goToGalaxy}
          className="p-2 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="h-8 w-px bg-zinc-700 mx-2" />

        {/* The 1176 Ratio Button Bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase border rounded transition-all duration-100 ${
              activeFilter === 'ALL' 
                ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                : 'bg-black border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            ALL
          </button>
          
          {activeFilters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase border rounded transition-all duration-100 whitespace-nowrap ${
                activeFilter === filter 
                  ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                  : 'bg-black border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 2. THE INFO SCREENS (Hover Feedback) */}
      <div className="h-48 grid grid-cols-12 gap-1 p-1 bg-zinc-950 border-b border-zinc-800">
        
        {/* Left Screen: Visual */}
        <div className="col-span-3 bg-black border border-zinc-800 rounded relative overflow-hidden group">
          <div className="absolute top-2 left-2 text-[9px] text-zinc-500 font-mono">VISUAL_FEED</div>
          {hoveredProduct ? (
            <img 
              src={getProductImage(hoveredProduct)} 
              className="w-full h-full object-contain p-4 animate-fade-in" 
              alt="Preview" 
            />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-zinc-800 font-mono text-xs">NO SIGNAL</div>
          )}
        </div>

        {/* Center Screen: Data Readout */}
        <div className="col-span-6 bg-black border border-zinc-800 rounded relative p-4 font-mono">
          <div className="text-[9px] text-zinc-500 mb-2">DATA_STREAM</div>
          {hoveredProduct ? (
            <div className="space-y-2 animate-fade-in">
              <h2 className="text-2xl font-bold text-amber-500 truncate">{hoveredProduct.name}</h2>
              <div className="flex gap-4 text-xs text-zinc-300">
                <span className="bg-zinc-900 px-2 py-1 rounded">SKU: {hoveredProduct.sku}</span>
                <span className="bg-zinc-900 px-2 py-1 rounded text-emerald-400">STOCK: {hoveredProduct.availability || 'Unknown'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-zinc-500">
                {hoveredProduct.specs?.slice(0,4).map((s: Specification) => (
                  <div key={s.key} className="flex justify-between border-b border-zinc-900 pb-1">
                    <span>{s.key}</span>
                    <span className="text-zinc-300">{String(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-800 text-xs">
              HOVER_TARGET_NOT_ACQUIRED
            </div>
          )}
        </div>

        {/* Right Screen: Price & Action */}
        <div className="col-span-3 bg-black border border-zinc-800 rounded relative p-4 flex flex-col justify-between font-mono">
           <div className="text-[9px] text-zinc-500">MARKET_VAL</div>
           {hoveredProduct ? (
             <div className="animate-fade-in">
               <div className="text-3xl font-bold text-white mb-2">
                 {hoveredProduct.halilit_price || hoveredProduct.pricing?.regular_price ? 
                   `₪${(hoveredProduct.halilit_price || hoveredProduct.pricing?.regular_price || 0).toLocaleString()}` 
                   : 'N/A'}
               </div>
               <button className="w-full bg-amber-500 text-black font-bold py-2 text-xs hover:bg-amber-400 transition-colors">
                 INITIATE
               </button>
             </div>
           ) : (
             <div className="text-zinc-800 text-4xl font-bold opacity-20">---</div>
           )}
        </div>
      </div>

      {/* 3. THE RACK (Product Grid) */}
      <div className="flex-1 overflow-y-auto p-4 perspective-1000">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group relative aspect-square bg-zinc-900 border border-zinc-800 rounded hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all duration-300 cursor-pointer overflow-hidden"
              onMouseEnter={() => setHoveredProduct(product)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <img 
                src={getProductImage(product)} 
                alt={product.name}
                className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 filter sepia-[0.5] group-hover:sepia-0"
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-3 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="text-amber-500 text-[10px] font-mono mb-1">{product.brand}</div>
                <div className="text-white text-xs font-bold truncate leading-tight">{product.name}</div>
              </div>
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
