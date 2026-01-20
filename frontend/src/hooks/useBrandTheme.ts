/**
 * useBrandTheme - Dynamically apply brand colors to the UI
 * Updates CSS variables based on selected brand
 */
import { useEffect } from 'react';
import { useBrandData } from './useBrandData';

export const useBrandTheme = (brandId: string | null) => {
    const brandData = useBrandData(brandId || undefined);

    useEffect(() => {
        if (!brandData) {
            // Reset to default colors
            document.documentElement.style.setProperty('--brand-primary', '#6366f1');
            document.documentElement.style.setProperty('--brand-secondary', '#8b5cf6');
            document.documentElement.style.setProperty('--brand-accent', '#ec4899');
            document.documentElement.style.setProperty('--brand-gradient-hero', 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))');
            return;
        }

        // Apply brand colors to CSS variables
        document.documentElement.style.setProperty('--brand-primary', brandData.brandColor);
        document.documentElement.style.setProperty('--brand-secondary', brandData.secondaryColor);
        document.documentElement.style.setProperty('--brand-accent', brandData.brandColor);
        document.documentElement.style.setProperty(
            '--brand-gradient-hero',
            `linear-gradient(135deg, ${brandData.brandColor}40, ${brandData.secondaryColor}40)`
        );
    }, [brandData]);

    return brandData;
};
