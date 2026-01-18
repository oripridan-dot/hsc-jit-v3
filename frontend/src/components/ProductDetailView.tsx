import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfidenceMeter } from './ui/ConfidenceMeter';
import { PriceDisplay } from './ui/PriceDisplay';
import { Dock } from './ui/Dock';
import { ImageGallery } from './ImageGallery';
import { DualSourceBadge } from './ui/DualSourceBadge';
import { getProductClassification } from '../utils/productClassification';
import { AIImageEnhancer } from '../services/AIImageEnhancer';
import { useBrandTheme } from '../hooks/useBrandTheme';

// Image types to handle multiple formats
type ImageObject = {
  url?: string;
  main?: string;
  thumbnail?: string;
  gallery?: string[];
};

type ProductImages = string[] | ImageObject | undefined;

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    image: string;
    images?: ProductImages;
    price: number;
    description: string;
    brand: string;
    brand_identity?: {
      logo_url: string;
      hq: string;
      name: string;
      website?: string;
    };
    production_country?: string;
    category?: string;
    family?: string;
    manual_url?: string;
    score: number;
    specs: Record<string, string | number>;
    accessories?: Array<{ name: string; match?: number }>;
    related?: Array<{ name: string }>;
    full_description?: string;
  };
  onClose?: () => void;
}

// Professional Specification Grid Component
const SpecsSection = ({ specs }: { specs: Record<string, string | number> }) => {
  if (!specs || Object.keys(specs).length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-brand-primary rounded-full"></span>
        Technical Specifications
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0 border-t border-gray-100 dark:border-white/10">
        {Object.entries(specs).map(([key, value], idx) => (
          <div 
            key={key} 
            className={`flex flex-col sm:flex-row sm:justify-between py-3 px-4 border-b border-gray-100 dark:border-white/10 ${
              idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/5' : 'bg-transparent'
            }`}
          >
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide min-w-[140px]">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-gray-900 dark:text-gray-100 font-medium text-right mt-1 sm:mt-0">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProductDetailView: React.FC<ProductDetailProps> = ({ product, onClose }) => {
  // Apply dynamic brand theming
  useBrandTheme(product.brand);
  const [descExpanded, setDescExpanded] = useState(false);
  const [enhancedImages, setEnhancedImages] = useState<Map<string, string>>(new Map());
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Get image list - use useMemo to prevent dependency issues
  const images = useMemo(() => {
    // Handle array of strings or image objects (Roland format)
    if (product.images && Array.isArray(product.images)) {
      return product.images.map((img) => 
        typeof img === 'string' ? img : (img as ImageObject)?.url || ''
      ).filter(Boolean);
    }
    
    // Handle images object with main/thumbnail/gallery
    if (product.images && typeof product.images === 'object' && !Array.isArray(product.images)) {
      const imgObj = product.images as ImageObject;
      const imgs: string[] = [];
      if (imgObj.main) imgs.push(imgObj.main);
      if (imgObj.gallery && Array.isArray(imgObj.gallery)) {
        imgs.push(...imgObj.gallery);
      }
      if (imgs.length > 0) return imgs;
    }
    
    // Fallback to single image
    return product.images && Array.isArray(product.images) && product.images.length > 0 
      ? product.images as string[]
      : [product.image];
  }, [product.images, product.image]);

  // Enhance images on mount
  useEffect(() => {
    const enhanceImages = async () => {
      setIsEnhancing(true);
      const enhancer = AIImageEnhancer.getInstance();

      // Enhance all images with high priority for main image
      for (let i = 0; i < images.length; i++) {
        const priority: 'high' | 'normal' | 'low' = i === 0 ? 'high' : 'normal';
        try {
          const enhanced = await enhancer.enhanceImage(images[i], priority);
          setEnhancedImages(prev => new Map(prev).set(images[i], enhanced));
        } catch (error) {
          console.warn('Failed to enhance image:', error);
          // Fallback to original
          setEnhancedImages(prev => new Map(prev).set(images[i], images[i]));
        }
      }
      setIsEnhancing(false);
    };

    enhanceImages();
  }, [images]);

  const dockItems = [
    {
      label: "Official Manual",
      icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      href: product.manual_url,
    },
    {
      label: "Brand Website",
      icon: <svg className="w-full h-full p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" /></svg>,
      href: product.brand_identity?.website || `https://www.google.com/search?q=${product.brand}`,
    },
  ];

  const accessories = product.accessories?.length ? product.accessories : [
    { name: "Power Cable", match: 99 },
    { name: "Dust Cover", match: 85 },
    { name: "Pro Bag", match: 70 },
    { name: "Stand", match: 60 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-bg-base flex flex-col overflow-hidden font-sans text-text-primary">
      
      {/* Close Button */}
      <motion.button
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-bg-surface/80 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-bg-surface transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>

      {/* Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-none bg-gradient-to-b from-bg-base/80 to-bg-base/0 backdrop-blur-sm border-b border-border-subtle p-6 z-20"
      >
        <div className="flex items-start gap-4">
          {/* Brand Logo */}
          {product.brand_identity?.logo_url && (
            <div className="flex-none w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center p-2 border border-border-subtle">
              <img
                src={product.brand_identity.logo_url}
                alt={product.brand}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Brand with Logo inline */}
              {product.brand && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-bg-surface/50 border border-border-subtle flex-shrink-0">
                  {product.brand_identity?.logo_url && (
                    <img
                      src={product.brand_identity.logo_url}
                      alt={product.brand}
                      className="w-4 h-4 object-contain"
                    />
                  )}
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wide">{product.brand}</span>
                </div>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary truncate">
                {product.name}
              </h1>
              {product.category && (
                <span className="flex-shrink-0 px-2 py-1 rounded bg-accent-primary/20 text-accent-secondary text-xs font-medium uppercase tracking-wider">
                  {product.category}
                </span>
              )}
              {/* Dual Source Badge */}
              <DualSourceBadge 
                classification={getProductClassification(product as unknown as Record<string, unknown>)} 
                size="sm"
              />
            </div>
            <p className="text-text-muted text-sm line-clamp-2">{product.description}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {product.brand_identity?.hq && (
                <div className="text-xs text-text-muted">
                  HQ: <span className="text-text-primary font-medium">{product.brand_identity.hq}</span>
                </div>
              )}
              {product.production_country && (
                <div className="text-xs text-text-muted">
                  Made: <span className="text-text-primary font-medium">{product.production_country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price & Confidence */}
          <div className="flex-shrink-0 text-right">
            <PriceDisplay price={product.price} />
            <div className="mt-3 text-sm">
              <ConfidenceMeter score={product.score} price={product.price} />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Image Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-shrink-0 w-full md:w-[45%] lg:w-[50%] p-6 bg-gradient-to-br from-bg-surface/20 to-bg-base/40 border-r border-border-subtle flex flex-col"
        >
          <ImageGallery
            images={images}
            mainImage={images[0]}
            enhanced={!isEnhancing && enhancedImages.size > 0}
          />
        </motion.div>

        {/* Right Panel: Product Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8"
        >
          {/* Stock & Availability */}
          <section>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              Availability
            </h2>
            <div className="bg-status-success/10 border border-status-success/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-status-success animate-pulse" />
                <div>
                  <p className="text-status-success font-medium">In Stock</p>
                  <p className="text-xs text-status-success/70">Updated just now</p>
                </div>
              </div>
            </div>
          </section>

          {/* AI Confidence Metric */}
          <section>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
              AI Match Confidence
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{Math.round(product.score * 100)}%</span>
                <span className="text-xs text-text-muted">Very High</span>
              </div>
              <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${product.score * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                />
              </div>
            </div>
          </section>

          {/* Professional Technical Specifications */}
          <SpecsSection specs={product.specs} />

          {/* Full Description */}
          <section>
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="w-full flex items-center justify-between mb-4 group"
            >
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                In-Depth Analysis
              </h2>
              <motion.span
                animate={{ rotate: descExpanded ? 180 : 0 }}
                className="text-text-muted"
              >
                ▼
              </motion.span>
            </button>
            <AnimatePresence>
              {descExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="prose prose-lg dark:prose-invert max-w-none text-text-muted leading-relaxed"
                >
                  {/* Rich text description with HTML support */}
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: product.full_description || product.description 
                    }} 
                  />
                  {!product.full_description && (
                    <p className="mt-3">
                      This professional-grade equipment combines cutting-edge technology with 
                      robust engineering. Designed for demanding studio and live environments.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Ecosystem */}
          {accessories.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
                Ecosystem
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {accessories.map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="flex-shrink-0 w-32 bg-bg-surface/50 p-3 rounded-lg border border-border-subtle hover:bg-bg-surface transition cursor-pointer"
                  >
                    <div className="aspect-square bg-bg-card rounded mb-2 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-bg-surface to-bg-base" />
                      {item.match && (
                        <div className="absolute top-1 right-1 text-[9px] font-bold bg-status-success/20 text-status-success px-1.5 py-0.5 rounded">
                          {item.match}%
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </div>

      {/* Bottom Dock */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
      >
        <Dock items={dockItems} />
      </motion.div>
    </div>
  );
};
