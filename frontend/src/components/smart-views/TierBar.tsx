import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../../types'; //
import { useNavigationStore } from '../../store/navigationStore';
import { brandThemes } from '../../styles/brandThemes'; //

interface TierBarProps {
  products: Product[];
  title?: string;
  showBrandBadges?: boolean;
}

export const TierBar: React.FC<TierBarProps> = ({ 
  products,
  title = "Market Landscape",
  showBrandBadges = true
}) => {
  const { selectProduct } = useNavigationStore();

  // 1. Unified Calculation: Works for 1 brand or 10 brands simultaneously
  const { minPrice, maxPrice, sortedProducts } = useMemo(() => {
    // Filter out "Call for Price" items (0 price)
    const valid = products.filter(p => (p.pricing?.regular_price || 0) > 0);
    
    if (valid.length === 0) return { minPrice: 0, maxPrice: 100, sortedProducts: [] };

    const prices = valid.map(p => p.pricing!.regular_price!);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Add 10% buffer to edges so items aren't glued to the wall
    return {
      minPrice: min * 0.9, 
      maxPrice: max * 1.1,
      sortedProducts: valid.sort((a, b) => a.pricing!.regular_price! - b.pricing!.regular_price!)
    };
  }, [products]);

  // 2. The Scope Slider (Percentage based)
  const [range, setRange] = useState<[number, number]>([0, 100]);

  return (
    <div className="w-full h-full flex flex-col p-8 bg-[var(--bg-app)] text-[var(--text-primary)] relative overflow-hidden transition-colors duration-500">
      
      {/* HEADER: Contextual Title */}
      <div className="z-10 mb-12 flex justify-between items-end">
        <div>
          <div className="text-[10px] font-mono text-[var(--brand-primary)] uppercase tracking-widest mb-2">
            Analytics View
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">{title}</h2>
          <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-sm mt-1">
             <span>Scope: ₪{Math.round(minPrice)} - ₪{Math.round(maxPrice)}</span>
             <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full"/>
             <span>{sortedProducts.length} Results</span>
          </div>
        </div>
      </div>

      {/* THE TIER STAGE */}
      <div className="flex-1 relative border-b border-[var(--border-subtle)] mb-8">
        <AnimatePresence>
          {sortedProducts.map((product) => {
            const price = product.pricing?.regular_price || 0;
            const positionPercent = ((price - minPrice) / (maxPrice - minPrice)) * 100;
            
            // Is it within the user's "Scope"?
            const isVisible = positionPercent >= range[0] && positionPercent <= range[1];
            
            // 🎨 Cross-Brand Styling Logic
            const brandKey = product.brand.toLowerCase();
            const brandColor = brandThemes[brandKey]?.colors?.primary || '#ffffff';

            return (
              <motion.button
                layout
                key={product.id}
                onClick={() => selectProduct(product)}
                initial={{ opacity: 0, scale: 0, y: 50 }}
                animate={{ 
                  opacity: isVisible ? 1 : 0.1, 
                  scale: isVisible ? 1 : 0.6,
                  filter: isVisible ? 'grayscale(0%)' : 'grayscale(100%)',
                  left: `${positionPercent}%` 
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute bottom-0 transform -translate-x-1/2 group flex flex-col items-center gap-3 pb-8 z-10 hover:z-50"
              >
                {/* PRODUCT CARD */}
                <div 
                  className="relative w-24 h-24 bg-[var(--bg-panel)] rounded-xl shadow-2xl p-2 transition-all duration-300 group-hover:-translate-y-4 group-hover:scale-110"
                  style={{ 
                    border: `1px solid ${isVisible ? brandColor : 'var(--border-subtle)'}`,
                    boxShadow: isVisible ? `0 10px 30px -10px ${brandColor}40` : 'none'
                  }}
                >
                   {/* Contextual Thumbnail */}
                   <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-contain" 
                   />

                   {/* Brand Badge (Top Right) */}
                   {showBrandBadges && (
                      <div 
                          className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-black"
                          style={{ backgroundColor: brandColor }}
                      >
                          {product.brand}
                      </div>
                   )}
                </div>

                {/* INFO & PRICE LINE */}
                <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-[var(--text-secondary)] max-w-[100px] truncate">{product.name}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: brandColor }}>
                        ₪{price.toLocaleString()}
                    </span>
                </div>

                {/* Connector Line to Axis */}
                <div className="absolute bottom-0 w-px h-8 bg-[var(--border-subtle)] group-hover:bg-[var(--text-primary)] transition-colors" />

                {/* Axis Label - Processed Thumbnail on Axis */}
                <div className="absolute -bottom-10 flex flex-col items-center">
                   <div className="w-6 h-6 rounded-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden mb-1 shadow-sm">
                      <img src={product.images?.thumbnail || product.image_url} className="w-4 h-4 object-contain opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                   </div>
                </div>

              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* INTERACTIVE SCOPE BAR */}
      <div className="h-16 relative px-4 select-none">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
           {/* Active Range Fill */}
           <div 
             className="absolute h-full bg-[var(--brand-primary)]"
             style={{ left: `${range[0]}%`, right: `${100 - range[1]}%` }}
           />
        </div>

        {/* Hidden Inputs for Logic */}
        <input 
          type="range" min="0" max="100" value={range[0]}
          onChange={(e) => {
             const val = Number(e.target.value);
             if (val < range[1] - 5) setRange([val, range[1]]);
          }}
          className="absolute top-1/2 left-0 w-full opacity-0 cursor-ew-resize z-20 h-8"
        />
        <input 
          type="range" min="0" max="100" value={range[1]}
          onChange={(e) => {
             const val = Number(e.target.value);
             if (val > range[0] + 5) setRange([range[0], val]);
          }}
          className="absolute top-1/2 left-0 w-full opacity-0 cursor-ew-resize z-20 h-8"
        />

        {/* Visual Handles */}
        <div 
          className="absolute top-1/2 -mt-3 w-6 h-6 bg-indigo-500 rounded-full border-4 border-[#0a0a0a] shadow-lg pointer-events-none transition-all"
          style={{ left: `${range[0]}%` }}
        />
        <div 
          className="absolute top-1/2 -mt-3 w-6 h-6 bg-indigo-500 rounded-full border-4 border-[#0a0a0a] shadow-lg pointer-events-none transition-all"
          style={{ left: `${range[1]}%` }}
        />
        
        {/* Legend */}
        <div className="absolute -bottom-2 w-full flex justify-between text-[10px] font-mono text-white/30 uppercase">
           <span>Entry Level</span>
           <span>Mid Range</span>
           <span>Professional</span>
           <span>Flagship</span>
        </div>
      </div>
    </div>
  );
};
