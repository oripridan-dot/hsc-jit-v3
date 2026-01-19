/**
 * useRealtimeData Hook
 * Auto-updates component when catalog data changes
 * Provides real-time UI refresh for development
 */

import { useEffect, useCallback, useRef } from 'react';
import { catalogLoader } from '../lib/catalogLoader';

type DataChangeType = 'index' | 'brand';

interface UseRealtimeDataOptions {
    /**
     * Callback when data changes
     * If not provided, component will trigger re-render
     */
    onDataChange?: (type: DataChangeType, id?: string) => void;
    /**
     * Filter to only specific data types
     */
    watchTypes?: DataChangeType[];
}

/**
 * Hook for real-time data updates
 * Usage:
 * ```tsx
 * useRealtimeData({
 *   onDataChange: (type, id) => {
 *     if (type === 'index') {
 *       // Reload index
 *     } else if (type === 'brand') {
 *       // Reload brand: id
 *     }
 *   }
 * });
 * ```
 */
export function useRealtimeData(options: UseRealtimeDataOptions = {}) {
    const { onDataChange, watchTypes = ['index', 'brand'] } = options;
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Subscribe to catalog changes
        unsubscribeRef.current = catalogLoader.onDataChange((type, id) => {
            // Filter by watch types
            if (!watchTypes.includes(type)) return;

            console.log(`📡 Data updated: ${type}${id ? ` (${id})` : ''}`);

            if (onDataChange) {
                onDataChange(type, id);
            }
        });

        return () => {
            // Cleanup subscription on unmount
            unsubscribeRef.current?.();
        };
    }, [onDataChange, watchTypes]);
}

/**
 * Hook for auto-refreshing a specific brand
 */
export function useRealtimeBrand(brandId: string, onRefresh?: () => void) {
    useRealtimeData({
        watchTypes: ['brand'],
        onDataChange: (type, id) => {
            if (type === 'brand' && id === brandId) {
                console.log(`🔄 Refreshing brand: ${brandId}`);
                onRefresh?.();
            }
        }
    });
}

/**
 * Hook for auto-refreshing the brand index
 */
export function useRealtimeIndex(onRefresh?: () => void) {
    useRealtimeData({
        watchTypes: ['index'],
        onDataChange: (type) => {
            if (type === 'index') {
                console.log('🔄 Refreshing index');
                onRefresh?.();
            }
        }
    });
}
