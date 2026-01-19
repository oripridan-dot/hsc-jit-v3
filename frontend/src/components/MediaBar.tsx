/**
 * MediaBar - Tabbed media sidebar with images, videos, and other media types
 * Right sidebar of the Workbench showing categorized media with tab navigation
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImage, FiVideo, FiMusic, FiFile } from 'react-icons/fi';

interface MediaItem {
  type: 'image' | 'video' | 'audio' | 'pdf';
  url: string;
  title?: string;
}

interface MediaBarProps {
  images?: string[] | { url: string; title?: string }[];
  videos?: string[] | { url: string; title?: string }[];
  audio?: string[] | { url: string; title?: string }[];
  documents?: string[] | { url: string; title?: string }[];
  onMediaClick: (media: MediaItem, allMedia: MediaItem[], index: number) => void;
  onWhiteBgImageFound?: (imageUrl: string) => void;
}

type TabType = 'images' | 'videos' | 'audio' | 'documents';

export const MediaBar: React.FC<MediaBarProps> = ({
  images = [],
  videos = [],
  audio = [],
  documents = [],
  onMediaClick,
  onWhiteBgImageFound
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [barWidth, setBarWidth] = useState(384); // Default w-96 = 384px
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize media arrays
  const normalizeMedia = (items: (string | { url: string; title?: string })[]): MediaItem[] => {
    return items.map((item) => {
      if (typeof item === 'string') {
        return { type: 'image' as const, url: item };
      }
      return { ...item, type: 'image' as const };
    });
  };

  const normalizedImages = useMemo(() => {
    const normalized = normalizeMedia(images);
    // Keep scraped order - don't sort
    return normalized;
  }, [images]);
  const normalizedVideos = useMemo(() => normalizeMedia(videos), [videos]);
  const normalizedAudio = useMemo(() => normalizeMedia(audio), [audio]);
  const normalizedDocuments = useMemo(() => normalizeMedia(documents), [documents]);

  const tabs = [
    {
      id: 'images' as TabType,
      label: 'Images',
      icon: FiImage,
      items: normalizedImages,
      count: normalizedImages.length
    },
    {
      id: 'videos' as TabType,
      label: 'Videos',
      icon: FiVideo,
      items: normalizedVideos,
      count: normalizedVideos.length
    },
    {
      id: 'audio' as TabType,
      label: 'Audio',
      icon: FiMusic,
      items: normalizedAudio,
      count: normalizedAudio.length
    }
  ];

  const currentTab = tabs.find((t) => t.id === activeTab);
  const currentItems = currentTab?.items || [];

  // Detect if image has white background
  const isWhiteBackground = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Sample ~10% of pixels
    const sampleSize = Math.ceil(data.length / 40);
    let whitePixels = 0;
    
    for (let i = 0; i < data.length; i += sampleSize) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Check if pixel is white (R>240, G>240, B>240)
      if (r > 240 && g > 240 && b > 240) {
        whitePixels++;
      }
    }
    
    const whitePercentage = (whitePixels / (data.length / 4 / sampleSize)) * 100;
    return whitePercentage > 75; // More than 75% white
  };

  // Handle image load to track dimensions and detect white bg
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions(prev => ({
      ...prev,
      [img.src]: {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
    }));

    // Check for white background
    if (onWhiteBgImageFound) {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        if (isWhiteBackground(canvas)) {
          onWhiteBgImageFound(img.src);
        }
      }
    }
  };

  // Handle resize dragging
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      
      // Constrain width between 250px and 800px
      if (newWidth >= 250 && newWidth <= 800) {
        setBarWidth(newWidth);
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
  }, [isResizing]);

  // Combine all media for navigation purposes
  const allMedia = [
    ...normalizedImages.map(i => ({ ...i, type: 'image' as const })),
    ...normalizedVideos.map(i => ({ ...i, type: 'video' as const })),
    ...normalizedAudio.map(i => ({ ...i, type: 'audio' as const })),
    ...normalizedDocuments.map(i => ({ ...i, type: 'pdf' as const }))
  ];

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full relative bg-[var(--bg-panel)]/30 overflow-hidden"
      style={{ width: `${barWidth}px`, minWidth: '250px' }}
    >
      {/* Resize Handle - Left Edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/0 hover:bg-indigo-500/50 cursor-col-resize transition-colors z-30"
        onMouseDown={() => setIsResizing(true)}
        title="Drag to resize MediaBar"
      />
      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]/30">
        <div className="flex gap-0.5 p-1 flex-wrap justify-center">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const hasContent = tab.count > 0;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!hasContent}
                className={`
                  flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all relative
                  ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                      : hasContent
                      ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]/50'
                      : 'text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <TabIcon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
                {hasContent && (
                  <span className="text-[8px] ml-auto bg-black/30 px-1 py-0.5 rounded">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-indigo-500/40 scrollbar-track-slate-800/20 hover:scrollbar-thumb-indigo-500/60">
        <AnimatePresence mode="wait">
          {currentItems.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={activeTab === 'images' ? 'grid grid-cols-1 gap-2 w-full' : 'space-y-2 w-full'}
            >
              {currentItems.map((media, idx) => {
                const globalIndex = allMedia.findIndex(
                  (m) => m.url === media.url && m.type === activeTab.slice(0, -1)
                );

                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      const mediaWithType = {
                        ...media,
                        type: activeTab === 'documents' ? ('pdf' as const) : (activeTab.slice(0, -1) as 'image' | 'video' | 'audio')
                      };
                      onMediaClick(mediaWithType, allMedia, globalIndex);
                    }}
                    className="w-full text-left transition-all hover:scale-105 active:scale-95 group"
                  >
                    {activeTab === 'images' && (
                      <div 
                        className="w-full bg-[var(--bg-panel)] rounded border border-[var(--border-subtle)]/50 overflow-hidden hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md group-hover:shadow-indigo-500/20 min-h-32 flex items-center justify-center"
                        style={{
                          aspectRatio: imageDimensions[media.url] 
                            ? `${imageDimensions[media.url].width} / ${imageDimensions[media.url].height}`
                            : '1 / 1'
                        }}
                      >
                        <img
                          src={media.url}
                          alt={media.title || `Image ${idx + 1}`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 bg-black/20"
                          onLoad={handleImageLoad}
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<div class="w-full h-full flex items-center justify-center text-[10px] text-slate-500 bg-slate-900/30">Image unavailable</div>';
                            }
                          }}
                        />
                      </div>
                    )}

                    {activeTab === 'videos' && (
                      <div className="w-full aspect-video bg-[var(--bg-panel)] rounded border border-[var(--border-subtle)]/50 overflow-hidden hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md group-hover:shadow-indigo-500/20 relative group/video">
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const vid = e.currentTarget;
                            vid.style.display = 'none';
                            const parent = vid.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<div class="w-full h-full flex items-center justify-center text-[10px] text-slate-500">Video unavailable</div>';
                            }
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/video:bg-black/30 transition-colors">
                          <div className="text-white/0 group-hover/video:text-white/70 transition-colors text-2xl">
                            ▶
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'audio' && (
                      <div className="w-full bg-[var(--bg-panel)] rounded border border-[var(--border-subtle)]/50 p-2 hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md group-hover:shadow-indigo-500/20">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 flex items-center justify-center">
                            <FiMusic className="text-indigo-400" size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-[var(--text-primary)] truncate">
                              {media.title || `Audio ${idx + 1}`}
                            </p>
                            <p className="text-[8px] text-[var(--text-secondary)]">
                              Click to play
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'documents' && (
                      <div className="w-full bg-[var(--bg-panel)] rounded border border-[var(--border-subtle)]/50 p-2 hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md group-hover:shadow-indigo-500/20">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-amber-500/30 to-amber-500/10 flex items-center justify-center">
                            <FiFile className="text-amber-400" size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-[var(--text-primary)] truncate">
                              {media.title || `Document ${idx + 1}`}
                            </p>
                            <p className="text-[8px] text-[var(--text-secondary)]">
                              PDF • Tap to view
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key={`empty-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-32 flex items-center justify-center text-sm text-[var(--text-tertiary)] rounded-lg border border-dashed border-[var(--border-subtle)]"
            >
              <div className="text-center">
                <p className="text-[10px] mb-1">No {activeTab.toLowerCase()}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]/60">
                  for this product
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
