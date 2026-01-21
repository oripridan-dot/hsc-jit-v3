/**
 * Workbench - The Chameleon View Router
 * Routes between different view components based on current level
 */
import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { GalaxyDashboard } from './views/GalaxyDashboard';
import { UniversalCategoryView } from './views/UniversalCategoryView';
import { catalogLoader } from '../lib/catalogLoader';
import { mapProductToUniversal, getCategoryById } from '../lib/universalCategories';
import type { Product } from '../types';

export const Workbench: React.FC = () => {
  const { currentLevel, currentUniversalCategory } = useNavigationStore();
  const [universalProducts, setUniversalProducts] = useState<Product[]>([]);

  // Load ALL products if we are in Universal Mode
  useEffect(() => {
    if (currentLevel === 'universal') {
      catalogLoader.loadAllProducts().then(setUniversalProducts);
    }
  }, [currentLevel]);

  // The "Router" logic - switch views based on state machine level
  const renderView = () => {
    // Priority 0: Universal Category View (New Architecture)
    if (currentLevel === 'universal' && currentUniversalCategory) {
      // Filter in real-time based on universal category mapper
      const filtered = universalProducts.filter(p => mapProductToUniversal(p) === currentUniversalCategory);
      const categoryDef = getCategoryById(currentUniversalCategory);
      const categoryLabel = categoryDef?.label || currentUniversalCategory;
      return <UniversalCategoryView categoryTitle={categoryLabel} products={filtered} />;
    }

    // Default: Galaxy Dashboard
    return <GalaxyDashboard />;
  };

  return (
    <div className="flex-1 h-full bg-[var(--bg-app)] transition-colors duration-500 overflow-hidden relative">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-transparent to-[var(--bg-app)] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {renderView()}
      </div>
    </div>
  );
};
