/**
 * Brand Themes Configuration
 * Defines color palettes and styling for each brand
 */

export interface BrandTheme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    gradients: {
        hero: string;
        card: string;
    };
}

export const brandThemes: Record<string, BrandTheme> = {
    roland: {
        id: 'roland',
        name: 'Roland',
        colors: {
            primary: '#E31E24', // Roland Red
            secondary: '#000000',
            accent: '#FFD700',
            background: '#0A0A0A',
            text: '#FFFFFF'
        },
        gradients: {
            hero: 'linear-gradient(135deg, #E31E24 0%, #8B0000 100%)',
            card: 'linear-gradient(135deg, rgba(227, 30, 36, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)'
        }
    },
    yamaha: {
        id: 'yamaha',
        name: 'Yamaha',
        colors: {
            primary: '#4B0082', // Yamaha Purple
            secondary: '#FFD700',
            accent: '#00CED1',
            background: '#0F0F23',
            text: '#FFFFFF'
        },
        gradients: {
            hero: 'linear-gradient(135deg, #4B0082 0%, #2D004D 100%)',
            card: 'linear-gradient(135deg, rgba(75, 0, 130, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)'
        }
    },
    korg: {
        id: 'korg',
        name: 'Korg',
        colors: {
            primary: '#FF6B00', // Korg Orange
            secondary: '#000000',
            accent: '#00FF00',
            background: '#0A0A0A',
            text: '#FFFFFF'
        },
        gradients: {
            hero: 'linear-gradient(135deg, #FF6B00 0%, #CC5500 100%)',
            card: 'linear-gradient(135deg, rgba(255, 107, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)'
        }
    },
    default: {
        id: 'default',
        name: 'Default',
        colors: {
            primary: '#06B6D4', // Cyan
            secondary: '#0891B2',
            accent: '#67E8F9',
            background: '#0F172A',
            text: '#F1F5F9'
        },
        gradients: {
            hero: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            card: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)'
        }
    }
};

/**
 * Get theme for a specific brand
 */
export const getBrandTheme = (brandId?: string): BrandTheme => {
    if (!brandId) return brandThemes.default;
    return brandThemes[brandId.toLowerCase()] || brandThemes.default;
};

/**
 * Apply brand theme to CSS variables
 */
export const applyBrandTheme = (brandId?: string): void => {
    const theme = getBrandTheme(brandId);
    const root = document.documentElement;

    root.style.setProperty('--brand-primary', theme.colors.primary);
    root.style.setProperty('--brand-secondary', theme.colors.secondary);
    root.style.setProperty('--brand-accent', theme.colors.accent);
    root.style.setProperty('--brand-background', theme.colors.background);
    root.style.setProperty('--brand-text', theme.colors.text);
    root.style.setProperty('--brand-gradient-hero', theme.gradients.hero);
    root.style.setProperty('--brand-gradient-card', theme.gradients.card);
};
