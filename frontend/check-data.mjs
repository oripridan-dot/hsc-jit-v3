import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./public/data/catalogs_brand/roland_catalog.json', 'utf-8'));
console.log('\nRoland Catalog Structure:');
console.log('  ✓ Has brand_identity:', !!data.brand_identity);
console.log('  ✓ Has products:', !!data.products, `(${data.products?.length || 0} items)`);
console.log('  ✓ Has hierarchy:', !!data.hierarchy);
if (data.hierarchy) {
  const cats = Object.keys(data.hierarchy);
  console.log(`  ✓ Categories: ${cats.length}`);
  cats.slice(0, 5).forEach(cat => {
    const subcats = Object.keys(data.hierarchy[cat]);
    const totalProducts = Object.values(data.hierarchy[cat]).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    console.log(`      - ${cat}: ${subcats.length} subcategories, ${totalProducts} products`);
  });
}
console.log('\n✅ Full hierarchy loaded and ready for UI display\n');
