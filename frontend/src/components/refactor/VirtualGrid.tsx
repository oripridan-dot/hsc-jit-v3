/**
 * Virtual Product Grid
 * Optimized grid with virtual scrolling for large product lists
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface VirtualProductGridProps {
  products: Product[];
  query: string;
  onProductSelect: (product: Product) => void;
  itemsPerRow?: number;
  itemHeight?: number;
  overscan?: number;
}

export function VirtualProductGrid({
  products,
  query,
  onProductSelect,
  itemsPerRow = 4,
  itemHeight = 400,
  overscan = 3,
}: VirtualProductGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const rows = Math.ceil(products.length / itemsPerRow);
  const totalHeight = rows * itemHeight;
  // const visibleRows = Math.ceil(containerHeight / itemHeight);

  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endRow = Math.min(
    rows,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const startIndex = startRow * itemsPerRow;
  const endIndex = Math.min(endRow * itemsPerRow, products.length);

  const visibleProducts = products.slice(startIndex, endIndex);
  const offsetY = startRow * itemHeight;

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  };

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setContainerHeight(containerRef.current?.clientHeight || 0);
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-400">No products found</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen overflow-y-auto"
    >
      {/* Results count */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-slate-900/95 border-b border-slate-700 backdrop-blur-sm">
        <p className="text-sm text-slate-400">
          Showing <span className="font-semibold text-slate-300">{products.length}</span> products
          {query && (
            <span>
              {' '}
              for <span className="font-semibold text-blue-400">"{query}"</span>
            </span>
          )}
        </p>
      </div>

      {/* Spacer for off-screen items */}
      <div style={{ height: `${offsetY}px` }} />

      {/* Visible items grid */}
      <div
        className={`grid gap-4 px-6 py-4`}
        style={{
          gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))`,
        }}
      >
        {visibleProducts.map((product, idx) => (
          <motion.div
            key={`${product.id}-${startIndex + idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ProductCard
              product={product}
              query={query}
              onClick={onProductSelect}
            />
          </motion.div>
        ))}
      </div>

      {/* Spacer for off-screen items */}
      <div style={{ height: `${totalHeight - (endRow * itemHeight)}px` }} />

      {/* Scroll-to-top button */}
      {scrollTop > 500 && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={() => {
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-colors"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v12"
            />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

/**
 * Simpler virtual grid using CSS Grid (lighter weight)
 */
export function SimpleVirtualGrid({
  products,
  query,
  onProductSelect,
}: Omit<VirtualProductGridProps, 'itemsPerRow' | 'itemHeight' | 'overscan'>) {
  const [visibleProducts, setVisibleProducts] = useState(products.slice(0, 20));

  useEffect(() => {
    // Load more items as user scrolls
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = window.innerHeight;

      if (scrollHeight - (scrollTop + windowHeight) < 500) {
        // Load more items
        setVisibleProducts((prev) => {
          const newCount = Math.min(prev.length + 20, products.length);
          return products.slice(0, newCount);
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [products]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Showing <span className="font-semibold">{visibleProducts.length}</span> of{' '}
        <span className="font-semibold">{products.length}</span> products
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            query={query}
            onClick={onProductSelect}
          />
        ))}
      </div>

      {visibleProducts.length < products.length && (
        <div className="text-center py-8">
          <button
            onClick={() => {
              setVisibleProducts(
                products.slice(0, visibleProducts.length + 20)
              );
            }}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
