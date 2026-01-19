const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/catalogs_brand/roland_catalog.json', 'utf-8'));
console.log('Roland Catalog Structure:');
console.log('  - Has brand_identity:', !!data.brand_identity);
console.log('  - Has products:', !!data.products, data.products?.length || 0, 'items');
console.log('  - Has hierarchy:', !!data.hierarchy);
if (data.hierarchy) {
  const cats = Object.keys(data.hierarchy);
  console.log('  - Categories:', cats.length);
  cats.slice(0, 3).forEach(cat => {
    const subcats = Object.keys(data.hierarchy[cat]);
    console.log('    -', cat, '→', subcats.length, 'subcategories');
  });
}
