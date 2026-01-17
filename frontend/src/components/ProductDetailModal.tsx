import React, { useState } from 'react';
import './ProductDetailModal.css';

interface Product {
  id: string;
  name: string;
  brand: string;
  model_number?: string;
  description?: string;
  short_description?: string;
  main_category?: string;
  images?: {
    main?: string;
    thumbnail?: string;
    gallery?: string[];
  };
  video_urls?: string[];
  specifications?: Array<{
    category: string;
    key: string;
    value: string;
    unit?: string;
  }>;
  features?: string[];
  manual_urls?: string[];
  support_url?: string;
  brand_product_url?: string;
  accessories?: Array<{
    target_product_name: string;
    description?: string;
  }>;
  related_products?: Array<{
    target_product_name: string;
    description?: string;
  }>;
  pricing?: {
    regular_price?: number;
    eilat_price?: number;
    sale_price?: number;
  };
}

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'features' | 'manuals'>('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  // Normalize product name for display (replace newlines with spaces)
  const displayName = product.name?.replace(/\n/g, ' ') || 'Unknown Product';

  const gallery = product.images?.gallery || [];
  const hasGallery = gallery.length > 0;
  const specs = product.specifications || [];
  const features = product.features || [];
  const manuals = product.manual_urls || [];
  const videos = product.video_urls || [];

  // Group specs by category
  const groupedSpecs = specs.reduce((acc, spec) => {
    const category = spec.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(spec);
    return acc;
  }, {} as Record<string, typeof specs>);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>{displayName}</h2>
            {product.model_number && (
              <p className="model-number">Model: {product.model_number}</p>
            )}
            <p className="brand-badge">{product.brand}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Image Gallery */}
        {hasGallery && (
          <div className="image-gallery">
            <button className="gallery-nav prev" onClick={handlePrevImage}>
              ‹
            </button>
            <img
              src={gallery[currentImageIndex]}
              alt={`${displayName} - Image ${currentImageIndex + 1}`}
              className="gallery-main-image"
            />
            <button className="gallery-nav next" onClick={handleNextImage}>
              ›
            </button>
            <div className="gallery-indicators">
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  className={`indicator ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                />
              ))}
            </div>
            <div className="gallery-counter">
              {currentImageIndex + 1} / {gallery.length}
            </div>
          </div>
        )}

        {/* Pricing (if available) */}
        {product.pricing && (
          <div className="pricing-section">
            {product.pricing.sale_price && product.pricing.regular_price && product.pricing.sale_price < product.pricing.regular_price && (
              <span className="price-sale">₪{product.pricing.sale_price.toLocaleString()}</span>
            )}
            {product.pricing.regular_price && (
              <span className={product.pricing.sale_price && product.pricing.sale_price < product.pricing.regular_price ? 'price-regular crossed' : 'price-regular'}>
                ₪{product.pricing.regular_price.toLocaleString()}
              </span>
            )}
            {product.pricing.eilat_price && (
              <span className="price-eilat">₪{product.pricing.eilat_price.toLocaleString()} Eilat</span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'specs' ? 'active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Specs ({specs.length})
          </button>
          <button
            className={`tab ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            Features ({features.length})
          </button>
          <button
            className={`tab ${activeTab === 'manuals' ? 'active' : ''}`}
            onClick={() => setActiveTab('manuals')}
          >
            Manuals ({manuals.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Description */}
              {product.description && (
                <div className="description-section">
                  <h3>Description</h3>
                  <p>{product.description}</p>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div className="videos-section">
                  <h3>Videos ({videos.length})</h3>
                  <div className="videos-grid">
                    {videos.slice(0, 3).map((url, idx) => {
                      const embedUrl = getYouTubeEmbedUrl(url);
                      return embedUrl ? (
                        <iframe
                          key={idx}
                          src={embedUrl}
                          title={`Video ${idx + 1}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="video-link">
                          📹 Watch Video {idx + 1}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="links-section">
                <h3>Links</h3>
                <div className="links-grid">
                  {product.brand_product_url && (
                    <a href={product.brand_product_url} target="_blank" rel="noopener noreferrer" className="link-button">
                      🔗 Official Product Page
                    </a>
                  )}
                  {product.support_url && (
                    <a href={product.support_url} target="_blank" rel="noopener noreferrer" className="link-button">
                      🛠️ Support Portal
                    </a>
                  )}
                </div>
              </div>

              {/* Accessories */}
              {product.accessories && product.accessories.length > 0 && (
                <div className="accessories-section">
                  <h3>Related Accessories</h3>
                  <div className="accessories-grid">
                    {product.accessories.map((acc, idx) => (
                      <div key={idx} className="accessory-card">
                        <strong>{acc.target_product_name}</strong>
                        {acc.description && <p>{acc.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="specs-tab">
              {Object.entries(groupedSpecs).map(([category, categorySpecs]) => (
                <div key={category} className="specs-category">
                  <h3>{category}</h3>
                  <table className="specs-table">
                    <tbody>
                      {categorySpecs.map((spec, idx) => (
                        <tr key={idx}>
                          <td className="spec-key">{spec.key}</td>
                          <td className="spec-value">
                            {spec.value} {spec.unit || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              {specs.length === 0 && (
                <p className="empty-state">No specifications available</p>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div className="features-tab">
              {features.length > 0 ? (
                <ul className="features-list">
                  {features.map((feature, idx) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No features listed</p>
              )}
            </div>
          )}

          {activeTab === 'manuals' && (
            <div className="manuals-tab">
              {manuals.length > 0 ? (
                <div className="manuals-grid">
                  {manuals.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="manual-card"
                    >
                      📄 Manual {idx + 1}
                      <span className="download-icon">⬇</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No manuals available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
