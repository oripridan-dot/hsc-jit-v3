/**
 * Unit Tests: Navigation Store
 * Tests state management for navigation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useNavigationStore } from '../../src/store/navigationStore';
import { mockProduct, mockProducts } from '../fixtures/mockData';
import type { Product } from '../../src/types';

describe('navigationStore - State Management', () => {
    beforeEach(() => {
        // Reset store state before each test
        const store = useNavigationStore.getState();
        store.reset();
    });

    describe('Navigation state', () => {
        it('should initialize with correct default state', () => {
            const state = useNavigationStore.getState();

            expect(state.currentLevel).toBe('galaxy');
            expect(state.activePath).toEqual([]);
            expect(state.selectedProduct).toBeNull();
            expect(state.searchQuery).toBe('');
        });

        it('should warp to different levels', () => {
            const { warpTo } = useNavigationStore.getState();

            warpTo('brand', ['Home', 'Roland']);

            const state = useNavigationStore.getState();
            expect(state.currentLevel).toBe('brand');
            expect(state.activePath).toEqual(['Home', 'Roland']);
            expect(state.selectedProduct).toBeNull();
        });
    });

    describe('Product selection', () => {
        it('should select a product', () => {
            const { selectProduct } = useNavigationStore.getState();

            selectProduct(mockProduct);

            const state = useNavigationStore.getState();
            expect(state.selectedProduct).toEqual(mockProduct);
            expect(state.currentLevel).toBe('product');
        });

        it('should clear selection when warping', () => {
            const { selectProduct, warpTo } = useNavigationStore.getState();

            selectProduct(mockProduct);
            expect(useNavigationStore.getState().selectedProduct).not.toBeNull();

            warpTo('brand', ['Home', 'Roland']);
            expect(useNavigationStore.getState().selectedProduct).toBeNull();
        });
    });

    describe('Navigation back', () => {
        it('should go back one level', () => {
            const { warpTo, goBack } = useNavigationStore.getState();

            warpTo('family', ['Home', 'Roland', 'Drums']);
            expect(useNavigationStore.getState().currentLevel).toBe('family');

            goBack();
            const state = useNavigationStore.getState();
            expect(state.currentLevel).toBe('brand');
            expect(state.activePath).toEqual(['Home', 'Roland']);
        });

        it('should not go back from galaxy', () => {
            const { goBack } = useNavigationStore.getState();

            goBack();

            const state = useNavigationStore.getState();
            expect(state.currentLevel).toBe('galaxy');
            expect(state.activePath).toEqual([]);
        });
    });

    describe('Node expansion', () => {
        it('should toggle node expansion', () => {
            const { toggleNode } = useNavigationStore.getState();

            const nodeId = 'test-node-1';
            expect(useNavigationStore.getState().expandedNodes.has(nodeId)).toBe(false);

            toggleNode(nodeId);
            expect(useNavigationStore.getState().expandedNodes.has(nodeId)).toBe(true);

            toggleNode(nodeId);
            expect(useNavigationStore.getState().expandedNodes.has(nodeId)).toBe(false);
        });

        it('should handle multiple expanded nodes', () => {
            const { toggleNode } = useNavigationStore.getState();

            const nodes = ['node-1', 'node-2', 'node-3'];
            nodes.forEach(node => toggleNode(node));

            const expandedNodes = useNavigationStore.getState().expandedNodes;
            nodes.forEach(node => {
                expect(expandedNodes.has(node)).toBe(true);
            });
        });
    });

    describe('Search functionality', () => {
        it('should set search query', () => {
            const { setSearch } = useNavigationStore.getState();

            setSearch('TD-17');

            const state = useNavigationStore.getState();
            expect(state.searchQuery).toBe('TD-17');
        });

        it('should clear search on reset', () => {
            const { setSearch, reset } = useNavigationStore.getState();

            setSearch('test query');
            expect(useNavigationStore.getState().searchQuery).toBe('test query');

            reset();
            expect(useNavigationStore.getState().searchQuery).toBe('');
        });
    });

    describe('Reset functionality', () => {
        it('should reset all state to defaults', () => {
            const store = useNavigationStore.getState();

            // Populate state
            store.warpTo('family', ['Home', 'Roland', 'Drums']);
            store.selectProduct(mockProduct);
            store.toggleNode('node-1');
            store.setSearch('test');

            // Reset
            store.reset();

            const resetState = useNavigationStore.getState();
            expect(resetState.currentLevel).toBe('galaxy');
            expect(resetState.activePath).toEqual([]);
            expect(resetState.selectedProduct).toBeNull();
            expect(resetState.searchQuery).toBe('');
            expect(resetState.expandedNodes.size).toBe(0);
        });
    });
});
