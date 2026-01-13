/**
 * ProductGrid Component
 * Manages grid layout, filtering, and product card rendering
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import type { Product } from '../../types';

interface ProductGridProps {
  products: Product[];
  query: string;
  onProductSelect: (product: Product) => void;
  isLoading?: boolean;
}

export function ProductGrid({
  products,
  query,
  onProductSelect,
  isLoading = false,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-slate-800 rounded-xl h-96 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 text-center"
      >
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-300">No products found</p>
          <p className="text-sm text-slate-400">
            Try adjusting your search or browsing by brand
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Count */}
      <div className="text-sm text-slate-400">
        Showing <span className="font-semibold text-slate-300">{products.length}</span> products
        {query && (
          <span>
            {' '}
            for <span className="font-semibold text-blue-400">"{query}"</span>
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              query={query}
              onClick={onProductSelect}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
