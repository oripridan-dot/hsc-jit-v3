import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Annotation {
  type: 'display' | 'button' | 'control' | 'port' | 'indicator';
  feature: string;
  description: string;
  position: 'center' | 'auto' | 'sides' | 'top' | 'bottom';
  importance: 'high' | 'medium' | 'low';
}

interface TextElement {
  text: string;
  context: 'display' | 'button' | 'menu' | 'indicator' | 'screen';
  importance: 'high' | 'medium' | 'low';
  size: 'large' | 'medium' | 'small';
}

interface TextZone {
  zone: 'center' | 'edges' | 'topleft' | 'corners';
  type: 'display' | 'buttons' | 'menu' | 'indicators';
  priority: 'high' | 'medium' | 'low';
  zoom_level: 'extra' | 'high' | 'medium';
  text_size: 'large' | 'medium' | 'small';
  items: TextElement[];
}

interface DisplayContent {
  [key: string]: string;
}

interface ZoomConfig {
  enable_extra_zoom: boolean;
  max_zoom_level: number;
  high_res_mode: boolean;
  text_rendering: 'crisp' | 'standard';
  enhancement_mode: 'text-focused' | 'balanced' | 'features-only';
}

interface EnhancementData {
  product_id: string;
  product_name: string;
  annotations: Annotation[];
  display_content: DisplayContent;
  text_elements?: { [key: string]: TextElement[] };
  text_zones?: TextZone[];
  has_enhancements: boolean;
  has_text_content?: boolean;
  text_density?: 'high' | 'medium' | 'low';
  zoom_config?: ZoomConfig;
}

interface EnhancedImageViewerProps {
  imageUrl: string;
  productName: string;
  enhancements?: EnhancementData;
  className?: string;
}

export const EnhancedImageViewer: React.FC<EnhancedImageViewerProps> = ({
  imageUrl,
  productName,
  enhancements,
}) => {
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showTextZones, setShowTextZones] = useState(false);

  const hasEnhancements = enhancements?.has_enhancements;
  const hasTextContent = enhancements?.has_text_content;
  const zoomConfig = enhancements?.zoom_config;
  const annotations = enhancements?.annotations || [];
  const displayContent = enhancements?.display_content || {};
  const textZones = enhancements?.text_zones || [];

  // Position mapping for annotations (simplified positioning algorithm)
  const getAnnotationPosition = (index: number, _total: number, position: string) => {
    const basePositions = {
      center: { top: '45%', left: '50%' },
      top: { top: '15%', left: `${30 + (index * 15)}%` },
      bottom: { bottom: '15%', left: `${30 + (index * 15)}%` },
      sides: index % 2 === 0 
        ? { top: `${30 + (index * 12)}%`, left: '10%' }
        : { top: `${30 + (index * 12)}%`, right: '10%' },
      auto: { top: `${20 + (index * 15)}%`, left: `${25 + ((index % 3) * 25)}%` },
    };

    return basePositions[position as keyof typeof basePositions] || basePositions.auto;
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-500/80 border-red-400';
      case 'medium':
        return 'bg-blue-500/80 border-blue-400';
      case 'low':
        return 'bg-green-500/80 border-green-400';
      default:
        return 'bg-blue-500/80 border-blue-400';
    }
  };

  const getZonePosition = (zone: string) => {
    const basePositions: Record<string, React.CSSProperties> = {
      center: { top: '35%', left: '25%', width: '50%', height: '30%' },
      edges: { top: '20%', left: '5%', width: '25%', height: '60%' },
      topleft: { top: '10%', left: '10%', width: '30%', height: '20%' },
      corners: { top: '80%', right: '10%', width: '20%', height: '15%' }
    };
    return basePositions[zone] || basePositions.center;
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center p-8">
      {/* Main Image Container */}
      <div className="relative group">
        <motion.img
          src={imageUrl}
          alt={productName}
          className="max-w-[85%] max-h-[75%] mx-auto object-contain drop-shadow-2xl cursor-zoom-in hover:scale-105 transition-transform duration-500 ease-out z-10"
          onClick={() => setIsZoomed(true)}
          layoutId="enhanced-product-image"
        />

        {/* Enhancement Toggle Button */}
        {hasEnhancements && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`absolute top-4 right-4 px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-xl z-20 ${
              showAnnotations
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{showAnnotations ? 'Hide Info' : 'Show Details'}</span>
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {annotations.length}
              </span>
            </div>
          </motion.button>
        )}

        {/* Text Zone Toggle (if text content available) */}
        {hasTextContent && showAnnotations && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowTextZones(!showTextZones)}
            className={`absolute top-16 right-4 px-3 py-2 rounded-full font-semibold text-xs transition-all shadow-xl z-20 ${
              showTextZones
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
            }`}
            title="Highlight text zones on device"
          >
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Text Zones</span>
            </div>
          </motion.button>
        )}

        {/* Annotations Overlay */}
        <AnimatePresence>
          {showAnnotations && annotations.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {annotations.map((annotation, index) => {
                const position = getAnnotationPosition(index, annotations.length, annotation.position);
                const isHovered = hoveredAnnotation === index;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={position}
                    className="absolute pointer-events-auto"
                  >
                    {/* Annotation Dot */}
                    <motion.div
                      className={`relative cursor-pointer`}
                      onMouseEnter={() => setHoveredAnnotation(index)}
                      onMouseLeave={() => setHoveredAnnotation(null)}
                      whileHover={{ scale: 1.2 }}
                    >
                      <div className={`w-8 h-8 rounded-full ${getImportanceColor(annotation.importance)} border-2 flex items-center justify-center shadow-lg animate-pulse`}>
                        <span className="text-white font-bold text-xs">{index + 1}</span>
                      </div>

                      {/* Annotation Popup */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.8 }}
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30"
                          >
                            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-2xl min-w-[200px] max-w-[300px]">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${annotation.importance === 'high' ? 'bg-red-400' : annotation.importance === 'medium' ? 'bg-blue-400' : 'bg-green-400'}`} />
                                <h4 className="text-white font-bold text-sm">{annotation.feature}</h4>
                              </div>
                              <p className="text-slate-300 text-xs leading-relaxed">
                                {annotation.description}
                              </p>
                              <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                                {annotation.type}
                              </div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                              <div className="border-8 border-transparent border-t-slate-900/95" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Display Content Info Panel */}
        {showAnnotations && Object.keys(displayContent).length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-lg p-4 max-w-xs shadow-2xl z-20"
          >
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Display Information
            </h3>
            <div className="space-y-2">
              {Object.entries(displayContent).map(([zone, content]) => (
                <div key={zone} className="text-xs">
                  <div className="text-blue-400 font-semibold uppercase tracking-wide">
                    {zone.replace(/_/g, ' ')}:
                  </div>
                  <div className="text-slate-300 mt-0.5">{content}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bottom hint when not showing annotations */}
        {hasEnhancements && !showAnnotations && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-widest uppercase pointer-events-none"
          >
            <span className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
              ✨ Enhanced Image Available • Click "Show Details"
            </span>
          </motion.div>
        )}
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setIsZoomed(false)}
          >
            {/* Zoom Controls */}
            <div className="absolute top-8 left-8 flex items-center gap-2 z-10 bg-slate-900/80 px-4 py-2 rounded-lg border border-white/20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(Math.max(100, zoomLevel - 10));
                }}
                className="px-3 py-1 hover:bg-white/10 rounded transition-colors text-white text-sm"
              >
                −
              </button>
              <span className="text-white font-bold w-12 text-center">{zoomLevel}%</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const maxZoom = zoomConfig?.max_zoom_level || 250;
                  setZoomLevel(Math.min(maxZoom, zoomLevel + 10));
                }}
                className="px-3 py-1 hover:bg-white/10 rounded transition-colors text-white text-sm"
              >
                +
              </button>
              {hasTextContent && (
                <div className="text-xs text-green-400 ml-2 px-2 py-1 rounded bg-green-500/20 border border-green-500/30">
                  ✓ High-Res Text
                </div>
              )}
            </div>

            {/* Zoomed Image Container */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <motion.img
                src={imageUrl}
                layoutId="enhanced-product-image"
                className="max-w-none max-h-none object-contain drop-shadow-2xl cursor-grab active:cursor-grabbing"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  filter: zoomConfig?.high_res_mode ? 'crisp-edges' : 'auto'
                }}
              />
            </div>

            {/* Text Content Overlay in Zoom */}
            {showTextZones && hasTextContent && textZones.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {textZones.map((zone, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9 }}
                    exit={{ opacity: 0 }}
                    className={`absolute border-2 rounded-lg backdrop-blur-sm p-2 ${
                      zone.priority === 'high' ? 'border-red-400 bg-red-500/10' :
                      zone.priority === 'medium' ? 'border-blue-400 bg-blue-500/10' :
                      'border-green-400 bg-green-500/10'
                    }`}
                    style={getZonePosition(zone.zone)}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-white/80 mb-1">
                      {zone.type}
                    </div>
                    <div className="space-y-1">
                      {zone.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="text-xs text-white/70 font-mono">
                          <span className={`${
                            zone.text_size === 'large' ? 'text-sm' :
                            zone.text_size === 'medium' ? 'text-xs' : 'text-[10px]'
                          } font-bold`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="absolute top-8 right-8 text-white/50 text-xs border border-white/20 px-3 py-1 rounded-full uppercase tracking-widest">
              {zoomConfig?.enable_extra_zoom ? '↔ Pan & Zoom Enabled' : 'ESC to Close'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
