import { useEffect } from 'react';
import { brandThemes } from '../styles/brandThemes';

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  text?: string;
}

/**
 * Hook to dynamically apply brand theme CSS variables
 * Makes each brand page feel unique with brand-specific colors
 * 
 * Accepts either:
 * - brandName: string (looks up in brandThemes)
 * - colors: BrandColors object (applies directly)
 */
export const useBrandTheme = (brandNameOrColors?: string | BrandColors | null) => {
    useEffect(() => {
        if (!brandNameOrColors) return;

        let theme: any;

        // If it's a string, look up in brandThemes
        if (typeof brandNameOrColors === 'string') {
            theme = brandThemes[brandNameOrColors.toLowerCase()] || brandThemes['default'];
        } else {
            // It's a colors object, use directly
            theme = {
                colors: {
                    primary: brandNameOrColors.primary,
                    secondary: brandNameOrColors.secondary,
                    accent: brandNameOrColors.accent,
                    background: brandNameOrColors.background || '#18181b',
                    text: brandNameOrColors.text || '#ffffff'
                },
                gradients: {
                    hero: `linear-gradient(135deg, ${brandNameOrColors.primary} 0%, ${brandNameOrColors.secondary} 100%)`,
                    card: `linear-gradient(135deg, rgba(${brandNameOrColors.primary}, 0.12) 0%, rgba(24, 24, 27, 0.95) 100%)`
                }
            };
        }

        const root = document.documentElement;

        // Set CSS variables for Tailwind classes (e.g. text-brand-primary, bg-brand-primary)
        root.style.setProperty('--color-brand-primary', theme.colors.primary);
        root.style.setProperty('--color-brand-secondary', theme.colors.secondary);
        root.style.setProperty('--color-brand-accent', theme.colors.accent);

        // Also set the existing brand variables for backwards compatibility
        root.style.setProperty('--brand-primary', theme.colors.primary);
        root.style.setProperty('--brand-secondary', theme.colors.secondary);
        root.style.setProperty('--brand-accent', theme.colors.accent);

        // Set background and text colors if provided
        if (theme.colors.background) {
            root.style.setProperty('--brand-background', theme.colors.background);
        }
        if (theme.colors.text) {
            root.style.setProperty('--brand-text', theme.colors.text);
        }

        // Optional: Set gradient variables
        root.style.setProperty('--brand-gradient-hero', theme.gradients.hero);
        root.style.setProperty('--brand-gradient-card', theme.gradients.card);

        // Cleanup: restore defaults when component unmounts
        return () => {
            const defaultTheme = brandThemes['default'];
            root.style.setProperty('--color-brand-primary', defaultTheme.colors.primary);
            root.style.setProperty('--color-brand-secondary', defaultTheme.colors.secondary);
            root.style.setProperty('--color-brand-accent', defaultTheme.colors.accent);
            root.style.setProperty('--brand-primary', defaultTheme.colors.primary);
            root.style.setProperty('--brand-secondary', defaultTheme.colors.secondary);
            root.style.setProperty('--brand-accent', defaultTheme.colors.accent);
        };
    }, [brandNameOrColors]);
};
