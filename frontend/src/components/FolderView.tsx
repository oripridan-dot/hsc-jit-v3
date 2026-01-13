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
    className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-4 flex-1 hover:border-slate-700 transition-colors"
  >
    <div className="w-10 h-10 rounded-lg bg-blue-900/20 text-blue-400 flex items-center justify-center text-xl">
      {icon}
    </div>
    <div>
       <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
       <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</div>
       {sub && <div className="text-[10px] text-emerald-400 mt-0.5">{sub}</div>}
    </div>
  </motion.div>
);

interface FolderViewProps {
  node: FileNode;
  onProductSelect: (p: Prediction) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({ node, onProductSelect }) => {
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

        {/* 1. Dashboard Header */}
        <div className="p-8 pb-6 z-10">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-16 h-16 rounded-2xl bg-white/95 backdrop-blur border border-slate-700 shadow-2xl flex items-center justify-center p-3">
                  {(node.image || node.logoUrl) ? (
                    <SmartImage 
                      src={node.image || node.logoUrl} 
                      alt={node.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl">{node.icon || (isBrand ? '🏢' : '📂')}</span>
                  )}
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/30 uppercase tracking-widest">
                          {isBrand ? 'Distributor Catalog' : 'Directory'}
                      </span>
                  </div>
                  <h1 className="text-4xl font-bold text-white tracking-tight">{node.name}</h1>
               </div>
            </div>

            {/* 2. Insight Cards */}
            {stats && (
                <div className="flex flex-wrap gap-4 mb-2">
                    <StatCard 
                        icon="📦" 
                        label="Total Assets" 
                        value={items.length} 
                        sub="In Stock"
                        delay={0.1}
                    />
                    <StatCard 
                        icon="🏷️" 
                        label="Average Value" 
                        value={`$${stats.avgPrice.toLocaleString()}`} 
                        sub="Market Price"
                        delay={0.2}
                    />
                    {stats.topCat && (
                        <StatCard 
                            icon="🎹" 
                            label="Top Category" 
                            value={stats.topCat[0]} 
                            sub={`${stats.topCat[1]} Items`}
                            delay={0.3}
                        />
                    )}
                </div>
            )}
        </div>

        {/* 3. The Grid (File Content) */}
        <div className="flex-1 overflow-y-auto px-8 pb-20 scrollbar-thin scrollbar-thumb-slate-800">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800/50 pb-2">
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
                             className="group relative flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden hover:bg-slate-800 hover:border-blue-500/30 transition-all duration-300 text-left"
                         >
                             {/* Image Area */}
                             <div className="aspect-square bg-white/5 relative p-4 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                 {(item.images?.main || (item as any).img) ? (
                                    <SmartImage 
                                        src={item.images?.main || (item as any).img} 
                                        alt={item.name}
                                        className="max-w-full max-h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" 
                                    />
                                 ) : (
                                    <span className="text-3xl opacity-30">🎹</span>
                                 )}
                             </div>
                             
                             {/* Meta */}
                             <div className="p-3">
                                 <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                                     {item.name}
                                 </h4>
                                 <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide truncate pr-2">{((item as any).category as string) || 'N/A'}</span>
                                    <span className="text-xs font-bold text-emerald-400">${((item as any).price || 0).toLocaleString()}</span>
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
