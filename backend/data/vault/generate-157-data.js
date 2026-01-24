#!/usr/bin/env node
/**
 * Generate 157-Product Data Files
 * Converts test fixture to production JSON data
 */

const fs = require('fs');
const path = require('path');

// Import the fixture data
const {
  products157,
  rolandCatalog,
  nordCatalog,
  bossCatalog,
  moogCatalog,
  uaCatalog,
} = require('./tests/fixtures/largeDataset157.ts');

const DATA_DIR = path.join(__dirname, 'public/data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log('🚀 Generating 157-product dataset...\n');

// Helper function to clean products for JSON serialization
function cleanProduct(product) {
  const cleaned = { ...product };
  
  // Remove undefined values
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  
  return cleaned;
}

// Generate brand files
const brands = [
  { catalog: rolandCatalog, id: 'roland' },
  { catalog: nordCatalog, id: 'nord' },
  { catalog: bossCatalog, id: 'boss' },
  { catalog: moogCatalog, id: 'moog' },
  { catalog: uaCatalog, id: 'universal-audio' },
];

const brandIndex = [];

brands.forEach(({ catalog, id }) => {
  const brandData = {
    brand_id: catalog.brand_id,
    brand_name: catalog.brand_name,
    logo_url: catalog.logo_url,
    brand_website: catalog.brand_website,
    description: catalog.description,
    products: catalog.products.map(cleanProduct),
  };

  const filePath = path.join(DATA_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(brandData, null, 2));
  
  console.log(`✅ Generated ${id}.json (${catalog.products.length} products)`);

  brandIndex.push({
    id: catalog.brand_id,
    name: catalog.brand_name,
    logo_url: catalog.logo_url,
    product_count: catalog.products.length,
  });
});

// Generate master index
const masterIndex = {
  version: '3.8.1',
  build_timestamp: new Date().toISOString(),
  environment: 'static_production',
  total_products: products157.length,
  total_verified: products157.length,
  brands: brandIndex,
};

const indexPath = path.join(DATA_DIR, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(masterIndex, null, 2));

console.log(`\n✅ Generated index.json`);
console.log(`\n📊 Summary:`);
console.log(`   • Total products: ${products157.length}`);
console.log(`   • Total brands: ${brands.length}`);
console.log(`   • Total files: ${brands.length + 1}`);
console.log(`   • Location: ${DATA_DIR}`);
console.log(`\n🎉 Dataset generated successfully!`);
