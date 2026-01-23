/**
 * v3.7.6 Static Catalog Library
 * Exports for easy importing - Zero backend dependency
 */

export { catalogLoader } from "./catalogLoader";
export type { BrandCatalog, MasterIndex, Product } from "./catalogLoader";
export { instantSearch } from "./instantSearch";
export type { SearchOptions } from "./instantSearch";

// Taxonomy Registry
export {
  loadTaxonomyRegistry,
  getBrandTaxonomySync,
  getBrandRootCategories,
  getBrandCategories,
  getCategoryLabels,
  validateCategory,
  getAvailableBrands,
} from "./taxonomyLoader";
export type {
  TaxonomyRegistry,
  BrandTaxonomy,
  TaxonomyCategory,
} from "./taxonomyLoader";

// Dynamic Thumbnails (Most Expensive Product Selection)
export {
  buildDynamicThumbnailMap,
  getThumbnailForCategory,
  getMostExpensiveProductImage,
  getTopProductsByCategory,
} from "./dynamicThumbnails";
export type { CategoryThumbnail } from "./dynamicThumbnails";

