/**
 * Static Catalog Loader - v3.6
 * Loads pre-built JSON instead of API calls
 */

export interface Product {
  name: string;
  brand: string;
  category: string;
  image_url?: string;
  brand_product_url?: string;
  detail_url?: string;
  verified: boolean;
  verification_confidence?: number;
  match_quality?: 'excellent' | 'good';
  halilit_sku?: string | null;
  halilit_price?: number;
  has_manual?: boolean;
  manual_path?: string;
  // Internal fields for filtering
  _brandId?: string;
  _brandName?: string;
}

export interface BrandCatalog {
  brand_id: string;
  brand_name: string;
  source?: string;
  build_timestamp?: string;
  stats: {
    total_products: number;
    verified_products: number;
    verification_rate: number;
    original_count?: number;
    removed_duplicates?: number;
  };
  products: Product[];
}

export interface MasterIndex {
  build_timestamp: string;
  version: string;
  total_products: number;
  total_verified: number;
  brands: Array<{
    id: string;
    name: string;
    product_count: number;
    verified_count: number;
    data_file: string;
  }>;
}

class CatalogLoader {
  private index: MasterIndex | null = null;
  private brandCatalogs: Map<string, BrandCatalog> = new Map();
  private allProducts: Product[] = [];
  private loading: boolean = false;
  
  /**
   * Load master index (call once on app init)
   */
  async loadIndex(): Promise<MasterIndex> {
    if (this.index) return this.index;
    
    console.log('📦 Loading catalog index...');
    const response = await fetch('/data/index.json');
    if (!response.ok) {
      throw new Error('Failed to load catalog index');
    }
    
    const data: MasterIndex = await response.json();
    this.index = data;
    console.log(`✅ Loaded index: ${data.total_products} products, ${data.brands.length} brands`);
    return data;
  }
  
  /**
   * Load specific brand catalog (lazy loading)
   */
  async loadBrand(brandId: string): Promise<BrandCatalog> {
    // Check cache first
    if (this.brandCatalogs.has(brandId)) {
      return this.brandCatalogs.get(brandId)!;
    }
    
    console.log(`📦 Loading brand: ${brandId}`);
    const response = await fetch(`/data/${brandId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load brand: ${brandId}`);
    }
    
    const catalog = await response.json();
    this.brandCatalogs.set(brandId, catalog);
    
    return catalog;
  }
  
  /**
   * Load all products (for full-text search)
   * Only call this once, then use Fuse.js
   */
  async loadAllProducts(): Promise<Product[]> {
    if (this.allProducts.length > 0) {
      return this.allProducts;
    }
    
    if (this.loading) {
      // Wait for existing load to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.loadAllProducts();
    }
    
    this.loading = true;
    
    try {
      console.log('📦 Loading all products...');
      
      // Load index first to get brand list
      const index = await this.loadIndex();
      
      // Load all brand catalogs in parallel
      const brandPromises = index.brands.map(brand => 
        this.loadBrand(brand.id).catch(err => {
          console.warn(`Failed to load ${brand.id}:`, err);
          return null;
        })
      );
      
      const catalogs = await Promise.all(brandPromises);
      
      // Flatten all products
      this.allProducts = catalogs
        .filter((catalog): catalog is BrandCatalog => catalog !== null)
        .flatMap(catalog => 
          catalog.products.map(product => ({
            ...product,
            // Add brand info for filtering
            _brandId: catalog.brand_id,
            _brandName: catalog.brand_name
          }))
        );
      
      console.log(`✅ Loaded ${this.allProducts.length} total products`);
      return this.allProducts;
      
    } finally {
      this.loading = false;
    }
  }
  
  /**
   * Get brands list (fast, from index only)
   */
  async getBrands() {
    const index = await this.loadIndex();
    return index?.brands || [];
  }
  
  /**
   * Get statistics
   */
  async getStats() {
    const index = await this.loadIndex();
    if (!index) {
      return {
        totalProducts: 0,
        totalVerified: 0,
        totalBrands: 0,
        verificationRate: '0',
        buildTimestamp: '',
        version: ''
      };
    }
    return {
      totalProducts: index.total_products,
      totalVerified: index.total_verified,
      totalBrands: index.brands.length,
      verificationRate: ((index.total_verified / index.total_products) * 100).toFixed(2),
      buildTimestamp: index.build_timestamp,
      version: index.version
    };
  }
  
  /**
   * Clear cache (for development/testing)
   */
  clearCache() {
    this.index = null;
    this.brandCatalogs.clear();
    this.allProducts = [];
    console.log('🗑️ Cache cleared');
  }
}

// Singleton instance
export const catalogLoader = new CatalogLoader();
