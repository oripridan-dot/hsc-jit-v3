/**
 * CategoryGrid - Category/Family Level View
 * Visual grid of products in a specific category
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useBrandData } from '../../hooks/useBrandData';
import { useBrandCatalog } from '../../hooks/useBrandCatalog';
import { Music } from 'lucide-react';
import type { Product } from '../../types';

interface CategoryGridProps {
  brandId: string;
  category: string;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ brandId, category }) => {
  const { selectProduct } = useNavigationStore();
  const brandTheme = useBrandData(brandId);
  const catalog = useBrandCatalog(brandId);

  // Get products specifically for this category
  const products: Product[] = useMemo(() => {
    if (!catalog?.products) return [];
    
    return catalog.products.filter(
      (p: Product) => 
        p.main_category === category || 
        p.subcategory === category ||
        p.sub_subcategory === category
    );
  }, [catalog, category]);

  const loading = !catalog && !brandTheme;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)]">
        <div className="text-center">
          <Music size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!brandTheme) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)]">
        <div className="text-center">
          <Music size={48} className="text-[var(--text-tertiary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Brand not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 z-10 relative bg-[var(--bg-app)]">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-transparent to-[var(--bg-app)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 pb-6 border-b border-[var(--border-subtle)]">
          <div className="text-[var(--brand-primary)] text-xs font-mono mb-2 uppercase tracking-widest">
            {brandId} / Catalog
          </div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] mb-2">{category}</h2>
          <p className="text-[var(--text-secondary)]">
            {products.length} {products.length === 1 ? 'product' : 'products'} in this category
          </p>
        </header>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product: Product) => (
              <button
                key={product.id}
                onClick={() => selectProduct(product)}
                className="group relative flex flex-col bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden hover:border-[var(--brand-primary)] transition-all hover:shadow-lg hover:shadow-[var(--brand-primary)]/10 text-left active:scale-95"
              >
                {/* Image Container */}
                <div className="aspect-square bg-white/5 p-4 flex items-center justify-center relative overflow-hidden group-hover:bg-white/10 transition-colors">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-indigo-500 to-purple-500" />
                  
                  {/* Product Image */}
                  <img 
                    src={product.image_url || product.image || ''} 
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105 relative z-10"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="m21 15-5-5L5 21"/%3E%3C/svg%3E';
                    }}
                  />
                  
                  {/* View Badge */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span 
                      className="text-white text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      VIEW
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-2 leading-relaxed mb-2">
                    {product.name}
                  </h4>
                  
                  {/* Model/SKU */}
                  <div className="text-[10px] text-[var(--text-tertiary)] font-mono mb-2">
                    {product.model_number || product.sku || product.id.substring(0, 8)}
                  </div>

                  {/* Badges */}
                  <div className="mt-auto flex items-center gap-1">
                    {product.video_urls && product.video_urls.length > 0 && (
                      <span 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                        title={`${product.video_urls.length} video(s) available`}
                      />
                    )}
                    {product.specifications && product.specifications.length > 0 && (
                      <span 
                        className="text-[8px] px-1 py-0.5 rounded bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium"
                        title={`${product.specifications.length} specifications`}
                      >
                        SPECS
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music size={48} className="text-[var(--text-tertiary)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Products Found</h3>
            <p className="text-[var(--text-secondary)]">
              This category is currently empty or data is still loading.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
