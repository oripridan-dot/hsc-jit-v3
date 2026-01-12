import React, { useMemo, useState, useEffect } from 'react';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({ src, alt, fallbackSrc, className }) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const displaySrc = useMemo(() => {
    // Treat empty strings as null
    const validSrc = src?.trim() ? src : null;
    const validFallback = fallbackSrc?.trim() ? fallbackSrc : null;
    
    if (error && validFallback) {
      return validFallback;
    }
    return validSrc || validFallback || null;
  }, [error, fallbackSrc, src]);

  // Reset error and loaded state when src changes
  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [displaySrc]);

  if (!displaySrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white/80 font-bold text-2xl uppercase rounded ${className || ''}`}
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
        <div className="absolute inset-0 bg-slate-800/40 animate-pulse flex items-center justify-center" aria-hidden="true">
          <div className="text-white/60 text-xs">...</div>
        </div>
      )}
      {error && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-white/80 font-bold text-2xl uppercase rounded">
          {alt?.[0] || '?'}
        </div>
      )}
    </div>
  );
};
