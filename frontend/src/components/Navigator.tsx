/**
 * Navigator - Halilit Catalog Navigation Panel
 * 
 * The Unified Interface: Catalog Browser + Search
 * 
 * Architecture:
 * - Fetches static /data/index.json (The Catalog)
 * - Lazy-loads brand catalogs on demand
 * - Uses pre-built search_graph for instant suggestions
 * - Zero backend dependency at runtime
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Search, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { useNavigationStore } from '../store/navigationStore';
import { useBrandData } from '../hooks/useBrandData';
import type { Product, BrandIdentity, ProductImage } from '../types/index';

interface BrandIndexItem {
  id: string;
  name: string;
  slug?: string;
  brand_color?: string;
  logo_url?: string | null;
  product_count: number;
  verified_count?: number;
  data_file: string;
}

interface SearchGraphItem {
  id: string;
  label: string;
  brand: string;
  category: string;
  keywords: string[];
}

interface CatalogIndex {
  build_timestamp: string;
  version: string;
  total_products: number;
  total_verified: number;
  brands: BrandIndexItem[];
}

interface BrandData {
  hierarchy?: Record<string, Record<string, Product[]>>;
  products?: Product[];
  brand_identity?: BrandIdentity;
}

interface BrandProductsRecord {
  [key: string]: BrandData;
}

interface BrandIdentitiesRecord {
  [key: string]: BrandIdentity | undefined;
}

/**
 * BrandLogoDisplay - Shows brand logo with fallback to icon
 * Uses useBrandData hook to fetch real brand logos
 */
const BrandLogoDisplay: React.FC<{ brandName: string }> = ({ brandName }) => {
  const brandData = useBrandData(brandName);

  return (
    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--bg-app)] flex-shrink-0 border border-[var(--border-subtle)]/50">
      {brandData?.logoUrl ? (
        <img 
          src={brandData.logoUrl}
          alt={brandData.name}
          className="w-8 h-8 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
      ) : null}
      {!brandData?.logoUrl ? (
        <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-600">
          <span className="text-xs font-bold text-white">
            {brandName.substring(0, 2).toUpperCase()}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export const Navigator: React.FC = () => {
  const [mode, setMode] = useState<'catalog' | 'copilot'>('catalog');
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [catalogIndex, setCatalogIndex] = useState<CatalogIndex | null>(null);
  const [searchResults, setSearchResults] = useState<SearchGraphItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [brandProducts, setBrandProducts] = useState<BrandProductsRecord>({});
  const [loadingBrands, setLoadingBrands] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [brandIdentities, setBrandIdentities] = useState<BrandIdentitiesRecord>({});
  const { whiteBgImages } = useNavigationStore();

  // Load the Halilit Catalog Index on mount
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/data/index.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setCatalogIndex(data);
        
        // Auto-select first brand using 'id' field
        if (data.brands && data.brands.length > 0) {
          const firstBrand = data.brands[0];
          setExpandedBrand(firstBrand.id || firstBrand.slug || firstBrand.name);
        }
        
        console.log(`✅ Halilit Catalog loaded: ${data.brands.length} brands, ${data.total_products} products`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load catalog: ${errorMsg}`);
        console.error('❌ Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  // Load products for a specific brand
  const loadBrandProducts = async (slug: string) => {
    if (brandProducts[slug]?.hierarchy) return; // Already loaded with hierarchy
    
    try {
      setLoadingBrands(prev => new Set([...prev, slug]));
      
      // Find the brand entry to get the file path
      const brandEntry = catalogIndex?.brands.find(b => b.slug === slug || b.id === slug);
      // Use data_file field from index.json, or construct path
      const fileName = brandEntry?.data_file || `${slug}-catalog.json`;
      // Ensure we don't double-prefix with /data/
      const filePath = fileName.startsWith('/data/') ? fileName : `/data/${fileName}`;
      
      const response = await fetch(filePath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as BrandData;
      
      // Build hierarchy if it doesn't exist (ALWAYS do this)
      if (!data.hierarchy && data.products && Array.isArray(data.products)) {
        console.log(`Building hierarchy for ${slug} from ${data.products.length} products...`);
        data.hierarchy = buildHierarchyFromProducts(data.products);
        console.log(`✅ Hierarchy created: ${Object.keys(data.hierarchy).length} categories`);
      }
      
      // Store entire brand data (includes products, hierarchy, brand_identity)
      setBrandProducts(prev => ({
        ...prev,
        [slug]: data
      }));
      
      // Store brand identity (logo, colors, etc.)
      if (data.brand_identity) {
        setBrandIdentities(prev => {
          const updated = { ...prev };
          updated[slug] = data.brand_identity;
          return updated;
        });
      }

      // Pre-detect white background images for all products in this brand
      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((product: Product) => {
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            // Use first gallery image or main image as white background image
            // The actual white background detection happens in MediaBar when images load
            const galleryImage = product.images.find(
              (img): img is ProductImage =>
                typeof img === 'object' && img !== null && 'url' in img && 'type' in img && img.type === 'gallery'
            );
            const mainImage = product.images.find(
              (img): img is ProductImage =>
                typeof img === 'object' && img !== null && 'url' in img && 'type' in img && img.type === 'main'
            );
            const galleryUrl = (galleryImage?.url as string | undefined);
            const mainUrl = (mainImage?.url as string | undefined);
            const imageToUse = galleryUrl || mainUrl;
            
            if (imageToUse && product.id) {
              const { setWhiteBgImage: setWbg } = useNavigationStore.getState();
              setWbg(product.id, imageToUse);
            }
          }
        });
      }
      
      console.log(`✅ Loaded ${slug}: ${data.products?.length || 0} products with hierarchy`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Failed to load brand ${slug}: ${errorMsg}`);
      // Set empty object to prevent infinite retry
      setBrandProducts(prev => ({
        ...prev,
        [slug]: {}
      }));
    } finally {
      setLoadingBrands(prev => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  };

  /**
   * Build hierarchy from flat products array
   * Groups products by main_category and subcategory
   */
  const buildHierarchyFromProducts = (products: Product[]): Record<string, Record<string, Product[]>> => {
    const hierarchy: Record<string, Record<string, Product[]>> = {};
    
    products.forEach((product: Product) => {
      // Use main_category if available, fall back to category, then 'Other'
      const mainCat = (product as any).main_category || product.category || 'Other';
      const subCat = (product as any).subcategory || product.category || 'General';
      
      if (!hierarchy[mainCat]) {
        hierarchy[mainCat] = {};
      }
      if (!hierarchy[mainCat][subCat]) {
        hierarchy[mainCat][subCat] = [];
      }
      hierarchy[mainCat][subCat].push(product);
    });
    
    return hierarchy;
  };

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !catalogIndex) return;

    setMode('copilot');
    setIsThinking(true);
    setSearchResults([]);

    // Search would happen here (simplified for now)
    console.log(`🔍 Search: "${query}"`);

    // Simulate AI processing latency (for dramatic effect)
    setTimeout(() => {
      setSearchResults([]);
      setIsThinking(false);
    }, 600); // Reduced from 800ms
  };

  const handleBrandClick = (slug: string) => {
    if (expandedBrand === slug) {
      setExpandedBrand(null);
    } else {
      setExpandedBrand(slug);
      loadBrandProducts(slug);
    }
  };

  if (loading) {
    return (
      <aside className="w-80 h-screen flex flex-col bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] p-4 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-[var(--text-secondary)]">Loading Halilit Catalog...</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-80 h-screen flex flex-col bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] p-4">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="text-red-400 text-xl">⚠️</div>
          <p className="text-sm text-red-300 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full h-full flex flex-col bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] relative overflow-hidden transition-colors duration-500">
      
      {/* === NAVIGATION BODY === */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-0.5 relative">
        <AnimatePresence mode="wait">
          {mode === 'catalog' ? (
            <motion.div 
              key="catalog"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-1 px-1 py-2"
            >
              <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                📚 Brand Catalog
              </div>

              {catalogIndex?.brands && catalogIndex.brands.length > 0 ? (
                catalogIndex.brands.map((brand) => {
                  const brandId = brand.id || brand.slug || brand.name;
                  const isExpanded = expandedBrand === brandId;
                  const products = brandProducts[brandId] || [];

                  return (
                    <div key={brandId} className="space-y-1">
                      {/* Brand Button with Large Logo */}
                      <button
                        onClick={() => handleBrandClick(brandId)}
                        className="w-full flex items-center justify-between group p-2.5 rounded-lg hover:bg-[var(--bg-panel-hover)] transition-all border border-transparent hover:border-[var(--border-subtle)]"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Brand Logo - from useBrandData hook */}
                          <BrandLogoDisplay brandName={brand.name} />
                          
                          <div className="text-left flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[var(--text-primary)]">
                              {brand.name}
                            </div>
                            <div className="text-[9px] text-[var(--text-secondary)]">
                              {brand.product_count} products
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {/* Product List (Expanded) */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-4 space-y-0.5 border-l border-[var(--border-subtle)]"
                        >
                          {loadingBrands.has(brandId) ? (
                            <div className="px-3 py-2 flex items-center gap-2">
                              <div className="w-3 h-3 border-1 border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin" />
                              <span className="text-[10px] text-[var(--text-tertiary)]">Loading products...</span>
                            </div>
                          ) : products && Object.keys(products).length > 0 && products.hierarchy ? (
                            // Display hierarchical categories
                            <div className="space-y-1">
                              {Object.entries(products.hierarchy).map(([mainCategory, subcategoryMap]: [string, any]) => {
                                const categoryKey = `${brand.slug}-${mainCategory}`;
                                const isCategoryExpanded = expandedCategories.has(categoryKey);
                                const totalInCategory = Object.values(subcategoryMap).reduce((sum: number, prods: unknown) => sum + (Array.isArray(prods) ? prods.length : 0), 0);
                                
                                return (
                                  <div key={mainCategory} className="space-y-0.5">
                                    {/* Main Category Button */}
                                    <button
                                      onClick={() => {
                                        const newSet = new Set(expandedCategories);
                                        if (isCategoryExpanded) {
                                          newSet.delete(categoryKey);
                                        } else {
                                          newSet.add(categoryKey);
                                        }
                                        setExpandedCategories(newSet);
                                      }}
                                      className="w-full flex items-center justify-between group px-2 py-0.5 rounded hover:bg-[var(--bg-app)]/50 transition-all text-left"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <ChevronRight className={`w-3 h-3 text-indigo-400 flex-shrink-0 transition-transform ${isCategoryExpanded ? 'rotate-90' : ''}`} />
                                        <span className="text-[10px] font-medium text-[var(--text-primary)] truncate">
                                          📦 {mainCategory}
                                        </span>
                                        <span className="text-[8px] text-[var(--text-tertiary)] flex-shrink-0">
                                          ({totalInCategory})
                                        </span>
                                      </div>
                                    </button>

                                    {/* Subcategories & Products */}
                                    {isCategoryExpanded && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pl-3 space-y-0.5 border-l border-[var(--border-subtle)]/50"
                                      >
                                        {Object.entries(subcategoryMap).map(([subcategory, products_list]: [string, unknown]) => (
                                          <div key={subcategory} className="space-y-0.5">
                                            {/* Subcategory Label */}
<div className="px-2 py-0.5 text-[9px] font-semibold text-indigo-400/70 uppercase tracking-wide truncate">
                                              {subcategory} ({Array.isArray(products_list) ? products_list.length : 0})
                                            </div>
                                            
                                            {/* Products in Subcategory */}
                                            <div className="space-y-0">
                                              {(Array.isArray(products_list) ? products_list : []).map((product: Product, idx: number) => (
                                                <button
                                                  key={`${product.id}-${idx}`}
                                                  onClick={() => {
                                                    useNavigationStore.getState().selectProduct({
                                                      ...product,
                                                      brand: product.brand || brand.name,
                                                      category: product.category || subcategory
                                                    });
                                                  }}
                                                  className="flex items-center gap-1.5 w-full h-14 text-left px-2 rounded text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-indigo-500/20 active:bg-indigo-500/30 transition-colors cursor-pointer group"
                                                  title={product.name}
                                                >
                                                  {whiteBgImages[product.id] && (
                                                    <img 
                                                      src={whiteBgImages[product.id]} 
                                                      alt="Product thumbnail" 
                                                      className="h-12 w-12 aspect-square object-contain bg-white/5 rounded border border-white/10 p-1 flex-shrink-0"
                                                    />
                                                  )}
                                                  <span className="flex-1 truncate">{product.name}</span>
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : products && products.products && Array.isArray(products.products) && products.products.length > 0 ? (
                            // Fallback: flat list if no hierarchy but products array exists
                            <>
                              {products.products.slice(0, 10).map((product: Product, idx: number) => (
                                <button
                                  key={idx}
                                  className="block w-full text-left px-3 py-2 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] transition-colors truncate"
                                  title={product.name}
                                >
                                  {product.name}
                                </button>
                              ))}
                              {products.products.length > 10 && (
                                <div className="text-[10px] text-[var(--text-tertiary)] px-3 py-1 italic">
                                  +{products.products.length - 10} more...
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="px-3 py-2 text-[10px] text-[var(--text-tertiary)] italic">
                              No products
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-[var(--text-secondary)]">No brands available</p>
                </div>
              )}
            </motion.div>
          ) : (
            /* === COPILOT MODE === */
            <motion.div 
              key="copilot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-3 space-y-4"
            >
              {isThinking ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                  <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
                  <p className="text-sm text-indigo-400">Analyzing catalog...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="bg-indigo-50/10 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20">
                    <h3 className="text-sm font-bold text-indigo-300 mb-3">
                      ✨ Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {searchResults.map((result, idx) => (
                        <div key={idx} className="border-l-2 border-indigo-500/30 pl-3 py-1">
                          <div className="font-semibold text-xs text-indigo-200">{result.label}</div>
                          <div className="text-[10px] text-indigo-400/70 mt-1 space-y-0.5">
                            <div>📦 {result.brand}</div>
                            <div>🏷️ {result.category}</div>
                            {result.keywords && result.keywords.length > 0 && (
                              <div className="text-indigo-300/60">
                                {result.keywords.slice(0, 2).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : query ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <p className="text-sm text-[var(--text-secondary)]">No results found for "{query}"</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">Try a different search term</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <Compass className="w-8 h-8 text-indigo-500/30" />
                  <p className="text-sm text-[var(--text-secondary)]">Enter a search to get started</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* === MODE TOGGLE FOOTER === */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]">
        <div className="flex gap-2 bg-[var(--bg-app)] p-1 rounded-lg border border-[var(--border-subtle)]">
          <button 
            onClick={() => { setMode('catalog'); setSearchResults([]); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${mode === 'catalog' ? 'bg-white/10 text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
          >
            📚 Catalog
          </button>
          <button 
            onClick={() => setMode('copilot')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${mode === 'copilot' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
          >
            ✨ Copilot
          </button>
        </div>
      </div>
    </aside>
  );
};
