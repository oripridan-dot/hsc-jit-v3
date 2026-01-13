/**
 * ImageCarousel Component
 * Simple image carousel with lightbox support
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ImageCarouselProps {
  images: string[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-slate-900/50 rounded-xl flex items-center justify-center border border-slate-800">
        <p className="text-slate-400">No images available</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Main Image Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full bg-slate-900/50 rounded-xl overflow-hidden cursor-pointer border border-slate-800/50 group"
        onClick={() => setIsLightboxOpen(true)}
      >
        {/* Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={currentImage}
            alt={`Product image ${currentIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full aspect-square object-contain p-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%23cbd5e1"%3EImage not found%3C/text%3E%3C/svg%3E';
            }}
          />
        </AnimatePresence>

        {/* Zoom Hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200 pointer-events-none">
          <span className="text-slate-100/0 group-hover:text-slate-100/70 transition-colors duration-200 text-xs font-semibold">
            Click to enlarge
          </span>
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/50 text-slate-100 text-xs font-semibold">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Navigation Arrows (show on hover for multi-image) */}
        {images.length > 1 && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-400/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white"
                aria-label="Close lightbox"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image */}
              <img
                src={currentImage}
                alt="Full resolution"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%23334155" width="800" height="600"/%3E%3C/svg%3E';
                }}
              />

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-black/50 hover:bg-black/70 text-white"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-black/50 hover:bg-black/70 text-white"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-black/50 text-slate-100 text-sm font-semibold">
                {currentIndex + 1} / {images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
