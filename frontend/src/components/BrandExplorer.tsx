import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartImage } from './shared/SmartImage';

interface Brand {
  id: string;
  name: string;
  logo_url: string;
  hq: string;
  website?: string;
  description?: string;
  founded?: number;
  product_count: number;
  brand_number?: string;
}

interface BrandExplorerProps {
  onBrandSelect?: (brand: Brand) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const BrandExplorer: React.FC<BrandExplorerProps> = ({ 
  onBrandSelect, 
  isOpen, 
  onClose 
}) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'count' | 'alpha' | 'id'>('count');

  // Fetch brands from static data
  useEffect(() => {
    if (!isOpen) return;

    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/index.json', { cache: 'no-store' });
        const data = await response.json();
        
        if (data.brands) {
          setBrands(data.brands);
        }
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [isOpen]);

  // Filter brands based on search
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedBrands = [...filteredBrands].sort((a, b) => {
    if (sortOption === 'count') {
        return (b.product_count || 0) - (a.product_count || 0);
    } else if (sortOption === 'alpha') {
        return a.name.localeCompare(b.name);
    } else if (sortOption === 'id') {
         const numA = parseInt(a.brand_number || '999999');
         const numB = parseInt(b.brand_number || '999999');
         if (numA !== numB && !isNaN(numA) && !isNaN(numB)) return numA - numB;
         return (a.brand_number || a.id).localeCompare(b.brand_number || b.id);
    }
    return 0;
  });

  // Group brands by product count
  const productionReady = sortedBrands.filter(b => (b.product_count || 0) >= 5);
  const developing = sortedBrands.filter(b => (b.product_count || 0) < 5 && (b.product_count || 0) > 0);
  const empty = sortedBrands.filter(b => (b.product_count || 0) === 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="
            relative
            w-full max-w-6xl max-h-[90vh]
            bg-bg-base
            border border-white/10
            rounded-2xl
            shadow-2xl
            overflow-hidden
            flex flex-col
          "
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-bg-card to-bg-base">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Brand Explorer</h1>
                <p className="text-sm text-text-muted mt-1">
                  {brands.length} total brands available
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Search Bar & Sort */}
            <div className="mt-4 flex gap-4">
              <input
                type="text"
                placeholder="Search brands by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  flex-1 px-4 py-2 
                  bg-bg-surface/50 border border-border-subtle 
                  rounded-lg 
                  text-text-primary placeholder-text-muted
                  focus:outline-none focus:ring-2 focus:ring-accent-primary
                  transition
                "
              />
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="px-4 py-2 bg-bg-surface/50 border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary transition"
              >
                  <option value="count">Count (Tier)</option>
                  <option value="alpha">A-Z</option>
                  <option value="id">Brand ID</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-lg bg-bg-surface/50 border border-border-subtle animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Production Ready Section */}
                {productionReady.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-text-primary">
                        Production Ready
                      </h2>
                      <span className="px-3 py-1 bg-status-success/20 text-status-success text-xs font-mono rounded-full border border-status-success/30">
                        {productionReady.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                      {productionReady.map((brand) => (
                        <div key={brand.id} className="h-80">
                          <BrandCard
                            brand={brand}
                            onSelect={() => {
                              onBrandSelect?.(brand);
                              onClose();
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Developing Section */}
                {developing.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-text-primary">
                        In Development
                      </h2>
                      <span className="px-3 py-1 bg-accent-primary/20 text-accent-primary text-xs font-mono rounded-full border border-accent-primary/30">
                        {developing.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                      {developing.map((brand) => (
                        <div key={brand.id} className="h-80">
                          <BrandCard
                            brand={brand}
                            onSelect={() => {
                              onBrandSelect?.(brand);
                              onClose();
                            }}
                            variant="developing"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Products Section */}
                {empty.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-text-muted">
                        No Products Yet
                      </h2>
                      <span className="px-3 py-1 bg-bg-surface/50 text-text-muted text-xs font-mono rounded-full border border-border-subtle/30">
                        {empty.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                      {empty.map((brand) => (
                        <div key={brand.id} className="h-80">
                          <BrandCard
                            brand={brand}
                            onSelect={() => {
                              onBrandSelect?.(brand);
                              onClose();
                            }}
                            variant="empty"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredBrands.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <p className="text-text-muted text-lg">
                      No brands found matching "{searchTerm}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="px-8 py-4 border-t border-border-subtle bg-bg-base/50 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-status-success">{productionReady.length}</p>
              <p className="text-xs text-text-muted">Production Ready</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-primary">{developing.length}</p>
              <p className="text-xs text-text-muted">In Development</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-secondary">{brands.reduce((sum, b) => sum + (b.product_count || 0), 0)}</p>
              <p className="text-xs text-text-muted">Total Products</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Individual Brand Card Component
interface BrandCardProps {
  brand: Brand;
  onSelect: () => void;
  variant?: 'ready' | 'developing' | 'empty';
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, onSelect, variant = 'ready' }) => {
  const bgClasses = {
    ready: 'bg-gradient-to-br from-bg-surface/80 to-bg-surface/40 border-status-success/30 hover:border-status-success/80 hover:shadow-lg hover:shadow-status-success/20',
    developing: 'bg-gradient-to-br from-bg-surface/60 to-bg-surface/30 border-accent-primary/20 hover:border-accent-primary/60 hover:shadow-lg hover:shadow-accent-primary/10',
    empty: 'bg-bg-base/40 border-border-subtle/50 hover:border-border-subtle opacity-60'
  };

  return (
    <motion.button
      onClick={onSelect}
      disabled={variant === 'empty'}
      whileHover={variant !== 'empty' ? { y: -6 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative w-full h-full rounded-xl border transition-all overflow-hidden
        ${bgClasses[variant]}
        ${variant === 'empty' ? 'cursor-not-allowed' : 'cursor-pointer'}
        group flex flex-col
      `}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-surface/30 pointer-events-none" />

      {/* Quality Badge */}
      {variant === 'ready' && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-status-success/25 rounded-full text-[10px] font-bold text-status-success border border-status-success/50 backdrop-blur-sm">
          ✓ READY
        </div>
      )}
      {variant === 'developing' && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-accent-primary/25 rounded-full text-[10px] font-bold text-accent-secondary border border-accent-primary/50 backdrop-blur-sm">
          • DEV
        </div>
      )}

      {/* Logo Section - Larger */}
      <div className="h-40 flex items-center justify-center flex-shrink-0 bg-gradient-to-b from-bg-surface/50 to-bg-base/50 border-b border-border-subtle/30 group-hover:from-bg-surface/70 group-hover:to-bg-surface/50 transition-colors">
        <SmartImage
          src={brand.logo_url}
          alt={brand.name}
          className="max-h-[85%] max-w-[85%] object-contain group-hover:scale-125 transition-transform duration-300"
        />
      </div>

      {/* Info Section */}
      <div className="p-4 flex-1 flex flex-col text-left relative z-10">
        <h3 className="font-bold text-text-primary text-sm group-hover:text-accent-secondary transition-colors line-clamp-2">
          {brand.name}
        </h3>
        
        {/* HQ Location */}
        <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1.5">
          <span className="text-lg">🏢</span>
          <span className="truncate">{brand.hq || 'Location unknown'}</span>
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Product Count Badge */}
        <div className="mt-3 pt-3 border-t border-border-subtle/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold text-status-success">
              {brand.product_count || 0}
            </span>
            <span className="text-[10px] text-text-muted">
              {(brand.product_count || 0) === 1 ? 'product' : 'products'}
            </span>
          </div>
          <span className="text-lg">📦</span>
        </div>
      </div>
    </motion.button>
  );
};
