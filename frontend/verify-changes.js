import fs from 'fs';

const appContent = fs.readFileSync('./src/App.tsx', 'utf-8');
const workbenchContent = fs.readFileSync('./src/components/Workbench.tsx', 'utf-8');
const navigatorContent = fs.readFileSync('./src/components/Navigator.tsx', 'utf-8');

console.log('\n✅ VERIFICATION CHECKLIST\n');

const checks = {
  '1. Navigator has categories': navigatorContent.includes('expandedCategories'),
  '2. Navigator has thumbnails': navigatorContent.includes('whiteBgImages'),
  '3. Workbench shows selectedProduct': workbenchContent.includes('selectedProduct'),
  '4. Workbench has MediaBar': workbenchContent.includes('<MediaBar'),
  '5. HalileoContextRail removed from App': !appContent.includes('HalileoContextRail'),
  '6. Emerald colors removed': !appContent.includes('emerald-400'),
  '7. Cyan colors for analyst panel': appContent.includes('text-cyan-400'),
  '8. HalileoContextRail import removed': !appContent.includes('import { HalileoContextRail'),
};

Object.entries(checks).forEach(([check, result]) => {
  console.log(`${result ? '✓' : '✗'} ${check}`);
});

const allPassed = Object.values(checks).every(v => v);
console.log(`\n${allPassed ? '✅ ALL CHECKS PASSED' : '⚠️ SOME CHECKS FAILED'}\n`);
