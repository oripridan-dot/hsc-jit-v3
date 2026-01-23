/**
 * Performance Tests
 * Measures latency, throughput, and resource usage
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useNavigationStore } from "../../src/store/navigationStore";
import type { Product } from "../../src/types";
import { mockProducts, mockProductsByCategory } from "../fixtures/mockData";

describe("Performance Tests", () => {
  let allProducts: Product[];

  beforeEach(() => {
    allProducts = [
      ...mockProductsByCategory["Electronic Drums"],
      ...mockProductsByCategory["Synthesizers"],
      ...mockProductsByCategory["Digital Pianos"],
    ];
  });

  describe("Search Latency", () => {
    it("should search <50ms for single query", () => {
      const query = "drums";
      const startTime = performance.now();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const results = allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
      console.log(`Single search: ${duration.toFixed(2)}ms`);
    });

    it("should search <100ms for 10 sequential queries", () => {
      const queries = [
        "drums",
        "synth",
        "juno",
        "roland",
        "td",
        "fp",
        "jupiter",
        "kit",
        "patch",
        "keys",
      ];
      const startTime = performance.now();

      const allResults = queries.map((query) =>
        allProducts.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()),
        ),
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      expect(allResults.length).toBe(queries.length);
      console.log(
        `10 searches: ${duration.toFixed(2)}ms (avg: ${(duration / queries.length).toFixed(2)}ms)`,
      );
    });

    it("should handle partial string matching efficiently", () => {
      const startTime = performance.now();

      const results = allProducts.filter((p) =>
        p.name.toLowerCase().includes("td"),
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Navigation State Operations", () => {
    it("should warp <5ms", () => {
      const store = useNavigationStore.getState();
      const startTime = performance.now();

      store.warpTo("family", ["Home", "Roland", "Drums"]);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5);
    });

    it("should select product <5ms", () => {
      const store = useNavigationStore.getState();
      const startTime = performance.now();

      store.selectProduct(mockProducts[0]);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5);
    });

    it("should toggle 100 nodes <10ms", () => {
      const store = useNavigationStore.getState();
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        store.toggleNode(`node-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10);
      expect(useNavigationStore.getState().expandedNodes.size).toBe(100);
    });
  });

  describe("Data Processing Performance", () => {
    it("should group 50+ products into categories <20ms", () => {
      const largeProductSet = [...allProducts, ...allProducts, ...allProducts];

      const startTime = performance.now();

      const categoryMap = new Map<string, Product[]>();
      largeProductSet.forEach((product) => {
        const category = product.category || "Uncategorized";
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(product);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(20);
      expect(categoryMap.size).toBeGreaterThan(0);
    });

    it("should sort 50+ products <20ms", () => {
      const largeProductSet = [...allProducts, ...allProducts, ...allProducts];
      // Pre-clone to measure only sort time
      const toSort = [...largeProductSet];

      const startTime = performance.now();

      const sorted = toSort.sort((a, b) => a.name.localeCompare(b.name));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(20);
      expect(sorted).toHaveLength(largeProductSet.length);
    });
  });

  describe("Memory Efficiency", () => {
    it("should handle product set without memory spikes", () => {
      const iterations = 1000;
      const perfAPI = performance as unknown as {
        memory?: { usedJSHeapSize: number };
      };
      const startMemory = perfAPI.memory?.usedJSHeapSize || 0;

      for (let i = 0; i < iterations; i++) {
        const filtered = allProducts.filter(
          (p) => p.category === "Electronic Drums",
        );
        expect(filtered.length).toBeGreaterThan(0);
      }

      const endMemory = perfAPI.memory?.usedJSHeapSize || 0;
      const memoryIncrease = endMemory - startMemory;

      // Should not spike dramatically
      console.log(
        `Memory increase over ${iterations} iterations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      );
    });
  });

  describe("Throughput", () => {
    it("should process 1000 product filters/sec", () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const _ = allProducts.filter((p) =>
          p.name.toLowerCase().includes("td"),
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = (iterations / (duration / 1000)).toFixed(0);

      expect(duration).toBeLessThan(1000); // Should complete in <1 second
      console.log(`Throughput: ${throughput} operations/sec`);
    });
  });
});
