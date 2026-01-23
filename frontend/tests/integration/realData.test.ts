import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { SchemaValidator } from "../../src/lib/schemas";
import type { MasterIndex } from "../../src/types";

describe("Real Data Integrity", () => {
  const dataDir = path.resolve(process.cwd(), "public/data");
  const indexFile = path.join(dataDir, "index.json");

  it("should have index.json", () => {
    expect(fs.existsSync(indexFile)).toBe(true);
  });

  let indexData: MasterIndex | null = null;

  it("should load index.json and have 10 brands", () => {
    if (!fs.existsSync(indexFile)) return;
    const raw = fs.readFileSync(indexFile, "utf-8");
    indexData = JSON.parse(raw) as MasterIndex;

    // Basic schema check
    expect(indexData).toHaveProperty("brands");
    expect(Array.isArray(indexData.brands)).toBe(true);
    expect(indexData.brands.length).toBe(10);

    const brandNames = indexData.brands.map((b) => b.slug).sort();
    expect(brandNames).toEqual([
      "adam-audio",
      "akai-professional",
      "boss",
      "mackie",
      "moog",
      "nord",
      "roland",
      "teenage-engineering",
      "universal-audio",
      "warm-audio",
    ]);
  });

  it("should verify each brand file has 5 brands", () => {
    if (!indexData) return;

    for (const brand of indexData.brands) {
      const brandFile = path.join(dataDir, brand.data_file);
      expect(fs.existsSync(brandFile)).toBe(true);

      const raw = fs.readFileSync(brandFile, "utf-8");
      const brandData = JSON.parse(raw);

      // Validate against schema (this was the original user error)
      expect(() => SchemaValidator.validateBrandFile(brandData)).not.toThrow();

      // Verify content
      expect(brandData).toHaveProperty("products");
      expect(brandData.products.length).toBe(5);
      expect(brandData.products[0]).toHaveProperty("id");
    }
  });
});
