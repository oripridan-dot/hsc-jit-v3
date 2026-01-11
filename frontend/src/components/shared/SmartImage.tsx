import React, { useMemo, useState } from 'react';

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
    if (error) {
      return fallbackSrc || null;
    }
    // Treat empty strings as null
    const validSrc = src?.trim() ? src : null;
    const validFallback = fallbackSrc?.trim() ? fallbackSrc : null;
    return validSrc || validFallback || null;
  }, [error, fallbackSrc, src]);

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
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        crossOrigin="anonymous"
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-800/40 animate-pulse flex items-center justify-center" aria-hidden="true">
          <div className="text-white/60 text-xs">Loading...</div>
        </div>
      )}
    </div>
  );
};
