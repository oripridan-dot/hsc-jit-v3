import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BrandTheme } from '../styles/brandThemes';
import { brandThemes } from '../styles/brandThemes';

interface ThemeContextType {
  theme: BrandTheme | null;
  currentBrandId: string;
  applyTheme: (brandIdOrTheme: string | BrandTheme) => void;
  loadTheme: (brandId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * ThemeProvider - Manages dynamic brand theming across the app
 * Injects CSS custom properties for real-time color switching
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<BrandTheme | null>(brandThemes['roland']);
  const [currentBrandId, setCurrentBrandId] = useState('roland');

  const applyTheme = useCallback((brandIdOrTheme: string | BrandTheme) => {
    let resolvedTheme: BrandTheme | null = null;

    if (typeof brandIdOrTheme === 'string') {
      // Look up theme by brand ID
      resolvedTheme = brandThemes[brandIdOrTheme.toLowerCase()] || brandThemes['roland'];
      setCurrentBrandId(brandIdOrTheme.toLowerCase());
    } else {
      // Use provided theme object
      resolvedTheme = brandIdOrTheme;
      setCurrentBrandId(brandIdOrTheme.id || 'custom');
    }

    if (!resolvedTheme) return;

    // Inject CSS custom properties into document root
    const root = document.documentElement;
    
    root.style.setProperty('--color-brand-primary', resolvedTheme.colors.primary);
    root.style.setProperty('--color-brand-secondary', resolvedTheme.colors.secondary);
    root.style.setProperty('--color-brand-accent', resolvedTheme.colors.accent);
    root.style.setProperty('--color-brand-background', resolvedTheme.colors.background);
    root.style.setProperty('--color-brand-text', resolvedTheme.colors.text);
    
    // Set data attribute for CSS selectors
    document.body.setAttribute('data-brand', currentBrandId);
    
    setTheme(resolvedTheme);

    // Log theme change in development
    if (import.meta.env.DEV) {
      console.log(`🎨 Theme applied: ${resolvedTheme.name}`);
    }
  }, [currentBrandId]);

  const loadTheme = useCallback(async (brandId: string) => {
    try {
      // In the current implementation, all themes are pre-loaded
      // In the future, this could fetch from /api/theme/{brandId}
      applyTheme(brandId);
    } catch (error) {
      console.error(`❌ Failed to load theme for brand ${brandId}:`, error);
      // Fallback to Roland
      applyTheme('roland');
    }
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, currentBrandId, applyTheme, loadTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme - Hook to access current theme and apply new themes
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
