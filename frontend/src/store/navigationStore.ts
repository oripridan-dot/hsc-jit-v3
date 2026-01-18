/**
 * Navigation Store - Mission Control State Management
 * Manages the tri-pane console: Navigator -> Workbench -> Analyst
 */
import { create } from 'zustand';

export type NavLevel = 'galaxy' | 'domain' | 'brand' | 'family' | 'product';

export interface EcosystemNode {
    name: string;
    type: 'galaxy' | 'domain' | 'brand' | 'family' | 'product';
    children?: EcosystemNode[];
    product_count?: number;
    // Product fields (when type === 'product')
    id?: string;
    brand?: string;
    category?: string;
    image_url?: string;
    price?: number;
    product_type?: 'root' | 'accessory' | 'related' | 'variation';
    accessories?: any[];
    related?: any[];
    family?: string;
}

interface NavState {
    // Current state
    currentLevel: NavLevel;
    activePath: string[]; // e.g., ["Drums", "Roland", "TD-17 Series"]
    selectedProduct: EcosystemNode | null;
    ecosystem: EcosystemNode | null;

    // UI state
    expandedNodes: Set<string>;
    searchQuery: string;

    // Actions
    warpTo: (level: NavLevel, path: string[]) => void;
    selectProduct: (product: EcosystemNode) => void;
    goBack: () => void;
    loadEcosystem: (data: EcosystemNode) => void;
    toggleNode: (nodeId: string) => void;
    setSearch: (query: string) => void;
    reset: () => void;
}

export const useNavigationStore = create<NavState>((set, get) => ({
    // Initial state
    currentLevel: 'galaxy',
    activePath: [],
    selectedProduct: null,
    ecosystem: null,
    expandedNodes: new Set<string>(),
    searchQuery: '',

    // Warp to a specific level in the hierarchy
    warpTo: (level, path) => {
        console.log(`🚀 Warping to ${level}:`, path);
        set({
            currentLevel: level,
            activePath: path,
            selectedProduct: null
        });
    },

    // Select a specific product (deepest level)
    selectProduct: (product) => {
        console.log('🎯 Product selected:', product.name);
        set({
            currentLevel: 'product',
            selectedProduct: product
        });
    },

    // Navigate back one level
    goBack: () => {
        const { currentLevel, activePath } = get();
        const newPath = activePath.slice(0, -1);

        const levelMap: Record<NavLevel, NavLevel> = {
            'product': 'family',
            'family': 'brand',
            'brand': 'domain',
            'domain': 'galaxy',
            'galaxy': 'galaxy'
        };

        const newLevel = levelMap[currentLevel];

        console.log(`⬅️  Going back: ${currentLevel} -> ${newLevel}`);
        set({
            currentLevel: newLevel,
            activePath: newPath,
            selectedProduct: null
        });
    },

    // Load the ecosystem data
    loadEcosystem: (data) => {
        console.log('🌌 Ecosystem loaded:', data.name);
        set({ ecosystem: data });
    },

    // Toggle node expansion
    toggleNode: (nodeId) => {
        const { expandedNodes } = get();
        const newExpanded = new Set(expandedNodes);

        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }

        set({ expandedNodes: newExpanded });
    },

    // Set search query
    setSearch: (query) => {
        set({ searchQuery: query });
    },

    // Reset to initial state
    reset: () => {
        set({
            currentLevel: 'galaxy',
            activePath: [],
            selectedProduct: null,
            searchQuery: '',
            expandedNodes: new Set()
        });
    }
}));
