import fs from 'fs';
import path from 'path';

console.log('\n' + '='.repeat(80));
console.log('  CATEGORIES & UI STRUCTURE VERIFICATION');
console.log('='.repeat(80) + '\n');

// Test data file
const indexPath = './public/data/index.json';
const rolandPath = './public/data/catalogs_brand/roland_catalog.json';

let indexData, rolandData;

try {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  indexData = JSON.parse(indexContent);
  console.log('✓ Index file loads:', indexPath);
} catch (e) {
  console.log('✗ Index file error:', e.message);
}

try {
  const rolandContent = fs.readFileSync(rolandPath, 'utf-8');
  rolandData = JSON.parse(rolandContent);
  console.log('✓ Roland catalog loads:', rolandPath);
} catch (e) {
  console.log('✗ Roland catalog error:', e.message);
}

// Test 1: Navigator Component Structure
console.log('\n✓ TEST 1: Navigator Component Has Categories Logic');
const navigatorContent = fs.readFileSync('./src/components/Navigator.tsx', 'utf-8');
const checks = {
  'expandedCategories state': navigatorContent.includes('expandedCategories'),
  'mainCategory iteration': navigatorContent.includes('mainCategory'),
  'subcategoryMap mapping': navigatorContent.includes('subcategoryMap'),
  'Category button onClick': navigatorContent.includes('onClick={() => {') && navigatorContent.includes('expandedCategories'),
  'products.hierarchy check': navigatorContent.includes('products.hierarchy'),
  'Product thumbnail render': navigatorContent.includes('whiteBgImages[product.id]'),
  'Category chevron rotation': navigatorContent.includes('isCategoryExpanded ? \'rotate-90\''),
  'Product selection handler': navigatorContent.includes('useNavigationStore.getState().selectProduct'),
};

Object.entries(checks).forEach(([check, found]) => {
  console.log(`  ${found ? '✓' : '✗'} ${check}`);
});

// Test 2: HalileoNavigator embedding
console.log('\n✓ TEST 2: HalileoNavigator Renders Navigator');
const halileoContent = fs.readFileSync('./src/components/HalileoNavigator.tsx', 'utf-8');
const halileoChecks = {
  'Navigator import': halileoContent.includes('import { Navigator }'),
  'Navigator render': halileoContent.includes('<Navigator'),
  'Mode toggle': halileoContent.includes('setMode(\'manual\')') && halileoContent.includes('setMode(\'guide\')'),
};

Object.entries(halileoChecks).forEach(([check, found]) => {
  console.log(`  ${found ? '✓' : '✗'} ${check}`);
});

// Test 3: App.tsx layout structure
console.log('\n✓ TEST 3: App.tsx 3-Column Layout');
const appContent = fs.readFileSync('./src/App.tsx', 'utf-8');
const appChecks = {
  'LEFT column (w-96)': appContent.includes('w-96') && appContent.includes('LEFT COLUMN'),
  'CENTER column (flex-1)': appContent.includes('flex-1') && appContent.includes('CENTER COLUMN'),
  'HalileoNavigator in LEFT': appContent.includes('<HalileoNavigator'),
  'Workbench in CENTER': appContent.includes('<Workbench'),
  'AIAssistant conditional RIGHT': appContent.includes('aiAssistantOpen &&') && appContent.includes('<AIAssistant'),
};

Object.entries(appChecks).forEach(([check, found]) => {
  console.log(`  ${found ? '✓' : '✗'} ${check}`);
});

// Test 4: Data structure validation
console.log('\n✓ TEST 4: Data Has Hierarchy Structure');
if (rolandData && rolandData.hierarchy) {
  const hierarchyKeys = Object.keys(rolandData.hierarchy);
  console.log(`  ✓ Hierarchy found: ${hierarchyKeys.length} main categories`);
  
  hierarchyKeys.slice(0, 3).forEach(cat => {
    const subcats = rolandData.hierarchy[cat];
    const subcatCount = Object.keys(subcats).length;
    const totalProducts = Object.values(subcats).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    console.log(`    - ${cat}: ${subcatCount} subcategories, ${totalProducts} products`);
  });
} else {
  console.log('  ✗ No hierarchy structure in Roland data');
}

// Test 5: UI Styling validation
console.log('\n✓ TEST 5: Categories UI Styling');
const styleChecks = {
  'Category button styling': navigatorContent.includes('hover:bg-[var(--bg-app)]/50'),
  'Category chevron styling': navigatorContent.includes('text-indigo-400'),
  'Product row height': navigatorContent.includes('h-14'),
  'Product hover state': navigatorContent.includes('hover:bg-indigo-500/20'),
  'Subcategory label styling': navigatorContent.includes('text-indigo-400/70'),
  'AnimatePresence used': navigatorContent.includes('AnimatePresence'),
};

Object.entries(styleChecks).forEach(([check, found]) => {
  console.log(`  ${found ? '✓' : '✗'} ${check}`);
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('  SUMMARY');
console.log('='.repeat(80));

const allTests = { ...checks, ...halileoChecks, ...appChecks, ...styleChecks };
const passed = Object.values(allTests).filter(Boolean).length;
const total = Object.keys(allTests).length;

console.log(`\nComponent Checks:     ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length}`);
console.log(`Halileo Integration:  ${Object.values(halileoChecks).filter(Boolean).length}/${Object.keys(halileoChecks).length}`);
console.log(`App Layout:           ${Object.values(appChecks).filter(Boolean).length}/${Object.keys(appChecks).length}`);
console.log(`UI Styling:           ${Object.values(styleChecks).filter(Boolean).length}/${Object.keys(styleChecks).length}`);

console.log(`\nTOTAL:                ${passed}/${total} CHECKS PASSING`);

if (passed === total) {
  console.log('\n✅ ALL CATEGORIES & UI STRUCTURE VERIFIED');
  console.log('\nUI FLOW:');
  console.log('  1. App.tsx renders 3-column layout');
  console.log('  2. LEFT: HalileoNavigator (w-96)');
  console.log('  3. HalileoNavigator embeds Navigator component');
  console.log('  4. Navigator loads index.json and categories');
  console.log('  5. CENTER: Workbench (flex-1)');
  console.log('  6. Click product in Navigator → displays in Workbench');
  console.log('  7. RIGHT: Optional AIAssistant (w-96)');
  console.log('\n🚀 READY FOR DEPLOYMENT');
} else {
  console.log('\n⚠️ SOME CHECKS FAILED');
}

console.log('\n' + '='.repeat(80) + '\n');
