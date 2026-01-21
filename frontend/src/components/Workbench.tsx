/**
 * Workbench - The Chameleon View Router
 * Routes between different view components based on current level
 * 🎨 Dynamic brand theming applied globally
 */
import React from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { useBrandTheme } from '../hooks/useBrandTheme';
import { ProductCockpit } from './views/ProductCockpit';
import { BrandWorld } from './views/BrandWorld';
import { CategoryGrid } from './views/CategoryGrid';
import { GalaxyDashboard } from './views/GalaxyDashboard';
import { TierBar } from './smart-views/TierBar';
import { useRealtimeSearch } from '../hooks/useRealtimeSearch';

export const Workbench: React.FC = () => {
  const { currentLevel, activePath } = useNavigationStore();
  const { results: searchResults, isSearching } = useRealtimeSearch();
  
  // Determine current brand ID for theming
  const currentBrandId = activePath[0] || null;
  
  // Apply the brand theme globally to the workbench container
  // This makes scrollbars, highlights, and backgrounds shift colors
  useBrandTheme(currentBrandId);

  // The "Router" logic - switch views based on state machine level
  const renderView = () => {
    // Priority 1: If Searching, show the Comparison Tier Bar
    if (searchResults.length > 0 || isSearching) {
       return <TierBar products={searchResults} />;
    }

    switch (currentLevel) {
      case 'product':
        return <ProductCockpit />;
      case 'brand':
        return <BrandWorld brandId={currentBrandId || ''} />;
      case 'family':
        // Category level
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
