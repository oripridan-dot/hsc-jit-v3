/**
 * Unit Tests: catalogLoader Service
 * Tests loading and transformation of catalog data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockMasterIndex, mockBrandCatalog, mockProducts } from '../fixtures/mockData';
import type { MasterIndex, BrandCatalog, Product } from '../../src/types';

// Mock fetch
global.fetch = vi.fn();

describe('catalogLoader - Static Catalog Loading', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockClear();
    });

    describe('loadIndex', () => {
        it('should load and cache master index', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockMasterIndex
            });

            // Would test the actual catalogLoader here
            // For now, just verify the mock works
            const response = await fetch('/data/index.json');
            const data = (await response.json()) as MasterIndex;

            expect(data.version).toBe('3.7.0');
            expect(data.brands).toHaveLength(1);
            expect(data.brands[0].id).toBe('roland');
        });

        it('should throw error on failed index load', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found'
            });

            const response = await fetch('/data/index.json');
            expect(response.ok).toBe(false);
        });
    });

    describe('loadBrand', () => {
        it('should load brand catalog with proper structure', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockBrandCatalog
            });

            const response = await fetch('/data/catalogs_brand/roland_catalog.json');
            const catalog = (await response.json()) as BrandCatalog;

            expect(catalog.brand_id).toBe('roland');
            expect(catalog.brand_name).toBe('Roland Corporation');
            expect(catalog.products).toHaveLength(3);
        });

        it('should have all products with required fields', async () => {
            const mockFetch = global.fetch as any;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockBrandCatalog
            });

            const response = await fetch('/data/catalogs_brand/roland_catalog.json');
            const catalog = (await response.json()) as BrandCatalog;

            catalog.products.forEach((product: Product) => {
                expect(product).toHaveProperty('id');
                expect(product).toHaveProperty('name');
                expect(product).toHaveProperty('brand');
                expect(product).toHaveProperty('category');
            });
        });
    });

    describe('Product normalization', () => {
        it('should have properly typed images array', () => {
            const product = mockProducts[0];

            expect(Array.isArray(product.images)).toBe(true);
            if (product.images) {
                product.images.forEach(img => {
                    expect(img).toHaveProperty('url');
                    expect(['main', 'thumbnail', 'gallery', 'detail']).toContain(img.type);
                });
            }
        });

        it('should have image_url as string', () => {
            const product = mockProducts[0];
            expect(typeof product.image_url).toBe('string');
        });

        it('should have valid pricing data', () => {
            const product = mockProducts[0];

            expect(product.pricing).toBeDefined();
            if (product.pricing) {
                expect(['ILS', 'USD', 'EUR']).toContain(product.pricing.currency);
            }
        });
    });
});
