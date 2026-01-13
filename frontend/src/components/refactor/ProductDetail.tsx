/**
 * ProductDetail Component
 * Full-screen modal showing comprehensive product information
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../../types';
import { ImageCarousel } from './ImageCarousel';
import { AIChat } from './AIChat';
import { SpecificationsPanel } from './SpecificationsPanel';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

export function ProductDetail({ product, onClose }: ProductDetailProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'specs'>('chat');

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="min-h-screen bg-slate-900 flex flex-col lg:flex-row"
        >
          {/* ========== LEFT COLUMN: Images & Quick Info ========== */}
          <div className="flex-1 p-6 lg:p-8 bg-slate-900 border-r border-slate-800/50 overflow-y-auto max-h-screen lg:max-h-full">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 lg:top-6 lg:right-6 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Product Name & Brand */}
            <div className="mb-6 space-y-3">
              {product.brand && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
                  {product.brand_identity?.logo_url && (
                    <img
                      src={product.brand_identity.logo_url}
                      alt={product.brand}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span className="text-slate-300 text-sm font-semibold uppercase">{product.brand}</span>
                </div>
              )}

              <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">{product.name}</h1>

              {product.description && (
                <p className="text-slate-400 text-base leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Image Carousel */}
            <div className="mb-8">
              <ImageCarousel images={images} />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {product.price && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Price</p>
                  <p className="text-xl font-bold text-white mt-1">${product.price.toLocaleString()}</p>
                </div>
              )}

              {product.production_country && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Country</p>
                  <p className="text-lg font-semibold text-slate-100 mt-1">{product.production_country}</p>
                </div>
              )}

              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Specs</p>
                <p className="text-xl font-bold text-white mt-1">{Object.keys(product.specs || {}).length}</p>
              </div>
            </div>

            {/* Availability */}
            {product.availability && (
              <div className={`p-3 rounded-lg border mb-8 ${
                product.availability === 'in-stock'
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : product.availability === 'pre-order'
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                <p className="text-sm font-semibold capitalize">{product.availability.replace('-', ' ')}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-col lg:flex-row">
              {product.manual_url && (
                <a
                  href={product.manual_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-colors text-center"
                >
                  View Manual
                </a>
              )}

              {product.brand_identity?.website && (
                <a
                  href={product.brand_identity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors text-center"
                >
                  Visit Brand
                </a>
              )}
            </div>
          </div>

          {/* ========== RIGHT COLUMN: Chat & Specs ========== */}
          <div className="flex-1 p-6 lg:p-8 bg-slate-800/30 overflow-y-auto max-h-screen lg:max-h-full border-t lg:border-t-0 lg:border-l border-slate-700">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-700/50">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${
                  activeTab === 'chat'
                    ? 'text-blue-400 border-b-blue-500'
                    : 'text-slate-400 hover:text-slate-300 border-b-transparent'
                }`}
              >
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${
                  activeTab === 'specs'
                    ? 'text-blue-400 border-b-blue-500'
                    : 'text-slate-400 hover:text-slate-300 border-b-transparent'
                }`}
              >
                Specifications
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'chat' && <AIChat product={product} />}
              {activeTab === 'specs' && <SpecificationsPanel product={product} />}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
