#!/usr/bin/env python3
"""
Nord Brand - Complete Scenario Simulations
===========================================

Tests the entire Nord pipeline with real-world usage scenarios:
1. Basic product search
2. Multi-product comparison
3. Category browsing
4. Fuzzy typo handling
5. Document fetching for all products
6. Price range queries
7. End-to-end user journey simulation
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.services.sniffer import SnifferService
from app.services.catalog import CatalogService
from app.services.fetcher import ContentFetcher
from thefuzz import fuzz


class NordScenarioRunner:
    """Complete scenario testing for Nord brand"""
    
    def __init__(self):
        self.catalog = CatalogService()
        self.sniffer = SnifferService(self.catalog)
        self.fetcher = ContentFetcher()
        
        self.scenarios_passed = 0
        self.scenarios_failed = 0
        
        # Get all Nord products
        self.nord_products = [p for p in self.catalog.all_products() if p.get("brand") == "nord"]
        
    def print_header(self, title):
        print(f"\n{'='*70}")
        print(f" {title}")
        print(f"{'='*70}")
    
    def print_scenario(self, number, name):
        print(f"\n📋 Scenario {number}: {name}")
        print("-" * 70)
    
    def assert_result(self, condition, message):
        if condition:
            print(f"  ✅ {message}")
            return True
        else:
            print(f"  ❌ {message}")
            return False
    
    # ========== SCENARIO 1: Basic Product Search ==========
    def scenario_1_basic_search(self):
        """User types 'nord stage' and gets Nord Stage keyboards"""
        self.print_scenario(1, "Basic Product Search - 'nord stage'")
        
        query = "nord stage"
        predictions = self.sniffer.predict(query, limit=10)
        
        # Filter for Nord products
        nord_results = [p for p in predictions if p.get("product", {}).get("brand") == "nord"]
        stage_results = [p for p in nord_results if "stage" in p.get("product", {}).get("name", "").lower()]
        
        passed = True
        passed &= self.assert_result(len(nord_results) > 0, f"Found {len(nord_results)} Nord products")
        passed &= self.assert_result(len(stage_results) > 0, f"Found {len(stage_results)} Nord Stage products")
        
        if stage_results:
            top_result = stage_results[0]
            product = top_result.get("product", {})
            print(f"  🎹 Top Result: {product.get('name')} (${product.get('price')})")
            print(f"  📊 Confidence: {top_result.get('confidence', 0):.1%}")
        
        if passed:
            self.scenarios_passed += 1
        else:
            self.scenarios_failed += 1
        
        return passed
    
    # ========== SCENARIO 2: Fuzzy Typo Handling ==========
    def scenario_2_fuzzy_typos(self):
        """User makes typos: 'nrod pino' should still find Nord Piano"""
        self.print_scenario(2, "Fuzzy Typo Handling - 'nrod pino'")
        
        query = "nrod pino"  # Intentional typos
        predictions = self.sniffer.predict(query, limit=10)
        
        nord_results = [p for p in predictions if p.get("product", {}).get("brand") == "nord"]
        piano_results = [p for p in nord_results if "piano" in p.get("product", {}).get("name", "").lower()]
        
        passed = True
        passed &= self.assert_result(len(nord_results) > 0, f"Fuzzy search found {len(nord_results)} Nord products despite typos")
        passed &= self.assert_result(len(piano_results) > 0, f"Found Nord Piano products with typos")
        
        if piano_results:
            product = piano_results[0].get("product", {})
            print(f"  🎹 Fuzzy Match: {product.get('name')} (${product.get('price')})")
        
        if passed:
            self.scenarios_passed += 1
        else:
            self.scenarios_failed += 1
        
        return passed
    
    # ========== SCENARIO 3: Category Browsing ==========
    def scenario_3_category_browse(self):
        """User browses by category: 'synthesizer'"""
        self.print_scenario(3, "Category Browsing - 'synthesizer'")
        
        query = "synthesizer"
        predictions = self.sniffer.predict(query, limit=10)
        
        nord_synths = [p for p in predictions 
                      if p.get("product", {}).get("brand") == "nord" 
                      and "synth" in p.get("product", {}).get("category", "").lower()]
        
        passed = True
        passed &= self.assert_result(len(nord_synths) > 0, f"Found {len(nord_synths)} Nord synthesizers")
        
        print(f"  📂 Nord Synthesizers:")
        for pred in nord_synths[:3]:
            product = pred.get("product", {})
            print(f"     - {product.get('name')} (${product.get('price')}) - {product.get('category')}")
        
        if passed:
            self.scenarios_passed += 1
        else:
            self.scenarios_failed += 1
        
        return passed
    
    # ========== SCENARIO 4: Price Range Query ==========
    def scenario_4_price_range(self):
        """User searches for affordable Nord products under $2000"""
        self.print_scenario(4, "Price Range Query - Under $2000")
        
        affordable_products = [p for p in self.nord_products if p.get("price", 999999) < 2000]
        
        passed = True
        passed &= self.assert_result(len(affordable_products) > 0, 
                                     f"Found {len(affordable_products)} Nord products under $2000")
        
        print(f"  💰 Affordable Nord Products:")
        for product in sorted(affordable_products, key=lambda p: p.get("price", 0)):
            print(f"     - {product.get('name')}: ${product.get('price')}")
        
        if passed:
            self.scenarios_passed += 1
        else:
            self.scenarios_failed += 1
        
        return passed
    
    # ========== SCENARIO 5: Document Fetching ==========
    async def scenario_5_document_fetching(self):
        """Fetch documentation for all Nord products"""
        self.print_scenario(5, "Document Fetching - All Products")
        
        successful_fetches = 0
        total_products = len(self.nord_products)
        
        for product in self.nord_products:
            doc_url = product.get("documentation", {}).get("url")
            
            if not doc_url:
                print(f"  ⚠️  {product.get('name')}: No documentation URL")
                continue
            
            try:
                content = await self.fetcher.fetch_content(doc_url)
                if content and len(content) > 100:
                    print(f"  ✅ {product.get('name')}: Fetched {len(content)} chars")
                    successful_fetches += 1
                else:
                    print(f"  ⚠️  {product.get('name')}: Empty or minimal content")
            except Exception as e:
                print(f"  ❌ {product.get('name')}: {str(e)[:50]}")
        
        passed = self.assert_result(successful_fetches >= total_products * 0.8,
                                    f"Successfully fetched {successful_fetches}/{total_products} documents (80% threshold)")
        
        if passed:
            self.scenarios_passed += 1
        else:
            self.scenarios_failed += 1
        
        return passed
    
    # ========== SCENARIO 6: Product Comparison ==========
    def scenario_6_product_comparison(self):
        """User compares Nord Stage 4 vs Nord Piano 5"""
        self.print_scenario(6, "Product Comparison - Stage 4 vs Piano 5")
        
        stage_4 = next((p for p in self.nord_products if "stage 4" in p.get("name", "").lower() and p.get("id") == "nord-stage-4"), None)
        piano_5 = next((p for p in self.nord_products if "piano 5" in p.get("name", "").lower() and p.get("id") == "nord-piano-5"), None)
        
        passed = True
        passed &= self.assert_result(stage_4 is not None, "Found Nord Stage 4")
        passed &= self.assert_result(piano_5 is not None, "Found Nord Piano 5")
        
        if stage_4 and piano_5:
            print(f"\n  ⚖️  Comparison:")
            print(f"     Nord Stage 4:")
            print(f"       - Price: ${stage_4.get('price')}")
            print(f"       - Category: {stage_4.get('category')}")
            print(f"       - Keys: {stage_4.get('specifications', {}).get('Keys')}")
            print(f"       - Polyphony: {stage_4.get('specifications', {}).get('Piano Polyphony')}")
            
            print(f"\n     Nord Piano 5:")
            print(f"       - Price: ${piano_5.get('price')}")
            print(f"       - Category: {piano_5.get('category')}")
            print(f"       - Keys: {piano_5.get('specifications', {}).get('Keys')}")
            print(f"       - Polyphony: {piano_5.get('specifications', {}).get('Polyphony')}")
            
            price_diff = abs(stage_4.get('price', 0) - piano_5.get('price', 0))
            print(f"\n     💵 Price Difference: ${price_diff}")
        
        if passed:
            self.scenarios_passed += 1
        else:
            self.scenarios_failed += 1
        
        return passed
    
    # ========== SCENARIO 7: End-to-End User Journey ==========
    async def scenario_7_user_journey(self):
        """Simulate complete user journey from search to purchase"""
        self.print_scenario(7, "End-to-End User Journey Simulation")
        
        print(f"\n  👤 User Journey: Professional keyboardist looking for stage piano")
        
        # Step 1: Initial search
        print(f"\n  1️⃣ Step 1: Search 'nord stage piano'")
        query = "nord stage piano"
        predictions = self.sniffer.predict(query, limit=5)
        nord_results = [p for p in predictions if p.get("product", {}).get("brand") == "nord"]
        print(f"     Found {len(nord_results)} Nord products")
        
        # Step 2: Select product
        if nord_results:
            selected = nord_results[0].get("product", {})
            print(f"\n  2️⃣ Step 2: User selects '{selected.get('name')}'")
            print(f"     Price: ${selected.get('price')}")
            print(f"     Category: {selected.get('category')}")
        
        # Step 3: View specifications
        if nord_results:
            specs = selected.get("specifications", {})
            print(f"\n  3️⃣ Step 3: View Specifications")
            for key, value in list(specs.items())[:4]:
                print(f"     - {key}: {value}")
        
        # Step 4: Fetch documentation
        if nord_results:
            doc_url = selected.get("documentation", {}).get("url")
            if doc_url:
                print(f"\n  4️⃣ Step 4: View Product Manual")
                print(f"     URL: {doc_url}")
                try:
                    content = await self.fetcher.fetch_content(doc_url)
                    if content:
                        print(f"     ✅ Manual loaded ({len(content)} chars)")
                except:
                    print(f"     ⚠️  Manual fetch failed")
        
        # Step 5: Compare alternatives
        print(f"\n  5️⃣ Step 5: Compare with alternatives")
        piano_products = [p for p in self.nord_products if "piano" in p.get("category", "").lower() or "stage" in p.get("category", "").lower()]
        for p in piano_products[:3]:
            print(f"     - {p.get('name')}: ${p.get('price')}")
        
        # Step 6: Decision
        print(f"\n  6️⃣ Step 6: Purchase Decision")
        print(f"     ✅ User decides to purchase: {selected.get('name')}")
        print(f"     💰 Total: ${selected.get('price')}")
        
        passed = self.assert_result(len(nord_results) > 0 and selected is not None,
                                    "Complete user journey executed successfully")
        
        if passed:
            self.scenarios_passed += 1
        else:
            self.scenarios_failed += 1
        
        return passed
    
    # ========== RUN ALL SCENARIOS ==========
    async def run_all_scenarios(self):
        """Execute all scenarios and generate report"""
        self.print_header("NORD BRAND - SCENARIO SIMULATIONS")
        
        print(f"\n📊 Test Environment:")
        print(f"   Total Nord Products: {len(self.nord_products)}")
        print(f"   Total Catalog Size: {len(self.catalog.all_products())} products")
        print(f"   Nord Brand Coverage: {len(self.nord_products)/len(self.catalog.all_products())*100:.1f}%")
        
        # Run all scenarios
        self.scenario_1_basic_search()
        self.scenario_2_fuzzy_typos()
        self.scenario_3_category_browse()
        self.scenario_4_price_range()
        await self.scenario_5_document_fetching()
        self.scenario_6_product_comparison()
        await self.scenario_7_user_journey()
        
        # Final Report
        self.print_header("SIMULATION RESULTS")
        
        total_scenarios = self.scenarios_passed + self.scenarios_failed
        success_rate = (self.scenarios_passed / total_scenarios * 100) if total_scenarios > 0 else 0
        
        print(f"\n📈 Summary:")
        print(f"   Total Scenarios: {total_scenarios}")
        print(f"   ✅ Passed: {self.scenarios_passed}")
        print(f"   ❌ Failed: {self.scenarios_failed}")
        print(f"   📊 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 100:
            print(f"\n🎉 PERFECT SCORE! All scenarios passed!")
        elif success_rate >= 80:
            print(f"\n✨ EXCELLENT! Nord pipeline is production-ready!")
        elif success_rate >= 60:
            print(f"\n👍 GOOD! Minor improvements needed.")
        else:
            print(f"\n⚠️  NEEDS WORK! Several scenarios failed.")
        
        print(f"\n{'='*70}\n")
        
        return success_rate >= 80


async def main():
    print("\n" + "="*70)
    print(" NORD KEYBOARDS - COMPLETE PIPELINE SIMULATION")
    print(" Testing 7 real-world scenarios")
    print("="*70)
    
    runner = NordScenarioRunner()
    success = await runner.run_all_scenarios()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
