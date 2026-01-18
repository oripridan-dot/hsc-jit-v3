/**
 * Navigator - Left Pane Tree Navigation
 * Hierarchical browsing: Domain -> Brand -> Family -> Product
 */
import React, { useState, useEffect } from 'react';
import { useNavigationStore, type EcosystemNode, type NavLevel } from '../store/navigationStore';
import { FiChevronRight, FiChevronDown, FiSearch, FiPackage, FiFolder, FiGrid } from 'react-icons/fi';
import { catalogLoader, type Product } from '../lib/catalogLoader';
import { useBrandTheme } from '../hooks/useBrandTheme';

// Extended product shape from catalog JSON
interface CatalogProduct extends Product {
  main_category?: string;
  subcategory?: string;
  images?: { main?: string; thumbnail?: string; gallery?: string[] } | string[];
}

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

  // Apply brand theming globally (Roland by default for v3.7)
  useBrandTheme('roland');

  useEffect(() => {
    const loadData = async () => {
      try {
        const brandId = 'roland';

        // Load catalog directly from static data (fast, no backend dependency)
        const catalog = await catalogLoader.loadBrand(brandId);
        setBrandLogo(catalog.logo_url || null);

        // Build category/subcategory map from products
        const categoryMap = new Map<string, Map<string, CatalogProduct[]>>();
        const catalogProducts = catalog.products as CatalogProduct[];

        catalogProducts.forEach((product) => {
          const category = (product.category || product.main_category || 'Uncategorized').trim() || 'Uncategorized';
          const subcategory = (product.subcategory || 'General').trim() || 'General';

          if (!categoryMap.has(category)) {
            categoryMap.set(category, new Map());
          }

          const subMap = categoryMap.get(category)!;
          if (!subMap.has(subcategory)) {
            subMap.set(subcategory, []);
          }

          subMap.get(subcategory)!.push(product);
        });

        const getPrimaryImage = (images?: CatalogProduct['images'], fallback?: string) => {
          if (!images) return fallback;
          if (Array.isArray(images)) {
            const first = images[0];
            return typeof first === 'string' ? first : fallback;
          }
          return images.main || images.thumbnail || images.gallery?.[0] || fallback;
        };

        const categories = Array.from(categoryMap.entries()).map(([catName, subMap]) => {
          const subcategories = Array.from(subMap.entries()).map(([subName, products]) => ({
            name: subName,
            type: 'family' as const,
            product_count: products.length,
            children: products.map((p) => ({
              name: p.name || 'Unknown Product',
              type: 'product' as const,
              id: p.id,
              brand: p.brand,
              category: p.category || p.main_category,
              image_url: p.image_url || getPrimaryImage(p.images),
              product_type: 'root' as const
            }))
          }));

          const totalProducts = subcategories.reduce((sum, sub) => sum + (sub.product_count || 0), 0);

          return {
            name: catName,
            type: 'family' as const,
            product_count: totalProducts,
            children: subcategories
          };
        });

        const totalCount = categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);

        const ecosystemData: EcosystemNode = {
          name: 'Roland Mission Control',
          type: 'domain',
          product_count: totalCount,
          children: [{
            name: catalog.brand_name || 'Roland',
            type: 'brand',
            product_count: totalCount,
            children: categories
          }]
        };

        loadEcosystem(ecosystemData);

        // Auto-navigate into Roland brand and auto-expand for visibility
        setTimeout(() => {
          const { toggleNode, warpTo } = useNavigationStore.getState();
          const brandName = catalog.brand_name || 'Roland';
          
          // Navigate into the brand
          warpTo('brand', ['Roland Mission Control', brandName]);
          
          // Expand brand and first 4 categories
          toggleNode(brandName);
          categories.slice(0, 4).forEach(cat => toggleNode(cat.name));
        }, 50);
      } catch (error) {
        console.error('❌ Failed to load catalog hierarchy:', error);
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
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-panel)', borderRight: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          {brandLogo ? (
            <img src={brandLogo} alt="Roland" className="h-8 w-auto" />
          ) : (
            <div className="w-24 h-10 flex items-center justify-center rounded-md" style={{
              background: 'linear-gradient(135deg, var(--halileo-surface), transparent)',
              color: 'var(--text-primary)'
            }}>
              <span className="text-lg font-bold">ROLAND</span>
            </div>
          )}
          <div>
            <div className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-secondary)' }}>Navigator</div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Mission Control</div>
          </div>
          <button
            onClick={reset}
            className="ml-auto text-[10px] font-mono font-bold px-2 py-1 rounded transition-colors"
            style={{
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-panel-hover)'
            }}
          >
            ↺ RESET
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 rounded-md text-sm"
            style={{
              background: 'var(--bg-panel-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: searchQuery ? '0 0 0 3px var(--halileo-surface)' : 'none'
            }}
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900" style={{ background: 'var(--bg-panel)', color: 'var(--text-primary)' }}>
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
          <div className="p-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            No results found
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}>
        <div className="flex justify-between items-center text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
          <div>
            DOMAINS: <span style={{ color: 'var(--halileo-primary)' }}>{ecosystem.children?.length || 0}</span>
          </div>
          <div>
            TOTAL: <span style={{ color: 'var(--halileo-primary)' }}>
              {ecosystem.children?.reduce((sum, d) => sum + (d.product_count || 0), 0) || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
