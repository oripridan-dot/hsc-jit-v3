/**
 * EmptyState Component
 * Home screen with brand exploration and recent products
 */

import { motion } from 'framer-motion';
import type { Brand, Product } from '../../types';

interface EmptyStateProps {
  brands: Brand[];
  recentProducts?: Product[];
  onBrandSelect: (brand: Brand) => void;
  onProductSelect: (product: Product) => void;
}

export function EmptyState({
  brands,
  recentProducts = [],
  onBrandSelect,
  onProductSelect,
}: EmptyStateProps) {
  // Show top 12 brands by product count
  const popularBrands = brands
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
    .slice(0, 12);

  return (
    <div className="space-y-12 py-8 lg:py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
          Welcome to HSC Support Center
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Find technical support, manuals, and information for 333+ professional audio products
        </p>
      </motion.div>

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recently Viewed</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentProducts.map((product, idx) => (
                <motion.button
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onProductSelect(product)}
                  className="text-left p-4 rounded-lg bg-slate-800/40 border border-slate-700 hover:border-slate-600 hover:bg-slate-800/60 transition-all duration-200"
                >
                  <div className="w-full h-32 bg-slate-900/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white line-clamp-2">{product.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{product.brand}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Popular Brands */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Popular Brands</h2>
          <p className="text-sm text-slate-400 mb-6">Click a brand to explore their products</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popularBrands.map((brand, idx) => (
              <motion.button
                key={brand.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => onBrandSelect(brand)}
                className="p-6 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700 hover:border-slate-600 hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-200"
              >
                <div className="space-y-3">
                  {/* Brand Logo */}
                  {brand.logo_url && (
                    <div className="w-12 h-12 rounded-lg bg-slate-900/50 flex items-center justify-center border border-slate-700">
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Brand Name */}
                  <div>
                    <h3 className="font-bold text-white text-left">{brand.name}</h3>
                    <p className="text-xs text-slate-400 text-left">
                      {brand.productCount || 0} products
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="pt-2 text-xs font-semibold text-blue-300 group-hover:text-white transition-colors">
                    Browse →
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Search Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center pt-8 border-t border-slate-700/50"
      >
        <p className="text-sm text-slate-400">
          Use the search bar above to find specific products or brands
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Keyboard shortcut: Press <kbd className="px-2 py-1 rounded bg-slate-800 text-slate-300">⌘ K</kbd> or{' '}
          <kbd className="px-2 py-1 rounded bg-slate-800 text-slate-300">Ctrl K</kbd> to focus search
        </p>
      </motion.div>
    </div>
  );
}
