/**
 * Workbench - The Chameleon View Router
 * Routes between different view components based on current level
 * 🎨 Dynamic brand theming applied globally
 */
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { useBrandTheme } from '../hooks/useBrandTheme';
import { ProductCockpit } from './views/ProductCockpit';
import { BrandWorld } from './views/BrandWorld';
import { CategoryGrid } from './views/CategoryGrid';
import { GalaxyDashboard } from './views/GalaxyDashboard';
import { UniversalCategoryView } from './views/UniversalCategoryView';
import { TierBar } from './smart-views/TierBar';
import { useRealtimeSearch } from '../hooks/useRealtimeSearch';
import { useBrandData } from '../hooks/useBrandData';
import { catalogLoader } from '../lib/catalogLoader';
import { getUniversalCategory } from '../lib/universalCategoryMap';
import type { Product } from '../types';

export const Workbench: React.FC = () => {
  const { currentLevel, activePath, selectedProduct, currentCategory, currentUniversalCategory } = useNavigationStore();
  const { results: searchResults, isSearching, query: searchQuery } = useRealtimeSearch();
  const [universalProducts, setUniversalProducts] = useState<Product[]>([]);

  // Load ALL products if we are in Universal Mode
  useEffect(() => {
    if (currentLevel === 'universal') {
        catalogLoader.loadAllProducts().then(setUniversalProducts);
    }
  }, [currentLevel]);

  
  // Determine current brand ID for theming
  const currentBrandId = activePath[0] || null;
  const brandData = useBrandData(currentBrandId || undefined);
  
  // Apply the brand theme globally to the workbench container
  // This makes scrollbars, highlights, and backgrounds shift colors
  useBrandTheme(currentBrandId);

  // 2. DATA RESOLVER: Who are we looking at?
  const viewContext = useMemo(() => {
    // A. GLOBAL SEARCH (Highest Priority)
    if (isSearching || searchResults.length > 0) {
      return {
        mode: 'global-search',
        title: `Global Market: "${searchQuery}"`,
        products: searchResults,
        isComparison: true
      };
    }

    // B. BRAND CATEGORY (e.g., "Roland > Synthesizers")
    if (currentLevel === 'family' && brandData && currentCategory) {
      // Flatten the specific category from the hierarchy
      const categoryProducts = brandData.hierarchy?.[currentCategory] || [];
      return {
        mode: 'brand-category',
        title: `${brandData.name} // ${currentCategory}`,
        products: categoryProducts, // The Tier Bar will sort these by price automatically
        isComparison: false
      };
    }

    return null;
  }, [isSearching, searchResults, currentLevel, brandData, currentCategory]);


  // The "Router" logic - switch views based on state machine level
  const renderView = () => {
    // Priority 0: Universal Category View (New Architecture)
    if (currentLevel === 'universal' && currentUniversalCategory) {
        // Filter in real-time based on static map
        const filtered = universalProducts.filter(p => getUniversalCategory(p) === currentUniversalCategory);
        return <UniversalCategoryView categoryTitle={currentUniversalCategory} products={filtered} />;
    }

    // Priority 1: Product Detail
    if (currentLevel === 'product' && selectedProduct) {
        return <ProductCockpit />;
    }

    // Priority 2: Tier Bar + Content (Comparison or Category)
    if (viewContext && viewContext.products.length > 0) {
        return (
          <div className="flex flex-col h-full">
            {/* TIER BAR HEADER (Visual Intelligence) */}
            <div className="h-[40%] min-h-[300px] flex-shrink-0 border-b border-white/10 relative z-20 shadow-2xl">
              <TierBar 
                products={viewContext.products} 
                title={viewContext.title} 
                showBrandBadges={viewContext.isComparison} 
              />
            </div>

            {/* CONTENT GRID */}
            <div className="flex-1 overflow-y-auto relative z-10 bg-[var(--bg-app)]">
               {viewContext.mode === 'brand-category' ? (
                 <CategoryGrid brandId={currentBrandId || ''} category={currentCategory || ''} />
               ) : (
                 // Global Search Result Grid (Simple fallback)
                 <div className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {viewContext.products.map(p => (
                      <div key={p.id} className="bg-[var(--bg-panel)] p-4 rounded-xl border border-[var(--border-subtle)]">
                        <img src={p.image_url} className="w-full h-32 object-contain mb-4" />
                        <h3 className="font-bold text-[var(--text-primary)]">{p.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{p.brand}</p>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        );
    }

    // Priority 3: Fallbacks
    switch (currentLevel) {
      // 'product' case handled above
      case 'brand':
        return <BrandWorld brandId={currentBrandId || ''} />;
      case 'family':
        // Fallback if viewContext failed (empty products?)
        return <CategoryGrid brandId={currentBrandId || ''} category={activePath[1] || ''} />;
      default:
        // Galaxy level (empty state)
        return <GalaxyDashboard />;
    }
  };

  return (
    <div className="flex-1 h-full bg-[var(--bg-app)] transition-colors duration-500 overflow-hidden relative">
      {/* Background Ambient Glow based on Brand Color */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-transparent to-[var(--bg-app)] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {renderView()}
      </div>
    </div>
  );
};
