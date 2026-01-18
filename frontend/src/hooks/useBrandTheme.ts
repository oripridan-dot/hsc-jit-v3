import { useEffect } from 'react';
import { brandThemes } from '../styles/brandThemes';

/**
 * Hook to dynamically apply brand theme CSS variables
 * Makes each brand page feel unique with brand-specific colors
 */
export const useBrandTheme = (brandName: string) => {
    useEffect(() => {
        const theme = brandThemes[brandName.toLowerCase()] || brandThemes['default'];

        const root = document.documentElement;

        // Set CSS variables for Tailwind classes (e.g. text-brand-primary, bg-brand-primary)
        root.style.setProperty('--color-brand-primary', theme.colors.primary);
        root.style.setProperty('--color-brand-secondary', theme.colors.secondary);
        root.style.setProperty('--color-brand-accent', theme.colors.accent);

        // Also set the existing brand variables for backwards compatibility
        root.style.setProperty('--brand-primary', theme.colors.primary);
        root.style.setProperty('--brand-secondary', theme.colors.secondary);
        root.style.setProperty('--brand-accent', theme.colors.accent);

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
    }, [brandName]);
};
