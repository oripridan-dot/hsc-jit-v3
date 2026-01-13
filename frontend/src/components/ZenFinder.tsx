import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { buildFileSystem, type FileNode } from '../utils/zenFileSystem';

interface TreeNodeProps {
  node: FileNode;
  depth?: number;
  activeId: string | null;
  onSelect: (node: FileNode) => void;
  expandedIds: string[];
  toggleExpand: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth = 0, activeId, onSelect, expandedIds, toggleExpand }) => {
  const isExpanded = expandedIds.includes(node.id);
  const isActive = activeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  
  // Insight Chips
  const count = (node.meta?.count as number | undefined) || node.items?.length || 0;
  const hasImage = node.image && node.image.length > 0;

  return (
    <div className="select-none font-sans">
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
          if (hasChildren) toggleExpand(node.id);
        }}
        data-folder={node.id}
        className={`
          group flex items-center justify-between py-2 px-3 cursor-pointer transition-all duration-200 rounded-lg mx-1 mb-1
          ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-700/70 border border-slate-700/50'}
        `}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Always prefer image/logo over emoji icons - 3x larger for brands */}
          {node.type === 'brand' ? (
            <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-gradient-to-br from-blue-600/40 to-slate-700/40 p-1.5 flex items-center justify-center border-2 border-slate-600/80 shadow-md">
              {hasImage ? (
                <img 
                  src={node.image} 
                  alt={node.name}
                  className="w-full h-full object-contain drop-shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-2xl">🏢</span>
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded flex-shrink-0 bg-slate-700/30 p-1 flex items-center justify-center">
              {hasImage ? (
                <img 
                  src={node.image} 
                  alt={node.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-base transition-transform duration-300 ${hasImage ? 'hidden' : ''} ${isExpanded ? 'rotate-0' : ''}`}>
                 {node.icon || (hasChildren ? (isExpanded ? '📂' : '📁') : '📄')}
              </span>
            </div>
          )}
          <span className={`text-sm truncate ${isActive ? 'font-semibold tracking-wide' : 'font-medium'}`}>
            {node.name}
          </span>
        </div>
        
        {/* Insight Chip */}
        {count > 0 && (
           <span className={`
             text-[10px] font-mono font-bold px-2 py-1 rounded-md transition-colors
             ${isActive ? 'bg-blue-400 text-blue-950' : 'bg-slate-700/80 text-slate-200 group-hover:bg-slate-600'}
           `}>
             {count}
           </span>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-l border-slate-800/50 ml-4"
          >
            {node.children!.map((child: FileNode) => (
              <TreeNode 
                key={child.id} 
                node={child} 
                depth={depth + 1} 
                activeId={activeId}
                onSelect={onSelect}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ZenFinderProps {
  onNavigate: (node: FileNode) => void;
  searchQuery: string;
}

export const ZenFinder: React.FC<ZenFinderProps> = ({ onNavigate, searchQuery }) => {
  const { predictions, lastPrediction, actions } = useWebSocketStore();
  
  // In a real app, this "catalog" would ideally be the FULL static catalog, 
  // but here we merge predictions + some mock data or just rely on what we have.
  // For the purpose of this demo, we assume 'predictions' contains our working set.
  const rootNode = useMemo(() => buildFileSystem(predictions), [predictions]);

  const [expandedIds, setExpandedIds] = useState<string[]>(['root', 'brands-root']);
  const [activeId, setActiveId] = useState<string | null>(null);

  // --- Intelligent Auto-Navigation ---
  useEffect(() => {
    if (searchQuery.length > 2) {
        // Find matching nodes based on search
        const matches: string[] = [];
        const findMatches = (node: FileNode) => {
            if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                matches.push(node.id);
            }
            node.children?.forEach(findMatches);
        };
        findMatches(rootNode);
        
        // Auto expand if we have matches (defer to avoid synchronous state in effect)
        if (matches.length > 0) {
            setTimeout(() => {
              setExpandedIds(prev => {
                const newIds = new Set(prev);
                matches.forEach(m => newIds.add(m));
                return Array.from(newIds);
              });
            }, 0);
        }
    }
  }, [searchQuery, rootNode]);

  // React to AI Prediction
  useEffect(() => {
    if (lastPrediction?.brand) {
         const targetId = `brand-${lastPrediction.brand}`;
         // Check if node exists
         const brandsFolder = rootNode.children?.find(c => c.id === 'brands-root');
         const brandNode = brandsFolder?.children?.find(b => b.id === targetId);
         
         // If user has an active selection that differs, do not override
         if (activeId && activeId !== targetId) {
            return;
         }

         if (brandNode) {
            // Defer setState to next tick to avoid linter warnings
            setTimeout(() => {
              setExpandedIds(prev => Array.from(new Set([...prev, 'brands-root', targetId])));
              setActiveId(targetId);
              onNavigate(brandNode);
            }, 0);
         } else {
            // Fallback: ask backend to populate predictions for this brand
            actions.sendTyping(lastPrediction.brand);
            // Ensure brands root is visible
            setTimeout(() => {
              setExpandedIds(prev => Array.from(new Set([...prev, 'brands-root'])));
              setActiveId(null);
            }, 0);
         }
    }
  }, [lastPrediction, rootNode, onNavigate, actions, activeId]);

  const handleSelect = useCallback((node: FileNode) => {
    setActiveId(node.id);
    onNavigate(node);
  }, [onNavigate]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  return (
    <div className="w-72 h-full flex flex-col bg-slate-950 border-r border-slate-800/50 flex-shrink-0 relative">
        {/* Finder Header */}
        <div className="p-5 pb-3 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 drop-shadow">
                Halilit Explorer
            </h2>
            <div className="flex items-center justify-between text-slate-300 text-[10px] font-mono font-semibold">
               <span>System Active</span>
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> v3.0</span>
            </div>
        </div>

        {/* Scrollable Tree */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-blue-600/60 scrollbar-track-slate-900">
            <TreeNode 
                node={rootNode} 
                activeId={activeId} 
                onSelect={handleSelect} 
                expandedIds={expandedIds} 
                toggleExpand={toggleExpand} 
            />
        </div>
        
        {/* Bottom "Insight" Bar */}
        <div className="p-3 border-t-2 border-slate-700 bg-slate-900 backdrop-blur">
             <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono font-semibold">
                 <div>IDX: <span className="text-blue-400">{predictions.length}</span></div>
                 <div>MEM: <span className="text-emerald-400">42MB</span></div>
             </div>
        </div>
    </div>
  );
};
