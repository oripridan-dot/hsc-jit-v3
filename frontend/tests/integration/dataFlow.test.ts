/**
 * Integration Tests: Data Flow
 * Tests the complete flow from catalog loading to UI state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockBrandCatalog, mockProducts } from '../fixtures/mockData';
import { useNavigationStore } from '../../src/store/navigationStore';
import type { Product, BrandCatalog } from '../../src/types';

describe('Data Flow Integration', () => {
    beforeEach(() => {
        // Reset store
        const store = useNavigationStore.getState();
        store.reset();
        vi.clearAllMocks();
    });

    describe('Catalog Loading → Navigation Population', () => {
        it('should load catalog and build navigation tree', () => {
            // Simulate loading catalog
            const catalog: BrandCatalog = mockBrandCatalog;

            // Build navigation hierarchy
            const categoryMap = new Map<string, Product[]>();

            catalog.products.forEach(product => {
                const category = product.category || 'Uncategorized';
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, []);
                }
                categoryMap.get(category)!.push(product);
            });

            // Verify structure
            expect(categoryMap.size).toBeGreaterThan(0);

            categoryMap.forEach((products, category) => {
                expect(products.length).toBeGreaterThan(0);
                expect(products.every(p => p.category === category)).toBe(true);
            });
        });

        it('should filter products by category for navigation', () => {
            const drums = mockProducts.filter(p => p.category === 'Electronic Drums');
            const synths = mockProducts.filter(p => p.category === 'Synthesizers');

            expect(drums.length).toBeGreaterThan(0);
            expect(synths.length).toBeGreaterThan(0);
            expect(drums.length + synths.length).toBeLessThanOrEqual(mockProducts.length);
        });
    });

    describe('Navigation → Product Selection → Display', () => {
        it('should navigate and select product for display', () => {
            const { warpTo, selectProduct } = useNavigationStore.getState();

            // Navigate to brand
            warpTo('brand', ['Home', 'Roland']);
            expect(useNavigationStore.getState().currentLevel).toBe('brand');

            // Navigate to category
            warpTo('family', ['Home', 'Roland', 'Electronic Drums']);
            expect(useNavigationStore.getState().currentLevel).toBe('family');

            // Select product
            selectProduct(mockProducts[0]);
            const state = useNavigationStore.getState();

            expect(state.selectedProduct).toEqual(mockProducts[0]);
            expect(state.currentLevel).toBe('product');
        });
    });

    describe('Search → Result Filtering → Navigation', () => {
        it('should search products and update results', () => {
            const { setSearch } = useNavigationStore.getState();

            setSearch('drums');
            expect(useNavigationStore.getState().searchQuery).toBe('drums');

            // Filter results
            const searchResults = mockProducts.filter(p =>
                p.name.toLowerCase().includes('drums') ||
                p.category?.toLowerCase().includes('drums')
            );

            expect(searchResults.length).toBeGreaterThan(0);
        });

        it('should navigate to search result', () => {
            const { setSearch, selectProduct } = useNavigationStore.getState();
            const searchTerm = 'TD-17';

            setSearch(searchTerm);

            // Find matching product
            const searchResult = mockProducts.find(p =>
                p.name.includes(searchTerm)
            );

            if (searchResult) {
                selectProduct(searchResult);
                const state = useNavigationStore.getState();

                expect(state.selectedProduct).toEqual(searchResult);
                expect(state.currentLevel).toBe('product');
            }
        });
    });

    describe('Breadcrumb Navigation', () => {
        it('should build correct breadcrumb path', () => {
            const { warpTo } = useNavigationStore.getState();

            const path = ['Home', 'Roland', 'Electronic Drums', 'TD-17 Series'];
            warpTo('family', path);

            const state = useNavigationStore.getState();
            expect(state.activePath).toEqual(path);
        });

        it('should navigate back through breadcrumbs', () => {
            const { warpTo, goBack } = useNavigationStore.getState();

            warpTo('family', ['Home', 'Roland', 'Electronic Drums']);
            expect(useNavigationStore.getState().activePath).toHaveLength(3);

            goBack();
            expect(useNavigationStore.getState().activePath).toHaveLength(2);

            goBack();
            expect(useNavigationStore.getState().activePath).toHaveLength(1);

            goBack();
            expect(useNavigationStore.getState().activePath).toHaveLength(0);
        });
    });

    describe('Data Consistency', () => {
        it('should maintain product data integrity through navigation', () => {
            const originalProduct = mockProducts[0];
            const { selectProduct } = useNavigationStore.getState();

            selectProduct(originalProduct);

            const selectedProduct = useNavigationStore.getState().selectedProduct;

            expect(selectedProduct?.id).toBe(originalProduct.id);
            expect(selectedProduct?.name).toBe(originalProduct.name);
            expect(selectedProduct?.brand).toBe(originalProduct.brand);
            expect(selectedProduct?.images).toEqual(originalProduct.images);
            expect(selectedProduct?.pricing).toEqual(originalProduct.pricing);
        });

        it('should have consistent product structure', () => {
            mockProducts.forEach(product => {
                // Required fields
                expect(product.id).toBeDefined();
                expect(product.name).toBeDefined();
                expect(product.brand).toBeDefined();
                expect(product.category).toBeDefined();

                // Optional but important fields should be properly typed
                if (product.images) {
                    expect(Array.isArray(product.images)).toBe(true);
                }
                if (product.pricing) {
                    expect(product.pricing.currency).toBeDefined();
                }
            });
        });
    });
});
