/**
 * useBrandData - Fetch brand information from metadata
 * Gets brand colors and logos from the scraped data
 */
import { useState, useEffect } from 'react';

export interface BrandData {
    id: string;
    name: string;
    brandColor: string;
    secondaryColor: string;
    textColor: string;
    logoUrl: string;
    website?: string;
    description?: string;
}

const BRAND_METADATA: Record<string, BrandData> = {
    roland: {
        id: 'roland',
        name: 'Roland Corporation',
        brandColor: '#ED1C24',
        secondaryColor: '#FFA500',
        textColor: '#FFFFFF',
        logoUrl: 'https://static.roland.com/assets/images/logo_roland.svg',
        website: 'https://www.roland.com',
        description: 'Leading manufacturer of electronic musical instruments and music production equipment.'
    },
    nord: {
        id: 'nord',
        name: 'Nord Keyboards',
        brandColor: '#1F4E78',
        secondaryColor: '#4472C4',
        textColor: '#FFFFFF',
        logoUrl: 'https://www.nordkeyboards.com/sites/default/files/files/nord-logo.svg',
        website: 'https://www.nordkeyboards.com',
        description: 'Swedish manufacturer of premium synthesizers and stage keyboards.'
    },
    moog: {
        id: 'moog',
        name: 'Moog Music',
        brandColor: '#FFB81C',
        secondaryColor: '#F4A460',
        textColor: '#000000',
        logoUrl: 'https://www.moogmusic.com/sites/default/files/moog_logo.svg',
        website: 'https://www.moogmusic.com',
        description: 'Iconic synthesizer manufacturer pioneering analog synthesis.'
    },
    korg: {
        id: 'korg',
        name: 'Korg',
        brandColor: '#000000',
        secondaryColor: '#FF6B35',
        textColor: '#FFFFFF',
        logoUrl: 'https://www.korg.com/static/korg_logo.svg',
        website: 'https://www.korg.com',
        description: 'Innovative Japanese manufacturer of synthesizers, drums, and music production tools.'
    },
    yamaha: {
        id: 'yamaha',
        name: 'Yamaha Corporation',
        brandColor: '#003DA5',
        secondaryColor: '#0066CC',
        textColor: '#FFFFFF',
        logoUrl: 'https://www.yamahasynth.com/images/logo.svg',
        website: 'https://www.yamaha.com',
        description: 'World-renowned manufacturer of musical instruments and audio equipment.'
    },
    boss: {
        id: 'boss',
        name: 'Boss (Roland)',
        brandColor: '#000000',
        secondaryColor: '#FFD700',
        textColor: '#FFFFFF',
        logoUrl: 'https://www.boss.info/static/boss_logo.svg',
        website: 'https://www.boss.info',
        description: 'Roland\'s effects and stompbox division, leader in guitar effects.'
    }
};

/**
 * useBrandData - Get brand metadata by brand name
 * @param brandName - Product brand name (e.g., "Roland", "Yamaha")
 * @returns Brand data including colors and logo
 */
export const useBrandData = (brandName?: string): BrandData | null => {
    const [brandData, setBrandData] = useState<BrandData | null>(null);

    useEffect(() => {
        if (!brandName) {
            setBrandData(null);
            return;
        }

        // Normalize brand name to lowercase for lookup
        const normalizedBrand = brandName.toLowerCase()
            .replace(/\s+/g, '')
            .trim();

        // Try exact match first
        let data: BrandData | null = BRAND_METADATA[normalizedBrand] || null;

        // Try partial matching
        if (!data) {
            const key = Object.keys(BRAND_METADATA).find(
                k => normalizedBrand.includes(k) || k.includes(normalizedBrand)
            );
            data = key ? BRAND_METADATA[key] : null;
        }

        setBrandData(data);
    }, [brandName]);

    return brandData;
};

/**
 * getBrandDataSync - Synchronously get brand metadata
 * Useful when you need data immediately without hooks
 */
export const getBrandDataSync = (brandName?: string): BrandData | null => {
    if (!brandName) return null;

    const normalizedBrand = brandName.toLowerCase()
        .replace(/\s+/g, '')
        .trim();

    let data: BrandData | null = BRAND_METADATA[normalizedBrand] || null;

    if (!data) {
        const key = Object.keys(BRAND_METADATA).find(
            k => normalizedBrand.includes(k) || k.includes(normalizedBrand)
        );
        data = key ? BRAND_METADATA[key] : null;
    }

    return data;
};
