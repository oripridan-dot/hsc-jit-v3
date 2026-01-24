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
  currentSubcategory: string | null; // New state for tierbar navigation
  ecosystem: EcosystemNode | null;
  navigationHistory: string[][]; // Track breadcrumb history for better UX

  // UNIFIED CATALOG STATE - Only ONE catalog loaded at a time
  currentCatalogBrand: string | null; // Brand whose catalog is currently loaded
  catalogProducts: Product[]; // Products from current catalog only
  catalogLoading: boolean;
  catalogError: string | null;

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
  selectSubcategory: (category: string, subcategory: string) => void;
  selectCategory: (brandId: string, category: string) => void;
  selectProduct: (product: Product) => void;
  selectLayer: (layerName: string) => void; // New: Navigate to hierarchical layer
  goBack: () => void;
  goHome: () => void; // New: Quick return to galaxy view
  loadEcosystem: (data: EcosystemNode) => void;
  toggleNode: (nodeId: string) => void;
  setSearch: (query: string) => void;
  setSearchResults: (results: Product[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSearchInsight: (insight: string | null) => void;
  setWhiteBgImage: (productId: string, imageUrl: string) => void;

  // UNIFIED CATALOG ACTIONS - Load single catalog per brand
  loadCatalogForBrand: (brandId: string, products: Product[]) => void;
  setCatalogLoading: (loading: boolean) => void;
  setCatalogError: (error: string | null) => void;
  clearCatalog: () => void;

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
      currentSubcategory: null,
      ecosystem: null,
      navigationHistory: [],
      expandedNodes: new Set<string>(),
      searchQuery: "",
      searchResults: [],
      isSearching: false,
      searchInsight: null,
      whiteBgImages: {},

      // UNIFIED CATALOG - Single catalog loaded at a time
      currentCatalogBrand: null,
      catalogProducts: [],
      catalogLoading: false,
      catalogError: null,

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
          currentSubcategory: null,
          activePath: [category],
          currentBrand: null,
        });
      },

      selectSubcategory: (category, subcategory) => {
        console.log("🌌 Subcategory Selected:", category, subcategory);
        set({
          currentLevel: "universal",
          selectedProduct: null,
          currentUniversalCategory: category,
          currentSubcategory: subcategory,
          activePath: [category, subcategory],
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

      // Quick return to home (galaxy view)
      goHome: () => {
        console.log("🏠 Returning to home");
        set({
          currentLevel: "galaxy",
          activePath: [],
          selectedProduct: null,
          currentBrand: null,
          currentCategory: null,
          currentUniversalCategory: null,
        });
      },

      // Navigate to a hierarchical layer (used by LayerNavigator)
      selectLayer: (layerName: string) => {
        const { currentLevel, activePath, currentBrand } = get();

        if (!currentBrand && currentLevel !== "brand") {
          console.warn("Cannot select layer without context");
          return;
        }

        // Build new path based on current context
        let newPath = activePath;
        let newLevel: NavLevel = currentLevel;

        if (currentLevel === "brand" || currentLevel === "domain") {
          // Moving from brand -> family
          newPath = [activePath[0] || "", layerName];
          newLevel = "family";
        } else if (currentLevel === "family") {
          // Moving from family -> product/subcategory
          newPath = [...activePath, layerName];
          newLevel = "product";
        }

        console.log(`📍 Selecting layer: ${layerName}`, { newPath, newLevel });
        set({
          currentLevel: newLevel,
          activePath: newPath,
          currentCategory: layerName,
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

      // UNIFIED CATALOG ACTIONS
      loadCatalogForBrand: (brandId: string, products: Product[]) => {
        console.log(
          `📦 Loading unified catalog: ${brandId} (${products.length} products)`,
        );
        set({
          currentCatalogBrand: brandId,
          catalogProducts: products,
          catalogLoading: false,
          catalogError: null,
        });
      },

      setCatalogLoading: (loading: boolean) => {
        set({ catalogLoading: loading });
      },

      setCatalogError: (error: string | null) => {
        set({ catalogError: error });
      },

      clearCatalog: () => {
        set({
          currentCatalogBrand: null,
          catalogProducts: [],
          catalogLoading: false,
          catalogError: null,
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
          currentCatalogBrand: null,
          catalogProducts: [],
          catalogLoading: false,
          catalogError: null,
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
