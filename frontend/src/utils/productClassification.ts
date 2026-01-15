// Utility function to determine classification from product data
export const getProductClassification = (product: Record<string, unknown>): 'PRIMARY' | 'SECONDARY' | 'HALILIT_ONLY' => {
  // Check if product has dual_source_classification field
  if (product.dual_source_classification) {
    return product.dual_source_classification as 'PRIMARY' | 'SECONDARY' | 'HALILIT_ONLY';
  }
  
  // Fallback logic based on available fields
  const hasHalilitData = product.price && product.sku;
  const hasBrandData = product.brand_product_url || product.specifications;
  
  if (hasHalilitData && hasBrandData) {
    return 'PRIMARY';
  } else if (hasBrandData && !hasHalilitData) {
    return 'SECONDARY';
  } else {
    return 'HALILIT_ONLY';
  }
};
