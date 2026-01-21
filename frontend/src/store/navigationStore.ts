/**
 * Navigation Store - Mission Control State Management
 * Manages the tri-pane console: Navigator -> Workbench -> Analyst
 * ✅ PERSISTENT: User navigation state survives page refresh
 *
 * STATE MACHINE: Galaxy → Brand → Category (Family) → Product
 */
import type { StateCreator } from "zustand";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BrandIdentity,
  NavLevel,
  Product,
  ProductRelationship,
} from "../types";

export type { NavLevel } from "../types";

/**
 * Extended ecosystem node for tree navigation
 */
export interface EcosystemNode {
  id: string;
  name: string;
  type: NavLevel;
  children?: EcosystemNode[];
  product_count?: number;
  // Product fields (when type === 'product')
  product?: Product;
  product_type?: "root" | "accessory" | "related" | "variation";
  accessories?: ProductRelationship[];
  related?: ProductRelationship[];
  family?: string;
}

interface NavState {
  // Current state
  viewMode: "brand" | "category"; // New Toggle
  currentLevel: NavLevel;
  activePath: string[]; // e.g., ["roland", "Keyboards", "TR-08"]
  selectedProduct: Product | null;
  currentBrand: BrandIdentity | null;
  currentCategory: string | null;
  currentUniversalCategory: string | null;
  ecosystem: EcosystemNode | null;

  // UI state
  expandedNodes: Set<string>;
  searchQuery: string;
  whiteBgImages: Record<string, string>; // productId -> imageUrl mapping
  searchResults: Product[];
  isSearching: boolean;
  searchInsight: string | null;

  // Actions
  toggleViewMode: () => void;
  warpTo: (level: NavLevel, path: string[]) => void;
  selectBrand: (brandId: string) => void;
  selectUniversalCategory: (category: string) => void;
  selectCategory: (brandId: string, category: string) => void;
  selectProduct: (product: Product) => void;
  goBack: () => void;
  loadEcosystem: (data: EcosystemNode) => void;
  toggleNode: (nodeId: string) => void;
  setSearch: (query: string) => void;
  setSearchResults: (results: Product[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSearchInsight: (insight: string | null) => void;
  setWhiteBgImage: (productId: string, imageUrl: string) => void;
  reset: () => void;
}

export const useNavigationStore = create<NavState>(
  persist(
    ((set, get) => ({
      // Initial state
      viewMode: "brand",
      currentLevel: "galaxy",
      activePath: [],
      selectedProduct: null,
      currentBrand: null,
      currentCategory: null,
      currentUniversalCategory: null,
      ecosystem: null,
      expandedNodes: new Set<string>(),
      searchQuery: "",
      searchResults: [],
      isSearching: false,
      searchInsight: null,
      whiteBgImages: {},

      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === "brand" ? "category" : "brand",
          // Reset selection when switching worlds to prevent confusion
          selectedProduct: null,
          currentLevel: "galaxy",
        })),

      // Warp to a specific level in the hierarchy
      warpTo: (level, path) => {
        console.log(`🚀 Warping to ${level}:`, path);
        set({
          currentLevel: level,
          activePath: path,
          selectedProduct: null,
        });
      },

      // Select a brand (Brand Level view)
      selectBrand: (brandId) => {
        console.log("🏢 Brand Selected:", brandId);
        set({
          currentLevel: "brand",
          selectedProduct: null,
          currentCategory: null,
          activePath: [brandId],
          currentBrand: { id: brandId, name: brandId },
        });
      },

      selectUniversalCategory: (category) => {
        console.log("🌌 Universal Category Selected:", category);
        set({
          currentLevel: "universal",
          selectedProduct: null,
          currentUniversalCategory: category,
          activePath: [category],
          currentBrand: null,
        });
      },

      // Select a category within a brand (Category/Family Level view)
      selectCategory: (brandId, category) => {
        console.log("📂 Category Selected:", category);
        set({
          currentLevel: "family",
          selectedProduct: null,
          currentCategory: category,
          activePath: [brandId, category],
          currentBrand: { id: brandId, name: brandId },
        });
      },

      // Select a specific product (deepest level)
      selectProduct: (product) => {
        console.log("🎯 Product selected:", product.name);
        set({
          currentLevel: "product",
          selectedProduct: product,
          currentBrand: { id: product.brand, name: product.brand },
          activePath: [product.brand, product.category, product.name],
        });
      },

      // Navigate back one level
      goBack: () => {
        const { currentLevel, activePath } = get();
        const newPath = activePath.slice(0, -1);

        const levelMap: Record<NavLevel, NavLevel> = {
          product: "family",
          family: "brand",
          brand: "domain",
          domain: "galaxy",
          galaxy: "galaxy",
          universal: "galaxy",
        };

        const newLevel = levelMap[currentLevel];

        console.log(`⬅️  Going back: ${currentLevel} -> ${newLevel}`);
        set({
          currentLevel: newLevel,
          activePath: newPath,
          selectedProduct: null,
        });
      },

      // Load the ecosystem data
      loadEcosystem: (data) => {
        console.log("🌌 Ecosystem loaded:", data.name);
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

      setSearchResults: (results) => set({ searchResults: results }),
      setIsSearching: (isSearching) => set({ isSearching }),
      setSearchInsight: (insight) => set({ searchInsight: insight }),

      // Set white background image for a product
      setWhiteBgImage: (productId, imageUrl) => {
        const { whiteBgImages } = get();
        set({
          whiteBgImages: {
            ...whiteBgImages,
            [productId]: imageUrl,
          },
        });
      },

      // Reset to initial state
      reset: () => {
        set({
          currentLevel: "galaxy",
          activePath: [],
          selectedProduct: null,
          currentBrand: null,
          currentCategory: null,
          searchQuery: "",
          searchResults: [],
          isSearching: false,
          searchInsight: null,
          expandedNodes: new Set(),
          whiteBgImages: {},
        });
      },
    })) as StateCreator<NavState>,
    {
      name: "mission-control-nav", // localStorage key
      version: 1,
      partialize: (state: NavState) =>
        ({
          // Persist navigation but not UI state (allows fresh session when closing)
          currentLevel: state.currentLevel,
          activePath: state.activePath,
          expandedNodes: Array.from(state.expandedNodes), // Convert Set to array for JSON
          // Don't persist selectedProduct as it may reference old data
        }) as Pick<NavState, "currentLevel" | "activePath">,
      merge: (persistedState: unknown, currentState: NavState): NavState => {
        const persisted =
          (persistedState as Partial<NavState> & { expandedNodes?: unknown }) ||
          {};
        return {
          ...currentState,
          currentLevel: persisted.currentLevel || currentState.currentLevel,
          activePath: persisted.activePath || currentState.activePath,
          // Ensure expandedNodes is a Set after deserialization
          expandedNodes: new Set(
            Array.isArray(persisted.expandedNodes)
              ? (persisted.expandedNodes as string[])
              : [],
          ),
        };
      },
    },
  ) as StateCreator<NavState>,
);
