import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedImageUrl } from '../utils/imageOptimization';

interface ImageGalleryProps {
  images: string[];
  mainImage?: string;
  onImageSelect?: (url: string) => void;
  enhanced?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onImageSelect,
  enhanced = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Notify parent when selection changes
  useEffect(() => {
    if (onImageSelect) {
      onImageSelect(images[selectedIndex]);
    }
  }, [selectedIndex, images, onImageSelect]);

  const handleSelectThumbnail = (idx: number) => {
    setSelectedIndex(idx);
  };

  if (!images || images.length === 0) return null;

  const productName = 'Product'; // Can be passed as prop if needed

  return (
    <div className="flex flex-col gap-4">
      {/* Main "Cinema Mode" Hero Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-50 dark:bg-neutral-900 shadow-sm border border-gray-100 dark:border-white/5">
        <AnimatePresence mode='wait'>
          <motion.img
            key={images[selectedIndex]}
            src={getOptimizedImageUrl(images[selectedIndex], 'large')}
            alt={`${productName} view ${selectedIndex + 1}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 h-full w-full object-contain p-4 z-10"
          />
        </AnimatePresence>
        
        {/* Vivid Backdrop Blur Effect */}
        <div 
          className="absolute inset-0 -z-10 blur-3xl opacity-20 dark:opacity-30 transition-all duration-400"
          style={{
            backgroundImage: `url(${getOptimizedImageUrl(images[selectedIndex], 'thumbnail')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Enhancement Badge */}
        {enhanced && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-accent-success/20 backdrop-blur-sm border border-accent-success/30 rounded-full px-3 py-1 text-xs font-semibold text-accent-success"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            AI Enhanced
          </motion.div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectThumbnail(idx)}
              className={`relative flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                selectedIndex === idx 
                  ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-105' 
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img 
                src={getOptimizedImageUrl(img, 'thumbnail')} 
                alt="" 
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{selectedIndex + 1} / {images.length}</span>
        {enhanced && (
          <span className="text-accent-success">✨ Enhanced</span>
        )}
      </div>
    </div>
  );
};
