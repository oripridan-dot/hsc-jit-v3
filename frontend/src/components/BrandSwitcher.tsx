import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { brandThemes } from '../styles/brandThemes';
import { ChevronDown, Palette } from 'lucide-react';

/**
 * BrandSwitcher - Component to switch between different brand themes
 * Shows all available brands and applies theme on selection
 */
export const BrandSwitcher: React.FC = () => {
  const { theme, currentBrandId, loadTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!theme) {
    return null;
  }

  const availableBrands = Object.values(brandThemes).filter(
    (t) => t.id !== 'default'
  );

  const handleBrandChange = async (brandId: string) => {
    await loadTheme(brandId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
        style={{
          backgroundColor: theme.colors.accent,
          color: theme.colors.text,
          borderColor: theme.colors.primary,
          border: `2px solid transparent`,
        }}
      >
        <Palette size={18} />
        <span>{theme.name}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 rounded-lg shadow-2xl z-50 min-w-max overflow-hidden border"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.primary,
          }}
        >
          {availableBrands.map((brand) => {
            const isActive = currentBrandId === brand.id;

            return (
              <button
                key={brand.id}
                onClick={() => handleBrandChange(brand.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
                  isActive ? 'font-bold' : 'font-medium'
                } hover:opacity-90`}
                style={{
                  backgroundColor: isActive
                    ? brand.colors.primary
                    : 'transparent',
                  color: isActive
                    ? brand.colors.text
                    : theme.colors.text,
                  borderBottom: `1px solid ${theme.colors.primary}40`,
                }}
              >
                {/* Brand Logo Preview */}
                {brand.logoUrl && (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                {/* Brand Name and Status */}
                <div className="flex-1">
                  <div className="font-semibold">{brand.name}</div>
                  <div
                    className="text-xs opacity-75"
                    style={{
                      color: isActive
                        ? brand.colors.text
                        : theme.colors.text,
                    }}
                  >
                    {isActive && '✓ Active'}
                  </div>
                </div>

                {/* Color Indicator */}
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: brand.colors.primary,
                    borderColor: theme.colors.text,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
