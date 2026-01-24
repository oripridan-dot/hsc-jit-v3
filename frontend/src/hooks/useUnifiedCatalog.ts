/**
 * useUnifiedCatalog - Load single unified catalog with metadata & subjective fields
 *
 * ARCHITECTURE: One catalog per brand
 * ✅ Supports ADDITIVE: merge_history tracks new products
 * ✅ Supports SUBJECTIVE: user_rating, user_tags, internal_notes stored per-product
 * ✅ Metadata tracking: source, discovery_confidence, user_verified
 *
 * This replaces multi-catalog loading with a focused single-catalog approach.
 */

import { useCallback, useState } from "react";
import type { Product } from "../types";

export interface SubjectiveField {
  value: string | number | string[] | number;
  set_at: string;
  custom?: boolean;
}

export interface SubjectiveFields {
  user_rating?: SubjectiveField;
  user_tags?: SubjectiveField;
  internal_notes?: SubjectiveField;
  custom_price_nis?: SubjectiveField;
  [key: string]: SubjectiveField | undefined;
}

export interface ProductMetadata {
  added_at: string;
  source: string;
  discovery_confidence: number;
  user_verified: boolean;
}

export interface UnifiedProduct extends Product {
  _metadata?: ProductMetadata;
  subjective?: SubjectiveFields;
}

export interface BrandIdentityData {
  brand: string;
  created_at: string;
  last_updated: string;
  version: string;
  total_products: number;
  description?: string;
  logo_url?: string;
}

export interface MergeHistoryEntry {
  timestamp: string;
  source: string;
  added: number;
  updated: number;
}

export interface UnifiedCatalogData {
  brand_identity: BrandIdentityData;
  products: UnifiedProduct[];
  metadata?: {
    discovery_sources: string[];
    user_customizations?: Record<
      string,
      Array<{ field: string; value: unknown; timestamp: string }>
    >;
    merge_history?: MergeHistoryEntry[];
  };
}

interface UseUnifiedCatalogState {
  catalog: UnifiedCatalogData | null;
  products: UnifiedProduct[];
  loading: boolean;
  error: string | null;
}

interface UseUnifiedCatalogMethods {
  // Load catalog for brand
  loadCatalog: (brandId: string) => Promise<void>;

  // Get subjective fields for product
  getSubjectiveFields: (productId: string) => SubjectiveFields | null;

  // Add/update subjective field
  updateSubjectiveField: (
    productId: string,
    fieldName: string,
    fieldValue: unknown,
  ) => Promise<void>;

  // Search products
  searchProducts: (query: string) => UnifiedProduct[];

  // Get product by ID
  getProduct: (productId: string) => UnifiedProduct | undefined;

  // Get all products with custom fields
  getEnrichedProducts: () => UnifiedProduct[];
}

/**
 * Hook to load and manage single unified catalog per brand
 * Ensures only ONE catalog is loaded at a time
 */
export const useUnifiedCatalog = (): UseUnifiedCatalogState &
  UseUnifiedCatalogMethods => {
  const [state, setState] = useState<UseUnifiedCatalogState>({
    catalog: null,
    products: [],
    loading: false,
    error: null,
  });

  const [currentBrand, setCurrentBrand] = useState<string | null>(null);

  // Load catalog for specific brand
  const loadCatalog = useCallback(
    async (brandId: string) => {
      // Don't reload if already loaded
      if (currentBrand === brandId && state.catalog) {
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(`/data/${brandId}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load catalog for ${brandId}`);
        }

        const data = (await response.json()) as UnifiedCatalogData;

        // Ensure products have unified structure
        const products = (data.products || []).map((product) => ({
          ...product,
          _metadata: product._metadata || {
            added_at: new Date().toISOString(),
            source: "halilit_catalog",
            discovery_confidence: 1.0,
            user_verified: true,
          },
          subjective: product.subjective || {},
        })) as UnifiedProduct[];

        setState({
          catalog: data,
          products,
          loading: false,
          error: null,
        });

        setCurrentBrand(brandId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setState({
          catalog: null,
          products: [],
          loading: false,
          error: errorMessage,
        });
      }
    },
    [currentBrand, state.catalog],
  );

  // Get subjective fields for product
  const getSubjectiveFields = useCallback(
    (productId: string): SubjectiveFields | null => {
      const product = state.products.find((p) => p.id === productId);
      return product?.subjective || null;
    },
    [state.products],
  );

  // Update subjective field (in-memory for now, can be persisted to backend)
  const updateSubjectiveField = useCallback(
    async (productId: string, fieldName: string, fieldValue: unknown) => {
      setState((prev) => {
        const updatedProducts = prev.products.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              subjective: {
                ...product.subjective,
                [fieldName]: {
                  value: fieldValue,
                  set_at: new Date().toISOString(),
                  custom: true,
                },
              },
            };
          }
          return product;
        });

        return {
          ...prev,
          products: updatedProducts,
          catalog: prev.catalog
            ? {
                ...prev.catalog,
                products: updatedProducts,
              }
            : null,
        };
      });

      // Optional: persist to localStorage for session persistence
      try {
        const key = `unified_subjective_${currentBrand}_${productId}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            [fieldName]: {
              value: fieldValue,
              set_at: new Date().toISOString(),
              custom: true,
            },
          }),
        );
      } catch {
        // Silently fail if localStorage unavailable
      }
    },
    [currentBrand],
  );

  // Search products by name/category/description
  const searchProducts = useCallback(
    (query: string): UnifiedProduct[] => {
      if (!query.trim()) return state.products;

      const lowerQuery = query.toLowerCase();
      return state.products.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(lowerQuery)) ||
          (product.description &&
            product.description.toLowerCase().includes(lowerQuery)) ||
          (product.category &&
            product.category.toLowerCase().includes(lowerQuery)),
      );
    },
    [state.products],
  );

  // Get product by ID
  const getProduct = useCallback(
    (productId: string): UnifiedProduct | undefined => {
      return state.products.find((p) => p.id === productId);
    },
    [state.products],
  );

  // Get all products with enriched data
  const getEnrichedProducts = useCallback(() => {
    return state.products.map((product) => ({
      ...product,
      _metadata: product._metadata || {
        added_at: new Date().toISOString(),
        source: "halilit_catalog",
        discovery_confidence: 1.0,
        user_verified: true,
      },
      subjective: product.subjective || {},
    }));
  }, [state.products]);

  return {
    // State
    catalog: state.catalog,
    products: state.products,
    loading: state.loading,
    error: state.error,

    // Methods
    loadCatalog,
    getSubjectiveFields,
    updateSubjectiveField,
    searchProducts,
    getProduct,
    getEnrichedProducts,
  };
};
