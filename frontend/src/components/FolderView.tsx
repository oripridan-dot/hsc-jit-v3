import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getBrandColors } from '../utils/brandColors';
import { getCountryFlag } from '../utils/countryFlags';
import { DualSourceBadge } from './ui/DualSourceBadge';
import { getProductClassification } from '../utils/productClassification';
import type { FileNode } from '../utils/zenFileSystem';
import type { Prediction } from '../store/useWebSocketStore';

interface FolderViewProps {
    node: FileNode;
    onProductSelect: (p: Prediction) => void;
    breadcrumbPath: FileNode[];
    onNavigate: (node: FileNode) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({ node, onProductSelect, breadcrumbPath, onNavigate }) => {
  const isBrand = node.type === 'brand';
  const items = node.items || [];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get categories from brand identity (brand website categories, not Halilit)
  const categories = useMemo(() => {
    if (isBrand && node.brandIdentity?.categories) {
      // Use categories from brand identity (from brand website)
      return Array.isArray(node.brandIdentity.categories) 
        ? node.brandIdentity.categories 
        : [];
    }
    
    // Fallback: extract from products (for compatibility)
    const cats = new Set<string>();
    items.forEach(item => {
      const cat = (item as any).category as string | undefined;
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [items, isBrand, node.brandIdentity]);
  
  // Filter items by selected category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return items;
    return items.filter(item => (item as any).category === selectedCategory);
  }, [items, selectedCategory]);

  // Brand World Theme
  const brandColors = isBrand ? getBrandColors(node.id.replace('brand-', '')) : null;
  const style = brandColors ? {
      '--accent-primary': brandColors.primary,
      '--accent-secondary': brandColors.secondary,
  } as React.CSSProperties : undefined;

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden relative" style={style}>
        {/* Dynamic Background Watermark */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-accent-primary/10 to-transparent rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

        {/* 0. Breadcrumbs */}
        <div className="px-6 pt-4 z-10 bg-bg-base/50 py-2">
          <nav className="flex items-center gap-2 text-xs">
            {(() => {
              // Remove generic folder nodes from breadcrumbs for clarity
              const displayPath = breadcrumbPath.filter((n) => n.id !== 'brands-root' && n.id !== 'categories-root');
              return displayPath.map((n, idx) => {
                const isLast = idx === displayPath.length - 1;
                const label = n.type === 'root' ? 'Home' : n.name;
                const icon = n.type === 'root' ? '🏠' : (n.icon || (n.type === 'brand' ? '🏢' : '📂'));
                return (
                  <div key={n.id} className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate(n)}
                      disabled={isLast}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${isLast ? 'border-accent-primary bg-accent-primary/40 text-accent-secondary cursor-default shadow-lg' : 'border-border-subtle bg-bg-surface/60 text-text-muted hover:bg-bg-surface/80 hover:border-accent-primary/60'}`}
                      title={label}
                    >
                      <span className="mr-1.5 text-lg">{icon}</span>
                      <span className="uppercase tracking-wider text-[10px]">{label}</span>
                    </button>
                    {!isLast && <span className="text-text-muted font-bold">/</span>}
                  </div>
                );
              });
            })()}
          </nav>
        </div>

                {/* 1. Compact Brand Header */}
        <div className="px-6 pb-3 z-10 bg-gradient-to-r from-bg-base via-bg-surface to-bg-base flex-shrink-0">
            {/* Brand Info Section - Compact Horizontal Layout */}
            {isBrand && node.brandIdentity && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-bg-card/90 to-bg-surface/80 border border-accent-primary/30 rounded-xl p-4 shadow-xl backdrop-blur-sm flex items-center gap-6"
                >
                    {/* Compact Brand Logo */}
                    <div className="w-16 h-16 rounded-xl bg-white/5 backdrop-blur border border-accent-primary/30 shadow-lg flex items-center justify-center p-2 flex-shrink-0">
                        {node.brandIdentity.logo_url ? (
                            <img 
                                src={node.brandIdentity.logo_url} 
                                alt={node.brandIdentity.name}
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain drop-shadow-xl"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                        parent.innerHTML = `<span class="text-3xl">${node.icon || '🏢'}</span>`;
                                    }
                                }}
                            />
                        ) : (
                            <span className="text-3xl">{node.icon || '🏢'}</span>
                        )}
                    </div>
                    
                    {/* Brand Details - Horizontal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-end gap-4 mb-3">
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary tracking-tight">{node.brandIdentity.name}</h1>
                                {node.brandIdentity.slogan && (
                                    <p className="text-sm text-accent-primary/80 font-medium italic">"{node.brandIdentity.slogan}"</p>
                                )}
                            </div>
                            {/* SKU Badge */}
                            <div className="bg-gradient-to-r from-accent-primary/30 to-accent-secondary/20 backdrop-blur px-4 py-2 rounded-xl border border-accent-primary/40">
                                <div className="text-xs text-white/60 uppercase tracking-widest font-semibold">Halilit SKU</div>
                                <div className="text-lg font-bold text-accent-primary">{node.id.replace('brand-', '').toUpperCase()}</div>
                            </div>
                        </div>
                        
                        {/* Product Count Badge */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2 bg-accent-primary/20 px-4 py-2 rounded-xl border border-accent-primary/40 shadow-lg shadow-accent-primary/10">
                                <span className="text-2xl">📦</span>
                                <div>
                                    <div className="text-xs text-white/60 uppercase tracking-widest font-semibold">Total Products</div>
                                    <div className="text-2xl font-bold text-white">{items.length}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Additional Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                            {node.brandIdentity.headquarters && (
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{getCountryFlag(node.brandIdentity.headquarters)}</span>
                                    <span className="font-semibold text-text-primary">{node.brandIdentity.headquarters}</span>
                                </div>
                            )}
                            
                            {node.brandIdentity.founded && (
                                <div className="flex items-center gap-2">
                                    <span>📅</span>
                                    <span className="text-text-primary font-semibold">Est. {node.brandIdentity.founded}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Original Header for Non-Brand Views */}
            {!isBrand && (
            <div className="flex items-center gap-4 bg-bg-card/60 border border-accent-primary/30 rounded-xl p-3">
               <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-primary/40 to-bg-surface/40 backdrop-blur border border-accent-primary/50 shadow-lg flex items-center justify-center p-2">
                  {(node.image || node.logoUrl) ? (
                    <img 
                      src={node.image || node.logoUrl || ''} 
                      alt={node.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  ) : (
                    <span className="text-2xl">{node.icon || '📂'}</span>
                  )}
               </div>
               <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-text-primary tracking-tight">{node.name}</h1>
                  <span className="text-xs text-text-muted uppercase">{items.length} items</span>
               </div>
            </div>
            )}
        </div>

        {/* 3. Products Grid - Main Focus */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-thin scrollbar-thumb-accent-primary scrollbar-track-bg-surface">
             <div className="sticky top-0 bg-gradient-to-b from-bg-base via-bg-base/95 to-transparent backdrop-blur-md z-10 pb-6 pt-2 -mx-8 px-8 mb-4">
                 <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
                     <span className="text-3xl">📦</span>
                     <span>Product Catalog</span>
                     <span className="text-lg text-accent-primary font-bold ml-2">({filteredItems.length})</span>
                 </h2>
                 
                 {/* Category Filter Pills - HIDDEN FOR BRAND VIEW */}
                 {!isBrand && categories.length > 0 && (
                     <div className="flex flex-wrap gap-3">
                         <button
                             onClick={() => setSelectedCategory(null)}
                             className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                                 !selectedCategory 
                                     ? 'bg-accent-primary text-text-primary shadow-lg shadow-accent-primary/30' 
                                     : 'bg-bg-card/80 text-text-muted hover:bg-bg-card/95 border border-border-subtle hover:border-accent-primary/50'
                             }`}
                         >
                             ✨ All ({items.length})
                         </button>
                         {categories.map(cat => {
                             const count = items.filter(item => (item as any).category === cat).length;
                             return (
                                 <button
                                     key={cat}
                                     onClick={() => setSelectedCategory(cat)}
                                     className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                                         selectedCategory === cat 
                                             ? 'bg-accent-secondary/90 text-text-primary shadow-lg shadow-accent-secondary/30' 
                                             : 'bg-bg-card/80 text-text-muted hover:bg-bg-card/95 border border-border-subtle hover:border-accent-primary/50'
                                     }`}
                                 >
                                     {cat} <span className="ml-1 text-xs opacity-75">({count})</span>
                                 </button>
                             );
                         })}
                     </div>
                 )}
             </div>
             
             {filteredItems.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-48 opacity-50">
                     <span className="text-4xl mb-2">📭</span>
                     <span>No products found{selectedCategory ? ` in ${selectedCategory}` : ''}</span>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                     {filteredItems.map((item, idx: number) => {
                         // Robust image selection
                         const selectImageUrl = (it: any): string => {
                             const trim = (v?: string) => (typeof v === 'string' ? v.trim() : '');
                             if (trim(it.image_url)) return trim(it.image_url);
                             if (it.images) {
                                 if (Array.isArray(it.images) && it.images.length > 0) {
                                     const main = it.images.find((img: any) => img?.type === 'main');
                                     if (main?.url) return trim(main.url);
                                     const first = it.images[0];
                                     if (typeof first === 'string') return trim(first);
                                     if (first?.url) return trim(first.url);
                                 } else if (typeof it.images === 'object') {
                                     const main = (it.images as any).main || (it.images as any).thumbnail;
                                     if (main) return trim(main);
                                     const vals = Object.values(it.images as any);
                                     const first = vals.length ? vals[0] : '';
                                     return trim(first as string);
                                 }
                             }
                             return trim(it.img || it.image || '');
                         };

                         const imageUrl = selectImageUrl(item as any);
                         if (idx === 0) {
                             console.debug('[FolderView] First product imageUrl:', imageUrl);
                         }
                         
                         // Get stats
                         const imageCount = Array.isArray(item.images) ? item.images.length : (imageUrl ? 1 : 0);
                         const hasSpecs = (item as any).specifications && Object.keys((item as any).specifications || {}).length > 0;
                         const hasManuals = (item as any).manuals && (item as any).manuals.length > 0;
                         
                         return (
                        <motion.div
                            key={item.id || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                            onClick={() => onProductSelect(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductSelect(item); } }}
                            className="group relative flex flex-col h-full bg-gradient-to-br from-bg-card/80 to-bg-surface/60 border border-border-subtle rounded-2xl overflow-hidden hover:border-accent-primary/60 transition-all duration-300 text-left shadow-lg hover:shadow-2xl hover:shadow-accent-primary/20 hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary/60"
                        >
                             {/* Status Badge */}
                             <div className="absolute top-3 right-3 z-20 flex gap-2">
                                 <div className="bg-accent-primary/90 backdrop-blur px-2.5 py-1 rounded-full">
                                     <span className="text-xs font-bold text-text-primary">NEW</span>
                                 </div>
                             </div>

                             {/* Image Area - Larger */}
                             <div className="relative w-full h-64 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border-b border-border-subtle/50 flex items-center justify-center overflow-hidden group-hover:bg-white/5 transition-all">
                                 {/* Gradient Background */}
                                 <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                 
                                 {imageUrl ? (
                                    <img 
                                        src={imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent && !parent.querySelector('.fallback-icon')) {
                                                const fallback = document.createElement('span');
                                                fallback.className = 'text-6xl opacity-30 fallback-icon';
                                                fallback.textContent = '🎵';
                                                parent.appendChild(fallback);
                                            }
                                        }}
                                    />
                                 ) : (
                                    <span className="text-6xl opacity-30">🎵</span>
                                 )}
                             </div>
                             
                             {/* Content Area */}
                             <div className="flex-1 flex flex-col p-5">
                                 {/* Product Name */}
                                 <h3 className="text-lg font-bold text-text-primary group-hover:text-accent-secondary transition-colors mb-1 line-clamp-2">
                                     {item.name}
                                 </h3>
                                 
                                 {/* Category & Type */}
                                 <div className="flex items-center gap-2 mb-4">
                                     <span className="inline-block px-2.5 py-1 bg-accent-primary/15 text-accent-primary text-xs font-semibold rounded-full">
                                         {((item as any).category as string) || 'General'}
                                     </span>
                                 </div>
                                 
                                 {/* Stats Row */}
                                 <div className="flex items-center gap-4 text-xs text-text-muted mb-4 pb-4 border-b border-border-subtle/50">
                                     {imageCount > 0 && (
                                         <div className="flex items-center gap-1.5 hover:text-accent-primary transition-colors">
                                             <span className="text-sm">🖼️</span>
                                             <span className="font-medium">{imageCount}</span>
                                         </div>
                                     )}
                                     {hasSpecs && (
                                         <div className="flex items-center gap-1.5 hover:text-accent-primary transition-colors">
                                             <span className="text-sm">📋</span>
                                             <span className="font-medium">Specs</span>
                                         </div>
                                     )}
                                     {hasManuals && (
                                         <div className="flex items-center gap-1.5 hover:text-accent-primary transition-colors">
                                             <span className="text-sm">📖</span>
                                             <span className="font-medium">{(item as any).manuals.length}</span>
                                         </div>
                                     )}
                                 </div>
                                 
                                 {/* Price or CTA */}
                                 <div className="mt-auto">
                                     {((item as any).price || 0) > 0 ? (
                                         <div className="text-2xl font-bold text-status-success mb-2">
                                             ₪{((item as any).price || 0).toLocaleString()}
                                         </div>
                                     ) : null}
                                     <button
                                         onClick={(e) => { e.stopPropagation(); onProductSelect(item); }}
                                         className="w-full bg-gradient-to-r from-accent-primary/90 to-accent-secondary/80 hover:from-accent-primary hover:to-accent-secondary text-text-primary font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-accent-primary/30 flex items-center justify-center gap-2 group"
                                     >
                                         <span>View Details</span>
                                         <span className="group-hover:translate-x-1 transition-transform">→</span>
                                     </button>
                                 </div>
                             </div>
                        </motion.div>
                         );
                     })}
                 </div>
             )}
        </div>
    </div>
  );
};
