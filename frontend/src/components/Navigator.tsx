/**
 * Navigator - Left Pane Tree Navigation
 * Hierarchical browsing: Domain -> Brand -> Family -> Product
 */
import React, { useState, useEffect } from 'react';
import { useNavigationStore, type EcosystemNode, type NavLevel } from '../store/navigationStore';
import { FiChevronRight, FiChevronDown, FiSearch, FiPackage, FiFolder, FiGrid } from 'react-icons/fi';

interface TreeNodeProps {
  node: EcosystemNode;
  level: number;
  path: string[];
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, path }) => {
  const { expandedNodes, toggleNode, warpTo, selectProduct, activePath } = useNavigationStore();
  const isExpanded = expandedNodes.has(node.name);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = activePath[level] === node.name;

  const handleClick = () => {
    const newPath = [...path, node.name];
    
    if (node.type === 'product') {
      selectProduct(node);
    } else {
      if (hasChildren) {
        toggleNode(node.name);
      }
      warpTo(node.type as NavLevel, newPath);
    }
  };

  const getIcon = () => {
    switch (node.type) {
      case 'domain': return <FiGrid className="text-cyan-400" />;
      case 'brand': return <FiFolder className="text-blue-400" />;
      case 'family': return <FiPackage className="text-emerald-400" />;
      case 'product': return <FiPackage className="text-slate-400" size={14} />;
      default: return null;
    }
  };

  const getTextColor = () => {
    if (isActive) return 'text-cyan-300 font-bold';
    switch (node.type) {
      case 'domain': return 'text-white';
      case 'brand': return 'text-white';
      case 'family': return 'text-white font-semibold';
      case 'product': return 'text-slate-100';
      default: return 'text-white';
    }
  };

  return (
    <div className="select-none">
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer
          hover:bg-slate-700/40 transition-all duration-200
          ${isActive ? 'bg-cyan-900/40 border-l-3 border-cyan-400 shadow-lg shadow-cyan-500/20' : ''}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node.name);
            }}
            className="hover:text-cyan-400 transition-colors"
          >
            {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        )}
        
        {!hasChildren && <div className="w-[14px]" />}
        
        {getIcon()}
        
        <span className={`text-sm flex-1 ${getTextColor()}`}>
          {node.name}
        </span>
        
        {node.product_count !== undefined && node.product_count > 0 && (
          <span className="text-[10px] text-slate-300 font-mono">
            {node.product_count}
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, idx) => (
            <TreeNode
              key={`${child.name}-${idx}`}
              node={child}
              level={level + 1}
              path={[...path, node.name]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Navigator: React.FC = () => {
  const { ecosystem, loadEcosystem, searchQuery, setSearch, reset } = useNavigationStore();
  const [loading, setLoading] = useState(true);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch brand info first to get logo
        const brandsResp = await fetch('/api/brands');
        if (brandsResp.ok) {
          const brandsData = await brandsResp.json();
          const rolandBrand = brandsData.brands.find((b: any) => b.id === 'roland');
          if (rolandBrand?.logo_url) {
            setBrandLogo(rolandBrand.logo_url);
          }
        }
        
        // Use Vite proxy for API requests
        const endpoint = '/api/brands/roland/hierarchy';
        
        console.log('🔗 Fetching from:', endpoint);
        
        const resp = await fetch(endpoint);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        const data = await resp.json();
        
        console.log('📦 Received hierarchy data:', data);
        
        // Transform API data to ecosystem format
        const categories = Object.entries(data.hierarchy || {}).map(([catName, catData]: [string, any]) => {
          // Handle subcategories
          const subcatEntries = Object.entries(catData.subcategories || {});
          const subcategories = subcatEntries.map(([subName, subData]: [string, any]) => {
            const subProducts = Array.isArray(subData.products) ? subData.products : [];
            return {
              name: subName,
              type: 'family' as const,
              product_count: subProducts.length,
              children: subProducts.map((p: any) => ({
                name: p.name || 'Unknown Product',
                type: 'product' as const,
                id: p.id,
                brand: p.brand,
                category: p.main_category,
                image_url: p.images?.[0]?.url,
                product_type: 'root' as const
              }))
            };
          });

          // Handle direct products in category
          const directProducts = Array.isArray(catData.products) ? catData.products : [];
          const productNodes = directProducts.map((p: any) => ({
            name: p.name || 'Unknown Product',
            type: 'product' as const,
            id: p.id,
            brand: p.brand,
            category: p.main_category,
            image_url: p.images?.[0]?.url,
            product_type: 'root' as const
          }));

          return {
            name: catName,
            type: 'family' as const,
            product_count: directProducts.length + subcategories.reduce((sum: number, sub: any) => sum + (sub.product_count || 0), 0),
            children: [...subcategories, ...productNodes]
          };
        });

        console.log('✅ Transformed categories:', categories.length);

        const ecosystemData: EcosystemNode = {
          name: 'Musical Instruments',
          type: 'domain',
          children: [{
            name: 'Roland',
            type: 'brand',
            product_count: categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0),
            children: categories
          }]
        };
        
        loadEcosystem(ecosystemData);
        
        // Auto-expand Roland and first few categories
        setTimeout(() => {
          const { toggleNode } = useNavigationStore.getState();
          toggleNode('Roland');
          categories.slice(0, 3).forEach(cat => toggleNode(cat.name));
        }, 100);
      } catch (error) {
        console.error('❌ Failed to load hierarchy:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        alert(`Failed to load ecosystem: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadEcosystem]);

  const filteredEcosystem = React.useMemo(() => {
    if (!ecosystem || !searchQuery) return ecosystem;
    
    const filterNode = (node: EcosystemNode): EcosystemNode | null => {
      const nameMatch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (node.children) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((n): n is EcosystemNode => n !== null);
        
        if (filteredChildren.length > 0 || nameMatch) {
          return {
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          };
        }
      }
      
      return nameMatch ? node : null;
    };
    
    return filterNode(ecosystem);
  }, [ecosystem, searchQuery]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 bg-slate-950/80">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="text-sm">Loading catalog...</div>
        </div>
      </div>
    );
  }

  if (!ecosystem) {
    return (
      <div className="h-full flex items-center justify-center text-red-400">
        <div>Failed to load ecosystem</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950/80 border-r border-slate-800/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50 space-y-3">
        <div className="flex items-center gap-3">
          {brandLogo ? (
            <img src={brandLogo} alt="Roland" className="h-8 w-auto" />
          ) : (
            <div className="w-24 h-10 flex items-center justify-center">
              <span className="text-lg font-bold text-white">ROLAND</span>
            </div>
          )}
          <div>
            <div className="text-[10px] text-slate-300 font-mono uppercase">Navigator</div>
          </div>
          <button
            onClick={reset}
            className="ml-auto text-[10px] text-slate-400 hover:text-cyan-400 transition-colors font-mono font-bold px-2 py-1 rounded hover:bg-slate-800/50"
          >
            ↺ RESET
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="
              w-full pl-9 pr-3 py-2 
              bg-slate-900/50 border border-slate-700/50 rounded-md
              text-sm text-slate-300 placeholder-slate-600
              focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
              transition-colors
            "
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {filteredEcosystem ? (
          <div className="p-2">
            {filteredEcosystem.children?.map((domain, idx) => (
              <TreeNode
                key={`${domain.name}-${idx}`}
                node={domain}
                level={0}
                path={[]}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-slate-500 text-sm">
            No results found
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <div>
            DOMAINS: <span className="text-cyan-400">{ecosystem.children?.length || 0}</span>
          </div>
          <div>
            TOTAL: <span className="text-cyan-400">
              {ecosystem.children?.reduce((sum, d) => sum + (d.product_count || 0), 0) || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
