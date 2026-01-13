import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SmartImage } from './shared/SmartImage';
import type { FileNode } from '../utils/zenFileSystem';
import type { Prediction } from '../store/useWebSocketStore';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  delay: number;
}

// --- Dashboard Widgets ---
const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-slate-800/80 border-2 border-slate-600/80 rounded-xl p-4 flex items-center gap-4 flex-1 hover:border-blue-500/60 hover:bg-slate-800 transition-all shadow-md"
  >
    <div className="w-12 h-12 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center text-2xl shadow-md">
      {icon}
    </div>
    <div>
       <div className="text-2xl font-bold text-white tracking-tight drop-shadow">{value}</div>
       <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">{label}</div>
       {sub && <div className="text-[10px] text-emerald-300 mt-0.5 font-medium">{sub}</div>}
    </div>
  </motion.div>
);

interface FolderViewProps {
    node: FileNode;
    onProductSelect: (p: Prediction) => void;
    breadcrumbPath: FileNode[];
    onNavigate: (node: FileNode) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({ node, onProductSelect, breadcrumbPath, onNavigate }) => {
  const isBrand = node.type === 'brand';
  const items = node.items || [];
  
  // Active Analytics
  const stats = useMemo(() => {
     if (!items.length) return null;
     const totalValue = items.reduce((acc, i) => acc + ((i as any).price || 0), 0);
     const avgPrice = Math.round(totalValue / items.length);
     const maxPrice = Math.max(...items.map(i => (i as any).price || 0));
     
     // Category breakdown
     const cats = items.reduce((acc, i) => {
         const c = ((i as any).category as string | undefined) || 'Other';
         acc[c] = (acc[c] || 0) + 1;
         return acc;
     }, {} as Record<string, number>);
     const topCatEntry = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];

     return { totalValue, avgPrice, maxPrice, topCat: topCatEntry };
  }, [items]);

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
        {/* Dynamic Background Watermark */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

        {/* 0. Breadcrumbs */}
        <div className="px-8 pt-6 z-10 bg-slate-950/50 py-4">
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
                      className={`px-3 py-1.5 rounded-lg border-2 font-bold transition-all ${isLast ? 'border-blue-500 bg-blue-600/40 text-blue-200 cursor-default shadow-lg' : 'border-slate-600 bg-slate-700/60 text-slate-200 hover:bg-slate-600/80 hover:border-blue-500/60'}`}
                      title={label}
                    >
                      <span className="mr-1.5 text-lg">{icon}</span>
                      <span className="uppercase tracking-wider text-[10px]">{label}</span>
                    </button>
                    {!isLast && <span className="text-slate-600 font-bold">/</span>}
                  </div>
                );
              });
            })()}
          </nav>
        </div>

                {/* 1. Dashboard Header */}
        <div className="p-8 pb-6 z-10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
            <div className="flex items-center gap-6 mb-8">
               <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/40 to-slate-700/40 backdrop-blur border-3 border-blue-400 shadow-2xl shadow-blue-500/40 flex items-center justify-center p-4">
                  {(node.image || node.logoUrl) ? (
                    <SmartImage 
                      src={node.image || node.logoUrl} 
                      alt={node.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  ) : (
                    <span className="text-4xl">{node.icon || (isBrand ? '🏢' : '📂')}</span>
                  )}
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-600 text-white border border-blue-400 uppercase tracking-widest shadow-lg">
                          {isBrand ? 'Distributor Catalog' : 'Directory'}
                      </span>
                  </div>
                  <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">{node.name}</h1>
               </div>
            </div>

            {/* 2. Insight Cards */}
            {stats && (
                <div className="flex flex-wrap gap-4 mb-2">
                    {/* 1. Top Category */}
                    {stats.topCat && (
                        <StatCard 
                            icon="🎹" 
                            label="Top Category" 
                            value={stats.topCat[0]} 
                            sub={`${stats.topCat[1]} Items`}
                            delay={0.1}
                        />
                    )}
                    {/* 2. Total Products */}
                    <StatCard 
                        icon="📦" 
                        label="Total Products" 
                        value={items.length} 
                        sub="In Catalog"
                        delay={0.2}
                    />
                    {/* 3. Average Value */}
                    <StatCard 
                        icon="🏷️" 
                        label="Average Value" 
                        value={`$${stats.avgPrice.toLocaleString()}`} 
                        sub="Market Price"
                        delay={0.3}
                    />
                    {/* 4. Total Value */}
                    <StatCard 
                        icon="💰" 
                        label="Total Value" 
                        value={`$${stats.totalValue.toLocaleString()}`} 
                        sub="Catalog Worth"
                        delay={0.4}
                    />
                </div>
            )}
        </div>

        {/* 3. The Grid (File Content) */}
        <div className="flex-1 overflow-y-auto px-8 pb-20 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-slate-800">
             <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4 border-b-2 border-blue-500/50 pb-3">
                 Contents
             </h3>
             
             {items.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-48 opacity-50">
                     <span className="text-4xl mb-2">📭</span>
                     <span>Folder is empty</span>
                 </div>
             ) : (
                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                     {items.map((item, idx: number) => (
                         <motion.button
                             key={item.id}
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: idx * 0.03 }}
                             onClick={() => onProductSelect(item)}
                             className="group relative flex flex-col bg-slate-800/60 border-2 border-slate-700/80 rounded-xl overflow-hidden hover:bg-slate-700/80 hover:border-blue-500/80 transition-all duration-300 text-left shadow-lg hover:shadow-blue-500/20"
                         >
                             {/* Image Area */}
                             <div className="aspect-square bg-slate-700/50 relative p-3 flex items-center justify-center group-hover:bg-slate-600/60 transition-colors border-b border-slate-600/50">
                                 {(item.images?.main || (item as any).img) ? (
                                    <SmartImage 
                                        src={item.images?.main || (item as any).img} 
                                        alt={item.name}
                                        className="max-w-[90%] max-h-[90%] object-contain drop-shadow-xl group-hover:scale-125 transition-transform duration-500" 
                                    />
                                 ) : (
                                    <span className="text-5xl opacity-60">🎵</span>
                                 )}
                             </div>
                             
                             {/* Meta */}
                             <div className="p-3 bg-slate-900/50">
                                 <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                                     {item.name}
                                 </h4>
                                 <div className="flex justify-between items-center mt-2 gap-2">
                                    <span className="text-[10px] text-slate-300 uppercase tracking-wide truncate pr-2 font-medium">{((item as any).category as string) || 'N/A'}</span>
                                    <span className="text-xs font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded">₪{((item as any).price || 0).toLocaleString()}</span>
                                 </div>
                             </div>
                         </motion.button>
                     ))}
                 </div>
             )}
        </div>
    </div>
  );
};
