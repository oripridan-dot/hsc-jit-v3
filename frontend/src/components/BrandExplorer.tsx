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

  // Fetch brands from /api/brands
  useEffect(() => {
    if (!isOpen) return;

    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/brands');
        const data = await response.json();
        
        if (data.brands) {
          // Sort by product count descending
          const sorted = data.brands.sort((a: Brand, b: Brand) => 
            (b.product_count || 0) - (a.product_count || 0)
          );
          setBrands(sorted);
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

  // Group brands by product count
  const productionReady = filteredBrands.filter(b => (b.product_count || 0) >= 5);
  const developing = filteredBrands.filter(b => (b.product_count || 0) < 5 && (b.product_count || 0) > 0);
  const empty = filteredBrands.filter(b => (b.product_count || 0) === 0);

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
            bg-slate-900
            border border-slate-700
            rounded-2xl
            shadow-2xl
            overflow-hidden
            flex flex-col
          "
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-800 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Brand Explorer</h1>
                <p className="text-sm text-slate-400 mt-1">
                  {brands.length} total brands available
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search brands by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  w-full px-4 py-2 
                  bg-slate-800/50 border border-slate-700 
                  rounded-lg 
                  text-white placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  transition
                "
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-lg bg-slate-800/50 border border-slate-700 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Production Ready Section */}
                {productionReady.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-white">
                        Production Ready
                      </h2>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono rounded-full border border-emerald-500/30">
                        {productionReady.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {productionReady.map((brand) => (
                        <BrandCard
                          key={brand.id}
                          brand={brand}
                          onSelect={() => {
                            onBrandSelect?.(brand);
                            onClose();
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Developing Section */}
                {developing.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-white">
                        In Development
                      </h2>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-mono rounded-full border border-blue-500/30">
                        {developing.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {developing.map((brand) => (
                        <BrandCard
                          key={brand.id}
                          brand={brand}
                          onSelect={() => {
                            onBrandSelect?.(brand);
                            onClose();
                          }}
                          variant="developing"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Products Section */}
                {empty.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-slate-400">
                        No Products Yet
                      </h2>
                      <span className="px-3 py-1 bg-slate-700/50 text-slate-400 text-xs font-mono rounded-full border border-slate-600/30">
                        {empty.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {empty.map((brand) => (
                        <BrandCard
                          key={brand.id}
                          brand={brand}
                          onSelect={() => {
                            onBrandSelect?.(brand);
                            onClose();
                          }}
                          variant="empty"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredBrands.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-lg">
                      No brands found matching "{searchTerm}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="px-8 py-4 border-t border-slate-800 bg-slate-950/50 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{productionReady.length}</p>
              <p className="text-xs text-slate-400">Production Ready</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{developing.length}</p>
              <p className="text-xs text-slate-400">In Development</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-500">{brands.reduce((sum, b) => sum + (b.product_count || 0), 0)}</p>
              <p className="text-xs text-slate-400">Total Products</p>
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
    ready: 'bg-slate-800/60 border-emerald-500/30 hover:border-emerald-500 hover:shadow-emerald-500/20',
    developing: 'bg-slate-800/40 border-blue-500/20 hover:border-blue-500 hover:shadow-blue-500/10',
    empty: 'bg-slate-950/40 border-slate-700/50 hover:border-slate-600 opacity-60'
  };

  return (
    <motion.button
      onClick={onSelect}
      disabled={variant === 'empty'}
      whileHover={variant !== 'empty' ? { y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative w-full p-4 rounded-lg border transition-all
        ${bgClasses[variant]}
        ${variant === 'empty' ? 'cursor-not-allowed' : 'cursor-pointer'}
        group
      `}
    >
      {/* Quality Badge */}
      {variant === 'ready' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
          ✓ READY
        </div>
      )}
      {variant === 'developing' && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/20 rounded-full text-[10px] font-bold text-blue-300 border border-blue-500/40">
          • DEV
        </div>
      )}

      {/* Logo */}
      <div className="h-24 flex items-center justify-center mb-3 bg-slate-950/50 rounded">
        <SmartImage
          src={brand.logo_url}
          alt={brand.name}
          className="max-h-full max-w-[90%] object-contain group-hover:scale-110 transition-transform"
        />
      </div>

      {/* Info */}
      <div className="text-left">
        <h3 className="font-bold text-white text-sm truncate group-hover:text-blue-300 transition-colors">
          {brand.name}
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">{brand.hq}</p>
        
        {/* Product Count */}
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <p className="text-xs font-mono text-slate-500">
            {brand.product_count || 0} products
          </p>
        </div>
      </div>
    </motion.button>
  );
};
