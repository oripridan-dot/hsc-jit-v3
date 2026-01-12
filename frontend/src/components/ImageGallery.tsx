import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ImageGalleryProps {
  images: string[];
  mainImage?: string;
  onImageSelect?: (url: string) => void;
  enhanced?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  mainImage,
  onImageSelect,
  enhanced = false,
}) => {
  const [selectedImage, setSelectedImage] = useState(mainImage || images[0]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const gestureStartRef = useRef({ distance: 0 });

  const maxZoom = 4;
  const minZoom = 1;

  // Handle pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      gestureStartRef.current.distance = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scale = distance / gestureStartRef.current.distance;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * scale));

      setZoom(newZoom);
      gestureStartRef.current.distance = distance;
    }
  };

  // Handle single tap to zoom
  const handleImageClick = (e: React.MouseEvent) => {
    if (zoom === 1) {
      // Zoom to 2x at click point
      const rect = imageRef.current?.getBoundingClientRect();
      if (rect) {
        const x = -(e.clientX - rect.left);
        const y = -(e.clientY - rect.top);
        setPan({ x, y });
        setZoom(2);
      }
    } else {
      // Reset zoom
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  // Handle drag when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (imageRef.current && isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && zoom > 1) {
          const newX = e.clientX - dragStart.x;
          const newY = e.clientY - dragStart.y;

          // Constrain pan
          const maxPan = 100 * (zoom - 1);
          setPan({
            x: Math.max(-maxPan, Math.min(maxPan, newX)),
            y: Math.max(-maxPan, Math.min(maxPan, newY)),
          });
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      const ref = imageRef.current;
      ref?.addEventListener('mousemove', handleMouseMove);
      ref?.addEventListener('mouseup', handleMouseUp);
      return () => {
        ref?.removeEventListener('mousemove', handleMouseMove);
        ref?.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, zoom, dragStart]);

  const handleSelectThumbnail = (url: string) => {
    setSelectedImage(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onImageSelect?.(url);
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Image Container */}
      <div
        ref={imageRef}
        className="relative w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-700/30 group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />

        {/* Main Image */}
        <motion.div
          className="w-full h-full flex items-center justify-center"
          animate={{
            scale: zoom,
            x: pan.x,
            y: pan.y,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          onClick={handleImageClick}
        >
          <img
            src={selectedImage}
            alt="Product"
            className="max-w-full max-h-full object-contain pointer-events-none select-none"
          />
        </motion.div>

        {/* Enhancement Badge */}
        {enhanced && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 flex items-center gap-1 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-3 py-1 text-xs font-semibold text-green-300"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            AI Enhanced
          </motion.div>
        )}

        {/* Zoom Indicator */}
        {zoom > 1 && (
          <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-semibold text-blue-300">
            {zoom.toFixed(1)}x
          </div>
        )}

        {/* Click to zoom hint */}
        {zoom === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          >
            <div className="text-white text-sm font-medium">
              Tap to zoom
            </div>
          </motion.div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="w-full">
          <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth">
            {images.map((image, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleSelectThumbnail(image)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all
                  ${selectedImage === image
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-slate-700/30 hover:border-slate-600/50'
                  }
                `}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Image Info */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{images.indexOf(selectedImage) + 1} / {images.length}</span>
        <div className="flex gap-2">
          <span>Tap/pinch to zoom</span>
          {zoom > 1 && <span>• Drag to pan</span>}
        </div>
      </div>
    </div>
  );
};
