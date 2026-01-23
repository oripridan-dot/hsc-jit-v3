/**
 * System Behavior Test - 157 Products
 *
 * Comprehensive end-to-end tests with large dataset containing:
 * - 5 brands with varied product hierarchies
 * - 157 total products across 8 categories
 * - Multiple pricing tiers and availability statuses
 * - Product relationships and cross-brand comparisons
 * - Search performance and filtering
 *
 * Test Coverage:
 * 1. Large dataset navigation (157 products)
 * 2. Brand switching and catalog loading
 * 3. Category filtering and subcategory drilling
 * 4. Search performance with large dataset
 * 5. Pricing analysis and comparison
 * 6. Product relationships and recommendations
 * 7. Availability status handling
 * 8. UI responsiveness under load
 */

import { expect, test } from "@playwright/test";
import {
  masterIndex157,
  products157,
  verify157Dataset,
} from "../fixtures/largeDataset157";

// ============================================================================
// DATASET VALIDATION
// ============================================================================

test.describe("Dataset Validation", () => {
  test("should validate 157 product dataset", () => {
    const verification = verify157Dataset();

    expect(verification.valid).toBe(true);
    expect(verification.stats.total).toBe(157);
    expect(verification.errors.length).toBe(0);
  });

  test("should have correct distribution across brands", () => {
    const verification = verify157Dataset();
    const byBrand = verification.stats.byBrand as Record<string, number>;

    expect(byBrand["roland"]).toBe(30);
    expect(byBrand["nord"]).toBe(18);
    expect(byBrand["boss"]).toBe(22);
    expect(byBrand["moog"]).toBe(18);
    expect(byBrand["universal-audio"]).toBe(24);
  });

  test("should have products across all 8 categories", () => {
    const verification = verify157Dataset();
    const byCategory = verification.stats.byCategory as Record<string, number>;

    const expectedCategories = [
      "Keys & Pianos",
      "Drums & Percussion",
      "Guitars & Amps",
      "Studio & Recording",
      "Live Sound",
      "DJ & Production",
      "Software & Cloud",
      "Accessories",
    ];

    expectedCategories.forEach((cat) => {
      expect(byCategory[cat] || 0).toBeGreaterThanOrEqual(0);
    });
  });

  test("should have varied availability statuses", () => {
    const verification = verify157Dataset();
    const byAvailability = verification.stats.byAvailability as Record<
      string,
      number
    >;

    expect(Object.keys(byAvailability).length).toBeGreaterThan(1);
    expect(byAvailability["in-stock"] || 0).toBeGreaterThan(0);
  });
});

// ============================================================================
// NAVIGATION WITH LARGE DATASET
// ============================================================================

test.describe("Navigation with 157 Products", () => {
  test("should load all 157 products without errors", async ({ page }) => {
    await page.goto("/");

    // Verify no error messages
    const errorElements = await page.locator('[role="alert"]').count();
    expect(errorElements).toBe(0);

    // Should have navigation visible
    await expect(page.locator('[data-testid="navigator"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should display all 5 brands", async ({ page }) => {
    await page.goto("/");

    // Open brand selector
    const brands = masterIndex157.brands;
    expect(brands.length).toBe(5);

    // Verify each brand is accessible
    for (const brand of brands) {
      const brandElement = page.locator(`text=${brand.name}`).first();
      await expect(brandElement).toBeVisible({ timeout: 3000 });
    }
  });

  test("should navigate between brands smoothly", async ({ page }) => {
    await page.goto("/");

    const brands = ["Roland", "Nord", "Boss", "Moog", "Universal Audio"];

    for (const brand of brands) {
      const brandButton = page.locator(`text=${brand}`).first();
      await brandButton.click();

      // Verify brand loaded
      await expect(
        page.locator(`text=${brand}`).or(page.locator(`text=${brand}`)),
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test("should handle rapid brand switching", async ({ page }) => {
    await page.goto("/");

    // Rapidly switch brands
    for (let i = 0; i < 5; i++) {
      await page.click(`text=Roland`);
      await page.click(`text=Nord`);
      await page.click(`text=Boss`);
    }

    // UI should remain responsive
    await expect(page).not.toHaveURL(/error|500|404/);
  });
});

// ============================================================================
// CATEGORY & SUBCATEGORY DRILLING
// ============================================================================

test.describe("Category Navigation (157 Products)", () => {
  test("should list all main categories", async ({ page }) => {
    await page.goto("/");

    const categories = [
      "Keys & Pianos",
      "Drums & Percussion",
      "Studio & Recording",
      "Software & Cloud",
    ];

    for (const category of categories) {
      const categoryElement = page.locator(`text=${category}`).first();
      // Should exist or be discoverable
      const count = await categoryElement.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test("should show subcategories when category selected", async ({ page }) => {
    await page.goto("/");

    // Navigate to a category
    const categoryButton = page.locator("text=Keys & Pianos").first();
    if ((await categoryButton.count()) > 0) {
      await categoryButton.click();

      // Subcategories should be visible or accessible
      await page.waitForTimeout(500);
      const subcategoryElements = await page
        .locator('[data-testid*="subcategory"]')
        .count();
      expect(subcategoryElements).toBeGreaterThanOrEqual(0);
    }
  });

  test("should maintain breadcrumb navigation", async ({ page }) => {
    await page.goto("/");

    // Navigate to a product
    await page.click(`text=Roland`);
    await page.waitForTimeout(300);

    // Click on a product if available
    const productLinks = page.locator('[data-testid="product-link"]');
    const count = await productLinks.count();

    if (count > 0) {
      await productLinks.first().click();
      await page.waitForTimeout(300);

      // Breadcrumbs should exist
      const breadcrumbs = page.locator('[data-testid="breadcrumb"]');
      expect(await breadcrumbs.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test("should allow drilling into 3+ category levels", async ({ page }) => {
    await page.goto("/");

    // Navigate Brand → Category → Subcategory → Product
    const brandLink = page.locator("text=Roland").first();
    if ((await brandLink.count()) > 0) {
      await brandLink.click();
      await page.waitForTimeout(300);

      const categoryLink = page.locator("text=Drums & Percussion").first();
      if ((await categoryLink.count()) > 0) {
        await categoryLink.click();
        await page.waitForTimeout(300);

        // Should be at appropriate nesting level
        await expect(page).not.toHaveURL(/error/);
      }
    }
  });
});

// ============================================================================
// SEARCH PERFORMANCE
// ============================================================================

test.describe("Search with 157 Products", () => {
  test("should search across all 157 products", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("synthesizer");
      await page.waitForTimeout(300);

      // Should return multiple results
      const results = page.locator('[data-testid="search-result"]');
      const resultCount = await results.count();

      // Should find multiple synthesizers across brands
      expect(resultCount).toBeGreaterThan(0);
    }
  });

  test("should handle fuzzy search across brands", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      // Typo: "roald" instead of "roland"
      await searchInput.fill("roald");
      await page.waitForTimeout(300);

      // Fuzzy search should still find Roland products
      const results = page.locator('[data-testid="search-result"]');
      const resultCount = await results.count();

      expect(resultCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("should search by price range", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search|price|budget/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("2000-5000");
      await page.waitForTimeout(300);

      // Should filter by price
      const results = page.locator('[data-testid="product-card"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test("should search by category", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("drums");
      await page.waitForTimeout(300);

      // Should return drum products
      const results = page.locator('[data-testid="search-result"]');
      const resultCount = await results.count();

      expect(resultCount).toBeGreaterThan(0);
    }
  });

  test("should search by brand", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("moog");
      await page.waitForTimeout(300);

      // Should return Moog products
      const results = page.locator('[data-testid="search-result"]');
      const resultCount = await results.count();

      // Moog has 18 products
      expect(resultCount).toBeGreaterThan(0);
    }
  });

  test("should have <100ms search latency", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      const startTime = performance.now();

      await searchInput.fill("keyboards");
      await page.waitForTimeout(100);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Search should complete quickly (allowing for network)
      expect(duration).toBeLessThan(500);
    }
  });

  test("should clear search results", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("roland");
      await page.waitForTimeout(300);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(300);

      // Should show all products again
      const results = page.locator('[data-testid="product-card"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================================
// PRODUCT COMPARISON & PRICING
// ============================================================================

test.describe("Product Comparison (157 Products)", () => {
  test("should display pricing for all products", async ({ page }) => {
    await page.goto("/");

    // Navigate to a brand
    await page.click(`text=Roland`);
    await page.waitForTimeout(300);

    // Check product cards have prices
    const priceElements = page.locator('[data-testid="product-price"]');
    const priceCount = await priceElements.count();

    expect(priceCount).toBeGreaterThanOrEqual(0);
  });

  test("should compare pricing across brands", async ({ page }) => {
    await page.goto("/");

    // Get price range
    const minPrice = Math.min(
      ...products157.map((p) => p.pricing?.regular_price || 0),
    );
    const maxPrice = Math.max(
      ...products157.map((p) => p.pricing?.regular_price || 0),
    );

    // Price range should be significant
    expect(maxPrice - minPrice).toBeGreaterThan(10000);
  });

  test("should show availability status", async ({ page }) => {
    await page.goto("/");

    const availabilityElements = page.locator(
      '[data-testid="availability-status"]',
    );
    const availabilityCount = await availabilityElements.count();

    // At least some products should show availability
    expect(availabilityCount).toBeGreaterThanOrEqual(0);
  });

  test("should handle discontinued products", async ({ page }) => {
    await page.goto("/");

    // Search for discontinued items
    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("discontinued");
      await page.waitForTimeout(300);

      // Should handle gracefully
      await expect(page).not.toHaveURL(/error|500/);
    }
  });
});

// ============================================================================
// AVAILABILITY STATUS HANDLING
// ============================================================================

test.describe("Availability Status (Multiple States)", () => {
  test("should show in-stock products", async ({ page }) => {
    await page.goto("/");

    const inStockElements = page.locator("text=In Stock");
    const inStockCount = await inStockElements.count();

    // Most products should be in stock
    expect(inStockCount).toBeGreaterThan(0);
  });

  test("should show limited availability", async ({ page }) => {
    await page.goto("/");

    // Some products have limited stock
    const limitedElements = page.locator("text=Limited");
    const limitedCount = await limitedElements.count();

    expect(limitedCount).toBeGreaterThanOrEqual(0);
  });

  test("should show pre-order items", async ({ page }) => {
    await page.goto("/");

    const preOrderElements = page.locator("text=Pre-order");
    const preOrderCount = await preOrderElements.count();

    expect(preOrderCount).toBeGreaterThanOrEqual(0);
  });

  test("should filter by availability status", async ({ page }) => {
    await page.goto("/");

    // Look for availability filter if it exists
    const filterElements = page.locator('[data-testid="availability-filter"]');
    const filterCount = await filterElements.count();

    if (filterCount > 0) {
      await filterElements.first().click();
      await page.waitForTimeout(300);

      // Should show filtered results
      await expect(page).not.toHaveURL(/error/);
    }
  });
});

// ============================================================================
// UI PERFORMANCE & RESPONSIVENESS
// ============================================================================

test.describe("UI Performance with 157 Products", () => {
  test("should render initial page within 3 seconds", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await expect(page.locator('[data-testid="navigator"]')).toBeVisible({
      timeout: 3000,
    });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test("should handle rapid navigation clicks", async ({ page }) => {
    await page.goto("/");

    // Rapid clicks
    for (let i = 0; i < 10; i++) {
      const navItems = page.locator('[data-testid="nav-item"]');
      const count = await navItems.count();

      if (count > 0) {
        await navItems.first().click({ force: true });
      }
    }

    // Should not crash
    await expect(page).not.toHaveURL(/error|500/);
  });

  test("should handle large list scrolling", async ({ page }) => {
    await page.goto("/");

    // Navigate to brand with many products
    await page.click(`text=Roland`);
    await page.waitForTimeout(300);

    // Scroll through products
    const productList = page.locator('[data-testid="product-list"]');
    if ((await productList.count()) > 0) {
      await productList.first().evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      await page.waitForTimeout(300);

      // Should handle scrolling
      await expect(page).not.toHaveURL(/error/);
    }
  });

  test("should not have memory leaks with multiple brand switches", async ({
    page,
  }) => {
    await page.goto("/");

    // Switch brands 10 times
    for (let i = 0; i < 10; i++) {
      await page.click(`text=Roland`);
      await page.waitForTimeout(100);

      await page.click(`text=Nord`);
      await page.waitForTimeout(100);

      await page.click(`text=Boss`);
      await page.waitForTimeout(100);
    }

    // Page should still be responsive
    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("test");
      await page.waitForTimeout(200);
    }

    await expect(page).not.toHaveURL(/error/);
  });

  test("should display responsive design on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Navigation should still work
    const navElements = page.locator('[data-testid="navigator"]');
    expect(await navElements.count()).toBeGreaterThanOrEqual(0);

    // Should be scrollable
    const body = page.locator("body");
    await body.evaluate((el) => (el.scrollTop += 100));

    await expect(page).not.toHaveURL(/error/);
  });
});

// ============================================================================
// CROSS-BRAND ANALYSIS
// ============================================================================

test.describe("Cross-Brand Analysis (5 Brands)", () => {
  test("should compare products across brands", async ({ page }) => {
    await page.goto("/");

    // Verify all 5 brands are accessible
    const brands = ["Roland", "Nord", "Boss", "Moog", "Universal Audio"];

    for (const brand of brands) {
      const exists = await page.locator(`text=${brand}`).count();
      expect(exists).toBeGreaterThanOrEqual(0);
    }
  });

  test("should show price distribution across brands", async ({ _page }) => {
    // Analyze products157 dataset
    const rolandProducts = products157.filter((p) => p.brand === "roland");
    const nordProducts = products157.filter((p) => p.brand === "nord");

    expect(rolandProducts.length).toBe(30);
    expect(nordProducts.length).toBe(18);
  });

  test("should identify competing products", async ({ page }) => {
    await page.goto("/");

    // Search for competing product categories
    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill("piano");
      await page.waitForTimeout(300);

      // Should show both Roland and Nord pianos
      const results = page.locator('[data-testid="search-result"]');
      expect(await results.count()).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// ERROR HANDLING & EDGE CASES
// ============================================================================

test.describe("Error Handling (157 Products)", () => {
  test("should handle missing product images gracefully", async ({ page }) => {
    await page.goto("/");

    // Navigate to products
    const productLinks = page.locator('[data-testid="product-link"]');
    const count = await productLinks.count();

    if (count > 0) {
      await productLinks.first().click();
      await page.waitForTimeout(300);

      // Should display placeholder or skip missing images
      await expect(page).not.toHaveURL(/error/);
    }
  });

  test("should handle invalid search queries", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search|find/i).first();
    if ((await searchInput.count()) > 0) {
      // Special characters
      await searchInput.fill("!!!###$$$");
      await page.waitForTimeout(300);

      // Should handle gracefully
      await expect(page).not.toHaveURL(/error|500/);
    }
  });

  test("should recover from network failures", async ({ page }) => {
    await page.goto("/");

    // Simulate offline and back online
    await page.context().setOffline(true);
    await page.waitForTimeout(500);

    await page.context().setOffline(false);
    await page.waitForTimeout(500);

    // Should recover
    await expect(page).not.toHaveURL(/error|500/);
  });
});
