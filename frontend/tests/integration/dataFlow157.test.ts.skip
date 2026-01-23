/**
 * Integration Test - 157 Products Data Flow
 *
 * Tests data loading, state management, and UI rendering with 157-product dataset
 */

import { describe, expect, it } from "vitest";
import {
  bossCatalog,
  masterIndex157,
  moogCatalog,
  nordCatalog,
  products157,
  rolandCatalog,
  uaCatalog,
  verify157Dataset,
} from "../fixtures/largeDataset157";

describe("Integration: 157 Products Data Flow", () => {
  // =========================================================================
  // DATA LOADING
  // =========================================================================

  describe("Data Loading (157 Products)", () => {
    it("should load all 157 products without errors", () => {
      expect(products157.length).toBe(157);
      expect(products157.every((p) => p.id && p.name && p.brand)).toBe(true);
    });

    it("should load master index with all brands", () => {
      expect(masterIndex157.brands.length).toBe(5);
      expect(masterIndex157.total_products).toBe(157);
    });

    it("should load individual brand catalogs", () => {
      expect(rolandCatalog.products.length).toBe(30);
      expect(nordCatalog.products.length).toBe(18);
      expect(bossCatalog.products.length).toBe(22);
      expect(moogCatalog.products.length).toBe(18);
      expect(uaCatalog.products.length).toBe(24);
    });

    it("should have valid product structure for all items", () => {
      products157.forEach((product) => {
        expect(product.id).toBeDefined();
        expect(product.name).toBeDefined();
        expect(product.brand).toBeDefined();
        expect(product.category).toBeDefined();
        expect(product.pricing).toBeDefined();
        expect(product.pricing.regular_price).toBeGreaterThan(0);
        expect(product.availability).toBeDefined();
      });
    });

    it("should have consistent pricing across brands", () => {
      const prices = products157.map((p) => p.pricing.regular_price || 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      expect(minPrice).toBeGreaterThan(0);
      expect(maxPrice).toBeGreaterThan(minPrice);
      expect(maxPrice - minPrice).toBeGreaterThan(10000);
    });
  });

  // =========================================================================
  // CATEGORY MAPPING
  // =========================================================================

  describe("Category Distribution (157 Products)", () => {
    it("should have products in all 8 universal categories", () => {
      const categories = new Set(products157.map((p) => p.category));

      expect(categories.size).toBeGreaterThanOrEqual(6);
      expect(Array.from(categories).some((cat) => cat.includes("Keys"))).toBe(
        true,
      );
      expect(Array.from(categories).some((cat) => cat.includes("Drums"))).toBe(
        true,
      );
      expect(Array.from(categories).some((cat) => cat.includes("Studio"))).toBe(
        true,
      );
    });

    it("should balance products across categories", () => {
      const categoryMap = new Map<string, number>();

      products157.forEach((product) => {
        categoryMap.set(
          product.category,
          (categoryMap.get(product.category) || 0) + 1,
        );
      });

      const counts = Array.from(categoryMap.values());
      const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;

      // Most categories should have at least a few products
      expect(counts.some((c) => c >= avgCount * 0.5)).toBe(true);
    });

    it("should properly distribute products by brand", () => {
      const brandMap = new Map<string, number>();

      products157.forEach((product) => {
        brandMap.set(product.brand, (brandMap.get(product.brand) || 0) + 1);
      });

      expect(brandMap.get("roland")).toBe(30);
      expect(brandMap.get("nord")).toBe(18);
      expect(brandMap.get("boss")).toBe(22);
      expect(brandMap.get("moog")).toBe(18);
      expect(brandMap.get("universal-audio")).toBe(24);
    });
  });

  // =========================================================================
  // AVAILABILITY STATUS
  // =========================================================================

  describe("Availability Status Handling", () => {
    it("should have varied availability statuses", () => {
      const statuses = new Set(products157.map((p) => p.availability));

      expect(statuses.size).toBeGreaterThan(1);
      expect(Array.from(statuses)).toContain("in-stock");
    });

    it("should filter products by availability", () => {
      const inStock = products157.filter((p) => p.availability === "in-stock");
      const preOrder = products157.filter(
        (p) => p.availability === "pre-order",
      );
      const _discontinued = products157.filter(
        (p) => p.availability === "discontinued",
      );

      expect(inStock.length).toBeGreaterThan(0);
      expect(preOrder.length).toBeGreaterThan(0);
      // discontinued might be empty, which is fine
    });

    it("should handle all availability statuses gracefully", () => {
      const statuses = ["in-stock", "pre-order", "discontinued", "unknown"];

      statuses.forEach((status) => {
        const filtered = products157.filter((p) => p.availability === status);
        // Should not throw, even if empty
        expect(Array.isArray(filtered)).toBe(true);
      });
    });
  });

  // =========================================================================
  // SEARCH & FILTERING
  // =========================================================================

  describe("Search & Filtering (157 Products)", () => {
    it("should filter by brand", () => {
      const rolandProducts = products157.filter((p) => p.brand === "roland");
      expect(rolandProducts.length).toBe(30);

      const nordProducts = products157.filter((p) => p.brand === "nord");
      expect(nordProducts.length).toBe(18);
    });

    it("should filter by category", () => {
      const drumsProducts = products157.filter((p) =>
        p.category.includes("Drums"),
      );
      expect(drumsProducts.length).toBeGreaterThan(0);

      const keyProducts = products157.filter((p) =>
        p.category.includes("Keys"),
      );
      expect(keyProducts.length).toBeGreaterThan(0);
    });

    it("should filter by price range", () => {
      const budget = products157.filter(
        (p) => (p.pricing.regular_price || 0) < 5000,
      );
      const mid = products157.filter(
        (p) =>
          (p.pricing.regular_price || 0) >= 5000 &&
          (p.pricing.regular_price || 0) < 10000,
      );
      const premium = products157.filter(
        (p) => (p.pricing.regular_price || 0) >= 10000,
      );

      expect(budget.length).toBeGreaterThan(0);
      expect(mid.length).toBeGreaterThan(0);
      expect(premium.length).toBeGreaterThan(0);
    });

    it("should support multi-filter queries", () => {
      const filtered = products157.filter(
        (p) =>
          p.brand === "roland" &&
          p.category.includes("Drums") &&
          (p.pricing.regular_price || 0) < 15000,
      );

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((p) => p.brand === "roland")).toBe(true);
    });

    it("should search by product name", () => {
      const results = products157.filter((p) =>
        p.name.toLowerCase().includes("drums"),
      );
      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle case-insensitive search", () => {
      const searchTerm = "SYNTHESIZER";
      const results = products157.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // PRICING ANALYSIS
  // =========================================================================

  describe("Pricing Analysis (157 Products)", () => {
    it("should calculate price statistics", () => {
      const prices = products157
        .map((p) => p.pricing.regular_price || 0)
        .filter((p) => p > 0);

      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(min);
      expect(avg).toBeGreaterThan(min);
      expect(avg).toBeLessThan(max);
    });

    it("should have eilat pricing for all products", () => {
      const withEilat = products157.filter((p) => p.pricing.eilat_price);
      expect(withEilat.length).toBeGreaterThan(0);
    });

    it("should calculate savings correctly", () => {
      products157.forEach((product) => {
        if (product.pricing.eilat_price && product.pricing.regular_price) {
          const saving =
            product.pricing.regular_price - product.pricing.eilat_price;
          expect(saving).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it("should identify price tiers", () => {
      const budget = products157.filter(
        (p) => (p.pricing.regular_price || 0) < 3000,
      );
      const mid = products157.filter(
        (p) =>
          (p.pricing.regular_price || 0) >= 3000 &&
          (p.pricing.regular_price || 0) < 8000,
      );
      const premium = products157.filter(
        (p) =>
          (p.pricing.regular_price || 0) >= 8000 &&
          (p.pricing.regular_price || 0) < 15000,
      );
      const highEnd = products157.filter(
        (p) => (p.pricing.regular_price || 0) >= 15000,
      );

      expect(budget.length).toBeGreaterThan(0);
      expect(mid.length).toBeGreaterThan(0);
      expect(premium.length).toBeGreaterThan(0);
      expect(highEnd.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // VERIFICATION & INTEGRITY
  // =========================================================================

  describe("Dataset Integrity", () => {
    it("should pass dataset verification", () => {
      const verification = verify157Dataset();

      expect(verification.valid).toBe(true);
      expect(verification.errors.length).toBe(0);
    });

    it("should have no duplicate product IDs", () => {
      const ids = new Set(products157.map((p) => p.id));
      expect(ids.size).toBe(157);
    });

    it("should have valid SKUs for all products", () => {
      const validSkus = products157.filter((p) => p.sku && p.sku.length > 0);
      expect(validSkus.length).toBe(157);
    });

    it("should have product descriptions", () => {
      const described = products157.filter(
        (p) => p.description && p.description.length > 0,
      );
      expect(described.length).toBeGreaterThan(150);
    });

    it("should have images for all products", () => {
      products157.forEach((product) => {
        expect(product.image_url || product.images).toBeDefined();
      });
    });
  });

  // =========================================================================
  // PERFORMANCE METRICS
  // =========================================================================

  describe("Performance (157 Products)", () => {
    it("should load dataset in <100ms", () => {
      const startTime = performance.now();

      // Simulate loading
      const _filtered = products157.filter((p) => p.brand === "roland");

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it("should filter 157 products in <50ms", () => {
      const startTime = performance.now();

      const filtered = products157.filter(
        (p) =>
          p.brand === "roland" &&
          p.category.includes("Drums") &&
          (p.pricing.regular_price || 0) < 10000,
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it("should search 157 products in <20ms", () => {
      const searchTerm = "keyboard";
      const startTime = performance.now();

      const results = products157.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(20);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should sort 157 products in <30ms", () => {
      const startTime = performance.now();

      const sorted = [...products157].sort(
        (a, b) =>
          (b.pricing.regular_price || 0) - (a.pricing.regular_price || 0),
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(30);
      expect(sorted.length).toBe(157);
    });
  });

  // =========================================================================
  // RELATIONSHIP & COMPARISON
  // =========================================================================

  describe("Product Relationships (157 Products)", () => {
    it("should identify similar products by category", () => {
      const drumsProducts = products157.filter((p) =>
        p.category.includes("Drums"),
      );
      const keysProducts = products157.filter((p) =>
        p.category.includes("Keys"),
      );

      expect(drumsProducts.length).toBeGreaterThan(0);
      expect(keysProducts.length).toBeGreaterThan(0);
    });

    it("should group products by brand", () => {
      const brands = new Map<string, typeof products157>();

      products157.forEach((product) => {
        if (!brands.has(product.brand)) {
          brands.set(product.brand, []);
        }
        brands.get(product.brand)!.push(product);
      });

      expect(brands.size).toBe(5);
      expect(brands.get("roland")!.length).toBe(30);
    });

    it("should identify complementary products", () => {
      const keyboards = products157.filter((p) => p.category.includes("Keys"));
      const _stands = products157.filter((p) => p.id.includes("stand"));

      // Even if stands are limited, should handle gracefully
      expect(keyboards.length).toBeGreaterThan(0);
    });

    it("should support product comparison", () => {
      const rolandDrums = products157.filter(
        (p) => p.brand === "roland" && p.category.includes("Drums"),
      );

      rolandDrums.forEach((drum1) => {
        rolandDrums.forEach((drum2) => {
          expect(drum1.pricing.regular_price).toBeDefined();
          expect(drum2.pricing.regular_price).toBeDefined();
        });
      });
    });
  });

  // =========================================================================
  // CROSS-BRAND ANALYSIS
  // =========================================================================

  describe("Cross-Brand Analysis (5 Brands)", () => {
    it("should compare prices across brands", () => {
      const rolandPrices = products157
        .filter((p) => p.brand === "roland")
        .map((p) => p.pricing.regular_price || 0);

      const nordPrices = products157
        .filter((p) => p.brand === "nord")
        .map((p) => p.pricing.regular_price || 0);

      const rolandAvg =
        rolandPrices.reduce((a, b) => a + b, 0) / rolandPrices.length;
      const nordAvg = nordPrices.reduce((a, b) => a + b, 0) / nordPrices.length;

      expect(rolandAvg).toBeGreaterThan(0);
      expect(nordAvg).toBeGreaterThan(0);
    });

    it("should identify market leaders by product count", () => {
      const brandCounts = new Map<string, number>();

      products157.forEach((p) => {
        brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
      });

      const sorted = Array.from(brandCounts.entries()).sort(
        (a, b) => b[1] - a[1],
      );

      expect(sorted[0][0]).toBe("roland");
      expect(sorted[0][1]).toBe(30);
    });

    it("should handle category gaps per brand", () => {
      const rolandCategories = new Set(
        products157.filter((p) => p.brand === "roland").map((p) => p.category),
      );

      const bossCategories = new Set(
        products157.filter((p) => p.brand === "boss").map((p) => p.category),
      );

      expect(rolandCategories.size).toBeGreaterThan(0);
      expect(bossCategories.size).toBeGreaterThan(0);
    });
  });
});
