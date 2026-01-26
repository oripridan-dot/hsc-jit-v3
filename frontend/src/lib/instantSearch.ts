/**
 * Instant Search - v3.6
 * Client-side fuzzy search using Fuse.js
 * Replaces WebSocket/API-based search with instant in-memory search
 */

import Fuse from 'fuse.js';
import { catalogLoader, type Product } from './catalogLoader';

export interface SearchOptions {
  brand?: string;
  category?: string;
  verifiedOnly?: boolean;
  limit?: number;
}

class InstantSearch {
  private fuse: Fuse<Product> | null = null;
  private products: Product[] = [];
  private initialized: boolean = false;

  /**
   * Initialize search engine (call once on app load)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load all products
    this.products = await catalogLoader.loadAllProducts();

    // Configure Fuse.js for fuzzy search
    this.fuse = new Fuse(this.products, {
      keys: [
        { name: 'name', weight: 2.0 },           // Product name most important
        { name: 'brand', weight: 1.5 },          // Brand second
        { name: '_brandName', weight: 1.5 },     // Brand name searchable
        { name: 'category', weight: 1.0 },       // Category third
        { name: 'description', weight: 0.8 },    // Search in description (added for "stage piano")
        { name: 'specifications.key', weight: 0.6 }, // Search in specs keys
        { name: 'specifications.value', weight: 0.6 }, // Search in specs values
        { name: 'connectivity.connector_a', weight: 1.2 }, // Connectivity
        { name: 'connectivity.connector_b', weight: 1.2 }, // Connectivity
        { name: 'connectivity.type', weight: 1.0 },        // Cable/Adapter
        { name: 'tier.level', weight: 0.8 },               // 'Entry'/'Pro' search
      ],
      threshold: 0.3,                            // 70% match required
      includeScore: true,
      useExtendedSearch: true,
      minMatchCharLength: 2,
      ignoreLocation: true,                      // Search anywhere in text
    });

    this.initialized = true;
  }

  /**
   * Search products (instant, <50ms target)
   */
  search(query: string, options?: SearchOptions): Product[] {
    if (!this.fuse || !this.initialized) {
      return [];
    }

    // If no query, return filtered products
    if (!query || query.trim().length < 2) {
      let results = [...this.products];
      results = this.applyFilters(results, options);
      results = results.slice(0, options?.limit || 100);

      return results;
    }

    // Perform fuzzy search
    const searchResults = this.fuse.search(query, {
      limit: options?.limit || 200
    });

    let results = searchResults.map(result => result.item);

    // Apply filters
    results = this.applyFilters(results, options);

    // Apply limit after filtering
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Apply filters to results
   */
  private applyFilters(results: Product[], options?: SearchOptions): Product[] {
    let filtered = results;

    if (options?.brand) {
      filtered = filtered.filter(p => p._brandId === options.brand);
    }

    if (options?.category) {
      filtered = filtered.filter(p =>
        p.category?.toLowerCase() === options.category?.toLowerCase()
      );
    }

    if (options?.verifiedOnly) {
      filtered = filtered.filter(p => p.verified);
    }

    return filtered;
  }

  /**
   * Get products by brand (fast filter)
   */
  getByBrand(brandId: string, limit?: number): Product[] {
    const results = this.products.filter(p => p._brandId === brandId);
    return limit ? results.slice(0, limit) : results;
  }

  /**
   * Get products by category (fast filter)
   */
  getByCategory(category: string, limit?: number): Product[] {
    const results = this.products.filter(p =>
      p.category?.toLowerCase() === category.toLowerCase()
    );
    return limit ? results.slice(0, limit) : results;
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const categories = new Set(
      this.products
        .map(p => p.category)
        .filter((cat): cat is string => Boolean(cat))
    );
    return Array.from(categories).sort();
  }

  /**
   * Get all unique brands
   */
  getBrands(): Array<{ id: string; name: string; count: number }> {
    const brandMap = new Map<string, { id: string; name: string; count: number }>();

    this.products.forEach(p => {
      if (p._brandId) {
        const existing = brandMap.get(p._brandId);
        if (existing) {
          existing.count++;
        } else {
          brandMap.set(p._brandId, {
            id: p._brandId,
            name: p._brandName || p.brand,
            count: 1
          });
        }
      }
    });

    return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get verified products only
   */
  getVerified(limit?: number): Product[] {
    const results = this.products.filter(p => p.verified);
    return limit ? results.slice(0, limit) : results;
  }

  /**
   * Get product count
   */
  getProductCount(): number {
    return this.products.length;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const instantSearch = new InstantSearch();
