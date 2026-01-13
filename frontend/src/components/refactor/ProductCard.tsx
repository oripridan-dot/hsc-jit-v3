/**
 * ProductCard Component
 * Displays a single product with image, name, specs, and interaction buttons
 */

import { motion } from 'framer-motion';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  query: string;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, query, onClick }: ProductCardProps) {
  /**
   * Highlights matching text in product name based on query
   */
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, idx) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={idx} className="bg-blue-500/40 text-blue-100 font-semibold">
              {part}
            </mark>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Fallback image
  const imageUrl = product.image || product.images?.[0];
  const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23334155" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%23cbd5e1"%3ENo Image%3C/text%3E%3C/svg%3E';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -4 }}
      className="group bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl overflow-hidden shadow-md hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-200"
    >
      {/* Top Accent Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-70" />

      {/* Score Badge */}
      {product.score !== undefined && (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
          {Math.round(product.score * 100)}%
        </div>
      )}

      {/* Image Container */}
      <div className="w-full h-48 bg-slate-950/50 flex items-center justify-center overflow-hidden relative">
        <img
          src={imageUrl || fallbackImage}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 p-3"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-3">
        {/* Brand & Category Badges */}
        <div className="flex flex-wrap gap-2">
          {/* Brand Badge */}
          {product.brand && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-700/80 border border-slate-600">
              {product.brand_identity?.logo_url && (
                <img
                  src={product.brand_identity.logo_url}
                  alt={product.brand}
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="text-slate-200 text-xs font-semibold uppercase tracking-wider">
                {product.brand}
              </span>
            </div>
          )}

          {/* Category Badge */}
          {product.category && (
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wide">
              {product.category}
            </div>
          )}

          {/* Country Badge */}
          {product.production_country && (
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              {product.production_country}
            </div>
          )}
        </div>

        {/* Product Name */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
            {highlightText(product.name, query)}
          </h3>
          {product.description && (
            <p className="text-xs text-slate-400 line-clamp-1">{product.description}</p>
          )}
        </div>

        {/* Specs Count & Price */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          {product.price ? (
            <span className="font-semibold text-white text-sm">${product.price.toLocaleString()}</span>
          ) : (
            <span className="font-semibold text-white text-sm">POA</span>
          )}
          <span className="text-slate-500">{Object.keys(product.specs || {}).length} specs</span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onClick(product)}
          className="w-full px-3 py-2 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}
