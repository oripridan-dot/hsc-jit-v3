import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getBrandColors } from '../utils/brandColors';
import { getCountryFlag } from '../utils/countryFlags';
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
                    <div className="flex-1 min-w-0 flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{node.brandIdentity.name}</h1>
                            {node.brandIdentity.slogan && (
                                <p className="text-sm text-accent-primary/80 font-medium italic">"{node.brandIdentity.slogan}"</p>
                            )}
                        </div>
                        
                        {/* Inline Stats */}
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 bg-accent-primary/10 px-3 py-1.5 rounded-lg">
                                <span className="text-accent-secondary">📦</span>
                                <span className="font-bold text-text-primary">{items.length}</span>
                                <span className="text-text-muted">Products</span>
                            </div>
                            
                            {node.brandIdentity.headquarters && (
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{getCountryFlag(node.brandIdentity.headquarters)}</span>
                                    <span className="text-text-muted text-xs">HQ:</span>
                                    <span className="text-text-primary font-semibold">{node.brandIdentity.headquarters}</span>
                                </div>
                            )}
                            
                            {node.brandIdentity.production_locations && node.brandIdentity.production_locations.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{node.brandIdentity.production_locations.map(loc => getCountryFlag(loc)).join(' ')}</span>
                                    <span className="text-text-muted text-xs">Production:</span>
                                    <span className="text-text-primary font-semibold">{node.brandIdentity.production_locations.join(', ')}</span>
                                </div>
                            )}
                            
                            {node.brandIdentity.founded && (
                                <div className="flex items-center gap-2">
                                    <span className="text-accent-secondary">📅</span>
                                    <span className="text-text-primary font-semibold">{node.brandIdentity.founded}</span>
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
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-accent-primary scrollbar-track-bg-surface">
             <div className="sticky top-0 bg-bg-base/95 backdrop-blur z-10 pb-3">
                 <h3 className="text-xs font-bold text-accent-primary uppercase tracking-widest mb-2 border-b border-accent-primary/30 pb-2">
                     Products Catalog
                 </h3>
                 
                 {/* Category Filter Pills */}
                 {categories.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-2">
                         <button
                             onClick={() => setSelectedCategory(null)}
                             className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                 !selectedCategory 
                                     ? 'bg-accent-primary text-text-primary shadow-lg' 
                                     : 'bg-bg-card/60 text-text-muted hover:bg-bg-card border border-border-subtle'
                             }`}
                         >
                             All ({items.length})
                         </button>
                         {categories.map(cat => {
                             const count = items.filter(item => (item as any).category === cat).length;
                             return (
                                 <button
                                     key={cat}
                                     onClick={() => setSelectedCategory(cat)}
                                     className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                         selectedCategory === cat 
                                             ? 'bg-accent-primary text-text-primary shadow-lg' 
                                             : 'bg-bg-card/60 text-text-muted hover:bg-bg-card border border-border-subtle'
                                     }`}
                                 >
                                     {cat} ({count})
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
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                     {filteredItems.map((item, idx: number) => {
                         const imageUrl = item.images?.main || item.images?.thumbnail || (item as any).img;
                         
                         return (
                         <motion.button
                             key={item.id}
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                             onClick={() => onProductSelect(item)}
                             className="group relative flex flex-col bg-bg-card/60 border border-border-subtle rounded-lg overflow-hidden hover:bg-bg-card/90 hover:border-accent-primary hover:scale-105 transition-all duration-200 text-left shadow-md hover:shadow-xl hover:shadow-accent-primary/20"
                         >
                             {/* Image Area */}
                             <div className="aspect-square bg-white/95 relative p-4 flex items-center justify-center group-hover:bg-white transition-colors">
                                 {imageUrl ? (
                                    <img 
                                        src={`/api/images/optimize/${imageUrl}?preset=thumbnail`}
                                        alt={item.name}
                                        className="max-w-full max-h-full object-contain drop-shadow-lg"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent && !parent.querySelector('.fallback-icon')) {
                                                const fallback = document.createElement('span');
                                                fallback.className = 'text-4xl opacity-40 fallback-icon';
                                                fallback.textContent = '🎵';
                                                parent.appendChild(fallback);
                                            }
                                        }}
                                    />
                                 ) : (
                                    <span className="text-4xl opacity-40">🎵</span>
                                 )}
                             </div>
                             
                             {/* Meta */}
                             <div className="p-2 bg-bg-surface/50">
                                 <h4 className="text-xs font-semibold text-text-primary truncate group-hover:text-accent-secondary transition-colors mb-1">
                                     {item.name}
                                 </h4>
                                 <div className="flex justify-between items-center gap-1">
                                    <span className="text-[9px] text-text-muted uppercase truncate font-medium">{((item as any).category as string) || 'N/A'}</span>
                                    {((item as any).price || 0) > 0 && (
                                        <span className="text-[10px] font-bold text-status-success whitespace-nowrap">₪{((item as any).price || 0).toLocaleString()}</span>
                                    )}
                                 </div>
                             </div>
                         </motion.button>
                         );
                     })}
                 </div>
             )}
        </div>
    </div>
  );
};
