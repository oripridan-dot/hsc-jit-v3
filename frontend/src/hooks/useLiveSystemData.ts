/**
 * useLiveSystemData - Single Source of Truth
 * Provides real-time system state: catalog stats, scraping progress, health
 * All components should use this hook for consistency
 */
import { useEffect, useState } from 'react';

export interface ScrapeProgress {
    brand: string;
    status: 'idle' | 'running' | 'complete' | 'error';
    current_product: number;
    total_products: number;
    current_file: string;
    elapsed_seconds: number;
    estimated_seconds_remaining: number | null;
    errors: string[];
}

export interface SystemState {
    // Catalog
    brands: number;
    products: number;
    version: string;

    // Scraping
    scrapeProgress: ScrapeProgress | null;

    // Health
    backendOnline: boolean;
}

export const useLiveSystemData = () => {
    const [systemState, setSystemState] = useState<SystemState>({
        brands: 0,
        products: 0,
        version: '3.7-Halilit',
        scrapeProgress: null,
        backendOnline: false,
    });

    useEffect(() => {
        const updateSystemState = async () => {
            try {
                // 1. Load catalog index for brands/products count
                // Use raw fetch to avoid schema validation errors
                const indexResp = await fetch('/data/index.json').catch(() => null);
                const index = indexResp?.ok ? await indexResp.json() : null;

                if (!index) {
                    // Fallback to safe defaults if index load fails
                    console.warn('Failed to load index.json, using defaults');
                    setSystemState(prev => ({
                        ...prev,
                        backendOnline: false
                    }));
                    return;
                }

                // 2. Check backend health
                const healthResp = await fetch('/health/full', {
                    signal: AbortSignal.timeout(2000)
                }).catch(() => null);
                const backendOnline = healthResp?.ok ?? false;

                // 3. Load scraping progress if available
                const progressResp = await fetch('/data/scrape_progress.json').catch(() => null);
                const scrapeProgress = progressResp?.ok
                    ? await progressResp.json()
                    : null;

                setSystemState({
                    brands: Array.isArray(index.brands) ? index.brands.length : 0,
                    products: index.total_products ?? 0,
                    version: index.version ?? '3.7-Halilit',
                    scrapeProgress,
                    backendOnline,
                });
            } catch (error) {
                console.warn('Failed to update system state:', error);
                // Keep previous state on error
            }
        };

        // Initial load
        updateSystemState();

        // Poll every 3 seconds for scraping progress and system state

        const fastInterval = setInterval(updateSystemState, 3000);

        return () => clearInterval(fastInterval);
    }, []);

    return systemState;
};
