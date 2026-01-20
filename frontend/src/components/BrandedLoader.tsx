import React from 'react';

interface BrandedLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * BrandedLoader - Animated loading spinner with brand colors
 * Uses current brand primary color via CSS custom properties
 */
export const BrandedLoader: React.FC<BrandedLoaderProps> = ({ 
  message = 'Loading...',
  size = 'md'
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      {/* Spinner */}
      <div className={`relative ${sizeMap[size]}`}>
        {/* Outer ring - subtle background */}
        <div 
          className={`absolute inset-0 rounded-full border-3 border-transparent`}
          style={{
            borderTopColor: 'var(--color-brand-primary)',
            borderRightColor: 'var(--color-brand-secondary)',
            borderBottomColor: 'var(--color-brand-accent)'
          }}
        />
        
        {/* Inner rotating ring */}
        <div 
          className={`absolute inset-0 rounded-full border-3 animate-spin`}
          style={{
            borderColor: 'transparent',
            borderTopColor: 'var(--color-brand-primary)',
            animationDuration: '1.5s'
          }}
        />
      </div>

      {/* Message */}
      {message && (
        <p className={`${textSizeMap[size]} text-[var(--color-brand-secondary)] animate-pulse font-medium`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default BrandedLoader;
