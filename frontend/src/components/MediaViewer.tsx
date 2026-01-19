/**
 * MediaViewer - Expandable Media Popup with Zoom
 * Displays images, videos, and other media with pan/zoom capability
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZoomIn, FiZoomOut } from 'react-icons/fi';

interface MediaItem {
  type: 'image' | 'video' | 'audio' | 'pdf';
  url: string;
  title?: string;
}

interface MediaViewerProps {
  isOpen: boolean;
  media: MediaItem | null;
  onClose: () => void;
  allMedia?: MediaItem[];
  onNavigate?: (index: number) => void;
  currentIndex?: number;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  isOpen,
  media,
  onClose,
  allMedia = [],
  onNavigate,
  currentIndex = 0
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isThumbnailDragging, setIsThumbnailDragging] = useState(false);
  const [thumbnailDragStart, setThumbnailDragStart] = useState({ x: 0, scrollX: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Reset zoom and pan when media changes
  useEffect(() => {
    return () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
  }, [media?.url]);

  // Handle mouse wheel zoom - centered on cursor position
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(1, Math.min(5, zoom * delta));
    
    // Adjust pan to keep mouse position steady during zoom
    if (newZoom > 1) {
      const zoomDifference = newZoom - zoom;
      setPan({
        x: pan.x - (mouseX - rect.width / 2) * zoomDifference * 0.1,
        y: pan.y - (mouseY - rect.height / 2) * zoomDifference * 0.1
      });
    }
    
    setZoom(newZoom);
  };

  // Handle pinch zoom (touch)
  const handleTouchStart = useRef<number | null>(null);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      if (handleTouchStart.current === null) {
        handleTouchStart.current = distance;
      } else {
        const delta = distance / handleTouchStart.current;
        const newZoom = Math.max(1, Math.min(5, zoom * delta));
        setZoom(newZoom);
        handleTouchStart.current = distance;
      }
    }
  };

  // Handle mouse drag/pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsThumbnailDragging(false);
  };

  // Handle thumbnail bar drag
  const handleThumbnailMouseDown = (e: React.MouseEvent) => {
    setIsThumbnailDragging(true);
    const scrollContainer = thumbnailContainerRef.current;
    if (!scrollContainer) return;
    setThumbnailDragStart({
      x: e.clientX,
      scrollX: scrollContainer.scrollLeft
    });
  };

  const handleThumbnailMouseMove = (e: React.MouseEvent) => {
    if (!isThumbnailDragging || !thumbnailContainerRef.current) return;
    const delta = e.clientX - thumbnailDragStart.x;
    thumbnailContainerRef.current.scrollLeft = thumbnailDragStart.scrollX - delta;
  };

  const handleThumbnailMouseUp = () => {
    setIsThumbnailDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, prev + 0.2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(1, prev - 0.2));
  };

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Handle keyboard zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') {
        e.preventDefault();
        setZoom(prev => Math.min(5, prev + 0.2));
      } else if (e.key === '-' || e.key === '_' || e.key === 'ArrowDown') {
        e.preventDefault();
        setZoom(prev => Math.max(1, prev - 0.2));
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleReset]);

  // Handle double-click to zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || media?.type !== 'image') return;
    
    if (zoom === 1) {
      // Zoom to 2x centered on click point
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setPan({
        x: -(mouseX - rect.width / 2) * 0.5,
        y: -(mouseY - rect.height / 2) * 0.5
      });
      setZoom(2);
    } else {
      // Reset zoom
      handleReset();
    }
  };

  // Track mouse position for zoom centering
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    handleMouseMove(e);
  };

  if (!isOpen || !media) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        {/* Media Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-7xl bg-black rounded-xl overflow-hidden shadow-2xl"
          style={{ height: 'clamp(400px, 90vh, 95vh)' }}
        >
          {/* Header with Controls */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">
                {media.title || `${media.type.charAt(0).toUpperCase() + media.type.slice(1)} ${currentIndex + 1}/${allMedia.length}`}
              </h3>
            </div>

            {/* Zoom Controls - for images only */}
            {media.type === 'image' && (
              <div className="flex items-center gap-2 bg-black/50 rounded-lg p-2">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
                  title="Zoom out (- key)"
                >
                  <FiZoomOut size={18} />
                </button>
                <div className="text-xs text-white/70 w-12 text-center font-mono">
                  {Math.round(zoom * 100)}%
                </div>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-white/20 rounded transition-colors text-white"
                  title="Zoom in (+ key)"
                >
                  <FiZoomIn size={18} />
                </button>
                <div className="w-px h-6 bg-white/20" />
                <button
                  onClick={handleReset}
                  className="px-2 py-1 text-xs text-white/70 hover:text-white hover:bg-white/20 rounded transition-colors"
                  title="Reset zoom (0 key)"
                >
                  Reset
                </button>
                <span className="text-[10px] text-white/50 ml-1 hidden sm:inline">
                  Double-click to zoom
                </span>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Close"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Media Content */}
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center overflow-hidden bg-black cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => (handleTouchStart.current = null)}
          >
            {media.type === 'image' && (
              <motion.img
                ref={imageRef}
                src={media.url}
                alt={media.title || 'Media'}
                className="cursor-grab active:cursor-grabbing object-contain object-center"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  scale: zoom,
                  x: pan.x,
                  y: pan.y,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
                drag={zoom > 1}
                dragConstraints={containerRef}
                dragElastic={0.2}
                decoding="async"
                onDragStart={() => setIsDragging(true)}
                onDrag={(_e, info) => {
                  setPan({ x: info.offset.x, y: info.offset.y });
                }}
                onDragEnd={() => setIsDragging(false)}
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent) {
                    parent.innerHTML =
                      '<div class="text-white/50 text-sm">Image failed to load</div>';
                  }
                }}
              />
            )}

            {media.type === 'video' && (
              <video
                src={media.url}
                controls
                className="w-full h-full object-contain object-center"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                autoPlay
              />
            )}

            {media.type === 'audio' && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-6xl">🎵</div>
                <audio src={media.url} controls autoPlay className="w-64" />
              </div>
            )}

            {media.type === 'pdf' && (
              <div className="flex flex-col items-center gap-4 text-white/50">
                <div className="text-6xl">📄</div>
                <p className="text-sm">PDF viewer coming soon</p>
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  Download PDF
                </a>
              </div>
            )}
          </div>

          {/* Navigation - if multiple media items */}
          {allMedia.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-4xl px-4 w-full">
              <div 
                ref={thumbnailContainerRef}
                className="flex gap-2 bg-black/90 backdrop-blur-lg rounded-xl p-3 overflow-x-auto overflow-y-hidden scrollbar-thin shadow-2xl select-none cursor-grab active:cursor-grabbing max-h-32"
                onMouseDown={handleThumbnailMouseDown}
                onMouseMove={handleThumbnailMouseMove}
                onMouseUp={handleThumbnailMouseUp}
                onMouseLeave={handleThumbnailMouseUp}
              >
                {allMedia.map((mediaItem, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => {
                      onNavigate?.(idx);
                      // Reset zoom and pan when navigating to new image
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentIndex
                        ? 'border-indigo-400 scale-110 shadow-lg shadow-indigo-500/50 ring-2 ring-indigo-500/30'
                        : 'border-white/20 hover:border-white/50 opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                    whileHover={{ scale: 0.95 }}
                  >
                    <img
                      src={mediaItem.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
