import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface InspectionLensProps {
  thumbnailUrl: string; // The lightweight optimized image
  inspectionUrl: string; // The heavy enhanced image
  label?: string; // e.g. "Rear Panel - Inputs"
}

export const InspectionLens: React.FC<InspectionLensProps> = ({ 
  thumbnailUrl, 
  inspectionUrl, 
  label 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x, y });
  };

  return (
    <div className="relative group w-full h-full flex flex-col">
      {/* Label Context */}
      {label && (
        <div className="absolute top-4 left-4 z-20 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] text-white/70 font-mono uppercase border border-white/10">
          Inspection: {label}
        </div>
      )}

      <div 
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-panel)] cursor-crosshair"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        {/* LAYER 1: Lightweight Thumbnail (Always Visible) */}
        <img 
          src={thumbnailUrl} 
          className="w-full h-full object-contain p-8 opacity-100 transition-opacity" 
          alt="Product Overview"
        />

        {/* LAYER 2: The Lens (JIT Visual) */}
        {isHovering && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {/* This div masks the high-res image to creating a "Spotlight" effect */}
            <div 
              className="absolute w-64 h-64 rounded-full border-2 border-[var(--brand-primary)] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-black"
              style={{ 
                left: `calc(${lensPos.x}% - 8rem)`, 
                top: `calc(${lensPos.y}% - 8rem)`,
              }}
            >
              {/* High Res Image Positioned Inverse to Mouse */}
              <img 
                src={inspectionUrl} 
                className="absolute max-w-none w-[300%] h-[300%] object-contain"
                style={{ 
                  left: `${-lensPos.x * 3 + 50}%`, 
                  top: `${-lensPos.y * 3 + 50}%` 
                }}
              />
            </div>
            
            {/* Technical Grid Overlay on Lens for "Pro" feel */}
            <div 
               className="absolute w-64 h-64 rounded-full pointer-events-none opacity-30"
               style={{ 
                left: `calc(${lensPos.x}% - 8rem)`, 
                top: `calc(${lensPos.y}% - 8rem)`,
                backgroundImage: 'radial-gradient(circle, transparent 40%, rgba(255,255,255,0.2) 100%)'
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};
