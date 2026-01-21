import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBrandData } from '../../src/hooks/useBrandData';
import { catalogLoader } from '../../src/lib/catalogLoader';

// Mock catalogLoader
vi.mock('../../src/lib/catalogLoader', () => ({
    catalogLoader: {
        loadIndex: vi.fn(),
        loadBrand: vi.fn()
    }
}));

describe('useBrandData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null initially', () => {
        const { result } = renderHook(() => useBrandData('roland'));
        expect(result.current).toBeNull();
    });

    it('should load data from index.json', async () => {
        const mockIndex = {
            brands: [
                {
                    id: 'roland',
                    name: 'Roland',
                    brand_color: '#ff0000',
                    logo_url: '/logo.png',
                    product_count: 10
                }
            ]
        };

        (catalogLoader.loadIndex as any).mockResolvedValue(mockIndex);
        (catalogLoader.loadBrand as any).mockResolvedValue(null); // Fail full load for now

        const { result } = renderHook(() => useBrandData('roland'));

        await waitFor(() => {
            expect(result.current).toEqual(expect.objectContaining({
                id: 'roland',
                name: 'Roland',
                brandColor: '#ff0000',
                logoUrl: '/logo.png'
            }));
        });
    });

    it('should upgrade data from detailed catalog if available', async () => {
        const mockIndex = {
            brands: [
                { id: 'roland', name: 'Roland', brand_color: '#ff0000' }
            ]
        };
        const mockCatalog = {
            brand_identity: {
                name: 'Roland Official',
                brand_colors: { primary: '#aa0000', secondary: '#00aa00' },
                logo_url: '/better-logo.png',
                website: 'https://roland.com'
            }
        };

        (catalogLoader.loadIndex as any).mockResolvedValue(mockIndex);
        (catalogLoader.loadBrand as any).mockResolvedValue(mockCatalog);

        const { result } = renderHook(() => useBrandData('roland'));

        // First it should load index data (basic)
        await waitFor(() => expect(result.current).not.toBeNull());

        // Then it should upgrade to rich data
        await waitFor(() => {
            expect(result.current).toEqual(expect.objectContaining({
                name: 'Roland Official', // Upgraded name
                brandColor: '#aa0000',   // Upgraded color
                logoUrl: '/better-logo.png' 
            }));
        });
    });

    it('should handle missing brand gracefully', async () => {
        (catalogLoader.loadIndex as any).mockResolvedValue({ brands: [] });
        const { result } = renderHook(() => useBrandData('unknown'));
        // wait for effect
        await waitFor(() => {}, { timeout: 100 }); 
        expect(result.current).toBeNull();
    });
});
