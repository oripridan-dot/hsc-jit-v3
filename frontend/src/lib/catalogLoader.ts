/**
 * Static Catalog Loader - v3.6
 * Loads pre-built JSON instead of API calls
 */

export interface Product {
  id?: string;
  name: string;
  brand: string;
  category: string;
  image_url?: string;
  brand_product_url?: string;
  detail_url?: string;
  verified: boolean;
  verification_confidence?: number;
  match_quality?: 'excellent' | 'good' | 'fair';
  halilit_sku?: string | null;
  halilit_price?: number;
  has_manual?: boolean;
  manual_path?: string;
  tags?: string[] | null;
  description?: string | null;
  short_description?: string | null;
  item_code?: string | null;
  images?: any;
  // Internal fields for filtering
  _brandId?: string;
  _brandName?: string;
  // Dynamic added props
  brand_identity?: any; // To pass up categories
}

// Interface matching brand JSON structure
export interface BrandFile {
  brand_identity: {
    id: string;
    name: string;
    logo_url?: string | null;
    website?: string | null;
    description?: string | null;
    brand_colors?: {
      primary?: string;
      secondary?: string;
    };
    categories?: string[];
    [key: string]: any;
  };
  products: Product[];
  stats?: any; // If present
}

export interface BrandCatalog {
  brand_id: string;
  brand_name: string;
  brand_color?: string;
  secondary_color?: string;
  logo_url?: string;
  brand_website?: string;
  description?: string;
  products: Product[];
  brand_identity?: any; // Keeping the raw identity object for UI usage
}

export interface MasterIndex {
  build_timestamp: string;
  version: string;
  total_products: number;
  total_verified: number;
  brands: Array<{
    id: string;
    name: string;
    brand_color?: string | null;
    logo_url?: string | null;
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

    console.log('📦 Loading Master Index...');
    try {
      const response = await fetch(`/data/index.json?v=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to load master index');
      }
      this.index = await response.json();
      console.log(`✅ Master Index loaded: ${this.index?.brands.length} brands`);
      return this.index!;
    } catch (e) {
      console.error("Failed to load index.json", e);
      throw e;
    }
  }

  /**
   * Transform images array to expected format
   */
  private transformImages(images: any): any {
    // If images is already in the expected format (object with main/thumbnail), return as-is
    if (images && typeof images === 'object' && !Array.isArray(images)) {
      return images;
    }

    // If images is an array (Roland format), transform it
    if (Array.isArray(images) && images.length > 0) {
      // Find the first 'main' type image, or just use the first one
      const mainImage = images.find((img: any) => img.type === 'main') || images[0];
      const thumbnailImage = images.find((img: any) => img.type === 'thumbnail') || mainImage;

      return {
        main: mainImage?.url || mainImage,
        thumbnail: thumbnailImage?.url || thumbnailImage,
        gallery: images.map((img: any) => img?.url || img).filter(Boolean)
      };
    }

    return images;
  }

  /**
   * Load specific brand catalog (lazy loading)
   */
  async loadBrand(brandId: string): Promise<BrandCatalog> {
    // Check cache first
    if (this.brandCatalogs.has(brandId)) {
      return this.brandCatalogs.get(brandId)!;
    }

    const index = await this.loadIndex();
    const brandEntry = index.brands.find(b => b.id === brandId);

    if (!brandEntry) {
      throw new Error(`Brand ${brandId} not found in index`);
    }

    console.log(`📦 Loading brand: ${brandId} from ${brandEntry.data_file}`);
    const response = await fetch(`/data/${brandEntry.data_file}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Failed to load brand: ${brandId}`);
    }

    const data: BrandFile = await response.json();

    // Transform to BrandCatalog format
    const catalog: BrandCatalog = {
      brand_id: data.brand_identity?.id || brandId,
      brand_name: data.brand_identity?.name || brandEntry.name,
      brand_color: data.brand_identity?.brand_colors?.primary || brandEntry.brand_color || undefined,
      logo_url: data.brand_identity?.logo_url || brandEntry.logo_url || undefined,
      brand_website: data.brand_identity?.website || undefined,
      description: data.brand_identity?.description || undefined,
      brand_identity: data.brand_identity,
      products: data.products.map(p => ({
        ...p,
        category: p.category || (p as any).main_category || 'Uncategorized', // Normalize category
        images: this.transformImages(p.images),
        image_url: p.image_url || ((p.images as any)?.main) || '' // Ensure image_url is populated for filtering/display
      }))
    };

    // Sort products by name
    catalog.products.sort((a, b) => a.name.localeCompare(b.name));

    this.brandCatalogs.set(brandId, catalog);
    console.log(`✅ Loaded ${catalog.products.length} products for ${catalog.brand_name}`);

    return catalog;
  }

  /**
   * Load ALL brands referenced in the index (for initial build)
   * CAUTION: This might be heavy if there are many brands
   */
  async loadAllProducts(): Promise<Product[]> {
    if (this.allProducts.length > 0) return this.allProducts;
    if (this.loading) {
      // primitive wait
      while (this.loading) await new Promise(r => setTimeout(r, 100));
      return this.allProducts;
    }

    this.loading = true;
    try {
      const index = await this.loadIndex();

      // Let's load all brands listed in the index
      const brandPromises = index.brands.map(b => this.loadBrand(b.id).catch(e => {
        console.error(`Failed to load ${b.id}`, e);
        return null;
      }));

      const loadedCatalogs = (await Promise.all(brandPromises)).filter(Boolean) as BrandCatalog[];

      this.allProducts = loadedCatalogs.flatMap(catalog =>
        catalog.products.map(p => ({
          ...p,
          // Add brand info for filtering
          _brandId: catalog.brand_id,
          _brandName: catalog.brand_name,
          // Add brand_identity for category mapping in UI (from the catalog JSON)
          brand_identity: catalog.brand_identity
        }))
      );

      console.log(`✅ Loaded ${this.allProducts.length} total products from ${loadedCatalogs.length} brands`);
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
    try {
      const index = await this.loadIndex();
      if (!index) throw new Error("No index");

      // Check if total_verified exists in index, otherwise calculate (generic safeguard)
      const verified = (index as any).total_verified ?? 0;

      return {
        totalProducts: index.total_products,
        totalVerified: verified,
        totalBrands: index.brands.length,
        verificationRate: index.total_products ? ((verified / index.total_products) * 100).toFixed(2) : '0',
        buildTimestamp: index.build_timestamp,
        version: index.version
      };
    } catch {
      return {
        totalProducts: 0,
        totalVerified: 0,
        totalBrands: 0,
        verificationRate: '0',
        buildTimestamp: '',
        version: ''
      };
    }
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
