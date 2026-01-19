import fs from 'fs';
import path from 'path';

console.log('\n' + '='.repeat(80));
console.log('  UI COMPONENT VERIFICATION - Navigator, Workbench, MediaBar');
console.log('='.repeat(80) + '\n');

const srcDir = './src/components';

// Test 1: Navigator has categories and thumbnails
console.log('✓ TEST 1: Navigator Component Structure');
const navigatorContent = fs.readFileSync(path.join(srcDir, 'Navigator.tsx'), 'utf-8');
const hasCategories = navigatorContent.includes('expandedCategories') && 
                     navigatorContent.includes('mainCategory') &&
                     navigatorContent.includes('subcategoryMap');
const hasThumbnails = navigatorContent.includes('whiteBgImages') && 
                     navigatorContent.includes('product.images');

console.log(`  - Hierarchical categories: ${hasCategories ? '✓ FOUND' : '✗ MISSING'}`);
console.log(`  - Product thumbnails: ${hasThumbnails ? '✓ FOUND' : '✗ MISSING'}`);

// Test 2: Workbench displays products and MediaBar
console.log('\n✓ TEST 2: Workbench Component Structure');
const workbenchContent = fs.readFileSync(path.join(srcDir, 'Workbench.tsx'), 'utf-8');
const hasProductDisplay = workbenchContent.includes('selectedProduct') && 
                         workbenchContent.includes('product.name');
const hasMediaBar = workbenchContent.includes('MediaBar') && 
                   workbenchContent.includes('import { MediaBar }');
const hasMediaViewer = workbenchContent.includes('MediaViewer');

console.log(`  - Product display: ${hasProductDisplay ? '✓ FOUND' : '✗ MISSING'}`);
console.log(`  - MediaBar component: ${hasMediaBar ? '✓ FOUND' : '✗ MISSING'}`);
console.log(`  - Media viewer: ${hasMediaViewer ? '✓ FOUND' : '✗ MISSING'}`);

// Test 3: Verify no Halileo AI colors in right sidebar
console.log('\n✓ TEST 3: AI Colors Verification');
const appContent = fs.readFileSync('./src/App.tsx', 'utf-8');
const hasEmeraldColor = appContent.includes('emerald-400') || appContent.includes('emerald-500');
const hasCyanColor = appContent.includes('cyan-400');

console.log(`  - Removed emerald (Halileo) colors: ${!hasEmeraldColor ? '✓ CLEAN' : '✗ FOUND'}`);
console.log(`  - Using cyan (product) colors: ${hasCyanColor ? '✓ FOUND' : '✗ MISSING'}`);

// Test 4: Verify HalileoContextRail is removed
console.log('\n✓ TEST 4: HalileoContextRail Removal');
const hasContextRailImport = appContent.includes('HalileoContextRail');
const hasContextRailUsage = appContent.includes('<HalileoContextRail');

console.log(`  - Import removed: ${!hasContextRailImport ? '✓ CLEAN' : '✗ STILL PRESENT'}`);
console.log(`  - Component usage removed: ${!hasContextRailUsage ? '✓ CLEAN' : '✗ STILL PRESENT'}`);

// Test 5: MediaBar implementation
console.log('\n✓ TEST 5: MediaBar Integration');
const mediaBarContent = fs.readFileSync(path.join(srcDir, 'MediaBar.tsx'), 'utf-8');
const hasMediaTabs = mediaBarContent.includes('Images') || mediaBarContent.includes('tabs');
const hasClickToExpand = mediaBarContent.includes('modal') || mediaBarContent.includes('viewer');

console.log(`  - Tabbed media display: ${hasMediaTabs ? '✓ FOUND' : '✗ MISSING'}`);
console.log(`  - Click-to-expand modal: ${hasClickToExpand ? '✓ FOUND' : '✗ MISSING'}`);

// Summary
console.log('\n' + '='.repeat(80));
console.log('  SUMMARY');
console.log('='.repeat(80));

const allTests = {
  'Navigator categories': hasCategories,
  'Navigator thumbnails': hasThumbnails,
  'Workbench product display': hasProductDisplay,
  'MediaBar component': hasMediaBar,
  'Media viewer': hasMediaViewer,
  'Halileo colors removed': !hasEmeraldColor,
  'Cyan colors applied': hasCyanColor,
  'HalileoContextRail removed': !hasContextRailImport && !hasContextRailUsage,
  'MediaBar tabs': hasMediaTabs,
  'MediaBar modal': hasClickToExpand
};

const passed = Object.values(allTests).filter(Boolean).length;
const total = Object.keys(allTests).length;

Object.entries(allTests).forEach(([test, result]) => {
  console.log(`  ${result ? '✓' : '✗'} ${test}`);
});

console.log('\n' + '='.repeat(80));
console.log(`  RESULT: ${passed}/${total} TESTS PASSING`);
if (passed === total) {
  console.log('  STATUS: ✅ ALL SYSTEMS READY');
} else {
  console.log(`  STATUS: ⚠️ ${total - passed} ISSUES FOUND`);
}
console.log('='.repeat(80) + '\n');

process.exit(passed === total ? 0 : 1);
