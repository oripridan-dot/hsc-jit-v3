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
        className={`
          group flex items-center justify-between py-1.5 px-3 cursor-pointer transition-all duration-200 rounded-lg mx-1 mb-0.5
          ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-1 ring-blue-400/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'}
        `}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Always prefer image/logo over emoji icons - 2x larger */}
          {hasImage ? (
            <div className="w-12 h-12 rounded flex-shrink-0 bg-white/10 p-1 flex items-center justify-center border border-slate-700/50">
              <img 
                src={node.image} 
                alt={node.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            </div>
          ) : null}
          <span className={`text-base transition-transform duration-300 flex-shrink-0 ${hasImage ? 'hidden' : ''} ${isExpanded ? 'rotate-0' : ''}`}>
             {node.icon || (hasChildren ? (isExpanded ? '📂' : '📁') : '📄')}
          </span>
          <span className={`text-sm truncate ${isActive ? 'font-semibold tracking-wide' : 'font-medium'}`}>
            {node.name}
          </span>
        </div>
        
        {/* Insight Chip */}
        {count > 0 && (
           <span className={`
             text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors
             ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}
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
  const { predictions, lastPrediction } = useWebSocketStore();
  
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
        
        // Auto expand if we have matches
        if (matches.length > 0) {
            setExpandedIds(prev => {
              const newIds = new Set(prev);
              matches.forEach(m => newIds.add(m));
              return Array.from(newIds);
            });
        }
    }
  }, [searchQuery, rootNode]);

  // React to AI Prediction
  useEffect(() => {
    if (lastPrediction?.brand) {
         const targetId = `brand-${lastPrediction.brand}`;
         // Check if node exists
         const brandNode = rootNode.children?.find(c => c.id === 'brands-root')?.children?.find(b => b.id === targetId);
         
         if (brandNode) {
             setExpandedIds(prev => {
               const newIds = new Set([...prev, 'brands-root', targetId]);
               return Array.from(newIds);
             });
             setActiveId(targetId);
             onNavigate(brandNode);
         }
    }
  }, [lastPrediction, rootNode, onNavigate]);

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
        <div className="p-5 pb-2">
            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">
                Halilit Explorer
            </h2>
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
               <span>System Active</span>
               <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> v3.0</span>
            </div>
        </div>

        {/* Scrollable Tree */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <TreeNode 
                node={rootNode} 
                activeId={activeId} 
                onSelect={handleSelect} 
                expandedIds={expandedIds} 
                toggleExpand={toggleExpand} 
            />
        </div>
        
        {/* Bottom "Insight" Bar */}
        <div className="p-3 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur">
             <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                 <div>IDX: {predictions.length}</div>
                 <div>MEM: 42MB</div>
             </div>
        </div>
    </div>
  );
};
