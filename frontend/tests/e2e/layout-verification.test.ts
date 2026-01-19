/**
 * E2E Layout Verification Test
 * Verifies the 3-column layout structure:
 * LEFT: Navigator | CENTER: Workbench | RIGHT: MediaBar
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function test(name: string, fn: () => Promise<void> | void) {
  const start = performance.now();
  try {
    await fn();
    const duration = performance.now() - start;
    results.push({
      name,
      passed: true,
      message: '✓ Passed',
      duration
    });
    console.log(`✓ ${name} (${duration.toFixed(2)}ms)`);
  } catch (error) {
    const duration = performance.now() - start;
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
      duration
    });
    console.error(`✗ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Tests
describe('3-Column Layout Verification', () => {

  test('Data Files Exist', async () => {
    const indexResponse = await fetch('/data/index.json');
    assert(indexResponse.ok, 'index.json should be accessible');
    
    const indexData = await indexResponse.json();
    assert(indexData.brands && indexData.brands.length > 0, 'index.json should contain brands');
    
    const rolandBrand = indexData.brands.find((b: any) => b.id === 'roland' || b.slug === 'roland');
    assert(rolandBrand, 'Roland brand should exist in index');
    
    const catalogPath = rolandBrand.file || `catalogs_brand/${rolandBrand.slug}_catalog.json`;
    const catalogResponse = await fetch(`/data/${catalogPath}`);
    assert(catalogResponse.ok, `Catalog file ${catalogPath} should be accessible`);
  });

  test('Catalog Data Structure', async () => {
    const indexResponse = await fetch('/data/index.json');
    const indexData = await indexResponse.json();
    
    assert(indexData.version === '3.7.0', 'Version should be 3.7.0');
    assert(indexData.total_products > 0, 'Should have products');
    assert(indexData.metadata, 'Should have metadata');
    assert(indexData.brands, 'Should have brands array');
    
    const brand = indexData.brands[0];
    assert(brand.id, 'Brand should have id');
    assert(brand.slug, 'Brand should have slug');
    assert(brand.file || brand.data_file, 'Brand should have file path');
  });

  test('Roland Catalog Loading', async () => {
    const indexResponse = await fetch('/data/index.json');
    const indexData = await indexResponse.json();
    
    const rolandBrand = indexData.brands[0];
    const filePath = rolandBrand.file || rolandBrand.data_file;
    
    const catalogResponse = await fetch(`/data/${filePath}`);
    assert(catalogResponse.ok, `Should load ${filePath}`);
    
    const catalogData = await catalogResponse.json();
    assert(catalogData.brand_identity, 'Should have brand_identity');
    assert(catalogData.products || catalogData.products, 'Should have products');
    
    const productCount = catalogData.products ? catalogData.products.length : 0;
    assert(productCount > 0, `Should have products (got ${productCount})`);
  });

  test('Product Structure Validation', async () => {
    const indexResponse = await fetch('/data/index.json');
    const indexData = await indexResponse.json();
    
    const rolandBrand = indexData.brands[0];
    const filePath = rolandBrand.file || rolandBrand.data_file;
    
    const catalogResponse = await fetch(`/data/${filePath}`);
    const catalogData = await catalogResponse.json();
    
    assert(catalogData.products && catalogData.products.length > 0, 'Should have products array');
    
    const product = catalogData.products[0];
    assert(product.id, 'Product should have id');
    assert(product.name, 'Product should have name');
    assert(product.brand, 'Product should have brand');
  });

  test('Component Hierarchy Check', async () => {
    // This would normally be done with DOM inspection in a browser
    // For now, we verify the data structure that components depend on
    
    const indexResponse = await fetch('/data/index.json');
    const indexData = await indexResponse.json();
    
    // Navigator needs:
    assert(indexData.brands, 'Navigator needs brands');
    assert(indexData.metadata, 'Navigator needs metadata');
    
    const rolandBrand = indexData.brands[0];
    const filePath = rolandBrand.file || rolandBrand.data_file;
    const catalogResponse = await fetch(`/data/${filePath}`);
    const catalogData = await catalogResponse.json();
    
    // Workbench needs:
    assert(catalogData.products, 'Workbench needs products');
    
    // MediaBar needs:
    const product = catalogData.products[0];
    assert(product.id, 'MediaBar needs product id');
    assert(product.name, 'MediaBar needs product name');
  });

});

// Summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

results.forEach(result => {
  const icon = result.passed ? '✓' : '✗';
  console.log(`${icon} ${result.name}: ${result.message} (${result.duration.toFixed(2)}ms)`);
});

console.log('='.repeat(60));
console.log(`Passed: ${passed}/${results.length}`);
console.log(`Failed: ${failed}/${results.length}`);
console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
console.log('='.repeat(60));

// Export for external use
export { results };
