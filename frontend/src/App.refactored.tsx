/**
 * App.tsx - Integrated Refactored UI
 * Combines new refactored components with existing functionality
 */

import { useEffect, useState, useMemo } from 'react';
import type { Product, Brand } from './types';
import {
  SearchBar,
  ProductGrid,
  ProductDetail,
  EmptyState,
  ErrorBoundary,
} from './components/refactor';
import { useWebSocketStore } from './store/useWebSocketStore';
import './index.css';
import './styles/tokens.css';
import './styles/responsive.css';

/**
 * Refactored App Component
 * Modern, information-first support center
 */
function AppRefactored() {
  const { predictions, status, actions } = useWebSocketStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [seeded, setSeeded] = useState(false);

  // Convert predictions to Product type
  const allProducts = useMemo(() => {
    return predictions.map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand || 'Unknown',
      brand_identity: p.brand_identity,
      description: p.description || `Professional ${p.brand || ''} gear.`,
      category: p.category,
      price: p.price,
      production_country: p.production_country,
      image: p.image || p.images?.main,
      images: p.images ? Object.values(p.images).filter(Boolean) : [p.image],
      manual_url: p.manual_url,
      specs: p.specs || {},
      score: p.confidence || 0.9,
      availability: p.availability,
      tags: p.tags,
      warranty: p.warranty,
      dimensions: p.dimensions,
    } as Product));
  }, [predictions]);

  // Extract unique brands
  const allBrands = useMemo(() => {
    const brandMap = new Map<string, Brand>();

    allProducts.forEach((product) => {
      if (!brandMap.has(product.brand)) {
        brandMap.set(product.brand, {
          id: product.brand.toLowerCase().replace(/\s+/g, '-'),
          name: product.brand,
          logo_url: product.brand_identity?.logo_url,
          hq: product.brand_identity?.hq,
          website: product.brand_identity?.website,
          description: product.brand_identity?.name,
          productCount: 0,
        });
      }

      // Count products per brand
      const brand = brandMap.get(product.brand)!;
      brand.productCount = (brand.productCount || 0) + 1;
    });

    return Array.from(brandMap.values());
  }, [allProducts]);

  // Initialize WebSocket on mount
  useEffect(() => {
    actions.connect();
  }, [actions]);

  // Seed UI with an initial catalog sample to avoid empty state when connecting
  useEffect(() => {
    if (!seeded && predictions.length === 0) {
      const timer = setTimeout(() => {
        actions.sendTyping(''); // Empty query returns random sample
        setSeeded(true);
      }, 400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [actions, predictions.length, seeded]);

  // Filter products based on search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredProducts([]);
      } else {
        const lowercaseQuery = searchQuery.toLowerCase();

        // Fuzzy search across name, brand, description
        const filtered = allProducts.filter((product) => {
          const nameMatch = product.name.toLowerCase().includes(lowercaseQuery);
          const brandMatch = product.brand.toLowerCase().includes(lowercaseQuery);
          const descriptionMatch = product.description?.toLowerCase().includes(lowercaseQuery);
          const categoryMatch = product.category?.toLowerCase().includes(lowercaseQuery);

          return nameMatch || brandMatch || descriptionMatch || categoryMatch;
        });

        setFilteredProducts(filtered);
      }
    }, 150); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery, allProducts]);

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);

    // Add to recent products
    setRecentProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 6);
    });
  };

  // Handle brand selection from empty state
  const handleBrandSelect = (brand: Brand) => {
    setSearchQuery(brand.name); // Pre-fill search
  };

  const isLoading = status === 'SNIFFING' && allProducts.length === 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg-base text-text-primary">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-bg-base/95 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-bg-base/60">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* Logo & Title */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
                HSC Support Center
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                JIT Technical Support System
              </p>
            </div>

            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search 333+ products by brand, category, or features..."
              autoFocus
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Loading State */}
          {status === 'SNIFFING' && allProducts.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-text-secondary">Loading catalog...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && !selectedProduct && allProducts.length > 0 && (
            <EmptyState
              brands={allBrands}
              recentProducts={recentProducts}
              onBrandSelect={handleBrandSelect}
              onProductSelect={handleProductSelect}
            />
          )}

          {/* Search Results */}
          {searchQuery && !selectedProduct && (
            <ProductGrid
              products={filteredProducts}
              query={searchQuery}
              onProductSelect={handleProductSelect}
              isLoading={isLoading}
            />
          )}

          {/* Product Detail Modal */}
          {selectedProduct && (
            <ProductDetail
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8 mt-16">
          <div className="container mx-auto px-4 text-center text-text-tertiary text-sm">
            <p>HSC JIT v3 • Technical Support System</p>
            <p className="mt-2">
              Powered by Google Gemini AI • {allProducts.length} Products • {allBrands.length} Brands
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default AppRefactored;
