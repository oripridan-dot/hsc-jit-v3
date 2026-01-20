#!/usr/bin/env node
/**
 * Test UI Data Loading
 * Simulates browser console tests to verify data loads correctly
 */

const http = require('http');

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🧪 Testing UI Data Loading...\n');

  try {
    // Test 1: Load index
    console.log('📋 Test 1: Load master index');
    const index = await fetchJSON('http://localhost:5173/data/index.json');
    console.log(`✅ Loaded ${index.brands.length} brands`);
    console.log(`   Total products: ${index.total_products}`);

    // Test 2: Load Roland catalog
    console.log('\n📋 Test 2: Load Roland catalog');
    const brandEntry = index.brands.find(b => b.id === 'roland');
    if (!brandEntry) {
      throw new Error('Roland not found in index');
    }
    
    const catalogUrl = `http://localhost:5173/data/${brandEntry.data_file}`;
    console.log(`   Loading from: ${brandEntry.data_file}`);
    
    const catalog = await fetchJSON(catalogUrl);
    console.log(`✅ Loaded Roland catalog`);
    console.log(`   Brand: ${catalog.brand_identity.name}`);
    console.log(`   Products: ${catalog.products.length}`);
    console.log(`   Categories: ${catalog.brand_identity.categories.join(', ')}`);

    // Test 3: Verify product structure
    console.log('\n📋 Test 3: Verify product structure');
    const sampleProduct = catalog.products[0];
    console.log(`✅ Sample product: ${sampleProduct.name}`);
    console.log(`   ID: ${sampleProduct.id}`);
    console.log(`   Category: ${sampleProduct.main_category}`);
    console.log(`   Images: ${Array.isArray(sampleProduct.images) ? sampleProduct.images.length : 'object'}`);

    // Test 4: Verify brand colors
    console.log('\n📋 Test 4: Verify brand colors');
    const colors = catalog.brand_identity.brand_colors;
    console.log(`✅ Brand colors:`);
    console.log(`   Primary: ${colors.primary}`);
    console.log(`   Secondary: ${colors.secondary}`);

    // Test 5: Check data file accessibility
    console.log('\n📋 Test 5: Check all required files');
    const requiredPaths = [
      '/data/index.json',
      '/data/catalogs_brand/roland.json'
    ];
    
    for (const path of requiredPaths) {
      const url = `http://localhost:5173${path}`;
      await fetchJSON(url);
      console.log(`✅ Accessible: ${path}`);
    }

    console.log('\n🎉 All UI data loading tests passed!');
    console.log('✅ Data is properly populated and accessible via HTTP');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
