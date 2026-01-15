import React, { useMemo, useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageOptimization';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  preset?: 'thumbnail' | 'medium' | 'large' | 'original';
}

export const SmartImage: React.FC<SmartImageProps> = ({ 
  src, 
  alt, 
  fallbackSrc, 
  className,
  preset = 'medium' 
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const displaySrc = useMemo(() => {
    // Treat empty strings as null
    const validSrc = src?.trim() ? src : null;
    const validFallback = fallbackSrc?.trim() ? fallbackSrc : null;
    
    let imageSrc: string | null = null;
    
    if (error && validFallback) {
      imageSrc = validFallback;
    } else {
      imageSrc = validSrc || validFallback || null;
    }
    
    // Apply optimization if we have a valid source
    if (imageSrc) {
      return getOptimizedImageUrl(imageSrc, preset);
    }
    
    return null;
  }, [error, fallbackSrc, src, preset]);

  // Reset error and loaded state when src changes
  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [displaySrc]);

  if (!displaySrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 text-text-primary/80 font-bold text-2xl uppercase rounded ${className || ''}`}
      >
        {alt?.[0] || '?'}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      <img
        src={displaySrc}
        alt={alt}
        onLoad={() => {
          setLoaded(true);
          setError(false);
        }}
        onError={() => {
          console.warn(`Failed to load image: ${displaySrc}`);
          setError(true);
          setLoaded(false);
        }}
        className={`w-full h-full object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {!loaded && !error && (
        <div className="absolute inset-0 bg-bg-surface/40 animate-pulse flex items-center justify-center" aria-hidden="true">
          <div className="text-text-muted text-xs">...</div>
        </div>
      )}
      {error && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 text-text-primary/80 font-bold text-2xl uppercase rounded">
          {alt?.[0] || '?'}
        </div>
      )}
    </div>
  );
};
