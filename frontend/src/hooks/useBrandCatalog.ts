/**
 * useBrandCatalog - Load and cache brand product catalog
 * Fetches pre-built JSON catalog for a specific brand
 */
import { useState, useEffect } from 'react';
import { catalogLoader, type BrandCatalog } from '../lib/catalogLoader';

/**
 * Hook to load brand catalog by brand ID
 * @param brandId - Brand identifier (e.g., 'roland', 'boss', 'nord', 'moog')
 * @returns BrandCatalog with products, or null if loading/error
 */
export const useBrandCatalog = (brandId?: string): BrandCatalog | null => {
    const [catalog, setCatalog] = useState<BrandCatalog | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!brandId) {
            setCatalog(null);
            setError(null);
            return;
        }

        const loadCatalog = async () => {
            // SWR: 1. Try local storage immediately (Stale)
            const storageKey = `brand_catalog_${brandId}`;
            const cached = localStorage.getItem(storageKey);
            if (cached) {
                try {
                    setCatalog(JSON.parse(cached));
                } catch (e) {
                    console.warn(`Invalid cache for ${brandId}`, e);
                }
            }

            setLoading(true);
            setError(null);
            try {
                // SWR: 2. Fetch fresh data (Revalidate)
                const data = await catalogLoader.loadBrand(brandId);
                setCatalog(data);

                // Persist fresh data
                try {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                } catch (e) {
                    console.warn('Failed to cache catalog', e);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load catalog';
                console.error(`Error loading catalog for ${brandId}:`, err);
                // Only show error if we didn't serve from cache
                if (!cached) {
                    setError(message);
                    setCatalog(null);
                }
            } finally {
                setLoading(false);
            }
        };

        loadCatalog();
    }, [brandId]);

    return catalog;
};

/**
 * Hook to load all brand catalogs
 * @returns Map of brand ID to catalog
 */
export const useAllBrandCatalogs = () => {
    const [catalogs, setCatalogs] = useState<Map<string, BrandCatalog>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAllCatalogs = async () => {
            setLoading(true);
            setError(null);
            try {
                const index = await catalogLoader.loadIndex();
                const brandMap = new Map<string, BrandCatalog>();

                for (const brandEntry of index.brands) {
                    try {
                        const catalog = await catalogLoader.loadBrand(brandEntry.id);
                        if (catalog) {
                            brandMap.set(brandEntry.id, catalog);
                        }
                    } catch (err) {
                        console.warn(`Failed to load catalog for ${brandEntry.id}:`, err);
                    }
                }

                setCatalogs(brandMap);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load catalogs';
                setError(message);
                console.error('Error loading all catalogs:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAllCatalogs();
    }, []);

    return { catalogs, loading, error };
};
