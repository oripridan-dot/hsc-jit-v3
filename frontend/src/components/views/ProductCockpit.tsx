/**
 * ProductCockpit - Product Detail View
 * Displays detailed product information with right-side MediaBar
 * 🎨 Dynamic brand theming applied inside view
 */
import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useBrandData } from '../../hooks/useBrandData';
import { FiArrowLeft, FiExternalLink, FiInfo, FiBook, FiPackage, FiFile } from 'react-icons/fi';
import { MediaBar } from '../MediaBar';
import { MediaViewer } from '../MediaViewer';
import { InsightsTable } from '../InsightsTable';
import type { Product, ProductImage, ProductImagesObject, Specification } from '../../types';

export const ProductCockpit: React.FC = () => {
  const { selectedProduct, goBack, setWhiteBgImage: saveWhiteBgImage } = useNavigationStore();
  const brandData = useBrandData(selectedProduct?.brand);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'docs'>('overview');
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [selectedMediaItem, setSelectedMediaItem] = useState<{ url: string; type: 'image' | 'video' | 'audio' | 'pdf' } | null>(null);
  const [whiteBgImage, setWhiteBgImage] = useState<string | null>(null);
  const [mediaBarWidth, setMediaBarWidth] = useState(384); // Default w-96 = 384px
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, width: 0 });
  const mediaBarRef = React.useRef<HTMLDivElement>(null);

  /**
   * Extract main image URL from product
   * Handles both array and object image formats
   */
  const getMainImage = (): string | null => {
    if (!selectedProduct) return null;

    // If images is an array (ProductImage[])
    if (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0) {
      const mainImg = selectedProduct.images.find(
        (img): img is ProductImage => img?.type === 'main' && 'url' in img
      );
      if (mainImg) return mainImg.url;

      const firstImg = selectedProduct.images[0];
      if (firstImg && typeof firstImg === 'object' && 'url' in firstImg) {
        return (firstImg as ProductImage).url;
      }
    }

    // If images is an object (ProductImagesObject)
    if (selectedProduct.images && typeof selectedProduct.images === 'object' && !Array.isArray(selectedProduct.images)) {
      const imagesObj = selectedProduct.images as ProductImagesObject;
      return imagesObj.main || imagesObj.thumbnail || null;
    }

    // Fallback to image_url or image field
    return selectedProduct.image_url || selectedProduct.image || null;
  };

  /**
   * Extract gallery images from product
   * Returns array of image URLs
   */
  const getGalleryImages = (): string[] => {
    if (!selectedProduct?.images) return [];

    // If images is an array
    if (Array.isArray(selectedProduct.images)) {
      return selectedProduct.images
        .filter((img): img is ProductImage => img?.type === 'gallery' && 'url' in img)
        .map(img => img.url);
    }

    // If images is an object with gallery array
    if (typeof selectedProduct.images === 'object' && !Array.isArray(selectedProduct.images)) {
      const imagesObj = selectedProduct.images as ProductImagesObject;
      return Array.isArray(imagesObj.gallery) ? imagesObj.gallery : [];
    }

    return [];
  };

  /**
   * Extract video URLs from product
   */
  const getVideos = (): string[] => {
    if (!selectedProduct) return [];
    const videos = (selectedProduct as any).video_urls || (selectedProduct as any).youtube_videos || (selectedProduct as any).videos || [];
    // Filter out null/undefined values
    return Array.isArray(videos) ? videos.filter((v): v is string => typeof v === 'string' && Boolean(v)) : [];
  };

  /**
   * Extract manual/document URLs from product
   */
  const getManuals = (): string[] => {
    if (!selectedProduct) return [];
    const manuals = (selectedProduct as any).manual_urls || (selectedProduct as any).manuals || [];
    // Filter out null/undefined values
    return Array.isArray(manuals) ? manuals.filter((m): m is string => typeof m === 'string' && Boolean(m)) : [];
  };

  /**
   * Check if product has any media
   * Used to conditionally render MediaBar (images/videos only, docs are in Docs tab)
   */
  const hasMedia = (): boolean => {
    if (!selectedProduct) return false;
    
    const mainImg = getMainImage();
    const galleryImgs = getGalleryImages();
    const videos = getVideos();
    
    return !!(mainImg || galleryImgs.length > 0 || videos.length > 0);
  };

  // Handle resize dragging for MediaBar (resize from left edge, scale left)
  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate how far mouse moved from drag start
      const delta = e.clientX - dragStart.x;
      // Invert: drag left (negative delta) = wider, drag right = narrower
      const newWidth = dragStart.width - delta;
      
      // Constrain width between 250px and 800px
      if (newWidth >= 250 && newWidth <= 800) {
        setMediaBarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dragStart]);

  // Product Cockpit - detailed view of selected product
  if (selectedProduct) {
    const mainImage = getMainImage();

    return (
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)]">
        {/* Brand Header - Identity Card for selected product */}
        <div className="flex-shrink-0 bg-red-600 text-white px-6 py-5 border-b-4 border-red-800 z-50 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-red-100 font-bold">
                {selectedProduct.brand}
              </p>
              <h1 className="text-4xl font-bold mt-2">
                {selectedProduct.name}
              </h1>
              <p className="text-sm text-red-100 mt-2">
                SKU: {selectedProduct.halilit_sku || 'N/A'} • {selectedProduct.category || 'Product'}
                
                {/* Tier Badge */}
                {selectedProduct.tier && (
                  <span className={`
                    ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border
                    ${selectedProduct.tier.level === 'Elite' 
                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                      : selectedProduct.tier.level === 'Pro' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'}
                  `}>
                    {selectedProduct.tier.level}
                  </span>
                )}
                
                {/* Connectivity Badge */}
                {selectedProduct.connectivity && (
                  <span className="ml-2 inline-flex items-center text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded border border-white/20">
                    {selectedProduct.connectivity.connector_a} → {selectedProduct.connectivity.connector_b}
                  </span>
                )}
              </p>
            </div>
            <button 
              onClick={goBack}
              className="ml-4 p-2 hover:bg-red-500 rounded transition-colors flex-shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Content: Tabs + Content + MediaBar */}
        <div className="flex-1 flex min-h-0 overflow-hidden gap-0 flex-row">
          {/* LEFT: Main content area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-[var(--bg-panel)]/50 px-5 flex gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FiInfo className="inline mr-1.5" size={14} />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-3.5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'specs'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FiBook className="inline mr-1.5" size={14} />
                Specs
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3.5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
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
            <div className="flex-1 overflow-y-auto px-5 py-4 bg-[var(--bg-app)]">
              {activeTab === 'overview' && (
                <div className="max-w-7xl mx-auto space-y-4">
                  {/* Hero Section: Main Image + Key Specs Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                    {/* Left: Main Product Image */}
                    {mainImage && (
                      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                        <div className="aspect-[4/3] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[var(--bg-app)] to-[var(--bg-panel)]">
                          <img
                            src={mainImage}
                            alt={selectedProduct.name}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {/* Right: Branded Key Specifications Card */}
                    <div 
                      className="rounded-xl p-3 sm:p-4 shadow-lg border-2"
                      style={{
                        background: brandData 
                          ? `linear-gradient(135deg, ${brandData.brandColor}15, ${brandData.secondaryColor}15)`
                          : 'linear-gradient(135deg, var(--brand-color)/5, transparent)',
                        borderColor: brandData ? `${brandData.brandColor}40` : 'var(--brand-color)/20'
                      }}
                    >
                      {/* CONNECTIVITY DNA CARD */}
                      {selectedProduct.connectivity && (
                        <div className="mb-4 bg-black/20 p-3 rounded-lg border border-white/10">
                          <h4 className="text-xs uppercase tracking-wider opacity-70 mb-2">Connectivity DNA</h4>
                          <div className="flex justify-between items-center text-sm font-mono">
                            <span className="text-[var(--text-primary)]">{selectedProduct.connectivity.connector_a}</span>
                            <span className="text-[var(--text-secondary)]">↔</span>
                            <span className="text-[var(--text-primary)]">{selectedProduct.connectivity.connector_b}</span>
                          </div>
                           <div className="mt-2 text-xs flex gap-2">
                             <span className="px-1.5 py-0.5 rounded bg-white/10 text-[var(--text-secondary)]">
                               {selectedProduct.connectivity.signal_type}
                             </span>
                             {selectedProduct.connectivity.type !== 'cable' && (
                               <span className="px-1.5 py-0.5 rounded bg-white/10 text-[var(--text-secondary)] capitalize">
                                 {selectedProduct.connectivity.type}
                               </span>
                             )}
                           </div>
                        </div>
                      )}

                      {/* Card Header */}
                      <div 
                        className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b"
                        style={{ borderColor: brandData ? `${brandData.brandColor}40` : 'var(--brand-color)/20' }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-1 h-6 rounded-full"
                            style={{ backgroundColor: brandData?.brandColor || 'var(--brand-color)' }}
                          ></div>
                          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] uppercase tracking-wide">
                            Key Specifications
                          </h2>
                        </div>
                        <p className="text-[11px] sm:text-sm text-[var(--text-tertiary)] ml-3">
                          {selectedProduct.brand} {((selectedProduct as unknown as Record<string, string>)?.main_category) || selectedProduct.category || ''}
                        </p>
                      </div>

                      {/* Specifications Grid */}
                      {selectedProduct.specifications && selectedProduct.specifications.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {selectedProduct.specifications.map((spec: Specification, idx: number) => (
                            <div 
                              key={spec.key} 
                              className="group rounded-lg p-2 transition-colors"
                              style={{ 
                                backgroundColor: brandData ? `${brandData.brandColor}10` : 'var(--brand-color)/5'
                              }}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span 
                                  className="text-[11px] sm:text-sm font-medium uppercase tracking-wide flex-shrink-0"
                                  style={{ color: brandData?.brandColor || 'var(--brand-color)' }}
                                >
                                  {spec.key}
                                </span>
                                <span className="text-[12px] sm:text-base text-[var(--text-primary)] font-semibold text-right">
                                  {String(spec.value)}
                                </span>
                              </div>
                              {idx < 7 && <div className="mt-2 h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent"></div>}
                            </div>
                          ))}
                          
                          {selectedProduct.specifications.length > 8 && (
                            <button 
                              onClick={() => setActiveTab('specs')}
                              className="w-full mt-2 py-2 text-[11px] sm:text-sm font-medium text-[var(--brand-color)] hover:text-[var(--brand-color)]/80 border border-[var(--brand-color)]/30 hover:border-[var(--brand-color)]/50 rounded-lg transition-all"
                            >
                              View All Specifications ({selectedProduct.specifications.length})
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FiInfo className="mx-auto mb-2 text-[var(--text-tertiary)]" size={24} />
                          <p className="text-xs text-[var(--text-tertiary)]">No specifications available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2 sm:mb-3">Description</h2>
                      <div className="text-sm text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
                        {selectedProduct.description}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
                  {/* Full Specifications */}
                  {selectedProduct.specifications && selectedProduct.specifications.length > 0 ? (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-3 sm:p-6">
                      <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2 sm:mb-3">Technical Specifications</h2>
                      <div className="space-y-1 sm:space-y-2">
                        {selectedProduct.specifications.map((spec: Specification) => (
                          <div key={spec.key} className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-[var(--border-subtle)] pb-1 sm:pb-2">
                            <span className="text-[11px] sm:text-sm text-[var(--text-tertiary)] uppercase w-full sm:w-1/3">{spec.key}</span>
                            <span className="text-[11px] sm:text-sm text-[var(--text-primary)] font-medium w-full sm:w-2/3 sm:text-right mt-0.5 sm:mt-0">{String(spec.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                      <p className="text-[var(--text-tertiary)] text-[11px] sm:text-sm">No specifications available for this product</p>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {selectedProduct.sku && (
                      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                        <div className="text-[11px] sm:text-sm text-[var(--text-tertiary)] uppercase mb-0.5">SKU</div>
                        <div className="text-sm text-[var(--text-primary)] font-mono">{selectedProduct.sku}</div>
                      </div>
                    )}
                    {selectedProduct.warranty && (
                      <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                        <div className="text-[11px] sm:text-sm text-[var(--text-tertiary)] uppercase mb-0.5">Warranty</div>
                        <div className="text-sm text-[var(--text-primary)] font-mono">{selectedProduct.warranty}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
                  {/* Manuals & Documentation */}
                  {getManuals().length > 0 ? (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-3 sm:mb-4 flex items-center gap-2">
                        <FiBook className="text-amber-400" />
                        Documentation & Manuals
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getManuals().map((manualUrl, idx) => {
                          // Extract filename from URL for display
                          const fileName = manualUrl.split('/').pop()?.split('?')[0] || `Document ${idx + 1}`;
                          const isManual = manualUrl.toLowerCase().includes('manual');
                          const isPdf = manualUrl.toLowerCase().endsWith('.pdf');
                          
                          return (
                            <a
                              key={idx}
                              href={manualUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 rounded-lg hover:border-amber-500/40 hover:bg-amber-500/10 transition-all group"
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center">
                                <FiFile className="text-amber-400" size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-amber-300 transition-colors">
                                  {isManual ? 'User Manual' : isPdf ? fileName : `Document ${idx + 1}`}
                                </p>
                                <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)]">
                                  {isPdf ? 'PDF' : 'External Link'} • Click to {isPdf ? 'download' : 'view'}
                                </p>
                              </div>
                              <FiExternalLink size={14} className="flex-shrink-0 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-4 text-center">
                      <FiBook className="mx-auto text-[var(--text-tertiary)] mb-2" size={24} />
                      <p className="text-[var(--text-tertiary)] text-sm">No documentation available for this product</p>
                    </div>
                  )}

                  {/* External Link */}
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg sm:rounded-xl p-2 sm:p-3">
                    <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2 sm:mb-3">Official Product Page</h2>
                    <button className="flex items-center gap-2 text-[11px] sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
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

          {/* RIGHT: MediaBar sidebar with resizable drag - only show if media exists */}
          {hasMedia() && (
            <div 
              ref={mediaBarRef}
              className="flex-shrink-0 border-r border-[var(--border-subtle)] overflow-hidden flex flex-col relative bg-[var(--bg-panel)]/30 group"
              style={{ width: `${mediaBarWidth}px`, transition: isResizing ? 'none' : 'width 0.1s ease-out' }}
            >
              {/* Resize Handle - Left Edge - Minimal & Clean */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/25 hover:bg-indigo-500/60 cursor-col-resize transition-colors z-40"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                  setDragStart({ x: e.clientX, width: mediaBarWidth });
                }}
                title="Drag to resize images"
              />
              <MediaBar
                images={getGalleryImages()}
                videos={getVideos()}
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
            </div>
          )}
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
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome to Halilit</h2>
        <p className="text-lg text-[var(--text-secondary)]">
          Select a product from the navigator to view detailed information
        </p>
      </div>
    </div>
  );
};
