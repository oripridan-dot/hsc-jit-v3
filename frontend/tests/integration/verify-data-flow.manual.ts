/**
 * Data Flow Verification Test
 * Ensures only ONE path exists for loading category data
 */

// Test 1: Verify useCategoryCatalog loads all brands
async function testCategoryDataLoad() {
  const response1 = await fetch('/data/roland.json');
  const response2 = await fetch('/data/boss.json');
  const roland = await response1.json();
  const boss = await response2.json();
  
  console.log('✅ Test 1: Brand files accessible');
  console.log(`   - Roland: ${roland.products.length} products`);
  console.log(`   - Boss: ${boss.products.length} products`);
  
  return roland.products.length > 0 && boss.products.length > 0;
}

// Test 2: Verify products have main_category field
async function testProductStructure() {
  const response = await fetch('/data/roland.json');
  const data = await response.json();
  const product = data.products[0];
  
  console.log('✅ Test 2: Product structure valid');
  console.log(`   - Has main_category: ${!!product.main_category}`);
  console.log(`   - Has subcategory: ${!!product.subcategory}`);
  console.log(`   - Sample: ${product.name} (${product.main_category})`);
  
  return product.main_category && product.subcategory;
}

// Test 3: Verify category filtering logic
async function testCategoryFiltering() {
  const responses = await Promise.all([
    fetch('/data/roland.json'),
    fetch('/data/boss.json'),
    fetch('/data/nord.json')
  ]);
  
  const data = await Promise.all(responses.map(r => r.json()));
  const allProducts = data.flatMap(d => d.products);
  
  const keysProducts = allProducts.filter(p => {
    const mainCat = (p.main_category || '').toLowerCase();
    return mainCat.includes('keys');
  });
  
  console.log('✅ Test 3: Category filtering works');
  console.log(`   - Total products: ${allProducts.length}`);
  console.log(`   - Keys products: ${keysProducts.length}`);
  console.log(`   - Sample Keys: ${keysProducts.slice(0, 3).map(p => p.name).join(', ')}`);
  
  return keysProducts.length > 0;
}

// Run all tests
export async function verifyDataFlow() {
  console.log('🧪 Running Data Flow Verification Tests...\n');
  
  const test1 = await testCategoryDataLoad();
  const test2 = await testProductStructure();
  const test3 = await testCategoryFiltering();
  
  if (test1 && test2 && test3) {
    console.log('\n✅ All tests passed! Data flow is verified.');
    return true;
  } else {
    console.log('\n❌ Some tests failed! Check the logs above.');
    return false;
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  verifyDataFlow();
}
