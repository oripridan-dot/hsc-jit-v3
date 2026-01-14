/**
 * BrandGrid Component
 * Displays BrandCard components in a responsive CSS Grid layout
 * Features: Auto-fill grid, generous gap, staggered fade-in animation
 */

import React from 'react';
import { BrandCard } from '../molecules/BrandCard';

interface BrandItem {
  id: string;
  name: string;
  logo_url?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'syncing';
}

interface BrandGridProps {
  brands: BrandItem[];
  onBrandClick?: (brand: BrandItem) => void;
  isLoading?: boolean;
  minCardWidth?: string;
}

export const BrandGrid: React.FC<BrandGridProps> = ({
  brands,
  onBrandClick,
  isLoading = false,
  minCardWidth = '240px',
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted text-sm font-mono">Loading brands...</p>
        </div>
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-text-muted text-sm font-mono">No brands available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid gap-6 w-full"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`,
      }}
    >
      {brands.map((brand, index) => (
        <div
          key={brand.id}
          className="animate-fade-in-up"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'both',
          }}
        >
          <BrandCard
            name={brand.name}
            logo_url={brand.logo_url}
            category={brand.category}
            status={brand.status}
            onClick={() => onBrandClick?.(brand)}
          />
        </div>
      ))}
    </div>
  );
};

export default BrandGrid;
