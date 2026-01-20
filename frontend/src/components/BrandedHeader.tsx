import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * BrandedHeader - Dynamic header with brand logo and theme colors
 * Displays the active brand logo and applies brand primary color
 */
export const BrandedHeader: React.FC = () => {
  const { theme, currentBrandId } = useTheme();

  if (!theme) {
    return null;
  }

  return (
    <div
      className="h-20 border-b flex items-center justify-between px-8 bg-opacity-90 backdrop-blur-md z-30 shadow-lg flex-shrink-0 relative transition-all duration-300"
      style={{
        background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`,
        borderColor: theme.colors.primary,
      }}
    >
      {/* LEFT SECTION: Logo + Brand Name */}
      <div className="flex items-center gap-4">
        {/* Brand Logo */}
        {theme.logoUrl && (
          <div className="h-16 flex items-center">
            <img
              src={theme.logoUrl}
              alt={theme.logoAlt || theme.name}
              className="h-full max-w-xs object-contain drop-shadow-lg"
              onError={(e) => {
                // Fallback if logo fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Title and Subtitle */}
        <div>
          <h1
            className="text-2xl font-bold tracking-wide"
            style={{ color: theme.colors.text }}
          >
            {theme.name.toUpperCase()} SUPPORT CENTER
          </h1>
          <p
            className="text-xs font-mono mt-0.5"
            style={{ color: theme.colors.text, opacity: 0.85 }}
          >
            v3.7 Mission Control • {currentBrandId}
          </p>
        </div>
      </div>
    </div>
  );
};
