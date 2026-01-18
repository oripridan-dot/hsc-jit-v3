/**
 * Workbench - Product Cockpit
 * Displays detailed product information with right-side MediaBar
 */
import React, { useState } from 'react';
import { useNavigationStore } from '../store/navigationStore';
import { FiArrowLeft, FiExternalLink, FiInfo, FiBook, FiPackage } from 'react-icons/fi';
import { MediaBar } from './MediaBar';
import { MediaViewer } from './MediaViewer';
import { InsightsTable } from './InsightsTable';
import type { ProductImage } from '../types';

export const Workbench: React.FC = () => {
  const { selectedProduct, goBack, setWhiteBgImage: saveWhiteBgImage } = useNavigationStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'docs'>('overview');
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [selectedMediaItem, setSelectedMediaItem] = useState<{ url: string; type: 'image' | 'video' | 'audio' | 'pdf' } | null>(null);
  const [whiteBgImage, setWhiteBgImage] = useState<string | null>(null);

  // Helper to get main image URL
  const getMainImage = () => {
    if (!selectedProduct) return null;
    if (selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0) {
      const mainImg = selectedProduct.images.find((img: ProductImage) => img.type === 'main');
      return mainImg?.url || selectedProduct.images[0]?.url;
    }
    return selectedProduct.image_url || selectedProduct.image;
  };

  // Helper to get gallery images
  const getGalleryImages = () => {
    if (!selectedProduct?.images || !Array.isArray(selectedProduct.images)) return [];
    return selectedProduct.images.filter((img: ProductImage) => img.type === 'gallery').map((img: ProductImage) => img.url);
  };

  // Product Cockpit - detailed view of selected product
  if (selectedProduct) {
    const mainImage = getMainImage();

    return (
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)]">
        {/* Header with Back Button */}
        <div className="flex-shrink-0 bg-[var(--bg-panel)] border-b border-[var(--border-subtle)] px-2 py-1 sm:px-3 sm:py-1.5">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <FiArrowLeft size={16} />
              <span className="font-mono hidden sm:inline">← Back</span>
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-mono uppercase text-indigo-400 bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded">
                {selectedProduct.brand}
              </span>
              <span className="text-[10px] sm:text-xs font-mono uppercase text-amber-400 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded">
                {((selectedProduct as unknown as Record<string, string>)?.main_category) || selectedProduct.category || 'Product'}
              </span>
            </div>
          </div>

          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-0.5 flex items-center gap-2">
            {selectedProduct.name?.replace(/\n/g, ' ')}
            {whiteBgImage && (
              <img 
                src={whiteBgImage} 
                alt="Product thumbnail" 
                className="h-6 sm:h-8 aspect-square object-contain bg-white/5 rounded border border-white/10 p-0.5 flex-shrink-0"
              />
            )}
          </h1>
          
          {(selectedProduct.description || selectedProduct.short_description) && (
            <p className="text-[9px] sm:text-xs text-[var(--text-secondary)] line-clamp-1">
              {(selectedProduct.short_description || selectedProduct.description || '').substring(0, 80)}...
            </p>
          )}
        </div>

        {/* Main Content: Tabs + Content + MediaBar */}
        <div className="flex-1 flex min-h-0 overflow-hidden gap-0 flex-col lg:flex-row">
          {/* LEFT: Main content area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]/50 px-1 sm:px-2 flex gap-0.5">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FiInfo className="inline mr-0.5" size={12} />
                <span className="hidden sm:inline">Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'specs'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FiBook className="inline mr-0.5" size={12} />
                <span className="hidden sm:inline">Specs</span>
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'docs'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FiPackage className="inline mr-0.5" size={12} />
                <span className="hidden sm:inline">Docs</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 bg-[var(--bg-app)]">
              {activeTab === 'overview' && (
                <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
                  {/* Hero Image */}
                  {mainImage && (
                    <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <img
                        src={mainImage}
                        alt={selectedProduct.name}
                        className="w-full h-auto max-h-48 sm:max-h-72 object-contain rounded-lg"
                      />
                    </div>
                  )}

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 sm:mb-3">Description</h2>
                      <div className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                        {selectedProduct.description}
                      </div>
                    </div>
                  )}

                  {/* Quick Specs */}
                  {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 && (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 sm:mb-3">Key Specifications</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                        {Object.entries(selectedProduct.specs).slice(0, 6).map(([key, value]) => (
                          <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-[var(--border-subtle)] pb-1.5">
                            <span className="text-[9px] sm:text-xs text-[var(--text-tertiary)] uppercase">{key.replace(/_/g, ' ')}</span>
                            <span className="text-[9px] sm:text-xs text-[var(--text-primary)] font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
                  {/* Full Specifications */}
                  {selectedProduct.specs && Object.keys(selectedProduct.specs).length > 0 ? (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-3 sm:p-6">
                      <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 sm:mb-3">Technical Specifications</h2>
                      <div className="space-y-1 sm:space-y-2">
                        {Object.entries(selectedProduct.specs).map(([key, value]) => (
                          <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-[var(--border-subtle)] pb-1 sm:pb-2">
                            <span className="text-[9px] sm:text-xs text-[var(--text-tertiary)] uppercase w-full sm:w-1/3">{key.replace(/_/g, ' ')}</span>
                            <span className="text-[9px] sm:text-xs text-[var(--text-primary)] font-medium w-full sm:w-2/3 sm:text-right mt-0.5 sm:mt-0">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                      <p className="text-[var(--text-tertiary)] text-[10px] sm:text-xs">No specifications available for this product</p>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {selectedProduct.sku && (
                      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                        <div className="text-[9px] sm:text-xs text-[var(--text-tertiary)] uppercase mb-0.5">SKU</div>
                        <div className="text-xs text-[var(--text-primary)] font-mono">{selectedProduct.sku}</div>
                      </div>
                    )}
                    {selectedProduct.warranty && (
                      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                        <div className="text-[9px] sm:text-xs text-[var(--text-tertiary)] uppercase mb-0.5">Warranty</div>
                        <div className="text-xs text-[var(--text-primary)] font-mono">{selectedProduct.warranty}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
                  {/* Manual Link */}
                  {selectedProduct.manuals && selectedProduct.manuals.length > 0 && (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 sm:mb-3">Documentation</h2>
                      <div className="space-y-1.5">
                        {selectedProduct.manuals.map((manual, idx) => (
                          <a
                            key={idx}
                            href={manual.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[9px] sm:text-xs text-cyan-400 hover:text-cyan-300 transition-colors break-all"
                          >
                            <FiBook className="flex-shrink-0" />
                            <span>{manual.title || 'Download User Manual'}</span>
                            <FiExternalLink size={12} className="flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* External Link */}
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                    <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-2 sm:mb-3">Official Product Page</h2>
                    <button className="flex items-center gap-2 text-[9px] sm:text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                      <FiExternalLink size={12} />
                      <span>View on Manufacturer Website</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Insights Table at Bottom */}
            <div className="flex-shrink-0">
              <InsightsTable product={selectedProduct} />
            </div>
          </div>

          {/* RIGHT: MediaBar sidebar - Hidden on mobile, visible on lg screens */}
          <aside className="hidden lg:flex flex-shrink-0 border-l border-[var(--border-subtle)] overflow-hidden flex-col">
            <MediaBar
              images={getGalleryImages()}
              onMediaClick={(media) => {
                setSelectedMediaItem(media);
                setIsMediaViewerOpen(true);
              }}
              onWhiteBgImageFound={(imageUrl) => {
                setWhiteBgImage(imageUrl);
                if (selectedProduct?.id) {
                  saveWhiteBgImage(selectedProduct.id, imageUrl);
                }
              }}
            />
          </aside>
        </div>

        {/* MediaViewer Modal */}
        <MediaViewer
          isOpen={isMediaViewerOpen}
          media={selectedMediaItem}
          onClose={() => setIsMediaViewerOpen(false)}
          allMedia={getGalleryImages().map(url => ({ url, type: 'image' as const }))}
          currentIndex={selectedMediaItem ? getGalleryImages().indexOf(selectedMediaItem.url) : 0}
          onNavigate={(index) => {
            const imgs = getGalleryImages();
            if (imgs[index]) {
              setSelectedMediaItem({ url: imgs[index], type: 'image' });
            }
          }}
        />
      </div>
    );
  }

  // No product selected - show empty state
  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--bg-app)] p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🎵</div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome to Halilit</h2>
        <p className="text-[var(--text-secondary)]">
          Select a product from the navigator to view detailed information
        </p>
      </div>
    </div>
  );
};
