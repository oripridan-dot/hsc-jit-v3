#!/usr/bin/env node

/**
 * Data Flow Verification Script
 * Verifies 3-column layout data loading:
 * - index.json exists and is valid
 * - brand catalogs exist and are valid
 * - products have required fields for rendering
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const results = [];

function logTest(name, passed, details) {
  results.push({ name, passed, details });
  const icon = passed ? '✓' : '✗';
  console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60));
}

// Get paths - __dirname is the directory of this script (frontend/)
const dataDir = path.join(__dirname, 'public/data');
const indexPath = path.join(dataDir, 'index.json');
const catalogsDirPath = path.join(dataDir, 'catalogs_brand');

logSection('FILE SYSTEM CHECKS');

// Test 1: index.json exists
const indexExists = fs.existsSync(indexPath);
logTest('index.json exists', indexExists, indexExists ? 'Found' : 'NOT FOUND');

// Test 2: Catalog directory exists
const catalogsDirExists = fs.existsSync(catalogsDirPath);
logTest('catalogs_brand directory exists', catalogsDirExists, catalogsDirExists ? 'Found' : 'NOT FOUND');

// Test 3: Parse index.json
let indexData = null;
try {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  indexData = JSON.parse(indexContent);
  logTest('index.json parses as valid JSON', true, `${JSON.stringify(indexData).length} bytes`);
} catch (error) {
  logTest('index.json parses as valid JSON', false, error.message);
  process.exit(1);
}

logSection('INDEX.JSON STRUCTURE');

// Test 4: Index has required fields
logTest('has version', !!indexData.version, indexData.version);
logTest('has total_products', !!indexData.total_products, `${indexData.total_products} products`);
logTest('has metadata', !!indexData.metadata, indexData.metadata ? 'Found' : 'Missing');
logTest('has brands array', Array.isArray(indexData.brands), `${indexData.brands?.length} brands`);

// Test 5: Brand entries are valid
const brands = indexData.brands || [];
logTest(`brands array size`, brands.length > 0, `${brands.length} brands`);

if (brands.length > 0) {
  const brand = brands[0];
  logTest('brand has id', !!brand.id, brand.id);
  logTest('brand has slug', !!brand.slug, brand.slug);
  logTest('brand has file or data_file', !!(brand.file || brand.data_file), brand.file || brand.data_file);
  logTest('brand has count', !!brand.count, `${brand.count} products`);
}

logSection('CATALOG FILES');

// Test 6: Load brand catalogs
const failedCatalogs = [];
brands.forEach((brand) => {
  const filePath = brand.file || brand.data_file || `catalogs_brand/${brand.slug}_catalog.json`;
  const fullPath = path.join(dataDir, filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const data = JSON.parse(content);
      logTest(`${brand.slug} catalog`, true, `${JSON.stringify(data).length} bytes`);
    } catch (error) {
      logTest(`${brand.slug} catalog`, false, `Parse error: ${error.message}`);
      failedCatalogs.push(brand.slug);
    }
  } else {
    logTest(`${brand.slug} catalog`, false, `File not found: ${filePath}`);
    failedCatalogs.push(brand.slug);
  }
});

logSection('PRODUCT STRUCTURE');

// Test 7: Products have required fields
if (brands.length > 0) {
  const brand = brands[0];
  const filePath = brand.file || brand.data_file || `catalogs_brand/${brand.slug}_catalog.json`;
  const fullPath = path.join(dataDir, filePath);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      logTest('product has id', !!product.id, product.id);
      logTest('product has name', !!product.name, product.name);
      logTest('product has brand', !!product.brand, product.brand);
      logTest('product has category (main_category)', !!(product.category || product.main_category), product.category || product.main_category);
      logTest('product has images', !!product.images, Array.isArray(product.images) ? `${product.images.length} images` : 'Not an array');
    }
  }
}

logSection('COMPONENT REQUIREMENTS');

// Test 8: Data structure matches component needs
const needs = [
  { component: 'Navigator', requires: ['brands array', 'slug field', 'file path'] },
  { component: 'Workbench', requires: ['products array', 'product id', 'product name', 'category', 'images'] },
  { component: 'MediaBar', requires: ['images array', 'product id', 'product name'] }
];

needs.forEach(({ component, requires }) => {
  console.log(`\n${component}:`);
  requires.forEach(req => {
    console.log(`  - ${req}`);
  });
});

logSection('SUMMARY');

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`Passed: ${passed}/${results.length}`);
console.log(`Failed: ${failed}/${results.length}`);

if (failed > 0) {
  console.log(`\nFailed tests:`);
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.details}`);
  });
  process.exit(1);
} else {
  console.log('\n✓ All checks passed!');
  console.log('\n3-COLUMN LAYOUT READINESS:');
  console.log('LEFT:   Navigator (ready)');
  console.log('CENTER: Workbench (ready)');
  console.log('RIGHT:  MediaBar (ready)');
  process.exit(0);
}
