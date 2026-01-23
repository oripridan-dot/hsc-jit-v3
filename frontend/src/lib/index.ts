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
  getAvailableBrands,
  getBrandCategories,
  getBrandRootCategories,
  getBrandTaxonomySync,
  getCategoryLabels,
  loadTaxonomyRegistry,
  validateCategory,
} from "./taxonomyLoader";
export type {
  BrandTaxonomy,
  TaxonomyCategory,
  TaxonomyRegistry,
} from "./taxonomyLoader";

// Dynamic Thumbnails (Most Expensive Product Selection)
export {
  buildDynamicThumbnailMap,
  getMostExpensiveProductImage,
  getThumbnailForCategory,
  getTopProductsByCategory,
} from "./dynamicThumbnails";
export type { CategoryThumbnail } from "./dynamicThumbnails";
